import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import {
  EmailLoginToken,
  EmailVerificationToken,
  PasswordResetToken,
  User,
  UserStatus,
} from '../database/entities';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { hashPassword, verifyPassword } from './auth-password';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { AuthMailerService } from './auth-mailer.service';
import { createHash, randomBytes } from 'crypto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SendLoginLinkDto } from './dto/send-login-link.dto';
import { LoginWithLinkDto } from './dto/login-with-link.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { TelegramService } from '../telegram/telegram.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(EmailVerificationToken)
    private readonly verificationTokensRepository: Repository<EmailVerificationToken>,
    @InjectRepository(PasswordResetToken)
    private readonly passwordResetTokensRepository: Repository<PasswordResetToken>,
    @InjectRepository(EmailLoginToken)
    private readonly emailLoginTokensRepository: Repository<EmailLoginToken>,
    private readonly authMailerService: AuthMailerService,
    private readonly telegramService: TelegramService,
  ) {}

  async signup(dto: SignupDto) {
    const email = dto.email.trim().toLowerCase();

    const existingByEmail = await this.usersRepository.findOne({
      where: { email },
    });
    if (existingByEmail) {
      throw new BadRequestException('این ایمیل قبلا ثبت شده است.');
    }

    if (dto.phone) {
      const existingByPhone = await this.usersRepository.findOne({
        where: { phone: dto.phone },
      });
      if (existingByPhone) {
        throw new BadRequestException('این شماره موبایل قبلا ثبت شده است.');
      }
    }

    const existingUsersCount = await this.usersRepository.count();
    const user = await this.usersRepository.save(
      this.usersRepository.create({
        email,
        phone: dto.phone,
        isEmailVerified: true,
        isAdmin: existingUsersCount === 0,
        nickname: dto.nickname?.trim() || email.split('@')[0],
        passwordHash: hashPassword(dto.password),
      }),
    );

    return {
      user: this.toSafeUser(user),
      token: this.createToken(user.id),
      requiresEmailVerification: false,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersRepository.findOne({
      where: { email: dto.email.trim().toLowerCase() },
    });

    if (
      !user ||
      !user.passwordHash ||
      !verifyPassword(dto.password, user.passwordHash)
    ) {
      throw new UnauthorizedException('اطلاعات ورود نامعتبر است.');
    }
    if (user.isBanned) {
      throw new UnauthorizedException('حساب کاربری شما مسدود شده است.');
    }
    if (user.isAdmin) {
      this.telegramService
        .sendMessage(
          [
            '🔐 ورود ادمین به Kidad',
            '',
            `👤 نام: ${user.nickname}`,
            `📧 ایمیل: ${user.email}`,
            `📅 زمان ورود: ${new Date().toLocaleString('fa-IR')}`,
          ].join('\n'),
        )
        .catch((error) => {
          this.logger.error(
            'Failed to send admin login notification',
            error instanceof Error ? error.stack : String(error),
          );
        });
    }
    return {
      user: this.toSafeUser(user),
      token: this.createToken(user.id),
      requiresEmailVerification: false,
    };
  }

  async setPassword(token: string, dto: SetPasswordDto) {
    const userId = this.parseToken(token);
    if (!userId) {
      throw new UnauthorizedException('توکن نامعتبر است.');
    }

    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('کاربر پیدا نشد.');
    }
    if (user.isBanned) {
      throw new UnauthorizedException('حساب کاربری شما مسدود شده است.');
    }

    await this.usersRepository.update(
      { id: user.id },
      {
        passwordHash: hashPassword(dto.password),
        status: UserStatus.ACTIVE,
      },
    );

    const updatedUser = await this.usersRepository.findOne({
      where: { id: user.id },
    });
    return {
      user: updatedUser ? this.toSafeUser(updatedUser) : this.toSafeUser(user),
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.usersRepository.findOne({
      where: { email },
    });
  
    // Don't reveal whether the email exists.
    if (!user) {
      return { sent: true };
    }
  
    await this.issuePasswordResetToken(user);
  
    return { sent: true };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenEntry = await this.passwordResetTokensRepository.findOne({
      where: {
        userId: dto.userId,
        tokenHash: this.hashToken(dto.token),
      },
    });

    if (!tokenEntry) {
      throw new BadRequestException('لینک بازیابی معتبر نیست.');
    }
    if (tokenEntry.usedAt) {
      throw new BadRequestException('این لینک قبلا استفاده شده است.');
    }
    if (tokenEntry.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('مهلت لینک بازیابی به پایان رسیده است.');
    }

    const user = await this.usersRepository.findOne({ where: { id: dto.userId } });
    if (!user) {
      throw new NotFoundException('کاربر پیدا نشد.');
    }
    if (user.isBanned) {
      throw new UnauthorizedException('حساب کاربری شما مسدود شده است.');
    }

    const usedAt = new Date();
    await Promise.all([
      this.usersRepository.update({ id: user.id }, { passwordHash: hashPassword(dto.password) }),
      this.passwordResetTokensRepository.update(
        { userId: user.id, usedAt: IsNull() },
        { usedAt },
      ),
    ]);

    return {
      reset: true,
    };
  }

  async sendLoginLink(dto: SendLoginLinkDto) {
    const user = await this.usersRepository.findOne({
      where: { email: dto.email.trim().toLowerCase() },
    });

    if (!user) return { sent: true };

    try {
      await this.issueEmailLoginToken(user, dto.next);
    } catch (error) {
      this.logger.error(
        `Failed to send email login link to ${user.email}: ${(error as Error).message}`,
        (error as Error).stack,
      );
    }

    return { sent: true };
  }

  async loginWithLink(dto: LoginWithLinkDto) {
    const tokenEntry = await this.emailLoginTokensRepository.findOne({
      where: {
        userId: dto.userId,
        tokenHash: this.hashToken(dto.token),
      },
    });

    if (!tokenEntry) {
      throw new BadRequestException('لینک ورود معتبر نیست.');
    }
    if (tokenEntry.usedAt) {
      throw new BadRequestException('این لینک قبلا استفاده شده است.');
    }
    if (tokenEntry.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('مهلت لینک ورود به پایان رسیده است.');
    }

    const user = await this.usersRepository.findOne({
      where: { id: dto.userId },
    });
    if (!user) {
      throw new NotFoundException('کاربر پیدا نشد.');
    }

    const usedAt = new Date();
    await Promise.all([
      this.emailLoginTokensRepository.update(
        { userId: user.id, usedAt: IsNull() },
        { usedAt },
      ),
      user.email
        ? this.usersRepository.update({ id: user.id }, { isEmailVerified: true })
        : Promise.resolve(),
    ]);

    const freshUser = await this.usersRepository.findOne({
      where: { id: user.id },
    });

    return {
      user: freshUser ? this.toSafeUser(freshUser) : this.toSafeUser(user),
      token: this.createToken(user.id),
      requiresEmailVerification: false,
    };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const tokenHash = this.hashToken(dto.token);
    const tokenEntry = await this.verificationTokensRepository.findOne({
      where: {
        userId: dto.userId,
        tokenHash,
      },
    });

    if (!tokenEntry) {
      throw new BadRequestException('لینک تایید معتبر نیست.');
    }
    if (tokenEntry.usedAt) {
      throw new BadRequestException('این لینک قبلا استفاده شده است.');
    }
    if (tokenEntry.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('مهلت لینک تایید به پایان رسیده است.');
    }

    const user = await this.usersRepository.findOne({
      where: { id: dto.userId },
    });
    if (!user) {
      throw new NotFoundException('کاربر پیدا نشد.');
    }

    const usedAt = new Date();
    await Promise.all([
      this.usersRepository.update({ id: user.id }, { isEmailVerified: true }),
      this.verificationTokensRepository.update(
        { userId: user.id, usedAt: IsNull() },
        { usedAt },
      ),
    ]);

    const verifiedUser = await this.usersRepository.findOne({
      where: { id: user.id },
    });

    return {
      user: verifiedUser ? this.toSafeUser(verifiedUser) : this.toSafeUser(user),
      token: this.createToken(user.id),
      verified: true,
    };
  }

  async resendVerification(dto: ResendVerificationDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.usersRepository.findOne({
      where: { email },
    });

    if (!user) {
      return { sent: true };
    }

    if (user.isEmailVerified) {
      return { sent: true };
    }

    try {
      await this.issueVerificationToken(user);
    } catch (error) {
      this.logger.error(
        `Failed to send verification email to ${user.email}: ${(error as Error).message}`,
        (error as Error).stack,
      );
    }
    return { sent: true };
  }

  async me(token: string) {
    const userId = this.parseToken(token);
    if (!userId) {
      throw new UnauthorizedException('توکن نامعتبر است.');
    }

    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('کاربر پیدا نشد.');
    }
    if (user.isBanned) {
      throw new UnauthorizedException('حساب کاربری شما مسدود شده است.');
    }

    return this.toSafeUser(user);
  }

  private createToken(userId: string) {
    return `dev-${userId}`;
  }

  private parseToken(token: string): string | null {
    return token.startsWith('dev-') ? token.slice(4) : null;
  }

  private hashToken(rawToken: string) {
    return createHash('sha256').update(rawToken).digest('hex');
  }

  private getBaseWebUrl() {
    return process.env.APP_WEB_URL ?? 'http://localhost:3000';
  }

  private async issueVerificationToken(user: User) {
    if (!user.email) {
      throw new BadRequestException('حساب کاربر ایمیل ندارد.');
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const ttlMinutes = Number(process.env.EMAIL_VERIFY_TTL_MINUTES ?? 30);
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    await this.verificationTokensRepository.update(
      { userId: user.id, usedAt: IsNull() },
      { usedAt: new Date() },
    );

    await this.verificationTokensRepository.save(
      this.verificationTokensRepository.create({
        userId: user.id,
        tokenHash,
        expiresAt,
      }),
    );

    const baseUrl = this.getBaseWebUrl();
    const verifyUrl = `${baseUrl}/verify-email?userId=${encodeURIComponent(user.id)}&token=${encodeURIComponent(rawToken)}`;

    await this.authMailerService.sendVerificationEmail({
      to: user.email,
      nickname: user.nickname,
      verifyUrl,
    });
  }

  private async issuePasswordResetToken(user: User) {
    if (!user.email) {
      throw new BadRequestException('حساب کاربر ایمیل ندارد.');
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const ttlMinutes = Number(process.env.PASSWORD_RESET_TTL_MINUTES ?? 30);
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    await this.passwordResetTokensRepository.update(
      { userId: user.id, usedAt: IsNull() },
      { usedAt: new Date() },
    );

    await this.passwordResetTokensRepository.save(
      this.passwordResetTokensRepository.create({
        userId: user.id,
        tokenHash,
        expiresAt,
      }),
    );

    const baseUrl = this.getBaseWebUrl();
    const resetUrl = `${baseUrl}/reset-password?userId=${encodeURIComponent(user.id)}&token=${encodeURIComponent(rawToken)}`;

    await this.authMailerService.sendPasswordResetEmail({
      to: user.email,
      nickname: user.nickname,
      resetUrl,
    });
  }

  private async issueEmailLoginToken(user: User, next?: string) {
    if (!user.email) {
      throw new BadRequestException('حساب کاربر ایمیل ندارد.');
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const ttlMinutes = Number(process.env.EMAIL_LOGIN_TTL_MINUTES ?? 20);
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    await this.emailLoginTokensRepository.update(
      { userId: user.id, usedAt: IsNull() },
      { usedAt: new Date() },
    );

    await this.emailLoginTokensRepository.save(
      this.emailLoginTokensRepository.create({
        userId: user.id,
        tokenHash,
        expiresAt,
      }),
    );

    const baseUrl = this.getBaseWebUrl();
    const nextParam = next
      ? `&next=${encodeURIComponent(next)}`
      : '';
    const loginUrl = `${baseUrl}/email-login?userId=${encodeURIComponent(user.id)}&token=${encodeURIComponent(rawToken)}${nextParam}`;

    await this.authMailerService.sendMagicLoginEmail({
      to: user.email,
      nickname: user.nickname,
      loginUrl,
    });
  }

  private toSafeUser(user: User) {
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return {
      ...safeUser,
      status: user.status,
      hasPassword: Boolean(user.passwordHash),
    };
  }
}

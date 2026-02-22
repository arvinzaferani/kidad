import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { EmailVerificationToken, User } from '../database/entities';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { hashPassword, verifyPassword } from './auth-password';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { AuthMailerService } from './auth-mailer.service';
import { createHash, randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(EmailVerificationToken)
    private readonly verificationTokensRepository: Repository<EmailVerificationToken>,
    private readonly authMailerService: AuthMailerService,
  ) {}

  async signup(dto: SignupDto) {
    if (!dto.email && !dto.phone) {
      throw new BadRequestException('Either email or phone is required');
    }

    if (dto.email) {
      const existingByEmail = await this.usersRepository.findOne({
        where: { email: dto.email.toLowerCase() },
      });
      if (existingByEmail) {
        throw new BadRequestException('Email is already registered');
      }
    }

    if (dto.phone) {
      const existingByPhone = await this.usersRepository.findOne({
        where: { phone: dto.phone },
      });
      if (existingByPhone) {
        throw new BadRequestException('Phone is already registered');
      }
    }

    const user = await this.usersRepository.save(
      this.usersRepository.create({
        email: dto.email?.toLowerCase(),
        phone: dto.phone,
        isEmailVerified: dto.email ? false : true,
        nickname:
          dto.nickname?.trim() ||
          (dto.phone ? `کاربر ${dto.phone.slice(-4)}` : dto.email!.split('@')[0]),
        passwordHash: hashPassword(dto.password),
      }),
    );

    if (user.email) {
      await this.issueVerificationToken(user);
      return {
        user: this.toSafeUser(user),
        requiresEmailVerification: true,
      };
    }

    return {
      user: this.toSafeUser(user),
      token: this.createToken(user.id),
      requiresEmailVerification: false,
    };
  }

  async login(dto: LoginDto) {
    const identifier = dto.identifier.trim();
    const isEmail = identifier.includes('@');

    const user = await this.usersRepository.findOne({
      where: isEmail
        ? { email: identifier.toLowerCase() }
        : { phone: identifier },
    });

    if (!user || !verifyPassword(dto.password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.email && !user.isEmailVerified) {
      throw new UnauthorizedException(
        'Email is not verified. Please verify your email first.',
      );
    }

    return {
      user: this.toSafeUser(user),
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
      throw new BadRequestException('Verification token is invalid');
    }
    if (tokenEntry.usedAt) {
      throw new BadRequestException('Verification token is already used');
    }
    if (tokenEntry.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Verification token has expired');
    }

    const user = await this.usersRepository.findOne({
      where: { id: dto.userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
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

    // Avoid user enumeration with a generic response.
    if (!user) {
      return { sent: true };
    }

    if (user.isEmailVerified) {
      return { sent: true };
    }

    await this.issueVerificationToken(user);
    return { sent: true };
  }

  async me(token: string) {
    const userId = this.parseToken(token);
    if (!userId) {
      throw new UnauthorizedException('Invalid token');
    }

    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
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

  private async issueVerificationToken(user: User) {
    if (!user.email) {
      throw new BadRequestException('User does not have an email');
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

    const baseUrl = process.env.APP_WEB_URL ?? 'http://localhost:3000';
    const verifyUrl = `${baseUrl}/verify-email?userId=${encodeURIComponent(user.id)}&token=${encodeURIComponent(rawToken)}`;

    await this.authMailerService.sendVerificationEmail({
      to: user.email,
      nickname: user.nickname,
      verifyUrl,
    });
  }

  private toSafeUser(user: User) {
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }
}

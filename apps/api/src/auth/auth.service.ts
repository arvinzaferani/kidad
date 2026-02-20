import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { hashPassword, verifyPassword } from './auth-password';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
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
        nickname:
          dto.nickname?.trim() ||
          (dto.phone ? `کاربر ${dto.phone.slice(-4)}` : dto.email!.split('@')[0]),
        passwordHash: hashPassword(dto.password),
      }),
    );

    return {
      user: this.toSafeUser(user),
      token: this.createToken(user.id),
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

    return {
      user: this.toSafeUser(user),
      token: this.createToken(user.id),
    };
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

  private toSafeUser(user: User) {
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }
}

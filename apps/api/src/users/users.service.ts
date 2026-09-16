import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findOne(id: string) {
    const user = await this.usersRepository.findOne({ where: { id } });
    return user ? this.toSafeUser(user) : null;
  }

  async update(id: string, data: UpdateUserDto) {
    const existing = await this.usersRepository.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundException('User not found');
    }

    const nextNickname =
      data.nickname !== undefined ? data.nickname.trim() : existing.nickname;
    const nextEmail =
      data.email !== undefined
        ? data.email.trim().toLowerCase() || undefined
        : existing.email;
    const nextPhone =
      data.phone !== undefined ? data.phone.trim() || undefined : existing.phone;
    const nextAvatar =
      data.avatarUrl !== undefined ? data.avatarUrl.trim() || undefined : existing.avatarUrl;
    const emailChanged = nextEmail !== existing.email;

    const nextCardNumber =
      data.cardNumber !== undefined
        ? data.cardNumber.trim() || null
        : existing.cardNumber ?? null;
    const nextShaba =
      data.shaba !== undefined
        ? data.shaba.trim().toUpperCase() || null
        : existing.shaba ?? null;

    if (!nextEmail && !nextPhone) {
      throw new BadRequestException('At least email or phone is required');
    }

    if (nextEmail && nextEmail !== existing.email) {
      const emailOwner = await this.usersRepository.findOne({
        where: { email: nextEmail },
        select: { id: true },
      });
      if (emailOwner && emailOwner.id !== id) {
        throw new BadRequestException('Email is already registered');
      }
    }

    if (nextPhone && nextPhone !== existing.phone) {
      const phoneOwner = await this.usersRepository.findOne({
        where: { phone: nextPhone },
        select: { id: true },
      });
      if (phoneOwner && phoneOwner.id !== id) {
        throw new BadRequestException('Phone is already registered');
      }
    }

    const user = await this.usersRepository.save({
      id,
      nickname: nextNickname,
      email: nextEmail,
      phone: nextPhone,
      avatarUrl: nextAvatar,
      cardNumber: nextCardNumber,
      shaba: nextShaba,
      isEmailVerified: emailChanged && nextEmail ? true : existing.isEmailVerified,
    });

    return this.toSafeUserOwn(user);
  }

  private toSafeUser(user: User) {
    const {
      passwordHash: _passwordHash,
      cardNumber: _cardNumber,
      shaba: _shaba,
      ...safeUser
    } = user;
    return {
      ...safeUser,
      status: user.status,
      hasPassword: Boolean(user.passwordHash),
    };
  }

  private toSafeUserOwn(user: User) {
    return {
      ...this.toSafeUser(user),
      cardNumber: user.cardNumber,
      shaba: user.shaba,
    };
  }
}

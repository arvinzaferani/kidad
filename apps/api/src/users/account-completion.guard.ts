import { ForbiddenException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User, UserStatus } from '../database/entities';

export async function requireCompletedAccount(
  usersRepository: Repository<User>,
  userId: string,
): Promise<void> {
  const user = await usersRepository.findOne({
    where: { id: userId },
    select: { id: true, status: true },
  });
  if (!user) {
    throw new ForbiddenException('کاربر پیدا نشد.');
  }
  if (user.status !== UserStatus.ACTIVE) {
    throw new ForbiddenException(
      'برای استفاده از این بخش، ابتدا باید حساب کاربری را کامل کنی.',
    );
  }
}
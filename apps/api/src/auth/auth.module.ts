import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import {
  EmailLoginToken,
  EmailVerificationToken,
  PasswordResetToken,
  User,
} from '../database/entities';
import { AuthMailerService } from './auth-mailer.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      EmailVerificationToken,
      PasswordResetToken,
      EmailLoginToken,
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthMailerService],
})
export class AuthModule {}

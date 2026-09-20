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
import { EMAIL_CONFIG, loadEmailConfig } from '../config/email.config';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      EmailVerificationToken,
      PasswordResetToken,
      EmailLoginToken,
    ]),
    TelegramModule
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthMailerService,
    { provide: EMAIL_CONFIG, useFactory: loadEmailConfig },
  ],
  exports: [AuthMailerService],
})
export class AuthModule {}

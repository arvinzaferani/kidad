import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailVerificationToken, User } from '../database/entities';
import { AuthMailerService } from './auth-mailer.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, EmailVerificationToken])],
  controllers: [AuthController],
  providers: [AuthService, AuthMailerService],
})
export class AuthModule {}

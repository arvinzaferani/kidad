import { Body, Controller, Get, Headers, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SendLoginLinkDto } from './dto/send-login-link.dto';
import { LoginWithLinkDto } from './dto/login-with-link.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('send-login-link')
  sendLoginLink(@Body() dto: SendLoginLinkDto) {
    return this.authService.sendLoginLink(dto);
  }

  @Post('login-with-link')
  loginWithLink(@Body() dto: LoginWithLinkDto) {
    return this.authService.loginWithLink(dto);
  }

  @Post('verify-email')
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Post('resend-verification')
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto);
  }

  @Get('me')
  me(@Headers('authorization') authorization?: string) {
    const token = authorization?.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }
    return this.authService.me(token);
  }
}

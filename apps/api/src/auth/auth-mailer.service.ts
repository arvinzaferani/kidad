import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AuthMailerService {
  private readonly logger = new Logger(AuthMailerService.name);

  async sendVerificationEmail(params: {
    to: string;
    nickname: string;
    verifyUrl: string;
  }) {
    const provider = (process.env.EMAIL_PROVIDER ?? 'console').toLowerCase();

    if (provider === 'resend') {
      await this.sendWithResend(params);
      return;
    }

    this.logger.log(
      `[EMAIL_VERIFY] to=${params.to} url=${params.verifyUrl}`,
    );
  }

  private async sendWithResend(params: {
    to: string;
    nickname: string;
    verifyUrl: string;
  }) {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.MAIL_FROM;

    if (!apiKey || !from) {
      this.logger.warn(
        'EMAIL_PROVIDER=resend but RESEND_API_KEY or MAIL_FROM is missing; falling back to console logging',
      );
      this.logger.log(
        `[EMAIL_VERIFY] to=${params.to} url=${params.verifyUrl}`,
      );
      return;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [params.to],
        subject: 'Verify your email',
        html: `
          <div style="font-family: sans-serif; line-height: 1.6">
            <p>Hello ${params.nickname},</p>
            <p>Please verify your email by clicking the button below.</p>
            <p><a href="${params.verifyUrl}" style="display:inline-block;padding:10px 14px;background:#1f8d61;color:#fff;text-decoration:none;border-radius:6px">Verify Email</a></p>
            <p>If the button does not work, open this link:</p>
            <p>${params.verifyUrl}</p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const payload = await response.text();
      this.logger.error(`Resend failed (${response.status}): ${payload}`);
      throw new Error('Failed to send verification email');
    }
  }
}

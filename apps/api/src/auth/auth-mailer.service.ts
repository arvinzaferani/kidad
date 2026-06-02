import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'net';

@Injectable()
export class AuthMailerService {
  private readonly logger = new Logger(AuthMailerService.name);

  async sendVerificationEmail(params: {
    to: string;
    nickname: string;
    verifyUrl: string;
  }) {
    await this.sendEmail({
      to: params.to,
      subject: 'تایید ایمیل حساب',
      html: `
        <div style="font-family: sans-serif; line-height: 1.7">
          <p>${params.nickname} عزیز،</p>
          <p>برای تکمیل ثبت‌نام، ایمیل خود را تایید کنید.</p>
          <p><a href="${params.verifyUrl}" style="display:inline-block;padding:10px 14px;background:#1f8d61;color:#fff;text-decoration:none;border-radius:6px">تایید ایمیل</a></p>
          <p>اگر دکمه کار نکرد، این لینک را باز کنید:</p>
          <p>${params.verifyUrl}</p>
          <p>اگر ایمیل را در Inbox پیدا نکردید، پوشه Spam را هم بررسی کنید.</p>
        </div>
      `,
    });
  }

  async sendPasswordResetEmail(params: {
    to: string;
    nickname: string;
    resetUrl: string;
  }) {
    await this.sendEmail({
      to: params.to,
      subject: 'بازیابی رمز عبور',
      html: `
        <div style="font-family: sans-serif; line-height: 1.7">
          <p>${params.nickname} عزیز،</p>
          <p>برای تغییر رمز عبور روی دکمه زیر کلیک کنید.</p>
          <p><a href="${params.resetUrl}" style="display:inline-block;padding:10px 14px;background:#1f8d61;color:#fff;text-decoration:none;border-radius:6px">تغییر رمز عبور</a></p>
          <p>اگر دکمه کار نکرد، این لینک را باز کنید:</p>
          <p>${params.resetUrl}</p>
          <p>اگر ایمیل را در Inbox پیدا نکردید، پوشه Spam را هم بررسی کنید.</p>
        </div>
      `,
    });
  }

  async sendMagicLoginEmail(params: {
    to: string;
    nickname: string;
    loginUrl: string;
  }) {
    await this.sendEmail({
      to: params.to,
      subject: 'ورود با لینک ایمیل',
      html: `
        <div style="font-family: sans-serif; line-height: 1.7">
          <p>${params.nickname} عزیز،</p>
          <p>برای ورود به حساب، روی لینک زیر کلیک کنید.</p>
          <p><a href="${params.loginUrl}" style="display:inline-block;padding:10px 14px;background:#1f8d61;color:#fff;text-decoration:none;border-radius:6px">ورود به حساب</a></p>
          <p>اگر دکمه کار نکرد، این لینک را باز کنید:</p>
          <p>${params.loginUrl}</p>
          <p>اگر ایمیل را در Inbox پیدا نکردید، پوشه Spam را هم بررسی کنید.</p>
        </div>
      `,
    });
  }

  async sendInboxNotificationEmail(params: {
    to: string;
    nickname: string;
    message: string;
  }) {
    const appUrl = process.env.APP_WEB_URL ;
    const inboxUrl = `${appUrl}/inbox`;
    await this.sendEmail({
      to: params.to,
      subject: 'اعلان جدید در کی‌داد',
      html: `
        <div style="font-family: sans-serif; line-height: 1.7">
          <p>${params.nickname} عزیز،</p>
          <p>یک اعلان جدید برای شما ثبت شد:</p>
          <p style="padding:10px 12px;border:1px solid #ddd;border-radius:8px">${params.message}</p>
          <p><a href="${inboxUrl}" style="display:inline-block;padding:10px 14px;background:#1f8d61;color:#fff;text-decoration:none;border-radius:6px">مشاهده اینباکس</a></p>
          <p>اگر دکمه کار نکرد، این لینک را باز کنید:</p>
          <p>${inboxUrl}</p>
          <p>اگر ایمیل را در Inbox پیدا نکردید، پوشه Spam را هم بررسی کنید.</p>
        </div>
      `,
    });
  }

  private async sendEmail(params: {
    to: string;
    subject: string;
    html: string;
  }) {
    const provider = (process.env.EMAIL_PROVIDER ?? 'console').toLowerCase();

    if (provider === 'resend') {
      await this.sendWithResend(params);
      return;
    }
    if (provider === 'smtp') {
      await this.sendWithSmtp(params);
      return;
    }

    this.logger.log(
      `[EMAIL] to=${params.to} subject=${params.subject} html=${params.html.replace(/\s+/g, ' ').trim()}`,
    );
  }

  private async sendWithResend(params: {
    to: string;
    subject: string;
    html: string;
  }) {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.MAIL_FROM;

    if (!apiKey || !from) {
      this.logger.warn(
        'EMAIL_PROVIDER=resend but RESEND_API_KEY or MAIL_FROM is missing; falling back to console logging',
      );
      this.logger.log(`[EMAIL] to=${params.to} subject=${params.subject}`);
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
        subject: params.subject,
        html: params.html,
      }),
    });

    if (!response.ok) {
      const payload = await response.text();
      this.logger.error(`Resend failed (${response.status}): ${payload}`);
      throw new Error('Failed to send email');
    }
  }

  private async sendWithSmtp(params: {
    to: string;
    subject: string;
    html: string;
  }) {
    const host = process.env.SMTP_HOST ?? 'host.docker.internal';
    const port = Number(process.env.SMTP_PORT ?? 25);
    const from = process.env.MAIL_FROM ?? 'no-reply@kidad.ir';
    const helo = process.env.SMTP_HELO_NAME ?? 'kidad.ir';

    const lines = [
      `From: ${from}`,
      `To: ${params.to}`,
      `Subject: ${params.subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=UTF-8',
      '',
      params.html,
      '',
    ];

    const data = lines.join('\r\n').replace(/\r?\n\.\r?\n/g, '\r\n..\r\n');

    await this.sendRawSmtp({
      host,
      port,
      helo,
      from,
      to: params.to,
      data,
    });
  }

  private async sendRawSmtp(params: {
    host: string;
    port: number;
    helo: string;
    from: string;
    to: string;
    data: string;
  }) {
    const socket = new Socket();
    socket.setEncoding('utf8');
    socket.setTimeout(15000);

    await new Promise<void>((resolve, reject) => {
      const fail = (error: Error) => {
        if (!socket.destroyed) socket.destroy();
        reject(error);
      };
      socket.on('error', fail);
      socket.on('timeout', () => fail(new Error('SMTP socket timeout')));

      socket.connect(params.port, params.host, async () => {
        try {
          await this.expectCode(socket, 220);
          await this.command(socket, `HELO ${params.helo}`, 250);
          await this.command(socket, `MAIL FROM:<${params.from}>`, 250);
          await this.command(socket, `RCPT TO:<${params.to}>`, 250, 251);
          await this.command(socket, 'DATA', 354);
          await this.command(socket, `${params.data}\r\n.`, 250);
          await this.command(socket, 'QUIT', 221);
          socket.end();
          resolve();
        } catch (error) {
          fail(error as Error);
        }
      });
    });
  }

  private async command(
    socket: Socket,
    value: string,
    ...codes: number[]
  ) {
    socket.write(`${value}\r\n`);
    await this.expectCode(socket, ...codes);
  }

  private async expectCode(socket: Socket, ...codes: number[]) {
    const response = await new Promise<string>((resolve, reject) => {
      const onData = (chunk: string) => {
        const text = chunk.toString();
        const lines = text.split('\n').filter(Boolean);
        const last = lines[lines.length - 1]?.trim();
        if (!last) return;
        const hasCode = /^\d{3}[ -]/.test(last);
        if (!hasCode) return;
        if (last[3] === '-') return;
        socket.off('data', onData);
        resolve(text);
      };
      const onError = (error: Error) => {
        socket.off('data', onData);
        reject(error);
      };
      socket.once('error', onError);
      socket.on('data', onData);
    });

    const matched = response
      .split('\n')
      .map((line) => line.trim())
      .reverse()
      .find((line) => /^\d{3}[ -]/.test(line));

    const code = matched ? Number(matched.slice(0, 3)) : NaN;
    if (!codes.includes(code)) {
      throw new Error(`SMTP error ${code}: ${response.trim()}`);
    }
  }
}

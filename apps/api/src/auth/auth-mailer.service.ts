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

  private async sendWithSmtp(params: {
    to: string;
    nickname: string;
    verifyUrl: string;
  }) {
    const host = process.env.SMTP_HOST ?? 'host.docker.internal';
    const port = Number(process.env.SMTP_PORT ?? 25);
    const from = process.env.MAIL_FROM ?? 'no-reply@kidad.ir';
    const helo = process.env.SMTP_HELO_NAME ?? 'kidad.ir';

    const lines = [
      `From: ${from}`,
      `To: ${params.to}`,
      'Subject: Verify your email',
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=UTF-8',
      '',
      `<div style="font-family: sans-serif; line-height: 1.6">`,
      `<p>Hello ${params.nickname},</p>`,
      `<p>Please verify your email by clicking the button below.</p>`,
      `<p><a href="${params.verifyUrl}" style="display:inline-block;padding:10px 14px;background:#1f8d61;color:#fff;text-decoration:none;border-radius:6px">Verify Email</a></p>`,
      '<p>If the button does not work, open this link:</p>',
      `<p>${params.verifyUrl}</p>`,
      '</div>',
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

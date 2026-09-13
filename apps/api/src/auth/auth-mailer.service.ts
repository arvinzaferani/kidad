import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { EmailConfig, loadEmailConfig, validateEmailConfig } from '../config/email.config';

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  /** Plain-text fallback; derived from html when omitted. */
  text?: string;
  /** Optional per-message sender override. */
  from?: string;
}

interface SendMailPayload {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
}

interface SentMailInfo {
  messageId?: string;
  envelope?: unknown;
  message?: unknown;
}

interface EmailTransport {
  sendMail(options: SendMailPayload): Promise<SentMailInfo>;
}

function toPlainText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n\n')
    .trim();
}

function mapEmailError(error: unknown): Error {
  const cause = error instanceof Error ? error : new Error(String(error));
  const candidate = error as {
    code?: string;
    responseCode?: number | string;
    response?: string;
    message?: string;
  };

  const code = candidate?.code ?? '';
  const response = String(candidate?.response ?? '');
  const responseCode = String(candidate?.responseCode ?? '');
  const detail = `${code} ${responseCode} ${response}`;

  let message = 'Failed to send email';
  if (/getaddrinfo|ENOTFOUND|ECONNREFUSED|ECONNRESET|ESOCKET|EHOSTUNREACH|EPIPE/i.test(detail)) {
    message = 'SMTP server unavailable';
  } else if (/ETIMEDOUT|TIMEOUT|greeting/i.test(detail)) {
    message = 'SMTP connection timeout';
  } else if (/^5\d\d/.test(responseCode) || /recipient|rejected|relay/i.test(detail)) {
    message = 'SMTP rejected recipient';
  } else if (/^4\d\d/.test(responseCode) || /temporary/i.test(detail)) {
    message = 'SMTP server rejected the request temporarily';
  } else if (/530|535|authentication|auth/i.test(detail)) {
    message = 'SMTP authentication failed';
  }

  const wrapped = new Error(message);
  (wrapped as { cause?: unknown }).cause = cause;
  return wrapped;
}

/**
 * Central email service. All transactional email (verification, password
 * reset, magic login, inbox notifications) flows through {@link send}.
 *
 * SMTP: one transport per process, plain SMTP on port 25 with the configured
 * HELO name. Opportunistic STARTTLS and DKIM signing are handled by the
 * host-level Postfix; the application never signs email itself.
 */
@Injectable()
export class AuthMailerService {
  private readonly logger = new Logger(AuthMailerService.name);
  private smtpTransport?: EmailTransport;

  constructor(
    private readonly config: EmailConfig = loadEmailConfig(),
    transportOverride?: EmailTransport,
  ) {
    validateEmailConfig(this.config);
    if (transportOverride) {
      this.smtpTransport = transportOverride;
    }
  }

  /** Test-only hook: bypass the network transport. */
  setTransport(transport: EmailTransport): void {
    this.smtpTransport = transport;
    this.logger.log('SMTP transport overridden (test mode)');
  }

  async sendVerificationEmail(params: { to: string; nickname: string; verifyUrl: string }) {
    return this.send({
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
      text: `برای تکمیل ثبت‌نام، ایمیل خود را تایید کنید:\n${params.verifyUrl}\n\nاگر ایمیل را در Inbox پیدا نکردید، پوشه Spam را نیز بررسی کنید.`,
    });
  }

  async sendPasswordResetEmail(params: { to: string; nickname: string; resetUrl: string }) {
    return this.send({
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
      text: `برای تغییر رمز عبور این لینک را باز کنید:\n${params.resetUrl}\n\nاگر ایمیل را در Inbox پیدا نکردید، پوشه Spam را نیز بررسی کنید.`,
    });
  }

  async sendMagicLoginEmail(params: { to: string; nickname: string; loginUrl: string }) {
    return this.send({
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
      text: `برای ورود به حساب این لینک را باز کنید:\n${params.loginUrl}\n\nاگر ایمیل را در Inbox پیدا نکردید، پوشه Spam را نیز بررسی کنید.`,
    });
  }

  async sendInboxNotificationEmail(params: {
    to: string;
    nickname: string;
    message: string;
  }) {
    const appUrl = this.config.appWebUrl;
    const inboxUrl = `${appUrl}/inbox`;
    return this.send({
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
      text: `${params.message}\n\nبرای مشاهده اینباکس:\n${inboxUrl}`,
    });
  }

  /**
   * Single central sending path. Every transactional email goes through here;
   * callers never create their own transports.
   */
  async send(params: SendEmailParams): Promise<SentMailInfo | undefined> {
    const payload: SendMailPayload = {
      from: params.from ?? this.config.from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text ?? toPlainText(params.html),
    };

    const transport = this.getTransport();
    try {
      const info = await transport.sendMail(payload);
      this.logger.log(
        `Email sent to=${params.to} subject=${params.subject} messageId=${info?.messageId ?? '(none)'}`,
      );
      return info;
    } catch (error) {
      const mapped = mapEmailError(error);
      this.logger.error(`Email to=${params.to} subject=${params.subject} failed: ${mapped.message}`, (mapped as { cause?: Error }).cause?.stack);
      throw mapped;
    }
  }

  private getTransport(): EmailTransport {
    if (this.smtpTransport) return this.smtpTransport;

    if (this.config.provider === 'smtp') {
      this.logger.log(
        `Initializing SMTP transport ${this.config.smtp.host}:${this.config.smtp.port} (HELO ${this.config.smtp.name})`,
      );
      this.smtpTransport = nodemailer.createTransport({
        host: this.config.smtp.host,
        port: this.config.smtp.port,
        secure: false,
        name: this.config.smtp.name,
        connectionTimeout: this.config.smtp.connectionTimeout,
        greetingTimeout: this.config.smtp.greetingTimeout,
        socketTimeout: this.config.smtp.socketTimeout,
      }) as unknown as EmailTransport;
      return this.smtpTransport;
    }

    if (this.config.provider === 'resend') {
      return this.createResendTransport();
    }

    return this.createConsoleTransport();
  }

  private createConsoleTransport(): EmailTransport {
    return {
      sendMail: async (payload) => {
        this.logger.log(
          `[EMAIL] to=${payload.to} subject=${payload.subject} html=${payload.html.replace(/\s+/g, ' ').trim()}`,
        );
        return {};
      },
    };
  }

  private createResendTransport(): EmailTransport {
    return {
      sendMail: async (payload) => {
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
          this.logger.warn('EMAIL_PROVIDER=resend but RESEND_API_KEY is missing; email NOT sent.');
          return {};
        }

        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: payload.from,
            to: [payload.to],
            subject: payload.subject,
            html: payload.html,
            text: payload.text,
          }),
        });

        if (!response.ok) {
          const resendPayload = await response.text();
          this.logger.error(`Resend failed (${response.status}): ${resendPayload}`);
          throw new Error(`Resend failed (${response.status})`);
        }
        return {};
      },
    };
  }
}
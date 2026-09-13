import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as nodemailer from 'nodemailer';
import {
  EmailConfig,
  loadEmailConfig,
  validateEmailConfig,
} from '../config/email.config';
import { AuthMailerService } from './auth-mailer.service';

const SMTP_ENV = {
  EMAIL_PROVIDER: 'smtp',
  SMTP_HOST: 'host.docker.internal',
  SMTP_PORT: '25',
  SMTP_HELO_NAME: 'mail.kidad.ir',
  MAIL_FROM: 'no-reply@kidad.ir',
  APP_WEB_URL: 'https://kidad.ir',
};

function makeConfig(env: NodeJS.ProcessEnv = SMTP_ENV): EmailConfig {
  return loadEmailConfig(env);
}

function jsonTransport(): nodemailer.Transporter {
  return nodemailer.createTransport({
    jsonTransport: true,
    name: 'mail.kidad.ir',
  }) as nodemailer.Transporter;
}

interface ParsedMessage {
  from?: { address?: string; name?: string };
  to?: Array<{ address?: string; name?: string }>;
  subject?: string;
  text?: string;
  html?: string;
}

async function parsedMessage(info: { message?: unknown }): Promise<ParsedMessage> {
  return JSON.parse(info.message as string) as ParsedMessage;
}

function failingTransport(
  error: Error,
): { sendMail: () => Promise<never> } {
  return {
    sendMail: async () => {
      throw error;
    },
  };
}

test('configuration is loaded from environment variables', () => {
  const config = makeConfig();

  assert.equal(config.provider, 'smtp');
  assert.equal(config.smtp.host, 'host.docker.internal');
  assert.equal(config.smtp.port, 25);
  assert.equal(config.smtp.secure, false);
  assert.equal(config.smtp.name, 'mail.kidad.ir');
  assert.equal(config.fromAddress, 'no-reply@kidad.ir');
  assert.equal(config.from, '"Kidad" <no-reply@kidad.ir>');
  assert.equal(config.appWebUrl, 'https://kidad.ir');
});

test('sender defaults to no-reply@kidad.ir when MAIL_FROM is unset', () => {
  const config = makeConfig({
    ...SMTP_ENV,
    MAIL_FROM: '',
  });

  assert.equal(config.fromAddress, 'no-reply@kidad.ir');
  assert.equal(config.from, '"Kidad" <no-reply@kidad.ir>');
});

test('MAIL_FROM may include an explicit display name', () => {
  const config = makeConfig({
    ...SMTP_ENV,
    MAIL_FROM: '"Kidad Support" <support@kidad.ir>',
  });

  assert.equal(config.fromAddress, 'support@kidad.ir');
  assert.equal(config.from, '"Kidad Support" <support@kidad.ir>');
});

test('SMTP transport options use host.docker.internal / 25 / secure false / name', () => {
  const config = makeConfig();

  assert.deepEqual(config.smtp, {
    host: 'host.docker.internal',
    port: 25,
    secure: false,
    name: 'mail.kidad.ir',
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000,
  });
});

test('validation fails fast when required SMTP config is missing', () => {
  assert.throws(
    () => validateEmailConfig(makeConfig({ ...SMTP_ENV, SMTP_HOST: '' })),
    /SMTP_HOST/,
  );
  assert.throws(
    () => validateEmailConfig(makeConfig({ ...SMTP_ENV, SMTP_PORT: '0' })),
    /SMTP_PORT/,
  );
  assert.throws(
    () => validateEmailConfig(makeConfig({ ...SMTP_ENV, APP_WEB_URL: '' })),
    /APP_WEB_URL/,
  );
});

test('validation does NOT fail when SMTP auth credentials are missing', () => {
  assert.doesNotThrow(() => validateEmailConfig(makeConfig()));
});

test('validation is skipped for non-SMTP providers', () => {
  assert.doesNotThrow(() =>
    validateEmailConfig(
      makeConfig({ ...SMTP_ENV, EMAIL_PROVIDER: 'console' }),
    ),
  );
});

test('verification email flows through the central service with correct sender and URL', async () => {
  const service = new AuthMailerService(makeConfig(), jsonTransport());

  const verifyUrl = 'https://kidad.ir/verify-email?userId=abc&token=tok';
  const info = await service.sendVerificationEmail({
    to: 'user@example.com',
    nickname: 'علی',
    verifyUrl,
  });

  const message = await parsedMessage(info as { message?: unknown });
  assert.equal(message.from?.address, 'no-reply@kidad.ir');
  assert.equal(message.from?.name, 'Kidad');
  assert.equal(message.to?.[0]?.address, 'user@example.com');
  assert.equal(message.subject, 'تایید ایمیل حساب');
  assert.match(message.html ?? '', new RegExp(verifyUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(message.text ?? '', /verify-email\?userId=abc&token=tok/);
});

test('plain-text fallback is present in the sent message', async () => {
  const service = new AuthMailerService(makeConfig(), jsonTransport());

  const info = await service.sendPasswordResetEmail({
    to: 'user@example.com',
    nickname: 'علی',
    resetUrl: 'https://kidad.ir/reset-password?userId=abc&token=tok',
  });

  const message = await parsedMessage(info as { message?: unknown });
  assert.match(message.html ?? '', /reset-password\?userId=abc&token=tok/);
  assert.match(message.text ?? '', /reset-password\?userId=abc&token=tok/);
});

test('SMTP connectivity failures are surfaced as meaningful errors', async () => {
  const service = new AuthMailerService(
    makeConfig(),
    failingTransport(
      Object.assign(new Error('connect ECONNREFUSED 109.122.254.156:25'), {
        code: 'ECONNREFUSED',
      }),
    ),
  );

  await assert.rejects(
    service.send({ to: 'user@example.com', subject: 'x', html: '<p>x</p>' }),
    (error: unknown) => {
      assert.equal((error as Error).message, 'SMTP server unavailable');
      assert.ok((error as { cause?: Error }).cause);
      return true;
    },
  );
});

test('rejected recipients are reported distinctly', async () => {
  const service = new AuthMailerService(
    makeConfig(),
    failingTransport(
      Object.assign(new Error('recipient address rejected'), {
        responseCode: 550,
        response: '550 5.1.1 <user@example.com>: Recipient address rejected',
      }),
    ),
  );

  await assert.rejects(
    service.send({ to: 'user@example.com', subject: 'x', html: '<p>x</p>' }),
    (error: unknown) => {
      assert.equal((error as Error).message, 'SMTP rejected recipient');
      return true;
    },
  );
});
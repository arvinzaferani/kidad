export type EmailProvider = 'smtp' | 'resend' | 'console';

export interface SmtpConfig {
  host: string;
  port: number;
  /** Plain SMTP on port 25; opportunistic STARTTLS is handled by Postfix. */
  secure: false;
  /** HELO/EHLO name advertised by the client. */
  name: string;
  connectionTimeout: number;
  greetingTimeout: number;
  socketTimeout: number;
}

export interface EmailConfig {
  provider: EmailProvider;
  smtp: SmtpConfig;
  /** Full RFC5322 sender, e.g. `"Kidad" <no-reply@kidad.ir>`. */
  from: string;
  /** Bare envelope address, e.g. `no-reply@kidad.ir`. */
  fromAddress: string;
  appWebUrl: string;
}

const DEFAULT_DISPLAY_NAME = 'Kidad';
const DEFAULT_FROM_ADDRESS = 'no-reply@kidad.ir';

function parseSender(value: string): { displayName: string; address: string } {
  const match = value.match(/^\s*(.*?)\s*<\s*([^<>]+?)\s*>\s*$/);
  if (match) {
    const displayName = match[1].replace(/^"|"$/g, '').trim() || DEFAULT_DISPLAY_NAME;
    return { displayName, address: match[2].trim() };
  }
  return { displayName: DEFAULT_DISPLAY_NAME, address: value.trim() };
}

function formatSender(displayName: string, address: string): string {
  const safeName = displayName.replace(/"/g, '\\"');
  return `"${safeName}" <${address}>`;
}

function positiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * Builds the email configuration from environment variables.
 * Production values are never hardcoded; only the sender identity has a
 * harmless non-production default (used by the console/resend fallbacks too).
 */
export function loadEmailConfig(env: NodeJS.ProcessEnv = process.env): EmailConfig {
  const providerRaw = (env.EMAIL_PROVIDER ?? '').trim().toLowerCase();
  const provider: EmailProvider =
    providerRaw === 'smtp'
      ? 'smtp'
      : providerRaw === 'resend'
        ? 'resend'
        : 'console';

  const rawFrom = (env.MAIL_FROM ?? '').trim() || DEFAULT_FROM_ADDRESS;
  const { displayName, address } = parseSender(rawFrom);

  const appWebUrl = (env.APP_WEB_URL ?? '').trim();

  return {
    provider,
    smtp: {
      host: (env.SMTP_HOST ?? '').trim(),
      port: positiveInt(env.SMTP_PORT, 0),
      secure: false,
      name: (env.SMTP_HELO_NAME ?? '').trim(),
      connectionTimeout: positiveInt(env.SMTP_CONNECTION_TIMEOUT_MS, 15000),
      greetingTimeout: positiveInt(env.SMTP_GREETING_TIMEOUT_MS, 15000),
      socketTimeout: positiveInt(env.SMTP_SOCKET_TIMEOUT_MS, 15000),
    },
    from: address.includes('@')
      ? formatSender(displayName, address)
      : formatSender(DEFAULT_DISPLAY_NAME, rawFrom),
    fromAddress: address.includes('@') ? address : rawFrom,
    appWebUrl,
  };
}

/**
 * Fails fast on startup when production SMTP configuration is invalid.
 * SMTP AUTH credentials are intentionally NOT required for this setup.
 */
export function validateEmailConfig(config: EmailConfig): void {
  if (config.provider !== 'smtp') return;

  const missing: string[] = [];
  if (!config.smtp.host) missing.push('SMTP_HOST');
  if (!Number.isFinite(config.smtp.port) || config.smtp.port < 1) missing.push('SMTP_PORT');
  if (!config.fromAddress.includes('@')) missing.push('MAIL_FROM');
  if (!/^https?:\/\//.test(config.appWebUrl)) missing.push('APP_WEB_URL');

  if (missing.length > 0) {
    throw new Error(
      `Email configuration validation failed (EMAIL_PROVIDER=smtp). Missing or invalid: ${missing.join(', ')}. ` +
        'Note: SMTP username/password are intentionally not required for this setup.',
    );
  }
}
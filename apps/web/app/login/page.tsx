'use client';

import { FormEvent, useMemo, useState } from 'react';
import { AppShell, Card } from '../components/ui';
import {
  getApiError,
  useForgotPassword,
  useLogin,
  useSendLoginLink,
  useSignup,
} from '../../lib/auth/hooks';

type AuthMode = 'login' | 'signup';

function safeNextPath(raw: string | null): string {
  const fallback = '/dashboard';
  if (!raw) return fallback;
  if (!raw.startsWith('/')) return fallback;
  if (raw.startsWith('//')) return fallback;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw)) return fallback;
  return raw;
}

export default function LoginPage() {
  const nextPath =
    typeof window !== 'undefined'
      ? safeNextPath(new URLSearchParams(window.location.search).get('next'))
      : '/dashboard';

  const [mode, setMode] = useState<AuthMode>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupNickname, setSignupNickname] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupPasswordConfirm, setSignupPasswordConfirm] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const loginMutation = useLogin();
  const signupMutation = useSignup();
  const forgotPasswordMutation = useForgotPassword();
  const sendLoginLinkMutation = useSendLoginLink();

  const pending =
    loginMutation.isPending ||
    signupMutation.isPending ||
    forgotPasswordMutation.isPending ||
    sendLoginLinkMutation.isPending;

  const title = useMemo(() => (mode === 'login' ? 'ورود به کی‌داد' : 'ثبت‌نام'), [mode]);
  const subtitle = useMemo(
    () => (mode === 'login' ? 'برای ادامه، با حساب خودت وارد شو' : 'یک حساب کاربری جدید بساز'),
    [mode],
  );

  const switchTo = (next: AuthMode) => {
    setError(null);
    setInfo(null);
    setMode(next);
  };

  const onSubmitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setInfo(null);

    try {
      await loginMutation.mutateAsync({
        email: loginEmail.trim(),
        password: loginPassword,
      });
      window.location.href = nextPath;
    } catch (mutationError) {
      const message = getApiError(mutationError);
      setError(message);
    }
  };

  const onSubmitSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setInfo(null);

    if (signupPassword !== signupPasswordConfirm) {
      setError('تکرار رمز عبور با رمز عبور یکسان نیست.');
      return;
    }

    try {
      await signupMutation.mutateAsync({
        email: signupEmail.trim(),
        phone: signupPhone.trim() || undefined,
        password: signupPassword,
        nickname: signupNickname.trim() || undefined,
      });
      setInfo('ثبت‌نام با موفقیت انجام شد. حالا وارد حساب شدی.');
      window.location.href = nextPath;
    } catch (mutationError) {
      setError(getApiError(mutationError));
    }
  };

  const onForgotPassword = async () => {
    const value = loginEmail.trim();
    if (!value) {
      setError('برای بازیابی رمز عبور، ابتدا ایمیل را وارد کن.');
      return;
    }

    setError(null);
    setInfo(null);
    try {
      await forgotPasswordMutation.mutateAsync({ email: value });
      setInfo('لینک تغییر رمز عبور ارسال شد. اگر در پرونده‌های دریافتی نبود، پوشه Spam را بررسی کن.');
    } catch (mutationError) {
      setError(getApiError(mutationError));
    }
  };

  const onSendLoginLink = async () => {
    const value = loginEmail.trim();
    if (!value) {
      setError('برای ارسال لینک ورود، ابتدا ایمیل را وارد کن.');
      return;
    }

    setError(null);
    setInfo(null);
    try {
      await sendLoginLinkMutation.mutateAsync({ email: value });
      setInfo('لینک ورود ارسال شد. اگر در پرونده‌های دریافتی نبود، پوشه Spam را بررسی کن.');
    } catch (mutationError) {
      setError(getApiError(mutationError));
    }
  };

  return (
    <AppShell title={title} subtitle={subtitle}>
      <Card>
        {mode === 'login' ? (
          <>
            <form onSubmit={onSubmitLogin} className="stack">
              <label className="label">ایمیل *</label>
              <input
                type="email"
                className="field"
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
                placeholder="you@email.com"
                required
              />

              <label className="label">رمز عبور *</label>
              <input
                type="password"
                className="field"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                placeholder="رمز عبور"
                required
              />

              {error ? <div className="notice notice-error">{error}</div> : null}
              {info ? <div className="notice notice-success">{info}</div> : null}

              <button type="submit" className="btn btn-primary" disabled={pending}>
                {pending ? 'در حال ارسال...' : 'ورود'}
              </button>

              <button
                type="button"
                className="auth-link"
                onClick={onForgotPassword}
                disabled={pending}
              >
                رمز عبورت یادت رفته؟
              </button>

              <div className="auth-divider" role="separator">
                یا
              </div>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={onSendLoginLink}
                disabled={pending}
              >
                {sendLoginLinkMutation.isPending ? 'در حال ارسال...' : 'ورود با لینک ایمیل'}
              </button>
            </form>

            <p className="auth-switch">
              حساب کاربری نداری؟{' '}
              <button type="button" className="auth-link" onClick={() => switchTo('signup')}>
                ثبت‌نام کن
              </button>
            </p>
          </>
        ) : (
          <>
            <form onSubmit={onSubmitSignup} className="stack">
              <label className="label">ایمیل *</label>
              <input
                type="email"
                className="field"
                value={signupEmail}
                onChange={(event) => setSignupEmail(event.target.value)}
                placeholder="you@email.com"
                required
              />

              <label className="label">شماره موبایل</label>
              <input
                type="text"
                className="field"
                value={signupPhone}
                onChange={(event) => setSignupPhone(event.target.value)}
                placeholder="0912xxxxxxx"
              />

              <label className="label">نام نمایشی</label>
              <input
                type="text"
                className="field"
                value={signupNickname}
                onChange={(event) => setSignupNickname(event.target.value)}
                placeholder="مثلاً علی"
              />

              <label className="label">رمز عبور *</label>
              <input
                type="password"
                className="field"
                value={signupPassword}
                onChange={(event) => setSignupPassword(event.target.value)}
                placeholder="حداقل ۸ کاراکتر"
                minLength={8}
                required
              />

              <label className="label">تکرار رمز عبور *</label>
              <input
                type="password"
                className="field"
                value={signupPasswordConfirm}
                onChange={(event) => setSignupPasswordConfirm(event.target.value)}
                placeholder="تکرار رمز عبور"
                minLength={8}
                required
              />

              {error ? <div className="notice notice-error">{error}</div> : null}
              {info ? <div className="notice notice-success">{info}</div> : null}

              <button type="submit" className="btn btn-primary" disabled={pending}>
                {pending ? 'در حال ارسال...' : 'ثبت‌نام'}
              </button>
            </form>

            <p className="auth-switch">
              قبلاً حساب داری؟{' '}
              <button type="button" className="auth-link" onClick={() => switchTo('login')}>
                ورود به حساب
              </button>
            </p>
          </>
        )}
      </Card>
    </AppShell>
  );
}
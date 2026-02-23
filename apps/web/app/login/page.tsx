'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell, Card } from '../components/ui';
import {
  getApiError,
  useForgotPassword,
  useLogin,
  useResendVerification,
  useSendLoginLink,
  useSignup,
} from '../../lib/auth/hooks';

type AuthMode = 'login' | 'signup';

export default function LoginPage() {
  const router = useRouter();
  const nextPath =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('next') || '/dashboard'
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
  const [showResendButton, setShowResendButton] = useState(false);

  const loginMutation = useLogin();
  const signupMutation = useSignup();
  const resendVerificationMutation = useResendVerification();
  const forgotPasswordMutation = useForgotPassword();
  const sendLoginLinkMutation = useSendLoginLink();

  const pending =
    loginMutation.isPending ||
    signupMutation.isPending ||
    resendVerificationMutation.isPending ||
    forgotPasswordMutation.isPending ||
    sendLoginLinkMutation.isPending;

  const title = useMemo(() => (mode === 'login' ? 'ورود' : 'ثبت‌نام'), [mode]);

  const onSubmitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setShowResendButton(false);

    try {
      await loginMutation.mutateAsync({
        email: loginEmail.trim(),
        password: loginPassword,
      });
      router.push(nextPath);
    } catch (mutationError) {
      const message = getApiError(mutationError);
      setError(message);
      if (message.includes('ایمیل حساب تایید نشده')) {
        setShowResendButton(true);
      }
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
      setInfo('ایمیل تایید ارسال شد. اگر در Inbox نبود، پوشه Spam را بررسی کن.');
      setMode('login');
    } catch (mutationError) {
      setError(getApiError(mutationError));
    }
  };

  const onResendVerification = async () => {
    const value = loginEmail.trim();
    if (!value) {
      setError('ایمیل را وارد کنید.');
      return;
    }

    setError(null);
    setInfo(null);
    try {
      await resendVerificationMutation.mutateAsync({ email: value });
      setInfo('ایمیل تایید ارسال شد. اگر در Inbox نبود، پوشه Spam را بررسی کن.');
    } catch (mutationError) {
      setError(getApiError(mutationError));
    }
  };

  const onForgotPassword = async () => {
    const value = loginEmail.trim();
    if (!value) {
      setError('برای بازیابی رمز عبور، ایمیل را وارد کنید.');
      return;
    }

    setError(null);
    setInfo(null);
    try {
      await forgotPasswordMutation.mutateAsync({ email: value });
      setInfo('لینک تغییر رمز عبور ارسال شد. اگر در Inbox نبود، پوشه Spam را بررسی کن.');
    } catch (mutationError) {
      setError(getApiError(mutationError));
    }
  };

  const onSendLoginLink = async () => {
    const value = loginEmail.trim();
    if (!value) {
      setError('برای ارسال لینک ورود، ایمیل را وارد کنید.');
      return;
    }

    setError(null);
    setInfo(null);
    try {
      await sendLoginLinkMutation.mutateAsync({ email: value });
      setInfo('لینک ورود ارسال شد. اگر در Inbox نبود، پوشه Spam را بررسی کن.');
    } catch (mutationError) {
      setError(getApiError(mutationError));
    }
  };

  return (
    <AppShell title={title} subtitle="ورود و ثبت‌نام با ایمیل">
      <Card>
        <div className="grid-two" style={{ marginBottom: '0.75rem' }}>
          <button
            type="button"
            className={`btn ${mode === 'login' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setMode('login')}
          >
            ورود
          </button>
          <button
            type="button"
            className={`btn ${mode === 'signup' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setMode('signup')}
          >
            ثبت‌نام
          </button>
        </div>

        {mode === 'login' ? (
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
              placeholder="حداقل ۸ کاراکتر"
              minLength={8}
              required
            />

            {error ? <div className="notice notice-error">{error}</div> : null}
            {info ? <div className="notice notice-success">{info}</div> : null}

            <button type="submit" className="btn btn-primary" disabled={pending}>
              {pending ? 'در حال ارسال...' : 'ورود'}
            </button>

            {showResendButton ? (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onResendVerification}
                disabled={pending}
              >
                ارسال مجدد ایمیل تایید
              </button>
            ) : null}

            <button
              type="button"
              className="btn btn-secondary"
              onClick={onForgotPassword}
              disabled={pending}
            >
              فراموشی رمز عبور (ارسال ایمیل)
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={onSendLoginLink}
              disabled={pending}
            >
              ورود با لینک ایمیل
            </button>
          </form>
        ) : (
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
        )}
      </Card>
    </AppShell>
  );
}

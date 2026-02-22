'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell, Card } from '../components/ui';
import {
  getApiError,
  useLogin,
  useResendVerification,
  useSignup,
} from '../../lib/auth/hooks';

type AuthMode = 'login' | 'signup';

function isEmail(value: string) {
  return value.includes('@');
}

export default function LoginPage() {
  const router = useRouter();
  const nextPath =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('next') || '/dashboard'
      : '/dashboard';

  const [mode, setMode] = useState<AuthMode>('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const loginMutation = useLogin();
  const signupMutation = useSignup();
  const resendVerificationMutation = useResendVerification();

  const pending =
    loginMutation.isPending ||
    signupMutation.isPending ||
    resendVerificationMutation.isPending;

  const title = useMemo(
    () => (mode === 'login' ? 'ورود' : 'ثبت‌نام'),
    [mode],
  );

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setInfo(null);

    try {
      if (mode === 'login') {
        await loginMutation.mutateAsync({
          identifier: identifier.trim(),
          password,
        });
      } else {
        const value = identifier.trim();
        await signupMutation.mutateAsync({
          email: isEmail(value) ? value : undefined,
          phone: isEmail(value) ? undefined : value,
          password,
          nickname: nickname.trim() || undefined,
        });

        if (isEmail(value)) {
          setInfo('ایمیل تایید برای شما ارسال شد. بعد از تایید، وارد شوید.');
          setMode('login');
          return;
        }
      }

      router.push(nextPath);
    } catch (mutationError) {
      setError(getApiError(mutationError));
    }
  };

  const onResendVerification = async () => {
    const value = identifier.trim();
    if (!isEmail(value)) {
      setError('برای ارسال مجدد، ایمیل معتبر وارد کنید.');
      return;
    }

    setError(null);
    setInfo(null);
    try {
      await resendVerificationMutation.mutateAsync({ email: value });
      setInfo('اگر ایمیل ثبت شده باشد، لینک تایید مجدد ارسال شد.');
    } catch (mutationError) {
      setError(getApiError(mutationError));
    }
  };

  return (
    <AppShell title={title} subtitle="با ایمیل یا شماره موبایل وارد شو.">
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

        <form onSubmit={onSubmit} className="stack">
          <label className="label">ایمیل یا شماره موبایل</label>
          <input
            type="text"
            className="field"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            placeholder="0912... یا user@email.com"
            required
          />

          {mode === 'signup' ? (
            <>
              <label className="label">نام نمایشی (اختیاری)</label>
              <input
                type="text"
                className="field"
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                placeholder="مثلاً علی"
              />
            </>
          ) : null}

          <label className="label">رمز عبور</label>
          <input
            type="password"
            className="field"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="حداقل ۸ کاراکتر"
            minLength={8}
            required
          />

          {error ? (
            <p style={{ color: '#dc2626', margin: 0, fontSize: '0.9rem' }}>{error}</p>
          ) : null}
          {info ? (
            <p style={{ color: 'var(--accent)', margin: 0, fontSize: '0.9rem' }}>{info}</p>
          ) : null}

          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? 'در حال ارسال...' : mode === 'login' ? 'ورود' : 'ثبت‌نام'}
          </button>

          {mode === 'login' ? (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onResendVerification}
              disabled={pending}
            >
              ارسال مجدد ایمیل تایید
            </button>
          ) : null}
        </form>
      </Card>
    </AppShell>
  );
}

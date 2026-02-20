'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell, Card } from '../components/ui';
import { getApiError, useLogin, useSignup } from '../../lib/auth/hooks';

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

  const loginMutation = useLogin();
  const signupMutation = useSignup();

  const pending = loginMutation.isPending || signupMutation.isPending;

  const title = useMemo(
    () => (mode === 'login' ? 'ورود' : 'ثبت‌نام'),
    [mode],
  );

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

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
      }

      router.push(nextPath);
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

          <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? 'در حال ارسال...' : mode === 'login' ? 'ورود' : 'ثبت‌نام'}
          </button>
        </form>
      </Card>
    </AppShell>
  );
}

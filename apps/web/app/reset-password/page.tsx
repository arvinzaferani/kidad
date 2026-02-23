'use client';

import { FormEvent, Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AppShell, Card } from '../components/ui';
import { getApiError, useResetPassword } from '../../lib/auth/hooks';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const resetPasswordMutation = useResetPassword();
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const userId = useMemo(() => searchParams.get('userId') ?? '', [searchParams]);
  const token = useMemo(() => searchParams.get('token') ?? '', [searchParams]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setInfo(null);

    if (!userId || !token) {
      setError('لینک بازیابی معتبر نیست.');
      return;
    }

    if (password !== passwordConfirm) {
      setError('تکرار رمز عبور با رمز عبور یکسان نیست.');
      return;
    }

    try {
      await resetPasswordMutation.mutateAsync({ userId, token, password });
      setInfo('رمز عبور با موفقیت تغییر کرد. اکنون وارد حساب شوید.');
      setPassword('');
      setPasswordConfirm('');
    } catch (mutationError) {
      setError(getApiError(mutationError));
    }
  };

  return (
    <AppShell title="تغییر رمز عبور" subtitle="رمز عبور جدید را تنظیم کنید">
      <Card>
        <form className="stack" onSubmit={onSubmit}>
          <label className="label">رمز عبور جدید</label>
          <input
            type="password"
            className="field"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            required
          />

          <label className="label">تکرار رمز عبور جدید</label>
          <input
            type="password"
            className="field"
            value={passwordConfirm}
            onChange={(event) => setPasswordConfirm(event.target.value)}
            minLength={8}
            required
          />

          {error ? <div className="notice notice-error">{error}</div> : null}
          {info ? <div className="notice notice-success">{info}</div> : null}

          <button type="submit" className="btn btn-primary" disabled={resetPasswordMutation.isPending}>
            {resetPasswordMutation.isPending ? 'در حال ثبت...' : 'ثبت رمز عبور جدید'}
          </button>

          <Link href="/login" className="btn btn-secondary">
            بازگشت به ورود
          </Link>
        </form>
      </Card>
    </AppShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AppShell title="تغییر رمز عبور" subtitle="در حال بارگذاری...">
          <Card>
            <p style={{ margin: 0 }}>در حال بارگذاری...</p>
          </Card>
        </AppShell>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}

'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppShell, Card } from '../components/ui';
import { getApiError, useVerifyEmail } from '../../lib/auth/hooks';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verifyMutation = useVerifyEmail();
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [resultError, setResultError] = useState<string | null>(null);

  const userId = useMemo(() => searchParams.get('userId') ?? '', [searchParams]);
  const token = useMemo(() => searchParams.get('token') ?? '', [searchParams]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!userId || !token) {
        setResultError('لینک تایید معتبر نیست.');
        return;
      }

      try {
        await verifyMutation.mutateAsync({ userId, token });
        if (cancelled) return;
        setResultMessage('ایمیل شما تایید شد. در حال انتقال به داشبورد...');
        setTimeout(() => {
          router.push('/dashboard');
        }, 900);
      } catch (error) {
        if (cancelled) return;
        setResultError(getApiError(error));
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [router, token, userId]);

  return (
    <AppShell title="تایید ایمیل" subtitle="در حال بررسی لینک تایید...">
      <Card>
        {verifyMutation.isPending ? <p style={{ margin: 0 }}>در حال تایید ایمیل...</p> : null}
        {resultMessage ? <p style={{ margin: 0, color: 'var(--accent)' }}>{resultMessage}</p> : null}
        {resultError ? <p style={{ margin: 0, color: '#dc2626' }}>{resultError}</p> : null}

        <div className="grid-two" style={{ marginTop: '0.75rem' }}>
          <Link href="/login" className="btn btn-secondary">
            بازگشت به ورود
          </Link>
          <Link href="/dashboard" className="btn btn-primary">
            رفتن به داشبورد
          </Link>
        </div>
      </Card>
    </AppShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <AppShell title="تایید ایمیل" subtitle="در حال بارگذاری...">
          <Card>
            <p style={{ margin: 0 }}>در حال بارگذاری...</p>
          </Card>
        </AppShell>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}

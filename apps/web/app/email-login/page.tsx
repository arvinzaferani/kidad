'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppShell, Card } from '../components/ui';
import { getApiError, useLoginWithLink } from '../../lib/auth/hooks';

function EmailLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const loginWithLinkMutation = useLoginWithLink();
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [resultError, setResultError] = useState<string | null>(null);

  const userId = useMemo(() => searchParams.get('userId') ?? '', [searchParams]);
  const token = useMemo(() => searchParams.get('token') ?? '', [searchParams]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!userId || !token) {
        setResultError('لینک ورود معتبر نیست.');
        return;
      }

      try {
        await loginWithLinkMutation.mutateAsync({ userId, token });
        if (cancelled) return;
        setResultMessage('ورود با موفقیت انجام شد. در حال انتقال به داشبورد...');
        setTimeout(() => {
          router.push('/dashboard');
        }, 900);
      } catch (mutationError) {
        if (cancelled) return;
        setResultError(getApiError(mutationError));
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [userId, token, router]);

  return (
    <AppShell title="ورود با لینک ایمیل" subtitle="در حال بررسی لینک ورود...">
      <Card>
        {loginWithLinkMutation.isPending ? <p style={{ margin: 0 }}>در حال ورود...</p> : null}
        {resultMessage ? <div className="notice notice-success">{resultMessage}</div> : null}
        {resultError ? <div className="notice notice-error">{resultError}</div> : null}

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

export default function EmailLoginPage() {
  return (
    <Suspense
      fallback={
        <AppShell title="ورود با لینک ایمیل" subtitle="در حال بارگذاری...">
          <Card>
            <p style={{ margin: 0 }}>در حال بارگذاری...</p>
          </Card>
        </AppShell>
      }
    >
      <EmailLoginContent />
    </Suspense>
  );
}

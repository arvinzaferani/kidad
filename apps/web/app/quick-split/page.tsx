'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { AppShell, Card, Placeholder } from '../components/ui';
import { getApiError } from '../../lib/auth/hooks';
import {
  useCreateSplitSession,
  useSplitSessions,
} from '../../lib/split/hooks';

const formatMoney = (value: number, currency: 'TOMAN' | 'RIAL') =>
  `${new Intl.NumberFormat('fa-IR').format(Math.round(value))} ${
    currency === 'TOMAN' ? 'تومان' : 'ریال'
  }`;

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('fa-IR');

const balanceClass = (amount: number) =>
  amount > 0.01
    ? 'settlement-credit'
    : amount < -0.01
      ? 'settlement-debit'
      : 'settlement-clear';

const balanceLabel = (amount: number, currency: 'TOMAN' | 'RIAL') =>
  amount > 0.01
    ? `طلب: ${formatMoney(amount, currency)}`
    : amount < -0.01
      ? `بدهی: ${formatMoney(Math.abs(amount), currency)}`
      : 'تسویه';

export default function QuickSplitPage() {
  const createMutation = useCreateSplitSession();
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const { data: sessions, isLoading } = useSplitSessions(page, 10);

  const onCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    try {
      const session = await createMutation.mutateAsync({
        title: title.trim() || undefined,
      });
      window.location.href = `/split/${session.id}`;
    } catch (mutationError) {
      setError(getApiError(mutationError));
    }
  };

  return (
    <AppShell
      title="دنگ"
      subtitle="پول پرداختی را سریع با دوستانت تقسیم کن"
    >
      <Card>
        <p
          className="subtitle"
          style={{ margin: '0 0 1rem', textAlign: 'center' }}
        >
          یک دنگ بساز، بعد از طریق QR یا لینک، دوستانت را دعوت کن. لازم نیست
          منتظر همه بمونی تا هزینه‌ها را ثبت کنی.
        </p>

        <form onSubmit={onCreate} className="stack">
          <label className="label">عنوان دنگ</label>
          <input
            type="text"
            className="field"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="دنگ ..."
            maxLength={120}
          />

          {error ? <div className="notice notice-error">{error}</div> : null}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'در حال ساخت...' : 'ساخت دنگ'}
          </button>
        </form>
      </Card>

      <Card title="دنگ‌های من">
        {isLoading ? <p style={{ margin: 0 }}>در حال بارگذاری...</p> : null}
        {!isLoading && !sessions?.items.length ? (
          <Placeholder label="هنوز دنگی نساختی." />
        ) : null}
        <div className="member-list">
          {(sessions?.items ?? []).map((session) => (
            <Link
              key={session.id}
              href={`/split/${session.id}`}
              className="member-row"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div className="member-main">
                <div className="member-avatar">
                  {session.title?.trim().slice(0, 1) || 'د'}
                </div>
                <div>
                  <p className="member-name">
                    {session.title || 'دنگ بدون عنوان'}
                  </p>
                  <p className="member-contact">
                    {session.memberCount} عضو • {session.expenseCount} هزینه •{' '}
                    {session.isHost ? 'میزبان تو' : 'عضو'}
                  </p>
                  <p className="member-contact">
                    {formatDate(session.createdAt)} •{' '}
                    {session.status === 'ACTIVE' ? 'فعال' : 'بسته'}
                  </p>
                </div>
              </div>
              <span
                className={`settlement-pill ${balanceClass(session.myBalance)}`}
              >
                {balanceLabel(session.myBalance, session.currency)}
              </span>
            </Link>
          ))}
        </div>
        <div className="grid-two" style={{ marginTop: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            صفحه قبل
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setPage((p) => p + 1)}
            disabled={!sessions?.hasNext}
          >
            صفحه بعد
          </button>
        </div>
      </Card>
    </AppShell>
  );
}

'use client';

import { FormEvent, useState } from 'react';
import { AppShell, Card } from '../components/ui';
import { getApiError } from '../../lib/auth/hooks';
import { useCreateSplitSession } from '../../lib/split/hooks';

export default function QuickSplitPage() {
  const createMutation = useCreateSplitSession();
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

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
          یک جلسه بساز، بعد از طریق QR یا لینک، دوستانت را دعوت کن. لازم نیست
          منتظر همه بمونی تا هزینه‌ها را ثبت کنی.
        </p>

        <form onSubmit={onCreate} className="stack">
          <label className="label">عنوان جلسه (اختیاری)</label>
          <input
            type="text"
            className="field"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="مثلاً شام امشب"
            maxLength={120}
          />

          {error ? <div className="notice notice-error">{error}</div> : null}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'در حال ساخت...' : 'ساخت جلسهٔ اسپلیت'}
          </button>
        </form>
      </Card>
    </AppShell>
  );
}
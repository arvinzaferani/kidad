'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell, Card } from '../../../../components/ui';

interface NewExpensePageProps {
  params: { groupId: string };
}

export default function NewExpensePage({ params }: NewExpensePageProps) {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/groups/${params.groupId}`);
  }, [params.groupId, router]);

  return (
    <AppShell title="هزینه جدید" subtitle="در حال انتقال به صفحه گروه">
      <Card title="انتقال">
        <p style={{ margin: 0 }}>لطفاً صبر کن...</p>
      </Card>
    </AppShell>
  );
}

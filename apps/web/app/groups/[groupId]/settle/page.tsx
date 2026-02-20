import { AppShell, Card, Placeholder } from '../../../components/ui';

interface SettlePageProps {
  params: { groupId: string };
}

export default function SettlePage({ params }: SettlePageProps) {
  return (
    <AppShell title={`تسویه گروه ${params.groupId}#`} subtitle="پیشنهاد پرداخت‌ها">
      <Card title="پیشنهادهای تسویه">
        <Placeholder label="الگوریتم تسویه بعد از اتصال API اینجا نتیجه می‌دهد." />
      </Card>
    </AppShell>
  );
}

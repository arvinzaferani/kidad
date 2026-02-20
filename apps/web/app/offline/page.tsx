import { AppShell, Card } from '../components/ui';

export default function OfflinePage() {
  return (
    <AppShell title="حالت آفلاین" subtitle="الان اینترنت وصل نیست.">
      <Card>
        <p style={{ margin: 0, opacity: 0.85 }}>نگران نباش، تغییراتت ذخیره می‌شن و بعداً همگام‌سازی می‌شن.</p>
      </Card>
    </AppShell>
  );
}

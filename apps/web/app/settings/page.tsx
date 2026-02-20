import { AppShell, Card, Placeholder } from '../components/ui';

export default function SettingsPage() {
  return (
    <AppShell title="تنظیمات" subtitle="شخصی‌سازی برنامه">
      <Card title="تنظیمات عمومی">
        <Placeholder label="زبان، اعلان‌ها و حریم خصوصی اینجا مدیریت می‌شود." />
      </Card>
    </AppShell>
  );
}

import Link from 'next/link';
import { AppShell, Card } from './components/ui';

export default function HomePage() {
  return (
    <AppShell title="مدیریت خرج‌های مشترک" subtitle="ساده، سریع، شفاف">
      <Card>
        <p>اگر حسابت رو تو ۵ ثانیه نفهمیدی، یعنی مشکل از ماست.</p>
      </Card>

      <div className="grid-two">
        <Link href="/login" className="btn btn-primary">
          ورود
        </Link>
        <Link href="/dashboard" className="btn btn-secondary">
          داشبورد
        </Link>
      </div>
    </AppShell>
  );
}

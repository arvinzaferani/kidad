import Link from 'next/link';
import { AppShell, Card } from './components/ui';

export default function HomePage() {
  return (
    <AppShell title="مدیریت خرج‌های مشترک" subtitle="ساده، سریع، شفاف">
      <Card>
        <p>حساب حسابه، کاکا برادر!</p>
      </Card>

      <div className="login-parent">
        <Link href="/login" className="btn btn-primary">
          ورود
        </Link>
        {/* <Link href="/dashboard" className="btn btn-secondary">
          داشبورد
        </Link> */}
      </div>
      <p
        style={{
          margin: '4rem 0 0',
          textAlign: 'center',
          opacity: 0.68,
          fontSize: '0.78rem',
        }}
      >
        © Developed by Arvin Zaferni
      </p>
    </AppShell>
  );
}

'use client';

import Link from 'next/link';
import { ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AppShell, Card } from '../components/ui';
import { HomeIcon, ShieldIcon, UsersIcon } from '../components/icons';
import { useAuthMe } from '../../lib/auth/hooks';

const adminNavItems = [
  { href: '/admin', label: 'داشبورد', icon: HomeIcon },
  { href: '/admin/users', label: 'کاربران', icon: UsersIcon },
  { href: '/admin/groups', label: 'گروه‌ها', icon: ShieldIcon },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: me, isLoading, isError } = useAuthMe();

  useEffect(() => {
    if (!isLoading && (!me || isError)) {
      router.replace('/login?next=/admin');
    }
    if (!isLoading && me && !me.isAdmin) {
      router.replace('/dashboard');
    }
  }, [isError, isLoading, me, router]);

  return (
    <AppShell title="پنل ادمین" subtitle="مدیریت کاربران، گروه‌ها و آمار سیستم">
      {!me?.isAdmin ? (
        <Card>
          <p style={{ margin: 0 }}>در حال بررسی دسترسی...</p>
        </Card>
      ) : (
        <div className="admin-layout">
          <aside className="admin-sidebar" aria-label="ناوبری ادمین">
            {adminNavItems.map((item) => {
              const active =
                item.href === '/admin'
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`admin-nav-link ${active ? 'admin-nav-link-active' : ''}`}
                  aria-current={active ? 'page' : undefined}
                  title={item.label}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </aside>
          <div className="admin-content">{children}</div>
        </div>
      )}
    </AppShell>
  );
}

'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { getAuthToken } from '../../lib/auth/token';
import {
  DashboardIcon,
  GroupsIcon,
  HomeIcon,
  InboxIcon,
  ShieldIcon,
  SplitIcon,
  UserIcon,
  UsersIcon,
} from './icons';
import { useAuthMe } from '../../lib/auth/hooks';

interface AppShellProps {
  title: string;
  subtitle?: string;
  headerImageUrl?: string;
  headerImageAlt?: string;
  children: ReactNode;
}

export function AppShell({
  title,
  subtitle,
  headerImageUrl,
  headerImageAlt,
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const centeredRoutes = ['/', '/login', '/verify-email', '/reset-password', '/email-login', '/verify-otp'];
  const shouldCenterMain = centeredRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
  const isLoggedIn = Boolean(getAuthToken());
  const { data: me } = useAuthMe(isLoggedIn);

  const navItems = [
    { href: '/dashboard', label: 'داشبورد', icon: DashboardIcon },
    { href: '/groups', label: 'گروه‌ها', icon: GroupsIcon },
    { href: '/quick-split', label: 'دنگ', icon: SplitIcon },
    { href: '/friends', label: 'دوستان', icon: UsersIcon },
    { href: '/profile', label: 'پروفایل', icon: UserIcon },
    // ...(me?.isAdmin ? [{ href: '/admin', label: 'ادمین', icon: ShieldIcon }] : []),
  ];

  return (<>
    <header className="app-header" role="banner">
      <div className="app-header-inner">
        {headerImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={headerImageUrl}
            alt={headerImageAlt ?? title}
            className="app-header-image"
          />
        ) : headerImageAlt ? (
          <div className="app-header-image app-header-image-fallback" aria-hidden="true">
            {headerImageAlt.slice(0, 1)}
          </div>
        ) : null}
        <div className="app-header-copy">
          <h1 className="page-title">{title}</h1>
          {subtitle ? <p className="subtitle">{subtitle}</p> : null}
        </div>
        <div className={`app-header-actions ${shouldCenterMain ? 'app-header-actions-hidden' : ''}`}>
          {isLoggedIn && me?.isAdmin ? (
            <Link
              href="/admin"
              className={`app-header-icon-btn ${pathname === '/admin' || pathname.startsWith('/admin/') ? 'app-header-icon-btn-active-admin' : ''}`}
              aria-label="ادمین"
              title="ادمین"
            >
              <ShieldIcon size={18} />
            </Link>) : null}
          {isLoggedIn ? (
            <Link
              href="/inbox"
              className={`app-header-icon-btn ${pathname === '/inbox' || pathname.startsWith('/inbox/') ? 'app-header-icon-btn-active' : ''}`}
              aria-label="اینباکس"
              title="اینباکس"
            >
              <InboxIcon size={18} />
            </Link>
          ) : null}
        </div>
      </div>
    </header>
    <main className="app-shell" id="top">
      <a href="#content" className="skip-link">
        رفتن به محتوا
      </a>
      <div className={`app-layout ${shouldCenterMain ? 'app-main-centered' : ''}`}>
        <div className={`app-main`}>
          <section id="content" className="stack page-enter" aria-live="polite">
            {children}
          </section>
        </div>
      </div>
    </main>
    {shouldCenterMain ? null : (
      <nav className="bottom-nav" role="navigation" aria-label="ناوبری اصلی">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (item.href === '/quick-split' ?
            <Link
              key={item.href}
              href={item.href}
              className={`quick-bottom-nav-item ${active ? 'quick-bottom-nav-item-active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <div className='quick-in'>
                <span className={`bottom-nav-icon `} aria-hidden="true">
                  <Icon size={18} />
                </span>
                <span className="bottom-nav-label">{item.label}</span>
              </div>
            </Link> :
            <Link
              key={item.href}
              href={item.href}
              className={`bottom-nav-item ${active ? 'bottom-nav-item-active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <span className={`bottom-nav-icon `} aria-hidden="true">
                <Icon size={18} />
              </span>
              <span className="bottom-nav-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    )}
  </>);
}

interface CardProps {
  title?: string;
  headerAction?: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
}

export function Card({ title, headerAction, children, icon }: CardProps) {
  return (
    <article className="card">
      <div className="card-header">
        <div className="card-title-parent">
          {icon}
          {title ? <h2 className="card-title">{title}</h2> : null}
        </div>
        {headerAction ?? null}
      </div>
      {children}
    </article>
  );
}

export function Placeholder({ label }: { label: string }) {
  return <div className="placeholder">{label}</div>;
}

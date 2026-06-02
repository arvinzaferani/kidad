'use client';

import Link from 'next/link';
import { ReactNode, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './theme-toggle';
import { useLogout } from '../../lib/auth/hooks';
import { getAuthToken } from '../../lib/auth/token';
import {
  ChevronUpIcon,
  HomeIcon,
  InboxIcon,
  ShieldIcon,
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
  const [open, setOpen] = useState(false);
  const dragStartY = useRef<number | null>(null);
  const draggedToOpen = useRef(false);
  const centeredRoutes = ['/', '/login', '/verify-email', '/reset-password', '/email-login', '/verify-otp'];
  const shouldCenterMain = centeredRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
  const logout = useLogout();
  const isLoggedIn = Boolean(getAuthToken());
  const { data: me } = useAuthMe(isLoggedIn);

  const navItems = [
    { href: '/dashboard', label: 'داشبورد', icon: HomeIcon },
    { href: '/groups', label: 'گروه‌ها', icon: UsersIcon },
    { href: '/friends', label: 'دوستان', icon: UsersIcon },
    { href: '/inbox', label: 'اینباکس', icon: InboxIcon },
    { href: '/profile', label: 'پروفایل', icon: UserIcon },
    ...(me?.isAdmin ? [{ href: '/admin', label: 'ادمین', icon: ShieldIcon }] : []),
  ];

  return (<> <header className="app-header" role="banner">
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
    </div>
  </header>
    <main className="app-shell" id="top">
       
      <a href="#content" className="skip-link">
        رفتن به محتوا
      </a>
      <div className={`app-layout ${open ? 'sidebar-open' : ''}`}>
        <div className="menu-handle">
          </div>
        <button
          type="button"
          className={`bottom-menu-handle ${open ? 'bottom-menu-handle-open' : ''}`}
          onClick={() => {
            if (draggedToOpen.current) {
              draggedToOpen.current = false;
              return;
            }
            setOpen((value) => !value);
          }}
          onPointerDown={(event) => {
            dragStartY.current = event.clientY;
          }}
          onPointerUp={(event) => {
            if (dragStartY.current === null) {
              return;
            }
            const deltaY = dragStartY.current - event.clientY;
            if (deltaY > 24) {
              setOpen(true);
              draggedToOpen.current = true;
            }
            dragStartY.current = null;
          }}
          onPointerCancel={() => {
            dragStartY.current = null;
          }}
          aria-label={open ? 'بستن منو' : 'باز کردن منو'}
          aria-expanded={open}
          aria-controls="sidebar-panel"
        >
          <span className={`bottom-menu-arrow ${open ? 'bottom-menu-arrow-open' : ''}`} aria-hidden="true">
            <ChevronUpIcon size={16} />
          </span>
        </button>
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="بستن سایدبار"
          onClick={() => setOpen(false)}
        />

        <div id="sidebar-panel" className="sidebar-panel card" aria-label="ناوبری اصلی">
          <div className="sidebar-panel-top">
            <Link href="/" className="brand" onClick={() => setOpen(false)}>
              کی‌داد؟
            </Link>
            <button
              type="button"
              className="sidebar-close"
              onClick={() => setOpen(false)}
              aria-label="بستن سایدبار"
            >
              ×
            </button>
          </div>
          <nav className="sidebar-nav">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-link ${active ? 'nav-link-active' : ''}`}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => setOpen(false)}
                >
                  <span className="nav-icon" aria-hidden="true">
                    <Icon size={16} />
                  </span>
                  <span className="nav-label">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="sidebar-footer">
            <ThemeToggle />
            {isLoggedIn ? (
              <button
                type="button"
                className="btn btn-exit"
                style={{ marginTop: '0.6rem' }}
                onClick={() => {
                  logout();
                  window.location.href = '/login';
                }}
              >
                خروج
              </button>
            ) : null}
          </div>
        </div>
       
        <div className={`app-main ${shouldCenterMain ? 'app-main-centered' : ''}`}>
          

          <section id="content" className="stack" aria-live="polite">
            {children}
          </section>
        </div>
      </div>
    </main>
    </>
  );
}

interface CardProps {
  title?: string;
  headerAction?: ReactNode;
  children: ReactNode;
}

export function Card({ title, headerAction, children }: CardProps) {
  return (
    <article className="card">
      <div className="card-header">
        {title ? <h2 className="card-title">{title}</h2> : null}
        {headerAction ?? null}
      </div>
      {children}
    </article>
  );
}

export function Placeholder({ label }: { label: string }) {
  return <div className="placeholder">{label}</div>;
}

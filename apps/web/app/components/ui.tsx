'use client';

import Link from 'next/link';
import { ReactNode, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './theme-toggle';
import {
  ChevronUpIcon,
  HomeIcon,
  InboxIcon,
  UserIcon,
  UsersIcon,
} from './icons';

interface AppShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function AppShell({ title, subtitle, children }: AppShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const dragStartY = useRef<number | null>(null);
  const draggedToOpen = useRef(false);

  const navItems = [
    { href: '/dashboard', label: 'داشبورد', icon: HomeIcon },
    { href: '/groups', label: 'گروه‌ها', icon: UsersIcon },
    { href: '/friends', label: 'دوستان', icon: UsersIcon },
    { href: '/inbox', label: 'اینباکس', icon: InboxIcon },
    { href: '/profile', label: 'پروفایل', icon: UserIcon },
  ];

  return (<> <header className=" app-header" role="banner">
    <h1 className="page-title">{title}</h1>
    {subtitle ? <p className="subtitle">{subtitle}</p> : null}
  </header>
    <main className="app-shell" id="top">
       
      <a href="#content" className="skip-link">
        رفتن به محتوا
      </a>
      <div className={`app-layout ${open ? 'sidebar-open' : ''}`}>
        <button
          type="button"
          className="bottom-menu-handle"
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
          </div>
        </div>
       
        <div className="app-main">
          

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
  children: ReactNode;
}

export function Card({ title, children }: CardProps) {
  return (
    <article className="card">
      {title ? <h2 className="card-title">{title}</h2> : null}
      {children}
    </article>
  );
}

export function Placeholder({ label }: { label: string }) {
  return <div className="placeholder">{label}</div>;
}

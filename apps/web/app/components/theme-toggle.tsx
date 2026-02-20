'use client';

import { useEffect, useState } from 'react';
import { MoonIcon, SunIcon } from './icons';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'whopaid-theme';

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.classList.toggle('light', theme === 'light');
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const preferredDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const nextTheme = saved ?? (preferredDark ? 'dark' : 'light');
    setTheme(nextTheme);
    applyTheme(nextTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    applyTheme(nextTheme);
    localStorage.setItem(STORAGE_KEY, nextTheme);
  };

  return (
    <button type="button" onClick={toggleTheme} className="theme-toggle" aria-label="تغییر حالت رنگ">
      <span aria-hidden="true" style={{ marginInlineEnd: '0.35rem', display: 'inline-flex' }}>
        {theme === 'dark' ? <SunIcon size={14} /> : <MoonIcon size={14} />}
      </span>
      {theme === 'dark' ? 'روشن' : 'تیره'}
    </button>
  );
}

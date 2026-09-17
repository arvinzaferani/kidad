'use client';

import { useEffect } from 'react';

const LIGHT_BG = '#f5f4ef';
const DARK_BG = '#303030';
const SYSTEM_DARK_BG = '#282a2b';

function apply() {
  const root = document.documentElement;
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) return;
  let color = LIGHT_BG;
  if (root.classList.contains('dark')) {
    color = DARK_BG;
  } else if (
    !root.classList.contains('light') &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  ) {
    color = SYSTEM_DARK_BG;
  }
  meta.content = color;
}

export function ThemeMetaSync() {
  useEffect(() => {
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  return null;
}
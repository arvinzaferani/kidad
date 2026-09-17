'use client';

import { useEffect } from 'react';

const EDITABLE_SELECTOR = 'input, textarea, [contenteditable="true"]';

function isStandaloneIos() {
  const ua = navigator.userAgent || '';
  const isIos =
    /iphone|ipad|ipod/i.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    'standalone' in navigator;
  return isIos && standalone;
}

export function PwaKeyboardFix() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let disposed = false;

    const onTouchStart = (event: TouchEvent) => {
      if (disposed || !isStandaloneIos()) return;
      if (event.defaultPrevented) return;
      const target = event.target as Element | null;
      if (!target || typeof target.closest !== 'function') return;
      const editable = target.closest(EDITABLE_SELECTOR) as HTMLElement | null;
      if (!editable) return;

      if (document.activeElement === editable) {
        editable.blur();
        editable.focus({ preventScroll: true });
      } else {
        editable.focus({ preventScroll: true });
      }
    };

    document.addEventListener('touchstart', onTouchStart, {
      capture: true,
      passive: true,
    });

    return () => {
      disposed = true;
      document.removeEventListener('touchstart', onTouchStart, true);
    };
  }, []);

  return null;
}
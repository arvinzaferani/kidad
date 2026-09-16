'use client';

import { useEffect } from 'react';

export function KeyboardDetector() {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const update = () => {
      const keyboardOpen = viewport.height < window.innerHeight * 0.65;
      document.body.classList.toggle('keyboard-open', keyboardOpen);
    };

    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    update();

    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      document.body.classList.remove('keyboard-open');
    };
  }, []);

  return null;
}
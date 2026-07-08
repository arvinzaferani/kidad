'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0 },
    );

    observer.observe(el);

    const timer = setTimeout(() => setVisible(true), 50);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`${visible ? 'page-enter' : ''}${className ? ` ${className}` : ''}`}
    >
      {children}
    </div>
  );
}

interface StaggerListProps {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'ul' | 'ol';
}

export function StaggerList({ children, className, as = 'div' }: StaggerListProps) {
  const Tag = as;
  return (
    <Tag className={className}>
      {children}
    </Tag>
  );
}

interface StaggerItemProps {
  children: ReactNode;
  index: number;
  className?: string;
  style?: React.CSSProperties;
  as?: 'div' | 'li';
}

export function StaggerItem({ children, index, className, style, as = 'div' }: StaggerItemProps) {
  const Tag = as;
  return (
    <Tag
      className={`stagger-item${className ? ` ${className}` : ''}`}
      style={{ '--stagger-index': index, ...style } as React.CSSProperties}
    >
      {children}
    </Tag>
  );
}

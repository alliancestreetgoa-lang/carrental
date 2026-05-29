'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

interface RevealProps {
  children: ReactNode;
  /** Stagger delay in milliseconds. */
  delay?: number;
  className?: string;
}

/**
 * Reveals its children with a fade-up transition the first time it scrolls
 * into view. Dependency-free (IntersectionObserver), SSR-safe (content is in
 * the DOM, only visually hidden), and disabled under prefers-reduced-motion
 * via the [data-reveal] rules in globals.css.
 */
export function Reveal({ children, delay = 0, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShown(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-reveal={shown ? 'in' : ''}
      style={{ '--reveal-delay': `${delay}ms` } as CSSProperties}
      className={className}
    >
      {children}
    </div>
  );
}

import { useEffect } from 'react';

/**
 * The Pillar is a fixed full-screen experience, not a scrolling curriculum
 * page (§11) — the page behind it must not scroll while it's mounted. Locks
 * on mount, restores whatever the body's own overflow was on unmount, so a
 * nested/remounted lock (StrictMode's double-invoke, a parent that also
 * locks) never leaves the page stuck unscrollable after this one lets go.
 */
export function useLockBodyScroll() {
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);
}

import { useEffect, useRef, useState, type RefObject } from 'react';

type RevealOptions = {
    threshold?: number;
    rootMargin?: string;
    once?: boolean;
    delay?: number;
};

export function useReveal<T extends HTMLElement = HTMLElement>(
  options: RevealOptions = {}
): { ref: RefObject<T | null>; revealed: boolean } {
  const { threshold = 0.15, rootMargin = '0px 0px -60px 0px', once = true, delay = 0 } = options;

  const ref = useRef<T | null>(null);
  const [revealed, setRevealed] = useState(false);
  const doneRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setRevealed(true);
      doneRef.current = true;
      return;
    }

    let timer: number | undefined;
    let frame = 0;

    const show = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      if (timer !== undefined) window.clearTimeout(timer);
      setRevealed(true);
    };

    const schedule = () => {
      if (doneRef.current) return;
      if (timer !== undefined) window.clearTimeout(timer);
      timer = window.setTimeout(show, delay);
    };

        let observer: IntersectionObserver | undefined;
    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            schedule();
            if (once) observer?.unobserve(entry.target);
          });
        },
        { threshold, rootMargin }
      );
      observer.observe(el);
    }

        const checkPosition = () => {
      frame = 0;
      if (doneRef.current) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;

      if (rect.top < vh * 0.92 && rect.bottom > 0) {
        show();
      }
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(checkPosition);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    checkPosition();

    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      observer?.disconnect();
    };
  }, [threshold, rootMargin, once, delay]);

  return { ref, revealed };
}

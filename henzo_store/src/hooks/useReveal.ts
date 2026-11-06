import { useEffect, useRef, useState, type RefObject } from 'react';

type RevealOptions = {
  /** Ngưỡng hiển thị (0–1). 0.15 = phần tử hiện khi 15% đã lọt khung nhìn. */
  threshold?: number;
  /** Khoảng cách gốc viewport (px) — dùng để kích hoạt sớm hơn. */
  rootMargin?: string;
  /** Chạy hiệu ứng một lần rồi dừng. */
  once?: boolean;
  /** Trì hoãn (ms) trước khi hiệu ứng chạy. */
  delay?: number;
};

/**
 * Hook theo dõi phần tử có xuất hiện trong khung nhìn để chạy hiệu ứng "reveal".
 *
 * Cơ chế kép để nội dung KHÔNG BAO GIỜ bị ẩn vĩnh viễn:
 *  1. IntersectionObserver — cách chính, nhẹ và chính xác.
 *  2. Kiểm tra theo vị trí scroll (fallback) — dùng khi observer không phát
 *     tín hiệu (tab nền, trình duyệt nhúng, thiết bị cũ).
 *
 * Ngoài ra nếu người dùng tắt animation (prefers-reduced-motion) thì hiện
 * nội dung ngay lập tức.
 */
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

    // Người dùng tắt animation → hiện luôn, không cần quan sát.
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

    /* 1. IntersectionObserver — cách chính */
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

    /* 2. Fallback theo vị trí scroll — bảo đảm nội dung luôn xuất hiện */
    const checkPosition = () => {
      frame = 0;
      if (doneRef.current) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      // Đã lọt khung nhìn (tính cả phần đã cuộn qua) → hiện.
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

import { useEffect, useRef, useState } from 'react';
import { useReveal } from '../../../hooks/useReveal';

interface CountUpProps {
  /** Giá trị đích. */
  value: number;
  /** Định dạng số sau khi đếm xong. */
  format?: (n: number) => string;
  /** Thời gian đếm (ms). */
  duration?: number;
  /** Số chữ số thập phân. */
  decimals?: number;
  className?: string;
}

/**
 * Số đếm tăng từ 0 lên giá trị đích khi phần tử lọt khung nhìn.
 * Dùng cho thẻ số liệu (dashboard admin/seller, thống kê trang chủ).
 */
export const CountUp = ({
  value,
  format = (n) => Math.round(n).toLocaleString('vi-VN'),
  duration = 1200,
  decimals = 0,
  className = '',
}: CountUpProps) => {
  const { ref, revealed } = useReveal<HTMLSpanElement>({ threshold: 0.4 });
  const [display, setDisplay] = useState(0);
  const frameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!revealed) return;

    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      // easeOutExpo — chạy nhanh rồi chậm dần, mượt mắt
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplay(value * eased);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [revealed, value, duration]);

  const shown = decimals > 0 ? display.toFixed(decimals) : format(display);

  return (
    <span ref={ref} className={`hz-count-up ${className}`.trim()}>
      {shown}
    </span>
  );
};

export default CountUp;

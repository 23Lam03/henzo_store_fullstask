import type { ElementType, ReactNode } from 'react';
import { useReveal } from '../../../hooks/useReveal';

type RevealDirection = 'up' | 'down' | 'left' | 'right' | 'scale' | 'blur';

interface RevealProps {
  children: ReactNode;
  /** Hướng chuyển động khi xuất hiện. */
  direction?: RevealDirection;
  /** Độ trễ (ms) — dùng để tạo hiệu ứng lần lượt. */
  delay?: number;
  /** Ngưỡng hiển thị (0–1). */
  threshold?: number;
  /** Chạy một lần rồi dừng. */
  once?: boolean;
  /** Thẻ HTML bọc ngoài. */
  as?: ElementType;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Bọc nội dung để chạy hiệu ứng "reveal" khi phần tử lọt khung nhìn.
 *
 * ```tsx
 * <Reveal direction="up" delay={120}>
 *   <section>…</section>
 * </Reveal>
 * ```
 */
export const Reveal = ({
  children,
  direction = 'up',
  delay = 0,
  threshold = 0.15,
  once = true,
  as: Tag = 'div',
  className = '',
  style,
}: RevealProps) => {
  const { ref, revealed } = useReveal<HTMLDivElement>({ threshold, delay, once });

  return (
    <Tag
      ref={ref}
      data-reveal={direction}
      className={`${revealed ? 'is-revealed' : ''} ${className}`.trim()}
      style={{ ...style, ['--reveal-delay' as string]: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
};

export default Reveal;

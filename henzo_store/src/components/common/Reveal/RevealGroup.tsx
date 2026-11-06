import type { ElementType, ReactNode } from 'react';
import { useReveal } from '../../../hooks/useReveal';

interface RevealGroupProps {
  children: ReactNode;
  /** Độ trễ (ms) của phần tử đầu tiên. */
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
 * Nhóm các phần tử con và hiện chúng lần lượt (stagger) khi lọt khung nhìn.
 *
 * ```tsx
 * <RevealGroup className="products-grid">
 *   {items.map(i => <Card key={i.id} … />)}
 * </RevealGroup>
 * ```
 */
export const RevealGroup = ({
  children,
  delay = 0,
  threshold = 0.1,
  once = true,
  as: Tag = 'div',
  className = '',
  style,
}: RevealGroupProps) => {
  const { ref, revealed } = useReveal<HTMLDivElement>({ threshold, delay, once });

  return (
    <Tag
      ref={ref}
      data-reveal-group=""
      className={`${revealed ? 'is-revealed' : ''} ${className}`.trim()}
      style={style}
    >
      {children}
    </Tag>
  );
};

export default RevealGroup;

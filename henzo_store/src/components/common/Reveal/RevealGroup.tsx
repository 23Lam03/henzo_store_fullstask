import type { ElementType, ReactNode } from 'react';
import { useReveal } from '../../../hooks/useReveal';

interface RevealGroupProps {
  children: ReactNode;
    delay?: number;
    threshold?: number;
    once?: boolean;
    as?: ElementType;
  className?: string;
  style?: React.CSSProperties;
}

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

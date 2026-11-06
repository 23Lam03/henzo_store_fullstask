import type { ElementType, ReactNode } from 'react';
import { useReveal } from '../../../hooks/useReveal';

type RevealDirection = 'up' | 'down' | 'left' | 'right' | 'scale' | 'blur';

interface RevealProps {
  children: ReactNode;
    direction?: RevealDirection;
    delay?: number;
    threshold?: number;
    once?: boolean;
    as?: ElementType;
  className?: string;
  style?: React.CSSProperties;
}

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

import './BrandMark.css';

type BrandMarkProps = {
  size?: number;
    tone?: 'light' | 'dark';
  className?: string;
};

export const BrandMark = ({ size = 34, tone = 'light', className = '' }: BrandMarkProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    aria-hidden="true"
    className={`brand-mark brand-mark--${tone} ${className}`.trim()}
  >
    <rect
      x="1.25"
      y="1.25"
      width="29.5"
      height="29.5"
      rx="2.5"
      stroke="currentColor"
      strokeOpacity="0.38"
      strokeWidth="1.5"
    />
    <path
      d="M10.5 8.5v15M21.5 8.5v15M10.5 16h11"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="square"
    />
  </svg>
);

export default BrandMark;

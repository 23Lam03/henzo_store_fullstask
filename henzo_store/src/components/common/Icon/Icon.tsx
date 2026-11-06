/**
 * Icon set tập trung cho toàn bộ giao diện.
 *
 * Mục tiêu: thay thế emoji (📱💻📦🎉...) bằng SVG vector — nhất quán về
 * nét vẽ, dễ tô màu theo theme (currentColor), không phụ thuộc font emoji
 * và không bị lệch trên Windows/macOS.
 *
 * Dùng: <Icon name="phone" size={20} /> hoặc import { Icon } từ '.../Icon'.
 */
import type { CSSProperties } from 'react';
import './Icon.css';

export type IconName =
  /* Danh mục / sản phẩm */
  | 'phone'
  | 'laptop'
  | 'desktop'
  | 'monitor'
  | 'mouse'
  | 'keyboard'
  | 'headphones'
  | 'plug'
  | 'package'
  | 'truck'
  | 'box'
  | 'tag'
  | 'cart'
  | 'trash'
  | 'gift'
  | 'ticket'
  | 'flash'
  | 'chart'
  /* Hành động / điều hướng */
  | 'search'
  | 'filter'
  | 'sort'
  | 'grid'
  | 'list'
  | 'menu'
  | 'close'
  | 'chevron-right'
  | 'chevron-left'
  | 'chevron-down'
  | 'chevron-up'
  | 'arrow-right'
  | 'arrow-left'
  | 'external'
  /* Trạng thái / thông báo */
  | 'check'
  | 'check-circle'
  | 'alert'
  | 'info'
  | 'clock'
  | 'trending'
  | 'star'
  | 'eye'
  | 'bell'
  | 'shield'
  | 'sparkles'
  /* Người dùng / liên hệ */
  | 'user'
  | 'users'
  | 'heart'
  | 'phone-call'
  | 'mail'
  | 'map-pin'
  | 'message'
  | 'wallet'
  | 'credit-card'
  /* Khác */
  | 'sun'
  | 'moon'
  | 'upload'
  | 'download'
  | 'edit'
  | 'plus'
  | 'minus'
  | 'more'
  | 'refresh'
  | 'lock'
  | 'logout'
  | 'settings'
  | 'dashboard'
  | 'store'
  | 'doc'
  | 'calendar';

interface IconProps {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
  style?: CSSProperties;
}

/** Đường dẫn SVG 24x24, dùng stroke cho nhất quán với phần còn lại của UI. */
const PATHS: Record<IconName, string> = {
  /* Danh mục / sản phẩm */
  phone:
    'M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm3 17h4',
  laptop:
    'M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9H4V5Zm-1 11h18l-1.5 3H4.5L3 16Z',
  desktop:
    'M3 4h18v11H3V4Zm6 15h6m-3-4v4',
  monitor:
    'M3 4h18v12H3V4Zm6 16h6m-3-4v4',
  mouse:
    'M12 2a6 6 0 0 0-6 6v8a6 6 0 0 0 12 0V8a6 6 0 0 0-6-6Zm0 0v6',
  keyboard:
    'M3 6h18v12H3V6Zm4 4h.01M11 10h.01M15 10h.01M7 14h10',
  headphones:
    'M4 15v-3a8 8 0 0 1 16 0v3M4 15a2 2 0 0 1 2-2h1v6H6a2 2 0 0 1-2-2v-2Zm16 0a2 2 0 0 0-2-2h-1v6h1a2 2 0 0 0 2-2v-2Z',
  plug: 'M9 2v6m6-6v6M6 8h12v3a6 6 0 0 1-12 0V8Zm6 9v5',
  package:
    'M21 8v8l-9 5-9-5V8l9-5 9 5Zm-18 0 9 5 9-5M12 13v8',
  truck:
    'M3 6h11v9H3V6Zm11 3h4l3 3v3h-7V9ZM7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm11 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  box: 'M3 7h18v13H3V7Zm0 0 3-4h12l3 4M9 20v-6h6v6',
  tag: 'M3 3h7l11 11-7 7L3 10V3Zm4.5 4.5h.01',
  cart: 'M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 8H6M10 21h.01M17 21h.01',
  trash: 'M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m3 0v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7m5 4v6m4-6v6',
  gift:
    'M3 11h18v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9Zm0 0V8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3M12 7v15',
  ticket:
    'M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Zm9-2v12',
  flash: 'M13 2 4 14h7l-1 8 9-12h-7l1-8Z',
  chart: 'M3 3v18h18M7 15v3m4-6v6m4-9v9m4-12v12',
  /* Hành động / điều hướng */
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-4.35-4.35',
  filter: 'M3 5h18l-7 8v6l-4 2v-8L3 5Z',
  sort: 'M7 4v16m0 0-3-3m3 3 3-3M17 20V4m0 0-3 3m3-3 3 3',
  grid: 'M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z',
  list: 'M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01',
  menu: 'M3 6h18M3 12h18M3 18h18',
  close: 'M18 6 6 18M6 6l12 12',
  'chevron-right': 'm9 18 6-6-6-6',
  'chevron-left': 'm15 18-6-6 6-6',
  'chevron-down': 'm6 9 6 6 6-6',
  'chevron-up': 'm18 15-6-6-6 6',
  'arrow-right': 'M5 12h14m-6-6 6 6-6 6',
  'arrow-left': 'M19 12H5m6 6-6-6 6-6',
  external: 'M14 4h6v6M20 4l-9 9M18 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5',
  /* Trạng thái / thông báo */
  check: 'm5 13 4 4L19 7',
  'check-circle': 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-4-9 3 3 5-5',
  alert:
    'M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-9v4m0-8h.01',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-14v5l3 2',
  trending: 'm3 17 6-6 4 4 8-8m0 0h-5m5 0v5',
  star: 'm12 3 2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.8-5.4 2.8 1-6L3.3 9.4l6-.9L12 3Z',
  eye: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Zm-3-10 2 2 4-4',
  sparkles: 'm12 3 1.9 4.6L18.5 9l-4.6 1.4L12 15l-1.9-4.6L5.5 9l4.6-1.4L12 3ZM19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2Z',
  /* Người dùng / liên hệ */
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  users:
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  heart:
    'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21.2l7.8-7.7 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z',
  'phone-call':
    'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z',
  mail: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm18 2-10 7L2 6',
  'map-pin': 'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Zm-8 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  message: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z',
  wallet:
    'M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5m14 8h.01',
  'credit-card':
    'M3 6h18v12H3V6Zm0 4h18M7 14h3',
  /* Khác */
  sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0-14v2m0 18v-2M5.6 5.6 7 7m10 10 1.4 1.4M3 12h2m14 0h2M5.6 18.4 7 17m10-10 1.4-1.4',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z',
  upload: 'M12 16V4m0 0L8 8m4-4 4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2',
  download: 'M12 4v12m0 0-4-4m4 4 4-4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2',
  edit: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  more: 'M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm6 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm-12 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z',
  refresh: 'M21 12a9 9 0 1 1-2.6-6.4M21 4v5h-5',
  lock: 'M6 11h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Zm2 0V7a4 4 0 0 1 8 0v4',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14 5-5-5-5m5 5H9',
  settings:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8.4-3a8.4 8.4 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a8.5 8.5 0 0 0-2-1.2L15.5 2h-4l-.4 2.6a8.5 8.5 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a8.4 8.4 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a8.5 8.5 0 0 0 2 1.2l.4 2.6h4l.4-2.6a8.5 8.5 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2Z',
  dashboard:
    'M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-16v4h6V4h-6Z',
  store:
    'M3 9V6l2-3h14l2 3v3M3 9h18m-2 0v11H5V9M9 20v-6h6v6',
  doc: 'M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7l-5-5Zm0 0v5h5M9 13h6m-6 4h6',
  calendar:
    'M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z',
};

/** Icon dạng đầy (fill) thay vì stroke — dùng cho rating, badge nền đặc. */
const FILLED: IconName[] = ['star', 'flash', 'sparkles'];

export const Icon = ({
  name,
  size = 20,
  strokeWidth = 1.75,
  className,
  style,
}: IconProps) => {
  const filled = FILLED.includes(name);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  );
};

/** Icon tròn nền màu nhạt — dùng cho các "stat card", "feature icon". */
export const IconBadge = ({
  name,
  size = 20,
  tone = 'primary',
  className,
}: IconProps & { tone?: 'primary' | 'success' | 'warning' | 'danger' | 'accent' | 'neutral' }) => {
  return (
    <span className={`icon-badge icon-badge--${tone} ${className || ''}`}>
      <Icon name={name} size={size} />
    </span>
  );
};

export default Icon;

/**
 * Bảng ảnh chuẩn theo danh mục sản phẩm.
 *
 * Mỗi ảnh đã được kiểm chứng bằng **Vision framework** (macOS) là đúng loại
 * thiết bị trong danh mục, và đã kiểm tra HTTP 200 (không chết).
 *
 * Ảnh Unsplash có giấy phép dùng miễn phí cho thương mại.
 */

/** Ảnh điện thoại — Vision: consumer_electronics/machine. */
export const PHONE_IMAGES = [
  'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600',
  'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600',
  'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600',
  'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600',
  'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600',
  'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600',
  'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=600',
  'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=600',
];

/** Ảnh laptop — Vision: computer/laptop 36-83%. */
export const LAPTOP_IMAGES = [
  'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600',
  'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=600',
  'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600',
  'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600',
  'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=600',
  'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600',
];

/** Ảnh PC gaming — Vision: computer/monitor/circuit_board. */
export const PC_GAMING_IMAGES = [
  'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=600',
  'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=600',
  'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=600',
];

/** Ảnh màn hình — Vision: computer_monitor/computer_keyboard/television. */
export const MONITOR_IMAGES = [
  'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600',
  'https://images.unsplash.com/photo-1547394765-185e1e68f34e?w=600',
];

/** Ảnh chuột — Vision: computer_mouse 78-94%. */
export const MOUSE_IMAGES = [
  'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600',
  'https://images.unsplash.com/photo-1586816879360-004f5b0c51e5?w=600',
];

/** Ảnh bàn phím — Vision: keyboard/keypad/media. */
export const KEYBOARD_IMAGES = [
  'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=600',
  'https://images.unsplash.com/photo-1601597111158-2fceff292cdc?w=600',
];

/** Ảnh tai nghe — Vision: headphones 58-90%. */
export const HEADPHONE_IMAGES = [
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600',
  'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600',
  'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600',
];

/** Ảnh phụ kiện — ảnh thiết bị điện tử chung. */
export const ACCESSORY_IMAGES = [
  'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=600',
  'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=600',
  'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=600',
];

/** Bản đồ danh mục -> danh sách ảnh hợp lệ. */
export const CATEGORY_IMAGES: Record<string, string[]> = {
  'Điện thoại': PHONE_IMAGES,
  Laptop: LAPTOP_IMAGES,
  'PC Gaming': PC_GAMING_IMAGES,
  'Màn hình': MONITOR_IMAGES,
  Chuột: MOUSE_IMAGES,
  'Bàn phím': KEYBOARD_IMAGES,
  'Tai nghe': HEADPHONE_IMAGES,
  'Phụ kiện': ACCESSORY_IMAGES,
};

/**
 * Ảnh dùng khi danh mục không có trong bảng — ảnh thiết bị điện tử chung.
 */
export const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=600',
  'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=600',
];

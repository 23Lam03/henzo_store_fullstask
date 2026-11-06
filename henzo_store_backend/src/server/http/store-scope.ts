/**
 * Tiện ích xác định "phạm vi cửa hàng" (`storeScope`) cho các endpoint seller.
 *
 * Bối cảnh:
 * - `SHOP`  -> luôn gắn với đúng một cửa hàng (`user.storeId`).
 * - `ADMIN` -> có thể xem một cửa hàng cụ thể (`?storeId=xxx`) hoặc xem
 *   **toàn bộ** cửa hàng khi không truyền `storeId`.
 *
 * Vì `storeScope` có thể `undefined` (admin xem tất cả), các route KHÔNG được
 * tự ý dùng nó làm chuỗi — phải đi qua helper ở đây để:
 *  1. `find()` vẫn cast chuỗi -> ObjectId, nhưng `aggregate()` thì KHÔNG cast.
 *     => mọi `$match` phải dùng `aggMatch()` (đã ép kiểu ObjectId).
 *  2. Thao tác ghi (tạo/sửa/xoá) luôn cần một `storeId` cụ thể.
 */
import { Types } from 'mongoose';
import { forbidden } from './errors';

/** ObjectId hợp lệ từ chuỗi, hoặc `undefined` nếu chuỗi rỗng/không hợp lệ. */
export function toStoreObjectId(storeId?: string | null): Types.ObjectId | undefined {
  if (!storeId) return undefined;
  if (!/^[0-9a-fA-F]{24}$/.test(storeId)) return undefined;
  return new Types.ObjectId(storeId);
}

/** Filter cho `find()` — rỗng khi admin xem toàn bộ cửa hàng. */
export function storeFilter(storeId?: string): Record<string, any> {
  return storeId ? { storeId } : {};
}

/**
 * Filter chỉ gồm bản ghi **có** `storeId` — dùng cho collection có thể chứa
 * cả bản ghi của khách hàng (vd: notification gửi cho khách).
 */
export function storeOnlyFilter(storeId?: string): Record<string, any> {
  return storeId ? { storeId } : { storeId: { $exists: true, $ne: null } };
}

/** Filter cho `subOrders.storeId` trong collection `orders`. */
export function subOrderStoreFilter(storeId?: string): Record<string, any> {
  return storeId ? { 'subOrders.storeId': storeId } : {};
}

/**
 * `$match` cho aggregation pipeline.
 *
 * Rất quan trọng: MongoDB **không** tự ép chuỗi sang ObjectId trong pipeline
 * aggregate (khác với `find()`), nên truyền chuỗi sẽ khớp 0 bản ghi và mọi
 * số liệu tổng hợp (summary / statusCounts / distribution) sẽ ra 0.
 */
export function aggMatch(storeId?: string): Record<string, any> {
  const oid = toStoreObjectId(storeId);
  return oid ? { storeId: oid } : {};
}

/** `$match` cho `subOrders.storeId` trong aggregation. */
export function aggSubOrderMatch(storeId?: string): Record<string, any> {
  const oid = toStoreObjectId(storeId);
  return oid ? { 'subOrders.storeId': oid } : {};
}

export interface StoreScope {
  /** storeId cụ thể; `undefined` khi admin xem toàn bộ cửa hàng. */
  readonly storeId?: string;
  /** `true` khi admin đang xem toàn bộ cửa hàng. */
  readonly allStores: boolean;
  /** Bắt buộc có storeId cụ thể — dùng cho mọi thao tác ghi. */
  require(): string;
  /** Filter `find()` theo cửa hàng. */
  filter(): Record<string, any>;
  /** Filter chỉ gồm bản ghi có `storeId`. */
  storeOnlyFilter(): Record<string, any>;
  /** Filter `subOrders.storeId` cho collection `orders`. */
  subOrderFilter(): Record<string, any>;
  /** `$match` (đã ép ObjectId) cho aggregation theo cửa hàng. */
  aggMatch(): Record<string, any>;
  /** `$match` (đã ép ObjectId) cho aggregation theo `subOrders.storeId`. */
  aggSubOrderMatch(): Record<string, any>;
}

/**
 * Đọc `storeScope` từ context của request (do `requireStoreOwner` gán).
 */
export function getStoreScope(context: any): StoreScope {
  const storeId = (context as any)?.storeScope as string | undefined;
  const role = (context as any)?.auth?.role as string | undefined;
  const allStores = !storeId && role === 'ADMIN';

  const scope: StoreScope = {
    storeId: storeId || undefined,
    allStores,
    require() {
      if (!storeId) {
        throw forbidden(
          'Vui lòng chọn một cửa hàng cụ thể để thực hiện thao tác này.',
        );
      }
      return storeId;
    },
    filter: () => storeFilter(storeId),
    storeOnlyFilter: () => storeOnlyFilter(storeId),
    subOrderFilter: () => subOrderStoreFilter(storeId),
    aggMatch: () => aggMatch(storeId),
    aggSubOrderMatch: () => aggSubOrderMatch(storeId),
  };

  return scope;
}

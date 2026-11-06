import { Types } from 'mongoose';
import { forbidden } from './errors';

export function toStoreObjectId(storeId?: string | null): Types.ObjectId | undefined {
  if (!storeId) return undefined;
  if (!/^[0-9a-fA-F]{24}$/.test(storeId)) return undefined;
  return new Types.ObjectId(storeId);
}

export function storeFilter(storeId?: string): Record<string, any> {
  return storeId ? { storeId } : {};
}

export function storeOnlyFilter(storeId?: string): Record<string, any> {
  return storeId ? { storeId } : { storeId: { $exists: true, $ne: null } };
}

export function subOrderStoreFilter(storeId?: string): Record<string, any> {
  return storeId ? { 'subOrders.storeId': storeId } : {};
}

export function aggMatch(storeId?: string): Record<string, any> {
  const oid = toStoreObjectId(storeId);
  return oid ? { storeId: oid } : {};
}

export function aggSubOrderMatch(storeId?: string): Record<string, any> {
  const oid = toStoreObjectId(storeId);
  return oid ? { 'subOrders.storeId': oid } : {};
}

export interface StoreScope {
    readonly storeId?: string;
    readonly allStores: boolean;
    require(): string;
    filter(): Record<string, any>;
    storeOnlyFilter(): Record<string, any>;
    subOrderFilter(): Record<string, any>;
    aggMatch(): Record<string, any>;
    aggSubOrderMatch(): Record<string, any>;
}

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

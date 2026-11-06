import { Schema, type InferSchemaType } from 'mongoose';
import { defineModel } from './registry';
import { InventoryStatus } from '../constants';

const inventorySchema = new Schema(
  {
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    productName: { type: String, default: '' },
    productImage: { type: String, default: '' },
    category: { type: String, default: '' },
    sku: { type: String, required: true, index: true },

    stock: { type: Number, default: 0, min: 0 },
    minStock: { type: Number, default: 10, min: 0 },
    reserved: { type: Number, default: 0, min: 0 },
        available: { type: Number, default: 0, min: 0 },
    sold: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: Object.values(InventoryStatus),
      default: InventoryStatus.IN_STOCK,
      index: true,
    },
    lastRestocked: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

inventorySchema.index({ storeId: 1, sku: 1 }, { unique: true });
inventorySchema.index({ storeId: 1, status: 1 });

export type InventoryDoc = InferSchemaType<typeof inventorySchema>;

export const InventoryModel = defineModel('Inventory', inventorySchema);

export function recalcInventory(stock: number, minStock: number, reserved: number) {
  const status =
    stock === 0
      ? InventoryStatus.OUT_OF_STOCK
      : stock < minStock
        ? InventoryStatus.LOW_STOCK
        : InventoryStatus.IN_STOCK;
  return { status, available: Math.max(0, stock - reserved) };
}

export function toInventoryDto(item: any) {
  if (!item) return null;
  const obj = item.toObject ? item.toObject() : { ...item };
  delete obj.__v;
  return {
    sku: obj.sku,
    productId: obj.productId ? String(obj.productId) : '',
    productName: obj.productName ?? '',
    productImage: obj.productImage ?? '',
    category: obj.category ?? '',
    stock: obj.stock ?? 0,
    minStock: obj.minStock ?? 0,
    sold: obj.sold ?? 0,
    reserved: obj.reserved ?? 0,
    available: obj.available ?? 0,
    status: obj.status ?? InventoryStatus.IN_STOCK,
    lastRestocked: obj.lastRestocked,
    storeId: obj.storeId ? String(obj.storeId) : '',
  };
}

import { Types } from 'mongoose';
import { ProductModel } from '../models/Product';
import { InventoryModel, recalcInventory } from '../models/Inventory';

export const RESTORABLE_SUB_STATUSES = [
  'pending',
  'confirmed',
  'preparing',
] as const;

export function canRestoreSubOrder(status: string): boolean {
  return (RESTORABLE_SUB_STATUSES as readonly string[]).includes(status);
}

export async function restoreStockForSubOrders(subOrders: any[]): Promise<number> {
  if (!Array.isArray(subOrders) || !subOrders.length) return 0;

  const restorable = subOrders.filter((sub) =>
    canRestoreSubOrder(String(sub?.status ?? '')),
  );

  if (!restorable.length) return 0;

  const quantities = new Map<string, number>();
  for (const sub of restorable) {
    for (const item of sub?.items ?? []) {
      const key = String(item.productId);
      const qty = Number(item.quantity ?? 0);
      if (!qty || qty <= 0) continue;
      quantities.set(key, (quantities.get(key) ?? 0) + qty);
    }
  }

  if (!quantities.size) return 0;

  let restored = 0;

  for (const [productId, qty] of quantities) {
    if (!Types.ObjectId.isValid(productId)) continue;

    await ProductModel.updateOne(
      { _id: productId },
      [
        {
          $set: {
            stock: { $add: [{ $ifNull: ['$stock', 0] }, qty] },
            sold: {
              $max: [0, { $subtract: [{ $ifNull: ['$sold', 0] }, qty] }],
            },
          },
        },
      ],
      { updatePipeline: true },
    );

    restored += qty;

    const product = await ProductModel.findById(productId)
      .select('sku stock minStock reserved storeId')
      .lean();
    if (!product?.sku) continue;

    const newStock = (product.stock ?? 0) + qty;
    const { status, available } = recalcInventory(
      newStock,
      product.minStock ?? 10,
      product.reserved ?? 0,
    );

    await InventoryModel.updateOne(
      { storeId: product.storeId, sku: product.sku },
      {
        $set: {
          stock: newStock,
          minStock: product.minStock ?? 10,
          reserved: product.reserved ?? 0,
          available,
          status,
          lastRestocked: new Date(),
        },
      },
    );
  }

  return restored;
}

export async function deductStock(
  productId: Types.ObjectId | string,
  quantity: number,
): Promise<boolean> {
  const qty = Number(quantity ?? 0);
  if (!qty || qty <= 0) return true;

  const result = await ProductModel.updateOne(
    {
      _id: productId,
      $expr: {
        $gte: [{ $subtract: ['$stock', { $ifNull: ['$reserved', 0] }] }, qty],
      },
    },
    { $inc: { stock: -qty, sold: qty } },
  );

  return (result.modifiedCount ?? 0) > 0;
}

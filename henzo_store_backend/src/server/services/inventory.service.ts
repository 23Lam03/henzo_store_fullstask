/**
 * Nghiệp vụ tồn kho — dùng chung cho mọi luồng đặt/hủy đơn.
 *
 * Nguyên tắc:
 * - Mỗi sản phẩm được trừ khi đặt hàng và hoàn lại khi đơn bị hủy.
 * - Chỉ hoàn cho phần **thực sự bị hủy** (sub-order chưa rời kho). Sản phẩm
 *   đã giao (`shipped`/`delivering`/`delivered`) không được hoàn lại.
 * - Thao tác **idempotent**: cùng một sub-order bị hoàn 2 lần chỉ hoàn 1 lần,
 *   và `sold` không bao giờ bị đẩy xuống dưới 0.
 *
 * Cách dùng: caller xác định chính xác những sub-order vừa được chuyển sang
 * trạng thái hủy, rồi truyền vào `restoreStockForSubOrders`.
 */
import { Types } from 'mongoose';
import { ProductModel } from '../models/Product';
import { InventoryModel, recalcInventory } from '../models/Inventory';

/**
 * Sub-order có thể hoàn tồn kho.
 * - `pending`/`confirmed`/`preparing`: hàng còn ở kho -> hoàn được.
 * - `shipped`/`delivering`/`delivered`: hàng đã rời kho -> KHÔNG hoàn.
 * - `cancelled`/`returned`: đã xử lý hoàn trước đó -> không hoàn lần nữa.
 */
export const RESTORABLE_SUB_STATUSES = [
  'pending',
  'confirmed',
  'preparing',
] as const;

/** Sub-order có thể hoàn tồn kho chưa. */
export function canRestoreSubOrder(status: string): boolean {
  return (RESTORABLE_SUB_STATUSES as readonly string[]).includes(status);
}

/**
 * Hoàn tồn kho cho một danh sách sub-order.
 *
 * Hàm này **tự bảo vệ tính idempotent**: chỉ hoàn cho sub-order còn ở kho
 * (`pending`/`confirmed`/`preparing`). Sub-order đã chuyển sang `cancelled`
 * (hoặc đã giao) sẽ bị bỏ qua — nên gọi lại lần hai không cộng tồn kho thêm.
 *
 * Vì vậy caller phải gọi hàm này **trước** khi đổi `sub.status` sang
 * `cancelled`. Trạng thái trong DB là nguồn sự thật duy nhất.
 *
 * @param subOrders  Các sub-order cần hoàn tồn kho (snapshot trước khi đổi status).
 * @returns Tổng số lượng đã hoàn lại.
 */
export async function restoreStockForSubOrders(subOrders: any[]): Promise<number> {
  if (!Array.isArray(subOrders) || !subOrders.length) return 0;

  // Chỉ hoàn sub-order còn ở kho — sub-order đã hủy/đã giao thì bỏ qua.
  const restorable = subOrders.filter((sub) =>
    canRestoreSubOrder(String(sub?.status ?? '')),
  );

  if (!restorable.length) return 0;

  // Gom sản phẩm theo productId (nhiều dòng có thể trùng sản phẩm).
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

    // Dùng aggregation pipeline thay vì `$inc`:
    // - `stock` cộng thêm qty
    // - `sold` trừ qty nhưng giao trị tuyệt đối về 0 (không bao giờ âm)
    //
    // Mongoose yêu cầu `updatePipeline: true` khi truyền mảng update.
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

    // Đồng bộ dòng kho theo SKU (nếu sản phẩm có bản ghi inventory).
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

/**
 * Trừ tồn kho khi đặt hàng — có điều kiện để tránh âm kho.
 *
 * Chỉ trừ khi còn đủ hàng khả dụng (`stock - reserved >= qty`), nếu không
 * trả về `false` để caller báo lỗi cho khách.
 */
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

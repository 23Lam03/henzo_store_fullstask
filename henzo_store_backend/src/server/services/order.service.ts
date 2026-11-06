/**
 * Nghiệp vụ giỏ hàng & đặt hàng.
 *
 * BẤT KỲ client nào được tin cậy về giá hay tồn kho:
 * - Giá luôn lấy từ Product trong DB.
 * - Tồn kho luôn kiểm tra lại lúc thêm và lúc đặt hàng.
 * - Phí vận chuyển & voucher do server tính.
 */
import { Types } from 'mongoose';
import { CartModel } from '../models/Cart';
import { ProductModel, toProductDto, computeDiscount } from '../models/Product';
import { OrderModel } from '../models/Order';
import { PaymentModel } from '../models/Payment';
import { VoucherModel } from '../models/Promotion';
import { UserModel } from '../models/User';
import { NotificationModel } from '../models/Notification';
import { StoreModel } from '../models/Store';
import { badRequest, notFound, conflict, unprocessable } from '../http/errors';
import {
  CustomerOrderStatus,
  DiscountType,
  FREE_SHIPPING_THRESHOLD,
  OrderPaymentStatus,
  PAYMENT_METHOD_ALIASES,
  PaymentMethodValue,
  PLATFORM_FEE_RATE,
  SHIPPING_FEE,
  SellerOrderStatus,
  TransactionStatus,
} from '../constants';
import { buildOrderNumber, buildTransactionId } from '../auth/tokens';
import { deductStock } from './inventory.service';

// ─── Giỏ hàng ─────────────────────────────────────────────────────────────────

export interface CartItemDto {
  product: any;
  quantity: number;
  selected: boolean;
}

/** Lấy giỏ hàng (kèm thông tin sản phẩm đầy đủ + tổng tiền). */
export async function getCart(userId: string) {
  const cart = await CartModel.findOne({ userId }).lean();

  const items = cart?.items ?? [];

  // Lấy thông tin sản phẩm mới nhất (giá/stock có thể đã thay đổi).
  const productIds = items.map((i: any) => i.productId);
  const products = await ProductModel.find({
    _id: { $in: productIds },
  }).lean();
  const productMap = new Map(products.map((p) => [String(p._id), p]));

  const dtoItems: CartItemDto[] = items
    .map((item: any) => {
      const product = productMap.get(String(item.productId));
      if (!product) return null;
      return {
        product: toProductDto(product),
        quantity: item.quantity,
        selected: item.selected ?? true,
      };
    })
    .filter(Boolean) as CartItemDto[];

  const totalItems = dtoItems.reduce((sum, i) => sum + i.quantity, 0);
  const selectedItems = dtoItems.filter((i) => i.selected);

  const totalPrice = selectedItems.reduce(
    (sum, i) => sum + i.product.price * i.quantity,
    0,
  );
  const totalOriginalPrice = selectedItems.reduce(
    (sum, i) => sum + i.product.originalPrice * i.quantity,
    0,
  );

  return {
    items: dtoItems,
    totalItems,
    totalPrice,
    totalOriginalPrice,
    savings: totalOriginalPrice - totalPrice,
    shippingFee:
      totalPrice >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE,
  };
}

/** Thêm sản phẩm vào giỏ. Tự cộng dồn nếu đã có. */
export async function addToCart(
  userId: string,
  productId: string,
  quantity: number,
) {
  if (!Types.ObjectId.isValid(productId)) {
    throw badRequest('Sản phẩm không hợp lệ');
  }
  if (!Number.isFinite(quantity) || quantity < 1) {
    throw badRequest('Số lượng không hợp lệ');
  }

  const product = await ProductModel.findById(productId).lean();
  if (!product) throw notFound('Không tìm thấy sản phẩm');
  if (product.status !== 'active') {
    throw badRequest('Sản phẩm hiện không còn bán');
  }

  const cart = await CartModel.findOne({ userId });
  const existing = cart?.items.find(
    (i: any) => String(i.productId) === String(productId),
  );

  const currentQty = existing?.quantity ?? 0;
  const newQty = currentQty + quantity;

  // Không cho vượt quá tồn kho thực tế.
  if (newQty > product.stock) {
    throw unprocessable(
      product.stock === 0
        ? 'Sản phẩm đã hết hàng'
        : `Chỉ còn ${product.stock} sản phẩm trong kho`,
    );
  }

  if (cart) {
    if (existing) {
      existing.quantity = newQty;
      existing.selected = true;
      existing.unitPrice = product.price;
    } else {
      cart.items.push({
        productId: product._id,
        quantity,
        selected: true,
        unitPrice: product.price,
      } as any);
    }
    await cart.save();
  } else {
    await CartModel.create({
      userId,
      items: [
        {
          productId: product._id,
          quantity,
          selected: true,
          unitPrice: product.price,
        },
      ],
    });
  }
  return getCart(userId);
}

/** Cập nhật số lượng (0 => xoá). */
export async function updateCartItem(
  userId: string,
  productId: string,
  quantity: number,
) {
  const cart = await CartModel.findOne({ userId });
  if (!cart) throw notFound('Giỏ hàng không tồn tại');

  const item = cart.items.find((i: any) => String(i.productId) === String(productId));
  if (!item) throw notFound('Sản phẩm không có trong giỏ hàng');

  if (quantity <= 0) {
    cart.items.pull(item._id);
  } else {
    const product = await ProductModel.findById(productId).lean();
    if (!product) throw notFound('Không tìm thấy sản phẩm');
    if (quantity > product.stock) {
      throw unprocessable(`Chỉ còn ${product.stock} sản phẩm trong kho`);
    }
    item.quantity = quantity;
    item.unitPrice = product.price;
  }

  await cart.save();
  return getCart(userId);
}

/** Chọn / bỏ chọn một sản phẩm. */
export async function toggleCartItem(
  userId: string,
  productId: string,
  selected: boolean,
) {
  const cart = await CartModel.findOne({ userId });
  if (!cart) throw notFound('Giỏ hàng không tồn tại');

  const item = cart.items.find((i: any) => String(i.productId) === String(productId));
  if (!item) throw notFound('Sản phẩm không có trong giỏ hàng');

  item.selected = selected;
  await cart.save();
  return getCart(userId);
}

/** Chọn tất cả / bỏ chọn tất cả. */
export async function selectAllCartItems(userId: string, selected: boolean) {
  const cart = await CartModel.findOne({ userId });
  if (!cart) throw notFound('Giỏ hàng không tồn tại');

  for (const item of cart.items) item.selected = selected;
  await cart.save();
  return getCart(userId);
}

/** Xoá một sản phẩm khỏi giỏ. */
export async function removeCartItem(userId: string, productId: string) {
  const cart = await CartModel.findOne({ userId });
  if (!cart) throw notFound('Giỏ hàng không tồn tại');

  const item = cart.items.find((i: any) => String(i.productId) === String(productId));
  if (!item) throw notFound('Sản phẩm không có trong giỏ hàng');

  cart.items.pull(item._id);
  await cart.save();
  return getCart(userId);
}

/** Xoá toàn bộ giỏ (hoặc chỉ các mục đang chọn). */
export async function clearCart(userId: string, onlySelected = false) {
  const cart = await CartModel.findOne({ userId });
  if (!cart) return getCart(userId);

  if (onlySelected) {
    const removed = cart.items.filter((i: any) => i.selected).map((i: any) => i._id);
    cart.items.pull({ _id: { $in: removed } });
  } else {
    // `cart.items` là DocumentArray — dùng pull để giữ đúng kiểu.
    cart.items.pull({});
  }

  await cart.save();
  return getCart(userId);
}

// ─── Voucher ──────────────────────────────────────────────────────────────────

export interface VoucherResult {
  discount: number;
  voucher: any;
}

/**
 * Kiểm tra voucher & tính số tiền giảm.
 * Điều kiện: đang hiệu lực, đủ đơn tối thiểu, chưa hết lượt, chưa hết hạn.
 */
export async function resolveVoucher(
  code: string,
  subtotal: number,
  userId?: string,
  storeIds?: string[],
): Promise<VoucherResult> {
  const voucher = await VoucherModel.findOne({
    code: code.toUpperCase().trim(),
  }).lean();

  if (!voucher) throw notFound('Mã giảm giá không tồn tại');
  if (voucher.status !== 'active') {
    throw badRequest('Mã giảm giá không còn hiệu lực');
  }

  const now = Date.now();
  if (new Date(voucher.startDate).getTime() > now) {
    throw badRequest('Mã giảm giá chưa bắt đầu');
  }
  if (new Date(voucher.endDate).getTime() < now) {
    throw badRequest('Mã giảm giá đã hết hạn');
  }

  if (voucher.usageLimit > 0 && voucher.usedCount >= voucher.usageLimit) {
    throw badRequest('Mã giảm giá đã hết lượt sử dụng');
  }

  if (voucher.minOrderValue > 0 && subtotal < voucher.minOrderValue) {
    throw badRequest(
      `Đơn hàng tối thiểu ${voucher.minOrderValue.toLocaleString('vi-VN')}đ để dùng mã này`,
    );
  }

  // Voucher giới hạn theo cửa hàng.
  if (voucher.storeId && storeIds?.length) {
    if (!storeIds.includes(String(voucher.storeId))) {
      throw badRequest('Mã giảm giá không áp dụng cho cửa hàng này');
    }
  }

  let discount = 0;
  if (voucher.discountType === DiscountType.PERCENT) {
    discount = Math.floor((subtotal * voucher.discountValue) / 100);
    if (voucher.maxDiscount > 0) {
      discount = Math.min(discount, voucher.maxDiscount);
    }
  } else if (voucher.discountType === DiscountType.FIXED) {
    discount = voucher.discountValue;
  } else {
    // shipping: giảm tối đa phí vận chuyển.
    discount = Math.min(voucher.discountValue, SHIPPING_FEE);
  }

  discount = Math.min(discount, subtotal);

  return { discount, voucher };
}

// ─── Đặt hàng ─────────────────────────────────────────────────────────────────

/**
 * Chia đều một khoản tiền cho N phần mà **tổng luôn bằng số tiền gốc**.
 *
 * Chia đều rồi gán phần dư cho các phần đầu (vd 30.000 cho 7 phần ->
 * 4 phần đầu nhận 4.286, 3 phần sau nhận 4.285, tổng vẫn đúng 30.000).
 */
export function distributeEvenly(total: number, parts: number): number[] {
  if (parts <= 0) return [];
  const base = Math.floor(total / parts);
  const remainder = total - base * parts;
  return Array.from({ length: parts }, (_, i) =>
    i < remainder ? base + 1 : base,
  );
}

/**
 * Chia khoản tiền theo tỷ trọng (trọng số) của từng phần.
 * Phần dư do làm tròn được gán cho phần có trọng số lớn nhất.
 *
 * @param total Tổng tiền cần chia.
 * @param weights Trọng số (tổng bằng 0 -> chia đều).
 */
export function distributeByWeight(total: number, weights: number[]): number[] {
  if (!weights.length) return [];
  const sum = weights.reduce((s, w) => s + (w > 0 ? w : 0), 0);
  if (sum <= 0) return distributeEvenly(total, weights.length);

  const raw = weights.map((w) => (total * (w > 0 ? w : 0)) / sum);
  const floored = raw.map((r) => Math.floor(r));
  let remainder = total - floored.reduce((s, v) => s + v, 0);

  // Gán phần dư cho các phần có trọng số lớn nhất trước.
  const order = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac);

  const result = [...floored];
  for (const { i } of order) {
    if (remainder <= 0) break;
    result[i] += 1;
    remainder -= 1;
  }

  return result;
}

export interface CreateOrderInput {
  items?: { productId: string; quantity: number }[];
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingProvince?: string;
  shippingDistrict?: string;
  shippingWard?: string;
  note?: string;
  paymentMethod: string;
  voucherCode?: string;
}

export function normalizePaymentMethod(raw: string): PaymentMethodValue {
  const key = raw?.trim();
  const mapped =
    PAYMENT_METHOD_ALIASES[key] ??
    PAYMENT_METHOD_ALIASES[key?.toLowerCase()] ??
    PAYMENT_METHOD_ALIASES[key?.toUpperCase()];
  if (!mapped) throw badRequest('Phương thức thanh toán không hợp lệ');
  return mapped;
}

/**
 * Tạo đơn hàng.
 *
 * Luồng:
 * 1. Gom items theo cửa hàng -> tạo sub-order cho từng store.
 * 2. Tính tiền server-side: subtotal, shipping (miễn phí >= 500k), voucher.
 * 3. Trừ tồn kho.
 * 4. Tạo giao dịch thanh toán + thông báo cho khách & các seller.
 */
export async function createOrder(userId: string, input: CreateOrderInput) {
  const user = await UserModel.findById(userId).lean();
  if (!user) throw notFound('Người dùng không tồn tại');

  // ─── 1. Chuẩn bị danh sách sản phẩm ───────────────────────────────────
  let requested: { productId: string; quantity: number }[] = input.items ?? [];

  // Không truyền items -> lấy các mục đang chọn trong giỏ.
  if (!requested.length) {
    const cart = await CartModel.findOne({ userId }).lean();
    requested = (cart?.items ?? [])
      .filter((i: any) => i.selected)
      .map((i: any) => ({ productId: String(i.productId), quantity: i.quantity }));
  }

  if (!requested.length) {
    throw badRequest('Giỏ hàng đang trống');
  }

  const productIds = requested.map((r) => r.productId);
  if (!productIds.every((id) => Types.ObjectId.isValid(id))) {
    throw badRequest('Danh sách sản phẩm không hợp lệ');
  }

  const products = await ProductModel.find({
    _id: { $in: productIds },
  }).lean();
  const productMap = new Map(products.map((p) => [String(p._id), p]));

  // ─── 2. Gom theo cửa hàng & kiểm tra tồn kho ──────────────────────────
  interface GroupItem {
    productId: Types.ObjectId;
    productName: string;
    productImage: string;
    productSlug: string;
    sku: string;
    unitPrice: number;
    quantity: number;
    totalPrice: number;
    storeId: Types.ObjectId;
    storeName: string;
  }

  const groups = new Map<string, { storeId: Types.ObjectId; storeName: string; items: GroupItem[] }>();

  for (const req of requested) {
    const product = productMap.get(String(req.productId));
    if (!product) throw notFound(`Sản phẩm không tồn tại`);
    if (product.status !== 'active') {
      throw badRequest(`Sản phẩm "${product.name}" hiện không còn bán`);
    }
    if (req.quantity < 1) throw badRequest('Số lượng không hợp lệ');

    const available = product.stock - (product.reserved ?? 0);
    if (available <= 0) {
      throw unprocessable(`Sản phẩm "${product.name}" đã hết hàng`);
    }
    if (req.quantity > available) {
      throw unprocessable(
        `Sản phẩm "${product.name}" chỉ còn ${available} trong kho`,
      );
    }

    const storeId = product.storeId as Types.ObjectId;
    if (!storeId) {
      throw badRequest(`Sản phẩm "${product.name}" chưa thuộc cửa hàng nào`);
    }

    const key = String(storeId);
    const group = groups.get(key) ?? {
      storeId,
      storeName: '',
      items: [],
    };

    group.items.push({
      productId: product._id as Types.ObjectId,
      productName: product.name,
      productImage: product.images?.[0] ?? '',
      productSlug: product.slug,
      sku: product.sku ?? '',
      unitPrice: product.price,
      quantity: req.quantity,
      totalPrice: product.price * req.quantity,
      storeId,
      storeName: group.storeName,
    });

    groups.set(key, group);
  }

  // Lấy tên cửa hàng.
  const storeIds = [...groups.keys()];
  const stores = await StoreModel.find({ _id: { $in: storeIds } })
    .lean()
    .catch(() => [] as any[]);
  const storeMap = new Map(stores.map((s: any) => [String(s._id), s]));

  for (const [key, group] of groups) {
    const store = storeMap.get(key);
    group.storeName = store?.name ?? '';
    // Cửa hàng không hoạt động -> không cho đặt hàng.
    if (store && store.status !== 'active') {
      throw badRequest(
        `Cửa hàng "${store.name}" đang tạm ngưng, không thể đặt hàng`,
      );
    }
    for (const item of group.items) item.storeName = group.storeName;
  }

  // ─── 3. Tính tiền (server-side) ────────────────────────────────────────
  const allItems = [...groups.values()].flatMap((g) => g.items);
  const subtotal = allItems.reduce((sum, i) => sum + i.totalPrice, 0);

  // Mỗi cửa hàng giao riêng -> mỗi sub-order có phí ship riêng,
  // nhưng tổng phí ship hiển thị cho khách = tổng của các sub-order.
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;

  let discount = 0;
  let voucherId: Types.ObjectId | undefined;
  let voucherCode = '';

  if (input.voucherCode?.trim()) {
    const result = await resolveVoucher(
      input.voucherCode,
      subtotal,
      userId,
      storeIds,
    );
    discount = result.discount;
    voucherId = result.voucher._id;
    voucherCode = result.voucher.code;
  }

  const totalPrice = Math.max(0, subtotal + shippingFee - discount);

  const paymentMethod = normalizePaymentMethod(input.paymentMethod);

  // ─── 4. Tạo order ──────────────────────────────────────────────────────
  const orderNumber = buildOrderNumber();

  /**
   * Phân bổ phí vận chuyển cho từng sub-order mà **không mất đồng nào**.
   * Chia đều có phần dư do làm tròn (vd 30.000 / 7 = 4.285 x 7 = 29.995),
   * nên phần dư được gán cho các sub-order đầu tiên.
   */
  const groupList = [...groups.values()];
  const groupShippingFees = distributeEvenly(
    shippingFee,
    groupList.length,
  );

  /**
   * Phân bổ voucher theo tỷ trọng tiền hàng của từng cửa hàng.
   * Voucher giảm giá toàn đơn nên phải chia lại theo giá trị đơn hàng,
   * để tổng `discount` của các sub-order khớp đúng `discount` của đơn.
   */
  const groupDiscounts = distributeByWeight(
    discount,
    groupList.map((g) => g.items.reduce((s, i) => s + i.totalPrice, 0)),
  );

  const subOrders = groupList.map((group, index) => {
    const groupSubtotal = group.items.reduce((s, i) => s + i.totalPrice, 0);
    const groupShipping = groupShippingFees[index] ?? 0;
    const groupDiscount = groupDiscounts[index] ?? 0;

    return {
      storeId: group.storeId,
      storeName: group.storeName,
      status: SellerOrderStatus.PENDING,
      items: group.items,
      subtotal: groupSubtotal,
      shippingFee: groupShipping,
      discount: groupDiscount,
      totalPrice: groupSubtotal + groupShipping - groupDiscount,
      statusHistory: [
        {
          status: SellerOrderStatus.PENDING,
          at: new Date(),
          note: 'Đơn hàng được tạo',
        },
      ],
    };
  });

  const order = await OrderModel.create({
    orderNumber,
    customerId: user._id,
    customerName: input.shippingName?.trim() || user.name,
    customerPhone: input.shippingPhone?.trim() || user.phone || '',
    customerAvatar: user.avatar ?? '',
    items: allItems,
    subOrders,
    subtotal,
    shippingFee,
    discount,
    totalPrice,
    status: CustomerOrderStatus.PENDING,
    // COD chưa thanh toán; các cổng online được đánh dấu đã thanh toán
    // (thực tế sẽ xác nhận qua webhook của nhà cung cấp).
    paymentStatus:
      paymentMethod === 'cod' ? OrderPaymentStatus.UNPAID : OrderPaymentStatus.PAID,
    paymentMethod,
    shippingName: input.shippingName?.trim() || user.name,
    shippingPhone: input.shippingPhone?.trim() || user.phone || '',
    shippingAddress: input.shippingAddress?.trim() ?? '',
    shippingProvince: input.shippingProvince ?? '',
    shippingDistrict: input.shippingDistrict ?? '',
    shippingWard: input.shippingWard ?? '',
    note: input.note?.trim() ?? '',
    voucherCode,
    voucherId,
    shippingUpdates: [
      {
        status: 'pending',
        location: '',
        description: 'Đơn hàng đã được tạo, chờ cửa hàng xác nhận',
      },
    ],
  });

  // ─── 5. Trừ tồn kho ────────────────────────────────────────────────────
  // Dùng `deductStock` để có điều kiện (stock - reserved >= qty), tránh âm kho
  // khi nhiều khách đặt cùng lúc.
  for (const item of allItems) {
    const ok = await deductStock(item.productId, item.quantity);
    if (!ok) {
      // Không đủ hàng nữa -> huỷ đơn vừa tạo và báo lỗi cho khách.
      await OrderModel.deleteOne({ _id: order._id });
      throw unprocessable(
        `Sản phẩm "${item.productName}" vừa hết hàng, vui lòng thử lại.`,
      );
    }
  }

  // Cập nhật số đơn của cửa hàng.
  await StoreModel.updateMany(
    { _id: { $in: storeIds } },
    { $inc: { orderCount: 1 } },
  );

  // ─── 6. Giao dịch thanh toán ──────────────────────────────────────────
  /**
   * Một đơn marketplace có thể chứa hàng của nhiều cửa hàng → tạo **một giao
   * dịch riêng cho từng store**. Cách này giúp:
   * - Seller scope tài chính theo `Payment.storeId` hoạt động đúng.
   * - Mỗi seller bị trừ đúng phí sàn trên phần doanh thu của mình.
   * - Tổng `platformFee` của các giao dịch = doanh thu nền tảng thu được.
   */
  for (const sub of subOrders) {
    // `sub.totalPrice` đã trừ phí ship & voucher của riêng cửa hàng này.
    const subAmount = Math.max(0, sub.totalPrice);
    const subFee = Math.floor(subAmount * PLATFORM_FEE_RATE);

    await PaymentModel.create({
      orderId: order._id,
      orderCode: orderNumber,
      userId: user._id,
      storeId: sub.storeId,
      amount: subAmount,
      platformFee: subFee,
      netAmount: subAmount - subFee,
      method: paymentMethod,
      paymentMethod,
      status:
        paymentMethod === 'cod'
          ? TransactionStatus.PENDING
          : TransactionStatus.SUCCESS,
      transactionId: buildTransactionId(),
    });
  }

  // Tăng số lượt dùng voucher.
  if (voucherId) {
    await VoucherModel.updateOne({ _id: voucherId }, { $inc: { usedCount: 1 } });
  }

  // ─── 7. Xoá các mục đã đặt khỏi giỏ ──────────────────────────────────
  await CartModel.updateOne(
    { userId },
    { $pull: { items: { productId: { $in: productIds } } } },
  );

  // ─── 8. Thông báo ──────────────────────────────────────────────────────
  await NotificationModel.create({
    userId: user._id,
    type: 'order',
    title: 'Đặt hàng thành công',
    message: `Đơn hàng ${orderNumber} đã được ghi nhận với trạng thái chờ xác nhận.`,
    isRead: false,
    link: `/account/orders/${order._id}`,
    isSystem: true,
  });

  for (const group of groups.values()) {
    await NotificationModel.create({
      storeId: group.storeId,
      type: 'order',
      title: 'Đơn hàng mới',
      message: `Bạn có đơn hàng mới ${orderNumber} trị giá ${group.items
        .reduce((s, i) => s + i.totalPrice, 0)
        .toLocaleString('vi-VN')}đ. Vui lòng xác nhận trong 24h.`,
      isRead: false,
      link: '/seller/orders',
      isSystem: true,
    });
  }

  return order;
}

/**
 * Model Order — đơn hàng.
 *
 * Mô hình marketplace: một đơn có thể chứa sản phẩm của nhiều cửa hàng.
 * Mỗi nhóm sản phẩm theo store tạo ra một "sub-order" với trạng thái riêng,
 * vì mỗi seller xử lý đơn của họ độc lập (đúng nghiệp vụ sàn thương mại).
 */
import { Schema, type InferSchemaType } from 'mongoose';
import { defineModel } from './registry';
import {
  CustomerOrderStatus,
  OrderPaymentStatus,
  PaymentMethodValue,
  SellerOrderStatus,
} from '../constants';

// ─── Sub-order: nhóm sản phẩm theo từng cửa hàng ──────────────────────────────
const subOrderItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    productImage: { type: String, default: '' },
    productSlug: { type: String, default: '' },
    sku: { type: String, default: '' },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    totalPrice: { type: Number, required: true, min: 0 },
    options: { type: Map, of: String, default: {} },
  },
  { _id: false },
);

const subOrderSchema = new Schema(
  {
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    storeName: { type: String, default: '' },
    status: {
      type: String,
      enum: Object.values(SellerOrderStatus),
      default: SellerOrderStatus.PENDING,
      index: true,
    },
    items: { type: [subOrderItemSchema], default: [] },
    subtotal: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    totalPrice: { type: Number, default: 0 },
    trackingNumber: { type: String, default: '' },
    shippingPartner: { type: String, default: '' },
    estimatedDelivery: { type: Date },
    deliveredAt: { type: Date },
    /** Thời điểm mỗi lần chuyển trạng thái (dùng dựng timeline). */
    statusHistory: {
      type: [
        new Schema(
          {
            status: { type: String, required: true },
            at: { type: Date, default: Date.now },
            note: { type: String, default: '' },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
  },
  { _id: true },
);

// ─── Vận chuyển ───────────────────────────────────────────────────────────────
const shippingUpdateSchema = new Schema(
  {
    status: { type: String, required: true },
    location: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now },
    description: { type: String, default: '' },
  },
  { _id: true },
);

const orderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },

    // ─── Khách hàng ────────────────────────────────────────────────────────
    customerId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    customerAvatar: { type: String, default: '' },

    // ─── Sản phẩm ──────────────────────────────────────────────────────────
    items: { type: [subOrderItemSchema], default: [] },
    /** Nhóm theo cửa hàng — dùng cho màn hình seller. */
    subOrders: { type: [subOrderSchema], default: [] },

    // ─── Tiền (luôn tính lại ở server, không tin client) ────────────────────
    subtotal: { type: Number, default: 0, min: 0 },
    shippingFee: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    totalPrice: { type: Number, default: 0, min: 0 },

    // ─── Trạng thái ────────────────────────────────────────────────────────
    /** Trạng thái tổng hợp phía khách. */
    status: {
      type: String,
      enum: Object.values(CustomerOrderStatus),
      default: CustomerOrderStatus.PENDING,
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(OrderPaymentStatus),
      default: OrderPaymentStatus.UNPAID,
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: [
        'cod',
        'banking',
        'vnpay',
        'momo',
        'zalopay',
        'installment',
      ],
      default: 'cod',
    },

    // ─── Giao hàng ─────────────────────────────────────────────────────────
    shippingName: { type: String, default: '' },
    shippingPhone: { type: String, default: '' },
    shippingAddress: { type: String, default: '' },
    shippingProvince: { type: String, default: '' },
    shippingDistrict: { type: String, default: '' },
    shippingWard: { type: String, default: '' },
    note: { type: String, default: '' },
    shippingUpdates: { type: [shippingUpdateSchema], default: [] },

    // ─── Voucher ───────────────────────────────────────────────────────────
    voucherCode: { type: String, default: '' },
    voucherId: { type: Schema.Types.ObjectId, ref: 'Voucher' },

    /** Lý do huỷ (nếu có). */
    cancelReason: { type: String, default: '' },
    cancelledAt: { type: Date },
    /** Đơn đã bị hủy trong 1 giờ? Dùng cho nghiệp vụ huỷ đơn. */
  },
  { timestamps: true },
);

orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ 'subOrders.storeId': 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });

export type OrderDoc = InferSchemaType<typeof orderSchema>;

export const OrderModel = defineModel('Order', orderSchema);

function mapToObject(value: Record<string, string> | Map<string, string>) {
  if (!value) return {};
  if (value instanceof Map) return Object.fromEntries(value.entries());
  return { ...value };
}

/** DTO phía khách — đúng shape `Order` của frontend. */
export function toCustomerOrder(order: any) {
  if (!order) return null;
  const obj = order.toObject ? order.toObject() : { ...order };
  delete obj.__v;

  return {
    id: String(obj._id),
    orderNumber: obj.orderNumber,
    customerId: obj.customerId ? String(obj.customerId) : '',
    customerName: obj.customerName,
    customerPhone: obj.customerPhone,
    customerAvatar: obj.customerAvatar ?? '',
    items: (obj.items ?? []).map((it: any) => ({
      product: {
        id: String(it.productId),
        name: it.productName,
        slug: it.productSlug ?? '',
        image: it.productImage ?? '',
        price: it.unitPrice,
        originalPrice: it.unitPrice,
        discount: 0,
        images: it.productImage ? [it.productImage] : [],
        categoryId: '',
        categoryName: '',
        brand: '',
        rating: 0,
        reviewCount: 0,
        stock: 0,
        sold: 0,
        tags: [],
        specifications: {},
        isFeatured: false,
        isNew: false,
        isHot: false,
        createdAt: obj.createdAt,
      },
      quantity: it.quantity,
      selected: true,
    })),
    subtotal: obj.subtotal ?? 0,
    shippingFee: obj.shippingFee ?? 0,
    discount: obj.discount ?? 0,
    totalPrice: obj.totalPrice ?? 0,
    status: obj.status,
    paymentStatus: obj.paymentStatus,
    paymentMethod: obj.paymentMethod,
    shippingAddress: obj.shippingAddress ?? '',
    shippingProvince: obj.shippingProvince ?? '',
    shippingDistrict: obj.shippingDistrict ?? '',
    shippingWard: obj.shippingWard ?? '',
    note: obj.note ?? '',
    voucherCode: obj.voucherCode ?? '',
    trackingNumber: obj.subOrders?.[0]?.trackingNumber ?? '',
    shippingPartner: obj.subOrders?.[0]?.shippingPartner ?? '',
    /**
     * Sub-order theo từng cửa hàng — nghiệp vụ multi-vendor: mỗi seller xử lý
     * đơn của họ độc lập nên khách cần biết trạng thái giao hàng của từng shop.
     */
    subOrders: (obj.subOrders ?? []).map((s: any) => ({
      id: String(s._id),
      storeId: String(s.storeId),
      storeName: s.storeName ?? '',
      status: s.status,
      subtotal: s.subtotal ?? 0,
      shippingFee: s.shippingFee ?? 0,
      discount: s.discount ?? 0,
      totalPrice: s.totalPrice ?? 0,
      trackingNumber: s.trackingNumber ?? '',
      shippingPartner: s.shippingPartner ?? '',
      estimatedDelivery: s.estimatedDelivery,
      deliveredAt: s.deliveredAt,
      itemCount: (s.items ?? []).reduce((sum: number, it: any) => sum + (it.quantity ?? 0), 0),
      statusHistory: (s.statusHistory ?? []).map((h: any) => ({
        status: h.status,
        at: h.at,
        note: h.note ?? '',
      })),
    })),
    shippingUpdates: (obj.shippingUpdates ?? []).map((u: any) => ({
      id: String(u._id),
      orderId: String(obj._id),
      status: u.status,
      location: u.location,
      timestamp: u.timestamp,
      description: u.description,
    })),
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
}

/** DTO phía seller — đúng shape `SellerOrder` của frontend. */
export function toSellerOrder(order: any, storeId?: string) {
  if (!order) return null;
  const obj = order.toObject ? order.toObject() : { ...order };
  delete obj.__v;

  const subOrders = obj.subOrders ?? [];
  const mine = storeId
    ? subOrders.filter((s: any) => String(s.storeId) === String(storeId))
    : subOrders;
  const source = mine.length ? mine : subOrders;

  const items = source.flatMap((s: any) =>
    (s.items ?? []).map((it: any) => ({
      productId: String(it.productId),
      productName: it.productName,
      productImage: it.productImage ?? '',
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      totalPrice: it.totalPrice,
      sku: it.sku ?? '',
      options: mapToObject(it.options ?? {}),
    })),
  );

  const first = source[0] ?? {};
  const subtotal = source.reduce((s: number, so: any) => s + (so.subtotal ?? 0), 0);
  const shippingFee = source.reduce((s: number, so: any) => s + (so.shippingFee ?? 0), 0);
  const discount = source.reduce((s: number, so: any) => s + (so.discount ?? 0), 0);
  const totalAmount = source.reduce((s: number, so: any) => s + (so.totalPrice ?? 0), 0);

  return {
    id: String(obj._id),
    orderCode: obj.orderNumber,
    customerName: obj.customerName,
    customerPhone: obj.customerPhone,
    customerAvatar: obj.customerAvatar ?? '',
    items: items.length,
    totalAmount,
    shippingFee,
    discount,
    finalAmount: totalAmount,
    status: first.status ?? obj.status ?? SellerOrderStatus.PENDING,
    paymentMethod: obj.paymentMethod,
    paymentStatus: obj.paymentStatus,
    shippingAddress: obj.shippingAddress ?? '',
    note: obj.note ?? '',
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
    estimatedDelivery: first.estimatedDelivery ?? null,
    trackingNumber: first.trackingNumber ?? '',
    shippingPartner: first.shippingPartner ?? '',
    storeId: String(first.storeId ?? storeId ?? ''),
    products: items,
  };
}

/** DTO phía admin — đủ thông tin cho bảng quản lý. */
export function toAdminOrder(order: any) {
  if (!order) return null;
  const obj = order.toObject ? order.toObject() : { ...order };
  delete obj.__v;
  return {
    id: String(obj._id),
    orderNumber: obj.orderNumber,
    customerId: obj.customerId ? String(obj.customerId) : '',
    customerName: obj.customerName,
    customerPhone: obj.customerPhone,
    items: (obj.items ?? []).map((it: any) => ({
      product: {
        id: String(it.productId),
        name: it.productName,
        images: it.productImage ? [it.productImage] : [],
        price: it.unitPrice,
      },
      quantity: it.quantity,
      selected: true,
    })),
    subOrders: (obj.subOrders ?? []).map((s: any) => ({
      id: String(s._id),
      storeId: String(s.storeId),
      storeName: s.storeName,
      status: s.status,
      subtotal: s.subtotal ?? 0,
      shippingFee: s.shippingFee ?? 0,
      discount: s.discount ?? 0,
      totalPrice: s.totalPrice ?? 0,
      itemCount: (s.items ?? []).length,
    })),
    subtotal: obj.subtotal ?? 0,
    shippingFee: obj.shippingFee ?? 0,
    discount: obj.discount ?? 0,
    totalPrice: obj.totalPrice ?? 0,
    status: obj.status,
    paymentStatus: obj.paymentStatus,
    paymentMethod: obj.paymentMethod,
    shippingAddress: obj.shippingAddress ?? '',
    note: obj.note ?? '',
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
}

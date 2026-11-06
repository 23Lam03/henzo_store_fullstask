import { Types } from 'mongoose';
import { OrderModel } from '../models/Order';
import { PaymentModel } from '../models/Payment';
import { NotificationModel } from '../models/Notification';
import { restoreStockForSubOrders } from './inventory.service';
import { notFound, forbidden, badRequest } from '../http/errors';
import {
  CustomerOrderStatus,
  OrderPaymentStatus,
  SELLER_TO_CUSTOMER_STATUS,
  SellerOrderStatus,
  SellerOrderStatusValue,
  TransactionStatus,
} from '../constants';

const SELLER_TRANSITIONS: Record<string, SellerOrderStatusValue[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['shipped', 'cancelled'],
  shipped: ['delivering', 'returned'],
  delivering: ['delivered', 'returned'],
  delivered: ['returned'],
  cancelled: [],
  returned: [],
};

export const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  preparing: 'Đang chuẩn bị',
  shipped: 'Đã giao cho đơn vị vận chuyển',
  delivering: 'Đang vận chuyển',
  delivered: 'Giao thành công',
  cancelled: 'Đã huỷ',
  returned: 'Hoàn trả',
  processing: 'Đang xử lý',
  shipping: 'Đang vận chuyển',
};

export interface UpdateStatusInput {
  orderId: string;
  storeId?: string;
  status: string;
  note?: string;
  trackingNumber?: string;
  shippingPartner?: string;
  actorRole: 'SHOP' | 'ADMIN' | 'CUSTOMER';
}

export async function updateOrderStatus(input: UpdateStatusInput) {
  const order = await OrderModel.findById(input.orderId);
  if (!order) throw notFound('Không tìm thấy đơn hàng');

  const target = input.status as SellerOrderStatusValue;
  const isAdmin = input.actorRole === 'ADMIN';

  if (input.actorRole === 'SHOP') {
    if (!input.storeId) throw forbidden('Không xác định được cửa hàng');
    const sub = (order.subOrders ?? []).find(
      (s: any) => String(s.storeId) === String(input.storeId),
    );
    if (!sub) throw forbidden('Đơn hàng không thuộc cửa hàng của bạn');

    const allowed = SELLER_TRANSITIONS[sub.status] ?? [];
    if (!allowed.includes(target)) {
      throw badRequest(
        `Không thể chuyển từ "${STATUS_LABELS[sub.status]}" sang "${STATUS_LABELS[target] ?? target}"`,
      );
    }

    const previousStatus = String(sub.status);

        if (target === SellerOrderStatus.CANCELLED) {
      await restoreStockForSubOrders([sub.toObject?.() ?? sub]);

      await PaymentModel.updateMany(
        {
          orderId: order._id,
          storeId: sub.storeId,
          status: { $in: [TransactionStatus.SUCCESS, TransactionStatus.PENDING] },
        },
        { $set: { status: TransactionStatus.REFUNDED, refundedAt: new Date() } },
      );
    }

    sub.status = target;
    sub.statusHistory.push({
      status: target,
      at: new Date(),
      note: input.note ?? '',
    } as any);

    if (input.trackingNumber) sub.trackingNumber = input.trackingNumber;
    if (input.shippingPartner) sub.shippingPartner = input.shippingPartner;

    if (target === SellerOrderStatus.DELIVERED) {
      sub.deliveredAt = new Date();

      if (order.paymentMethod === 'cod') {
        order.paymentStatus = OrderPaymentStatus.PAID;
        await PaymentModel.updateMany(
          { orderId: order._id },
          { status: TransactionStatus.SUCCESS },
        );
      }
    }

    order.status = deriveCustomerStatus(order.subOrders) as any;
    await order.save();

    await notifyCustomer(
      order,
      `Đơn hàng ${order.orderNumber} đã cập nhật`,
      `Đơn hàng ${order.orderNumber} hiện ở trạng thái ${STATUS_LABELS[target] ?? target}.`,
    );

    await notifySeller(order, input.storeId, target, input.note);

    return order;
  }

  if (isAdmin) {
    const customerStatus = SELLER_TO_CUSTOMER_STATUS[target] ?? target;
    if (!Object.values(CustomerOrderStatus).includes(customerStatus as any)) {
      throw badRequest('Trạng thái không hợp lệ');
    }

    for (const sub of order.subOrders ?? []) {
      sub.status = target as SellerOrderStatusValue;
      sub.statusHistory.push({
        status: target,
        at: new Date(),
        note: input.note ?? 'Cập nhật bởi quản trị viên',
      } as any);
    }

    order.status = customerStatus as any;
    await order.save();

    await notifyCustomer(
      order,
      `Đơn hàng ${order.orderNumber} đã cập nhật`,
      `Đơn hàng ${order.orderNumber} hiện ở trạng thái ${STATUS_LABELS[customerStatus] ?? customerStatus}.`,
    );

    return order;
  }

  throw forbidden('Không có quyền cập nhật đơn hàng');
}

export function deriveCustomerStatus(subOrders: any[]): string {
  if (!subOrders?.length) return CustomerOrderStatus.PENDING;

  const statuses = subOrders.map((s: any) => s.status);

  if (statuses.every((s: string) => s === SellerOrderStatus.DELIVERED)) {
    return CustomerOrderStatus.DELIVERED;
  }
  if (statuses.every((s: string) => s === SellerOrderStatus.CANCELLED)) {
    return CustomerOrderStatus.CANCELLED;
  }
  if (
    statuses.some(
      (s: string) =>
        s === SellerOrderStatus.SHIPPED ||
        s === SellerOrderStatus.DELIVERING ||
        s === SellerOrderStatus.DELIVERED,
    )
  ) {
    return CustomerOrderStatus.SHIPPING;
  }
  if (
    statuses.some(
      (s: string) =>
        s === SellerOrderStatus.CONFIRMED ||
        s === SellerOrderStatus.PREPARING,
    )
  ) {
    return CustomerOrderStatus.PROCESSING;
  }
  return CustomerOrderStatus.PENDING;
}

async function notifyCustomer(
  order: any,
  title: string,
  message: string,
) {
  await NotificationModel.create({
    userId: order.customerId,
    type: 'order',
    title,
    message,
    isRead: false,
    link: `/account/orders/${order._id}`,
    isSystem: true,
  });
}

async function notifySeller(
  order: any,
  storeId: string | undefined,
  status: string,
  note?: string,
) {
  const targets = (order.subOrders ?? [])
    .filter((s: any) => !storeId || String(s.storeId) === String(storeId))
    .map((s: any) => s.storeId);

  for (const target of targets) {
    await NotificationModel.create({
      storeId: target,
      type: 'order',
      title: `Đơn hàng ${order.orderNumber} đã cập nhật`,
      message: `Đơn hàng ${order.orderNumber} hiện ở trạng thái ${STATUS_LABELS[status] ?? status}.${note ? ` ${note}` : ''}`,
      isRead: false,
      link: '/seller/orders',
      isSystem: true,
    });
  }
}

/**
 * Barrel export cho toàn bộ model.
 */
export { UserModel, toPublicUser, toAdminUser, type UserDoc } from './User';
export {
  StoreModel,
  toAdminStore,
  toPublicStore,
  type StoreDoc,
} from './Store';
export {
  ProductModel,
  toProductDto,
  computeDiscount,
  type ProductDoc,
} from './Product';
export {
  CategoryModel,
  toCategoryDto,
  type CategoryDoc,
} from './Category';
export { BrandModel, toBrandDto, type BrandDoc } from './Brand';
export {
  OrderModel,
  toCustomerOrder,
  toSellerOrder,
  toAdminOrder,
  type OrderDoc,
} from './Order';
export {
  PaymentModel,
  toPaymentDto,
  toAdminPaymentDto,
  type PaymentDoc,
} from './Payment';
export {
  ReviewModel,
  toReviewDto,
  toSellerReview,
  type ReviewDoc,
} from './Review';
export { CartModel, type CartDoc } from './Cart';
export { WishlistModel, type WishlistDoc } from './Wishlist';
export {
  PromotionModel,
  VoucherModel,
  promotionStatus,
  toPromotionDto,
  toSellerPromotion,
  toVoucherDto,
  type PromotionDoc,
  type VoucherDoc,
} from './Promotion';
export {
  NotificationModel,
  toNotificationDto,
  type NotificationDoc,
} from './Notification';
export {
  TicketModel,
  toCustomerTicket,
  toSellerTicket,
  toAdminTicket,
  type TicketDoc,
} from './SupportTicket';
export {
  InventoryModel,
  recalcInventory,
  toInventoryDto,
  type InventoryDoc,
} from './Inventory';
export { ShippingModel, toShippingDto, type ShippingDoc } from './Shipping';
export { BlogModel, toBlogDto, type BlogDoc } from './Blog';
export { AddressModel, toAddressDto, type AddressDoc } from './Address';
export { SearchHistoryModel, type SearchHistoryDoc } from './SearchHistory';
export { RoleModel, type RoleDoc } from './Role';

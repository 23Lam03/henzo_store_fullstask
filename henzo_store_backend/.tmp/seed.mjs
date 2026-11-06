// scripts/seed.ts
import { existsSync as existsSync2, readFileSync as readFileSync2 } from "node:fs";
import { dirname as dirname2, resolve as resolve2 } from "node:path";
import { fileURLToPath as fileURLToPath2 } from "node:url";

// src/server/db.ts
import mongoose from "mongoose";

// src/config/env.ts
import { z } from "zod";

// src/config/load-env.ts
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
function parseEnvFile(content) {
  const result = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (value.startsWith('"') && value.endsWith('"') || value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }
    if (key) result[key] = value;
  }
  return result;
}
function loadEnvFiles(rootDir) {
  const here = rootDir ?? dirname(dirname(fileURLToPath(import.meta.url)));
  const candidates = [
    ".env.local",
    `.env.${process.env.NODE_ENV ?? "development"}`,
    ".env",
    ".env.example"
  ];
  for (const name of candidates) {
    const file = resolve(here, name);
    if (!existsSync(file)) continue;
    const parsed2 = parseEnvFile(readFileSync(file, "utf8"));
    for (const [key, value] of Object.entries(parsed2)) {
      if (process.env[key] === void 0) process.env[key] = value;
    }
    if (name !== ".env.example") break;
  }
}

// src/config/env.ts
loadEnvFiles();
var envSchema = z.object({
  MONGODB_URI: z.string().min(1, "Thi\u1EBFu MONGODB_URI"),
  PORT: z.coerce.number().default(4e3),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  // JWT
  JWT_ACCESS_SECRET: z.string().min(16, "JWT_ACCESS_SECRET ph\u1EA3i c\xF3 \xEDt nh\u1EA5t 16 k\xFD t\u1EF1"),
  JWT_REFRESH_SECRET: z.string().min(16, "JWT_REFRESH_SECRET ph\u1EA3i c\xF3 \xEDt nh\u1EA5t 16 k\xFD t\u1EF1"),
  JWT_ACCESS_EXPIRES: z.string().default("15m"),
  JWT_REFRESH_EXPIRES: z.string().default("7d"),
  // Cookie
  COOKIE_NAME: z.string().default("henzo_refresh_token"),
  COOKIE_DOMAIN: z.string().optional(),
  COOKIE_SECURE: z.enum(["true", "false"]).default("false").transform((v) => v === "true"),
  // CORS — danh sách origin được phép, phân tách bằng dấu phẩy
  CORS_ORIGINS: z.string().default("http://localhost:5173,http://localhost:3000")
});
var parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
  console.error(`
[CONFIG] C\u1EA5u h\xECnh m\xF4i tr\u01B0\u1EDDng kh\xF4ng h\u1EE3p l\u1EC7:
${issues}
`);
  console.error("H\xE3y ki\u1EC3m tra file .env ho\u1EB7c .env.example\n");
  process.exit(1);
}
var config = {
  ...parsed.data,
  isProd: parsed.data.NODE_ENV === "production",
  corsOrigins: parsed.data.CORS_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean)
};

// src/server/db.ts
var cached = globalThis;
async function connectDB() {
  if (cached.mongooseConn) return cached.mongooseConn;
  if (!cached.mongoosePromise) {
    mongoose.set("strictQuery", true);
    cached.mongoosePromise = mongoose.connect(config.MONGODB_URI, {
      serverSelectionTimeoutMS: 1e4,
      maxPoolSize: 10
    }).then((m) => {
      cached.mongooseConn = m;
      return m;
    }).catch((err) => {
      cached.mongoosePromise = null;
      throw err;
    });
  }
  return cached.mongoosePromise;
}
async function disconnectDB() {
  await mongoose.disconnect();
  cached.mongooseConn = null;
  cached.mongoosePromise = null;
}

// src/server/models/User.ts
import { Schema } from "mongoose";

// src/server/models/registry.ts
import mongoose2 from "mongoose";
function defineModel(name, schema) {
  const existing = mongoose2.models[name];
  if (existing) {
    return existing;
  }
  return mongoose2.model(name, schema);
}

// src/server/constants.ts
var UserRole = {
  GUEST: "GUEST",
  CUSTOMER: "CUSTOMER",
  SHOP: "SHOP",
  ADMIN: "ADMIN",
  MODERATOR: "MODERATOR",
  STAFF: "STAFF"
};
var USER_ROLES = Object.values(UserRole);
var CustomerOrderStatus = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  PROCESSING: "processing",
  SHIPPING: "shipping",
  DELIVERED: "delivered",
  CANCELLED: "cancelled"
};
var SellerOrderStatus = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  PREPARING: "preparing",
  SHIPPED: "shipped",
  DELIVERING: "delivering",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
  RETURNED: "returned"
};
var OrderPaymentStatus = {
  UNPAID: "unpaid",
  PAID: "paid",
  REFUNDED: "refunded",
  FAILED: "failed"
};
var TransactionStatus = {
  SUCCESS: "success",
  PENDING: "pending",
  REFUNDED: "refunded",
  FAILED: "failed"
};
var ShippingStatus = {
  WAITING_PICKUP: "waiting_pickup",
  PICKED_UP: "picked_up",
  IN_TRANSIT: "in_transit",
  DELIVERING: "delivering",
  DELIVERED: "delivered",
  FAILED: "failed",
  RETURNED: "returned"
};
var SHIPPING_CARRIERS = [
  "GHTK",
  "GHN",
  "Viettel Post",
  "VNPost",
  "Ninja Van",
  "GrabExpress",
  "Ahamove"
];
var InventoryStatus = {
  IN_STOCK: "in_stock",
  LOW_STOCK: "low_stock",
  OUT_OF_STOCK: "out_of_stock"
};
var PromotionType = {
  VOUCHER: "voucher",
  FLASH_SALE: "flash_sale",
  COMBO: "combo",
  DISCOUNT_CAMPAIGN: "discount_campaign"
};
var SellerPromotionStatus = {
  ACTIVE: "active",
  PAUSED: "paused",
  ENDED: "ended",
  DRAFT: "draft"
};
var DiscountType = {
  PERCENT: "percent",
  FIXED: "fixed",
  SHIPPING: "shipping"
};
var TicketCategory = {
  ORDER: "order",
  PAYMENT: "payment",
  PRODUCT: "product",
  ACCOUNT: "account",
  TECHNICAL: "technical",
  OTHER: "other"
};
var TicketPriority = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent"
};
var CustomerTicketStatus = {
  OPEN: "open",
  REPLIED: "replied",
  RESOLVED: "resolved",
  CLOSED: "closed"
};
var SellerTicketStatus = {
  NEW: "new",
  IN_PROGRESS: "in_progress",
  REPLIED: "replied",
  RESOLVED: "resolved",
  CLOSED: "closed"
};
var AdminTicketStatus = {
  OPEN: "open",
  PENDING: "pending",
  RESOLVED: "resolved",
  CLOSED: "closed"
};
var MessageSender = {
  CUSTOMER: "customer",
  SELLER: "seller",
  ADMIN: "admin",
  SYSTEM: "system"
};
var CustomerNotificationType = {
  ORDER: "order",
  PROMOTION: "promotion",
  VOUCHER: "voucher",
  SYSTEM: "system"
};
var SellerNotificationType = {
  ORDER: "order",
  PRODUCT: "product",
  PAYMENT: "payment",
  SYSTEM: "system",
  REVIEW: "review",
  PROMOTION: "promotion"
};
var AdminNotificationType = {
  PROMOTION: "promotion",
  SYSTEM: "system",
  WARNING: "warning"
};
var NotificationAudience = {
  ALL: "all",
  CUSTOMERS: "customers",
  STORES: "stores"
};
var StoreStatus = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  SUSPENDED: "suspended"
};
var ProductStatus = {
  DRAFT: "draft",
  ACTIVE: "active",
  HIDDEN: "hidden"
};
var ROLE_PERMISSIONS = {
  ADMIN: [
    "Xem dashboard",
    "Qu\u1EA3n l\xFD s\u1EA3n ph\u1EA9m",
    "Qu\u1EA3n l\xFD \u0111\u01A1n h\xE0ng",
    "Qu\u1EA3n l\xFD kh\xE1ch h\xE0ng",
    "Qu\u1EA3n l\xFD c\u1EEDa h\xE0ng",
    "Qu\u1EA3n l\xFD thanh to\xE1n",
    "Qu\u1EA3n l\xFD \u0111\xE1nh gi\xE1",
    "Qu\u1EA3n l\xFD khuy\u1EBFn m\xE3i",
    "Qu\u1EA3n l\xFD h\u1ED7 tr\u1EE3",
    "B\xE1o c\xE1o",
    "T\xE0i ch\xEDnh"
  ],
  MODERATOR: [
    "Xem dashboard",
    "Qu\u1EA3n l\xFD s\u1EA3n ph\u1EA9m",
    "Qu\u1EA3n l\xFD \u0111\xE1nh gi\xE1",
    "Xem b\xE1o c\xE1o"
  ],
  STAFF: ["Xem dashboard", "Xem \u0111\u01A1n h\xE0ng", "H\u1ED7 tr\u1EE3 kh\xE1ch h\xE0ng"],
  SHOP: [
    "Qu\u1EA3n l\xFD s\u1EA3n ph\u1EA9m",
    "Qu\u1EA3n l\xFD \u0111\u01A1n h\xE0ng",
    "Qu\u1EA3n l\xFD khuy\u1EBFn m\xE3i",
    "Xem b\xE1o c\xE1o",
    "Qu\u1EA3n l\xFD kho",
    "Qu\u1EA3n l\xFD v\u1EADn chuy\u1EC3n"
  ]
};
var FREE_SHIPPING_THRESHOLD = 5e5;
var SHIPPING_FEE = 3e4;
var PLATFORM_FEE_RATE = 0.023;
var ORDER_CANCEL_WINDOW_MS = 60 * 60 * 1e3;

// src/server/models/User.ts
var addressSchema = new Schema(
  {
    label: { type: String, trim: true },
    name: { type: String, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    ward: { type: String, trim: true },
    city: { type: String, trim: true },
    district: { type: String, trim: true },
    province: { type: String, trim: true },
    isDefault: { type: Boolean, default: false }
  },
  { _id: true }
);
var userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    password: { type: String, required: true, select: false },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    avatar: { type: String, default: "" },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.CUSTOMER,
      index: true
    },
    /** Trạng thái tài khoản — admin có thể khóa. */
    status: {
      type: String,
      enum: ["active", "locked"],
      default: "active",
      index: true
    },
    /** Thông tin cửa hàng (chỉ role SHOP). */
    storeId: { type: Schema.Types.ObjectId, ref: "Store", index: true },
    /** Quyền hạn tuỳ chỉnh (dùng cho MODERATOR/STAFF/ADMIN). */
    permissions: { type: [String], default: [] },
    /** Địa chỉ mặc định dạng chuỗi (khớp trường `User.address` ở frontend). */
    address: { type: String, trim: true },
    /** Sổ địa chỉ đầy đủ. */
    addresses: { type: [addressSchema], default: [] },
    gender: { type: String, enum: ["Nam", "N\u1EEF", "Kh\xE1c"], default: void 0 },
    dob: { type: Date },
    bio: { type: String, default: "" },
    /** Điểm thưởng — hiển thị ở trang Account. */
    points: { type: Number, default: 0 },
    lastLoginAt: { type: Date }
  },
  { timestamps: true }
);
userSchema.index({ role: 1, status: 1, createdAt: -1 });
var UserModel = defineModel("User", userSchema);

// src/server/models/Store.ts
import { Schema as Schema2 } from "mongoose";
var storeSchema = new Schema2(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    avatar: { type: String, default: "" },
    banner: { type: String, default: "" },
    description: { type: String, default: "" },
    tagline: { type: String, default: "" },
    /** Xác minh bởi admin — hiển thị badge "Đã xác minh". */
    isVerified: { type: Boolean, default: false },
    status: {
      type: String,
      enum: Object.values(StoreStatus),
      default: StoreStatus.ACTIVE,
      index: true
    },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    productCount: { type: Number, default: 0 },
    orderCount: { type: Number, default: 0 },
    followerCount: { type: Number, default: 0 },
    /** Thông tin pháp lý & thanh toán. */
    taxId: { type: String, default: "" },
    bankAccount: { type: String, default: "" },
    bankName: { type: String, default: "" },
    /** Chủ cửa hàng (user role SHOP). */
    ownerId: { type: Schema2.Types.ObjectId, ref: "User", index: true }
  },
  { timestamps: true }
);
storeSchema.index({ status: 1, isVerified: 1, createdAt: -1 });
storeSchema.index({ name: "text", description: "text", address: "text" });
var StoreModel = defineModel("Store", storeSchema);

// src/server/models/Product.ts
import { Schema as Schema3 } from "mongoose";
var productSchema = new Schema3(
  {
    name: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    description: { type: String, default: "" },
    shortDescription: { type: String, default: "" },
    // ─── Giá ───────────────────────────────────────────────────────────────
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, default: 0, min: 0 },
    /** Phần trăm giảm — được tính lại khi sửa giá. */
    discount: { type: Number, default: 0, min: 0, max: 100 },
    // ─── Media ─────────────────────────────────────────────────────────────
    images: { type: [String], default: [] },
    // ─── Phân loại ─────────────────────────────────────────────────────────
    categoryId: { type: Schema3.Types.ObjectId, ref: "Category", index: true },
    /** Denormalised để frontend đọc trực tiếp `product.categoryName`. */
    categoryName: { type: String, default: "", index: true },
    brand: { type: String, default: "", index: true },
    // ─── Tồn kho & bán hàng ────────────────────────────────────────────────
    stock: { type: Number, default: 0, min: 0 },
    reserved: { type: Number, default: 0, min: 0 },
    sold: { type: Number, default: 0, min: 0 },
    viewCount: { type: Number, default: 0, min: 0 },
    minStock: { type: Number, default: 10, min: 0 },
    lastRestockedAt: { type: Date },
    // ─── Đánh giá ──────────────────────────────────────────────────────────
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    // ─── Thuộc tính ────────────────────────────────────────────────────────
    tags: { type: [String], default: [], index: true },
    specifications: { type: Map, of: String, default: {} },
    // ─── Cờ hiển thị ───────────────────────────────────────────────────────
    isFeatured: { type: Boolean, default: false, index: true },
    isNew: { type: Boolean, default: false, index: true },
    isHot: { type: Boolean, default: false, index: true },
    // ─── Quản lý ───────────────────────────────────────────────────────────
    /** Store sở hữu sản phẩm — mọi truy vấn seller đều scope theo field này. */
    storeId: { type: Schema3.Types.ObjectId, ref: "Store", index: true },
    status: {
      type: String,
      enum: Object.values(ProductStatus),
      default: ProductStatus.ACTIVE,
      index: true
    },
    sku: { type: String, default: "", index: true }
  },
  { timestamps: true }
);
productSchema.index({ name: "text", description: "text", tags: "text" });
productSchema.index({ status: 1, isFeatured: -1, sold: -1 });
productSchema.index({ storeId: 1, status: 1 });
productSchema.index({ categoryId: 1, brand: 1, price: 1 });
productSchema.index({ createdAt: -1 });
var ProductModel = defineModel("Product", productSchema);

// src/server/models/Category.ts
import { Schema as Schema4 } from "mongoose";
var categorySchema = new Schema4(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    icon: { type: String, default: "" },
    image: { type: String, default: "" },
    banner: { type: String, default: "" },
    description: { type: String, default: "" },
    /** Danh mục cha — null cho cấp 1. */
    parentId: {
      type: Schema4.Types.ObjectId,
      ref: "Category",
      default: null,
      index: true
    },
    featured: { type: Boolean, default: false, index: true },
    order: { type: Number, default: 0 },
    productCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);
categorySchema.index({ parentId: 1, order: 1 });
var CategoryModel = defineModel("Category", categorySchema);

// src/server/models/Brand.ts
import { Schema as Schema5 } from "mongoose";
var brandSchema = new Schema5(
  {
    name: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    logo: { type: String, default: "" },
    banner: { type: String, default: "" },
    tagline: { type: String, default: "" },
    description: { type: String, default: "" },
    color: { type: String, default: "#4F46E5" },
    productCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);
var BrandModel = defineModel("Brand", brandSchema);

// src/server/models/Order.ts
import { Schema as Schema6 } from "mongoose";
var subOrderItemSchema = new Schema6(
  {
    productId: { type: Schema6.Types.ObjectId, ref: "Product", required: true },
    productName: { type: String, required: true },
    productImage: { type: String, default: "" },
    productSlug: { type: String, default: "" },
    sku: { type: String, default: "" },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    totalPrice: { type: Number, required: true, min: 0 },
    options: { type: Map, of: String, default: {} }
  },
  { _id: false }
);
var subOrderSchema = new Schema6(
  {
    storeId: { type: Schema6.Types.ObjectId, ref: "Store", required: true, index: true },
    storeName: { type: String, default: "" },
    status: {
      type: String,
      enum: Object.values(SellerOrderStatus),
      default: SellerOrderStatus.PENDING,
      index: true
    },
    items: { type: [subOrderItemSchema], default: [] },
    subtotal: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    totalPrice: { type: Number, default: 0 },
    trackingNumber: { type: String, default: "" },
    shippingPartner: { type: String, default: "" },
    estimatedDelivery: { type: Date },
    deliveredAt: { type: Date },
    /** Thời điểm mỗi lần chuyển trạng thái (dùng dựng timeline). */
    statusHistory: {
      type: [
        new Schema6(
          {
            status: { type: String, required: true },
            at: { type: Date, default: Date.now },
            note: { type: String, default: "" }
          },
          { _id: false }
        )
      ],
      default: []
    }
  },
  { _id: true }
);
var shippingUpdateSchema = new Schema6(
  {
    status: { type: String, required: true },
    location: { type: String, default: "" },
    timestamp: { type: Date, default: Date.now },
    description: { type: String, default: "" }
  },
  { _id: true }
);
var orderSchema = new Schema6(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    // ─── Khách hàng ────────────────────────────────────────────────────────
    customerId: { type: Schema6.Types.ObjectId, ref: "User", index: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    customerAvatar: { type: String, default: "" },
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
      index: true
    },
    paymentStatus: {
      type: String,
      enum: Object.values(OrderPaymentStatus),
      default: OrderPaymentStatus.UNPAID,
      index: true
    },
    paymentMethod: {
      type: String,
      enum: [
        "cod",
        "banking",
        "vnpay",
        "momo",
        "zalopay",
        "installment"
      ],
      default: "cod"
    },
    // ─── Giao hàng ─────────────────────────────────────────────────────────
    shippingName: { type: String, default: "" },
    shippingPhone: { type: String, default: "" },
    shippingAddress: { type: String, default: "" },
    shippingProvince: { type: String, default: "" },
    shippingDistrict: { type: String, default: "" },
    note: { type: String, default: "" },
    shippingUpdates: { type: [shippingUpdateSchema], default: [] },
    // ─── Voucher ───────────────────────────────────────────────────────────
    voucherCode: { type: String, default: "" },
    voucherId: { type: Schema6.Types.ObjectId, ref: "Voucher" },
    /** Lý do huỷ (nếu có). */
    cancelReason: { type: String, default: "" },
    cancelledAt: { type: Date }
    /** Đơn đã bị hủy trong 1 giờ? Dùng cho nghiệp vụ huỷ đơn. */
  },
  { timestamps: true }
);
orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ "subOrders.storeId": 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });
var OrderModel = defineModel("Order", orderSchema);

// src/server/models/Payment.ts
import { Schema as Schema7 } from "mongoose";
var paymentSchema = new Schema7(
  {
    orderId: { type: Schema7.Types.ObjectId, ref: "Order", required: true, index: true },
    orderCode: { type: String, default: "", index: true },
    userId: { type: Schema7.Types.ObjectId, ref: "User", index: true },
    storeId: { type: Schema7.Types.ObjectId, ref: "Store", index: true },
    amount: { type: Number, required: true, min: 0 },
    /** Phí sàn trừ vào doanh thu seller (2.3%). */
    platformFee: { type: Number, default: 0 },
    /** Tiền seller thực nhận = amount - platformFee. */
    netAmount: { type: Number, default: 0 },
    method: { type: String, default: "cod" },
    status: {
      type: String,
      enum: Object.values(TransactionStatus),
      default: TransactionStatus.PENDING,
      index: true
    },
    transactionId: { type: String, required: true, unique: true, index: true },
    /** Lý do hoàn tiền / thất bại. */
    note: { type: String, default: "" },
    refundedAt: { type: Date }
  },
  { timestamps: true }
);
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });
var PaymentModel = defineModel("Payment", paymentSchema);

// src/server/models/Review.ts
import { Schema as Schema8 } from "mongoose";
var reviewReplySchema = new Schema8(
  {
    userId: { type: Schema8.Types.ObjectId, ref: "User" },
    userName: { type: String, default: "" },
    comment: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: true }
);
var reviewSchema = new Schema8(
  {
    productId: { type: Schema8.Types.ObjectId, ref: "Product", required: true, index: true },
    productName: { type: String, default: "" },
    productImage: { type: String, default: "" },
    storeId: { type: Schema8.Types.ObjectId, ref: "Store", index: true },
    userId: { type: Schema8.Types.ObjectId, ref: "User", index: true },
    userName: { type: String, default: "" },
    userAvatar: { type: String, default: "" },
    /** Đơn hàng đã mua — dùng để đánh dấu "đã mua hàng". */
    orderId: { type: Schema8.Types.ObjectId, ref: "Order", index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    images: { type: [String], default: [] },
    /** Đánh giá đã mua hàng thật. */
    isVerified: { type: Boolean, default: false },
    /** Người bán đã ẩn đánh giá (moderation). */
    isHidden: { type: Boolean, default: false, index: true },
    /** Phản hồi của cửa hàng. */
    hasResponse: { type: Boolean, default: false },
    sellerResponse: { type: String, default: "" },
    sellerRespondedAt: { type: Date },
    replies: { type: [reviewReplySchema], default: [] }
  },
  { timestamps: true }
);
reviewSchema.index({ productId: 1, createdAt: -1 });
reviewSchema.index({ storeId: 1, isHidden: 1, createdAt: -1 });
var ReviewModel = defineModel("Review", reviewSchema);

// src/server/models/Promotion.ts
import { Schema as Schema9 } from "mongoose";
var promotionSchema = new Schema9(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    discount: { type: Number, default: 0, min: 0, max: 100 },
    code: { type: String, default: "", index: true },
    type: {
      type: String,
      enum: Object.values(PromotionType),
      default: PromotionType.DISCOUNT_CAMPAIGN
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: Object.values(SellerPromotionStatus),
      default: SellerPromotionStatus.ACTIVE,
      index: true
    },
    storeId: { type: Schema9.Types.ObjectId, ref: "Store", index: true },
    // ─── Cấu hình chi tiết (dùng cho voucher của seller) ───────────────────
    discountType: {
      type: String,
      enum: Object.values(DiscountType),
      default: DiscountType.PERCENT
    },
    discountValue: { type: Number, default: 0, min: 0 },
    minOrderValue: { type: Number, default: 0, min: 0 },
    maxDiscount: { type: Number, default: 0, min: 0 },
    usageLimit: { type: Number, default: 0, min: 0 },
    usedCount: { type: Number, default: 0, min: 0 },
    targetProducts: { type: [Schema9.Types.ObjectId], default: [] },
    targetCategories: { type: [Schema9.Types.ObjectId], default: [] }
  },
  { timestamps: true }
);
promotionSchema.index({ startDate: 1, endDate: 1 });
var PromotionModel = defineModel("Promotion", promotionSchema);
var voucherSchema = new Schema9(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    name: { type: String, default: "" },
    description: { type: String, default: "" },
    discountType: {
      type: String,
      enum: Object.values(DiscountType),
      default: DiscountType.FIXED
    },
    discountValue: { type: Number, required: true, min: 0 },
    maxDiscount: { type: Number, default: 0, min: 0 },
    minOrderValue: { type: Number, default: 0, min: 0 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: Object.values(SellerPromotionStatus),
      default: SellerPromotionStatus.ACTIVE,
      index: true
    },
    usageLimit: { type: Number, default: 0, min: 0 },
    usedCount: { type: Number, default: 0, min: 0 },
    perUserLimit: { type: Number, default: 1, min: 0 },
    targetProducts: { type: [Schema9.Types.ObjectId], default: [] },
    targetCategories: { type: [Schema9.Types.ObjectId], default: [] },
    storeId: { type: Schema9.Types.ObjectId, ref: "Store", index: true },
    savedBy: { type: [Schema9.Types.ObjectId], default: [] }
  },
  { timestamps: true }
);
var VoucherModel = defineModel("Voucher", voucherSchema);

// src/server/models/Notification.ts
import { Schema as Schema10 } from "mongoose";
var notificationSchema = new Schema10(
  {
    /** Người nhận — null nghĩa là gửi broadcast theo `audience`. */
    userId: { type: Schema10.Types.ObjectId, ref: "User", index: true },
    /** Người nhận theo role (dùng cho broadcast). */
    audience: {
      type: String,
      enum: Object.values(NotificationAudience),
      default: NotificationAudience.ALL,
      index: true
    },
    storeId: { type: Schema10.Types.ObjectId, ref: "Store", index: true },
    type: {
      type: String,
      enum: [
        ...Object.values(CustomerNotificationType),
        ...Object.values(SellerNotificationType),
        ...Object.values(AdminNotificationType)
      ],
      required: true,
      index: true
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false, index: true },
    link: { type: String, default: "" },
    /** Thông báo do hệ thống tự sinh (đơn hàng, thanh toán...). */
    isSystem: { type: Boolean, default: false }
  },
  { timestamps: true }
);
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ createdAt: -1 });
var NotificationModel = defineModel("Notification", notificationSchema);

// src/server/models/SupportTicket.ts
import { Schema as Schema11 } from "mongoose";
var messageSchema = new Schema11(
  {
    sender: {
      type: String,
      enum: Object.values(MessageSender),
      default: MessageSender.CUSTOMER
    },
    senderName: { type: String, default: "" },
    content: { type: String, required: true },
    attachments: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: true }
);
var ticketSchema = new Schema11(
  {
    ticketCode: { type: String, required: true, unique: true, index: true },
    /** CUSTOMER | SELLER | ADMIN */
    scope: { type: String, default: "CUSTOMER", index: true },
    userId: { type: Schema11.Types.ObjectId, ref: "User", index: true },
    customerName: { type: String, default: "" },
    customerEmail: { type: String, default: "" },
    customerAvatar: { type: String, default: "" },
    storeId: { type: Schema11.Types.ObjectId, ref: "Store", index: true },
    orderId: { type: Schema11.Types.ObjectId, ref: "Order", index: true },
    subject: { type: String, required: true },
    category: {
      type: String,
      enum: Object.values(TicketCategory),
      default: TicketCategory.OTHER,
      index: true
    },
    priority: {
      type: String,
      enum: Object.values(TicketPriority),
      default: TicketPriority.MEDIUM,
      index: true
    },
    status: {
      type: String,
      enum: [
        ...Object.values(CustomerTicketStatus),
        ...Object.values(SellerTicketStatus),
        ...Object.values(AdminTicketStatus)
      ],
      default: CustomerTicketStatus.OPEN,
      index: true
    },
    messages: { type: [messageSchema], default: [] },
    /** Người được admin giao xử lý. */
    assignee: { type: String, default: "" }
  },
  { timestamps: true }
);
ticketSchema.index({ scope: 1, status: 1, createdAt: -1 });
ticketSchema.index({ storeId: 1, createdAt: -1 });
var TicketModel = defineModel("SupportTicket", ticketSchema);

// src/server/models/Inventory.ts
import { Schema as Schema12 } from "mongoose";
var inventorySchema = new Schema12(
  {
    storeId: { type: Schema12.Types.ObjectId, ref: "Store", required: true, index: true },
    productId: { type: Schema12.Types.ObjectId, ref: "Product", required: true, index: true },
    productName: { type: String, default: "" },
    productImage: { type: String, default: "" },
    category: { type: String, default: "" },
    sku: { type: String, required: true, index: true },
    stock: { type: Number, default: 0, min: 0 },
    minStock: { type: Number, default: 10, min: 0 },
    reserved: { type: Number, default: 0, min: 0 },
    /** stock - reserved */
    available: { type: Number, default: 0, min: 0 },
    sold: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: Object.values(InventoryStatus),
      default: InventoryStatus.IN_STOCK,
      index: true
    },
    lastRestocked: { type: Date, default: Date.now }
  },
  { timestamps: true }
);
inventorySchema.index({ storeId: 1, sku: 1 }, { unique: true });
inventorySchema.index({ storeId: 1, status: 1 });
var InventoryModel = defineModel("Inventory", inventorySchema);

// src/server/models/Shipping.ts
import { Schema as Schema13 } from "mongoose";
var shippingSchema = new Schema13(
  {
    orderId: { type: Schema13.Types.ObjectId, ref: "Order", required: true, index: true },
    orderCode: { type: String, default: "", index: true },
    storeId: { type: Schema13.Types.ObjectId, ref: "Store", index: true },
    trackingNumber: { type: String, default: "", index: true },
    carrier: { type: String, default: "" },
    status: {
      type: String,
      enum: Object.values(ShippingStatus),
      default: ShippingStatus.WAITING_PICKUP,
      index: true
    },
    senderName: { type: String, default: "" },
    senderPhone: { type: String, default: "" },
    senderAddress: { type: String, default: "" },
    receiverName: { type: String, default: "" },
    receiverPhone: { type: String, default: "" },
    receiverAddress: { type: String, default: "" },
    weight: { type: Number, default: 0 },
    dimensions: { type: String, default: "" },
    shippingFee: { type: Number, default: 0 },
    /** Tiền thu hộ (COD). */
    codAmount: { type: Number, default: 0 },
    estimatedDelivery: { type: Date },
    actualDelivery: { type: Date }
  },
  { timestamps: true }
);
shippingSchema.index({ storeId: 1, status: 1, createdAt: -1 });
var ShippingModel = defineModel("Shipping", shippingSchema);

// src/server/models/Blog.ts
import { Schema as Schema14 } from "mongoose";
var blogSchema = new Schema14(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    excerpt: { type: String, default: "" },
    content: { type: String, default: "" },
    thumbnail: { type: String, default: "" },
    author: { type: String, default: "" },
    authorAvatar: { type: String, default: "" },
    category: { type: String, default: "", index: true },
    views: { type: Number, default: 0 },
    tags: { type: [String], default: [] }
  },
  { timestamps: true }
);
blogSchema.index({ createdAt: -1 });
var BlogModel = defineModel("Blog", blogSchema);

// src/server/models/Role.ts
import { Schema as Schema15 } from "mongoose";
var roleSchema = new Schema15(
  {
    name: { type: String, required: true, unique: true, uppercase: true, index: true },
    label: { type: String, default: "" },
    description: { type: String, default: "" },
    color: { type: String, default: "#4F46E5" },
    bg: { type: String, default: "rgba(79,70,229,0.1)" },
    permissions: { type: [String], default: [] },
    /** Đánh dấu đây là bản ghi do admin chỉnh sửa (không phải mặc định). */
    isCustom: { type: Boolean, default: false }
  },
  { timestamps: true }
);
var RoleModel = defineModel("Role", roleSchema);

// src/server/auth/tokens.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
var SALT_ROUNDS = 10;
async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

// scripts/seed.ts
var __dirname = dirname2(fileURLToPath2(import.meta.url));
var RESET = process.argv.includes("--reset");
function resolveMockDataPath() {
  const candidates = [
    resolve2(process.cwd(), "scripts/data/frontend-mock.json"),
    resolve2(__dirname, "data/frontend-mock.json"),
    resolve2(__dirname, "../scripts/data/frontend-mock.json")
  ];
  for (const c of candidates) {
    if (existsSync2(c)) return c;
  }
  throw new Error(
    `Kh\xF4ng t\xECm th\u1EA5y frontend-mock.json. \u0110\xE3 th\u1EED: ${candidates.join(", ")}`
  );
}
function slugify(input) {
  return input.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 140) || "item";
}
function daysAgo(days) {
  const d = /* @__PURE__ */ new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * days));
  d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0);
  return d;
}
var PAYMENT_METHODS = [
  "cod",
  "banking",
  "vnpay",
  "momo",
  "zalopay"
];
var PAYMENT_METHOD_LABEL = {
  COD: "COD",
  "Chuy\u1EC3n kho\u1EA3n": "banking",
  VNPay: "vnpay",
  ZaloPay: "zalopay",
  MoMo: "momo"
};
function normalizeMethod(raw) {
  const mapped = PAYMENT_METHOD_LABEL[raw];
  if (mapped) return mapped;
  const lower = raw?.toLowerCase();
  if (PAYMENT_METHODS.includes(lower)) {
    return lower;
  }
  return "cod";
}
var CATEGORIES = [
  { slug: "dien-thoai", name: "\u0110i\u1EC7n tho\u1EA1i", icon: "\u{1F4F1}", order: 1, featured: true },
  { slug: "laptop", name: "Laptop", icon: "\u{1F4BB}", order: 2, featured: true },
  { slug: "pc-gaming", name: "PC Gaming", icon: "\u{1F5A5}\uFE0F", order: 3, featured: true },
  { slug: "man-hinh", name: "M\xE0n h\xECnh", icon: "\u{1F5B5}", order: 4, featured: true },
  { slug: "chuot", name: "Chu\u1ED9t", icon: "\u{1F5B1}\uFE0F", order: 5, featured: false },
  { slug: "ban-phim", name: "B\xE0n ph\xEDm", icon: "\u2328\uFE0F", order: 6, featured: false },
  { slug: "tai-nghe", name: "Tai nghe", icon: "\u{1F3A7}", order: 7, featured: true },
  { slug: "phu-kien", name: "Ph\u1EE5 ki\u1EC7n", icon: "\u{1F50C}", order: 8, featured: false }
];
var CATEGORY_ID_MAP = {
  "cat-phone": "dien-thoai",
  "cat-laptop": "laptop",
  "cat-pc": "pc-gaming",
  "cat-monitor": "man-hinh",
  "cat-mouse": "chuot",
  "cat-keyboard": "ban-phim",
  "cat-headphone": "tai-nghe",
  "cat-accessory": "phu-kien"
};
async function seed() {
  console.log("[seed] \u0110ang \u0111\u1ECDc d\u1EEF li\u1EC7u frontend...");
  const raw = readFileSync2(resolveMockDataPath(), "utf-8");
  const mock = JSON.parse(raw);
  await connectDB();
  console.log("[seed] \u0110\xE3 k\u1EBFt n\u1ED1i MongoDB.");
  if (RESET) {
    console.log("[seed] Xo\xE1 d\u1EEF li\u1EC7u c\u0169...");
    await Promise.all([
      UserModel.deleteMany({}),
      StoreModel.deleteMany({}),
      ProductModel.deleteMany({}),
      CategoryModel.deleteMany({}),
      BrandModel.deleteMany({}),
      OrderModel.deleteMany({}),
      PaymentModel.deleteMany({}),
      ReviewModel.deleteMany({}),
      PromotionModel.deleteMany({}),
      VoucherModel.deleteMany({}),
      NotificationModel.deleteMany({}),
      TicketModel.deleteMany({}),
      InventoryModel.deleteMany({}),
      ShippingModel.deleteMany({}),
      BlogModel.deleteMany({}),
      RoleModel.deleteMany({})
    ]);
  }
  console.log("[seed] T\u1EA1o danh m\u1EE5c...");
  const categoryMap = /* @__PURE__ */ new Map();
  for (const c of CATEGORIES) {
    const doc = await CategoryModel.findOneAndUpdate(
      { slug: c.slug },
      {
        $set: {
          name: c.name,
          slug: c.slug,
          icon: c.icon,
          order: c.order,
          featured: c.featured,
          description: `S\u1EA3n ph\u1EA9m ${c.name.toLowerCase()} ch\xEDnh h\xE3ng t\u1EA1i Henzo Store`,
          banner: `https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800`
        }
      },
      { upsert: true, new: true }
    );
    categoryMap.set(c.slug, doc._id);
  }
  console.log("[seed] T\u1EA1o th\u01B0\u01A1ng hi\u1EC7u...");
  const brandMap = /* @__PURE__ */ new Map();
  const allBrands = /* @__PURE__ */ new Map();
  for (const b of mock.brands) allBrands.set(b.name, b);
  for (const p of mock.products) {
    if (!allBrands.has(p.brand)) {
      allBrands.set(p.brand, {
        id: `b-${slugify(p.brand)}`,
        name: p.brand,
        slug: slugify(p.brand),
        logo: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(p.brand)}`,
        productCount: 0
      });
    }
  }
  for (const b of allBrands.values()) {
    const count = mock.products.filter((p) => p.brand === b.name).length;
    const doc = await BrandModel.findOneAndUpdate(
      { slug: b.slug },
      {
        $set: {
          name: b.name,
          slug: b.slug,
          logo: b.logo,
          productCount: count,
          tagline: `${b.name} ch\xEDnh h\xE3ng`
        }
      },
      { upsert: true, new: true }
    );
    brandMap.set(b.name, doc._id);
  }
  console.log("[seed] T\u1EA1o ng\u01B0\u1EDDi d\xF9ng...");
  const defaultPassword = await hashPassword("123456");
  const adminPassword = await hashPassword("admin123");
  const staffSeed = [
    {
      name: "Qu\u1EA3n Tr\u1ECB Vi\xEAn H\u1EC7 Th\u1ED1ng",
      email: "admin@henzo.com",
      role: "ADMIN",
      password: adminPassword
    },
    {
      name: "Nguy\u1EC5n V\u0103n Quang",
      email: "mod@henzo.com",
      role: "MODERATOR",
      password: defaultPassword
    },
    {
      name: "Tr\u1EA7n Th\u1ECB H\u01B0\u01A1ng",
      email: "cs@henzo.com",
      role: "STAFF",
      password: defaultPassword
    },
    {
      name: "L\xEA Minh Tu\u1EA5n",
      email: "tuanlm@henzo.com",
      role: "STAFF",
      password: defaultPassword
    },
    {
      name: "Ph\u1EA1m Th\u1ECB Lan",
      email: "lanpt@henzo.com",
      role: "MODERATOR",
      password: defaultPassword,
      status: "locked"
    }
  ];
  const staffIds = [];
  for (const s of staffSeed) {
    const user = await UserModel.findOneAndUpdate(
      { email: s.email },
      {
        $set: {
          name: s.name,
          role: s.role,
          status: s.status ?? "active",
          permissions: ROLE_PERMISSIONS[s.role] ?? [],
          password: s.password,
          phone: "0900000000",
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.email}`,
          lastLoginAt: daysAgo(3)
        },
        $setOnInsert: { createdAt: daysAgo(200) }
      },
      { upsert: true, new: true }
    );
    staffIds.push(user._id);
  }
  console.log("[seed] T\u1EA1o c\u1EEDa h\xE0ng...");
  const storeMap = /* @__PURE__ */ new Map();
  const storeDocs = [];
  const sourceStores = [
    ...mock.stores,
    ...mock.adminStores.filter(
      (s) => !mock.stores.some((x) => x.name === s.name)
    )
  ];
  for (const s of sourceStores) {
    const slug = slugify(s.name);
    const doc = await StoreModel.findOneAndUpdate(
      { slug },
      {
        $set: {
          name: s.name,
          slug,
          email: s.email,
          phone: s.phone,
          address: s.address,
          avatar: s.avatar,
          banner: s.banner ?? "",
          description: s.description ?? "Chuy\xEAn cung c\u1EA5p c\xE1c s\u1EA3n ph\u1EA9m c\xF4ng ngh\u1EC7 ch\xEDnh h\xE3ng v\u1EDBi gi\xE1 t\u1ED1t nh\u1EA5t th\u1ECB tr\u01B0\u1EDDng.",
          rating: s.rating,
          productCount: 0,
          orderCount: s.orderCount ?? 0,
          followerCount: s.followerCount ?? 0,
          isVerified: s.isVerified,
          status: s.status ?? "active",
          taxId: s.taxId ?? "",
          bankAccount: s.bankAccount ?? "",
          bankName: s.bankName ?? "Vietcombank"
        },
        $setOnInsert: { createdAt: new Date(s.createdAt) }
      },
      { upsert: true, new: true }
    );
    storeMap.set(s.name, doc._id);
    storeDocs.push(doc);
  }
  const primaryStore = storeDocs[0];
  const shopUser = await UserModel.findOneAndUpdate(
    { email: "shop@henzo.com" },
    {
      $set: {
        name: primaryStore.name,
        email: "shop@henzo.com",
        role: "SHOP",
        status: "active",
        storeId: primaryStore._id,
        permissions: ROLE_PERMISSIONS.SHOP,
        phone: primaryStore.phone,
        password: defaultPassword,
        avatar: primaryStore.avatar
      },
      $setOnInsert: { createdAt: daysAgo(300) }
    },
    { upsert: true, new: true }
  );
  await StoreModel.updateOne(
    { _id: primaryStore._id },
    { $set: { ownerId: shopUser._id } }
  );
  console.log("[seed] T\u1EA1o s\u1EA3n ph\u1EA9m...");
  const productMap = /* @__PURE__ */ new Map();
  const products = [];
  const activeStores = storeDocs.filter((s) => s.status === "active");
  for (let i = 0; i < mock.products.length; i++) {
    const p = mock.products[i];
    const store = activeStores[i % Math.max(1, activeStores.length)];
    const categorySlug = CATEGORY_ID_MAP[p.categoryId] ?? slugify(p.categoryName);
    const categoryId = categoryMap.get(categorySlug) ?? categoryMap.get("phu-kien");
    const doc = await ProductModel.findOneAndUpdate(
      { slug: p.slug },
      {
        $set: {
          name: p.name,
          slug: p.slug,
          description: p.description,
          shortDescription: p.description.slice(0, 160),
          price: p.price,
          originalPrice: p.originalPrice,
          discount: p.discount,
          images: p.images,
          categoryId,
          categoryName: p.categoryName,
          brand: p.brand,
          rating: p.rating,
          reviewCount: p.reviewCount,
          stock: p.stock,
          sold: p.sold,
          tags: p.tags,
          specifications: p.specifications,
          isFeatured: p.isFeatured,
          isNew: p.isNew,
          isHot: p.isHot,
          storeId: store._id,
          status: "active",
          sku: `SKU-${p.id.toUpperCase()}`,
          viewCount: Math.floor(Math.random() * 5e3) + 100,
          minStock: 10
        },
        $setOnInsert: { createdAt: new Date(p.createdAt) }
      },
      { upsert: true, new: true }
    );
    productMap.set(p.id, doc._id);
    products.push(doc);
  }
  const sellerProducts = mock.sellerProducts ?? [];
  for (let i = 0; i < sellerProducts.length; i++) {
    const p = sellerProducts[i];
    if (!p?.slug) continue;
    const categorySlug = CATEGORY_ID_MAP[p.categoryId] ?? slugify(p.categoryName);
    const categoryId = categoryMap.get(categorySlug);
    const doc = await ProductModel.findOneAndUpdate(
      { slug: p.slug },
      {
        $set: {
          name: p.name,
          slug: p.slug,
          description: p.description,
          price: p.price,
          originalPrice: p.originalPrice,
          discount: p.discount,
          images: p.images,
          categoryId,
          categoryName: p.categoryName,
          brand: p.brand,
          rating: p.rating,
          reviewCount: p.reviewCount,
          stock: p.stock,
          sold: p.sold,
          tags: p.tags,
          specifications: p.specifications,
          isFeatured: p.isFeatured,
          isNew: p.isNew,
          isHot: p.isHot,
          storeId: primaryStore._id,
          status: "active",
          sku: `SKU-S${String(i + 1).padStart(4, "0")}`,
          minStock: 10
        },
        $setOnInsert: { createdAt: new Date(p.createdAt) }
      },
      { upsert: true, new: true }
    );
    productMap.set(p.id, doc._id);
    products.push(doc);
  }
  const storeProductCounts = /* @__PURE__ */ new Map();
  for (const p of products) {
    const key = String(p.storeId);
    storeProductCounts.set(key, (storeProductCounts.get(key) ?? 0) + 1);
  }
  for (const [storeId, count] of storeProductCounts) {
    await StoreModel.updateOne({ _id: storeId }, { $set: { productCount: count } });
  }
  console.log("[seed] T\u1EA1o d\u1EEF li\u1EC7u kho h\xE0ng...");
  const inventoryDocs = products.map((p) => {
    const status = p.stock === 0 ? InventoryStatus.OUT_OF_STOCK : p.stock < 10 ? InventoryStatus.LOW_STOCK : InventoryStatus.IN_STOCK;
    return {
      storeId: p.storeId,
      productId: p._id,
      productName: p.name,
      productImage: p.images?.[0] ?? "",
      category: p.categoryName,
      sku: p.sku,
      stock: p.stock,
      minStock: 10,
      reserved: 0,
      available: p.stock,
      sold: p.sold,
      status,
      lastRestocked: daysAgo(30)
    };
  });
  if (inventoryDocs.length) {
    await InventoryModel.bulkWrite(
      inventoryDocs.map((doc) => ({
        updateOne: {
          filter: { storeId: doc.storeId, sku: doc.sku },
          update: { $set: doc },
          upsert: true
        }
      }))
    );
  }
  console.log("[seed] T\u1EA1o kh\xE1ch h\xE0ng...");
  const customerMap = /* @__PURE__ */ new Map();
  const demoCustomer = await UserModel.findOneAndUpdate(
    { email: "customer@henzo.com" },
    {
      $set: {
        name: "Nguy\u1EC5n V\u0103n A",
        email: "customer@henzo.com",
        role: "CUSTOMER",
        status: "active",
        phone: "0912345678",
        password: defaultPassword,
        address: "S\u1ED1 1, \u0110\u01B0\u1EDDng L\xEA L\u1EE3i, Qu\u1EADn 1, TP.HCM",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=customer1",
        points: 1200
      },
      $setOnInsert: { createdAt: daysAgo(180) }
    },
    { upsert: true, new: true }
  );
  customerMap.set("customer-1", demoCustomer._id);
  for (const c of mock.adminCustomers) {
    const email = c.email.toLowerCase();
    const user = await UserModel.findOneAndUpdate(
      { email },
      {
        $set: {
          name: c.name,
          role: "CUSTOMER",
          status: "active",
          phone: c.phone,
          address: c.address,
          avatar: c.avatar,
          password: defaultPassword
        },
        $setOnInsert: { createdAt: new Date(c.createdAt) }
      },
      { upsert: true, new: true }
    );
    customerMap.set(c.id, user._id);
  }
  console.log("[seed] T\u1EA1o \u0111\u01A1n h\xE0ng...");
  const orderDocs = [];
  const paymentDocs = [];
  const shippingDocs = [];
  const customerList = [...customerMap.values()];
  for (let i = 0; i < mock.adminOrders.length; i++) {
    const o = mock.adminOrders[i];
    const createdAt = new Date(o.createdAt);
    const customerId = customerList[i % customerList.length] ?? demoCustomer._id;
    const groupCount = 1 + i % 3;
    const usedProducts = /* @__PURE__ */ new Set();
    const groups = /* @__PURE__ */ new Map();
    for (let g = 0; g < groupCount; g++) {
      const product = products[(i * 7 + g * 13) % products.length];
      const key = String(product.storeId);
      if (usedProducts.has(String(product._id))) continue;
      usedProducts.add(String(product._id));
      const qty = 1 + (i + g) % 3;
      const store = storeDocs.find((s) => String(s._id) === key);
      if (!store) continue;
      const item = {
        productId: product._id,
        productName: product.name,
        productImage: product.images?.[0] ?? "",
        productSlug: product.slug,
        sku: product.sku,
        unitPrice: product.price,
        quantity: qty,
        totalPrice: product.price * qty,
        options: {}
      };
      const existing = groups.get(key);
      if (existing) existing.items.push(item);
      else groups.set(key, { store, items: [item] });
    }
    if (!groups.size) continue;
    const customerUser = await UserModel.findById(customerId).lean();
    const subtotal = [...groups.values()].reduce(
      (sum, g) => sum + g.items.reduce((s, it) => s + it.totalPrice, 0),
      0
    );
    const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
    const discount = o.discount ?? 0;
    const totalPrice = Math.max(0, subtotal + shippingFee - discount);
    const customerStatus = o.status ?? "pending";
    const sellerStatusMap = {
      pending: SellerOrderStatus.PENDING,
      confirmed: SellerOrderStatus.CONFIRMED,
      processing: SellerOrderStatus.PREPARING,
      shipping: SellerOrderStatus.DELIVERING,
      delivered: SellerOrderStatus.DELIVERED,
      cancelled: SellerOrderStatus.CANCELLED
    };
    const sellerStatus = sellerStatusMap[customerStatus] ?? SellerOrderStatus.PENDING;
    const subOrders = [...groups.values()].map((g) => {
      const groupSubtotal = g.items.reduce((s, it) => s + it.totalPrice, 0);
      const groupShipping = groups.size === 1 ? shippingFee : Math.floor(shippingFee / groups.size);
      return {
        storeId: g.store._id,
        storeName: g.store.name,
        status: sellerStatus,
        items: g.items,
        subtotal: groupSubtotal,
        shippingFee: groupShipping,
        discount: 0,
        totalPrice: groupSubtotal + groupShipping,
        trackingNumber: sellerStatus === SellerOrderStatus.DELIVERED || sellerStatus === SellerOrderStatus.DELIVERING ? `${SHIPPING_CARRIERS[i % SHIPPING_CARRIERS.length]}${Date.now().toString().slice(-10)}` : "",
        shippingPartner: SHIPPING_CARRIERS[i % SHIPPING_CARRIERS.length],
        estimatedDelivery: new Date(createdAt.getTime() + 5 * 864e5),
        deliveredAt: sellerStatus === SellerOrderStatus.DELIVERED ? new Date(createdAt.getTime() + 4 * 864e5) : void 0,
        statusHistory: [
          {
            status: SellerOrderStatus.PENDING,
            at: createdAt,
            note: "\u0110\u01A1n h\xE0ng \u0111\u01B0\u1EE3c t\u1EA1o"
          },
          ...sellerStatus !== SellerOrderStatus.PENDING ? [
            {
              status: sellerStatus,
              at: new Date(createdAt.getTime() + 864e5),
              note: "C\u1EADp nh\u1EADt tr\u1EA1ng th\xE1i"
            }
          ] : []
        ]
      };
    });
    const allItems = [...groups.values()].flatMap((g) => g.items);
    const paymentMethod = normalizeMethod(o.paymentMethod);
    const paymentStatus = customerStatus === "delivered" && paymentMethod === "cod" ? OrderPaymentStatus.UNPAID : customerStatus === "delivered" || customerStatus === "confirmed" ? OrderPaymentStatus.PAID : paymentMethod === "cod" ? OrderPaymentStatus.UNPAID : OrderPaymentStatus.PAID;
    const doc = await OrderModel.findOneAndUpdate(
      { orderNumber: o.orderNumber },
      {
        $set: {
          customerId,
          customerName: o.customerName,
          customerPhone: o.customerPhone,
          customerAvatar: customerUser?.avatar ?? "",
          items: allItems,
          subOrders,
          subtotal,
          shippingFee,
          discount,
          totalPrice,
          status: customerStatus,
          paymentStatus,
          paymentMethod,
          shippingName: o.customerName,
          shippingPhone: o.customerPhone,
          shippingAddress: o.shippingAddress,
          shippingProvince: "TP. H\u1ED3 Ch\xED Minh",
          shippingDistrict: "Qu\u1EADn 1",
          note: "",
          shippingUpdates: [
            {
              status: customerStatus,
              location: "TP. H\u1ED3 Ch\xED Minh",
              description: "\u0110\u01A1n h\xE0ng \u0111ang \u0111\u01B0\u1EE3c x\u1EED l\xFD",
              timestamp: createdAt
            }
          ]
        },
        $setOnInsert: { createdAt }
      },
      { upsert: true, new: true, timestamps: false }
    );
    orderDocs.push(doc);
    const TXN_STATUS_BY_PAYMENT = {
      [OrderPaymentStatus.PAID]: TransactionStatus.SUCCESS,
      [OrderPaymentStatus.REFUNDED]: TransactionStatus.REFUNDED,
      [OrderPaymentStatus.FAILED]: TransactionStatus.FAILED,
      [OrderPaymentStatus.UNPAID]: TransactionStatus.PENDING
    };
    const txnStatus = TXN_STATUS_BY_PAYMENT[paymentStatus] ?? TransactionStatus.PENDING;
    const platformFee = Math.floor(totalPrice * PLATFORM_FEE_RATE);
    const payment = await PaymentModel.findOneAndUpdate(
      { transactionId: `TXN${String(1e5 + i)}` },
      {
        $set: {
          orderId: doc._id,
          orderCode: o.orderNumber,
          userId: customerId,
          storeId: subOrders[0]?.storeId,
          amount: totalPrice,
          platformFee,
          netAmount: totalPrice - platformFee,
          method: paymentMethod,
          status: txnStatus
        },
        $setOnInsert: { createdAt }
      },
      { upsert: true, new: true }
    );
    paymentDocs.push(payment);
    if (sellerStatus === SellerOrderStatus.DELIVERED || sellerStatus === SellerOrderStatus.DELIVERING) {
      shippingDocs.push({
        orderId: doc._id,
        orderCode: o.orderNumber,
        storeId: subOrders[0].storeId,
        trackingNumber: subOrders[0].trackingNumber,
        carrier: subOrders[0].shippingPartner,
        status: sellerStatus === SellerOrderStatus.DELIVERED ? "delivered" : "in_transit",
        receiverName: o.customerName,
        receiverPhone: o.customerPhone,
        receiverAddress: o.shippingAddress,
        weight: 1,
        dimensions: "20x15x5",
        shippingFee: subOrders[0].shippingFee,
        codAmount: paymentMethod === "cod" ? subOrders[0].totalPrice : 0,
        estimatedDelivery: subOrders[0].estimatedDelivery,
        createdAt
      });
    }
  }
  if (shippingDocs.length) {
    await ShippingModel.bulkWrite(
      shippingDocs.map((doc) => ({
        updateOne: {
          filter: { orderId: doc.orderId, storeId: doc.storeId },
          update: { $set: doc },
          upsert: true
        }
      }))
    );
  }
  console.log("[seed] T\u1EA1o \u0111\xE1nh gi\xE1...");
  const reviewDocs = [];
  for (const r of mock.reviews) {
    const product = productMap.get(r.productId);
    if (!product) continue;
    const productDoc = products.find((p) => String(p._id) === String(product));
    reviewDocs.push({
      productId: product,
      productName: productDoc?.name ?? "",
      productImage: productDoc?.images?.[0] ?? "",
      storeId: productDoc?.storeId,
      userId: customerMap.get(r.userId) ?? demoCustomer._id,
      userName: r.userName,
      userAvatar: r.userAvatar,
      rating: r.rating,
      comment: r.comment,
      images: [],
      isVerified: r.isVerified,
      isHidden: false,
      hasResponse: (r.replies?.length ?? 0) > 0,
      sellerResponse: r.replies?.[0]?.comment ?? "",
      sellerRespondedAt: r.replies?.[0]?.createdAt ? new Date(r.replies[0].createdAt) : void 0,
      replies: (r.replies ?? []).map((rp) => ({
        userId: customerMap.get(rp.userId) ?? demoCustomer._id,
        userName: rp.userName,
        comment: rp.comment,
        createdAt: new Date(rp.createdAt)
      })),
      createdAt: new Date(r.createdAt)
    });
  }
  for (const r of mock.adminReviews) {
    const product = productMap.get(r.productId);
    if (!product) continue;
    const productDoc = products.find((p) => String(p._id) === String(product));
    reviewDocs.push({
      productId: product,
      productName: productDoc?.name ?? "",
      productImage: productDoc?.images?.[0] ?? "",
      storeId: productDoc?.storeId,
      userId: customerMap.get(r.userId) ?? demoCustomer._id,
      userName: r.userName,
      userAvatar: r.userAvatar,
      rating: r.rating,
      comment: r.comment,
      images: [],
      isVerified: r.isVerified,
      isHidden: false,
      createdAt: new Date(r.createdAt)
    });
  }
  if (reviewDocs.length) {
    await ReviewModel.bulkWrite(
      reviewDocs.map((doc) => ({
        insertOne: { document: doc }
      })),
      { ordered: false }
    );
  }
  console.log("[seed] T\u1EA1o khuy\u1EBFn m\xE3i...");
  const promoDocs = mock.adminPromotions.map((p) => ({
    title: p.title,
    description: p.description,
    image: p.image,
    discount: p.discount,
    code: p.code ?? "",
    type: p.id.endsWith("3") ? PromotionType.FLASH_SALE : p.code ? PromotionType.VOUCHER : PromotionType.DISCOUNT_CAMPAIGN,
    startDate: new Date(p.startDate),
    endDate: new Date(p.endDate),
    status: p.isActive ? SellerPromotionStatus.ACTIVE : SellerPromotionStatus.ENDED,
    discountType: DiscountType.PERCENT,
    discountValue: p.discount,
    minOrderValue: 0,
    maxDiscount: 0,
    usageLimit: 0,
    usedCount: 0,
    createdAt: new Date(p.startDate)
  }));
  await PromotionModel.bulkWrite(
    promoDocs.map((doc) => ({
      updateOne: {
        filter: { title: doc.title, startDate: doc.startDate },
        update: { $set: doc },
        upsert: true
      }
    }))
  );
  const voucherDocs = [
    {
      code: "HENZO10",
      name: "Gi\u1EA3m 10% t\u1ED1i \u0111a 500K",
      description: "M\xE3 gi\u1EA3m 10% cho m\u1ECDi \u0111\u01A1n h\xE0ng, t\u1ED1i \u0111a 500.000\u0111",
      discountType: DiscountType.PERCENT,
      discountValue: 10,
      maxDiscount: 5e5,
      minOrderValue: 5e5,
      startDate: new Date(Date.now() - 30 * 864e5),
      endDate: new Date(Date.now() + 365 * 864e5),
      status: SellerPromotionStatus.ACTIVE,
      usageLimit: 1e3,
      usedCount: 0,
      perUserLimit: 2
    },
    {
      code: "FREESHIP",
      name: "Mi\u1EC5n ph\xED v\u1EADn chuy\u1EC3n",
      description: "Mi\u1EC5n ph\xED v\u1EADn chuy\u1EC3n cho \u0111\u01A1n t\u1EEB 300.000\u0111",
      discountType: DiscountType.SHIPPING,
      discountValue: SHIPPING_FEE,
      maxDiscount: SHIPPING_FEE,
      minOrderValue: 3e5,
      startDate: new Date(Date.now() - 30 * 864e5),
      endDate: new Date(Date.now() + 365 * 864e5),
      status: SellerPromotionStatus.ACTIVE,
      usageLimit: 5e3,
      usedCount: 0,
      perUserLimit: 5
    },
    {
      code: "WELCOME200K",
      name: "Ch\xE0o m\u1EEBng gi\u1EA3m 200K",
      description: "Gi\u1EA3m tr\u1EF1c ti\u1EBFp 200.000\u0111 cho \u0111\u01A1n \u0111\u1EA7u ti\xEAn",
      discountType: DiscountType.FIXED,
      discountValue: 2e5,
      maxDiscount: 2e5,
      minOrderValue: 5e5,
      startDate: new Date(Date.now() - 30 * 864e5),
      endDate: new Date(Date.now() + 365 * 864e5),
      status: SellerPromotionStatus.ACTIVE,
      usageLimit: 1e3,
      usedCount: 0,
      perUserLimit: 1
    }
  ];
  await VoucherModel.bulkWrite(
    voucherDocs.map((doc) => ({
      updateOne: {
        filter: { code: doc.code },
        update: { $set: doc },
        upsert: true
      }
    }))
  );
  console.log("[seed] T\u1EA1o phi\u1EBFu h\u1ED7 tr\u1EE3...");
  const ticketDocs = mock.adminTickets.map((t, i) => {
    const isShop = i % 3 !== 2;
    const store = isShop ? storeDocs[i % storeDocs.length] : void 0;
    const customerId = customerList[i % customerList.length];
    return {
      ticketCode: `TKTSPT-${String(i + 1).padStart(3, "0")}`,
      scope: isShop ? "SELLER" : "CUSTOMER",
      userId: customerId,
      customerName: isShop ? store.name : "Kh\xE1ch h\xE0ng",
      customerEmail: isShop ? store.email : "customer@henzo.com",
      customerAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=ticket${i}`,
      storeId: isShop ? store._id : void 0,
      subject: t.subject,
      category: i % 4 === 0 ? TicketCategory.TECHNICAL : i % 4 === 1 ? TicketCategory.ORDER : i % 4 === 2 ? TicketCategory.PAYMENT : TicketCategory.OTHER,
      priority: t.priority === "high" ? TicketPriority.HIGH : t.priority === "medium" ? TicketPriority.MEDIUM : TicketPriority.LOW,
      status: t.status ?? "open",
      assignee: t.status === "open" ? "" : "admin@henzo.com",
      messages: [
        {
          sender: isShop ? "seller" : "customer",
          senderName: isShop ? store.name : "Kh\xE1ch h\xE0ng",
          content: t.message,
          attachments: [],
          createdAt: new Date(t.createdAt)
        }
      ],
      createdAt: new Date(t.createdAt),
      updatedAt: new Date(t.updatedAt)
    };
  });
  await TicketModel.bulkWrite(
    ticketDocs.map((doc) => ({
      updateOne: {
        filter: { ticketCode: doc.ticketCode },
        update: { $set: doc },
        upsert: true
      }
    }))
  );
  console.log("[seed] T\u1EA1o th\xF4ng b\xE1o...");
  const notificationDocs = [
    {
      userId: demoCustomer._id,
      type: "promotion",
      title: "Flash Sale Cu\u1ED1i Tu\u1EA7n b\u1EAFt \u0111\u1EA7u!",
      message: "Gi\u1EA3m \u0111\u1EBFn 50% cho h\xE0ng tr\u0103m s\u1EA3n ph\u1EA9m c\xF4ng ngh\u1EC7 trong 3 ng\xE0y.",
      isRead: false,
      link: "/promotions"
    },
    {
      userId: demoCustomer._id,
      type: "voucher",
      title: "B\u1EA1n c\xF3 m\xE3 gi\u1EA3m 10%",
      message: "\xC1p d\u1EE5ng m\xE3 HENZO10 \u0111\u1EC3 gi\u1EA3m 10% t\u1ED1i \u0111a 500.000\u0111.",
      isRead: false,
      link: "/account/orders"
    },
    {
      userId: demoCustomer._id,
      type: "system",
      title: "Ch\xE0o m\u1EEBng \u0111\u1EBFn v\u1EDBi Henzo Store",
      message: "T\xE0i kho\u1EA3n c\u1EE7a b\u1EA1n \u0111\xE3 \u0111\u01B0\u1EE3c t\u1EA1o th\xE0nh c\xF4ng.",
      isRead: true,
      link: "/"
    }
  ];
  await NotificationModel.bulkWrite(
    notificationDocs.map((doc) => ({
      updateOne: {
        filter: { userId: doc.userId, title: doc.title },
        update: { $set: doc },
        upsert: true
      }
    }))
  );
  await NotificationModel.bulkWrite(
    [
      {
        title: "C\u1EA3nh b\xE1o: TechPro Shop vi ph\u1EA1m",
        message: "TechPro Shop b\u1ECB kh\xE1ch h\xE0ng ph\u1EA3n \xE1nh b\xE1n h\xE0ng gi\u1EA3. \u0110ang ch\u1EDD ki\u1EC3m duy\u1EC7t.",
        type: "warning"
      },
      {
        title: "Khuy\u1EBFn m\xE3i m\u1EDBi \u0111\u01B0\u1EE3c duy\u1EC7t",
        message: 'Khuy\u1EBFn m\xE3i "Flash Sale Cu\u1ED1i Tu\u1EA7n" \u0111\xE3 \u0111\u01B0\u1EE3c duy\u1EC7t v\xE0 \u0111ang ho\u1EA1t \u0111\u1ED9ng.',
        type: "promotion"
      },
      {
        title: "C\u1EADp nh\u1EADt h\u1EC7 th\u1ED1ng",
        message: "H\u1EC7 th\u1ED1ng s\u1EBD b\u1EA3o tr\xEC v\xE0o l\xFAc 02:00-04:00 ng\xE0y 05/06/2025.",
        type: "system"
      }
    ].map((doc) => ({
      updateOne: {
        filter: { userId: null, title: doc.title },
        update: {
          $set: {
            userId: null,
            audience: "all",
            type: doc.type,
            title: doc.title,
            message: doc.message,
            isRead: false,
            isSystem: true
          }
        },
        upsert: true
      }
    }))
  );
  console.log("[seed] T\u1EA1o b\xE0i vi\u1EBFt...");
  await BlogModel.bulkWrite(
    mock.blogs.map((b) => ({
      updateOne: {
        filter: { slug: b.slug },
        update: {
          $set: {
            title: b.title,
            slug: b.slug,
            excerpt: b.excerpt,
            content: b.excerpt,
            thumbnail: b.thumbnail,
            author: b.author,
            authorAvatar: b.authorAvatar,
            category: b.category,
            views: b.views,
            tags: [b.category]
          },
          $setOnInsert: { createdAt: new Date(b.createdAt) }
        },
        upsert: true
      }
    }))
  );
  console.log("[seed] T\u1EA1o c\u1EA5u h\xECnh ph\xE2n quy\u1EC1n...");
  await RoleModel.bulkWrite(
    Object.entries(ROLE_PERMISSIONS).map(([name, permissions]) => ({
      updateOne: {
        filter: { name },
        update: {
          $set: {
            name,
            permissions,
            isCustom: false,
            label: name === "ADMIN" ? "Admin" : name === "MODERATOR" ? "Moderator" : name === "STAFF" ? "Staff" : "Shop",
            description: "",
            color: "#4F46E5",
            bg: "rgba(79,70,229,0.1)"
          }
        },
        upsert: true
      }
    }))
  );
  const counts = {
    danhMuc: await CategoryModel.countDocuments({}),
    thuongHieu: await BrandModel.countDocuments({}),
    cuaHang: await StoreModel.countDocuments({}),
    nguoiDung: await UserModel.countDocuments({}),
    sanPham: await ProductModel.countDocuments({}),
    tonKho: await InventoryModel.countDocuments({}),
    donHang: await OrderModel.countDocuments({}),
    giaoDich: await PaymentModel.countDocuments({}),
    danhGia: await ReviewModel.countDocuments({}),
    khuyenMai: await PromotionModel.countDocuments({}),
    voucher: await VoucherModel.countDocuments({}),
    phieuHoTro: await TicketModel.countDocuments({}),
    vanDon: await ShippingModel.countDocuments({}),
    baiViet: await BlogModel.countDocuments({})
  };
  console.log("\n[seed] Ho\xE0n t\u1EA5t! S\u1ED1 l\u01B0\u1EE3ng b\u1EA3n ghi:");
  for (const [k, v] of Object.entries(counts)) {
    console.log(`  - ${k.padEnd(14)} ${v}`);
  }
  console.log("\n[seed] T\xE0i kho\u1EA3n \u0111\u0103ng nh\u1EADp:");
  console.log("  - Admin:      admin@henzo.com / admin123");
  console.log("  - Moderator:  mod@henzo.com / 123456");
  console.log("  - Staff:      cs@henzo.com / 123456");
  console.log("  - Shop:       shop@henzo.com / 123456");
  console.log("  - Customer:   customer@henzo.com / 123456");
  console.log("");
  await disconnectDB();
}
seed().catch(async (err) => {
  console.error("[seed] L\u1ED7i:", err);
  await disconnectDB().catch(() => {
  });
  process.exit(1);
});

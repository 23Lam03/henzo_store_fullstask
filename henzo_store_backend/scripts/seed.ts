import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Types } from 'mongoose';

import { connectDB, disconnectDB } from '../src/server/db.ts';
import { UserModel } from '../src/server/models/User.ts';
import { StoreModel } from '../src/server/models/Store.ts';
import { ProductModel } from '../src/server/models/Product.ts';
import { CategoryModel } from '../src/server/models/Category.ts';
import { BrandModel } from '../src/server/models/Brand.ts';
import { OrderModel } from '../src/server/models/Order.ts';
import { PaymentModel } from '../src/server/models/Payment.ts';
import { ReviewModel } from '../src/server/models/Review.ts';
import { PromotionModel, VoucherModel } from '../src/server/models/Promotion.ts';
import { NotificationModel } from '../src/server/models/Notification.ts';
import { TicketModel } from '../src/server/models/SupportTicket.ts';
import { InventoryModel } from '../src/server/models/Inventory.ts';
import { ShippingModel } from '../src/server/models/Shipping.ts';
import { BlogModel } from '../src/server/models/Blog.ts';
import { RoleModel } from '../src/server/models/Role.ts';
import { hashPassword } from '../src/server/auth/tokens.ts';
import { brandLogo, brandColor } from '../src/server/data/brand-logos.ts';
import {
  CustomerOrderStatus,
  DiscountType,
  FREE_SHIPPING_THRESHOLD,
  InventoryStatus,
  OrderPaymentStatus,
  PaymentMethodValue,
  PromotionType,
  ROLE_PERMISSIONS,
  SellerOrderStatus,
  SellerPromotionStatus,
  SHIPPING_CARRIERS,
  SHIPPING_FEE,
  TicketCategory,
  TicketPriority,
  PLATFORM_FEE_RATE,
  TransactionStatus,
  AdminTicketStatus,
  CustomerTicketStatus,
} from '../src/server/constants.ts';
import { modelName } from './lib/model-name.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RESET = process.argv.includes('--reset');

function resolveMockDataPath(): string {
  const candidates = [
    resolve(process.cwd(), 'scripts/data/frontend-mock.json'),
    resolve(__dirname, 'data/frontend-mock.json'),
    resolve(__dirname, '../scripts/data/frontend-mock.json'),
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  throw new Error(
    `Không tìm thấy frontend-mock.json. Đã thử: ${candidates.join(', ')}`,
  );
}

function loadModelImages(): Record<string, { images: string[]; source: string; title: string }> {
  const p = resolve(__dirname, 'data/model-images.json');
  if (!existsSync(p)) {
    console.warn(
      '[seed] Không có model-images.json -> dùng ảnh theo danh mục. ' +
        'Chạy `npx tsx scripts/resolve-model-images.ts` để có ảnh đúng model.',
    );
    return {};
  }
  try {
    const raw = JSON.parse(readFileSync(p, 'utf-8')) as Record<string, any>;
    const out: Record<string, { images: string[]; source: string; title: string }> = {};
    for (const [k, v] of Object.entries(raw)) {
      if (!v) continue;

      if (Array.isArray(v.images)) {
        out[k] = {
          images: v.images.filter((u: unknown) => typeof u === 'string'),
          source: String(v.source ?? ''),
          title: String(v.title ?? k),
        };
        continue;
      }

      if (typeof v.url === 'string') {
        out[k] = {
          images: [v.url],
          source: String(v.source ?? ''),
          title: String(v.title ?? k),
        };
      }
    }
    return out;
  } catch {
    return {};
  }
}

interface FProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice: number;
  discount: number;
  images: string[];
  categoryId: string;
  categoryName: string;
  brand: string;
  rating: number;
  reviewCount: number;
  stock: number;
  sold: number;
  tags: string[];
  specifications: Record<string, string>;
  isFeatured: boolean;
  isNew: boolean;
  isHot: boolean;
  createdAt: string;
}

interface FStore {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  avatar: string;
  banner: string;
  description: string;
  rating: number;
  productCount: number;
  orderCount: number;
  followerCount: number;
  isVerified: boolean;
  status: string;
  createdAt: string;
  taxId: string;
  bankAccount: string;
  bankName: string;
}

interface FReview {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  createdAt: string;
  isVerified: boolean;
  replies?: { id: string; userId: string; userName: string; comment: string; createdAt: string }[];
}

interface FBrand {
  id: string;
  name: string;
  slug: string;
  logo: string;
  productCount: number;
}

interface FBlog {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  thumbnail: string;
  author: string;
  authorAvatar: string;
  category: string;
  createdAt: string;
  views: number;
}

interface FCustomer {
  id: string;
  email: string;
  name: string;
  phone: string;
  avatar: string;
  role: string;
  address: string;
  createdAt: string;
}

interface FAdminOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  items: unknown[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  totalPrice: number;
  status: string;
  shippingAddress: string;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
}

interface FAdminPayment {
  id: string;
  orderId: string;
  amount: number;
  method: string;
  status: string;
  transactionId: string;
  createdAt: string;
}

interface FAdminReview {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  createdAt: string;
  isVerified: boolean;
}

interface FAdminPromotion {
  id: string;
  title: string;
  description: string;
  image: string;
  discount: number;
  code?: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface FSellerPromotion {
  id: string;
  name: string;
  type?: string;
  code?: string;
  discountType?: string;
  discountValue?: number;
  minOrderValue?: number;
  maxDiscount?: number;
  startDate: string;
  endDate: string;
  status?: string;
  usageLimit?: number;
  usedCount?: number;
  targetProducts?: string[];
  targetCategories?: string[];
  storeId?: string;
  createdAt?: string;
}

interface FAdminTicket {
  id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
}

interface FrontendMock {
  products: FProduct[];
  reviews: FReview[];
  brands: FBrand[];
  blogs: FBlog[];
  stores: FStore[];
  adminStores: FStore[];
  adminCustomers: FCustomer[];
  adminOrders: FAdminOrder[];
  adminPayments: FAdminPayment[];
  adminReviews: FAdminReview[];
  adminPromotions: FAdminPromotion[];
  adminTickets: FAdminTicket[];
  sellerPromotions: FSellerPromotion[];
}

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 140) || 'item'
  );
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * days));
  d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0);
  return d;
}

function monthsAgo(months: number): Date {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  d.setMonth(d.getMonth() - months);
  d.setDate(Math.floor(1 + Math.random() * 27));
  return d;
}

const PAYMENT_METHODS: PaymentMethodValue[] = [
  'cod',
  'banking',
  'vnpay',
  'momo',
  'zalopay',
];

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  COD: 'COD',
  'Chuyển khoản': 'banking',
  VNPay: 'vnpay',
  ZaloPay: 'zalopay',
  MoMo: 'momo',
};

function normalizeMethod(raw: string): PaymentMethodValue {
  const mapped = PAYMENT_METHOD_LABEL[raw];
  if (mapped) return mapped as PaymentMethodValue;
  const lower = raw?.toLowerCase();
  if (PAYMENT_METHODS.includes(lower as PaymentMethodValue)) {
    return lower as PaymentMethodValue;
  }
  return 'cod';
}

const CATEGORIES = [
  {
    slug: 'dien-thoai',
    name: 'Điện thoại',
    icon: '📱',
    order: 1,
    featured: true,
    banner: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800',
    description: 'iPhone, Samsung, Xiaomi, OPPO...',
  },
  {
    slug: 'laptop',
    name: 'Laptop',
    icon: '💻',
    order: 2,
    featured: true,
    banner: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800',
    description: 'MacBook, gaming laptop, ultrabook...',
  },
  {
    slug: 'pc-gaming',
    name: 'PC Gaming',
    icon: '🖥️',
    order: 3,
    featured: true,
    banner: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=800',
    description: 'PC build, case, PSU, cooling...',
  },
  {
    slug: 'man-hinh',
    name: 'Màn hình',
    icon: '🖵',
    order: 4,
    featured: true,
    banner: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800',
    description: 'OLED, Gaming 360Hz, 4K, Ultrawide...',
  },
  {
    slug: 'chuot',
    name: 'Chuột',
    icon: '🖱️',
    order: 5,
    featured: false,
    banner: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800',
    description: 'Gaming mouse, wireless, ergonomic...',
  },
  {
    slug: 'ban-phim',
    name: 'Bàn phím',
    icon: '⌨️',
    order: 6,
    featured: false,
    banner: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=800',
    description: 'Mechanical keyboard, wireless, hot-swap...',
  },
  {
    slug: 'tai-nghe',
    name: 'Tai nghe',
    icon: '🎧',
    order: 7,
    featured: true,
    banner: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
    description: 'ANC, gaming headset, TWS, studio...',
  },
  {
    slug: 'phu-kien',
    name: 'Phụ kiện',
    icon: '🔌',
    order: 8,
    featured: false,
    banner: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=800',
    description: 'Sạc, cáp, case, ốp lưng...',
  },
];

const CATEGORY_ID_MAP: Record<string, string> = {
  'cat-phone': 'dien-thoai',
  'cat-laptop': 'laptop',
  'cat-pc': 'pc-gaming',
  'cat-monitor': 'man-hinh',
  'cat-mouse': 'chuot',
  'cat-keyboard': 'ban-phim',
  'cat-headphone': 'tai-nghe',
  'cat-accessory': 'phu-kien',
};

async function seed() {
  console.log('[seed] Đang đọc dữ liệu frontend...');
  const raw = readFileSync(resolveMockDataPath(), 'utf-8');
  const mock = JSON.parse(raw) as FrontendMock;

  await connectDB();
  console.log('[seed] Đã kết nối MongoDB.');

  if (RESET) {
    console.log('[seed] Xoá dữ liệu cũ...');
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
      RoleModel.deleteMany({}),
    ]);
  }

  console.log('[seed] Tạo danh mục...');
  const categoryMap = new Map<string, Types.ObjectId>();
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
          description: c.description ?? `Sản phẩm ${c.name.toLowerCase()} chính hãng tại Henzo Store`,
          banner: c.banner ?? '',
        },
      },
      { upsert: true, new: true },
    );
    categoryMap.set(c.slug, doc._id);
  }

  const categoryIdByName = new Map<string, Types.ObjectId>();
  for (const c of CATEGORIES) {
    const id = categoryMap.get(c.slug);
    if (id) categoryIdByName.set(c.name, id);
  }

  console.log('[seed] Tạo thương hiệu...');
  const brandMap = new Map<string, Types.ObjectId>();
  const allBrands = new Map<string, FBrand>();
  for (const b of mock.brands) allBrands.set(b.name, b);

  for (const p of mock.products) {
    if (!allBrands.has(p.brand)) {
      allBrands.set(p.brand, {
        id: `b-${slugify(p.brand)}`,
        name: p.brand,
        slug: slugify(p.brand),
        logo: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(p.brand)}`,
        productCount: 0,
      });
    }
  }

  for (const b of allBrands.values()) {
    const count = mock.products.filter((p) => p.brand === b.name).length;

    const logo = brandLogo(b.name) || b.logo;
    const doc = await BrandModel.findOneAndUpdate(
      { slug: b.slug },
      {
        $set: {
          name: b.name,
          slug: b.slug,
          logo,
          color: brandColor(b.name),
          productCount: count,
          tagline: `${b.name} chính hãng`,
        },
      },
      { upsert: true, new: true },
    );
    brandMap.set(b.name, doc._id);
  }

  console.log('[seed] Tạo người dùng...');
  const defaultPassword = await hashPassword('123456');
  const adminPassword = await hashPassword('admin123');

  const staffSeed = [
    {
      name: 'Quản Trị Viên Hệ Thống',
      email: 'admin@henzo.com',
      role: 'ADMIN' as const,
      password: adminPassword,
    },
    {
      name: 'Nguyễn Văn Quang',
      email: 'mod@henzo.com',
      role: 'MODERATOR' as const,
      password: defaultPassword,
    },
    {
      name: 'Trần Thị Hương',
      email: 'cs@henzo.com',
      role: 'STAFF' as const,
      password: defaultPassword,
    },
    {
      name: 'Lê Minh Tuấn',
      email: 'tuanlm@henzo.com',
      role: 'STAFF' as const,
      password: defaultPassword,
    },
    {
      name: 'Phạm Thị Lan',
      email: 'lanpt@henzo.com',
      role: 'MODERATOR' as const,
      password: defaultPassword,
      status: 'locked',
    },
  ];

  const staffIds: Types.ObjectId[] = [];
  for (const s of staffSeed) {
    const user = await UserModel.findOneAndUpdate(
      { email: s.email },
      {
        $set: {
          name: s.name,
          role: s.role,
          status: (s as any).status ?? 'active',
          permissions: ROLE_PERMISSIONS[s.role] ?? [],
          password: s.password,
          phone: '0900000000',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.email}`,
          lastLoginAt: daysAgo(3),
        },
        $setOnInsert: { createdAt: daysAgo(200) },
      },
      { upsert: true, new: true },
    );
    staffIds.push(user._id);
  }

  console.log('[seed] Tạo cửa hàng...');
  const storeMap = new Map<string, Types.ObjectId>();
  const storeDocs: any[] = [];

  const sourceStores = [
    ...mock.stores,
    ...mock.adminStores.filter(
      (s) => !mock.stores.some((x) => x.name === s.name),
    ),
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
          banner: s.banner ?? '',
          description:
            s.description ??
            'Chuyên cung cấp các sản phẩm công nghệ chính hãng với giá tốt nhất thị trường.',
          rating: s.rating,
          productCount: 0,
          orderCount: s.orderCount ?? 0,
          followerCount: s.followerCount ?? 0,
          isVerified: s.isVerified,
          status: s.status ?? 'active',
          taxId: s.taxId ?? '',
          bankAccount: s.bankAccount ?? '',
          bankName: s.bankName ?? 'Vietcombank',
        },
        $setOnInsert: { createdAt: new Date(s.createdAt) },
      },
      { upsert: true, new: true },
    );
    storeMap.set(s.name, doc._id);
    storeDocs.push(doc);
  }

  const primaryStore = storeDocs[0];
  const shopUser = await UserModel.findOneAndUpdate(
    { email: 'shop@henzo.com' },
    {
      $set: {
        name: primaryStore.name,
        email: 'shop@henzo.com',
        role: 'SHOP',
        status: 'active',
        storeId: primaryStore._id,
        permissions: ROLE_PERMISSIONS.SHOP,
        phone: primaryStore.phone,
        password: defaultPassword,
        avatar: primaryStore.avatar,
      },
      $setOnInsert: { createdAt: daysAgo(300) },
    },
    { upsert: true, new: true },
  );
  await StoreModel.updateOne(
    { _id: primaryStore._id },
    { $set: { ownerId: shopUser._id } },
  );

  console.log('[seed] Tạo sản phẩm...');
  const productMap = new Map<string, Types.ObjectId>();
  const products: any[] = [];

  const MODEL_IMAGES = loadModelImages();
  let usedRealImage = 0;

    const variantCounter = new Map<string, number>();
  const imagesFor = (p: { name: string; slug: string; images: string[] }): string[] => {
    const model = modelName(p.name);
    const hit = MODEL_IMAGES[model];
    if (hit?.images?.length) {
      usedRealImage++;

      const n = variantCounter.get(model) ?? 0;
      variantCounter.set(model, n + 1);
      const pool = hit.images;
      const picked = pool.slice(n % pool.length).concat(pool.slice(0, n % pool.length));

      const extra = p.images.filter((u) => !picked.includes(u)).slice(0, 2);
      return [...picked, ...extra];
    }
    return p.images;
  };

  const activeStores = storeDocs.filter((s) => s.status === 'active');

  for (let i = 0; i < mock.products.length; i++) {
    const p = mock.products[i];
    const store = activeStores[i % Math.max(1, activeStores.length)];

    const categorySlug = CATEGORY_ID_MAP[p.categoryId] ?? slugify(p.categoryName);
    const categoryId = categoryMap.get(categorySlug) ?? categoryMap.get('phu-kien');

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
          images: imagesFor(p),
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
          status: 'active',
          sku: `SKU-${p.id.toUpperCase()}`,
          viewCount: Math.floor(Math.random() * 5000) + 100,
          minStock: 10,
        },
        $setOnInsert: { createdAt: new Date(p.createdAt) },
      },
      { upsert: true, new: true },
    );
    productMap.set(p.id, doc._id);
    products.push(doc);
  }

  const sellerProducts = (mock as any).sellerProducts ?? [];
  for (let i = 0; i < sellerProducts.length; i++) {
    const p = sellerProducts[i];
    if (!p?.slug) continue;
    const categorySlug =
      CATEGORY_ID_MAP[p.categoryId] ?? slugify(p.categoryName);
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
          images: imagesFor(p),
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
          status: 'active',
          sku: `SKU-S${String(i + 1).padStart(4, '0')}`,
          minStock: 10,
        },
        $setOnInsert: { createdAt: new Date(p.createdAt) },
      },
      { upsert: true, new: true },
    );
    productMap.set(p.id, doc._id);
    products.push(doc);
  }

  const storeProductCounts = new Map<string, number>();
  for (const p of products) {
    const key = String(p.storeId);
    storeProductCounts.set(key, (storeProductCounts.get(key) ?? 0) + 1);
  }
  for (const [storeId, count] of storeProductCounts) {
    await StoreModel.updateOne({ _id: storeId }, { $set: { productCount: count } });
  }

  const categoryProductCounts = new Map<string, number>();
  for (const p of products) {
    const key = String(p.categoryId);
    categoryProductCounts.set(key, (categoryProductCounts.get(key) ?? 0) + 1);
  }
  for (const [categoryId, count] of categoryProductCounts) {
    await CategoryModel.updateOne({ _id: categoryId }, { $set: { productCount: count } });
  }

  console.log('[seed] Tạo dữ liệu kho hàng...');
  const inventoryDocs = products.map((p) => {
    const status =
      p.stock === 0
        ? InventoryStatus.OUT_OF_STOCK
        : p.stock < 10
          ? InventoryStatus.LOW_STOCK
          : InventoryStatus.IN_STOCK;
    return {
      storeId: p.storeId,
      productId: p._id,
      productName: p.name,
      productImage: p.images?.[0] ?? '',
      category: p.categoryName,
      sku: p.sku,
      stock: p.stock,
      minStock: 10,
      reserved: 0,
      available: p.stock,
      sold: p.sold,
      status,
      lastRestocked: daysAgo(30),
    };
  });
  if (inventoryDocs.length) {
    await InventoryModel.bulkWrite(
      inventoryDocs.map((doc) => ({
        updateOne: {
          filter: { storeId: doc.storeId, sku: doc.sku },
          update: { $set: doc },
          upsert: true,
        },
      })),
    );
  }

  console.log('[seed] Tạo khách hàng...');
  const customerMap = new Map<string, Types.ObjectId>();

  const demoCustomer = await UserModel.findOneAndUpdate(
    { email: 'customer@henzo.com' },
    {
      $set: {
        name: 'Nguyễn Văn A',
        email: 'customer@henzo.com',
        role: 'CUSTOMER',
        status: 'active',
        phone: '0912345678',
        password: defaultPassword,
        address: 'Số 1, Đường Lê Lợi, Quận 1, TP.HCM',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=customer1',
        points: 1200,
      },
      $setOnInsert: { createdAt: daysAgo(180) },
    },
    { upsert: true, new: true },
  );
  customerMap.set('customer-1', demoCustomer._id);

  for (const c of mock.adminCustomers) {
    const email = c.email.toLowerCase();
    const user = await UserModel.findOneAndUpdate(
      { email },
      {
        $set: {
          name: c.name,
          role: 'CUSTOMER',
          status: 'active',
          phone: c.phone,
          address: c.address,
          avatar: c.avatar,
          password: defaultPassword,
        },
        $setOnInsert: { createdAt: new Date(c.createdAt) },
      },
      { upsert: true, new: true },
    );
    customerMap.set(c.id, user._id);
  }

  console.log('[seed] Tạo đơn hàng...');
  const orderDocs: any[] = [];
  const paymentDocs: any[] = [];
  const shippingDocs: any[] = [];

  const customerList = [...customerMap.values()];

  for (let i = 0; i < mock.adminOrders.length; i++) {
    const o = mock.adminOrders[i];
    const createdAt = new Date(o.createdAt);

    const customerId =
      customerList[i % customerList.length] ?? demoCustomer._id;

    const groupCount = 1 + (i % 3);
    const usedProducts = new Set<string>();
    const groups = new Map<string, { store: any; items: any[] }>();

    for (let g = 0; g < groupCount; g++) {
      const product = products[(i * 7 + g * 13) % products.length];
      const key = String(product.storeId);
      if (usedProducts.has(String(product._id))) continue;
      usedProducts.add(String(product._id));

      const qty = 1 + ((i + g) % 3);
      const store = storeDocs.find((s) => String(s._id) === key);
      if (!store) continue;

      const item = {
        productId: product._id,
        productName: product.name,
        productImage: product.images?.[0] ?? '',
        productSlug: product.slug,
        sku: product.sku,
        unitPrice: product.price,
        quantity: qty,
        totalPrice: product.price * qty,
        options: {},
      };

      const existing = groups.get(key);
      if (existing) existing.items.push(item);
      else groups.set(key, { store, items: [item] });
    }

    if (!groups.size) continue;

    const customerUser = await UserModel.findById(customerId).lean();
    const subtotal = [...groups.values()].reduce(
      (sum, g) =>
        sum + g.items.reduce((s, it) => s + it.totalPrice, 0),
      0,
    );
    const shippingFee =
      subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
    const discount = o.discount ?? 0;
    const totalPrice = Math.max(0, subtotal + shippingFee - discount);

    const customerStatus = (o.status ?? 'pending') as string;

    const sellerStatusMap: Record<string, string> = {
      pending: SellerOrderStatus.PENDING,
      confirmed: SellerOrderStatus.CONFIRMED,
      processing: SellerOrderStatus.PREPARING,
      shipping: SellerOrderStatus.DELIVERING,
      delivered: SellerOrderStatus.DELIVERED,
      cancelled: SellerOrderStatus.CANCELLED,
    };
    const sellerStatus =
      sellerStatusMap[customerStatus] ?? SellerOrderStatus.PENDING;

    const subOrders = [...groups.values()].map((g) => {
      const groupSubtotal = g.items.reduce((s, it) => s + it.totalPrice, 0);
      const groupShipping =
        groups.size === 1 ? shippingFee : Math.floor(shippingFee / groups.size);
      return {
        storeId: g.store._id,
        storeName: g.store.name,
        status: sellerStatus,
        items: g.items,
        subtotal: groupSubtotal,
        shippingFee: groupShipping,
        discount: 0,
        totalPrice: groupSubtotal + groupShipping,
        trackingNumber:
          sellerStatus === SellerOrderStatus.DELIVERED ||
          sellerStatus === SellerOrderStatus.DELIVERING
            ? `${SHIPPING_CARRIERS[i % SHIPPING_CARRIERS.length]}${Date.now().toString().slice(-10)}`
            : '',
        shippingPartner: SHIPPING_CARRIERS[i % SHIPPING_CARRIERS.length],
        estimatedDelivery: new Date(createdAt.getTime() + 5 * 86400000),
        deliveredAt:
          sellerStatus === SellerOrderStatus.DELIVERED
            ? new Date(createdAt.getTime() + 4 * 86400000)
            : undefined,
        statusHistory: [
          {
            status: SellerOrderStatus.PENDING,
            at: createdAt,
            note: 'Đơn hàng được tạo',
          },
          ...(sellerStatus !== SellerOrderStatus.PENDING
            ? [
                {
                  status: sellerStatus,
                  at: new Date(createdAt.getTime() + 86400000),
                  note: 'Cập nhật trạng thái',
                },
              ]
            : []),
        ],
      };
    });

    const allItems = [...groups.values()].flatMap((g) => g.items);
    const paymentMethod = normalizeMethod(o.paymentMethod);
    const paymentStatus =
      customerStatus === 'delivered' && paymentMethod === 'cod'
        ? OrderPaymentStatus.UNPAID
        : customerStatus === 'delivered' || customerStatus === 'confirmed'
          ? OrderPaymentStatus.PAID
          : paymentMethod === 'cod'
            ? OrderPaymentStatus.UNPAID
            : OrderPaymentStatus.PAID;

    const doc = await OrderModel.findOneAndUpdate(
      { orderNumber: o.orderNumber },
      {
        $set: {
          customerId,
          customerName: o.customerName,
          customerPhone: o.customerPhone,
          customerAvatar: customerUser?.avatar ?? '',
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
          shippingProvince: 'TP. Hồ Chí Minh',
          shippingDistrict: 'Quận 1',
          note: '',
          shippingUpdates: [
            {
              status: customerStatus,
              location: 'TP. Hồ Chí Minh',
              description: 'Đơn hàng đang được xử lý',
              timestamp: createdAt,
            },
          ],
        },
        $setOnInsert: { createdAt },
      },
      { upsert: true, new: true, timestamps: false },
    );
    orderDocs.push(doc);

    const TXN_STATUS_BY_PAYMENT: Record<string, string> = {
      [OrderPaymentStatus.PAID]: TransactionStatus.SUCCESS,
      [OrderPaymentStatus.REFUNDED]: TransactionStatus.REFUNDED,
      [OrderPaymentStatus.FAILED]: TransactionStatus.FAILED,
      [OrderPaymentStatus.UNPAID]: TransactionStatus.PENDING,
    };
    const txnStatus = TXN_STATUS_BY_PAYMENT[paymentStatus] ?? TransactionStatus.PENDING;

    const platformFee = Math.floor(totalPrice * PLATFORM_FEE_RATE);

    const payment = await PaymentModel.findOneAndUpdate(
      { transactionId: `TXN${String(100000 + i)}` },
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
          status: txnStatus,
        },
        $setOnInsert: { createdAt },
      },
      { upsert: true, new: true },
    );
    paymentDocs.push(payment);

    if (
      sellerStatus === SellerOrderStatus.DELIVERED ||
      sellerStatus === SellerOrderStatus.DELIVERING
    ) {
      shippingDocs.push({
        orderId: doc._id,
        orderCode: o.orderNumber,
        storeId: subOrders[0].storeId,
        trackingNumber: subOrders[0].trackingNumber,
        carrier: subOrders[0].shippingPartner,
        status:
          sellerStatus === SellerOrderStatus.DELIVERED
            ? 'delivered'
            : 'in_transit',
        receiverName: o.customerName,
        receiverPhone: o.customerPhone,
        receiverAddress: o.shippingAddress,
        weight: 1,
        dimensions: '20x15x5',
        shippingFee: subOrders[0].shippingFee,
        codAmount:
          paymentMethod === 'cod' ? subOrders[0].totalPrice : 0,
        estimatedDelivery: subOrders[0].estimatedDelivery,
        createdAt,
      });
    }
  }

  if (shippingDocs.length) {
    await ShippingModel.bulkWrite(
      shippingDocs.map((doc) => ({
        updateOne: {
          filter: { orderId: doc.orderId, storeId: doc.storeId },
          update: { $set: doc },
          upsert: true,
        },
      })),
    );
  }

  console.log('[seed] Tạo đánh giá...');
  const reviewDocs = [];

  for (const r of mock.reviews) {
    const product = productMap.get(r.productId);
    if (!product) continue;
    const productDoc = products.find((p) => String(p._id) === String(product));

    reviewDocs.push({
      productId: product,
      productName: productDoc?.name ?? '',
      productImage: productDoc?.images?.[0] ?? '',
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
      sellerResponse: r.replies?.[0]?.comment ?? '',
      sellerRespondedAt: r.replies?.[0]?.createdAt
        ? new Date(r.replies[0].createdAt)
        : undefined,
      replies: (r.replies ?? []).map((rp) => ({
        userId: customerMap.get(rp.userId) ?? demoCustomer._id,
        userName: rp.userName,
        comment: rp.comment,
        createdAt: new Date(rp.createdAt),
      })),
      createdAt: new Date(r.createdAt),
    });
  }

  for (const r of mock.adminReviews) {
    const product = productMap.get(r.productId);
    if (!product) continue;
    const productDoc = products.find((p) => String(p._id) === String(product));

    reviewDocs.push({
      productId: product,
      productName: productDoc?.name ?? '',
      productImage: productDoc?.images?.[0] ?? '',
      storeId: productDoc?.storeId,
      userId: customerMap.get(r.userId) ?? demoCustomer._id,
      userName: r.userName,
      userAvatar: r.userAvatar,
      rating: r.rating,
      comment: r.comment,
      images: [],
      isVerified: r.isVerified,
      isHidden: false,
      createdAt: new Date(r.createdAt),
    });
  }

  if (reviewDocs.length) {
    await ReviewModel.bulkWrite(
      reviewDocs.map((doc) => ({
        insertOne: { document: doc as any },
      })),
      { ordered: false },
    );
  }

  console.log('[seed] Tạo khuyến mãi...');
  const promoDocs = mock.adminPromotions.map((p) => ({
    title: p.title,
    description: p.description,
    image: p.image,
    discount: p.discount,
    code: p.code ?? '',
    type:
      p.id.endsWith('3')
        ? PromotionType.FLASH_SALE
        : p.code
          ? PromotionType.VOUCHER
          : PromotionType.DISCOUNT_CAMPAIGN,
    startDate: new Date(p.startDate),
    endDate: new Date(p.endDate),
    status: p.isActive ? SellerPromotionStatus.ACTIVE : SellerPromotionStatus.ENDED,
    discountType: DiscountType.PERCENT,
    discountValue: p.discount,
    minOrderValue: 0,
    maxDiscount: 0,
    usageLimit: 0,
    usedCount: 0,
    createdAt: new Date(p.startDate),
  }));

  await PromotionModel.bulkWrite(
    promoDocs.map((doc) => ({
      updateOne: {
        filter: { title: doc.title, startDate: doc.startDate },
        update: { $set: doc },
        upsert: true,
      },
    })),
  );

    const sellerPromoDocs = mock.sellerPromotions.map((p) => ({
    title: p.name,
    description: '',
    image: '',
    discount:
      p.discountType === DiscountType.PERCENT ? (p.discountValue ?? 0) : 0,
    code: p.code ?? '',
    type: (p.type ?? PromotionType.VOUCHER) as (typeof PromotionType)[keyof typeof PromotionType],
    startDate: new Date(p.startDate),
    endDate: new Date(p.endDate),
    status: p.status ?? SellerPromotionStatus.ACTIVE,
    discountType: p.discountType ?? DiscountType.PERCENT,
    discountValue: p.discountValue ?? 0,
    minOrderValue: p.minOrderValue ?? 0,
    maxDiscount: p.maxDiscount ?? 0,
    usageLimit: p.usageLimit ?? 0,
    usedCount: p.usedCount ?? 0,

    targetProducts: (p.targetProducts ?? [])
      .map((id: string) => productMap.get(id))
      .filter((id): id is Types.ObjectId => Boolean(id)),
    targetCategories: (p.targetCategories ?? [])
      .map((name: string) => categoryIdByName.get(name))
      .filter((id): id is Types.ObjectId => Boolean(id)),
    storeId: primaryStore._id,
    createdAt: new Date(p.createdAt ?? Date.now()),
  }));

  if (sellerPromoDocs.length) {
    await PromotionModel.bulkWrite(
      sellerPromoDocs.map((doc: (typeof sellerPromoDocs)[number]) => ({
        updateOne: {
          filter: { title: doc.title, storeId: doc.storeId },
          update: { $set: doc },
          upsert: true,
        },
      })),
    );
  }

  const voucherDocs = [
    {
      code: 'HENZO10',
      name: 'Giảm 10% tối đa 500K',
      description: 'Mã giảm 10% cho mọi đơn hàng, tối đa 500.000đ',
      discountType: DiscountType.PERCENT,
      discountValue: 10,
      maxDiscount: 500_000,
      minOrderValue: 500_000,
      startDate: new Date(Date.now() - 30 * 86400000),
      endDate: new Date(Date.now() + 365 * 86400000),
      status: SellerPromotionStatus.ACTIVE,
      usageLimit: 1000,
      usedCount: 0,
      perUserLimit: 2,
    },
    {
      code: 'FREESHIP',
      name: 'Miễn phí vận chuyển',
      description: 'Miễn phí vận chuyển cho đơn từ 300.000đ',
      discountType: DiscountType.SHIPPING,
      discountValue: SHIPPING_FEE,
      maxDiscount: SHIPPING_FEE,
      minOrderValue: 300_000,
      startDate: new Date(Date.now() - 30 * 86400000),
      endDate: new Date(Date.now() + 365 * 86400000),
      status: SellerPromotionStatus.ACTIVE,
      usageLimit: 5000,
      usedCount: 0,
      perUserLimit: 5,
    },
    {
      code: 'WELCOME200K',
      name: 'Chào mừng giảm 200K',
      description: 'Giảm trực tiếp 200.000đ cho đơn đầu tiên',
      discountType: DiscountType.FIXED,
      discountValue: 200_000,
      maxDiscount: 200_000,
      minOrderValue: 500_000,
      startDate: new Date(Date.now() - 30 * 86400000),
      endDate: new Date(Date.now() + 365 * 86400000),
      status: SellerPromotionStatus.ACTIVE,
      usageLimit: 1000,
      usedCount: 0,
      perUserLimit: 1,
    },
  ];

  await VoucherModel.bulkWrite(
    voucherDocs.map((doc) => ({
      updateOne: {
        filter: { code: doc.code },
        update: { $set: doc },
        upsert: true,
      },
    })),
  );

  console.log('[seed] Tạo phiếu hỗ trợ...');
  const ticketDocs = mock.adminTickets.map((t, i) => {
    const isShop = i % 3 !== 2;
    const store = isShop ? storeDocs[i % storeDocs.length] : undefined;
    const customerId = customerList[i % customerList.length];

    return {
      ticketCode: `TKTSPT-${String(i + 1).padStart(3, '0')}`,
      scope: isShop ? 'SELLER' : 'CUSTOMER',
      userId: customerId,
      customerName: isShop ? store!.name : 'Khách hàng',
      customerEmail: isShop ? store!.email : 'customer@henzo.com',
      customerAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=ticket${i}`,
      storeId: isShop ? store!._id : undefined,
      subject: t.subject,
      category:
        i % 4 === 0
          ? TicketCategory.TECHNICAL
          : i % 4 === 1
            ? TicketCategory.ORDER
            : i % 4 === 2
              ? TicketCategory.PAYMENT
              : TicketCategory.OTHER,
      priority:
        t.priority === 'high'
          ? TicketPriority.HIGH
          : t.priority === 'medium'
            ? TicketPriority.MEDIUM
            : TicketPriority.LOW,
      status: (t.status ?? 'open') as string,
      assignee: t.status === 'open' ? '' : 'admin@henzo.com',
      messages: [
        {
          sender: isShop ? 'seller' : 'customer',
          senderName: isShop ? store!.name : 'Khách hàng',
          content: t.message,
          attachments: [],
          createdAt: new Date(t.createdAt),
        },
      ],
      createdAt: new Date(t.createdAt),
      updatedAt: new Date(t.updatedAt),
    };
  });

  await TicketModel.bulkWrite(
    ticketDocs.map((doc) => ({
      updateOne: {
        filter: { ticketCode: doc.ticketCode },
        update: { $set: doc },
        upsert: true,
      },
    })),
  );

  console.log('[seed] Tạo thông báo...');
  const notificationDocs = [
    {
      userId: demoCustomer._id,
      type: 'promotion',
      title: 'Flash Sale Cuối Tuần bắt đầu!',
      message: 'Giảm đến 50% cho hàng trăm sản phẩm công nghệ trong 3 ngày.',
      isRead: false,
      link: '/promotions',
    },
    {
      userId: demoCustomer._id,
      type: 'voucher',
      title: 'Bạn có mã giảm 10%',
      message: 'Áp dụng mã HENZO10 để giảm 10% tối đa 500.000đ.',
      isRead: false,
      link: '/account/orders',
    },
    {
      userId: demoCustomer._id,
      type: 'system',
      title: 'Chào mừng đến với Henzo Store',
      message: 'Tài khoản của bạn đã được tạo thành công.',
      isRead: true,
      link: '/',
    },
  ];

  await NotificationModel.bulkWrite(
    notificationDocs.map((doc) => ({
      updateOne: {
        filter: { userId: doc.userId, title: doc.title },
        update: { $set: doc },
        upsert: true,
      },
    })),
  );

  await NotificationModel.bulkWrite(
    [
      {
        title: 'Cảnh báo: TechPro Shop vi phạm',
        message:
          'TechPro Shop bị khách hàng phản ánh bán hàng giả. Đang chờ kiểm duyệt.',
        type: 'warning',
      },
      {
        title: 'Khuyến mãi mới được duyệt',
        message:
          'Khuyến mãi "Flash Sale Cuối Tuần" đã được duyệt và đang hoạt động.',
        type: 'promotion',
      },
      {
        title: 'Cập nhật hệ thống',
        message: 'Hệ thống sẽ bảo trì vào lúc 02:00-04:00 ngày 05/06/2025.',
        type: 'system',
      },
    ].map((doc) => ({
      updateOne: {
        filter: { userId: null, title: doc.title },
        update: {
          $set: {
            userId: null,
            audience: 'all',
            type: doc.type,
            title: doc.title,
            message: doc.message,
            isRead: false,
            isSystem: true,
          },
        },
        upsert: true,
      },
    })),
  );

  console.log('[seed] Tạo bài viết...');
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
            tags: [b.category],
          },
          $setOnInsert: { createdAt: new Date(b.createdAt) },
        },
        upsert: true,
      },
    })),
  );

  console.log('[seed] Tạo cấu hình phân quyền...');
  await RoleModel.bulkWrite(
    Object.entries(ROLE_PERMISSIONS).map(([name, permissions]) => ({
      updateOne: {
        filter: { name },
        update: {
          $set: {
            name,
            permissions,
            isCustom: false,
            label: name === 'ADMIN' ? 'Admin' : name === 'MODERATOR' ? 'Moderator' : name === 'STAFF' ? 'Staff' : 'Shop',
            description: '',
            color: '#4F46E5',
            bg: 'rgba(79,70,229,0.1)',
          },
        },
        upsert: true,
      },
    })),
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
    baiViet: await BlogModel.countDocuments({}),
  };

  console.log('\n[seed] Hoàn tất! Số lượng bản ghi:');
  for (const [k, v] of Object.entries(counts)) {
    console.log(`  - ${k.padEnd(14)} ${v}`);
  }
  console.log('\n[seed] Tài khoản đăng nhập:');
  console.log('  - Admin:      admin@henzo.com / admin123');
  console.log('  - Moderator:  mod@henzo.com / 123456');
  console.log('  - Staff:      cs@henzo.com / 123456');
  console.log('  - Shop:       shop@henzo.com / 123456');
  console.log('  - Customer:   customer@henzo.com / 123456');
  console.log('');

  await disconnectDB();
}

seed().catch(async (err) => {
  console.error('[seed] Lỗi:', err);
  await disconnectDB().catch(() => {});
  process.exit(1);
});

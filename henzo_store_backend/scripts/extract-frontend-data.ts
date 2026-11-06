import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FRONTEND = resolve(__dirname, '../../henzo_store/src/data');

async function main() {
  console.log('[extract] Đang nạp dữ liệu mock từ frontend...');

  const products = await import(`${FRONTEND}/products.ts`);
  const seller = await import(`${FRONTEND}/sellerData.ts`);
  const admin = await import(`${FRONTEND}/adminData.ts`);

  const payload = {
    generatedAt: new Date().toISOString(),
    products: products.MOCK_PRODUCTS,
    reviews: products.MOCK_REVIEWS,
    brands: products.MOCK_BRANDS,
    blogs: products.MOCK_BLOGS,
    stores: seller.mockStores,
    currentStore: seller.currentStore,
    sellerProducts: seller.mockSellerProducts,
    sellerOrders: seller.mockSellerOrders,
    sellerPayments: seller.mockSellerPayments,
    sellerReviews: seller.mockSellerReviews,
    sellerPromotions: seller.mockSellerPromotions,
    sellerTickets: seller.mockSellerTickets,
    adminStores: admin.MOCK_ADMIN_STORES,
    adminCustomers: admin.MOCK_ADMIN_CUSTOMERS,
    adminOrders: admin.MOCK_ADMIN_ORDERS,
    adminPayments: admin.MOCK_ADMIN_PAYMENTS,
    adminReviews: admin.MOCK_ADMIN_REVIEWS,
    adminPromotions: admin.MOCK_ADMIN_PROMOTIONS,
    adminTickets: admin.MOCK_ADMIN_TICKETS,
    adminStats: admin.ADMIN_STATS,
  };

  const outDir = resolve(__dirname, 'data');
  mkdirSync(outDir, { recursive: true });
  const outFile = resolve(outDir, 'frontend-mock.json');
  writeFileSync(outFile, JSON.stringify(payload, null, 2), 'utf-8');

  console.log(
    `[extract] Đã ghi ${outFile}\n` +
      `[extract]   products: ${payload.products.length}\n` +
      `[extract]   brands:  ${payload.brands.length}\n` +
      `[extract]   blogs:   ${payload.blogs.length}\n` +
      `[extract]   reviews: ${payload.reviews.length}\n` +
      `[extract]   stores:  ${payload.stores.length}`,
  );
}

main().catch((err) => {
  console.error('[extract] Lỗi:', err);
  process.exit(1);
});

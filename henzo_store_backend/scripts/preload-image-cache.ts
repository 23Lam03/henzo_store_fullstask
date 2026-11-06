/**
 * PRELOAD CACHE ẢNH TỪ WIKIMEDIA.
 *
 * Vì sao cần:
 *   Trang chủ hiển thị ~85 ảnh, trang danh mục ~20 ảnh... Nếu lần đầu
 *   truy cập mới tải, proxy phải tải hàng chục ảnh từ Wikimedia cùng lúc
 *   -> bị `429` và giao diện hiện ảnh vỡ trong vài giây.
 *
 *   Script này tải trước toàn bộ ảnh đang dùng trong DB vào cache đĩa.
 *   Sau đó mọi request tới proxy đều trả `HIT` (tức thì, không giới hạn).
 *
 * Chạy: npx tsx scripts/preload-image-cache.ts [soLuongMoiToiDa]
 */
import { connectDB, disconnectDB } from '../src/server/db';
import { ProductModel } from '../src/server/models/Product';
import { PromotionModel } from '../src/server/models/Promotion';
import {
  getCachedImage,
  isProxyableImageUrl,
} from '../src/server/services/image-proxy.service';

async function main() {
  const limit = Number.parseInt(process.argv[2] ?? '', 10);

  await connectDB();

  // Gom toàn bộ URL ảnh từ sản phẩm + khuyến mãi.
  const products = await ProductModel.find({}).select('images').lean();
  const promos = await PromotionModel.find({}).select('image').lean();
  const urls = new Set<string>();

  for (const p of products) {
    for (const img of p.images ?? []) {
      if (img && isProxyableImageUrl(img)) urls.add(img.split('?')[0]);
    }
  }
  for (const pr of promos) {
    if (pr.image && isProxyableImageUrl(pr.image)) {
      urls.add(String(pr.image).split('?')[0]);
    }
  }

  console.log(`[preload] Tổng URL ảnh cần cache: ${urls.size}`);

  const list = [...urls].slice(0, limit > 0 ? limit : undefined);
  let ok = 0;
  let failed = 0;
  let idx = 0;

  // 3 worker — khớp giới hạn concurrency của proxy (4).
  async function worker() {
    while (idx < list.length) {
      const url = list[idx++];
      try {
        const res = await getCachedImage(url);
        if (res.fetched) ok++;
      } catch (err) {
        failed++;
        if (failed <= 5) {
          console.warn(
            `[preload] Lỗi: ${url.slice(0, 90)} — ${
              err instanceof Error ? err.message : 'unknown'
            }`,
          );
        }
      }
      if (idx % 50 === 0) {
        console.log(`[preload] ${idx}/${list.length} — ok=${ok} failed=${failed}`);
      }
    }
  }

  await Promise.all([worker(), worker(), worker()]);

  console.log(`[preload] Hoàn tất: tải mới ${ok}, lỗi ${failed}`);

  await disconnectDB();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

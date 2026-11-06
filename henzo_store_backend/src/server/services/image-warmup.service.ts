/**
 * WARMER CACHE ẢNH — chạy nền ngay sau khi server khởi động.
 *
 * Bối cảnh (Render):
 *   - Disk của Render là *ephemeral*: mỗi lần deploy/restart là mất sạch
 *     cache ảnh tải về. Nếu không warm up, lần truy cập đầu tiên sẽ phải
 *     tải hàng chục ảnh từ Wikimedia cùng lúc -> `429` -> ảnh vỡ.
 *   - Vì vậy server khởi động xong sẽ tự tải trước ảnh nền, không chặn
 *     request của người dùng.
 *
 * Cấu hình (env):
 *   IMAGE_WARMUP=off          — tắt hoàn toàn.
 *   IMAGE_WARMUP_CONCURRENCY  — số tải song song (mặc định 3).
 *   IMAGE_WARMUP_DELAY_MS     — trễ trước khi bắt đầu (mặc định 3000).
 */
import { connectDB } from '../db';
import { ProductModel } from '../models/Product';
import { PromotionModel } from '../models/Promotion';
import {
  getCachedImage,
  isProxyableImageUrl,
} from './image-proxy.service';
/** Số URL tải đồng thời (proxy giới hạn 4 — để 1 slot cho request thật). */
function concurrency(): number {
  const raw = Number.parseInt(process.env.IMAGE_WARMUP_CONCURRENCY ?? '', 10);
  return Number.isFinite(raw) && raw > 0 ? Math.min(raw, 4) : 3;
}

/** Trễ khởi động để server nhận traffic trước. */
function delayMs(): number {
  const raw = Number.parseInt(process.env.IMAGE_WARMUP_DELAY_MS ?? '', 10);
  return Number.isFinite(raw) && raw >= 0 ? raw : 3000;
}

/** Gom toàn bộ URL ảnh đang dùng trong DB. */
async function collectUrls(): Promise<string[]> {
  await connectDB();

  const [products, promos] = await Promise.all([
    ProductModel.find({}).select('images').lean(),
    PromotionModel.find({}).select('image').lean(),
  ]);

  const urls = new Set<string>();

  for (const p of products) {
    for (const img of p.images ?? []) {
      if (img && isProxyableImageUrl(img)) urls.add(String(img).split('?')[0]);
    }
  }
  for (const pr of promos) {
    if (pr.image && isProxyableImageUrl(pr.image)) {
      urls.add(String(pr.image).split('?')[0]);
    }
  }

  return [...urls];
}

/**
 * Bắt đầu warm up nền. Không await — server phục vụ request ngay.
 * Lỗi không được làm sập server.
 */
export function startImageWarmup(): void {
  if ((process.env.IMAGE_WARMUP ?? '').toLowerCase() === 'off') {
    console.log('[warmup] Tắt theo cấu hình IMAGE_WARMUP=off.');
    return;
  }

  const workers = concurrency();
  const delay = delayMs();

  console.log(
    `[warmup] Sẽ tải trước ảnh nền sau ${delay}ms (${workers} luồng)...`,
  );

  // Không await cả promise này — chạy nền hoàn toàn.
  void (async () => {
    try {
      await new Promise((r) => setTimeout(r, delay));

      const list = await collectUrls();
      console.log(`[warmup] Cần tải ${list.length} ảnh.`);

      let index = 0;
      let ok = 0;
      let failed = 0;

      const run = async (): Promise<void> => {
        while (index < list.length) {
          const url = list[index++];
          try {
            const res = await getCachedImage(url);
            if (res.fetched) ok++;
          } catch {
            failed++;
          }
          if (index % 100 === 0) {
            console.log(
              `[warmup] ${index}/${list.length} — tải mới ${ok}, lỗi ${failed}`,
            );
          }
        }
      };

      await Promise.all(Array.from({ length: workers }, run));

      console.log(`[warmup] Xong: tải mới ${ok}, lỗi ${failed}.`);
    } catch (error) {
      console.error('[warmup] Lỗi warm up (không ảnh hưởng server):', error);
    }
  })();
}

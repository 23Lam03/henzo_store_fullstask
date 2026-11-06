import { connectDB } from '../db';
import { ProductModel } from '../models/Product';
import { PromotionModel } from '../models/Promotion';
import {
  getCachedImage,
  isProxyableImageUrl,
} from './image-proxy.service';
function concurrency(): number {
  const raw = Number.parseInt(process.env.IMAGE_WARMUP_CONCURRENCY ?? '', 10);
  return Number.isFinite(raw) && raw > 0 ? Math.min(raw, 4) : 3;
}

function delayMs(): number {
  const raw = Number.parseInt(process.env.IMAGE_WARMUP_DELAY_MS ?? '', 10);
  return Number.isFinite(raw) && raw >= 0 ? raw : 3000;
}

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

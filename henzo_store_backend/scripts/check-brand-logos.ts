/**
 * Kiểm tra HTTP 200 cho mọi URL ảnh trong bảng logo thương hiệu.
 *
 * Chạy: npx tsx scripts/check-brand-logos.ts
 */
import {
  BRAND_LOGOS,
  BRAND_LOGOS_COMMONS,
} from '../src/server/data/brand-logos';

const UA = 'henzo-store/1.0 (brand logo checker; dev@henzo.local)';

async function check(url: string): Promise<number> {
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': UA, Range: 'bytes=0-1024' },
    });
    return res.status;
  } catch {
    return 0;
  }
}

async function main() {
  const all: Record<string, string> = { ...BRAND_LOGOS, ...BRAND_LOGOS_COMMONS };
  const bad: string[] = [];
  let ok = 0;

  for (const [brand, url] of Object.entries(all)) {
    const status = await check(url);
    if (status === 200 || status === 206) {
      ok++;
      console.log(`✓ ${brand.padEnd(20)} ${status}`);
    } else {
      bad.push(brand);
      console.log(`✗ ${brand.padEnd(20)} ${status}  ${url}`);
    }
  }
  console.log(`\n[logos] OK ${ok}/${Object.keys(all).length}`);
  if (bad.length) console.log('[logos] Lỗi:', bad.join(', '));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

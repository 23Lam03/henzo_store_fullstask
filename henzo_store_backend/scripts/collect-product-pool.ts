/**
 * Sưu tầm pool ảnh SẢN PHẨM THẬT theo loại từ Commons.
 *
 * Chỉ nhận ảnh:
 *  - là ảnh chụp sản phẩm (không có người, không phải sự kiện/booth)
 *  - nằm trong category sản phẩm
 *
 * Chạy: npx tsx scripts/collect-product-pool.ts
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const UA = 'henzo-store/1.0 (model image resolver; dev@henzo.local)';

async function getJson(url: string): Promise<any> {
  for (let a = 0; a < 2; a++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } });
      if (r.status === 429) {
        await new Promise((s) => setTimeout(s, 1500 * (a + 1)));
        continue;
      }
      if (!r.ok) return null;
      return await r.json();
    } catch {
      await new Promise((s) => setTimeout(s, 600));
    }
  }
  return null;
}

/** Ảnh có người / sự kiện / bối cảnh -> không phải ảnh sản phẩm. */
const NOT_PRODUCT =
  /\b(booth|game ?show|gamescom|comiket|esport|e-?sports|tournament|championship|person|people|man |woman |player |players|team |streamer|interview|autograph|meet and greet|fan |crowd|audience|stage|panel|signing|podium|exhibition|messe|trade show|fair|museum|shop |store |office|desk |setup|interior|box|package|unboxing|review|teardown|disassembl|schematic|circuit|motherboard|mainboard|module|stick|ram |sodimm|dimm\b)/i;

async function catFiles(cat: string): Promise<string[]> {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&list=categorymembers&cmtitle=${encodeURIComponent(`Category:${cat}`)}` +
      `&cmtype=file&cmlimit=200`,
  );
  return (d?.query?.categorymembers ?? [])
    .map((x: any) => String(x.title))
    .filter((t: string) => /\.(jpe?g|png|webp)$/i.test(t) && !/\.svg$/i.test(t));
}

async function infoOf(files: string[]) {
  if (!files.length) return [];
  const out: Array<{ title: string; url: string; desc: string }> = [];
  for (let i = 0; i < files.length; i += 40) {
    const chunk = files.slice(i, i + 40);
    const info = await getJson(
      `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
        `&titles=${encodeURIComponent(chunk.join('|'))}` +
        `&prop=imageinfo&iiprop=url|mime|extmetadata&iiurlwidth=900`,
    );
    for (const p of Object.values<any>(info?.query?.pages ?? {})) {
      const ii = (p.imageinfo ?? [])[0];
      if (!ii?.mime || !/^image\/(jpeg|png|webp)$/.test(ii.mime)) continue;
      out.push({
        title: String(p.title),
        url: String(ii.thumburl ?? ii.url),
        desc: String(ii.extmetadata?.ImageDescription?.value ?? '')
          .replace(/<[^>]+>/g, '')
          .slice(0, 140),
      });
    }
  }
  return out;
}

const POOLS: Record<string, string[]> = {
  'Tai nghe': [
    'Gaming headsets',
    'Headsets',
    'Sound Blaster headsets',
    'Headphones',
    'Computer headsets',
  ],
  Chuột: [
    'Computer mice with white background',
    'Video gaming mice',
    'Computer mice',
    'Gaming mice',
  ],
  'PC Gaming': [
    'Solid-state drives',
    'NVM Express',
    'Computer storage devices',
    'Disk drives',
  ],
  'Bàn phím': ['Computer keyboards', 'Mechanical keyboards', 'Gaming keyboards'],
};

async function main() {
  const result: Record<string, Array<{ title: string; url: string; desc: string }>> =
    {};

  for (const [cat, cats] of Object.entries(POOLS)) {
    const files = new Set<string>();
    for (const c of cats) for (const f of await catFiles(c)) files.add(f);

    // Lấy mô tả để lọc.
    const all = await infoOf([...files]);
    const good = all.filter((f) => {
      const text = `${f.title} ${f.desc}`;
      if (NOT_PRODUCT.test(text)) return false;
      // Phải nhắc đúng loại sản phẩm.
      const t = text.toLowerCase();
      const typeOk =
        cat === 'Tai nghe'
          ? /headset|headphone|cascos|casque|earphone|gaming headset/.test(t)
          : cat === 'Chuột'
            ? /mouse|rat[oó]n|mice/.test(t)
            : cat === 'PC Gaming'
              ? /ssd|solid.state|drive|nvme|m\.2/.test(t)
              : /keyboard|clavier|teclado/.test(t);
      return typeOk;
    });
    result[cat] = good;
    console.log(`\n########## ${cat}: ${good.length} ảnh sản phẩm`);
    good.forEach((f) => console.log(`  ${f.title}\n     ${f.desc}`));
  }

  const dest = resolve(process.cwd(), 'scripts/data/product-photo-pool.json');
  writeFileSync(dest, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`\n-> ${dest}`);
}
void main();

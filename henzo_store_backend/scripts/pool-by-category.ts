/**
 * Kiểm kê ảnh SẢN PHẨM THẬT theo category Commons (dùng cho fallback).
 *
 * Chạy: npx tsx scripts/pool-by-category.ts
 */
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

/** Loại ảnh có người / sự kiện / bàn phím-monitor cùng lúc. */
const PEOPLE_RE =
  /\b(booth|game show|gamescom|tokyo-game|comiket|person|man |woman |player|pro player|team |esport|streamer|interview|tournament|championship|expo|messe|fair|signing|meet|autograph|fan |crowd|stage|panel|sitting|wearing|worn|player|esports)/i;
const BAD_RE =
  /\b(logo|icon|diagram|chart|box|package|unboxing|review|teardown|disassembl|schematic|circuit|motherboard|stand\b|desk\b|setup\b|wall|interior|case interior|poster|sign|plaque|trophy|booth|venue|hall|studio|room|office|store\b)/i;

async function catFiles(cat: string) {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&list=categorymembers&cmtitle=${encodeURIComponent(`Category:${cat}`)}` +
      `&cmtype=file&cmlimit=150`,
  );
  return (d?.query?.categorymembers ?? [])
    .map((x: any): string => String(x.title))
    .filter((t: string) => /\.(jpe?g|png|webp)$/i.test(t) && !/\.svg$/i.test(t));
}

async function main() {
  const POOLS: Record<string, string[]> = {
    'Tai nghe': [
      'Gaming headsets',
      'Headsets',
      'Headphones',
      'Computer headsets',
      'Microphones',
    ],
    Chuột: ['Computer mice', 'Video gaming mice', 'Mice (computer)'],
    'Bàn phím': ['Computer keyboards', 'Mechanical keyboards'],
    'PC Gaming': ['Solid-state drives', 'NVM Express', 'Drives', 'Computer storage'],
  };

  for (const [cat, cats] of Object.entries(POOLS)) {
    const all = new Set<string>();
    for (const c of cats) {
      for (const f of await catFiles(c)) all.add(f);
    }
    const good = [...all].filter(
      (f: string) => !PEOPLE_RE.test(f) && !BAD_RE.test(f),
    );
    console.log(`\n########## ${cat}: ${good.length}/${all.size} ảnh sản phẩm`);
    good.forEach((f: string) => console.log('  ', f));
  }
}
void main();

export {};

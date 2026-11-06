/**
 * Tìm ảnh qua Wikipedia đa ngôn ngữ + ảnh "anh em cùng dòng".
 *
 * Chạy: npx tsx scripts/multilang-search.ts "Corsair HS60 Wireless"
 */
const UA = 'henzo-store/1.0 (model image resolver; dev@henzo.local)';
const LANGS = ['en', 'de', 'fr', 'es', 'it', 'pl', 'ru', 'ja', 'zh', 'pt', 'nl', 'sv'];

async function getJson(url: string): Promise<any> {
  for (let a = 0; a < 3; a++) {
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

/** Tìm trang wiki ở mọi ngôn ngữ + ảnh trong media-list. */
async function multiLang(model: string) {
  const out: string[] = [];
  for (const lang of LANGS) {
    const d = await getJson(
      `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&list=search` +
        `&srsearch=${encodeURIComponent(model)}&srlimit=4`,
    );
    for (const x of d?.query?.search ?? []) {
      const title = String(x.title);
      const m = await getJson(
        `https://${lang}.wikipedia.org/api/rest_v1/page/media-list/${encodeURIComponent(title)}`,
      );
      const files = (m?.items ?? [])
        .filter((it: any) => it?.type === 'image')
        .map((it: any) => String(it.title))
        .filter((t: string) => !/vector|logo|icon|diagram|chart|\.svg$/i.test(t));
      if (files.length) {
        out.push(`[${lang}] ${title} -> ${files.slice(0, 4).join(' | ')}`);
      }
    }
  }
  return out;
}

/** Commons: tìm file có chứa MÃ model cụ thể (intitle). */
async function commonsIntitle(code: string) {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(`intitle:${code}`)}` +
      `&gsrlimit=30&prop=imageinfo&iiprop=url|mime&iiurlwidth=900`,
  );
  return Object.values<any>(d?.query?.pages ?? {})
    .filter((p) => {
      const ii = (p.imageinfo ?? [])[0];
      return ii?.mime && /^image\/(jpeg|png|webp)$/.test(ii.mime);
    })
    .map((p) => ({ title: String(p.title), url: String((p.imageinfo ?? [])[0]?.thumburl ?? '') }));
}

async function main() {
  const model = process.argv[2] ?? 'Corsair HS60 Wireless';
  console.log(`########## ${model}\n`);

  console.log('--- Wikipedia đa ngôn ngữ:');
  const ml = await multiLang(model);
  ml.forEach((x) => console.log('   ', x));
  if (!ml.length) console.log('    (không có)');

  // Mã model và các biến thể mã khác của cùng dòng.
  const codes = new Set<string>();
  const m = model.match(/[A-Za-z]{1,4}[-]?\d{1,4}[A-Za-z]*/g) ?? [];
  m.forEach((c) => codes.add(c));
  // Bỏ mã yếu 1-2 ký tự.
  const strong = [...codes].filter((c) => c.length >= 3);
  console.log('\n--- Commons intitle:');
  for (const c of strong) {
    const r = await commonsIntitle(c);
    console.log(`    intitle:${c} -> ${r.length}`);
    r.slice(0, 8).forEach((x) => console.log('        ', x.title));
  }
}
void main();

export {};

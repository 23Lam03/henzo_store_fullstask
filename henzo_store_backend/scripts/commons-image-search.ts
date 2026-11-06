import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const UA = 'henzo-store/1.0 (product image resolver; dev@henzo.local)';

function variants(name: string): string[] {
  const base = name.replace(/\s+/g, ' ').replace(/"/g, '').trim();
  const out = [base];
  const noCap = base.replace(/\s+\d+(?:\.\d+)?\s*(?:GB|TB|MB)\b/gi, '').trim();
  if (noCap !== base) out.push(noCap);
  const noModel = noCap.replace(/\s+[A-Z]{2,5}[-]?\d{2,}[A-Z0-9]*\b/g, '').trim();
  if (noModel && !out.includes(noModel)) out.push(noModel);
  return out.filter(Boolean);
}

async function search(q: string): Promise<Array<{ title: string; url: string }>> {
  const url =
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
    `&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(q)}` +
    `&gsrlimit=3&prop=imageinfo&iiprop=url&iiurlwidth=800`;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      if (res.status === 429) {
        await new Promise((r) => setTimeout(r, 2500 * (attempt + 1)));
        continue;
      }
      if (!res.ok) return [];
      const data: any = await res.json();
      const pages = data?.query?.pages ?? {};
      const out: Array<{ title: string; url: string }> = [];
      for (const v of Object.values<any>(pages)) {
        const ii = (v.imageinfo ?? [])[0] ?? {};
        const u = ii.thumburl ?? ii.url;
        if (!u) continue;
        if (!/\.(jpe?g|png)$/i.test(u.split('?')[0])) continue;
        out.push({ title: String(v.title ?? ''), url: u });
      }
      return out;
    } catch {
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  return [];
}

async function main() {
  const mock = JSON.parse(
    readFileSync(resolve(process.cwd(), 'scripts/data/frontend-mock.json'), 'utf-8'),
  );

  const results: Record<string, { title: string; url: string }[]> = {};
  let found = 0;

  for (const p of mock.products as any[]) {
    const hits: Array<{ title: string; url: string }> = [];
    for (const v of variants(p.name)) {
      const r = await search(v);
      if (r.length) {
        hits.push(...r);
        break;
      }
    }
    results[p.slug] = hits;
    if (hits.length) found++;
    console.log(
      `${hits.length ? '✓' : '✗'} ${p.name.padEnd(40)} ${hits.length ? hits[0].title : ''}`,
    );
  }

  const out = resolve(process.cwd(), '/tmp/commons-images.json');
  writeFileSync(out, JSON.stringify(results, null, 2), 'utf-8');
  console.log(
    `\n[commons] Tìm được ảnh cho ${found}/${mock.products.length} sản phẩm -> ${out}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

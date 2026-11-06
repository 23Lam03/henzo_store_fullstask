import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const UA = 'henzo-store/1.0 (image verifier; dev@henzo.local)';

async function head(url: string): Promise<number> {
  for (let a = 0; a < 3; a++) {
    try {
      const r = await fetch(url, {
        method: 'HEAD',
        headers: { 'User-Agent': UA },
      });
      if (r.status === 429 || r.status >= 500) {
        await new Promise((s) => setTimeout(s, 1200 * (a + 1)));
        continue;
      }
      return r.status;
    } catch {
      await new Promise((s) => setTimeout(s, 800));
    }
  }
  return 0;
}

async function main() {
  const db = JSON.parse(
    readFileSync(resolve(process.cwd(), 'scripts/data/model-images.json'), 'utf-8'),
  ) as Record<string, { images: string[] }>;

  const jobs: Array<{ model: string; url: string; primary: boolean }> = [];
  for (const [model, v] of Object.entries(db)) {
    v.images.slice(0, 8).forEach((u, i) =>
      jobs.push({ model, url: u, primary: i === 0 }),
    );
  }
  console.log(`[verify] Kiểm tra ${jobs.length} URL…`);

  const bad: typeof jobs = [];
  let done = 0;
  for (const j of jobs) {
    const st = await head(j.url);
    if (st !== 200) bad.push({ ...j, status: st } as any);
    done++;
    if (done % 100 === 0) console.log(`  ...${done}/${jobs.length}`);
  }
  console.log(`[verify] URL hỏng: ${bad.length}`);
  const byModel = new Map<string, number>();
  for (const b of bad as any[]) {
    byModel.set(b.model, (byModel.get(b.model) ?? 0) + 1);
  }
  for (const [m, c] of byModel) console.log(`   - ${m}: ${c} ảnh hỏng`);
}

void main();

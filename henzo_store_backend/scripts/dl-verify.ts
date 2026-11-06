import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolveFiles } from './lib/commons-files';

const list = JSON.parse(readFileSync(process.argv[2], 'utf-8')) as string[];
const outDir = process.argv[3] ?? '/tmp/verify';
mkdirSync(outDir, { recursive: true });
const m = await resolveFiles(list);
const manifest: Record<string, string> = {};
let i = 0;
for (const [f, u] of m) {
  const name = `${String(i++).padStart(3, '0')}-${f.replace(/[/\\]/g, '_')}`;
  try {
    const r = await fetch(u, { headers: { 'User-Agent': 'henzo-store/1.0' } });
    const b = Buffer.from(await r.arrayBuffer());
    writeFileSync(`${outDir}/${name}`, b);
    manifest[name] = f;
  } catch (e) {
    console.log('fail', f);
  }
}
writeFileSync(`${outDir}/manifest.json`, JSON.stringify(manifest, null, 2));
console.log('downloaded', Object.keys(manifest).length);

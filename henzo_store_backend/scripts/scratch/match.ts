import { connectDB, disconnectDB } from '../../src/server/db';
import { ProductModel } from '../../src/server/models/Product';
import fs from 'fs';
import path from 'path';

function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/[","]/g, '')
    .replace(/\b\d+\s?(gb|tb|gb)\b/gi, '')
    .replace(/\b(titanium gray|natural titanium|deep blue|black|white|silver shadow|cobalt violet|eclipse gray|tonal silver|moonlight white|platinum silver|graphite gray|lunar gray|storm gray|arctic white|carbon black|grey|snow|mango|pale gray|mx stone|graphite|silver|midnight blue|porcelain|hazel|obsidian|red|sand|sandstone|forest green)\b/gi, '')
    .replace(/\b\d+("|inch|"|in)\b/gi, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

async function main() {
  const mock = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'scripts/data/frontend-mock.json'), 'utf8'));
  const catalog = mock.products as any[];
  const catMap = new Map<string, any>();
  for (const p of catalog) catMap.set(normalize(p.name), p);

  await connectDB();
  const rows = await ProductModel.find({}).select('name categoryName').lean();
  const hit = new Map<string, any>();
  const miss: string[] = [];
  for (const r of rows as any[]) {
    const k = normalize(r.name);
    const c = catMap.get(k);
    if (c) hit.set(r.categoryName, (hit.get(r.categoryName) ?? 0) + 1);
    else miss.push(`${r.categoryName}\t${r.name}\t[${k}]`);
  }
  console.log('=== KHỚP catalog:', hit.size ? [...hit.entries()].map(([k,v])=>`${k}:${v}`).join(' ') : 'none');
  console.log('=== KHÔNG khớp:', miss.length);
  const byCat = new Map<string,string[]>();
  for (const m of miss) { const [c] = m.split('\t'); byCat.set(c, [...(byCat.get(c)??[]), m]); }
  for (const [c, list] of byCat) {
    console.log(`\n--- ${c} (${list.length})`);
    list.slice(0, 60).forEach(x => console.log('   ', x.split('\t')[1]));
  }
  await disconnectDB();
}
main().catch((e)=>{console.error(e);process.exit(1);});

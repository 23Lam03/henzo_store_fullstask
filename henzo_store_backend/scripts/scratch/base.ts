import { connectDB, disconnectDB } from '../../src/server/db';
import { ProductModel } from '../../src/server/models/Product';
import fs from 'fs'; import path from 'path';

const stripTail = (s: string) => s
  .replace(/\s*\d+(GB|TB)\s*(13|14|15|16|17|18)?"?\s*$/i, '')
  .replace(/\s*13"|\s*14"|\s*15"|\s*16"|\s*17"|\s*18"/g, '')
  .replace(/\s+/g, ' ').trim();

async function main() {
  const mock = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'scripts/data/frontend-mock.json'), 'utf8'));
  await connectDB();
  const rows = await ProductModel.find({}).select('name categoryName').lean();
  const bases = new Map<string, {n:number; cat:string}>();
  for (const r of rows as any[]) {
    const b = stripTail(r.name);
    const e = bases.get(b) ?? {n:0, cat:r.categoryName};
    e.n++; bases.set(b, e);
  }
  console.log('=== Số dòng cơ sở:', bases.size);

  const catBases = new Set<string>();
  for (const p of mock.products as any[]) catBases.add(stripTail(p.name));
  let covered=0; const need: string[]=[];
  for (const [b, e] of bases) { if (catBases.has(b)) covered += e.n; else need.push(`${e.cat}\t${b}\t(${e.n})`); }
  console.log('=== Sản phẩm phủ bởi catalog base:', covered, '/', rows.length);
  console.log('=== DÒNG CÒN THIẾU:', need.length);
  need.forEach(x=>console.log('  ', x));
  await disconnectDB();
}
main().catch((e)=>{console.error(e);process.exit(1);});

import { connectDB, disconnectDB } from '../../src/server/db';
import { ProductModel } from '../../src/server/models/Product';
import { modelKey } from '../../../henzo_store/src/data/modelImages';
import fs from 'fs';
async function main(){
  await connectDB();
  const rows = await ProductModel.find({}).select('name categoryName brand').lean();
  const m = new Map<string,{n:number;cat:string;brand:string}>();
  for (const r of rows as any[]) {
    const k = modelKey(r.name);
    const e = m.get(k) ?? {n:0,cat:r.categoryName,brand:r.brand};
    e.n++; m.set(k,e);
  }
  const out = [...m.entries()].sort((a,b)=>a[0].localeCompare(b[0])).map(([k,e])=>`${e.cat}\t${e.brand}\t${k}\t${e.n}`);
  fs.writeFileSync('scripts/tmp/modelkeys.txt', out.join('\n'));
  console.log('Tổng model key:', m.size);
  await disconnectDB();
}
main().catch(e=>{console.error(e);process.exit(1);});

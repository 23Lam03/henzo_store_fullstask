import { PRODUCT_VARIANTS } from '../../../henzo_store/src/data/productVariants';
import fs from 'fs';
const m = new Map<string,{cat:string;brand:string;kind:string;kinds:string[]}>();
for (const v of PRODUCT_VARIANTS) {
  const e = m.get(v.base) ?? {cat:v.category,brand:v.brand,kind:v.kind,kinds:[]};
  if (!e.kinds.includes(v.suffix ?? '')) e.kinds.push(v.suffix ?? '');
  m.set(v.base, e);
}
const out = [...m.entries()].sort((a,b)=>a[0].localeCompare(b[0])).map(([b,e])=>`${e.cat}\t${e.brand}\t${e.kind}\t${b}\t${e.kinds.length}`);
fs.writeFileSync('scripts/tmp/bases.txt', out.join('\n'));
console.log('Distinct bases:', m.size);

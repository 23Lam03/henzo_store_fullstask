import fs from 'fs'; import path from 'path';
import { modelKey } from '../../../henzo_store/src/data/modelImages';
const mock = JSON.parse(fs.readFileSync(path.resolve(process.cwd(),'scripts/data/frontend-mock.json'),'utf8'));
const cat=(mock.products as any[]).map(p=>({key:modelKey(p.name),specs:p.specifications,desc:p.description,tags:p.tags}));
const exact=new Map(cat.map(c=>[c.key,c]));
const bases=fs.readFileSync('scripts/tmp/bases.txt','utf8').trim().split('\n').map(l=>{const p=l.split('\t');return{cat:p[0],brand:p[1],kind:p[2],base:p[3]};});
let cov=0; const need:any[]=[];
for(const b of bases){ const c=exact.get(modelKey(b.base)); if(c) cov++; else need.push(b); }
console.log('CO catalog:',cov,'/',bases.length,'| CAN viet spec:',need.length);
fs.writeFileSync('scripts/tmp/need-spec.txt', need.map(b=>`${b.cat}\t${b.kind}\t${b.base}`).join('\n'));
need.forEach(b=>console.log(`${b.cat}|${b.kind}|${b.base}`));

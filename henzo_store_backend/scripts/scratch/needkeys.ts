import fs from 'fs'; import path from 'path';
import { modelKey } from '../../../henzo_store/src/data/modelImages';
const mock = JSON.parse(fs.readFileSync(path.resolve(process.cwd(),'scripts/data/frontend-mock.json'),'utf8'));
const cat=(mock.products as any[]).map(p=>({key:modelKey(p.name),specs:p.specifications,desc:p.description}));
const have=new Map(cat.map(c=>[c.key,c]));
const bases=fs.readFileSync('scripts/tmp/bases.txt','utf8').trim().split('\n').map(l=>{const p=l.split('\t');return{cat:p[0],brand:p[1],kind:p[2],base:p[3]};});
const need:string[]=[];
for(const b of bases){ const k=modelKey(b.base); if(!have.has(k) && !need.includes(k)) need.push(k); }
console.log('Cần viết spec cho', need.length, 'model key:');
need.forEach(k=>console.log(k));

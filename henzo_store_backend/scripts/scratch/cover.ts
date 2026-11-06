import { MODEL_SPECS, specModelKey } from '../../../henzo_store/src/data/modelSpecs';
import fs from 'fs';
const bases=fs.readFileSync('scripts/tmp/bases.txt','utf8').trim().split('\n').map(l=>{const p=l.split('\t');return{cat:p[0],kind:p[2],base:p[3]};});
const miss: string[]=[];
for(const b of bases){ const k=specModelKey(b.base); if(!MODEL_SPECS[k]) miss.push(`${b.cat}|${b.base}|key="${k}"`); }
console.log('Tổng model:',bases.length,'| CÓ spec:',bases.length-miss.length,'| THIẾU:',miss.length);
miss.forEach(m=>console.log(' ',m));

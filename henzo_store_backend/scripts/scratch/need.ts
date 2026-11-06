import fs from 'fs'; import path from 'path';
const mock = JSON.parse(fs.readFileSync(path.resolve(process.cwd(),'scripts/data/frontend-mock.json'),'utf8'));
const COLORS='titanium gray|titanium black|natural titanium|deep blue|silver shadow|cobalt violet|eclipse gray|tonal silver|moonlight white|platinum silver|graphite gray|lunar gray|storm gray|arctic white|carbon black|grey|snow|mango|pale gray|mx stone|graphite|silver|midnight blue|porcelain|hazel|obsidian|red|sand|sandstone|forest green|black|white|chromium';
const strip=(s:string)=>s.replace(/\s*\d+(GB|TB)\s*(13|14|15|16|17|18)?"?\s*$/i,'').replace(new RegExp(`\\s+(${COLORS})$`,'i'),'').replace(/\s*13"|\s*14"|\s*15"|\s*16"|\s*17"|\s*18"/g,'').replace(/\s+/g,' ').trim();
const cat=(mock.products as any[]).map(p=>({base:strip(p.name),specs:p.specifications,desc:p.description,tags:p.tags,brand:p.brand}));
const exact=new Map(cat.map(c=>[c.base,c]));
const prefix=new Map<string,any>();
for(const c of cat){const w=c.base.split(' ');for(let i=2;i<=w.length;i++){const k=w.slice(0,i).join(' ');if(!prefix.has(k))prefix.set(k,c);}}
const bases=fs.readFileSync('scripts/tmp/bases.txt','utf8').trim().split('\n').map(l=>{const p=l.split('\t');return{cat:p[0],brand:p[1],kind:p[2],base:p[3]};});
const need:any[]=[];const have:any[]=[];
for(const b of bases){ const c=exact.get(b.base)??prefix.get(b.base); if(c) have.push(b); else need.push(b); }
console.log('CO catalog:',have.length,'| CAN viet spec:',need.length);
fs.writeFileSync('scripts/tmp/need-spec.txt', need.map(b=>`${b.cat}\t${b.brand}\t${b.kind}\t${b.base}`).join('\n'));
console.log('--- CAN VIET ---');
need.forEach(b=>console.log(`${b.cat} | ${b.base}`));

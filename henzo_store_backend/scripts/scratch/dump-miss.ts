import { connectDB, disconnectDB } from '../../src/server/db';
import { ProductModel } from '../../src/server/models/Product';
import fs from 'fs'; import path from 'path';
const COLORS = 'titanium gray|titanium black|natural titanium|deep blue|silver shadow|cobalt violet|eclipse gray|tonal silver|moonlight white|platinum silver|graphite gray|lunar gray|storm gray|arctic white|carbon black|grey|snow|mango|pale gray|mx stone|graphite|silver|midnight blue|porcelain|hazel|obsidian|red|sand|sandstone|forest green|black|white|chromium';
const strip = (s: string) => s.replace(/\s*\d+(GB|TB)\s*(13|14|15|16|17|18)?"?\s*$/i,'').replace(new RegExp(`\\s+(${COLORS})$`,'i'),'').replace(/\s*13"|\s*14"|\s*15"|\s*16"|\s*17"|\s*18"/g,'').replace(/\s+/g,' ').trim();
async function main(){
  const mock = JSON.parse(fs.readFileSync(path.resolve(process.cwd(),'scripts/data/frontend-mock.json'),'utf8'));
  await connectDB();
  const rows = await ProductModel.find({}).select('name categoryName').lean();
  const bases = new Map<string,{n:number;cat:string}>();
  for (const r of rows as any[]) { const b=strip(r.name); const e=bases.get(b)??{n:0,cat:r.categoryName}; e.n++; bases.set(b,e); }
  const cat=(mock.products as any[]).map(p=>({base:strip(p.name),specs:p.specifications,desc:p.description}));
  const exact=new Map(cat.map(c=>[c.base,c]));
  const prefix=new Map<string,any>();
  for(const c of cat){const w=c.base.split(' ');for(let i=2;i<=w.length;i++){const k=w.slice(0,i).join(' ');if(!prefix.has(k))prefix.set(k,c);}}
  const miss:string[]=[];
  for(const [b,e] of bases){ if(exact.has(b)||prefix.has(b)) continue; miss.push(`${e.cat}\t${b}`); }
  fs.writeFileSync('scripts/tmp/missing.txt', miss.join('\n'));
  console.log('missing lines:', miss.length);
  await disconnectDB();
}
main().catch(e=>{console.error(e);process.exit(1);});

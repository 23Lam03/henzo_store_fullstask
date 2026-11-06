const COLORS='titanium gray|titanium black|natural titanium|deep blue|silver shadow|cobalt violet|eclipse gray|tonal silver|moonlight white|platinum silver|graphite gray|lunar gray|storm gray|arctic white|carbon black|grey|snow|mango|pale gray|mx stone|graphite|silver|midnight blue|porcelain|hazel|obsidian|red|sand|sandstone|forest green|black|white|chromium';
const strip=(s:string)=>s.replace(/\s*\d+(GB|TB)\s*(13|14|15|16|17|18)?"?\s*$/i,'').replace(new RegExp(`\\s+(${COLORS})$`,'i'),'').replace(/\s*(13|14|15|16|17|18)"/g,'').replace(/\s+/g,' ').trim();
console.log(JSON.stringify(strip('MacBook Pro 14" M4 Pro 512GB')));
console.log(JSON.stringify(strip('MacBook Pro 14" M4 Pro')));
console.log(JSON.stringify(strip('MacBook Pro 16" M4 Pro 512GB')));
console.log(JSON.stringify(strip('iPhone 16 Pro Max 256GB')));
console.log(JSON.stringify(strip('Samsung Galaxy S24 Ultra 256GB')));

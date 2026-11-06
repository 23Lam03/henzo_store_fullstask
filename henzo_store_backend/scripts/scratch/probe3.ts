/** Probe Commons cho các dòng điện thoại còn thiếu ảnh riêng. */
import { writeFileSync } from 'node:fs';

const UA = 'henzo-store/1.0 (model image resolver; dev@henzo.local)';

async function getJson(url: string): Promise<any> {
  for (let a = 0; a < 4; a++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } });
      if (r.status === 429) {
        await new Promise((s) => setTimeout(s, 2500 * (a + 1)));
        continue;
      }
      if (!r.ok) return null;
      return await r.json();
    } catch {
      await new Promise((s) => setTimeout(s, 900));
    }
  }
  return null;
}

const QUERIES = [
  'Nokia G42',
  'Poco F6 Pro',
  'Poco X6 Pro',
  'Realme GT6',
  'Realme 13 Pro',
  'Vivo V40',
  'Vivo X200',
  'Honor Magic7',
  'Honor Magic 7',
  'Tecno Spark 30',
  'Xiaomi Redmi Note 14',
  'OnePlus 12',
  'OnePlus 13',
  'Samsung Galaxy A56',
  'iPhone 16e',
  'Samsung Galaxy S26',
  'Samsung Galaxy S25',
  'Xiaomi 15 Ultra',
  'OPPO Find X8',
  'Google Pixel 9',
  'MacBook Pro 16 M4',
  'MacBook Air 15 M4',
  'MacBook Pro 14 M4',
  'Huawei Matebook',
  'Galaxy Z Fold',
  'Galaxy Z Flip',
];

async function main() {
  const log: string[] = [];
  const all = new Set<string>();
  for (const q of QUERIES) {
    const d = await getJson(
      `https://commons.wikimedia.org/w/api.php?action=query&format=json&list=search` +
        `&srsearch=${encodeURIComponent(`filetype:bitmap ${q}`)}&srnamespace=6&srlimit=40`,
    );
    const res = (d?.query?.search ?? []) as any[];
    log.push(`\n=== ${q} (${res.length}) ===`);
    for (const r of res) {
      const t = String(r.title).replace(/^File:/, '');
      log.push(`  ${t}`);
      all.add(t);
    }
  }
  writeFileSync('scripts/data/probe3.txt', log.join('\n'));
  writeFileSync('scripts/data/probe3.json', JSON.stringify([...all], null, 2));
  console.log('total', all.size);
}

void main();

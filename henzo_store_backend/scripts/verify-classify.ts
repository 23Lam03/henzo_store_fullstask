import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { inferBrand, inferCategory } from '../src/server/data/product-classify';

const backup = JSON.parse(
  readFileSync(
    resolve(process.cwd(), 'scripts/data/products-backup.json'),
    'utf-8',
  ),
);

let catOk = 0;
let catFail = 0;
let brandOk = 0;
let brandFail = 0;
const catFails: string[] = [];
const brandFails: string[] = [];

for (const p of backup as any[]) {
  const name = String(p.name ?? '').replace(/\s\d+$/, '');

  const c = inferCategory(name);
  if (c) {
    catOk++;
    if (c !== p.categoryName) {
      catFails.push(`${name}: cũ="${p.categoryName}" mới="${c}"`);
    }
  } else {
    catFail++;
    catFails.push(`${name}: KHÔNG SUY RA ĐƯỢC (cũ="${p.categoryName}")`);
  }

  const b = inferBrand(name);
  if (b) {
    brandOk++;
    if (b !== p.brand) {
      brandFails.push(`${name}: cũ="${p.brand}" mới="${b}"`);
    }
  } else {
    brandFail++;
    brandFails.push(`${name}: KHÔNG SUY RA ĐƯỢC (cũ="${p.brand}")`);
  }
}

console.log(`\nTổng: ${backup.length} sản phẩm`);
console.log(`Suy ra danh mục     : ${catOk} ok / ${catFail} fail`);
console.log(`Suy ra thương hiệu : ${brandOk} ok / ${brandFail} fail`);

console.log(`\n── Danh mục thay đổi (${catFails.length}) ──`);
for (const f of catFails.slice(0, 30)) console.log('  ', f);

console.log(`\n── Thương hiệu thay đổi (${brandFails.length}) ──`);
for (const f of brandFails.slice(0, 30)) console.log('  ', f);

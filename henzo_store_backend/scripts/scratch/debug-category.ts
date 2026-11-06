/**
 * Liệt kê ảnh trong CATEGORY Commons (để tìm ảnh dòng sản phẩm).
 *
 * Chạy: npx tsx scripts/debug-category.ts "Corsair headsets"
 */
import { modelName } from '../lib/model-name';

const UA = 'henzo-store/1.0 (model image resolver; dev@henzo.local)';

async function getJson(url: string): Promise<any> {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

async function catMembers(cat: string) {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&list=categorymembers&cmtitle=${encodeURIComponent(`Category:${cat}`)}` +
      `&cmtype=file&cmlimit=60`,
  );
  return (d?.query?.categorymembers ?? []).map(
    (x: any): string => String(x.title),
  );
}

async function main() {
  const cat = process.argv[2] ?? 'Corsair headsets';
  console.log('CATEGORY:', cat);
  const m = await catMembers(cat);
  m.forEach((t: string) => console.log('  ', t));
  console.log(`(${m.length} file)`);

  // Tìm các category liên quan.
  const q = cat.split(' ')[0];
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&list=search&srnamespace=14&srsearch=${encodeURIComponent(q)}&srlimit=25`,
  );
  console.log('\n--- category gợi ý:');
  (d?.query?.search ?? []).forEach((x: any) => console.log('  ', String(x.title)));
}
void main();

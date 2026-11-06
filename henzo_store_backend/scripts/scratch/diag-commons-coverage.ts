const UA = 'henzo-store/1.0 (model image resolver; dev@henzo.local)';

async function getJson(url: string): Promise<any> {
  for (let a = 0; a < 3; a++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } });
      if (!r.ok) return null;
      return await r.json();
    } catch {
      await new Promise((s) => setTimeout(s, 600));
    }
  }
  return null;
}

async function search(q: string, ns: 6 | 14) {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&list=search&srsearch=${encodeURIComponent(q)}&srnamespace=${ns}&srlimit=15&srinfo=totalhits`,
  );
  const total = d?.query?.searchinfo?.totalhits ?? 0;
  const titles = (d?.query?.search ?? []).map((s: any) => String(s.title));
  return { total, titles };
}

const QUERIES = [
  'Zowie XL2546X',
  'XL2546',
  'XL2566',
  'Zowie monitor',
  'BenQ Zowie',
  '27GR95QE',
  'UltraGear',
  'GP950',
  'Corsair HS60',
  'Corsair headset',
  'HyperX Cloud Alpha',
  'HyperX headset',
  'Odyssey G9',
  'Samsung Odyssey',
  'XG272',
  'ViewSonic OLED',
  'FireCuda',
  'Seagate NVMe',
  'Xeneon',
  'CU34G2X',
  'M34WMU',
  'Seiren V2',
  'Harpe Ace',
  'Harpe Ace Aim Lab',
  'XM2we',
  'R32fc',
  'Razer Raptor',
  'Quantum 910',
  'FURY Renegade',
  'VP3200',
  '7950X3D',
];

async function main() {
  for (const q of QUERIES) {
    const f = await search(q, 6);
    const c = await search(q, 14);
    console.log(`\n### ${q}  files=${f.total} cats=${c.total}`);
    f.titles.slice(0, 8).forEach((t: string) => console.log(`   F ${t}`));
    c.titles.slice(0, 5).forEach((t: string) => console.log(`   C ${t}`));
  }
}
void main();

export {};

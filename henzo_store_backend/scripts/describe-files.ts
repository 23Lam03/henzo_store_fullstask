/**
 * In mô tả (ImageDescription) của các file Commons để xác nhận đúng sản phẩm.
 */
const UA = 'henzo-store/1.0 (model image resolver; dev@henzo.local)';

const FILES = [
  'SteelSeries 4h.JPG',
  'SteelSeries 3H.JPG',
  'Corsair CX430.JPG',
  'Corsair MP400 20211221 01.png',
  'Cooler Master V8.jpg',
  'Deepcool cooler.png',
  'Tridentz red RAM.JPG',
  'G.Skill RipjawsX DDR3 memory modules.JPG',
  '2023 Dysk SSD Kingston NV2 2TB.jpg',
  'Kingston FURY Impact DDR5 SO-DIMM Laptop Memory 32GB Module - front view.jpg',
  'Seagate BarraCuda Compute 2TB 3.5-inch SATA HDD - top view.jpg',
  'Steelseries Rival 300 Fade Edition side on.png',
  '2023 Corsair iCUE LC100.jpg',
  'Elgato Stream Deck +.jpg',
  'AOC 27B2H LCD MONITOR.jpg',
  'Monitores led de aoc .jpg',
  'Gigabyte AORUS AD27QD 20190601.jpg',
  'LG UltraWide monitors.jpg',
  'Typologo MSI MPG 272URX QD-OLED.png',
  'ASUS TUF Gaming X3 20190601.jpg',
  'ASUS TUF Gaming motherboards 20190601.jpg',
  'HyperX Fury 4gb DDR3.jpg',
  'SteelSeries Apex 5.jpg',
  'Rival Mouse by SteelSeries, FACEIT (2018, Cropped).jpg',
  'Anker power bank lit.jpg',
  '2023 Słuchawki JBL TL0846 (1).jpg',
  'JBL Synchros E50BT.jpg',
  'Keychron K8 Non-Backlight Wireless Mechanical Keyboard.jpg',
  'Logitech Brio 301 webcam HS1.jpg',
  'Samsung Odyssey G9.jpg',
];

async function main() {
  const url =
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
    `&titles=${encodeURIComponent(FILES.map((f) => `File:${f}`).join('|'))}` +
    `&prop=imageinfo&iiprop=url|mime|extmetadata&iiurlwidth=1000`;
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  const d: any = await r.json();
  for (const p of Object.values<any>(d?.query?.pages ?? {})) {
    const t = String(p.title ?? '').replace(/^File:/, '');
    const ii = (p.imageinfo ?? [])[0];
    if (!ii) {
      console.log(`✗ ${t}  MISSING`);
      continue;
    }
    const em = ii.extmetadata ?? {};
    const desc = String(em.ImageDescription?.value ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const cats = String(em.Categories?.value ?? '').split('|').slice(0, 6).join(' / ');
    console.log(`✓ ${t}\n   desc: ${desc.slice(0, 220)}\n   cats: ${cats}`);
  }
}

void main();

export {};

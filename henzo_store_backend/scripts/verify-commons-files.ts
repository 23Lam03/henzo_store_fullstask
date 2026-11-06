/**
 * Verify danh sách file Commons có tồn tại thật không (1 request cho nhiều title).
 *
 * Chạy: npx tsx scripts/verify-commons-files.ts
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const UA = 'henzo-store/1.0 (model image resolver; dev@henzo.local)';

async function getJson(url: string): Promise<any> {
  for (let a = 0; a < 3; a++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } });
      if (r.status === 429) {
        await new Promise((s) => setTimeout(s, 2000 * (a + 1)));
        continue;
      }
      if (!r.ok) return null;
      return await r.json();
    } catch {
      await new Promise((s) => setTimeout(s, 800));
    }
  }
  return null;
}

export async function verifyFiles(
  files: string[],
): Promise<Record<string, { url: string; mime: string }>> {
  const out: Record<string, { url: string; mime: string }> = {};
  const CHUNK = 40;
  for (let i = 0; i < files.length; i += CHUNK) {
    const chunk = files.slice(i, i + CHUNK);
    const d = await getJson(
      `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
        `&titles=${encodeURIComponent(chunk.map((f) => `File:${f}`).join('|'))}` +
        `&prop=imageinfo&iiprop=url|mime&iiurlwidth=1000`,
    );
    for (const p of Object.values<any>(d?.query?.pages ?? {})) {
      const t = String(p.title ?? '').replace(/^File:/, '');
      const ii = (p.imageinfo ?? [])[0];
      if (!ii) {
        console.log(`  ✗ MISSING: ${t}`);
        continue;
      }
      out[t] = { url: String(ii.thumburl ?? ii.url), mime: String(ii.mime) };
      console.log(`  ✓ ${t}  [${ii.mime}]`);
    }
  }
  return out;
}

const FILES = [
  // Tai nghe
  'JBL Synchros E50BT.jpg',
  'JBL LIVE 650 BTNC (Over-Ear Noise Cancelling Headphone). (51127342181).jpg',
  'JBL Endurance Peak 3 - 1.jpg',
  'JBL Endurance Peak 3 - 2.jpg',
  'JBL Endurance Peak 3 - 3.jpg',
  'Sound BlasterX H5 Gaming Headset.jpg',
  'GameCom Halo 2 Edition.jpg',
  'Cascos Mars Gaming.jpg',
  'Auriculares gamer.jpg',
  'Afterglow AGU.1 Wireless Headphones.jpg',
  'Uproar Wireless by Skull Candy.jpg',
  'PS4-Headset.jpg',
  'Tritton.jpg',
  'ST100VoidPro.jpg',
  "Casques d'écoute de podcast.jpg",
  // Chuột
  'Corsair Katar Pro Wireless.jpg',
  'Corsair Scimitar 2 2017-01-01.jpg',
  'Roccat Kova.png',
  'Raton Dexxa 3B - Dexxa 3B mouse - 02.jpg',
  'CM Storm Inferno Gaming Mouse.jpg',
  'Razer Imperator.JPG',
  'Laser mouse.jpg',
  '2023 Mysz komputerowa Logitech G903 Lightspeed.jpg',
  'Logitech G9 Mouse full view.jpeg',
  'Gamers Mouse.jpg',
  'Raton-gaming.jpg',
  'Raton de PC.jpg',
  'Steelseries Rival 300 Fade Edition side on.png',
  'Rival Mouse by SteelSeries, FACEIT (2018, Cropped).jpg',
  'Razer Deathadder Chroma 1 2017-01-01.jpg',
  'Razer DeathAdder 2013 Edition-front oblique-ar 16to10-fs PNr°0400.jpg',
  'Razer DeathAdder 2013 Edition-side left PNr°0402.jpg',
  'Razer abyssus gaming mouse .jpg',
  'Razer Naga 2014 MMO Gaming Mouse (14714867599).jpg',
  'Mouse Trust Gaming GXT 105.jpg',
  'Logitech MX518 Gaming Mouse (4777334208).jpg',
  'Computer.mouse.750pix.jpg',
  'Silver computer mouse with neoprene case.jpg',
  // Bàn phím
  'Corsair K65 1 2017-01-01.jpg',
  'Corsair K60.jpg',
  'SteelSeries Apex 5.jpg',
  'Keychron K8 Non-Backlight Wireless Mechanical Keyboard.jpg',
  'Keychron K8 Non-Backlight Wireless Mechanical Keyboard - 52766711146.jpg',
  'Keychron K8 Non-Backlight Wireless Mechanical Keyboard - 52772912798.jpg',
  'Keychron K8 Non-Backlight Wireless Mechanical Keyboard (closeup).jpg',
  'Keychron K4 mechanical keyboard.jpg',
  'Keychron K1 v2 TKL blue switches.jpg',
  'Keychron K1 v2 TKL side view.jpg',
  'Razer Blackwidow Chroma 1 2017-01-01.jpg',
  'Razer Blackwidow 1 2021-08-27.jpeg',
  'Razer Blackwidow 2 2021-08-27.jpeg',
  'Razer BlackWidow Ultimate 2014 Elite Mechanical Gaming Keyboard.jpg',
  'ROCCAT 冷光鍵盤 (5107526028).jpg',
  'ROCCAT 冷光鍵盤 (5106932947).jpg',
  'ROCCAT 冷光鍵盤 (5107537948).jpg',
  'ROCCAT 冷光鍵盤 (5107575316).jpg',
  'Asus ROG Laptop Keyboard.jpg',
  'Beautiful Mechanical Keyboard.jpg',
  'Lenovo ThinkPad USB TrackPoint keyboard.jpg',
  'ThinkPad TrackPoint Keyboard II.jpg',
  // Màn hình
  'AOC 27B2H LCD MONITOR.jpg',
  'Monitores led de aoc .jpg',
  'Gigabyte AORUS AD27QD 20190601.jpg',
  'LG UltraWide monitors.jpg',
  'Typologo MSI MPG 272URX QD-OLED.png',
  'Computer monitor.jpg',
  'Computer monitor samsung.jpg',
  'Samsung Odyssey G9.jpg',
  'MSI Gaming Laptop on wood floor.jpg',
  // PC Gaming / linh kiện
  'Corsair CX430.JPG',
  'Corsair CX 430 1 2018-09-19.jpg',
  'Corsair CX 430 2 2018-09-19.jpg',
  'Corsair CX 500 1 2018-09-19.jpg',
  'Corsair MP400 20211221 01.png',
  'Corsair MP400 20211221 02.png',
  'Cooler Master Hyper 212 EVO - CPU Cooler with 120mm PWM Fan (RR-212E-20PK-R2).jpg',
  'Cooler Master Hyper RR-T4-18PK-R1 CPU Cooler with 4 Direct Contact Heatpipes 1 2019-05-15.jpg',
  'Cooler Master Hyper RR-T4-18PK-R1 CPU Cooler with 4 Direct Contact Heatpipes 2 2019-05-15.jpg',
  'Cooler Master Hyper RR-T4-18PK-R1 CPU Cooler with 4 Direct Contact Heatpipes 3 2019-05-15.jpg',
  'Cooler Master V8.jpg',
  'DeepCool AK400 1.jpg',
  'DeepCool AK400 2.jpg',
  'Deepcool cooler.png',
  'Kingston FURY Impact DDR5 SO-DIMM Laptop Memory 32GB Module - front view.jpg',
  'Kingston FURY Impact DDR5 SO-DIMM Laptop Memory 32GB Module - rear view.jpg',
  '2023 Dysk SSD Kingston NV2 2TB.jpg',
  'Kingston HyperX Predator 480GB sample at Guang Hua Digital Plaza 6F 20151212.jpg',
  'Western Digital SN850X NVME solid state drive 8TB front side.jpg',
  'Western Digital SN850X NVME solid state drive 8TB back side.jpg',
  'Seagate BarraCuda Compute 2TB 3.5-inch SATA HDD - top view.jpg',
  'ST3000DM001.jpg',
  'Crucial MX100 SSD 256GB 20140905.jpg',
  'Crucial SSD MX300 525GB-8478.jpg',
  'Crucial SSD MX300 525GB-8479.jpg',
  'G.Skill RipjawsX DDR3 memory modules.JPG',
  'Tridentz red RAM.JPG',
  'DDR-SDRAM-Module.jpg',
  'HyperX Fury 4gb DDR3.jpg',
  'Asus tuf x299 mk2 IMGP5925 smial wp.jpg',
  'ASUS TUF Gaming X3 20190601.jpg',
  'ASUS TUF Gaming motherboards 20190601.jpg',
  'Asus tuf x299 mk2 IMGP5930 smial wp.jpg',
  'Asus tuf x299 mk2 IMGP5935 smial wp.jpg',
  // Phụ kiện
  'Elgato Stream Deck +.jpg',
  'Stream Deck- Discord Edition.jpg',
  'Elgato Wave-3.jpg',
  'Elgato Wave Neo and Stream Deck- Discord Edition.jpg',
  'Huggle Buttons on Stream Deck.jpg',
  'Logitech Brio 301 webcam HS1.jpg',
  'Logitech Brio 301 webcam HS2.jpg',
  'Logitech Brio 301 webcam HS3.jpg',
  'Logicool StreamCam (cropped).jpg',
  'Logicool StreamCam C980OW (50201304083).jpg',
  '2023 Corsair iCUE LC100.jpg',
  'Anker power bank lit.jpg',
  'モバイルバッテリー ANKER Power Bank 4,500mAh (9720039628).jpg',
  // Laptop / tablet / phone
  'About iPad Pro 13-inch (M4).jpg',
  'IPad Air 11-inch (M3).jpg',
  'IPad Air 11-inch (M3) backside.jpg',
  'M4 iPad Pro series - 1.jpg',
  'M4 iPad Pro series - 2.jpg',
  'M4 iPad Pro series - 3.jpg',
  '20230729 삼성 갤럭시 탭 S9.jpg',
  'Samsung Galaxy Tab S9.png',
  'SurfaceLaptop.png',
  'SurfaceLaptopBurgundy.png',
  'Surface Laptop Studio - 1.jpg',
  'Surface Laptop Studio - 2.jpg',
  'HP Victus laptop.jpg',
  'HP Victus 15 gaming laptop side view.jpg',
  'Asus vivobook.jpg',
  'Vivobook S16.jpg',
  'ASUS Vivobook X556UQ.jpg',
  'Razer Blade Stealth Late 2017.png',
  'Razer Blade Pro 1 2018-02-13.jpg',
  'Microsoft Surface tablet computer and its box.jpg',
  'Redmi Note 12 front.jpg',
  'Xiaomi Redmi Note 10 Pro (Global) front.jpg',
  'Camera of Google Pixel 9 - 3.jpg',
  'Camera of Google Pixel 9 - 4.jpg',
  'Vivo X200 Pro blue.png',
  'Honor Magic 7 Pro (May 1, 2025).jpg',
  'Honor Magic7 Series (May 1, 2025).jpg',
  // AirPods
  'AirPods_4_ANC_and_case.jpg',
  'Airpods 4.jpg',
  'AirPods Pro.jpg',
  'Apple airpods max 1.jpg',
  // Mouse/keyboard exact model
  'Logitech MX Master 3S HS01.jpg',
  'Logitech MX Master 3S HS03.jpg',
  'Logitech MX Master 3S HS05.jpg',
  'Logitech MX Master 3S HS07.jpg',
  '2026 G502 X PLUS (side view).jpg',
  'Logitech Pro X Superlight 2 sample 20231216.jpg',
  'Logitech G502 1 2017-01-01.jpg',
  'Logitech-g502 (13971851940).jpg',
  'Logitech-g502 (13971832969).jpg',
  'Logitech-g502 (14135316586).jpg',
  'ASUS ROG Delta GUNDAM EDITION 20210131a.jpg',
  'Asus ROG Delta headphone (52416987042).jpg',
  'ASUS ROG Strix G15 (G513QY-HQ012T)-top keyboard PNr°0887.jpg',
  'MSI Thin GF63 12UC-667 HOF2149-HDR RAW-Export.png',
];

async function main() {
  console.log(`[verify] ${FILES.length} file cần kiểm tra…\n`);
  const res = await verifyFiles(FILES);
  writeFileSync(
    resolve(process.cwd(), 'scripts/data/commons-verified.json'),
    JSON.stringify(res, null, 2),
    'utf-8',
  );
  console.log(`\n[verify] Tồn tại: ${Object.keys(res).length}/${FILES.length}`);
}

void main();

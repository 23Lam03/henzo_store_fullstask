/**
 * Verify danh sách file Commons mở rộng (dùng cho pool ảnh thật).
 */
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

const FILES = [
  // ── Màn hình ──
  'ASUS ROG Strix XG32VQR monitor.jpg',
  'Asus ProArt PA246Q monitor 1.JPG',
  'Asus ProArt PA246Q monitor 2.JPG',
  'Asus ProArt PA246Q monitor 3.JPG',
  'Asus ProArt PA246Q monitor 4.JPG',
  'Asus ProArt PA246Q monitor 5.JPG',
  'Asus ProArt PA246Q monitor 6.JPG',
  'ASUS curved monitor 20170603.jpg',
  'ASUS ZenScreen MB16AC 20170603.jpg',
  'ASUS MK241H 20080707.jpg',
  'ASUS MS202D 20100602.jpg',
  'ASUS LS248H at Computex Taipei 20100603.jpg',
  'ASUS VH168D 2011-10.jpg',
  'BENQ MONITOR (Жидкокристалический).jpg',
  'BenQ FP222W face 20080109.jpg',
  'BenQ FP222W left side 20080109a.jpg',
  'BenQ FP222W left side 20080109b.jpg',
  'BenQ SW2700PT-42 (30482110015).jpg',
  'BenQ 50RV6500 settings 20130321.jpg',
  'MSI Optix MPG341CQR 20190601.jpg',
  'MSI monitor 2025.jpg',
  'Gigabyte AORUS AD27QD 20190601.jpg',
  'AOC 27B2H LCD MONITOR.jpg',
  'Monitores led de aoc .jpg',
  'LG UltraWide monitors.jpg',
  'Taipei IT Month LG 29EA93-P 20131203.jpg',
  'LG 19M35A-B.jpg',
  'LG 19M36A-B.jpg',
  'Computer monitor.jpg',
  'Computer monitor samsung.jpg',
  // ── Case / custom PC ──
  'AVADirect-Custom-X99-Intel-Core-i7-gaming-cpu.png',
  'Custom Computer (25062202444).jpg',
  'Custom built computer from 2016.jpg',
  'Custom Computer with Open Case 1 2018-05-06.jpg',
  'A customized desktop pc.jpg',
  'Computer Case (CM).jpg',
  'ATX computer case.jpg',
  'Lian Li PC-60 computer case 20060131.jpg',
  'ITX Personal Computer Case and Flex-ATX PSU IMG 1646.JPG',
  'ITX Personal Computer Case and Flex-ATX PSU IMG 1651.JPG',
  'Falcon Northwest custom PCs.jpg',
  'ATX computer case - left - 2018-05-18.jpg',
  'ATX computer case - right - 2018-05-12.jpg',
  // ── GPU ──
  'Palit GeForce RTX 5090 Gamerock 20250530 HOF3864 RAW-Export.png',
  'Palit GeForce RTX 5090 Gamerock 20250530 HOF3866 RAW-Export.png',
  'Palit GeForce RTX 5090 Gamerock 20250530 HOF3870 RAW-Export cens.png',
  'Palit GeForce RTX 5090 Gamerock 20250530 HOF3873 RAW-Export cens.png',
  'Palit GeForce RTX 5090 Gamerock 20250530 HOF3879 RAW-Export.png',
  'Palit GeForce RTX 5090 Gamerock 20250530 HOF3884-HDR RAW-Export.png',
  'Palit GeForce RTX 5090 Gamerock 20250530 HOF3888-HDR RAW-Export.png',
  'Palit GeForce RTX 5090 Gamerock 20250530 HOF3898-HDR RAW-Export.png',
  'Palit GeForce RTX 5090 Gamerock 20250530 HOF3913 RAW-Export.png',
  'Palit GeForce RTX 5090 Gamerock 20250530 HOF3934 RAW-Export.png',
  'Palit GeForce RTX 5090 Gamerock 20250530 HOF3969 RAW-Export.png',
  'Palit GeForce RTX 5090 Gamerock 20250530 HOF4015 RAW-Export.png',
  'Palit GeForce RTX 5090 Gamerock 20250530 HOF4045 RAW-Export.png',
  'Palit GeForce RTX 5090 Gamerock 20250530 HOF4166 RAW-Export.png',
  // ── SSD ──
  '2023 Dysk SSD Kingston NV2 2TB.jpg',
  'Corsair MP400 20211221 01.png',
  'Corsair MP400 20211221 02.png',
  'Crucial MX100 SSD 256GB 20140905.jpg',
  'Crucial SSD MX300 525GB-8478.jpg',
  'Crucial SSD MX300 525GB-8479.jpg',
  '2017 Dysk SSD Plextor M8Pe(Y) 256GB.jpg',
  'Western Digital SN850X NVME solid state drive 8TB front side.jpg',
  'Western Digital SN850X NVME solid state drive 8TB back side.jpg',
  'Kingston HyperX Predator 480GB sample at Guang Hua Digital Plaza 6F 20151212.jpg',
  // ── PSU ──
  'Corsair CX430.JPG',
  'Corsair CX 430 1 2018-09-19.jpg',
  'Corsair CX 430 2 2018-09-19.jpg',
  'Corsair CX 500 1 2018-09-19.jpg',
  'Computer power supply units 5399.jpg',
  'ATX Computer power supply unit.jpg',
  // ── RAM ──
  'Tridentz red RAM.JPG',
  'G.Skill RipjawsX DDR3 memory modules.JPG',
  'DDR-SDRAM-Module.jpg',
  'HyperX Fury 4gb DDR3.jpg',
  'Random Access Memory HyperX.jpg',
  'HX318C10FB-8 face 20160503.jpg',
  'HX318C10FB-8 rear 20160503.jpg',
  'Kingston KHX8500D2K2-4G 20141010.jpg',
  'A pair of Kingston KHX6400D2K2-2G 20131124.jpg',
  // ── Cooler ──
  'Cooler Master V8.jpg',
  'Cooler Master Hyper 212 EVO - CPU Cooler with 120mm PWM Fan (RR-212E-20PK-R2).jpg',
  'Cooler Master Hyper EVO 212 1 2019-05-15.jpg',
  'Cooler Master Hyper EVO 212 2 2019-05-15.jpg',
  'Cooler Master Hyper EVO 212 3 2019-05-15.jpg',
  'Cooler Master Hyper EVO 212 4 2019-05-15.jpg',
  'Cooler Master Hyper EVO 212 5 2019-05-15.jpg',
  'Cooler Master Hyper RR-T4-18PK-R1 CPU Cooler with 4 Direct Contact Heatpipes 1 2019-05-15.jpg',
  'Cooler Master Hyper RR-T4-18PK-R1 CPU Cooler with 4 Direct Contact Heatpipes 2 2019-05-15.jpg',
  'Cooler Master Hyper RR-T4-18PK-R1 CPU Cooler with 4 Direct Contact Heatpipes 3 2019-05-15.jpg',
  'DeepCool AK400 1.jpg',
  'DeepCool AK400 2.jpg',
  'Deepcool cooler.png',
  // ── Tai nghe ──
  'ST100VoidPro.jpg',
  "Casques d'écoute de podcast.jpg",
  'Sound BlasterX H5 Gaming Headset.jpg',
  'Cascos Mars Gaming.jpg',
  'Auriculares gamer.jpg',
  'Afterglow AGU.1 Wireless Headphones.jpg',
  'Uproar Wireless by Skull Candy.jpg',
  'GameCom Halo 2 Edition.jpg',
  'PS4-Headset.jpg',
  'Tritton.jpg',
  'SteelSeries 4h.JPG',
  'SteelSeries 3H.JPG',
  'JBL Synchros E50BT.jpg',
  'JBL LIVE 650 BTNC (Over-Ear Noise Cancelling Headphone). (51127342181).jpg',
  'JBL Endurance Peak 3 - 1.jpg',
  'JBL Endurance Peak 3 - 2.jpg',
  'JBL Endurance Peak 3 - 3.jpg',
  '2023 Słuchawki JBL TL0846 (1).jpg',
  '2023 Słuchawki JBL TL0846 (2).jpg',
  '2023 Słuchawki JBL TL0846 (3).jpg',
  'ASUS ROG Delta GUNDAM EDITION 20210131a.jpg',
  'Asus ROG Delta headphone (52416987042).jpg',
  // ── Chuột ──
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
  'Razer DeathAdder V2 Pro Wireless on a mousepad.jpg',
  'Razer Deathadder Chroma 1 2017-01-01.jpg',
  'Razer DeathAdder 2013 Edition-front oblique-ar 16to10-fs PNr°0400.jpg',
  'Razer DeathAdder 2013 Edition-side left PNr°0402.jpg',
  'Razer DeathAdder 2013 Edition-back oblique-ar 16to10-fs PNr°0401.jpg',
  'Razer DeathAdder 2013 Edition-bottom PNr°0404.jpg',
  'Razer abyssus gaming mouse .jpg',
  'Razer Naga 2014 MMO Gaming Mouse (14714867599).jpg',
  'Mouse Trust Gaming GXT 105.jpg',
  'Logitech MX518 Gaming Mouse (4777334208).jpg',
  'Computer.mouse.750pix.jpg',
  'Silver computer mouse with neoprene case.jpg',
  'Logitech MX Master 3S HS01.jpg',
  'Logitech MX Master 3S HS02.jpg',
  'Logitech MX Master 3S HS03.jpg',
  'Logitech MX Master 3S HS04.jpg',
  'Logitech MX Master 3S HS05.jpg',
  'Logitech MX Master 3S HS07.jpg',
  '2026 G502 X PLUS (side view).jpg',
  'Logitech G502 1 2017-01-01.jpg',
  'Logitech-g502 (13971851940).jpg',
  'Logitech-g502 (13971832969).jpg',
  'Logitech-g502 (14135316586).jpg',
  // ── Bàn phím ──
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
  'Keychron K1 v2 TKL protocol switches.jpg',
  'Keychron K10 Board 1 2023-11-19.jpeg',
  'Keychron K10 Base 1 2023-11-19.jpeg',
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
  // ── Mic / Webcam / Phụ kiện ──
  'Blue Snowflake USB microphone.jpg',
  'Blue Yeti Blackout USB microphone (51844234538).jpg',
  'Blue Yeti Blackout.jpg',
  'Blue Yeti Nano, Microphone, 2.jpg',
  'Rode NT-USB Mini microphone 001.jpg',
  'Rode NT-USB Mini microphone 003.jpg',
  'Yeti-USB-Microphone.jpg',
  'Silver and black studio microphone condenser.jpg',
  'Sontronics SATURN - Multi-pattern Condenser Microphone (2010).jpg',
  'AKG Perception 120 USB condenser microphone with SH 100 shock mount.jpg',
  'Logitech Brio 301 webcam HS1.jpg',
  'Logitech Brio 301 webcam HS2.jpg',
  'Logitech Brio 301 webcam HS3.jpg',
  'Logicool StreamCam (cropped).jpg',
  'Logicool StreamCam C980OW (50201304083).jpg',
  'Webcam 01.jpg',
  'Webcam (Logitech c922).jpg',
  'Elgato Stream Deck +.jpg',
  'Stream Deck- Discord Edition.jpg',
  'Huggle Buttons on Stream Deck.jpg',
  'Elgato Wave Neo and Stream Deck- Discord Edition.jpg',
  'Elgato Wave-3.jpg',
  'Elgato Dock front 01.jpg',
  'Elgato Dock Back.jpg',
  '2023 Corsair iCUE LC100.jpg',
  'Anker power bank lit.jpg',
  'モバイルバッテリー ANKER Power Bank 4,500mAh (9720039628).jpg',
  'Samsung ATADM10ESE.JPG',
  // ── Tablet / Laptop ──
  'About iPad Pro 13-inch (M4).jpg',
  'IPad Air 11-inch (M3).jpg',
  'IPad Air 11-inch (M3) backside.jpg',
  'M4 iPad Pro series - 1.jpg',
  'M4 iPad Pro series - 2.jpg',
  'M4 iPad Pro series - 3.jpg',
  'Samsung Galaxy Tab S9.png',
  '20230729 삼성 갤럭시 탭 S9.jpg',
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
  'ASUS TUF Gaming X3 20190601.jpg',
  'ASUS TUF B450-PLUS GAMING 20181221.jpg',
];

async function main() {
  const found = new Set<string>();
  for (let i = 0; i < FILES.length; i += 40) {
    const chunk = FILES.slice(i, i + 40);
    const d = await getJson(
      `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
        `&titles=${encodeURIComponent(chunk.map((f) => `File:${f}`).join('|'))}` +
        `&prop=imageinfo&iiprop=url|mime&iiurlwidth=1000`,
    );
    for (const p of Object.values<any>(d?.query?.pages ?? {})) {
      const t = String(p.title ?? '').replace(/^File:/, '');
      const ii = (p.imageinfo ?? [])[0];
      if (ii && /^image\/(jpeg|png|webp)$/.test(String(ii.mime))) found.add(t);
      else console.log(`  ✗ ${t}`);
    }
  }
  console.log(`\nTồn tại: ${found.size}/${FILES.length}`);
  console.log(`\n--- DANH SÁCH FILE THẬT (copy vào map) ---`);
  console.log([...found].map((f) => `'${f.replace(/'/g, "\\'")}',`).join('\n'));
}

void main();

export {};

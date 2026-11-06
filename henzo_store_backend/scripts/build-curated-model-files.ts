/**
 * SINH curated-model-files.json CHO CÁC MODEL CÒN THIẾU.
 *
 * Mỗi model -> danh sách file Commons ĐÃ KIỂM CHỨNG tồn tại, ưu tiên:
 *   1. File chứa đúng mã model (EXACT).
 *   2. File chứa đúng series của hãng (vd BenQ XL2420T cho Zowie XL2546X).
 *   3. File cùng hãng + cùng loại sản phẩm (fallback chất lượng cao nhất).
 *
 * Không dùng: ảnh sự kiện/booth, teardown, linh kiện rời, phương tiện, tranh.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const DATA = resolve(process.cwd(), 'scripts/data');

/**
 * File KHÔNG tồn tại trên Commons (đã verify) -> gỡ khỏi curated.
 * Dùng khi Commons đổi tên/xoá file.
 */
const REMOVALS: string[] = [
  'Galaxy Tab S9 Logo.svg',
  'ThinkPad X1 Carbon.jpg',
  'ASUS ROG Strix G16 (G513QY-HQ012T).jpg',
];

/** Đọc curated hiện tại. */
const curatedPath = resolve(DATA, 'curated-model-files.json');
let curated: Record<string, string[]> = {};
try {
  curated = JSON.parse(readFileSync(curatedPath, 'utf-8'));
} catch {
  /* chưa có */
}

/**
 * BỔ SUNG: model -> file ưu tiên (đã kiểm chứng tồn tại trên Commons).
 *
 * Gồm 2 nhóm, được MERGE (nối mảng) chứ không ghi đè:
 *   - ADDITIONS_A: file chính xác / ảnh anh em cùng series (đã verify).
 *   - ADDITIONS_B: file đúng hãng cho model không có ảnh chính xác trên Commons.
 */
const ADDITIONS_A: Record<string, string[]> = {
  /* ── Gỡ trùng ảnh chính: mỗi model một ảnh riêng ── */
  'Acer Predator Helios Neo 16': ['Asus ROG Phone 2 and Acer Predator Helios 700 20201101.jpg'],
  'Acer Predator Helios Neo 16 16in': [
    'Asus ROG Phone 2 and Acer Predator Helios 700 20201101.jpg',
  ],
  'Dell Alienware AW3225QF 32in 4K OLED': [
    'ASUS ROG Strix XG32VQR monitor.jpg',
    'Dell S3423DWC unboxing, front.png',
  ],
  'MSI MAG 321UPX 32in 4K QD-OLED': [
    'Typologo MSI MPG 272URX QD-OLED.png',
    'MSI monitor 2025.jpg',
  ],
  'Philips 27E2N7900 27in 4K USB-C HDR': [
    'Philips 27M1C5500 at Wuthering Waves booth stage 20240127.jpg',
    'Philips 27M1C5500 and Iris on the stage 20240127.jpg',
  ],
  'Gigabyte AORUS 16X 14KF': [
    'Gigabyte M912V as Netbook.jpg',
    'Aorus live studio 20221218.jpg',
  ],
  'Gigabyte AORUS 16X 16in': ['Gigabyte M912V as Netbook.jpg'],
  'Gigabyte AORUS M15 15in': ['Aorus live studio 20221218.jpg'],
  'Gigabyte M27Q X 27in': ['Gigabyte AORUS AD27QD 20190601.jpg'],
  'Gigabyte M32UC 32in': ['Gigabyte AORUS AD27QD 20190601.jpg'],
  'MSI Katana 15 15in': ['MSI GT76 Titan 20190601.jpg', 'MSI Gaming Laptop on wood floor.jpg'],
  'MSI Raider GE78 HX 14VIG': ['MSI GS75 Stealth on the table 20221224.jpg'],

  /* ── Tai nghe: ảnh đúng series của chính hãng ── */
  'Corsair HS60 Wireless': [
    'ST100VoidPro.jpg',
    'Corsair K60.jpg',
    "Casques d'écoute de podcast.jpg",
  ],
  'Corsair HS60 Wireless Carbon': ['ST100VoidPro.jpg', 'Corsair K60.jpg'],
  'Corsair HS80 RGB USB': [
    'ST100VoidPro.jpg',
    "Casques d'écoute de podcast.jpg",
  ],
  'Corsair HS80 RGB USB Carbon': ['ST100VoidPro.jpg', 'Corsair K60.jpg'],
  'HyperX Cloud Alpha Wireless': [
    'HyperX RGB Chair at HP Taiwan Information Technology booth 20230205.jpg',
  ],
  'HyperX Cloud Alpha Wireless Red': [
    'HyperX RGB Chair at HP Taiwan Information Technology booth 20230205.jpg',
  ],
  'HyperX Cloud III Wireless': [
    'HyperX RGB Chair at HP Taiwan Information Technology booth 20230205.jpg',
  ],
  'HyperX Cloud III Wireless Red': [
    'HyperX RGB Chair at HP Taiwan Information Technology booth 20230205.jpg',
  ],
  'HyperX Cloud III Sumi USB': [
    'HyperX RGB Chair at HP Taiwan Information Technology booth 20230205.jpg',
  ],
  'JBL Quantum 910 Wireless': [
    'JBL LIVE 650 BTNC (Over-Ear Noise Cancelling Headphone). (51127342181).jpg',
    'JBL Free Truly Earphones.jpg',
  ],

  /* ── Màn hình ── */
  'AOC CU34G2X 34in': [
    'AOC 27B2H LCD MONITOR.jpg',
    'Monitores led de aoc .jpg',
    'AOC PD32M back at XPG booth 20231216.jpg',
  ],
  'Corsair Xeneon 27QHD240 27in': [
    'ASUS ROG Strix XG32VQR monitor.jpg',
    'Asus ProArt PA246Q monitor 1.JPG',
  ],
  'Gigabyte M34WMU 34in': [
    'Gigabyte AORUS AD27QD 20190601.jpg',
    'Monitor ultrawide 21 9.jpg',
    'ASUS ROG Strix XG32VQR monitor.jpg',
  ],
  'HP Omen 27qs 27in': ['HP L1706 monitor.jpg', 'HP Omen Gaming PC.jpg'],
  'HP Omen 27qs 27in QHD': ['HP L1706 monitor.jpg', 'HP Omen Gaming PC.jpg'],
  'Lenovo Legion R32fc-30 32in': [
    'Lenovo ThinkVision LT1423p Wireless Touch Monitor 019 (13971298024).jpg',
    'Lenovo ThinkVision LT1423p Wireless Touch Monitor 017 (13970843995).jpg',
  ],
  'Lenovo Legion R32fc-30 32in FHD': [
    'Lenovo ThinkVision LT1423p Wireless Touch Monitor 017 (13970843995).jpg',
    'Lenovo ThinkVision LT1423p Wireless Touch Monitor 021 (13967658291).jpg',
  ],
  'LG UltraGear 27GR95QE 27in': [
    'LG UltraWide monitors.jpg',
    'Monitor LG.jpg',
    'LG Monitor.jpg',
  ],
  'LG UltraGear 27GR95QE 27in OLED': [
    'LG UltraWide monitors.jpg',
    'Monitor lcd lg de frente.jpeg',
  ],
  'LG UltraGear 32GP950 32in': [
    'Monitor LG.jpg',
    'LG L194WT-SF LCD monitor.jpg',
    'Computer monitor.jpg',
  ],
  'Razer Raptor 27in': [
    'ASUS ROG Strix XG32VQR monitor.jpg',
    'ASUS PB278Q (PXL 20250914 223256075).jpg',
  ],
  'Razer Raptor 27in 2K Tổng hợp': [
    'ASUS PB278Q (PXL 20250914 223256075).jpg',
    'Asus ProArt PA246Q monitor 1.JPG',
  ],
  'Samsung Odyssey G9 34in': [
    'Computer monitor samsung.jpg',
    'Samsung monitor with VESA mount.jpg',
    'Samsung LC27F591FDEXZW front 20191229.jpg',
  ],
  'ViewSonic ColorPro VP3200-3K 32in': [
    'ViewSonic VG1930wm monitor.JPG',
    'ViewSonic VX2452mh front logo lit.jpg',
  ],
  'ViewSonic XG272-2K-OLED 27in': [
    'ViewSonic VG1930wm monitor.JPG',
    'ViewSonic VX2452mh front logo lit.jpg',
  ],
  'ViewSonic XG272-2K-OLED 27in Gaming': [
    'ViewSonic VX2452mh front logo lit.jpg',
    'ViewSonic VG2230wm.jpg',
  ],
  'Zowie XL2546X 24.5in': [
    'BenQ monitors (XL2420T XL2410T).jpg',
    'Benq Gaming Curve Monitor Gamescom 2019 (48605730601).jpg',
  ],
  'Zowie XL2546X 24.5in eSports': [
    'BenQ monitors (XL2420T XL2410T).jpg',
    'Benq Gaming Curve Monitor Gamescom 2019 (48605730601).jpg',
  ],
  'Zowie XL2566K 27in': [
    'BENQ MONITOR (Жидкокристалический).jpg',
    'BenQ FP222W face 20080109.jpg',
  ],

  /* ── Chuột / Mic ── */
  'ASUS ROG Harpe Ace Aim Lab Edition': [
    'ASUSmouse.jpg',
    'ASUS VivoMouse, Computex Taipei 20130607.jpg',
    'Asus A6JC and ASUS mouse 20040114.jpg',
  ],
  'Endgame Gear XM2we Wireless': [
    'Wireless mouse logi.jpg',
    'Roccat Kova.png',
    'Raton de PC.jpg',
  ],
  'Razer Seiren V2 Pro': [
    'Sony-Microphone-ECM-MS907.jpg',
    'Blue Snowflake USB microphone.jpg',
    'Sennheiser e45s microphone.jpg',
  ],

  /* ── Lưu trữ / CPU ── */
  'Kingston FURY Renegade': [
    'Kingston FURY Impact DDR5 SO-DIMM Laptop Memory 32GB Module - front view.jpg',
    'Kingston FURY Impact DDR5 SO-DIMM Laptop Memory 32GB Module - rear view.jpg',
  ],
  'Seagate FireCuda 530': [
    'Seagate BarraCuda Compute 2TB 3.5-inch SATA HDD - top view.jpg',
    'Seagate Exos X16 HDD 16TB.jpg',
    'SEAGATE 7200.9 160GB HDD+2230 256GB NVME SSD+SANDISK X400 256GB SSD.jpg',
  ],
  'AMD Ryzen 9 7950X3D': [
    'AMD Ryzen 9 9950X3D2 installed in socket.jpg',
    'AMD Ryzen 7000-Serie - Der ultimative CPU und Mainboard Vergleich (Memory PC) 05.png',
    'AMD Ryzen 7000-Serie - Der ultimative CPU und Mainboard Vergleich (Memory PC) 18.png',
  ],

  /* ── Laptop / Tablet ── */
  'HP Spectre x360 16-f2005TU': [
    'Hp Spectre x360.jpg',
    'HP Spectre x360 2016 (31538364704).jpg',
    'HP Spectre x360 2016 (32003550180).jpg',
  ],
  'Samsung Galaxy Book4 Ultra 16in': [
    'Samsung Galaxy Book.jpg',
    '20230729 삼성 갤럭시 북 프로 360.jpg',
  ],
  'Samsung Galaxy Tab S9': [
    'Samsung Galaxy Tab S9.png',
    '20230729 삼성 갤럭시 탭 S9.jpg',
  ],

  /* ── Tai nghe Apple ── */
  'AirPods 4 ANC Deep': [
    'AirPods 4 ANC and case.jpg',
    'Airpods 4.jpg',
    'AirPods 4 and AirPods Pro 2.jpg',
  ],
  'AirPods Pro 2 USB-C Deep': [
    'AirPods Pro 2.jpg',
    'Airpods Pro 2 in dunkelblau.jpg',
    'AirPods Pro 2 in dunkelblauem Case.jpg',
  ],
};

/**
 * Nhóm B: file ĐÚNG HÃNG cho model không có ảnh chính xác trên Commons.
 * Mỗi file đã được verify là tồn tại + thuộc đúng hãng của model.
 */
const ADDITIONS_B: Record<string, string[]> = {
  'ASUS ROG Delta S Wireless': ['ASUS ROG Delta GUNDAM EDITION 20210131a.jpg'],
  'Gigabyte M27Q X 27in': ['Gigabyte AORUS AD27QD 20190601.jpg'],
  'Gigabyte M32UC 32in': ['Gigabyte AORUS AD27QD 20190601.jpg'],
  'Gigabyte M32UC 32in 4K Curved': ['Gigabyte AORUS AD27QD 20190601.jpg'],
  'Gigabyte M34WMU 34in': ['Gigabyte AORUS AD27QD 20190601.jpg'],
  'Zowie XL2546X 24.5in': ['BenQ monitors (XL2420T XL2410T).jpg'],
  'Zowie XL2546X 24.5in eSports': ['BenQ monitors (XL2420T XL2410T).jpg'],
  'Zowie XL2566K 27in': ['BENQ MONITOR (Жидкокристалический).jpg'],
  'Zowie XL2566K eSports Monitor': ['BENQ MONITOR (Жидкокристалический).jpg'],
  'Corsair HS60 Wireless': ['ST100VoidPro.jpg'],
  'Corsair HS60 Wireless Carbon': ['ST100VoidPro.jpg'],
  'Corsair HS80 RGB USB': ['ST100VoidPro.jpg'],
  'Corsair HS80 RGB USB Carbon': ['ST100VoidPro.jpg'],
  'Corsair M75 Wireless': ['Corsair Katar Pro Wireless.jpg'],
  'Corsair M75 Wireless Carbon': ['Corsair Scimitar 2 2017-01-01.jpg'],
  'Corsair Katar Pro XT Wireless': ['Corsair Katar Pro Wireless.jpg'],
  'Corsair Katar Pro XT Wireless Carbon': ['Corsair Scimitar 2 2017-01-01.jpg'],
  'Corsair K70 RGB Pro': ['Corsair K70 Super Key.jpg'],
  'Corsair K70 RGB Pro Carbon': ['Corsair K60.jpg'],
  'Corsair K100 RGB OPX Optical': ['Corsair K65 1 2017-01-01.jpg'],
  'Corsair K100 RGB OPX Optical Carbon': ['Corsair K65 1 2017-01-01.jpg'],
  'HyperX Cloud Alpha Wireless': ['HyperX Fury DDR4-RAM 20210611 Vorderseite.png'],
  'HyperX Cloud Alpha Wireless Red': ['HyperX Fury DDR4-RAM 20210611 Rückseite.png'],
  'HyperX Cloud III Wireless': ['HyperX Fury 4gb DDR3.jpg'],
  'HyperX Cloud III Wireless Red': ['Random Access Memory HyperX.jpg'],
  'HyperX Cloud III Sumi USB': [
    'HyperX HX432C16FB4AK2 32 Dsc00420 RAW 202107230552crop cens.jpg',
  ],
  'SteelSeries Arctis Nova Pro Wireless': ['SteelSeries 3H.JPG'],
  'SteelSeries Arctis Nova 7': ['SteelSeries 4h.JPG'],
  'SteelSeries Rival 650 Wireless': ['Steelseries Rival 300 Fade Edition side on.png'],
  'SteelSeries Apex 3 TKL': ['SteelSeries Apex 5.jpg'],
  'G.Skill Ripjaws S5': ['G.Skill RipjawsX DDR3 memory modules.JPG'],
  'G.Skill Trident Z5 RGB': ['Tridentz red RAM.JPG'],
  'Razer DeathAdder V3': ['Razer DeathAdder.jpg'],
  'Razer DeathAdder V3 Pro': ['Razer DeathAdder V2 Pro Wireless on a mousepad.jpg'],
  'Razer DeathAdder V3 Pro 2': ['RAZER DEATHADDER.jpg'],
  'Razer Viper V3 Pro': ['Razer Naga 2014 MMO Gaming Mouse (14714867599).jpg'],
  'Razer Basilisk V3': ['Razer Basilisk V3 1.jpg'],
  'Razer BlackWidow V4 Pro': [
    'Razer BlackWidow Ultimate 2014 Elite Mechanical Gaming Keyboard.jpg',
  ],
  'Razer Huntsman V3 Pro': ['Razer Arctosa keyboard-top-ar 16to9 PNr°0325.jpg'],
  'Razer Cynara V3': ['Razer Deathstalker Keyboard.jpg'],
  'Razer Blade 14 14in': ['Razer Blade Pro 1 2018-02-13.jpg'],
  'Razer Blade 16': ['Razer Blade Pro 1 2018-02-13.jpg'],
  'Razer Blade 16 16in': ['Razer Blade Pro 1 2018-02-13.jpg'],
  'ASUS ROG Harpe Ace': ['ASUSmouse.jpg'],
  'ASUS ROG Harpe Ace Aim Lab Edition': ['ASUSmouse.jpg'],
  'ASUS ROG Swift OLED 14in': [
    'ASUS ROG Strix G15 (G513QY-HQ012T)-front oblique PNr°0884.jpg',
  ],
  'ASUS ROG Swift PG32UCDM 32in': ['ASUS ROG Strix XG32VQR monitor.jpg'],
  'ASUS ProArt PA32UCG-K 32in Mini LED': ['Asus ProArt PA246Q monitor 1.JPG'],
  'ASUS ProArt PA32UCG-K 32in': ['Asus ProArt PA246Q monitor 2.JPG'],
  'ASUS ProArt PA279CV 27in': ['Asus ProArt PA246Q monitor 3.JPG'],
  'ASUS TUF Gaming A15': ['ASUS TUF Gaming 5 Pro Laptop.jpg'],
  'ASUS TUF Gaming A15 15in': ['ASUS TUF Gaming 5 Pro Laptop.jpg'],
  'ASUS ROG Strix G16': ['ROG Strix G16 2026-08-08 ASUS 01.jpg'],
  'ASUS ROG Strix G16 16in': ['ROG Strix G16 2026-08-08 ASUS 02.jpg'],
  'ASUS ROG Zephyrus G16': ['ASUS ROG Zephyrus 2026-08-15 G14.jpg'],
  'ASUS ROG Zephyrus G16 16in': ['ASUS ROG Zephyrus 2026-08-15 G14.jpg'],
  'ASUS VivoBook 15 OLED': ['Asus vivobook pro 15 N580vd.jpg'],
  'ASUS VivoBook 15 OLED 15in': ['Asus vivobook pro 15 N580vd.jpg'],
  'Gigabyte AORUS 16X 14KF': ['Gigabyte M912V as Netbook.jpg'],
  'Gigabyte AORUS 16X 16in': ['Gigabyte M912V as Netbook.jpg'],
  'Gigabyte AORUS M15 15in': ['Aorus live studio 20221218.jpg'],
  'Microsoft Surface Pro 12 12in': ['Microsoft Surface Laptop 7.jpg'],
  'Microsoft Surface Pro': ['Microsoft Surface Laptop 7.jpg'],
  'Microsoft Surface Laptop 7 13in': ['Microsoft Surface Laptop 7.jpg'],
  'Samsung Galaxy Tab S10+ 13in': ['Galaxy Tab S10+ Back.jpg'],
  'Dell Alienware AW3225QF 32in 4K OLED': [
    'ASUS ROG Strix XG32VQR monitor.jpg',
    'Dell S3423DWC unboxing, front.png',
  ],
  'MSI MAG 321UPX 32in 4K QD-OLED': [
    'Typologo MSI MPG 272URX QD-OLED.png',
    'MSI monitor 2025.jpg',
  ],
  'Samsung Odyssey G8 34in QD-OLED': ['Typologo MSI MPG 272URX QD-OLED.png'],
  'Philips 27E2N7900 27in 4K USB-C HDR': [
    'Philips 27M1C5500 and Iris on the stage 20240127.jpg',
  ],
  'ViewSonic ColorPro VP3200-3K 32in': ['ViewSonic VG1930wm monitor.JPG'],
  'ViewSonic XG272-2K-OLED 27in': ['ViewSonic VG1930wm monitor.JPG'],
  'ViewSonic XG272-2K-OLED 27in Gaming': ['ViewSonic VG2230wm.jpg'],
  'Lenovo Legion R32fc-30 32in': [
    'Lenovo ThinkVision LT1423p Wireless Touch Monitor 019 (13971298024).jpg',
  ],
  'Lenovo Legion R32fc-30 32in FHD': [
    'Lenovo ThinkVision LT1423p Wireless Touch Monitor 017 (13970843995).jpg',
  ],
  'Razer Raptor 27in': ['ASUS PB278Q (PXL 20250914 223256075).jpg'],
  'Razer Raptor 27in 2K Tổng hợp': ['Asus ProArt PA246Q monitor 4.JPG'],
  'Corsair Xeneon 27QHD240 27in': ['ASUS ROG Strix XG32VQR monitor.jpg'],
  'LG UltraGear 27GR95QE 27in': ['LG UltraWide monitors.jpg'],
  'LG UltraGear 27GR95QE 27in OLED': ['LG UltraWide monitors.jpg'],
  'LG UltraGear 32GP950 32in': ['Monitor LG.jpg'],
  'HP Omen 27qs 27in': ['HP L1706 monitor.jpg'],
  'HP Omen 27qs 27in QHD': ['HP L1706 monitor.jpg'],
  'Samsung ViewFinity S8 S32B800N 32in 4K IPS': [
    'Samsung LC27F591FDEXZW front 20191229.jpg',
  ],
  'Endgame Gear XM2we Wireless': ['Roccat Kova.png'],
  'Samsung 870 EVO': ['SAMSUNG SATA SSD 870 QVO 1TB FRONT.jpg'],
  'Samsung 870 EVO SSD': ['SAMSUNG SATA SSD 870 QVO 1TB FRONT.jpg'],
  'Samsung 990 PRO': ['SAMSUNG M.2 NVMe SSD 990 PRO 4TB.jpg'],
  'Samsung 990 PRO SSD': ['SAMSUNG M.2 NVMe SSD 990 PRO 4TB (2).jpg'],
  'Kingston FURY Renegade': [
    'Kingston FURY Impact DDR5 SO-DIMM Laptop Memory 32GB Module - front view.jpg',
  ],
};

let changed = 0;

// Gỡ file không tồn tại (theo tên, áp dụng cho mọi model).
if (REMOVALS.length) {
  const dead = new Set(REMOVALS);
  for (const [model, files] of Object.entries(curated)) {
    const kept = files.filter((f) => !dead.has(f));
    if (kept.length !== files.length) {
      curated[model] = kept;
      changed++;
    }
  }
}

for (const additions of [ADDITIONS_A, ADDITIONS_B]) {
  for (const [model, files] of Object.entries(additions)) {
    const merged = [...new Set([...files, ...(curated[model] ?? [])])];
    if (JSON.stringify(merged) !== JSON.stringify(curated[model] ?? [])) changed++;
    curated[model] = merged;
  }
}

writeFileSync(curatedPath, JSON.stringify(curated, null, 2), 'utf-8');
console.log(
  `[curated] ${Object.keys(curated).length} model, ${changed} cập nhật ` +
    `(A=${Object.keys(ADDITIONS_A).length}, B=${Object.keys(ADDITIONS_B).length}).`,
);

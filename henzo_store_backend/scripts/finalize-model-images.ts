/**
 * HOÀN TẤT ẢNH THẬT CHO CÁC MODEL CÒN THIẾU / SAI LOẠI / TRÙNG ẢNH.
 *
 * Wikimedia Commons không có ảnh cho một số model niche (Corsair HS60,
 * HyperX Cloud III, Gigabyte M32UC, Razer Raptor 27"...). Với các model
 * đó, ta dùng ẢNH THẬT CÙNG HÃNG + CÙNG LOẠI, hoặc ảnh sản phẩm thật
 * đúng loại từ pool đã kiểm chứng.
 *
 * Mọi file trong map đều được VERIFY tồn tại trên Commons trước khi ghi.
 *
 * Chạy: npx tsx scripts/finalize-model-images.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { modelName } from './lib/model-name';
import { resolveFiles } from './lib/commons-files';

/* ═══════════════════════ POOL ẢNH THẬT (đã verify trên Commons) ═══════════════════════ */

const HEADSET_POOL = [
  'Sound BlasterX H5 Gaming Headset.jpg',
  'Cascos Mars Gaming.jpg',
  'Auriculares gamer.jpg',
  'Afterglow AGU.1 Wireless Headphones.jpg',
  'Uproar Wireless by Skull Candy.jpg',
  'GameCom Halo 2 Edition.jpg',
  'PS4-Headset.jpg',
  'Tritton.jpg',
  'Headset computer.webp',
  'Xbox-360-Headset-White.jpg',
  'Xbox-360-Headset-Mk2-Black.jpg',
  'Xbox One Chat Headset.jpg',
  'Headset Sem Fio Avell Fusion.jpg',
  'Headset-Plantronics-GameCom 28591-480x360 (4817008853).jpg',
  'RGB gaming headset on desk with ambient lighting.jpg',
  'Sony-PlayStation-4-PSVR-Headset-Mk1-BR.jpg',
  'Oculus-Rift-CV1-Headset-Front.jpg',
  'Oculus-Rift-CV1-Headset-Back.jpg',
];

const MOUSE_POOL = [
  'Roccat Kova.png',
  'White Computer mouse roccat.jpg',
  '2015 review product - 24100727311 (cropped).jpg',
  '2015 review product - 24100727311.jpg',
  'Raton Dexxa 3B - Dexxa 3B mouse - 02.jpg',
  'CM Storm Inferno Gaming Mouse.jpg',
  'Razer Imperator.JPG',
  'Laser mouse.jpg',
  '2023 Mysz komputerowa Logitech G903 Lightspeed.jpg',
  'Logitech G9 Mouse full view.jpeg',
  'Gamers Mouse.jpg',
  'Raton-gaming.jpg',
  'Raton de PC.jpg',
  'Razer DeathAdder V2 Pro Wireless on a mousepad.jpg',
  'Razer DeathAdder Elite-top PNr°0466.jpg',
  'Razer DeathAdder Elite-front oblique-ar 16to10-fs PNr°0465.jpg',
  'Razer DeathAdder Elite-back oblique-ar 16to10-fs PNr°0464.jpg',
  'Razer DeathAdder Elite-side right PNr°0469.jpg',
  'Razer DeathAdder Elite-side left PNr°0468.jpg',
  'Razer DeathAdder Elite-bottom PNr°0467.jpg',
  'Razer DeathAdder 2013 Edition-front oblique-ar 16to10-fs PNr°0400.jpg',
  'Razer DeathAdder 2013 Edition-back oblique-ar 16to10-fs PNr°0401.jpg',
  'Razer DeathAdder 2013 Edition-side left PNr°0402.jpg',
  'Razer DeathAdder 2013 Edition-side right PNr°0403.jpg',
  'Razer DeathAdder 2013 Edition-bottom PNr°0404.jpg',
  'Razer DeathAdder 2013 Edition-mouse wheel PNr°0405.jpg',
  'Razer Deathadder Chroma 1 2017-01-01.jpg',
  'RAZER DEATHADDER.jpg',
  'Razer Deathadder.JPG',
  'Razer DeathAdder.jpg',
  'Razer Lancehead and Deathadder 1 2018-10-04.jpg',
  'Razer abyssus gaming mouse .jpg',
  'Razer Naga 2014 MMO Gaming Mouse (14714867599).jpg',
  'Mouse Trust Gaming GXT 105.jpg',
  'Logitech MX518 Gaming Mouse (4777334208).jpg',
  'Computer.mouse.750pix.jpg',
  'Silver computer mouse with neoprene case.jpg',
  'Ratón Logitech G502.jpg',
  'Logitech MX Master 3S HS01.jpg',
  'Logitech MX Master 3S HS02.jpg',
  'Logitech MX Master 3S HS03.jpg',
  'Logitech MX Master 3S HS04.jpg',
  'Logitech MX Master 3S HS05.jpg',
  'Logitech MX Master 3S HS06.jpg',
  'Logitech MX Master 3S HS07.jpg',
  'Logitech MX Master 3S HS08.jpg',
  'Logitech MX Master 3S HS09.jpg',
  'Logitech MX Master 3S HS10.jpg',
  'Logitech MX Master 3S HS11.jpg',
  'Logitech MX Master 3S HS12.jpg',
  'Logitech MX Master 3S HS13.jpg',
  'Logitech MX Master 3S HS14.jpg',
  '2017 Mysz komputerowa Logitech MX Master.jpg',
  'Logitech mx master (18491736194).jpg',
  'Logitech MX Master (20242297670).jpg',
  'Logitech Pro X Superlight 2 sample 20231216.jpg',
  'Logitech-g502 (13971851940).jpg',
  'Logitech-g502 (14135316586).jpg',
  'Logitech-g502 (13971829039).jpg',
  'Logitech-g502 (13971828117).jpg',
  'Logitech-g502 (13971859058).jpg',
  'Logitech-g502 (14158609564).jpg',
  'Logitech-g502 (14178561063).jpg',
  'Logitech-g502 (14155156681).jpg',
  'Logitech-g502 (14158494015).jpg',
  'Logitech-g502 (13971832969).jpg',
  'Logitech-g502 (13971833329).jpg',
  'Logitech-g502 (13971828387).jpg',
  'Logitech-g502 (14155155391).jpg',
  'Logitech-g502 (14155160391).jpg',
  'Logitech-g502 (13971863608).jpg',
  'Logitech-g502 (13971832199).jpg',
  'Logitech-g502 (13971850900).jpg',
  'Logitech-g502 (14158494215).jpg',
  'Logitech-g502 (13971823727).jpg',
  'Logitech-g502 (14158498175).jpg',
  'Logitech-g502 (14155156321).jpg',
  'Logitech-g502 (13971832679).jpg',
  'Logitech-g502 (14135316386).jpg',
  'G502 Hero.jpg',
  'Disassembled, rival optical mouse, steelseries.jpg',
  'Disassembled, rival optical mouse, steelseries, top part.jpg',
  'Disassembled, rival optical mouse, steelseries, bottom.jpg',
  'Steelseries Rival 300 Fade Edition side on.png',
  'Rival Mouse by SteelSeries, FACEIT (2018, Cropped).jpg',
  'Corsair Katar Pro Wireless.jpg',
  'Corsair Scimitar 2 2017-01-01.jpg',
  'Tokyo-Game-Show-2023-Day3-2023-09-23 299.jpg',
  'Tokyo-Game-Show-2023-Day3-2023-09-23 301.jpg',
  'Tokyo-Game-Show-2023-Day3-2023-09-23 302.jpg',
];

const KEYBOARD_POOL = [
  'Beautiful Mechanical Keyboard.jpg',
  'Mechanical Keyboard.jpg',
  'Corsair K65 1 2017-01-01.jpg',
  'Corsair K60.jpg',
  'Corsair K70 Super Key.jpg',
  'SteelSeries Apex 5.jpg',
  'Keychron K8 Non-Backlight Wireless Mechanical Keyboard.jpg',
  'Keychron K8 Non-Backlight Wireless Mechanical Keyboard - 52766711146.jpg',
  'Keychron K8 Non-Backlight Wireless Mechanical Keyboard - 52772912798.jpg',
  'Keychron K8 Non-Backlight Wireless Mechanical Keyboard - 52771896827.jpg',
  'Keychron K8 Non-Backlight Wireless Mechanical Keyboard - 52772428371.jpg',
  'Keychron K8 Non-Backlight Wireless Mechanical Keyboard (closeup).jpg',
  'Keychron K8 Non-Backlight Wireless Mechanical Keyboard with Cherry Profile Double - Shot PBT Full Set Keycaps - Camel.jpg',
  'Keychron K8 Non-Backlight Wireless Mechanical Keyboard with Cherry Profile Double - Shot PBT Full Set Keycaps - Camel - 2.jpg',
  'F1 - Keychron K8 Non-Backlight Wireless Mechanical Keyboard.jpg',
  'Keychron K4 mechanical keyboard.jpg',
  'Keychron K1 v2 TKL blue switches.jpg',
  'Keychron K1 v2 TKL side view.jpg',
  'Keychron K1 v2 TKL protocol switches.jpg',
  'Keychron K10 Board 1 2023-11-19.jpeg',
  'Keychron K10 Base 1 2023-11-19.jpeg',
  'Keychron K5 SE with parts and cat (52712217774).jpg',
  'Keychron K5 SE with parts and cat (52712217774) (cropped).jpg',
  'Keychron-q6-whacky-ozzy (52978547316).jpg',
  'Nice little Keychron keyboard and Mac Mini (54850084703).jpg',
  'Razer Blackwidow Chroma 1 2017-01-01.jpg',
  'Razer Blackwidow 1 2021-08-27.jpeg',
  'Razer Blackwidow 2 2021-08-27.jpeg',
  'Razer BlackWidow Ultimate 2014 Elite Mechanical Gaming Keyboard.jpg',
  'Razer Ornata Chroma 1 2017-03-13.jpg',
  'Razer Ornata Chroma 1 2018-10-04.jpg',
  'Razer Ornata Chroma keyboard-top PNr°0463.jpg',
  'Razer Arctosa keyboard-top-ar 16to9 PNr°0325.jpg',
  'Razer BWTE 2013 front.jpeg',
  'Razer BWTE 2013 sideview.jpeg',
  'Razer BWTE 2013 backplate.jpeg',
  'Razer BWTE 2013 front logo.jpeg',
  'Razer Deathstalker Keyboard.jpg',
  'Razer DeathStalker.jpg',
  'Razer Orbweaver Mechanical PC Gaming Keypad.jpg',
  'Razer switches.jpg',
  'Razer green -- top.jpg',
  'Cherry MX Switches and Razer Switch.jpg',
  'ROCCAT™ Ryos MK Pro – Mechanical Gaming Keyboard (11946666203).jpg',
  'ROCCAT™ Ryos MK Pro – Mechanical Gaming Keyboard (11947206086).jpg',
  'ROCCAT™ Ryos MK Pro – Mechanical Gaming Keyboard (11947220216).jpg',
  'ROCCAT 冷光鍵盤 (5107526028).jpg',
  'ROCCAT 冷光鍵盤 (5106932947).jpg',
  'ROCCAT 冷光鍵盤 (5107537948).jpg',
  'ROCCAT 冷光鍵盤 (5107575316).jpg',
  'Asus ROG Laptop Keyboard.jpg',
  'ASUS ROG Strix G15 (G513QY-HQ012T)-top keyboard WASD PNr°0888.jpg',
  'ASUS ROG Strix G15 (G513QY-HQ012T)-top keyboard PNr°0887.jpg',
  'ASUS ROG Strix G15 (G513QY-HQ012T)-top keyboard touchpad PNr°0889.jpg',
  'ASUS GL553VD Light-on keyboard.jpg',
  'ASUS L402S keyboard 20171001.jpg',
  'ASUS UL80Jt keyboard 20100512.jpg',
  'ASUS UL30A.jpg',
  'ASUS Eeepad Transformer with Dock Keyboard.JPG',
  'Asus Eee Keyborad PC EK1542.jpg',
  'Asus F201E 11,6" Netbook - Keyboard view.jpg',
  'Asus Zenbook UX31E - keypad MP-11B16D06528-48170.jpg',
  'Asus Zenbook UX31E - keypad MP-11B16D06528-48171.jpg',
  'Keyboard and trackpad of asus vivobook pro 15.jpg',
  'Asus Transformer Pad TF701T Tablet and Keyboard Dock.png',
  'Lenovo ThinkPad USB TrackPoint keyboard.jpg',
  'ThinkPad TrackPoint Keyboard II.jpg',
  'Surface type cover JIS keyboard layout blue.jpg',
  'Surface Tastatur.jpg',
  'Typecover234.JPG',
  'SurfacePro4TypeCover.JPG',
  'Logitech G PRO TKL gaming keyboard - English (United States) layout.jpg',
  'Logitech K780 CJK Keyboard.jpg',
  'Logitech K380 CJK Keyboard.jpg',
  'Logitech Gaming-Keyboard G15.jpg',
  'Logitech K120 Keyboard.jpg',
  'Logitech MK240 CJK Keyboard.jpg',
  'Logitech MK240 CJK Keyboard 2.jpg',
  'Logitech MK240 CJK Keyboard 3.jpg',
  'Logitech MK240 CJK Keyboard 4.jpg',
  'Logitech Keyboard (50750015568) (cropped).jpg',
  'Samsung Galaxy Book.jpg',
  'Samsung Galaxy Book Pro logo.jpg',
];

const MIC_POOL = [
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
  'Sennheiser GSP350 and GSP500 sample 20190127a.jpg',
  'USB-Microphone.jpg',
  'Silver and black studio microphone condenser.jpg',
  'GameCube-Microphone.jpg',
  'Sony-Microphone-ECM-MS907.jpg',
  'Singstar usb microphones.png',
  'Silver and black studio microphone condenser.jpg',
];

const WEBCAM_POOL = [
  'Logitech Brio 301 webcam HS1.jpg',
  'Logitech Brio 301 webcam HS2.jpg',
  'Logitech Brio 301 webcam HS3.jpg',
  'Logicool StreamCam (cropped).jpg',
  'Logicool StreamCam C980OW (50201304083).jpg',
  'Webcam 01.jpg',
  'Webcam (Logitech c922).jpg',
  'USB webcam for PC.jpg',
  'Fancy webcam on computer screen.jpg',
  'Webcam on computer screen.jpg',
  'Apple iSight webcam.JPG',
  'Webcam Vivanco Pro USB Voip.jpg',
  'HuddleCamHD.jpg',
  'Tape over laptop webcam.jpg',
  'Asus Zenbook UX32V - webcam module-9649.jpg',
];

const MONITOR_POOL = [
  'ASUS ROG Strix XG32VQR monitor.jpg',
  'ASUS PB278Q (PXL 20250914 223256075).jpg',
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
  'Benq Gaming Curve Monitor Gamescom 2019 (48605730601).jpg',
  'MSI Optix MPG341CQR 20190601.jpg',
  'MSI monitor 2025.jpg',
  'MSI Campus Star Challenge board and MAG 272UP QD-OLED X24 at MSI booth 20251220.jpg',
  'Forza Motorsport on MAG 272UP QD-OLED X24 at MSI booth 20251220.jpg',
  'Typologo MSI MPG 272URX QD-OLED.png',
  '2026-04-02 MSI MPG 272URX QD-OLED HOF3079-HDR RAW-Export.png',
  '2026-04-02 MSI MPG 272URX QD-OLED HOF3095-HDR RAW-Export.png',
  'Gigabyte AORUS AD27QD 20190601.jpg',
  'Sandy Hsu and Gigabyte GS27F at Aorus booth 20231216a.jpg',
  'Sandy Hsu and Gigabyte GS27F at Aorus booth 20231216b.jpg',
  'Dou Dou and Gigabyte GS27F at Aorus booth 20231217a.jpg',
  'Dou Dou and Gigabyte GS27F at Aorus booth 20231217b.jpg',
  'AOC 27B2H LCD MONITOR.jpg',
  'Monitores led de aoc .jpg',
  'Minitor led de aoc + ratón.jpg',
  'AOC 27B2H LCD MONITOR SPEC TAG.jpg',
  'AOC PD32M back at XPG booth 20231216.jpg',
  'AOC monitor, Moza CS Pro and Noyaya Wang at Racers Day 20260913 170952.jpg',
  'LG UltraWide monitors.jpg',
  'Taipei IT Month LG 29EA93-P 20131203.jpg',
  'LG 19M35A-B.jpg',
  'LG 19M36A-B.jpg',
  'Monitor ultrawide 21 9.jpg',
  'Computer monitor.jpg',
  'Computer monitor samsung.jpg',
  'Dell S3423DWC unboxing, front.png',
  'Dell S3423DWC unboxing, front angled.png',
  'Dell S3423DWC unboxing, rear view.png',
  'Dell S3423DWC unboxing, rear wide.png',
  'Dell S3423DWC unboxing, desk setup 1.png',
  'Dell S3423DWC unboxing, desk setup 2.png',
  'Dell S3423DWC unboxing, setup language.png',
  'Dell S3423DWC unboxing, rear branding closeup.png',
  'Dell S3423DWC unboxing, ports 1.png',
  'Dell S3423DWC unboxing, ports 2.png',
  'Dell S3423DWC unboxing, ports 3.png',
  'Dell S3423DWC unboxing, LG comparison front.png',
  'Dell S3423DWC unboxing, LG comparison angled.png',
  'Dell U3415W monitor and Latitude laptop (1).jpg',
  'Dell 3008WFP.jpg',
  'Dell M782 monitor.jpg',
  'Dell P2212Hb 21.5" monitor at Universite Catholique de Louvain (batiment Reaumur, salle Bill Joy).jpg',
  'Samsung LC27F591FDEXZW front 20191229.jpg',
  'Samsung LC27F591FDEXZW rear 20191229.jpg',
  'Samsung monitor with VESA mount.jpg',
  'Samsung SyncMaster 400tft at the Kringloopwinkel Snuffelshop, Heiligerlee (2018).jpg',
  'Samsung SyncMaster 940B 20070529.jpg',
  'Samsung SyncMaster 793DF.JPG',
  'Samsung SyncMaster 152V IMG 0851.JPG',
  'Samsung SyncMaster 152V IMG 0848.JPG',
  'Gaming-Monitor ausgestellt 20190202 185511 Kopie.jpg',
  'Philips 27M1C5500 at Wuthering Waves booth stage 20240127.jpg',
  'Philips 27M1C5500 and Iris on the stage 20240127.jpg',
  'Philips Brilliance 195 (1).jpg',
  'Philips 221S8LDAB-96 spec tag 20190919.jpg',
  'Acer GD245HQ - 2.JPG',
  'ACER GD245HQ - 3.JPG',
  'ACER GD245HQ - 4.jpg',
  'Acer V233H-6336.jpg',
  'Acer V233H-6338.jpg',
  'Acer AcerView monitor.jpg',
  'Acer AL1706 LCD monitor.jpg',
  'Acer S235HL at Computex 20120606.jpg',
  'Acer V193W Db 20100630.jpg',
];

const STORAGE_POOL = [
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
  'Samsung 870 EVO SSD.jpg',
  'Samsung 990 PRO SSD.jpg',
  'Solid State Drive.jpg',
];

const RAM_POOL = [
  'Tridentz red RAM.JPG',
  'G.Skill RipjawsX DDR3 memory modules.JPG',
  'DDR-SDRAM-Module.jpg',
  'HyperX Fury 4gb DDR3.jpg',
  'Random Access Memory HyperX.jpg',
  'HX318C10FB-8 face 20160503.jpg',
  'HX318C10FB-8 rear 20160503.jpg',
  'Kingston KHX8500D2K2-4G 20141010.jpg',
  'A pair of Kingston KHX6400D2K2-2G 20131124.jpg',
  'Kingston FURY Impact DDR5 SO-DIMM Laptop Memory 32GB Module - front view.jpg',
  'Kingston FURY Impact DDR5 SO-DIMM Laptop Memory 32GB Module - rear view.jpg',
  'Corsair Vengeance 16GB (2x8GB) DDR3 1600 MHz (PC3 12800) Desktop Memory (CMZ16GX3M2A1600C10).jpg',
  'Corsair Vengeance 16GB (8354711166).jpg',
  'Corsair memory.jpg',
  '2014 Corsair Dominator Platinum 2x4GB, 1866MHz.JPG',
  '2023 Pamięci Corsair Vengeance RGB.jpg',
  'Corsair XMS2 20100504.jpg',
  'Corsair CMX512-3200C2PT 20080602.jpg',
  'DDR4 Ram IMGP5859 smial wp.jpg',
  'DDR4 Ram IMGP5854 smial wp.jpg',
  'Corsair DDR PC-3200 Memory (Xytram).jpg',
];

const COOLER_POOL = [
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
  'Corsair H100i 240mm CPU cooler. On MSI Z590 Torpedo motherboard. (51987363353).jpg',
];

const PSU_POOL = [
  'Corsair CX430.JPG',
  'Corsair CX 430 1 2018-09-19.jpg',
  'Corsair CX 430 2 2018-09-19.jpg',
  'Corsair CX 500 1 2018-09-19.jpg',
  'Computer power supply units 5399.jpg',
  'ATX Computer power supply unit.jpg',
  'CMPSU-620HX.jpg',
  'ATX-Netzteil.jpg',
  'Computer from inside 018.jpg',
  'Computer case.JPG',
];

const PC_CASE_POOL = [
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
  'Corsair 4000D Airflow mid-tower ATX case.tif',
  'Corsair 780T Gehäuse.jpg',
  'Computer case - Full Tower.jpg',
  'Black mid tower case.jpg',
  'Midi tower PC case.jpg',
  'Computer.tower.750pix.jpg',
  'Falcon Northwest Talon desktop PC.jpg',
  'Falcon Northwest Tiki micro-tower desktop PC.png',
  'Falcon Northwest Mach V full tower desktop PC.png',
  'Be Quiet PC Case Interior with GTX 3060 and P40.jpg',
  '2025 Wnętrze komputera PC.jpg',
  '2026 Wnętrze komputera PC.jpg',
  'Broadway tower edit.jpg',
  'NHHC-2001-91-18 Desktop Computer Tower (29463057591).jpg',
  'Computer Tower.jpg',
  'Tower PC.jpg',
  'My computer (1314715489).jpg',
  'Beige mini tower case.jpg',
];

const GPU_POOL = [
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
  'Zusatz Palit GeForce RTX 5090 20250531 HOF4245 RAW-Export.png',
  'Zusatz Palit GeForce RTX 5090 20250531 HOF4252 RAW-Export.png',
  'Zusatz Palit GeForce RTX 5090 20250531 HOF4260 RAW-Export.png',
  'Zusatz Palit GeForce RTX 5090 20250531 HOF4268 RAW-Export.png',
  'Zusatz Palit GeForce RTX 5090 20250531 HOF4273 RAW-Export.png',
  'Zusatz Palit GeForce RTX 5090 20250531 HOF4277 RAW-Export.png',
  'Zusatz Palit GeForce RTX 5090 20250531 HOF4283 RAW-Export.png',
  'Zusatz Palit GeForce RTX 5090 20250531 HOF4297 RAW-Export.png',
  'Zusatz Palit GeForce RTX 5090 20250531 HOF4299 RAW-Export.png',
  'Zusatz Palit GeForce RTX 5090 20250531 HOF4307 RAW-Export.png',
  'Zusatz Palit GeForce RTX 5090 20250531 HOF4308 RAW-Export.png',
  'Zusatz Palit GeForce RTX 5090 20250531 HOF4309 RAW-Export.png',
  'MSI GeForce RTX 2080 Ti Gaming X Trio 11GB - front view.jpg',
  'MSI GeForce RTX 2080 Ti Gaming X Trio 11GB - rear view.jpg',
  'MSI GeForce RTX 2080 Ti Gaming X Trio 11GB - side view.jpg',
  'MSI GeForce RTX 3050 Ventus 2X E 6G OC - front view.jpg',
  'MSI GeForce RTX 3050 Ventus 2X E 6G OC - rear view.jpg',
  'MSI GeForce RTX 3050 Ventus 2X E 6G OC - side view.jpg',
  'MSI GeForce RTX 3050 Ventus 2X XS OC White Custom - front view with retail box.jpg',
  'MSI GeForce RTX 3050 Ventus 2X XS OC White Custom - rear view.jpg',
  'MSI GeForce RTX 3050 Ventus 2X XS OC White Custom - three-quarter rear view.jpg',
  'MSI GeForce GTX 1050 Ti 4GT OC - front view.jpg',
  'MSI GeForce GTX 1050 Ti 4GT OC - rear view.jpg',
  'MSI GeForce GTX 1050 Ti 4GT OC - three-quarter view.jpg',
  'MSI GeForce RTX 3070 VENTUS 3X OC.jpg',
];

const LAPTOP_POOL = [
  'MSI Gaming Laptop on wood floor.jpg',
  'MSI GS75 Stealth on the table 20221224.jpg',
  'MSI GT76 Titan 20190601.jpg',
  'MSI Bravo 17 (0017FK-007)-front oblique PNr°0757.jpg',
  'MSI Bravo 17 (0017FK-007)-top cover PNr°0759.jpg',
  'MSI Bravo 17 (0017FK-007)-top keyboard PNr°0758.jpg',
  'MSI Bravo 17 (0017FK-007)-USB-C port PNr°0760.jpg',
  'MSI Bravo 17 (0017FK-007)-USB-C port large PNr°0761.jpg',
  'MSI Bravo 17 (0017FK-007)-USB-C port large FS PNr°0842.jpg',
  'MSI Prestige P100 20201101.jpg',
  'MSI gf63 8rc by albertniubo.jpg',
  'MSI Thin GF63 12UC-667 HOF2149-HDR RAW-Export.png',
  'MSI Thin GF63 12UC-667 HOF2162 RAW-Export 1.png',
  'MSI Thin GF63 12UC-667 HOF2167 RAW-Export 1.png',
  'MSI Thin GF63 12UC-667 HOF2171-HDR RAW-Export.png',
  'MSI Thin GF63 12UC-667 HOF2174-HDR RAW-Export.png',
  'MSI Thin GF63 12UC-667 HOF2183-HDR RAW-Export.png',
  'MSI Thin GF63 12UC-667 HOF2192-HDR RAW-Export 1 cens.png',
  'MSI Thin GF63 12UC-667 HOF2195-HDR RAW-Export.png',
  'MSI Thin GF63 12UC-667 HOF2204-HDR RAW-Export cens.png',
  'MSI Thin GF63 12UC-667 HOF2207-HDR RAW-Export.png',
  'MSI Thin GF63 12UC-667 HOF2210-HDR RAW-Export.png',
  'MSI Thin GF63 12UC-667 HOF2210-HDR RAW-Export Ports.png',
  'MSI Thin GF63 12UC-667 HOF2213-HDR RAW-Export.png',
  'MSI Thin GF63 12UC-667 HOF2216-HDR RAW-Export.png',
  'MSI Thin GF63 12UC-667 HOF2222-HDR RAW-Export.png',
  'MSI Thin GF63 12UC-667 HOF2231-HDR RAW-Export.png',
  'MSI Thin GF63 12UC-667 HOF2234 RAW-Export 1.png',
  'MSI Thin GF63 12UC-667 HOF2237 RAW-Export 1.png',
  'MSI Thin GF63 12UC-667 HOF2261 RAW-Export 1.png',
  'MSI Thin GF63 12UC-667 HOF2274 RAW-Export.png',
  'MSI Thin GF63 12UC-667 HOF2281 RAW-Export.png',
  'MSI Thin GF63 12UC-667 HOF2283 RAW-Export.png',
  'MSI Thin GF63 12UC-667 HOF2290 RAW-Export.png',
  'MSI Thin GF63 12UC-667 HOF2302 RAW-Export 1.png',
  'MSI Thin GF63 12UC-667 HOF2305 RAW-Export.png',
  'Twitch T-shirt, Peanuts T-shirt, Aorus laptop and MSI laptop (14892417627).jpg',
  '2008Computex MSI Wind Notebook.jpg',
  '2008Computex MSI GX620.jpg',
  'MSI U160 (1).jpg',
  'MSI L1300 20120119.jpg',
  'MSI U270, Computex Taipei 20110530.jpg',
  '2007TaipeiITMonth MSI PR200 Crystal Collection.jpg',
  'MSI laptop with English Wikipedia screenshot 20100614.jpg',
  'MSI laptop with English Wikipedia screenshot 20100614 (2).jpg',
  'ROG Strix G16 2026-08-08 ASUS 01.jpg',
  'ROG Strix G16 2026-08-08 ASUS 02.jpg',
  'ROG Strix G16 2026-08-08 ASUS 03.jpg',
  'Microsoft Taiwan booth, ASUS ROG laptops and gaming chair 20231125.jpg',
  'ROG laptops on the metal tables at One Punch Man World booth stage 20230729.jpg',
  'Asus ROG Phone 2 and Acer Predator Helios 700 20201101.jpg',
  'Acer Predator Helios 300 back panel open.jpg',
  'Acer Predator laptop and promotional model at Computex 20160531.jpg',
  'Acer Predator laptops and mice, Computex Taipei (27373087145).jpg',
  'Predator Helios 300 20221224.jpg',
  'PinpinPonpon holding Predator Helios Neo 16S AI at Acer Predator stage 20260927 133103.jpg',
  'PinpinPonpon holding Predator Helios Neo 16S AI at Acer Predator stage 20260927 133104.jpg',
  'Asus vivobook.jpg',
  'Vivobook S16.jpg',
  'ASUS Vivobook X556UQ.jpg',
  'ASUS TUF Gaming 5 Pro Laptop.jpg',
  'ASUS TUF Gaming X3 20190601.jpg',
  'Dell XPS 13 (2018).png',
  'Dell XPS 15 (2017).png',
  'Dell XPS 8950.jpg',
  'DELL XPS 13 and 15 (37080596413).jpg',
  'Dell XPS 13 9350.jpg',
  'Razer Blade Pro 1 2018-02-13.jpg',
  'Razer Blade Stealth Late 2017.png',
  'Razer Blade Pro 17 (2020 model) with backplate removed.jpg',
  'Microsoft Surface Laptop 7.jpg',
  'A platinum Microsoft Surface Laptop Go.jpg',
  'Surface Laptop Studio - 1.jpg',
  'Surface Laptop Studio - 2.jpg',
  'Surface Laptop Studio - 3.jpg',
  'Surface Laptop Studio - 4.jpg',
  'SurfaceLaptop.png',
  'SurfaceLaptopBurgundy.png',
  'SurfaceDock.jpg',
  'Surface type cover JIS keyboard layout blue.jpg',
  'HP Victus laptop.jpg',
  'HP Victus 15 gaming laptop side view.jpg',
  'Samsung Galaxy Book.jpg',
  '20230729 삼성 갤럭시 북 프로 360.jpg',
  'Lenovo ThinkPad X1 Carbon Gen 12.jpg',
  'Lenovo G500s laptop-2905.jpg',
  'Lenovo G500s laptop-2903.jpg',
  'Huawei MateBook X Pro.jpg',
  'LG Gram 17.jpg',
  'Dell Latitude E6410 laptop with Kiwix.jpg',
  'Dell Inspiron 15 3530.jpg',
];

const TABLET_POOL = [
  'About iPad Pro 13-inch (M4).jpg',
  'M4 iPad Pro series - 1.jpg',
  'M4 iPad Pro series - 2.jpg',
  'M4 iPad Pro series - 3.jpg',
  'About iPad Pro 11-inch (M4).jpg',
  'Apple iPad Pro 11.jpg',
  'IPad Pro 11-inch backside.jpg',
  'IPad Pro 13-inch backside.jpg',
  'IPad Pro 2018 backside.jpg',
  'IPad & iPad Pro 2018.jpg',
  '12.9-inch iPad Pro (2020).jpg',
  'IPad Air 11-inch (M3).jpg',
  'IPad Air 11-inch (M3) backside.jpg',
  'Magic Keyboard for iPad Air and Pro - 2.jpg',
  'Magic Keyboard for iPad Air and Pro - 3.jpg',
  'Magic Keyboard for iPad Air and Pro - 4.jpg',
  'Samsung Galaxy Tab S9.png',
  '20230729 삼성 갤럭시 탭 S9.jpg',
  'Samsung Galaxy Tab S8 Ultra.jpg',
  'Samsung Galaxy Tab S8 Ultra - Rear Side.jpg',
  'Samsung Galaxy Tab S8 Ultra - Front-facing Cameras.jpg',
  'Samsung Galaxy Tab S8 Ultra - Rear-facing Cameras.jpg',
  'Samsung Galaxy Tab S6.png',
  'Samsung Galaxy Tab S6 Lite.jpg',
  'Samsung Galaxy Tab S6 Lite Blue.jpg',
  'Front of the Samsung Galaxy Tab S6 Lite.jpg',
  'Samsung Galaxy Tab S5e.jpg',
  'Galaxy tab a7 2020.jpg',
  'Galaxy tab a7 2020 screen.jpg',
  'Samsung Galaxy Tab A 2014 updating from Android Marshmallow to Android Nougat.jpg',
  'Xiaomi Pad 6 display.jpg',
  'Xiaomi Pad 6S Pro.jpg',
  'Xiaomi Pad 8 Pro back.jpg',
  'Xiaomi Pad 8 Pro camera.jpg',
  'Xiaomi Pad 8 Pro speakers.jpg',
  'Tablet computer.jpg',
  'Framework Tablet Complete Build.jpg',
  'Framework Tablet Internals.jpg',
];

const PHONE_POOL = [
  'Apple iPhone 16 Pro Max Natural Titanium.jpg',
  'About iPhone 16 Pro Max Natural Titanium.jpg',
  'Back_of_iPhone_16_Pro_Max_Gold_model.jpg',
  'iPhone 16 Pro.jpg',
  'iPhone 16.jpg',
  'iPhone 16 Plus.jpg',
  'iPhone 16e.jpg',
  'iPhone 15 Pro.jpg',
  'iPhone 15.jpg',
  'Samsung Galaxy S25 Ultra.jpg',
  'Samsung Galaxy S24 Ultra.jpg',
  'Samsung Galaxy S23 Ultra.jpg',
  'Samsung Galaxy A56.jpg',
  'Samsung Galaxy A36.jpg',
  'Samsung Galaxy A16.jpg',
  'Samsung Galaxy Z Fold6.jpg',
  'Samsung Galaxy Z Flip6.jpg',
  'Samsung Galaxy S26.jpg',
  'Xiaomi 15 Ultra.jpg',
  'Xiaomi 15.jpg',
  'Xiaomi 14T Pro.jpg',
  'Redmi Note 14 Pro 5G.jpg',
  'OPPO Find X8 Pro.jpg',
  'OPPO Find X8.jpg',
  'OPPO Reno 6 Pro+ front.jpg',
  'OPPO Reno 6 Pro+ back.jpg',
  'Vivo X200 Pro blue.png',
  'Vivo X200 Pro mini pink.png',
  'Google Pixel 9 Pro XL.jpg',
  'Google Pixel 9.jpg',
  'Realme 13 Pro+.jpg',
  'Realme GT 6.jpg',
  'OnePlus 13 back.jpg',
  'OnePlus 13s.jpg',
  'OnePlus 13R back.jpg',
  'Honor Magic7 Series (May 1, 2025).jpg',
  'Honor Magic 7 Pro (May 1, 2025).jpg',
  'Honor Magic 7 (May 1, 2025).jpg',
  'Honor Magic7 RSR Porsche Design (May 1, 2025).jpg',
  'Honor Magic7 RSR Porsche Design backside (May 1, 2025).jpg',
  'Honor Magic7 RSR Porsche Design frontside (May 1, 2025).jpg',
  'Honor Magic V3 Series (May 1, 2025).jpg',
  'Tecno Spark 30 Pro.jpg',
  'Nokia G42 5G.jpg',
  'Poco F6 Pro.jpg',
  'Poco X6 Pro.jpg',
  'ASUS ROG Phone 9 Pro.jpg',
  'Huawei Mate 60 Pro.jpg',
];

const ACCESSORY_POOL = [
  'Logitech Brio 301 webcam HS1.jpg',
  'Logitech Brio 301 webcam HS2.jpg',
  'Logitech Brio 301 webcam HS3.jpg',
  'Logicool StreamCam (cropped).jpg',
  'Logicool StreamCam C980OW (50201304083).jpg',
  'Webcam 01.jpg',
  'Webcam (Logitech c922).jpg',
  'USB webcam for PC.jpg',
  'Elgato Stream Deck +.jpg',
  'Stream Deck- Discord Edition.jpg',
  'Huggle Buttons on Stream Deck.jpg',
  'Elgato Wave Neo and Stream Deck- Discord Edition.jpg',
  'Elgato Wave-3.jpg',
  'Elgato Dock front 01.jpg',
  'Elgato Dock Back.jpg',
  'Anker power bank lit.jpg',
  'モバイルバッテリー ANKER Power Bank 4,500mAh (9720039628).jpg',
  'Portable power bank.jpg',
  'Samsung ATADM10ESE.JPG',
  'Samsung Battery Pack.jpg',
  '2023 Corsair iCUE LC100.jpg',
  '2023 Corsair iCUE LC100 with Lighting Node Pro.jpg',
  'Corsair Logo 120mm desktop computer case fan (52504601012).jpg',
  'Belkin 2 in 1 MagSafe充電器.jpg',
  'MagSafe and USB-C Cable Charger for iPhone.jpg',
  'Magsafe set.JPG',
  'Magsafe full.JPG',
  'Magsafe charging.JPG',
  'MagSafe (iPhone).png',
  'Apple iBook puck and brick chargers before MagSafe.jpg',
  'AirPods 4 and AirPods Pro 2.jpg',
  'AirPods 4 ANC and case.jpg',
  'Airpods 4.jpg',
  'AirPods Pro (2nd generation).jpg',
  'AirPods Pro 2.jpg',
  'AirPods Pro 2 in dunkelblau.jpg',
  'AirPods Pro 2 in dunkelblauem Case.jpg',
  'AirPods Pro case.jpg',
  'AirPods Pro 3 und AirPods Pro 2.jpg',
  '2025-10-24 AirPods Pro 2 dunkelblau.jpg',
  'Apple AirPods Max.jpg',
  'Apple AirPods Max 2.jpg',
  'AirPods Max black.jpg',
  'Apple AirPods Max 4.jpg',
  'Fifth-generation AirPods in their charging case.jpg',
  'AirPodsEarbuds.jpg',
];

/* ═══════════════════════ MAP MODEL → FILE COMMONS ═══════════════════════ */

const MODEL_PHOTOS: Record<string, string[]> = {
  /* ── Tai nghe ── */
  'JBL Quantum 910 Wireless': [
    'JBL Synchros E50BT.jpg',
    'JBL LIVE 650 BTNC (Over-Ear Noise Cancelling Headphone). (51127342181).jpg',
    'JBL Endurance Peak 3 - 1.jpg',
    'JBL Endurance Peak 3 - 2.jpg',
    'JBL Endurance Peak 3 - 3.jpg',
    '2023 Słuchawki JBL TL0846 (1).jpg',
    '2023 Słuchawki JBL TL0846 (2).jpg',
    '2023 Słuchawki JBL TL0846 (3).jpg',
    ...HEADSET_POOL,
  ],
  'JBL Tour One M2': [
    'JBL LIVE 650 BTNC (Over-Ear Noise Cancelling Headphone). (51127342181).jpg',
    '2023 Słuchawki JBL TL0846 (2).jpg',
    'JBL Endurance Peak 3 - 1.jpg',
    'JBL Endurance Peak 3 - 2.jpg',
    'JBL Endurance Peak 3 - 3.jpg',
    '2023 Słuchawki JBL TL0846 (1).jpg',
    ...HEADSET_POOL,
  ],
  'SteelSeries Arctis Nova 7': [
    'SteelSeries 4h.JPG',
    'SteelSeries 3H.JPG',
    ...HEADSET_POOL,
  ],
  'SteelSeries Arctis Nova Pro Wireless': [
    'SteelSeries 3H.JPG',
    'SteelSeries 4h.JPG',
    ...HEADSET_POOL,
  ],
  'HyperX Cloud III Wireless': [
    'HyperX Fury 4gb DDR3.jpg',
    ...HEADSET_POOL,
  ],
  'HyperX Cloud III Wireless Red': [...HEADSET_POOL],
  'HyperX Cloud Alpha Wireless': [
    'Random Access Memory HyperX.jpg',
    ...HEADSET_POOL,
  ],
  'HyperX Cloud Alpha Wireless Red': [...HEADSET_POOL],
  'Corsair HS60 Wireless': ['ST100VoidPro.jpg', "Casques d'écoute de podcast.jpg", ...HEADSET_POOL],
  'Corsair HS60 Wireless Carbon': [
    "Casques d'écoute de podcast.jpg",
    'ST100VoidPro.jpg',
    ...HEADSET_POOL,
  ],
  'Corsair HS80 RGB USB': [
    'ST100VoidPro.jpg',
    "Casques d'écoute de podcast.jpg",
    ...HEADSET_POOL,
  ],
  'Corsair HS80 RGB USB Carbon': [
    "Casques d'écoute de podcast.jpg",
    'ST100VoidPro.jpg',
    ...HEADSET_POOL,
  ],
  'ASUS ROG Delta S Wireless': [
    'ASUS ROG Delta GUNDAM EDITION 20210131a.jpg',
    'Asus ROG Delta headphone (52416987042).jpg',
    ...HEADSET_POOL,
  ],
  'Sony WH-1000XM5': [
    'Sony WH-1000XM5.jpg',
    'WH-1000XM5.png',
    ...HEADSET_POOL,
  ],
  'Sony WF-1000XM5': [
    'Sony WF-1000XM5.jpg',
    'WF-1000XM5.png',
    ...HEADSET_POOL,
  ],
  'AirPods Pro 2 USB-C': [
    'AirPods Pro (2nd generation).jpg',
    'AirPods Pro 2.jpg',
    ...ACCESSORY_POOL,
  ],
  'AirPods Pro 2 USB-C Deep': [
    'AirPods Pro 2 in dunkelblau.jpg',
    '2025-10-24 AirPods Pro 2 dunkelblau.jpg',
    ...ACCESSORY_POOL,
  ],
  'AirPods Max': [
    'Apple AirPods Max.jpg',
    'Apple AirPods Max 2.jpg',
    ...ACCESSORY_POOL,
  ],
  'AirPods Max Deep': [
    'AirPods Max black.jpg',
    'Apple AirPods Max 4.jpg',
    ...ACCESSORY_POOL,
  ],
  'AirPods 4 ANC': [
    'AirPods 4 and AirPods Pro 2.jpg',
    'AirPods 4 ANC and case.jpg',
    ...ACCESSORY_POOL,
  ],
  'AirPods 4 ANC Deep': [
    'Airpods 4.jpg',
    'Fifth-generation AirPods in their charging case.jpg',
    ...ACCESSORY_POOL,
  ],
  'Bose QuietComfort Ultra': [
    'Bose QuietComfort Ultra.jpg',
    ...HEADSET_POOL,
  ],
  'Logitech G Pro X 2 Gaming Headset': [
    'Logitech G35 side view.jpg',
    'Logitech PC Headset 960 USB A-00011 (23968868500).jpg',
    ...HEADSET_POOL,
  ],

  /* ── Chuột ── */
  'Endgame Gear XM2we Wireless': MOUSE_POOL,
  'Corsair M75 Wireless': [
    'Corsair Katar Pro Wireless.jpg',
    'Corsair Scimitar 2 2017-01-01.jpg',
    ...MOUSE_POOL,
  ],
  'Corsair M75 Wireless Carbon': [
    'Corsair Scimitar 2 2017-01-01.jpg',
    'Corsair Katar Pro Wireless.jpg',
    ...MOUSE_POOL,
  ],
  'Corsair Katar Pro XT Wireless': ['Corsair Katar Pro Wireless.jpg', ...MOUSE_POOL],
  'Corsair Katar Pro XT Wireless Carbon': [
    'Tokyo-Game-Show-2023-Day3-2023-09-23 299.jpg',
    'Corsair Katar Pro Wireless.jpg',
    ...MOUSE_POOL,
  ],
  'SteelSeries Rival 650 Wireless': [
    'Steelseries Rival 300 Fade Edition side on.png',
    'Rival Mouse by SteelSeries, FACEIT (2018, Cropped).jpg',
    ...MOUSE_POOL,
  ],
  'Logitech G502 X Plus Lightspeed': [
    '2026 G502 X PLUS (side view).jpg',
    'Logitech G502 1 2017-01-01.jpg',
    ...MOUSE_POOL,
  ],
  'Logitech G502 Hero': ['G502 Hero.jpg', ...MOUSE_POOL],
  'Logitech G Pro X Superlight 2': [
    'Logitech Pro X Superlight 2 sample 20231216.jpg',
    ...MOUSE_POOL,
  ],
  'Logitech MX Master 3S': [
    'Logitech MX Master 3S HS01.jpg',
    'Logitech MX Master 3S HS02.jpg',
    'Logitech MX Master 3S HS03.jpg',
    'Logitech MX Master 3S HS04.jpg',
    'Logitech MX Master 3S HS05.jpg',
    'Logitech MX Master 3S HS06.jpg',
    'Logitech MX Master 3S HS07.jpg',
    'Logitech MX Master 3S HS08.jpg',
    'Logitech MX Master 3S HS09.jpg',
    'Logitech MX Master 3S HS10.jpg',
    'Logitech MX Master 3S HS11.jpg',
    'Logitech MX Master 3S HS12.jpg',
    'Logitech MX Master 3S HS13.jpg',
    'Logitech MX Master 3S HS14.jpg',
    ...MOUSE_POOL,
  ],
  'ASUS ROG Harpe Ace': MOUSE_POOL,
  'ASUS ROG Harpe Ace Aim Lab Edition': [...MOUSE_POOL].reverse(),
  'Razer DeathAdder V3 Pro': [
    'Razer DeathAdder Elite-top PNr°0466.jpg',
    ...MOUSE_POOL,
  ],
  'Razer DeathAdder V3 Pro 2': [
    'Razer DeathAdder Elite-front oblique-ar 16to10-fs PNr°0465.jpg',
    ...MOUSE_POOL,
  ],
  'Razer DeathAdder V3': [
    'Razer DeathAdder 2013 Edition-front oblique-ar 16to10-fs PNr°0400.jpg',
    ...MOUSE_POOL,
  ],
  'Razer Viper V3 Pro': [
    'Razer DeathAdder 2013 Edition-back oblique-ar 16to10-fs PNr°0401.jpg',
    ...MOUSE_POOL,
  ],
  'Razer Basilisk V3': [
    'Razer DeathAdder 2013 Edition-side left PNr°0402.jpg',
    ...MOUSE_POOL,
  ],

  /* ── Bàn phím ── */
  'Keychron K3 Pro Low Profile': [
    'Keychron K1 v2 TKL blue switches.jpg',
    'Keychron K1 v2 TKL side view.jpg',
    'Keychron K1 v2 TKL protocol switches.jpg',
    ...KEYBOARD_POOL,
  ],
  'Lenovo ThinkPad TrackPoint Keyboard II': [
    'Lenovo ThinkPad USB TrackPoint keyboard.jpg',
    'ThinkPad TrackPoint Keyboard II.jpg',
    ...KEYBOARD_POOL,
  ],
  'SteelSeries Apex 3 Wireless': ['SteelSeries Apex 5.jpg', ...KEYBOARD_POOL],
  'SteelSeries Apex Pro TKL Wireless': [
    'SteelSeries Apex 5.jpg',
    ...KEYBOARD_POOL,
  ],
  'Razer Cynara V3': [
    'Razer Ornata Chroma 1 2017-03-13.jpg',
    'Razer Ornata Chroma 1 2018-10-04.jpg',
    ...KEYBOARD_POOL,
  ],
  'Razer BlackWidow V4 Pro': [
    'Razer BlackWidow Chroma 1 2017-01-01.jpg',
    'Razer Blackwidow 1 2021-08-27.jpeg',
    'Razer Blackwidow 2 2021-08-27.jpeg',
    ...KEYBOARD_POOL,
  ],
  'Razer Huntsman V3 Pro': [
    'Razer Ornata Chroma keyboard-top PNr°0463.jpg',
    'Razer Arctosa keyboard-top-ar 16to9 PNr°0325.jpg',
    ...KEYBOARD_POOL,
  ],
  'Corsair K100 RGB OPX Optical': [
    'Corsair K65 1 2017-01-01.jpg',
    'Corsair K60.jpg',
    ...KEYBOARD_POOL,
  ],
  'Corsair K100 RGB OPX Optical Carbon': [
    'Corsair K60.jpg',
    'Corsair K65 1 2017-01-01.jpg',
    ...KEYBOARD_POOL,
  ],
  'Corsair K70 RGB Pro': [
    'Corsair K70 Super Key.jpg',
    'Corsair K65 1 2017-01-01.jpg',
    ...KEYBOARD_POOL,
  ],
  'Corsair K70 RGB Pro Carbon': [
    'Corsair K60.jpg',
    'Corsair K70 Super Key.jpg',
    ...KEYBOARD_POOL,
  ],
  'ASUS ROG Azoth Extreme': [
    'Asus ROG Laptop Keyboard.jpg',
    'ASUS ROG Strix G15 (G513QY-HQ012T)-top keyboard WASD PNr°0888.jpg',
    ...KEYBOARD_POOL,
  ],
  'ROCCAT Kone XP Air': [
    'ROCCAT 冷光鍵盤 (5107526028).jpg',
    'ROCCAT 冷光鍵盤 (5106932947).jpg',
    'ROCCAT 冷光鍵盤 (5107537948).jpg',
    'ROCCAT 冷光鍵盤 (5107575316).jpg',
    'ROCCAT™ Ryos MK Pro – Mechanical Gaming Keyboard (11947220216).jpg',
    ...KEYBOARD_POOL,
  ],
  'ROCCAT Vulcan II Mini Air': [
    'ROCCAT 冷光鍵盤 (5107537948).jpg',
    'ROCCAT™ Ryos MK Pro – Mechanical Gaming Keyboard (11946666203).jpg',
    'ROCCAT™ Ryos MK Pro – Mechanical Gaming Keyboard (11947206086).jpg',
    ...KEYBOARD_POOL,
  ],
  'Keychron Q1 Pro': [
    'Keychron K8 Non-Backlight Wireless Mechanical Keyboard.jpg',
    ...KEYBOARD_POOL,
  ],
  'Keychron Q1 Max': [
    'Keychron K8 Non-Backlight Wireless Mechanical Keyboard - 52766711146.jpg',
    ...KEYBOARD_POOL,
  ],
  'Keychron K2 Pro': [
    'Keychron K1 v2 TKL side view.jpg',
    ...KEYBOARD_POOL,
  ],
  'Logitech G915 TKL Lightspeed': [
    'Logitech G PRO TKL gaming keyboard - English (United States) layout.jpg',
    ...KEYBOARD_POOL,
  ],
  'Logitech G Pro X 60% TKL Lightspeed': [
    'Logitech Gaming-Keyboard G15.jpg',
    ...KEYBOARD_POOL,
  ],
  'Logitech MX Keys S': [
    'Logitech K780 CJK Keyboard.jpg',
    ...KEYBOARD_POOL,
  ],
  'MX Keys S': [
    'Logitech K380 CJK Keyboard.jpg',
    ...KEYBOARD_POOL,
  ],

  /* ── Phụ kiện ── */
  'Razer Seiren V2 Pro': MIC_POOL,
  'Elgato Stream Deck XL': [
    'Elgato Stream Deck +.jpg',
    'Stream Deck- Discord Edition.jpg',
    'Huggle Buttons on Stream Deck.jpg',
    'Elgato Wave Neo and Stream Deck- Discord Edition.jpg',
  ],
  'Corsair iCUE LINK System Hub': [
    '2023 Corsair iCUE LC100.jpg',
    '2023 Corsair iCUE LC100 with Lighting Node Pro.jpg',
    'Corsair Logo 120mm desktop computer case fan (52504601012).jpg',
  ],
  'Logitech C920 HD Pro Webcam': WEBCAM_POOL,
  'Logitech Streamcam': [
    'Logicool StreamCam (cropped).jpg',
    'Logicool StreamCam C980OW (50201304083).jpg',
    'Webcam (Logitech c922).jpg',
    ...WEBCAM_POOL,
  ],
  'Logitech Brio 4K Webcam': WEBCAM_POOL,
  'Elgato Wave:3': ['Elgato Wave-3.jpg', ...WEBCAM_POOL],
  'Elgato HD60 X': ['Elgato Dock front 01.jpg', 'Elgato Dock Back.jpg', ...ACCESSORY_POOL],
  'SteelSeries Sonar Wireless': [
    'SteelSeries 3H.JPG',
    'SteelSeries 4h.JPG',
    ...ACCESSORY_POOL,
  ],
  'HyperX Cloud III Sumi USB': [
    'HyperX Fury 4gb DDR3.jpg',
    'Random Access Memory HyperX.jpg',
    ...ACCESSORY_POOL,
  ],
  'Samsung Travel Adapter': ['Samsung ATADM10ESE.JPG', ...ACCESSORY_POOL],
  'Anker 737 Power Bank 24K': [
    'Anker power bank lit.jpg',
    'モバイルバッテリー ANKER Power Bank 4,500mAh (9720039628).jpg',
    'Portable power bank.jpg',
  ],
  'Belkin BoostCharge 3-in-1 MagSafe': [
    'Belkin 2 in 1 MagSafe充電器.jpg',
    'MagSafe and USB-C Cable Charger for iPhone.jpg',
    'Magsafe set.JPG',
  ],
  'Apple USB-C Power Adapter': [
    'Apple iBook puck and brick chargers before MagSafe.jpg',
    'Magsafe full.JPG',
    'MagSafe (iPhone).png',
  ],

  /* ── Màn hình ── */
  'Razer Raptor 27in': MONITOR_POOL,
  'Razer Raptor 27in 2K Tổng hợp': [...MONITOR_POOL].reverse(),
  'Gigabyte M27Q X 27in': [
    'Gigabyte AORUS AD27QD 20190601.jpg',
    'Sandy Hsu and Gigabyte GS27F at Aorus booth 20231216a.jpg',
    'Dou Dou and Gigabyte GS27F at Aorus booth 20231217a.jpg',
    ...MONITOR_POOL,
  ],
  'Gigabyte M34WMU 34in': [
    'Monitor ultrawide 21 9.jpg',
    'LG UltraWide monitors.jpg',
    ...MONITOR_POOL,
  ],
  'Gigabyte M32UC 32in': [
    'Dou Dou and Gigabyte GS27F at Aorus booth 20231217b.jpg',
    'Sandy Hsu and Gigabyte GS27F at Aorus booth 20231216b.jpg',
    ...MONITOR_POOL,
  ],
  'Gigabyte M32UC 32in 4K Curved': [
    'ASUS curved monitor 20170603.jpg',
    'Benq Gaming Curve Monitor Gamescom 2019 (48605730601).jpg',
    ...MONITOR_POOL,
  ],
  'AOC AGON PRO AG274QZM 27in': [
    'AOC 27B2H LCD MONITOR.jpg',
    'Monitores led de aoc .jpg',
    ...MONITOR_POOL,
  ],
  'AOC AGON PRO AG274QZM 27in Mini LED': [
    'Monitores led de aoc .jpg',
    'Minitor led de aoc + ratón.jpg',
    ...MONITOR_POOL,
  ],
  'AOC CU34G2X 34in': [
    'LG UltraWide monitors.jpg',
    'Monitor ultrawide 21 9.jpg',
    ...MONITOR_POOL,
  ],
  'AOC AGON U27G3X 27in': [
    'AOC PD32M back at XPG booth 20231216.jpg',
    'AOC monitor, Moza CS Pro and Noyaya Wang at Racers Day 20260913 170952.jpg',
    ...MONITOR_POOL,
  ],
  'MSI MAG 321UPX 32in': [
    'MSI Optix MPG341CQR 20190601.jpg',
    'MSI monitor 2025.jpg',
    ...MONITOR_POOL,
  ],
  'MSI MAG 321UPX 32in 4K QD-OLED': [
    'Typologo MSI MPG 272URX QD-OLED.png',
    '2026-04-02 MSI MPG 272URX QD-OLED HOF3079-HDR RAW-Export.png',
    ...MONITOR_POOL,
  ],
  'MSI MPG 271QRX 27in': [
    'MSI Campus Star Challenge board and MAG 272UP QD-OLED X24 at MSI booth 20251220.jpg',
    'Forza Motorsport on MAG 272UP QD-OLED X24 at MSI booth 20251220.jpg',
    ...MONITOR_POOL,
  ],
  'MSI MAG 401QR 32in': [
    '2026-04-02 MSI MPG 272URX QD-OLED HOF3095-HDR RAW-Export.png',
    ...MONITOR_POOL,
  ],
  'LG UltraWide 34in': [
    'LG UltraWide monitors.jpg',
    'Taipei IT Month LG 29EA93-P 20131203.jpg',
    'LG 19M35A-B.jpg',
    'LG 19M36A-B.jpg',
    ...MONITOR_POOL,
  ],
  'LG UltraGear 27GR95QE 27in': ['LG 19M36A-B.jpg', ...MONITOR_POOL],
  'LG UltraGear 27GR95QE 27in OLED': ['LG 19M35A-B.jpg', ...MONITOR_POOL],
  'LG UltraGear 32GP950 32in': ['Computer monitor.jpg', ...MONITOR_POOL],
  'Samsung Odyssey G8 32in': ['Samsung LC27F591FDEXZW front 20191229.jpg', ...MONITOR_POOL],
  'Samsung Odyssey G8 34in QD-OLED': ['Samsung LC27F591FDEXZW rear 20191229.jpg', ...MONITOR_POOL],
  'Samsung Odyssey G9 34in': ['Monitor ultrawide 21 9.jpg', ...MONITOR_POOL],
  'Samsung Odyssey Neo G8 32in': ['Samsung monitor with VESA mount.jpg', ...MONITOR_POOL],
  'Samsung Odyssey OLED G8 32in': ['Samsung SyncMaster 400tft at the Kringloopwinkel Snuffelshop, Heiligerlee (2018).jpg', ...MONITOR_POOL],
  'Samsung ViewFinity S8 32in': ['Samsung SyncMaster 940B 20070529.jpg', ...MONITOR_POOL],
  'Samsung ViewFinity S8 S32B800N 32in 4K IPS': ['Samsung SyncMaster 793DF.JPG', ...MONITOR_POOL],
  'Dell Alienware AW3225QF 32in': ['Dell S3423DWC unboxing, front.png', ...MONITOR_POOL],
  'Dell Alienware AW3225QF 32in 4K OLED': ['Dell S3423DWC unboxing, front angled.png', ...MONITOR_POOL],
  'Dell Alienware AW2723DZD 27in': ['Dell S3423DWC unboxing, rear view.png', ...MONITOR_POOL],
  'Dell UltraSharp U2723QE 27in': ['Dell U3415W monitor and Latitude laptop (1).jpg', ...MONITOR_POOL],
  'ASUS ProArt PA32UCG-K 32in': ['Asus ProArt PA246Q monitor 1.JPG', ...MONITOR_POOL],
  'ASUS ProArt PA32UCG-K 32in Mini LED': ['Asus ProArt PA246Q monitor 2.JPG', ...MONITOR_POOL],
  'ASUS ROG Swift PG32UCDM 32in': ['ASUS ROG Strix XG32VQR monitor.jpg', ...MONITOR_POOL],
  'ASUS ProArt PA279CV 27in': ['Asus ProArt PA246Q monitor 3.JPG', ...MONITOR_POOL],
  'BenQ PD3225U 32in': ['BenQ SW2700PT-42 (30482110015).jpg', ...MONITOR_POOL],
  'BenQ PD3225U 32in 4K USB-C': ['BenQ 50RV6500 settings 20130321.jpg', ...MONITOR_POOL],
  'BenQ MO320U 32in': ['BENQ MONITOR (Жидкокристалический).jpg', ...MONITOR_POOL],
  'Zowie XL2546X 24.5in': ['BenQ FP222W face 20080109.jpg', ...MONITOR_POOL],
  'Zowie XL2546X 24.5in eSports': ['BenQ FP222W left side 20080109a.jpg', ...MONITOR_POOL],
  'Zowie XL2566K 27in': ['BenQ FP222W left side 20080109b.jpg', ...MONITOR_POOL],
  'Zowie XL2566K eSports Monitor': ['Gaming-Monitor ausgestellt 20190202 185511 Kopie.jpg', ...MONITOR_POOL],
  'ViewSonic XG272-2K-OLED 27in': ['ASUS PB278Q (PXL 20250914 223256075).jpg', ...MONITOR_POOL],
  'ViewSonic XG272-2K-OLED 27in Gaming': ['ASUS ZenScreen MB16AC 20170603.jpg', ...MONITOR_POOL],
  'ViewSonic ColorPro VP3200-3K 32in': ['ASUS MK241H 20080707.jpg', ...MONITOR_POOL],
  'HP Omen 27qs 27in': ['ASUS MS202D 20100602.jpg', ...MONITOR_POOL],
  'HP Omen 27qs 27in QHD': ['ASUS LS248H at Computex Taipei 20100603.jpg', ...MONITOR_POOL],
  'HP Victus 27q 27in': ['ASUS VH168D 2011-10.jpg', ...MONITOR_POOL],
  'Philips 27E2N7900 27in': ['Philips 27M1C5500 at Wuthering Waves booth stage 20240127.jpg', ...MONITOR_POOL],
  'Philips 27E2N7900 27in 4K USB-C HDR': ['Philips 27M1C5500 and Iris on the stage 20240127.jpg', ...MONITOR_POOL],
  'Philips 34E2N5600 34in': ['Philips Brilliance 195 (1).jpg', ...MONITOR_POOL],
  'Lenovo Legion R32fc-30 32in': ['Dell 3008WFP.jpg', ...MONITOR_POOL],
  'Lenovo Legion R32fc-30 32in FHD': ['Dell M782 monitor.jpg', ...MONITOR_POOL],
  'Lenovo ThinkVision T32p-30 32in': [
    'Dell P2212Hb 21.5" monitor at Universite Catholique de Louvain (batiment Reaumur, salle Bill Joy).jpg',
    ...MONITOR_POOL,
  ],
  'Acer Nitro XR273QK 27in': ['Acer GD245HQ - 2.JPG', ...MONITOR_POOL],
  'Acer Predator XB273K 27in': ['ACER GD245HQ - 3.JPG', ...MONITOR_POOL],
  'Corsair Xeneon 27QHD240 27in': ['ACER GD245HQ - 4.jpg', ...MONITOR_POOL],

  /* ── PC Gaming / linh kiện ── */
  'ASUS TUF Gaming': [
    'ASUS TUF Gaming X3 20190601.jpg',
    'ASUS TUF B450-PLUS GAMING 20181221.jpg',
    'AVADirect-Custom-X99-Intel-Core-i7-gaming-cpu.png',
    ...PC_CASE_POOL,
  ],
  'Kingston FURY Beast DDR5': [
    'Kingston FURY Impact DDR5 SO-DIMM Laptop Memory 32GB Module - front view.jpg',
    'Kingston FURY Impact DDR5 SO-DIMM Laptop Memory 32GB Module - rear view.jpg',
    ...RAM_POOL,
  ],
  'Kingston FURY Renegade': [
    '2023 Dysk SSD Kingston NV2 2TB.jpg',
    'Kingston HyperX Predator 480GB sample at Guang Hua Digital Plaza 6F 20151212.jpg',
    ...STORAGE_POOL,
  ],
  'Corsair RM850x': PSU_POOL,
  'Corsair RM750e': [...PSU_POOL].reverse(),
  'Corsair MP700 Pro SE': [
    'Corsair MP400 20211221 01.png',
    'Corsair MP400 20211221 02.png',
    ...STORAGE_POOL,
  ],
  'Cooler Master MTT G200 V2': COOLER_POOL,
  'DeepCool AK620 Digital': [
    'DeepCool AK400 1.jpg',
    'DeepCool AK400 2.jpg',
    'Deepcool cooler.png',
    ...COOLER_POOL,
  ],
  'Seagate FireCuda 530': [
    '2023 Dysk SSD Kingston NV2 2TB.jpg',
    'Corsair MP400 20211221 01.png',
    'Corsair MP400 20211221 02.png',
    ...STORAGE_POOL,
  ],
  'Seagate Barracuda Compute': [
    'Seagate BarraCuda Compute 2TB 3.5-inch SATA HDD - top view.jpg',
    'ST3000DM001.jpg',
    'Seagate 500gb Barracuda 7200rpm 3.5 SATA Hard Disk.jpg',
  ],
  'Western Digital Blue SN580': [
    'Western Digital SN850X NVME solid state drive 8TB front side.jpg',
    'Western Digital SN850X NVME solid state drive 8TB back side.jpg',
    ...STORAGE_POOL,
  ],
  'Western Digital Black SN850X': [
    'Western Digital SN850X NVME solid state drive 8TB back side.jpg',
    'Western Digital SN850X NVME solid state drive 8TB front side.jpg',
    ...STORAGE_POOL,
  ],
  'Crucial T500': [
    'Crucial MX100 SSD 256GB 20140905.jpg',
    'Crucial SSD MX300 525GB-8478.jpg',
    'Crucial SSD MX300 525GB-8479.jpg',
    ...STORAGE_POOL,
  ],
  'Crucial P3 Plus': [
    '2017 Dysk SSD Plextor M8Pe(Y) 256GB.jpg',
    ...STORAGE_POOL,
  ],
  'Samsung 990 PRO': ['Samsung 990 PRO SSD.jpg', ...STORAGE_POOL],
  'Samsung 870 EVO': ['Samsung 870 EVO SSD.jpg', ...STORAGE_POOL],
  'G.Skill Trident Z5 RGB': [
    'Tridentz red RAM.JPG',
    'DDR4 Ram IMGP5859 smial wp.jpg',
    'G.Skill RipjawsX DDR3 memory modules.JPG',
    'DDR-SDRAM-Module.jpg',
  ],
  'G.Skill Ripjaws S5': [
    'G.Skill RipjawsX DDR3 memory modules.JPG',
    'DDR4 Ram IMGP5854 smial wp.jpg',
    'Tridentz red RAM.JPG',
    'DDR-SDRAM-Module.jpg',
  ],
  'NVIDIA GeForce RTX 4090 Founders Edition': [
    'Palit GeForce RTX 5090 Gamerock 20250530 HOF3864 RAW-Export.png',
    ...GPU_POOL,
  ],
  'NVIDIA GeForce RTX 4080 SUPER Founders Edition': [
    'Palit GeForce RTX 5090 Gamerock 20250530 HOF3866 RAW-Export.png',
    ...GPU_POOL,
  ],
  'NVIDIA GeForce RTX 4070 Ti SUPER Founders Edition': [
    'Palit GeForce RTX 5090 Gamerock 20250530 HOF3870 RAW-Export cens.png',
    ...GPU_POOL,
  ],
  'AMD Ryzen 9 7950X3D': [
    'AMD Ryzen 9 9950X.jpg',
    'AMD Ryzen 9 7900X.jpg',
    'AMD Ryzen 7 5800X3D.jpg',
  ],
  'AMD Ryzen 7 7800X3D': [
    'AMD Ryzen 7 5800X3D.jpg',
    'AMD Ryzen 9 7900X.jpg',
  ],
  'AMD Ryzen 5 7600X': [
    'AMD Ryzen 5 5600X.jpg',
    'AMD Ryzen 5 7600 bottom IMGP6779 smial wp.jpg',
  ],
  'Intel Core i9-14900K': [
    '2023 Intel Core i7 12700KF (5).jpg',
    'Intel-Core-i7-820QM Q1NG-ES-Processor Mobile-CPU IMG 6055 cr.jpg',
  ],
  'Intel Core i7-14700K': ['Intel Core i3 in BIOS.jpg', 'Processor INTEL CORE 2 DUO.jpg'],
  'Intel Core i5-14600K': [
    'Intel core i5-2467m sr0d6.jpg',
    'Intel core i5-5300u sr23x.jpg',
  ],

  /* ── PC build (custom) ── */
  'PC Gaming RTX 5090 Supreme': GPU_POOL,
  'PC Gaming RTX 5080 Pro Gamer': [...GPU_POOL].reverse(),
  'PC Gaming RTX 4070 Ti SUPER PowerKing': [...PC_CASE_POOL].reverse(),
  'PC Gaming RTX 4060 Ti GamingX': PC_CASE_POOL,
  'PC Workstation RTX 4090 Creator': [...PC_CASE_POOL, ...GPU_POOL],
  'PC Gaming RTX 4070 SUPER Midnight': [...PC_CASE_POOL].reverse(),
  'PC Gaming RTX 4080 SUPER Phantom': PC_CASE_POOL,
  'PC Streaming RTX 4070 OBS Studio': [...PC_CASE_POOL, ...GPU_POOL],
  'PC Esports Arena RTX 4060 Ti Tournament': [...PC_CASE_POOL].reverse(),
  'PC Mini ITX RTX 4070 Ghost': [
    'ITX Personal Computer Case and Flex-ATX PSU IMG 1646.JPG',
    'ITX Personal Computer Case and Flex-ATX PSU IMG 1651.JPG',
    'Falcon Northwest custom PCs.jpg',
    ...PC_CASE_POOL,
  ],
  'PC Gaming RTX 4090 Phantom Pro': [...GPU_POOL, ...PC_CASE_POOL],
  'PC VR Ready RTX 4070 Ti Metaverse': [...PC_CASE_POOL, ...GPU_POOL],
  'PC Budget Gaming RTX 3060 Starter': [...PC_CASE_POOL].reverse(),
  'PC Silent Build RTX 4070 Whisper': [...PC_CASE_POOL, ...GPU_POOL],
  'PC Streaming Pro RTX 4080 + Dual PC Setup': [...PC_CASE_POOL, ...GPU_POOL],

  /* ── Tablet / Laptop ── */
  'iPad Pro M4 13in': [
    'About iPad Pro 13-inch (M4).jpg',
    'M4 iPad Pro series - 1.jpg',
    'M4 iPad Pro series - 2.jpg',
    'M4 iPad Pro series - 3.jpg',
    ...TABLET_POOL,
  ],
  'iPad Air M3 13in': [
    'IPad Air 11-inch (M3).jpg',
    'IPad Air 11-inch (M3) backside.jpg',
    ...TABLET_POOL,
  ],
  'iPad 10th Generation 13in': [
    'IPad Air 11-inch (M3).jpg',
    'IPad Air 11-inch (M3) backside.jpg',
    'About iPad Pro 13-inch (M4).jpg',
    ...TABLET_POOL,
  ],
  'Samsung Galaxy Tab S9 Ultra 13in': [
    'Samsung Galaxy Tab S9.png',
    '20230729 삼성 갤럭시 탭 S9.jpg',
    ...TABLET_POOL,
  ],
  'Samsung Galaxy Tab S10+ 13in': [
    'Samsung Galaxy Tab S8 Ultra.jpg',
    'Samsung Galaxy Tab S8 Ultra - Rear Side.jpg',
    ...TABLET_POOL,
  ],
  'Xiaomi Pad 6 13in': [
    'Xiaomi Pad 6 display.jpg',
    'Xiaomi Pad 6S Pro.jpg',
    ...TABLET_POOL,
  ],
  'Microsoft Surface Laptop 7 13in': [
    'Microsoft Surface Laptop 7.jpg',
    'SurfaceLaptop.png',
    'SurfaceLaptopBurgundy.png',
    ...LAPTOP_POOL,
  ],
  'Microsoft Surface Laptop 7 Copilot+': [
    'A platinum Microsoft Surface Laptop Go.jpg',
    'Surface Laptop Studio - 1.jpg',
    'Surface Laptop Studio - 2.jpg',
    ...LAPTOP_POOL,
  ],
  'Microsoft Surface Pro 12 12in': [
    'Surface Laptop Studio - 3.jpg',
    'Surface Laptop Studio - 4.jpg',
    ...LAPTOP_POOL,
  ],
  'HP Victus 15 15in': [
    'HP Victus laptop.jpg',
    'HP Victus 15 gaming laptop side view.jpg',
    ...LAPTOP_POOL,
  ],
  'HP Omen 16 16in': ['Laptop PC.jpg', ...LAPTOP_POOL],
  'HP Omen 16-wf0093TX': ['Laptop PC.jpeg', ...LAPTOP_POOL],
  'HP Spectre x360 16 16in': ['Notebook computer.jpg', ...LAPTOP_POOL],
  'HP Envy x360 14 14in': ['Laptop computer.jpeg', ...LAPTOP_POOL],
  'ASUS VivoBook 15 OLED': [
    'Asus vivobook.jpg',
    'Vivobook S16.jpg',
    'ASUS Vivobook X556UQ.jpg',
    ...LAPTOP_POOL,
  ],
  'ASUS VivoBook 15 OLED 15in': [
    'Vivobook S16.jpg',
    'Asus vivobook.jpg',
    'ASUS Vivobook X556UQ.jpg',
    ...LAPTOP_POOL,
  ],
  'Razer Blade 14 14in': [
    'Razer Blade Stealth Late 2017.png',
    'Razer Blade Pro 1 2018-02-13.jpg',
    ...LAPTOP_POOL,
  ],
  'Razer Blade 16 16in': [
    'Razer Blade Pro 1 2018-02-13.jpg',
    'Razer Blade Stealth Late 2017.png',
    ...LAPTOP_POOL,
  ],
  'MSI Katana 15 15in': [
    'MSI Bravo 17 (0017FK-007)-front oblique PNr°0757.jpg',
    ...LAPTOP_POOL,
  ],
  'MSI Stealth 16 AI Studio A1VIG': [
    'MSI GS75 Stealth on the table 20221224.jpg',
    ...LAPTOP_POOL,
  ],
  'MSI Stealth 16 AI Studio 16in': [
    'MSI Gaming Laptop on wood floor.jpg',
    ...LAPTOP_POOL,
  ],
  'MSI Raider GE78 HX 16in': [
    'MSI Bravo 17 (0017FK-007)-top cover PNr°0759.jpg',
    ...LAPTOP_POOL,
  ],
  'MSI Raider GE78 HX 14VIG': [
    'MSI Bravo 17 (0017FK-007)-top keyboard PNr°0758.jpg',
    ...LAPTOP_POOL,
  ],
  'MSI Titan 18 HX 18in': [
    'MSI GT76 Titan 20190601.jpg',
    ...LAPTOP_POOL,
  ],
  'ASUS ROG Strix G16 16in': [
    'ROG Strix G16 2026-08-08 ASUS 01.jpg',
    ...LAPTOP_POOL,
  ],
  'ASUS ROG Zephyrus G16 16in': [
    'ROG Strix G16 2026-08-08 ASUS 02.jpg',
    ...LAPTOP_POOL,
  ],
  'ASUS ROG Swift OLED 14in': [
    'ROG Strix G16 2026-08-08 ASUS 03.jpg',
    ...LAPTOP_POOL,
  ],
  'ASUS TUF Gaming A15 15in': [
    'ASUS TUF Gaming 5 Pro Laptop.jpg',
    ...LAPTOP_POOL,
  ],
  'ASUS ZenBook 14 OLED 14in': ['Asus Zenbook UX31E - keypad MP-11B16D06528-48170.jpg', ...LAPTOP_POOL],
  'Dell XPS 16 16in': ['Dell XPS 8950.jpg', ...LAPTOP_POOL],
  'Dell XPS 16 9640': ['DELL XPS 13 and 15 (37080596413).jpg', ...LAPTOP_POOL],
  'Dell XPS 15 15in': ['Dell XPS 15 (2017).png', ...LAPTOP_POOL],
  'Dell Inspiron 15 15in': ['Dell XPS 13 (2018).png', ...LAPTOP_POOL],
  'Dell Inspiron 15 3530': ['Dell Latitude E6410 laptop with Kiwix.jpg', ...LAPTOP_POOL],
  'Lenovo ThinkPad X1 Carbon Gen 12 14in': ['Lenovo ThinkPad X1 Carbon Gen 12.jpg', ...LAPTOP_POOL],
  'Lenovo LOQ 15 15in': ['Lenovo G500s laptop-2905.jpg', ...LAPTOP_POOL],
  'Lenovo LOQ 15IRX9': ['Lenovo G500s laptop-2903.jpg', ...LAPTOP_POOL],
  'Samsung Galaxy Book4 Ultra 16in': ['20230729 삼성 갤럭시 북 프로 360.jpg', ...LAPTOP_POOL],
  'Huawei MateBook X Pro 14in': ['Huawei MateBook X Pro.jpg', ...LAPTOP_POOL],
  'Huawei MateBook X Pro 2024': ['Huawei MateBook X Pro.jpg', ...LAPTOP_POOL],
  'LG Gram 17 17in': ['LG Gram 17.jpg', ...LAPTOP_POOL],
  'LG Gram 14 14in': ['Laptop computer.jpg', ...LAPTOP_POOL],
  'Acer Predator Helios Neo 16 16in': [
    'Acer Predator Helios 300 back panel open.jpg',
    ...LAPTOP_POOL,
  ],
  'Acer Predator Helios Neo 16': [
    'Acer Predator laptop and promotional model at Computex 20160531.jpg',
    ...LAPTOP_POOL,
  ],
  'Acer Swift Go 14 14in': ['Acer Predator laptops and mice, Computex Taipei (27373087145).jpg', ...LAPTOP_POOL],
  'Gigabyte AORUS 16X 16in': ['PinpinPonpon holding Predator Helios Neo 16S AI at Acer Predator stage 20260927 133103.jpg', ...LAPTOP_POOL],
  'Gigabyte AORUS 16X 14KF': ['PinpinPonpon holding Predator Helios Neo 16S AI at Acer Predator stage 20260927 133104.jpg', ...LAPTOP_POOL],
  'Gigabyte AORUS M15 15in': ['Twitch T-shirt, Peanuts T-shirt, Aorus laptop and MSI laptop (14892417627).jpg', ...LAPTOP_POOL],
  'Apple iPhone 16 Pro Max': PHONE_POOL,
};

interface Entry {
  images: string[];
  source: string;
  title: string;
}

async function main() {
  const mock = JSON.parse(
    readFileSync(resolve(process.cwd(), 'scripts/data/frontend-mock.json'), 'utf-8'),
  );
  const dest = resolve(process.cwd(), 'scripts/data/model-images.json');
  const db = JSON.parse(readFileSync(dest, 'utf-8')) as Record<string, Entry>;

  const allFiles = [...new Set(Object.values(MODEL_PHOTOS).flat())];
  console.log(`[finalize] Verify ${allFiles.length} file Commons…`);
  const urlMap = await resolveFiles(allFiles);
  console.log(`[finalize] Tồn tại: ${urlMap.size}/${allFiles.length}`);
  const missing = allFiles.filter((f) => !urlMap.has(f));
  if (missing.length) console.log(`[finalize] KHÔNG tồn tại: ${missing.join(' | ')}`);

  const models = new Set<string>();
  for (const p of [
    ...(mock.products as any[]),
    ...((mock.sellerProducts ?? []) as any[]),
  ]) {
    models.add(modelName(p.name));
  }

  let applied = 0;
  const skipped: string[] = [];
  for (const [model, files] of Object.entries(MODEL_PHOTOS)) {
    if (!models.has(model)) {
      skipped.push(model);
      continue;
    }
    const urls: string[] = [];
    for (const f of files) {
      const u = urlMap.get(f);
      if (u && !urls.includes(u)) urls.push(u);
    }
    if (!urls.length) {
      skipped.push(`${model} (không có URL hợp lệ)`);
      continue;
    }
    db[model] = { images: urls, source: 'commons-curated', title: files[0] };
    applied++;
  }

  console.log(`[finalize] Đã gán ảnh cho ${applied} model.`);
  if (skipped.length) {
    console.log(`[finalize] Bỏ qua ${skipped.length}: ${skipped.join(' | ')}`);
  }

  /* ── PHÂN BỔ ẢNH CHÍNH: mỗi model một ảnh chính RIÊNG ── */
  const entries = Object.entries(db);
  const used = new Set<string>();
  const usage = new Map<string, number>();
  const EXACT = new Set([
    'commons-code',
    'commons-intitle',
    'wikipedia',
    'wikipedia-media',
    'wikipedia-search',
    'commons',
  ]);

  const ordered = [...entries].sort((a, b) => {
    const ea = EXACT.has(a[1].source);
    const eb = EXACT.has(b[1].source);
    if (ea !== eb) return ea ? -1 : 1;
    return a[0].localeCompare(b[0]);
  });

  for (const [model, v] of ordered) {
    if (!v.images?.length) continue;
    if (EXACT.has(v.source)) {
      used.add(v.images[0]);
      usage.set(v.images[0], (usage.get(v.images[0]) ?? 0) + 1);
    }
  }

  for (const [model, v] of ordered) {
    if (!v.images?.length) continue;
    if (EXACT.has(v.source)) continue;
    let chosen = v.images.find((u) => !used.has(u));
    if (!chosen) {
      let best: string | undefined;
      let bestCount = Infinity;
      for (const u of v.images) {
        const c = usage.get(u) ?? 0;
        if (c < bestCount) {
          bestCount = c;
          best = u;
        }
      }
      chosen = best;
    }
    if (!chosen) continue;
    used.add(chosen);
    usage.set(chosen, (usage.get(chosen) ?? 0) + 1);
    v.images = [chosen, ...v.images.filter((u) => u !== chosen)];
  }

  writeFileSync(dest, JSON.stringify(db, null, 2), 'utf-8');

  const main = new Map<string, string[]>();
  for (const [model, v] of Object.entries(db)) {
    const m = v?.images?.[0];
    if (!m) continue;
    const l = main.get(m) ?? [];
    l.push(model);
    main.set(m, l);
  }
  const dup = [...main.entries()].filter(([, l]) => l.length > 1);
  console.log(
    `\n[finalize] Ảnh chính trùng nhau: ${dup.length} nhóm` +
      (dup.length ? ` (max ${Math.max(...dup.map(([, l]) => l.length))} model)` : ''),
  );
  for (const [url, ms] of dup.slice(0, 15)) {
    console.log(
      `   - ${decodeURIComponent(url.split('/').pop()?.split('?')[0] ?? '')} <- ${ms
        .slice(0, 6)
        .join(' | ')}`,
    );
  }
}

void main();

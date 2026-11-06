/**
 * Lọc pool ảnh mở rộng: chỉ giữ ảnh SẢN PHẨM thật.
 *
 * Loại: ảnh người, sự kiện, bối cảnh, linh kiện rời, logo, sơ đồ...
 *
 * Chạy: npx tsx scripts/filter-pools.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const REJECT = new RegExp(
  [
    // người / sự kiện / bối cảnh
    'wcg', 'grand ?final', 'esport', 'tournament', 'championship', 'finals',
    'playseat', 'playset', 'booth', 'stand', 'exhibit', 'stage', 'crowd',
    'audience', 'player', 'streamer', 'caster', 'interview', 'autograph',
    'signing', 'meet', 'person', 'people', 'man ', 'woman ', 'men ', 'women ',
    'boy', 'girl', 'child', 'kid ', 'fan ', 'fans', 'gamer', 'pro ', 'coach',
    'team ', 'players', 'holding', 'wearing', 'sitting', 'hand', 'hands',
    'face', 'portrait', 'group', 'portrait', 'concert', 'festival', 'show',
    'demo', 'presentation', 'keynote', 'conference', 'meeting', 'workshop',
    'muji', 'musee', 'museum', 'store', 'shop', 'office', 'desk', 'setup',
    'desk ?setup', 'room', 'bed', 'kitchen', 'living ?room', 'table',
    'counter', 'shelf', 'wall', 'floor', 'street', 'city', 'building',
    'window', 'car', 'vehicle', 'bike', 'bicycle', 'dog', 'cat', 'baby',
    'tiger', 'lion', 'elephant', 'bird', 'insect', 'plant', 'flower', 'tree',
    'food', 'dish', 'cake', 'coffee', 'drink', 'beer', 'wine', 'cigarette',
    'broken', 'cracked', 'damaged', 'scratched', 'dusty', 'dirty',
    'poster', 'advert', 'advertisement', 'banner', 'sign', 'logo', 'icon',
    'diagram', 'chart', 'graph', 'map', 'blueprint', 'schematic', 'patent',
    'drawing', 'sketch', 'screenshot', 'interface', 'menu', 'screenshot',
    'book', 'cover', 'page', 'page ', 'volume', 'edition', 'issue',
    'box', 'package', 'packaging', 'unboxing', 'manual', 'instruction',
    'warranty', 'receipt', 'invoice', 'label', 'sticker', 'barcode',
    // linh kiện rời / teardown
    'disassembl', 'teardown', 'exploded', 'schematic', 'mainboard',
    'motherboard', 'logic ?board', 'pcb', 'chipset', 'circuit', 'module',
    'stick', 'sodimm', 'dimm', 'coolant', 'pump', 'connector', 'cable',
    'port', 'button', 'wheel', 'underneath', 'bottom', 'top view', 'rear view',
    'back view', 'side view', 'inside', 'interior', 'switch', 'keycap',
    'scroll ?wheel', 'hinge', 'stand ?alone', 'feet', 'base plate',
    // vô nghĩa / nhiễu
    'tokyo-game-show', 'gamescom', 'comiket', 'faceit', 'homestory', 'hwc',
    'esl', 'blast', 'esport', 'review', 'comparison', 'unboxing', 'boit',
    'destroy', 'return of', 'consair', 'church', 'fortress', 'aircraft',
    'plane', 'airliner', 'boeing', 'mustang', 'regiment', 'massacre', 'saint',
    'monster', 'dumpster', 'trash', 'bin ',     'scrap', 'screw', 'bolt', 'bracket', 'poweredge', 'rack', 'blade',
    'server', 'terminal', 'mainframe', 'industrial', 'sinumerik', 'plc',
    'robot', 'machine', 'tool', 'drill', 'printer', 'scanner', 'plotter',
    'raspberry', 'pi ', 'pi.', 'microbit', 'arduino',
    'zipper', 'storage bag', 'palm ?top', '8088', 'columbia data',
    'conversion board', 'ibm ', 'commodore', 'atari',
    'red ?bull', 'wirth', 'amstrad', 'zx ?spectrum', 'acorn', 'olympus',
    'palm', 'handheld', 'usb ?disk', 'floppy', 'cassette', 'tape drive',
  ].join('|'),
  'i',
);

const KEEP_HINT = [
  // dấu hiệu là ảnh sản phẩm
  'front', 'back', 'rear', 'side', 'top', 'view', 'angle', 'angled', 'oblique',
  'closeup', 'close ?up', 'product', 'device', 'model', 'series', 'version',
  'edition', 'variant', 'color', 'colour', 'black', 'white', 'silver', 'blue',
  'red', 'grey', 'gray', 'green', 'yellow', 'purple', 'pink', 'gold',
  'overview', 'detail', 'shot', 'photo', 'image', 'render', 'box',
];

function isProduct(title: string): boolean {
  if (REJECT.test(title)) return false;
  return KEEP_HINT.some((k) => new RegExp(k, 'i').test(title));
}

/** Từ khoá BẮT BUỘC phải có trong tên file (theo loại sản phẩm). */
const TYPE_HINT: Record<string, string[]> = {
  PHONE: [
    'iphone', 'phone', 'smartphone', 'galaxy', 'pixel', 'oneplus', 'realme',
    'xiaomi', 'redmi', 'poco', 'honor', 'oppo', 'vivo', 'huawei', 'nokia',
    'sony', 'tecno', 'moto', 'samsung', 'android', 'ipad',
    'mobile', 'handset', 'telephone',
  ],
  PC_CASE: [
    'computer', 'pc', 'tower', 'case', 'desktop', 'workstation', 'gaming',
    'micron', 'turing', 'ryzen', 'rtx', 'geforce', 'ryzen',
    'predator', 'rog', 'thunderbolt', 'chassis', 'system',
    'gaming ?pc', 'custom ?computer', 'custom ?pc', 'desktop ?computer',
    'computer ?tower', 'mini ?tower', 'micro ?tower', 'gaming ?computer',
    'avadi', 'falcon ?northwest', 'silicon ?graphics', 'main ?case',
    'case - ', 'case.', 'midi ?tower', 'phanteks', 'lian ?li', 'cooler ?master',
    'thermaltake', 'nzxt', 'fractal', 'be quiet', 'antec', 'corsair ?case',
    'aerocool', 'tt ', 'chassis', 'x99', 'atx', 'matx', 'itx', 'workstation',
  ],
  HEADSET: [
    'headset', 'headphone', 'kopfhoerer', 'kopfhörer', 'earphone', 'airpod',
    'earbud', 'earbuds', 'casque', 'cascos', 'cuffie', 'auricolare', 'hodetelefon',
    'hovedtelefon', 'stereo', 'audio', 'sennheiser', 'sony', 'bose', 'razer',
    'corsair', 'hyperx', 'logitech', 'steelseries', 'astro', 'turtle beach',
    'plantronics', 'jbl', 'sennheiser', 'akg', 'shure', 'pioneer', 'beats',
  ],
};

function main() {
  const pools = JSON.parse(
    readFileSync(resolve(process.cwd(), 'scripts/data/image-pools.json'), 'utf-8'),
  ) as Record<string, string[]>;
  let expanded: Record<string, string[]> = {};
  try {
    expanded = JSON.parse(
      readFileSync(resolve(process.cwd(), 'scripts/data/expanded-pools.json'), 'utf-8'),
    );
  } catch {
    /* ignore */
  }

  const out: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(expanded)) {
    const kept = v.filter(isProduct).filter((t) => TYPE_HINT[k]?.some((w) => t.toLowerCase().includes(w)));
    out[k] = kept;
    console.log(`${k}: ${v.length} -> ${kept.length}`);
  }
  writeFileSync(
    resolve(process.cwd(), 'scripts/data/expanded-pools.json'),
    JSON.stringify(out, null, 2),
    'utf-8',
  );
}

main();

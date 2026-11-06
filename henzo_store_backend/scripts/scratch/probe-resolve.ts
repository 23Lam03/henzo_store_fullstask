import { resolveFiles } from '../../lib/commons-files';
const files = [
  'Laptophp.png',
  'Apple iPhone.webp',
  'Samsung monitor with VESA mount.jpg',
  'Sony Ericsson Bluetooth Headset HBH-PV705 (2220451715).jpg',
];
const m = await resolveFiles(files);
console.log('resolved:', m.size);
for (const [k, v] of m) console.log('  ', k, '->', v.slice(0, 90));
console.log('missing:', files.filter((f) => !m.has(f)));

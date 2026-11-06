/**
 * Tìm các vùng màu "xanh primary" trong ảnh BMP và in bounding box theo dải dòng.
 * Dùng: npx tsx scripts/bmp-blue.ts <file.bmp> [yStart] [yEnd]
 */
import { readFileSync } from 'node:fs';

const file = process.argv[2];
const yStart = Number(process.argv[3] ?? 0);
const yEnd = Number(process.argv[4] ?? 1000);

const buf = readFileSync(file);
const dataOff = buf.readUInt32LE(10);
const width = buf.readInt32LE(18);
const rawH = buf.readInt32LE(22);
const bpp = buf.readUInt16LE(28);
const rowSize = Math.floor((bpp * width + 31) / 32) * 4;
const flip = rawH > 0;
const H = Math.abs(rawH);

const px = (x: number, y: number): [number, number, number] => {
  const row = flip ? H - 1 - y : y;
  const i = dataOff + row * rowSize + x * 3;
  return [buf[i + 2], buf[i + 1], buf[i]];
};

const isBlue = ([r, g, b]: [number, number, number]) => b > 130 && b - r > 60 && b - g > 50;

for (let y = yStart; y < Math.min(yEnd, H); y++) {
  // Tìm các đoạn liên tiếp của pixel xanh.
  const runs: string[] = [];
  let start = -1;
  for (let x = 0; x < width; x++) {
    if (isBlue(px(x, y))) {
      if (start < 0) start = x;
    } else if (start >= 0) {
      if (x - start > 4) runs.push(`${start}-${x - 1}`);
      start = -1;
    }
  }
  if (start >= 0 && width - start > 4) runs.push(`${start}-${width - 1}`);
  if (runs.length) console.log(`y=${y}: ${runs.join('  ')}`);
}

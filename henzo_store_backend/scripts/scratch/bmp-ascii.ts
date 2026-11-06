import { readFileSync } from 'node:fs';

const file = process.argv[2];
const x0 = Number(process.argv[3] ?? 0);
const y0 = Number(process.argv[4] ?? 0);
const w = Number(process.argv[5] ?? 200);
const h = Number(process.argv[6] ?? 60);
const stepX = Number(process.argv[7] ?? 2);

const buf = readFileSync(file);
const dataOff = buf.readUInt32LE(10);
const width = buf.readInt32LE(18);
const height = buf.readInt32LE(22);
const bpp = buf.readUInt16LE(28);
console.log(`BMP ${width}x${Math.abs(height)} bpp=${bpp} dataOff=${dataOff}`);

const rowSize = Math.floor((bpp * width + 31) / 32) * 4;
const flip = height > 0;

const px = (x: number, y: number): [number, number, number] => {
  const row = flip ? Math.abs(height) - 1 - y : y;
  const i = dataOff + row * rowSize + x * 3;
  return [buf[i + 2], buf[i + 1], buf[i]];
};

const lum = ([r, g, b]: [number, number, number]) => 0.299 * r + 0.587 * g + 0.114 * b;
const isBlue = ([r, g, b]: [number, number, number]) => b > 140 && b - r > 50 && b - g > 40;

for (let y = y0; y < Math.min(y0 + h, Math.abs(height)); y += 2) {
  let line = '';
  for (let x = x0; x < Math.min(x0 + w, width); x += stepX) {
    const c = px(x, y);
    if (isBlue(c)) line += '#';
    else {
      const l = lum(c);
      line += l > 240 ? ' ' : l > 200 ? '.' : l > 150 ? '-' : l > 90 ? '+' : '@';
    }
  }
  console.log(String(y).padStart(4) + '|' + line);
}

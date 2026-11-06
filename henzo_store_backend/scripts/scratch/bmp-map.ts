/**
 * In bản đồ ASCII phân loại MÀU (không chỉ độ sáng) để đọc bố cục ảnh.
 *
 * Ký tự:
 *   # = xanh dương (primary)      B = xanh biển sẫm
 *   @ = xám rất đậm (chữ)          x = xám đậm
 *   o = xám vừa                    . = xám nhạt
 *   ' ' = trắng                    ~ = viền/nét mảnh đậm
 */
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

const lum = ([r, g, b]: [number, number, number]) => 0.299 * r + 0.587 * g + 0.114 * b;

function ch(c: [number, number, number]): string {
  const [r, g, b] = c;
  const l = lum(c);
  if (b > 130 && b - r > 60 && b - g > 50) return '#'; // xanh primary
  if (b > 100 && b - r > 40) return 'B'; // xanh khác
  if (r > 240 && g > 240 && b > 240) return ' ';
  if (l > 235) return '.';
  if (l > 200) return ',';
  if (l > 160) return 'o';
  if (l > 120) return 'x';
  if (l > 70) return '@';
  return '#';
}

let header = '     ';
for (let x = x0; x < Math.min(x0 + w, width); x += stepX) header += String(Math.floor(x / 10) % 10);
console.log(header);

for (let y = y0; y < Math.min(y0 + h, H); y += 2) {
  let line = '';
  for (let x = x0; x < Math.min(x0 + w, width); x += stepX) line += ch(px(x, y));
  console.log(String(y).padStart(4) + '|' + line);
}

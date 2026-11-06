import { readFileSync } from 'node:fs';

function load(file: string) {
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
  return { width, H, px };
}

const file = process.argv[2];
const y0 = Number(process.argv[3] ?? 0);
const y1 = Number(process.argv[4] ?? 10000);

const { width, H, px } = load(file);
const isBlue = ([r, g, b]: [number, number, number]) => b > 130 && b - r > 60 && b - g > 50;

const cols = new Map<number, number[]>();
for (let y = y0; y < Math.min(y1, H); y++) {
  for (let x = 0; x < width; x++) {
    if (!isBlue(px(x, y))) continue;
    const arr = cols.get(x) ?? [];
    arr.push(y);
    cols.set(x, arr);
  }
}

const regions: { x0: number; x1: number; y0: number; y1: number; n: number }[] = [];
let cur: typeof regions[number] | null = null;
for (const x of [...cols.keys()].sort((a, b) => a - b)) {
  if (cur && x === cur.x1 + 1) {
    cur.x1 = x;
    const ys: number[] = cols.get(x) ?? [];
    cur.y0 = Math.min(cur.y0, ys[0]);
    cur.y1 = Math.max(cur.y1, ys[ys.length - 1]);
    cur.n += ys.length;
  } else {
    if (cur) regions.push(cur);
    const ys: number[] = cols.get(x) ?? [];
    cur = { x0: x, x1: x, y0: ys[0], y1: ys[ys.length - 1], n: ys.length };
  }
}
if (cur) regions.push(cur);

console.log(`${file}: ${width}x${H}`);
for (const r of regions.filter((r) => r.n > 30).sort((a, b) => b.n - a.n)) {
  console.log(
    `  blue box x=${r.x0}..${r.x1} (w=${r.x1 - r.x0 + 1})  y=${r.y0}..${r.y1} (h=${r.y1 - r.y0 + 1})  px=${r.n}`,
  );
}

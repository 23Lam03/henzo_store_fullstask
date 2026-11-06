import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

function decodePng(buf: Buffer) {
  let p = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idat: Buffer[] = [];

  while (p < buf.length) {
    const len = buf.readUInt32BE(p);
    const type = buf.toString('ascii', p + 4, p + 8);
    const data = buf.subarray(p + 8, p + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') break;
    p += 12 + len;
  }
  if (bitDepth !== 8) throw new Error(`bitDepth ${bitDepth} chưa hỗ trợ`);

  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 0 ? 1 : 0;
  if (!channels) throw new Error(`colorType ${colorType} chưa hỗ trợ`);

  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const out = Buffer.alloc(height * stride);

  let pos = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[pos++];
    const line = raw.subarray(pos, pos + stride);
    pos += stride;
    const cur = out.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? out.subarray((y - 1) * stride, y * stride) : Buffer.alloc(stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? cur[x - channels] : 0;
      const b = prev[x];
      const c = x >= channels ? prev[x - channels] : 0;
      let v = line[x];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const pa = Math.abs(b - c);
        const pb = Math.abs(a - c);
        const pc = Math.abs(a + b - 2 * c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      cur[x] = v & 0xff;
    }
  }
  return { width, height, channels, data: out };
}

const file = process.argv[2];
const x0 = Number(process.argv[3] ?? 0);
const y0 = Number(process.argv[4] ?? 0);
const w = Number(process.argv[5] ?? 200);
const h = Number(process.argv[6] ?? 60);

const img = decodePng(readFileSync(file));
console.log(`size=${img.width}x${img.height} ch=${img.channels}`);

const px = (x: number, y: number): [number, number, number] => {
  const i = (y * img.width + x) * img.channels;
  return [img.data[i], img.data[i + 1], img.data[i + 2]];
};

const lum = ([r, g, b]: [number, number, number]) => 0.299 * r + 0.587 * g + 0.114 * b;
const isBlue = ([r, g, b]: [number, number, number]) => b > 140 && b - r > 50 && b - g > 40;

const step = Math.max(1, Math.round(w / 200));
for (let y = y0; y < Math.min(y0 + h, img.height); y += Math.max(1, Math.round(step / 1.5))) {
  let line = '';
  for (let x = x0; x < Math.min(x0 + w, img.width); x += step) {
    const c = px(x, y);
    if (isBlue(c)) line += '#';
    else if (lum(c) > 240) line += ' ';
    else if (lum(c) > 200) line += '.';
    else if (lum(c) > 150) line += '-';
    else if (lum(c) > 90) line += '+';
    else line += '@';
  }
  console.log(String(y).padStart(4) + '|' + line);
}

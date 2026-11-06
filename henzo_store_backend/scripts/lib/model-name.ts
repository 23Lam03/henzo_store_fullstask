
const COLOR_PHRASES = [
  'Natural Titanium',
  'Titanium Gray',
  'Titanium Black',
  'Eclipse Gray',
  'Tonal Silver',
  'Moonlight White',
  'Platinum Silver',
  'Graphite Gray',
  'Lunar Gray',
  'Storm Gray',
  'Arctic White',
  'Silver Shadow',
  'Cobalt Violet',
  'Forest Green',
  'Space Gray',
  'Carbon Black',
  'Pale Gray',
  'MX Stone',
  'Sandstone',
  'Chromium',
  'Obsidian',
  'Porcelain',
  'Hazel',
  'Graphite',
  'Mango',
  'Snow',
  'Midnight Blue',
  'Titanium',
  'Black',
  'White',
  'Silver',
  'Blue',
  'Sand',
  'Gray',
  'Grey',
].sort((a, b) => b.length - a.length);

function stripColor(name: string): string {
  let out = name;
  for (const color of COLOR_PHRASES) {
    const re = new RegExp(
      `\\s+${color.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
      'i',
    );
    const next = out.replace(re, '');

    if (next !== out && next.trim().split(/\s+/).length >= 2) {
      out = next;
      break;
    }
  }
  return out;
}

function stripCapacity(name: string): string {
  return name
    .replace(/\s+\d+(?:\.\d+)?\s*(?:GB|TB|MB)\b/gi, ' ')
    .replace(/\s+\d+(?:\.\d+)?\s*(?:Hz|W|mm)\b/gi, ' ')

    .replace(/\s*(\d{1,2}(?:\.\d+)?)\s*(?:"|inch)(?![a-z])/gi, ' $1in');
}

export function modelName(name: string): string {
  let out = stripCapacity(name);
  out = stripColor(out);
  out = stripTechCode(out);
  return dedupeInch(out.replace(/\s+/g, ' ').trim());
}

export function modelNameWithSize(name: string): string {
  let out = name
    .replace(/\s+\d+(?:\.\d+)?\s*(?:GB|TB|MB)\b/gi, ' ')
    .replace(/\s+\d+(?:\.\d+)?\s*(?:Hz|W|mm)\b/gi, ' ')

    .replace(/\s*(\d{1,2}(?:\.\d+)?)\s*(?:"|inch)(?![a-z])/gi, ' $1in');
  out = stripColor(out);
  out = stripTechCode(out);
  return dedupeInch(out.replace(/\s+/g, ' ').trim());
}

function dedupeInch(name: string): string {
  const seen = new Set<string>();
  return name
    .split(' ')
    .filter((t) => {
      const m = t.match(/^(\d{1,2}(?:\.\d+)?)in$/);
      if (!m) return true;
      if (seen.has(m[1])) return false;
      seen.add(m[1]);
      return true;
    })
    .join(' ');
}

function stripTechCode(name: string): string {

  const re = /\s+([A-Z]{1,8}-?\d{2,}[A-Z0-9./-]*)$/;
  const out = name.replace(re, (m, core: string) => {

    const head = core.split('-')[0];
    if (head.length <= 2) return m;
    return '';
  });
  return out.replace(/\s+/g, ' ').trim();
}

export function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

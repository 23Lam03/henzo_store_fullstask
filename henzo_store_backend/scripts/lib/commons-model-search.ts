import { getJson } from './commons-files';

export interface Candidate {
  file: string;
  url: string;
  title: string;
  score: number;
  hit: number;
  coverage: number;
  query: string;
}

const STOP = new Set([
  'pro', 'plus', 'max', 'ultra', 'mini', 'air', 'se', 'gen', 'series',
  'gaming', 'wireless', 'rgb', 'black', 'white', 'silver', 'grey', 'gray',
  'titanium', 'magnetic', 'tkl', 'full', 'size', 'edition', 'combo',
  'package', 'kit', 'new', 'type', 'model', 'with', 'and', 'the', 'for',
]);

const MARKETING = new Set([
  'pc', 'gaming', 'workstation', 'silent', 'stream', 'streaming', 'esports',
  'arena', 'budget', 'starter', 'supreme', 'phantom', 'creator',
  'whisper', 'tournament', 'edition', 'editions', 'flagship', 'basic',
  'advanced', 'premium', 'performance', 'productivity', 'metaverse',
  'ready', 'setup', 'itx', 'mini', 'tower', 'mua', 'ban', 'hang', 'cap',
  'capcut', 'hangcap',
]);

const tokenize = (s: string): string[] =>
  s
    .replace(/[()"]/g, ' ')
    .split(/[^A-Za-z0-9]+/)
    .filter((t) => t.length >= 2 && !STOP.has(t.toLowerCase()))
    .map((t) => t.toLowerCase());

const normTitle = (t: string): string =>
  t
    .replace(/^File:/, '')
    .replace(/\.(jpe?g|png|webp)$/i, '')
    .replace(/[_.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

export function buildQueries(model: string): string[] {
  const raw = model.replace(/["']/g, ' ').replace(/\s+/g, ' ').trim();
  const out: string[] = [];

  const codes = raw.match(/\b(?=[A-Za-z0-9]*[A-Za-z])(?=[A-Za-z0-9]*\d)[A-Za-z0-9]{4,}\b/g) ?? [];
  for (const c of codes) out.push(c);

  const words = raw.split(' ');
  for (let i = 0; i < words.length - 1; i++) {
    const two = words[i] + ' ' + words[i + 1];
    if (/\d/.test(two) && two.length >= 6 && two.length <= 24) out.push(two);
  }

  const toks = tokenize(raw).filter((t) => !MARKETING.has(t));
  const numeric = toks.filter((t) => /\d/.test(t));
  if (numeric.length) {
    const kept: string[] = [];
    for (const w of words) {
      const lw = w.toLowerCase();
      if (MARKETING.has(lw) || STOP.has(lw)) continue;
      if (!/\d/.test(lw) && !kept.length) continue;
      kept.push(w);
    }
    if (kept.length) out.push(kept.join(' '));
    out.push(numeric.join(' '));
  }

  const full = words.filter((w) => !MARKETING.has(w.toLowerCase())).join(' ');
  if (full) out.push(full);
  out.push(raw);

  return [...new Set(out.filter((x) => x.length >= 3))].slice(0, 6);
}

export function requiredToken(model: string): string | null {
  const words = model.replace(/["']/g, ' ').split(/\s+/).filter(Boolean);
  for (const w of words) {
    const lw = w.toLowerCase();
    if (MARKETING.has(lw) || STOP.has(lw)) continue;
    if (w.length < 3) continue;

    if (/^\d+$/.test(w)) continue;
    return lw;
  }
  return null;
}

export function scoreMatch(
  query: string,
  fileTitle: string,
  required?: string | null,
): { score: number; hit: number; coverage: number } {
  const qTokens = tokenize(query);
  if (!qTokens.length) return { score: 0, hit: 0, coverage: 0 };
  const f = normTitle(fileTitle);
  const fTokens = new Set(tokenize(f));

  let hit = 0;
  for (const t of qTokens) if (fTokens.has(t)) hit++;

  const phrase = normTitle(query);
  const phraseHit = phrase.length >= 5 && f.includes(phrase);

  let score = hit * 3;
  if (phraseHit) score += 8;

  const extra = fTokens.size - hit;
  if (extra > 5) score -= 4;

  const coverage = qTokens.length ? hit / qTokens.length : 0;
  return { score, hit, coverage };
}

export async function findCandidates(
  model: string,
  limit = 15,
): Promise<Candidate[]> {
  const seen = new Map<string, Candidate>();
  const req = requiredToken(model);

  for (const q of buildQueries(model)) {
    const d = await getJson(
      `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
        `&generator=search&gsrnamespace=6&gsrlimit=${limit}` +
        `&gsrsearch=${encodeURIComponent(`intitle:"${q}" filetype:bitmap`)}` +
        `&prop=imageinfo&iiprop=url|mime&iiurlwidth=1000`,
    );
    const pages = d?.query?.pages ?? {};
    for (const p of Object.values<any>(pages)) {
      const ii = (p.imageinfo ?? [])[0];
      if (!ii || !/^image\/(jpeg|png|webp)$/.test(String(ii.mime))) continue;
      const url = String(ii.thumburl ?? ii.url);
      const title = String(p.title ?? '').replace(/^File:/, '');

      if (req && !normTitle(title).includes(req)) continue;
      const { score, hit, coverage } = scoreMatch(q, title);
      if (hit < 1) continue;
      const file = (url.split('/').pop() ?? title).replace(/^\d+px-/, '');
      const prev = seen.get(file);
      if (!prev || prev.score < score) {
        seen.set(file, { file, url, title, score, hit, coverage, query: q });
      }
    }
  }

  return [...seen.values()].sort((a, b) => b.score - a.score).slice(0, limit);
}

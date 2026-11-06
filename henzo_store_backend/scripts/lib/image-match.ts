
export const STOP_TOKENS = new Set([
  'pro', 'plus', 'max', 'ultra', 'mini', 'air', 'se', 'gen', 'series',
  'gaming', 'wireless', 'rgb', 'black', 'white', 'silver', 'grey', 'gray',
  'titanium', 'magnetic', 'tkl', 'full', 'size', 'edition', 'combo',
  'package', 'kit', 'new', 'type', 'model', 'with', 'and', 'the', 'for',
  'inch', 'gb', 'tb', 'dung', 'luu', 'cho', 'gia', 're', 'sieu', 'toc',
  'phan', 'bo', 'mau', 'do', 'den', 'trang', 'xanh', 'hang', 'cap',
]);

export const MARKETING_TOKENS = new Set([
  'pc', 'gaming', 'workstation', 'silent', 'stream', 'streaming', 'esports',
  'arena', 'budget', 'starter', 'supreme', 'phantom', 'creator', 'whisper',
  'tournament', 'flagship', 'basic', 'advanced', 'premium', 'performance',
  'productivity', 'metaverse', 'ready', 'setup', 'itx', 'mini', 'tower',
]);

export function tokenize(text: string): string[] {
  return (text ?? '')
    .replace(/[()"]/g, ' ')
    .split(/[^A-Za-z0-9]+/)
    .filter((t) => t.length >= 2 && !STOP_TOKENS.has(t.toLowerCase()))
    .map((t) => t.toLowerCase());
}

export function normalizeFileTitle(title: string): string {
  return (title ?? '')
    .replace(/^File:/, '')
    .replace(/\.(jpe?g|png|webp|tiff)$/i, '')
    .replace(/[_.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function fileNameFromUrl(url: string): string {
  return decodeURIComponent(url.split('?')[0]?.split('/').pop() ?? '')
    .replace(/^\d+px-/, '');
}

export function fileMatchesName(name: string, urlOrFile: string): boolean {
  const raw = urlOrFile.includes('http')
    ? fileNameFromUrl(urlOrFile)
    : urlOrFile;
  const f = normalizeFileTitle(raw);
  const fTokens = new Set(tokenize(f));
  return tokenize(name).some((t) =>
    t.length <= 3 ? f.includes(t) : fTokens.has(t),
  );
}

export function fileMatchesAll(name: string, urlOrFile: string): boolean {
  const raw = urlOrFile.includes('http')
    ? fileNameFromUrl(urlOrFile)
    : urlOrFile;
  const f = normalizeFileTitle(raw);
  const fTokens = new Set(tokenize(f));
  const toks = tokenize(name).filter((t) => t.length >= 3);
  if (!toks.length) return false;
  return toks.every((t) => fTokens.has(t));
}

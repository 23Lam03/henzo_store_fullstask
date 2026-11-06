import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { modelName as normalizeModelName, modelNameWithSize } from './lib/model-name';

const UA = 'henzo-store/1.0 (model image resolver; dev@henzo.local)';

const STOPWORDS = new Set([
  'pro', 'plus', 'max', 'ultra', 'mini', 'new', 'series', 'edition',
  'wireless', 'black', 'white', 'graphite', 'silver', 'space', 'gray',
  'grey', 'titanium', 'core', 'mobile', 'personal', 'computer', 'gaming',
  'flagship', 'refresh', 'one', 'two', 'x', 'xr', 'fe', 'optical',
  'oled', 'qhd', 'uhd', 'hdr', 'rgb', 'usb', 'type', 'c', 'ips', 'led',
]);

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function modelName(name: string): string {
  return normalizeModelName(name);
}

function keyTokens(name: string): string[] {
  return norm(name)
    .split(' ')
    .filter((t) => t.length > 0 && !STOPWORDS.has(t));
}

function isModelCode(t: string): boolean {
  if (/[a-z]+[0-9]/.test(t)) return true;
  if (/^[0-9]{4,}[a-z]?$/.test(t)) return true;
  if (/^[0-9]{1,2}$/.test(t)) return true;
  return false;
}

const DISTINCT_SUFFIX = new Set([
  'ultra', 'pro', 'max', 'plus', 'mini', 'lite', 'ti', 'fe', 'se',
  'air', 'xs', 'xr', 'super',
]);

const TIER_AFTER_CODE = new Set([
  'ti', 'super', 'max', 'ultra', 'plus', 'pro', 's', 'xt',
]);

const BRAND_GROUPS: Record<string, string[]> = {
  logitech: ['logitech', 'logi'],
  asus: ['asus', 'rog', 'tuf', 'vivobook', 'zenbook', 'proart'],
  msi: ['msi', 'micro star'],
  lg: ['lg'],
  hp: ['hp', 'hewlett', 'omen', 'victus'],
  gigabyte: ['gigabyte', 'aorus'],
  zowie: ['zowie', 'benq'],
  nvidia: ['nvidia', 'geforce'],
  corsair: ['corsair'],
  razer: ['razer'],
  apple: ['apple', 'macbook', 'ipad', 'iphone', 'airpods'],
  samsung: ['samsung', 'galaxy', 'odyssey'],
  dell: ['dell', 'alienware', 'xps'],
  lenovo: ['lenovo', 'thinkpad', 'ideapad', 'legion'],
  acer: ['acer', 'predator', 'nitro'],
  steam: ['steam', 'valve'],
  ducky: ['ducky'],
  keychron: ['keychron'],
  steelseries: ['steelseries', 'steelseries arctis'],
  hyperx: ['hyperx', 'cloud'],
  benq: ['benq'],
};

function hasForeignBrand(title: string, brand: string): boolean {
  const t = norm(title);
  const own = new Set(
    brand
      .toLowerCase()
      .split(/[\s&]+/)
      .filter(Boolean)
      .map((p) => norm(p)),
  );

  const ownGroups = new Set<string>();
  const ownTokens = new Set<string>(own);
  for (const [group, members] of Object.entries(BRAND_GROUPS)) {
    if (!members.some((m) => own.has(m))) continue;
    ownGroups.add(group);
    for (const m of members) ownTokens.add(m);
  }

  for (const [group, members] of Object.entries(BRAND_GROUPS)) {
    if (ownGroups.has(group)) continue;
    for (const m of members) {

      if (new RegExp(`(^|\\s)${m}(\\s|$)`).test(t)) return true;
    }
  }
  return false;
}

function hasBrandToken(title: string, brand: string): boolean {
  const t = norm(title);
  const own = brand
    .toLowerCase()
    .split(/[\s&]+/)
    .filter(Boolean)
    .map((p) => norm(p));
  if (!own.length) return false;

  const tokens = new Set<string>(own);
  for (const [group, members] of Object.entries(BRAND_GROUPS)) {
    if (!members.some((m) => own.includes(m))) continue;
    for (const m of members) tokens.add(m);
  }

  for (const tk of tokens) {
    if (new RegExp(`(^|\\s)${tk}(\\s|$)`).test(t)) return true;
  }
  return false;
}

function inchOf(token: string): string | null {
  const m = token.match(/^(\d{1,2})in$/);
  return m ? m[1] : null;
}

export function isMatch(title: string, name: string): boolean {
  const tSquish = norm(title).replace(/ /g, '');
  const tTokens = keyTokens(title);
  const tTokenSet = new Set(tTokens);
  const allNameTokens = keyTokens(name);

  const nTokens = allNameTokens.filter((t) => !inchOf(t));
  const codes = nTokens.filter(isModelCode);
  for (const c of codes) {
    if (/^[0-9]+$/.test(c)) {
      if (!tTokenSet.has(c)) return false;
    } else if (!tSquish.includes(c)) {
      return false;
    }
  }

  const rawTokensOf = (s: string): string[] => norm(s).split(' ').filter(Boolean);
  const titleSuffixes = rawTokensOf(title).filter((t) => DISTINCT_SUFFIX.has(t));
  if (titleSuffixes.length) {
    const nameSuffixes = new Set(rawTokensOf(name).filter((t) => DISTINCT_SUFFIX.has(t)));
    for (const s of titleSuffixes) {
      if (!nameSuffixes.has(s)) return false;
    }
  }

  const sizeOf = (s: string): string | null => {
    const m = norm(s).match(/\b(\d{1,2})\s*(?:in\b|inch)/);
    return m ? m[1] : null;
  };
  const tSize = sizeOf(title);
  const nSize = sizeOf(name);
  if (tSize && nSize && tSize !== nSize) return false;

  {
    const tRaw = rawTokensOf(title);
    const nRaw = rawTokensOf(name);
    const tierAfter = (tokens: string[]): string | null => {
      for (let i = 0; i < tokens.length; i++) {
        if (!/^\d{3,4}$/.test(tokens[i])) continue;
        for (let j = i + 1; j < tokens.length; j++) {
          if (TIER_AFTER_CODE.has(tokens[j])) return tokens[j];

          if (/^\d+$/.test(tokens[j])) continue;
          break;
        }
      }
      return null;
    };
    const tTier = tierAfter(tRaw);
    const nTier = tierAfter(nRaw);
    if (nTier && tTier !== nTier) return false;
  }

  for (const tk of nTokens) {
    const inch = inchOf(tk);
    if (!inch) continue;
    if (tSize && tSize !== inch) return false;
  }

  let lineHits = 0;
  for (const tk of nTokens) {

    if (tk.length === 1) continue;
    if (isModelCode(tk)) {
      lineHits++;
      continue;
    }
    if (tTokenSet.has(tk)) {
      lineHits++;
      continue;
    }

    if (tTokens.some((tt) => tt.startsWith(tk) && tk.length >= 3)) {
      lineHits++;
      continue;
    }

    if (!isBrandToken(tk)) return false;
  }

  const brandTokens = nTokens.filter(isBrandToken);
  if (brandTokens.length) {
    const brandPresent = brandTokens.every((b) =>
      tTokenSet.has(b) || tTokens.some((tt) => tt.startsWith(b) && b.length >= 3),
    );
    const need = brandPresent ? 2 : 3;
    if (lineHits < need) return false;
  } else if (lineHits < 2) {
    return false;
  }
  return true;
}

const BRAND_TOKENS = new Set([
  'apple', 'samsung', 'asus', 'msi', 'logitech', 'razer', 'corsair',
  'dell', 'hp', 'lenovo', 'acer', 'xiaomi', 'oppo', 'vivo', 'google',
  'realme', 'nokia', 'oneplus', 'honor', 'tecno', 'gigabyte', 'microsoft',
  'huawei', 'lg', 'benq', 'viewsonic', 'aoc', 'philips', 'steelseries',
  'hyperx', 'roccat', 'jbl', 'bose', 'elgato', 'nvidia', 'amd', 'intel',
  'seagate', 'kingston', 'crucial', 'toshiba', 'wacom', 'endgame',
  'custom', 'deepcool', 'cooler', 'master', 'gskill', 'western', 'digital',
]);

function isBrandToken(t: string): boolean {
  return BRAND_TOKENS.has(t);
}

function isMultiProductPhoto(title: string): boolean {

  const raw = title.toLowerCase();
  const t = norm(title);

  const connectors = [' and ', ' with ', ' vs ', ' versus ', ' & ', ' + '];
  const PRODUCT_WORDS =
    /(iphone|ipad|macbook|galaxy|pixel|watch|airpods|laptop|monitor|keyboard|mouse|headset|buds|earbuds|earphone|tablet|smartphone|phone|camera|tv|console|playstation|xbox|nintendo|router|printer|projector)/;
  for (const c of connectors) {
    const idx = raw.indexOf(c);
    if (idx < 0) continue;

    const right = t.slice(idx + c.length);
    if (PRODUCT_WORDS.test(right)) {
      return true;
    }
  }
  return false;
}

const NON_MODEL_CODE_PREFIX =
  /^(yr|pn|pnr|sku|art|part|ref|cat|cp|dc|ac|mc|uc|ec|it|no|img|dsc|dscf|px|ph|ex|hs|ss|cm|wm|res|z|hd|sd|pj|eis|dei|sm|so|mk|ii|iii|iv|v|app|clip)[0-9]/;

function conflictingModelCode(title: string, name: string): boolean {
  const nameTokens = new Set(keyTokens(name));
  for (const tk of keyTokens(title)) {
    if (nameTokens.has(tk)) continue;
    if (NON_MODEL_CODE_PREFIX.test(tk)) continue;

    if (/^[a-z]{1,2}[0-9]{1,4}$/.test(tk)) return true;

    if (/^[a-z]{1,3}[0-9]{1,3}[a-z]{1,3}$/.test(tk)) return true;
  }
  return false;
}

export function isProductPhoto(
  title: string,
  brand: string,
  model?: string,
): boolean {

  const t = norm(title);

  const rawLower = title.toLowerCase();
  const bad = [
    'logo', 'wordmark', 'banner', 'poster', 'icon', 'flag', 'map',
    'diagram', 'chart', 'screenshot', 'graph', 'seal', 'stamp', 'coin',
    'sign', 'symbol', 'headquarters', 'store', 'office', 'box',
    'package', 'retail', 'unboxing', 'comparison', 'review', 'vector',

    'list of', 'comparison of', 'timeline', 'specification',

    'price', 'specs', 'spec sheet', 'table of', 'infographic',

    'warranty', 'manual', 'user guide', 'receipt', 'invoice', 'boit',

    'hard disk', 'harddisk', 'teardown', 'disassembled', 'exploded',
    'schematic', 'circuit board', 'main board', 'mainboard', 'carte',
    'motherboard', 'logic board', 'serial tag', 'label',

    'ps4', 'ps5', 'playstation', 'xbox', 'nintendo', 'steam machine',

    'oculus', 'rift cv1', 'valve index', 'htc vive', 'ps vr',

    'bad omen', 'zenscreen', 'with computer set', 'computer set',

    'guide', 'poster of', 'advertisement', 'ad for', 'promotion',

    'laptop keyboard', 'laptop-keyboard', 'keyboard close', 'keyboard top',
    'apple-keyboard', 'mechanical switch', 'switch razer', 'keycap',

    'talking at', 'talking,', 'on the stage', 'at the booth', 'booth',
    'at aorus', 'at computex', 'at ksp', 'playing sonic', 'with jkr',
    'talking with', 'interview', 'handshake', 'in hands on',

    'broken screen', 'broken', 'damaged', 'cracked', 'defect',

    'aptiva', 'impressora', 'epson stylus', 'ibm 486', '486 com',
    'crt monitor', 'floppy', 'vintage computer',

    'computer set', 'setup', 'workstation on', 'on the desk', 'desk setup',
    'keyboard-', 'laptop on a stand', 'museum',

    'oil spill', 'deepwater', 'horizon',

    'open case', 'battery', 'at platform', 'train station', 'in the wild',
    'interior', 'chassis', 'cooling fan', 'power supply', 'cable close',
  ];

  const rawBad = ['机型价格', '性能数据', '对比图', '参数对比', '配置'];
  for (const b of bad) if (t.includes(b)) return false;
  for (const b of rawBad) if (rawLower.includes(b)) return false;

  if (model && conflictingModelCode(title, model)) return false;

  if (isMultiProductPhoto(title)) return false;

  if (brand && hasForeignBrand(title, brand)) return false;
  return true;
}

function isProductPage(title: string): boolean {
  const t = title.toLowerCase();
  const bad = [
    'list of', 'comparison of', 'timeline', 'index of', 'outline of',
    'history of', 'category:', 'template:', 'portal:',
  ];
  for (const b of bad) if (t.includes(b)) return false;
  return true;
}

function stripTechCode(base: string): string {
  return base
    .replace(/\s+[A-Z]{1,6}[-]?\d{2,}[A-Z0-9./-]*\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function variants(name: string): string[] {
  const base = modelName(name);
  const out = [base];
  const noCode = stripTechCode(base);
  if (noCode && noCode !== base) out.push(noCode);

  const noInch = base.replace(/\s*\d{1,2}(?:\.\d+)?in\b/g, '').trim();
  if (noInch && noInch !== base) out.push(noInch);

  const bare = noInch.replace(/\s+[A-Z]{1,8}-?\d{2,}[A-Z0-9./-]*\b/g, '').trim();
  if (bare && bare !== base && bare !== noInch) out.push(bare);
  return [...new Set(out.filter(Boolean))];
}

function commonsQueries(name: string, brand: string): string[] {
  const base = modelName(name);
  const tokens = base.split(' ').filter(Boolean);
  const brandFirst = brand.split(' ')[0].toLowerCase();
  const rest = tokens[0]?.toLowerCase() === brandFirst ? tokens.slice(1) : [...tokens];
  const out: string[] = [base];

  if (rest.length && rest.join(' ') !== base) out.push(rest.join(' '));

  for (let len = rest.length - 1; len >= 2; len--) {
    const q = rest.slice(0, len).join(' ');
    if (q && !out.includes(q)) out.push(q);
  }

  const hyphen = base.replace(/(\d{1,2}(?:\.\d+)?)in\b/g, '$1-inch');
  if (hyphen && hyphen !== base) out.push(hyphen);

  const codes = keyTokens(base).filter(isModelCode);
  if (codes.length) {

    const idx = tokens.findIndex((t) => isModelCode(norm(t)));
    if (idx > 0) {
      const withPrev = tokens.slice(Math.max(0, idx - 1), idx + 1).join(' ');
      if (withPrev && !out.includes(withPrev)) out.push(withPrev);
    }
    if (codes.length === 1 && !out.includes(codes[0])) out.push(codes[0]);
  }

  if (rest.length >= 2) {
    const last2 = rest.slice(-2).join(' ');
    if (last2 && !out.includes(last2)) out.push(last2);
  }
  return [...new Set(out.filter(Boolean))];
}

const wait = (ms: number) => new Promise((s) => setTimeout(s, ms));

async function getJson(url: string, attempt = 3): Promise<any> {
  for (let a = 0; a < attempt; a++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } });
      if (r.status === 429) {
        await wait(2500 * (a + 1));
        continue;
      }
      if (!r.ok) return null;
      return await r.json();
    } catch {
      await wait(900);
    }
  }
  return null;
}

async function mediaListImages(
  title: string,
  name: string,
): Promise<Array<{ url: string; title: string }>> {
  const d = await getJson(
    `https://en.wikipedia.org/api/rest_v1/page/media-list/${encodeURIComponent(title)}`,
  );
  const items = d?.items ?? [];
  const out: Array<{ url: string; title: string }> = [];

  if (!isProductPage(title)) return out;

  for (const it of items) {
    if (it?.type !== 'image') continue;
    const srcset = it?.srcset ?? [];
    const pick =
      srcset.find((s: any) => s.scale === 2) ??
      srcset.find((s: any) => s.scale === 1) ??
      srcset[0];
    if (!pick?.src) continue;
    const url = String(pick.src).startsWith('//')
      ? `https:${pick.src}`
      : String(pick.src);
    const fileTitle = String(it.title ?? '');

    if (/vector|logo|icon|diagram|chart|screenshot|graph|\.svg$/i.test(fileTitle)) {
      continue;
    }
    if (!isMatch(fileTitle, name)) continue;
    out.push({ url, title: fileTitle });
  }
  return out;
}
async function wikiThumb(
  title: string,
  name: string,
): Promise<{ url: string; title: string } | null> {
  const d = await getJson(
    `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages` +
      `&piprop=thumbnail&pithumbsize=900&redirects=1&titles=${encodeURIComponent(title)}`,
  );
  for (const p of Object.values<any>(d?.query?.pages ?? {})) {
    const src = p?.thumbnail?.source;
    if (!src) continue;
    const pageTitle = String(p.title ?? '');
    if (!isMatch(pageTitle, name)) continue;

    if (!isProductPage(pageTitle)) continue;
    return { url: String(src), title: pageTitle };
  }
  return null;
}

async function wikiSearchTitles(query: string): Promise<string[]> {
  const d = await getJson(
    `https://en.wikipedia.org/w/api.php?action=query&format=json&list=search` +
      `&srsearch=${encodeURIComponent(query)}&srlimit=6`,
  );
  return (d?.query?.search ?? [])
    .map((x: any) => String(x.title ?? ''))
    .filter((t: string) => isProductPage(t));
}

async function commonsSearch(
  query: string,
  brand: string,
  name: string,
): Promise<Array<{ title: string; url: string }>> {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(query)}` +
      `&gsrlimit=20&prop=imageinfo&iiprop=url|mime&iiurlwidth=900`,
  );
  const out: Array<{ title: string; url: string }> = [];
  for (const p of Object.values<any>(d?.query?.pages ?? {})) {
    const ii = (p.imageinfo ?? [])[0];
    if (!ii) continue;
    if (ii.mime && !/^image\/(jpeg|png|webp)$/.test(ii.mime)) continue;
    const url: string = ii.thumburl ?? ii.url;
    if (!url) continue;
    const t = String(p.title ?? '');
    if (!isProductPhoto(t, brand)) continue;
    if (!isMatch(t, name)) continue;
    out.push({ title: t, url });
  }
  return out;
}

function strongModelCodes(model: string): string[] {
  return keyTokens(model).filter((t) => {
    if (t.length < 3) return false;
    if (/^[a-z]{1,3}[0-9]{1,4}[a-z]?$/.test(t)) return true;
    if (/^[0-9]{3,}[a-z]?$/.test(t)) return true;
    return false;
  });
}

function intitleQueries(model: string): string[] {
  const base = modelName(model);
  const tokens = base.split(' ').filter(Boolean);
  const codes = strongModelCodes(base);

  const out: string[] = [];

  for (const code of codes.slice(0, 3)) {
    const ci = tokens.findIndex((t) => norm(t) === code);
    if (ci > 0) {
      out.push(`${tokens[ci - 1]} ${code}`);
      if (ci > 1) out.push(`${tokens[ci - 2]} ${tokens[ci - 1]} ${code}`);
    }

    out.push(code.toUpperCase());

    const spaced = code.replace(/^([a-z]+)(\d+)$/i, '$1 $2');
    if (spaced !== code) out.push(spaced.toUpperCase());
  }

  const squished = base.replace(/\s+/g, '');
  if (squished.length >= 5) out.push(squished);

  return [...new Set(out.filter((q) => q && q.length >= 3))].slice(0, 6);
}

export function isIntitleMatch(
  title: string,
  brand: string,
  model: string,
): boolean {
  if (!isProductPhoto(title, brand, model)) return false;

  const codes = strongModelCodes(model);
  if (!codes.length) return false;

  const tSquish = norm(title).replace(/ /g, '');
  const hit = codes.some((c) => tSquish.includes(c.replace(/\s+/g, '')));
  if (!hit) return false;

  const tTokens = new Set(norm(title).split(' ').filter(Boolean));

  const rawNameTokens = norm(model).split(' ').filter(Boolean);
  const contextTokens = rawNameTokens.filter(
    (tk) =>
      !isModelCode(tk) &&
      !isBrandToken(tk) &&
      !STOPWORDS.has(tk) &&
      tk.length >= 3,
  );
  const extraContext = rawNameTokens.filter(
    (tk) =>
      tk.length >= 3 &&
      STOPWORDS.has(tk) &&

      DISTINCT_SUFFIX.has(tk),
  );
  const brandOk = hasBrandToken(title, brand);
  const contextOk = [...contextTokens, ...extraContext].some(
    (tk) =>
      tTokens.has(tk) ||
      [...tTokens].some((tt) => tt.startsWith(tk) && tk.length >= 4),
  );
  if (!brandOk && !contextOk) return false;

  if (conflictingModelCode(title, model)) return false;

  {
    const raw = (s: string): string[] => norm(s).split(' ').filter(Boolean);
    const tierAfter = (tokens: string[]): string | null => {
      for (let i = 0; i < tokens.length; i++) {
        if (!/^\d{3,4}$/.test(tokens[i])) continue;
        for (let j = i + 1; j < tokens.length; j++) {
          if (TIER_AFTER_CODE.has(tokens[j])) return tokens[j];
          if (/^\d+$/.test(tokens[j])) continue;
          break;
        }
      }
      return null;
    };
    const tTier = tierAfter(raw(title));
    const nTier = tierAfter(raw(model));
    if (nTier && tTier !== nTier) return false;
  }

  return true;
}

async function commonsIntitleImages(
  model: string,
  brand: string,
): Promise<Array<{ title: string; url: string }>> {
  const out: Array<{ title: string; url: string }> = [];
  const seen = new Set<string>();

  const codes = strongModelCodes(model);
  if (!codes.length) return out;

  for (const q of intitleQueries(model)) {
    if (out.length >= 6) break;
    const d = await getJson(
      `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
        `&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(
          `intitle:${q}`,
        )}` +
        `&gsrlimit=20&prop=imageinfo&iiprop=url|mime&iiurlwidth=900`,
    );
    for (const p of Object.values<any>(d?.query?.pages ?? {})) {
      if (out.length >= 6) break;
      const ii = (p.imageinfo ?? [])[0];
      if (!ii) continue;
      if (ii.mime && !/^image\/(jpeg|png|webp)$/.test(ii.mime)) continue;
      const url: string = ii.thumburl ?? ii.url;
      if (!url || seen.has(url)) continue;
      const t = String(p.title ?? '');
      if (!isIntitleMatch(t, brand, model)) continue;
      seen.add(url);
      out.push({ title: t, url });
    }
  }
  return out;
}

async function commonsByModelCode(
  model: string,
  brand: string,
): Promise<Array<{ title: string; url: string }>> {
  const codes = keyTokens(model).filter(isModelCode);

  const tokens = modelName(model).split(' ').filter(Boolean);

  const out: Array<{ title: string; url: string }> = [];
  const seen = new Set<string>();

    const runQuery = async (q: string): Promise<void> => {
    if (!q || out.length >= 8) return;
    const d = await getJson(
      `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
        `&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(q)}` +
        `&gsrlimit=20&prop=imageinfo&iiprop=url|mime&iiurlwidth=900`,
    );
    for (const p of Object.values<any>(d?.query?.pages ?? {})) {
      const ii = (p.imageinfo ?? [])[0];
      if (!ii) continue;
      if (ii.mime && !/^image\/(jpeg|png|webp)$/.test(ii.mime)) continue;
      const url: string = ii.thumburl ?? ii.url;
      if (!url || seen.has(url)) continue;
      const t = String(p.title ?? '');
      if (!isProductPhoto(t, brand)) continue;
      if (!isMatch(t, model)) continue;
      seen.add(url);
      out.push({ title: t, url });
    }
  };

  await runQuery(model);
  if (out.length >= 4) return out;

  for (const q of intitleQueries(model)) {
    await runQuery(q);
    if (out.length >= 4) return out;
  }

  const sized = modelNameWithSize(model);
  if (sized && sized !== model) {
    await runQuery(sized);
    if (out.length >= 4) return out;
  }

  const hyphenInch = model.replace(/(\d{1,2}(?:\.\d+)?)in\b/g, '$1-inch');
  if (hyphenInch !== model) {
    await runQuery(hyphenInch);
    if (out.length >= 4) return out;
  }

  const noInch = model.replace(/\s*\d{1,2}(?:\.\d+)?in\b/g, '').trim();
  if (noInch && noInch !== model) {
    await runQuery(noInch);
    if (out.length >= 4) return out;
  }

  const brandFirst = brand.split(' ')[0].toLowerCase();
  const rest =
    tokens[0]?.toLowerCase() === brandFirst ? tokens.slice(1) : tokens;
  if (rest.length && rest.join(' ') !== model) {
    await runQuery(rest.join(' '));
  }
  if (out.length >= 4) return out;

  for (const code of codes.slice(0, 2)) {

    const queries = [code, code.replace(/([a-z])(\d)/i, '$1 $2')];

    const ci = tokens.findIndex((t) => norm(t) === code);
    if (ci > 0) {
      const pair = tokens[ci - 1] + ' ' + tokens[ci];
      queries.push(pair);
      if (ci > 1) {
        queries.push(tokens[ci - 2] + ' ' + pair);
      }
    }

    for (const q of queries.slice(0, 3)) {
      if (out.length >= 8) break;
      await runQuery(q);
    }
    if (out.length >= 4) break;
  }
  return out;
}

function matchesProductLine(title: string, name: string): boolean {
  const tTokens = new Set(keyTokens(title));
  const nTokens = keyTokens(name);

  const distinctive = nTokens.filter(
    (tk) =>
      !isBrandToken(tk) && !isModelCode(tk) && !STOPWORDS.has(tk) && tk.length >= 3,
  );
  if (!distinctive.length) return false;
  return distinctive.some(
    (tk) =>
      tTokens.has(tk) ||
      [...tTokens].some((tt) => tt.startsWith(tk) && tk.length >= 3),
  );
}

const BRAND_WIKI_PAGES: Record<string, string[]> = {
  ASUS: ['Asus ROG', 'Asus'],
  Acer: ['Acer Gaming', 'Acer'],
  Apple: ['IPhone', 'Apple Inc.'],
  Samsung: ['Samsung Galaxy', 'Samsung Electronics'],
  Xiaomi: ['Xiaomi Corporation', 'Xiaomi'],
  Oppo: ['Oppo', 'Oppo (company)'],
  Vivo: ['Vivo (company)', 'Vivo'],
  Realme: ['Realme', 'Realme (company)'],
  Honor: ['Honor (company)', 'Honor (smartphone)'],
  Oneplus: ['OnePlus', 'OnePlus (company)'],
  Google: ['Google Pixel', 'Pixel (smartphone)'],
  Microsoft: ['Microsoft Surface', 'Surface (Microsoft)'],
  Lenovo: ['Lenovo', 'ThinkPad'],
  Dell: ['Dell', 'Dell XPS'],
  Hp: ['HP Inc.', 'HP Omen'],
  Msi: ['Micro-Star International', 'MSI (company)'],
  Gigabyte: ['Gigabyte Technology', 'AORUS'],
  Logitech: ['Logitech', 'Logitech Gaming Software'],
  Razer: ['Razer Inc.', 'Razer'],
  Corsair: ['Corsair Gaming', 'Corsair (company)'],
  Steelseries: ['SteelSeries', 'SteelSeries Arctis'],
  Hyperx: ['HyperX', 'HyperX Cloud'],
  Keychron: ['Keychron', 'Keychron (company)'],
  Roccat: ['Roccat', 'ROCCAT'],
  Zowie: ['Zowie (brand)', 'Zowie'],
  Elgato: ['Elgato', 'Elgato Gaming'],
  Endgame: ['Endgame Gear', 'Endgame'],
  Nvidia: ['GeForce RTX 40 series', 'GeForce'],
  Amd: ['Ryzen 7', 'Ryzen 5', 'Ryzen 9', 'AMD Ryzen'],
  Intel: ['List of Intel Core processors', 'Intel Core'],
  Seagate: ['Seagate Technology', 'Seagate'],
  Wd: ['Western Digital', 'WD Red'],
  Crucial: ['Crucial (company)', 'Crucial Technology'],
  Kingston: ['Kingston Technology', 'Kingston Fury'],
  Wacom: ['Wacom', 'Wacom (company)'],
  Bose: ['Bose Corporation', 'Bose'],
  Jbl: ['JBL (company)', 'JBL'],
  Philips: ['Philips', 'Philips monitors'],
  Benq: ['BenQ', 'BenQ Corporation'],
  Viewsonic: ['ViewSonic', 'ViewSonic Corporation'],
  Lg: ['LG Electronics', 'LG (company)'],
  Aoc: ['AOC (company)', 'AOC International'],
  Deepcool: ['DeepCool', 'DeepCool (company)'],
  Coolermaster: ['Cooler Master', 'Cooler Master Corporation'],
  Gskill: ['G.Skill', 'G.Skill Trident Z'],
  Nokia: ['Nokia', 'Nokia (company)'],
  Tecno: ['Tecno Mobile', 'Tecno'],
  Jowacom: [],
};

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Điện thoại': ['iphone', 'galaxy', 'pixel', 'phone', 'oneplus', 'oppo', 'vivo', 'xiaomi', 'redmi', 'poco', 'honor', 'realme', 'nokia', 'tecno', 'huawei', 'sony'],
  Tablet: ['ipad', 'galaxy tab', 'tablet', 'matepad', 'xiaomi pad', 'surface pro'],
  Laptop: ['laptop', 'notebook', 'macbook', 'vivobook', 'zenbook', 'ideapad', 'thinkpad', 'yoga', 'spectre', 'xps', 'inspiron', 'omen', 'victus', 'predator', 'nitro', 'swift', 'aura', 'rog', 'tuf', 'alienware', 'legion', 'loq', 'katana', 'stealth', 'raider', 'titan', 'gram', 'matebook', 'surface laptop'],
  'Màn hình': ['monitor', 'display', 'screen', 'agon', 'odyssey', 'ultragear', 'viewfinity', 'proart', 'alienware aw', 'benq', 'viewsonic', 'philips', 'aoc'],
  'PC Gaming': ['gaming pc', 'gaming computer', 'tower', 'desktop', 'workstation'],
  Chuột: ['mouse', 'mice', 'viper', 'deathadder', 'basilisk', 'g502', 'superlight', 'kronos', 'kain', 'sensei', 'abyss'],
  'Bàn phím': ['keyboard', 'keychron', 'blackwidow', 'huntsman', 'apex pro', 'k70', 'k100', 'k65', 'corsair', 'g915', 'hhkb', 'realforce'],
  'Tai nghe': ['headset', 'headphones', 'arctis', 'cloud iii', 'cloud alpha', 'quantum', 'tour one', 'quietcomfort', 'wh-1000xm', 'airpods max'],
  'Phụ kiện': ['charger', 'power bank', 'power adapter', 'hub', 'stream deck', 'wave', 'hd60', 'webcam', 'c920', 'brio', 'streamcam', 'cable'],
};

const CATEGORY_TYPE_WORDS: Record<string, string[]> = {
  'Điện thoại': ['smartphone', 'phone', 'iphone', 'handset'],
  Tablet: ['tablet', 'ipad'],
  Laptop: ['laptop', 'notebook', 'macbook', 'ultrabook'],
  'Màn hình': ['monitor', 'display', 'screen'],
  'PC Gaming': ['computer', 'desktop', 'workstation', 'tower'],
  Chuột: ['mouse', 'mice'],
  'Bàn phím': ['keyboard'],
  'Tai nghe': ['headset', 'headphones', 'earphones', 'earbuds'],
  'Phụ kiện': ['charger', 'power bank', 'adapter', 'hub', 'webcam', 'cable'],
};

function matchesCategory(title: string, categoryName: string): boolean {
  const kws = CATEGORY_KEYWORDS[categoryName];
  if (!kws?.length) return true;
  const t = norm(title);
  return kws.some((k) => t.includes(k));
}

async function brandLineImages(
  brand: string,
  name: string,
  categoryName: string,
): Promise<Array<{ title: string; url: string }>> {
  const pages = BRAND_WIKI_PAGES[brand] ?? [];
  const out: Array<{ title: string; url: string }> = [];
  const seen = new Set<string>();

  for (const page of pages) {

    const d = await getJson(
      `https://en.wikipedia.org/api/rest_v1/page/media-list/${encodeURIComponent(page)}`,
    );
    for (const it of d?.items ?? []) {
      if (it?.type !== 'image') continue;
      const srcset = it?.srcset ?? [];
      const pick =
        srcset.find((s: any) => s.scale === 2) ??
        srcset.find((s: any) => s.scale === 1) ??
        srcset[0];
      if (!pick?.src) continue;
      const url = String(pick.src).startsWith('//')
        ? `https:${pick.src}`
        : String(pick.src);
      const fileTitle = String(it.title ?? '');
      if (seen.has(url)) continue;
      if (/vector|logo|icon|diagram|chart|screenshot|graph|\.svg$/i.test(fileTitle)) {
        continue;
      }
      if (!isProductPhoto(fileTitle, brand)) continue;
      if (!matchesCategory(fileTitle, categoryName)) continue;

      if (!hasBrandToken(fileTitle, brand)) continue;

      if (!matchesProductLine(fileTitle, name)) continue;

      if (/\b(iphone|ipad|ipod|airpods|apple watch)\b/i.test(fileTitle)) {

        if (!/ipad/i.test(name)) continue;
      }
      seen.add(url);
      out.push({ title: fileTitle, url });
    }
    if (out.length >= 3) break;
  }
  return out;
}

async function commonsCategoryImages(
  model: string,
  brand: string,
  categoryName: string,
): Promise<Array<{ title: string; url: string }>> {
  const out: Array<{ title: string; url: string }> = [];
  const seen = new Set<string>();

  const cands = [
    ...categoryCandidates(model, brand),
    ...(await findCommonsCategories(model, brand)),
  ];
  for (const cat of cands) {
    if (out.length >= 6) break;
    const d = await getJson(
      `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
        `&list=categorymembers&cmtitle=${encodeURIComponent(`Category:${cat}`)}` +
        `&cmtype=file&cmlimit=50`,
    );
    const members: string[] = (d?.query?.categorymembers ?? [])
      .map((x: any) => String(x.title ?? ''))
      .filter(Boolean);
    if (!members.length) continue;

    const files = members
      .filter((t) => /\.(jpe?g|png|webp)$/i.test(t) && !/\.svg$/i.test(t))
      .slice(0, 30);
    if (!files.length) continue;
    const info: any = await getJson(
      `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
        `&titles=${encodeURIComponent(files.join('|'))}` +
        `&prop=imageinfo&iiprop=url|mime&iiurlwidth=900`,
    );
    for (const p of Object.values<any>(info?.query?.pages ?? {})) {
      if (out.length >= 12) break;
      const ii = (p.imageinfo ?? [])[0];
      if (!ii) continue;
      if (ii.mime && !/^image\/(jpeg|png|webp)$/.test(ii.mime)) continue;
      const url: string = ii.thumburl ?? ii.url;
      if (!url || seen.has(url)) continue;
      const t = String(p.title ?? '');
      if (!isProductPhoto(t, brand)) continue;

      if (isMatch(t, model)) {
        seen.add(url);
        out.push({ title: t, url });
        continue;
      }
      if (!matchesCategory(t, categoryName)) continue;
      if (!matchesProductLine(t, model)) continue;
      seen.add(url);
      out.push({ title: t, url });
    }
  }
  return out;
}

async function commonsBrandCategoryImages(
  brand: string,
  categoryName: string,
): Promise<Array<{ title: string; url: string }>> {
  const TYPE_WORDS: Record<string, string[]> = {
    'Điện thoại': ['phones', 'smartphones'],
    Tablet: ['tablets'],
    Laptop: ['laptops', 'notebooks'],
    'Màn hình': ['monitors', 'displays'],
    'PC Gaming': ['computers', 'cases'],
    Chuột: ['mice'],
    'Bàn phím': ['keyboards'],
    'Tai nghe': ['headsets', 'headphones'],
    'Phụ kiện': ['accessories'],
  };
  const words = TYPE_WORDS[categoryName] ?? [];

  const cands: string[] = [];
  for (const w of words) cands.push(`${brand} ${w}`);
  cands.push(brand);

  const out: Array<{ title: string; url: string }> = [];
  const seen = new Set<string>();

  for (const cat of cands) {
    if (out.length >= 12) break;
    const d = await getJson(
      `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
        `&list=categorymembers&cmtitle=${encodeURIComponent(`Category:${cat}`)}` +
        `&cmtype=file&cmlimit=100`,
    );
    const members: string[] = (d?.query?.categorymembers ?? [])
      .map((x: any) => String(x.title ?? ''))
      .filter(Boolean);
    if (!members.length) continue;

    const files = members
      .filter((t) => /\.(jpe?g|png|webp)$/i.test(t) && !/\.svg$/i.test(t))
      .slice(0, 40);
    if (!files.length) continue;

    const info: any = await getJson(
      `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
        `&titles=${encodeURIComponent(files.join('|'))}` +
        `&prop=imageinfo&iiprop=url|mime&iiurlwidth=900`,
    );
    for (const p of Object.values<any>(info?.query?.pages ?? {})) {
      if (out.length >= 12) break;
      const ii = (p.imageinfo ?? [])[0];
      if (!ii) continue;
      if (ii.mime && !/^image\/(jpeg|png|webp)$/.test(ii.mime)) continue;
      const url: string = ii.thumburl ?? ii.url;
      if (!url || seen.has(url)) continue;
      const t = String(p.title ?? '');

      if (!isProductPhoto(t, brand)) continue;
      if (!hasBrandToken(t, brand)) continue;

      if (!matchesCategory(t, categoryName)) continue;
      seen.add(url);
      out.push({ title: t, url });
    }
  }
  return out;
}

function categoryCandidates(model: string, brand: string): string[] {
  const out = new Set<string>();
  const base = modelName(model);
  const tokens = base.split(' ').filter(Boolean);
  const brandFirst = brand.split(' ')[0].toLowerCase();
  const rest = tokens[0]?.toLowerCase() === brandFirst ? tokens.slice(1) : tokens;

  const add = (s?: string) => {
    const v = s?.trim();
    if (v && v.length > 2) out.add(v);
  };

  add(base);
  add(rest.join(' '));

  add(base.replace(/\s*\d{1,2}(?:\.\d+)?in\b/g, '').trim());

  if (rest.length > 1) {
    add(rest.slice(0, 3).join(' '));
    add(rest.slice(0, 2).join(' '));
  }

  if (rest.length > 1) add(rest.slice(0, -1).join(' '));

  return [...out].slice(0, 6);
}

async function findCommonsCategories(
  model: string,
  brand: string,
): Promise<string[]> {
  const out: string[] = [];
  const seen = new Set<string>();

  const queries = [modelName(model), modelName(model).replace(/\s*\d{1,2}(?:\.\d+)?in\b/g, '').trim()];

  const brandFirst = brand.split(' ')[0].toLowerCase();
  const tokens = modelName(model).split(' ').filter(Boolean);
  if (tokens[0]?.toLowerCase() === brandFirst && tokens.length > 1) {
    queries.push(tokens.slice(1).join(' '));
  }

  for (const q of queries) {
    if (!q) continue;
    const d = await getJson(
      `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
        `&list=search&srnamespace=14&srsearch=${encodeURIComponent(q)}` +
        `&srlimit=8`,
    );
    for (const x of (d?.query?.search ?? [])) {
      const t = String(x.title ?? '');
      if (!t || seen.has(t)) continue;

      const name = t.replace(/^Category:/i, '');
      if (!name.toLowerCase().includes(keyTokenOf(q))) continue;
      seen.add(t);
      out.push(name);
      if (out.length >= 5) return out;
    }
  }
  return out;
}

function keyTokenOf(name: string): string {
  const toks = keyTokens(name).filter(
    (t) => !isBrandToken(t) && !STOPWORDS.has(t) && t.length >= 3,
  );
  return (toks[0] ?? name).toLowerCase();
}

async function commonsBrandLineImages(
  model: string,
  brand: string,
  categoryName: string,
): Promise<Array<{ title: string; url: string }>> {
  const out: Array<{ title: string; url: string }> = [];
  const seen = new Set<string>();

  const TYPE_WORDS: Record<string, string[]> = {
    'Điện thoại': ['smartphone', 'phone'],
    Tablet: ['tablet'],
    Laptop: ['laptop', 'notebook'],
    'Màn hình': ['monitor', 'display'],
    'PC Gaming': ['computer', 'desktop', 'pc'],
    Chuột: ['mouse'],
    'Bàn phím': ['keyboard'],
    'Tai nghe': ['headset', 'headphones'],
    'Phụ kiện': ['adapter', 'charger', 'hub'],
  };
  const types = TYPE_WORDS[categoryName] ?? [];

  const queries = [
    `${brand} ${types[0] ?? ''}`.trim(),
    brand,
    ...types.map((t) => `${brand} ${t}`),
  ];

  for (const q of queries) {
    if (out.length >= 12) break;
    if (!q) continue;
    const d = await getJson(
      `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
        `&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(q)}` +
        `&gsrlimit=50&prop=imageinfo&iiprop=url|mime&iiurlwidth=900`,
    );
    for (const p of Object.values<any>(d?.query?.pages ?? {})) {
      if (out.length >= 12) break;
      const ii = (p.imageinfo ?? [])[0];
      if (!ii) continue;
      if (ii.mime && !/^image\/(jpeg|png|webp)$/.test(ii.mime)) continue;
      const url: string = ii.thumburl ?? ii.url;
      if (!url || seen.has(url)) continue;
      const t = String(p.title ?? '');
      if (!isProductPhoto(t, brand, model)) continue;

      if (!hasBrandToken(t, brand)) continue;

      const typeWords = CATEGORY_TYPE_WORDS[categoryName] ?? [];
      const tn = norm(t);
      if (!typeWords.some((w) => tn.includes(w))) continue;

      seen.add(url);
      out.push({ title: t, url });
    }
  }
  return out;
}

async function commonsSiblingImages(
  model: string,
  brand: string,
  categoryName: string,
): Promise<Array<{ title: string; url: string }>> {
  const out: Array<{ title: string; url: string }> = [];
  const seen = new Set<string>();

  const TYPE_WORDS: Record<string, string[]> = {
    'Điện thoại': ['smartphone', 'phone'],
    Tablet: ['tablet'],
    Laptop: ['laptop', 'notebook', 'macbook'],
    'Màn hình': ['monitor', 'display'],
    'PC Gaming': ['computer', 'desktop'],
    Chuột: ['mouse', 'mice'],
    'Bàn phím': ['keyboard'],
    'Tai nghe': ['headset', 'headphones', 'earbuds', 'earphones'],
    'Phụ kiện': ['charger', 'power bank', 'adapter', 'hub', 'webcam'],
  };
  const types = TYPE_WORDS[categoryName] ?? [];

  const WRONG_TYPE: Record<string, string[]> = {
    'Điện thoại': ['laptop', 'monitor', 'keyboard', 'mouse', 'headset'],
    Tablet: ['laptop', 'monitor', 'keyboard', 'mouse', 'headset'],
    Laptop: ['monitor', 'keyboard', 'mouse', 'headset', 'smartphone'],
    'Màn hình': ['laptop', 'keyboard', 'mouse', 'headset', 'smartphone'],
    'PC Gaming': ['monitor', 'keyboard', 'mouse', 'headset'],
    Chuột: ['laptop', 'monitor', 'keyboard', 'headset'],
    'Bàn phím': ['laptop', 'monitor', 'mouse', 'headset'],
    'Tai nghe': ['laptop', 'monitor', 'keyboard', 'mouse'],
    'Phụ kiện': ['laptop', 'monitor', 'keyboard', 'mouse', 'headset'],
  };
  const wrong = WRONG_TYPE[categoryName] ?? [];

  const base = modelName(model);
  const brandFirst = brand.split(' ')[0].toLowerCase();
  const tokens = base.split(' ').filter(Boolean);
  const rest = tokens[0]?.toLowerCase() === brandFirst ? tokens.slice(1) : tokens;

  const lineWords = rest.filter(
    (t) => t.length >= 4 && !/^\d/.test(t) && !STOPWORDS.has(t.toLowerCase()),
  );

  const lineQueries: string[] = [];
  if (lineWords.length) {
    lineQueries.push(`${brand} ${lineWords[0]}`);
    if (lineWords.length > 1) {
      lineQueries.push(`${brand} ${lineWords.slice(0, 2).join(' ')}`);
    }
  }

  const typeQueries = types.map((t) => `${brand} ${t}`);

  const run = async (queries: string[], requireLine: boolean): Promise<void> => {
    for (const q of queries) {
      if (out.length >= 12) return;
      if (!q) continue;
      const d = await getJson(
        `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
          `&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(q)}` +
          `&gsrlimit=40&prop=imageinfo&iiprop=url|mime&iiurlwidth=900`,
      );
      for (const p of Object.values<any>(d?.query?.pages ?? {})) {
        if (out.length >= 12) return;
        const ii = (p.imageinfo ?? [])[0];
        if (!ii) continue;
        if (ii.mime && !/^image\/(jpeg|png|webp)$/.test(ii.mime)) continue;
        const url: string = ii.thumburl ?? ii.url;
        if (!url || seen.has(url)) continue;
        const t = String(p.title ?? '');

        if (!isProductPhoto(t, brand)) continue;
        if (!hasBrandToken(t, brand)) continue;
        const tn = norm(t);
        if (wrong.some((w) => tn.includes(w))) continue;
        if (requireLine && !matchesProductLine(t, model)) continue;
        seen.add(url);
        out.push({ title: t, url });
      }
    }
  };

  await run(lineQueries, true);
  if (!out.length) await run(typeQueries, false);
  return out;
}

async function commonsGenericCategoryImages(
  categoryName: string,
  brand?: string,
): Promise<Array<{ title: string; url: string }>> {
  const TYPE_QUERIES: Record<string, string[]> = {
    'Điện thoại': ['smartphone product photo'],
    Tablet: ['tablet product photo'],
    Laptop: ['laptop computer product'],
    'Màn hình': ['computer monitor product'],
    'PC Gaming': ['gaming computer case'],
    Chuột: ['computer mouse product'],
    'Bàn phím': ['mechanical keyboard product'],
    'Tai nghe': ['gaming headset product'],
    'Phụ kiện': ['usb c charger adapter'],
  };
  const queries = TYPE_QUERIES[categoryName] ?? [];
  const out: Array<{ title: string; url: string }> = [];
  const seen = new Set<string>();

  for (const q of queries) {
    if (out.length >= 10) break;
    const d = await getJson(
      `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
        `&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(q)}` +
        `&gsrlimit=40&prop=imageinfo&iiprop=url|mime&iiurlwidth=900`,
    );
    for (const p of Object.values<any>(d?.query?.pages ?? {})) {
      if (out.length >= 10) break;
      const ii = (p.imageinfo ?? [])[0];
      if (!ii) continue;
      if (ii.mime && !/^image\/(jpeg|png|webp)$/.test(ii.mime)) continue;
      const url: string = ii.thumburl ?? ii.url;
      if (!url || seen.has(url)) continue;
      const t = String(p.title ?? '');
      if (!isProductPhoto(t, brand ?? '')) continue;

      if (brand && hasForeignBrand(t, brand)) continue;

      const gk = CATEGORY_TYPE_WORDS[categoryName] ?? [];
      const gtn = norm(t);
      if (gk.length && !gk.some((w) => gtn.includes(w))) continue;

      const otherWords = Object.values(CATEGORY_TYPE_WORDS)
        .flat()
        .filter((w) => !(gk ?? []).includes(w));
      if (otherWords.some((w) => gtn.includes(w))) continue;
      seen.add(url);
      out.push({ title: t, url });
    }
  }
  return out;
}

interface ModelImages {
    images: string[];
  source: string;
  title: string;
}

async function resolveModel(
  model: string,
  brand: string,
  categoryName: string,
): Promise<ModelImages | null> {
  const images: string[] = [];
  const seen = new Set<string>();
  const add = (u: string) => {
    if (u && !seen.has(u)) {
      seen.add(u);
      images.push(u);
    }
  };

  let source = '';
  let title = '';

  const byCode = await commonsByModelCode(model, brand);
  for (const i of byCode) add(i.url);
  if (images.length) {
    source = 'commons-code';
    title = byCode[0]?.title ?? model;
  }

  if (images.length < 4) {
    const byTitle = await commonsIntitleImages(model, brand);
    for (const i of byTitle) add(i.url);
    if (images.length && !source) {
      source = 'commons-intitle';
      title = byTitle[0]?.title ?? model;
    }
  }

  for (const v of variants(model)) {
    if (images.length >= 4) break;

    const ml = await mediaListImages(v, model);
    for (const i of ml) add(i.url);
    if (images.length && !source) {
      source = 'wikipedia-media';
      title = ml[0]?.title ?? v;
    }

    const direct = await wikiThumb(v, model);
    if (direct) {
      add(direct.url);
      if (!source) {
        source = 'wikipedia';
        title = direct.title;
      }
    }

    if (images.length < 4) {
      const titles = await wikiSearchTitles(v);
      const exact = titles.find((t) => norm(t) === norm(model));
      const ordered = exact
        ? [exact, ...titles.filter((t) => t !== exact)]
        : titles;
      for (const t of ordered.slice(0, 3)) {
        const ml2 = await mediaListImages(t, model);
        for (const i of ml2) add(i.url);
        const th = await wikiThumb(t, model);
        if (th) add(th.url);
        if (images.length >= 4) break;
      }
      if (images.length && !source) {
        source = 'wikipedia-search';
        title = ordered[0] ?? v;
      }
    }

    if (images.length < 4) {
      const queries = [v, ...commonsQueries(v, brand)].filter(
        (q, i, arr) => q && arr.indexOf(q) === i,
      );
      for (const q of queries) {
        const c = await commonsSearch(q, brand, model);
        for (const i of c) add(i.url);
        if (images.length >= 4) break;
      }
      if (images.length && !source) {
        source = 'commons';
        title = v;
      }
    }

    if (images.length >= 4) break;
  }

  if (!images.length) {
    const cat = await commonsCategoryImages(model, brand, categoryName);
    for (const i of cat) add(i.url);
    if (images.length) {
      source = 'commons-category';
      title = cat[0]?.title ?? model;
    }
  }

  if (!images.length) {
    const line = await commonsBrandLineImages(model, brand, categoryName);
    for (const i of line) add(i.url);
    if (images.length) {
      source = 'commons-brand-line';
      title = line[0]?.title ?? brand;
    }
  }

  if (!images.length) {
    const sib = await commonsSiblingImages(model, brand, categoryName);
    for (const i of sib) add(i.url);
    if (images.length) {
      source = 'commons-sibling';
      title = sib[0]?.title ?? brand;
    }
  }

  if (!images.length) {
    const gen = await commonsGenericCategoryImages(categoryName, brand);
    for (const i of gen) add(i.url);
    if (images.length) {
      source = 'commons-generic';
      title = gen[0]?.title ?? categoryName;
    }
  }

  if (images.length < 6) {
    const bc = await commonsBrandCategoryImages(brand, categoryName);
    for (const i of bc) add(i.url);
  }

  if (!images.length) {
    const line = await brandLineImages(brand, model, categoryName);
    for (const i of line) add(i.url);
    if (images.length) {
      source = 'brand-line';
      title = line[0]?.title ?? brand;
    }
  }

  if (!images.length) return null;

  return { images: images.slice(0, 12), source, title };
}

export function distributePrimaryImages(
  groups: Map<string, ModelImages> | Record<string, ModelImages>,
): void {
  const entries =
    groups instanceof Map ? [...groups.entries()] : Object.entries(groups);
  if (!entries.length) return;

  const primaryCount = new Map<string, number>();
  for (const [, v] of entries) {
    const main = v.images[0];
    if (!main) continue;
    primaryCount.set(main, (primaryCount.get(main) ?? 0) + 1);
  }

  const usedAsPrimary = new Set(primaryCount.keys());

  const EXACT_SOURCES = new Set([
    'commons-code',
    'commons-intitle',
    'wikipedia',
    'wikipedia-media',
    'wikipedia-search',
    'commons',
  ]);

  const order = [...entries].sort(([a], [b]) => {
    const ea = EXACT_SOURCES.has(entries.find(([m]) => m === a)![1].source);
    const eb = EXACT_SOURCES.has(entries.find(([m]) => m === b)![1].source);
    if (ea !== eb) return ea ? -1 : 1;
    return a.localeCompare(b);
  });

  const taken = new Set<string>();
  const usage = new Map<string, number>(primaryCount);

  for (const [model, v] of order) {
    if (!v.images.length) continue;
    const isExact = EXACT_SOURCES.has(v.source);

    if (isExact) {
      const main = v.images[0];
      taken.add(main);
      continue;
    }

    let chosen = v.images.find((u) => !taken.has(u));

    if (!chosen) {
      let best: string | undefined;
      let bestCount = Infinity;
      for (const u of v.images) {
        const c = usage.get(u) ?? 0;
        if (c < bestCount) {
          bestCount = c;
          best = u;
        }
      }
      chosen = best;
    }
    if (!chosen) continue;

    taken.add(chosen);
    usage.set(chosen, (usage.get(chosen) ?? 0) + 1);

    v.images = [chosen, ...v.images.filter((u) => u !== chosen)];
  }

  const mainCount = new Map<string, number>();
  for (const [, v] of entries) {
    const m = v.images[0];
    if (!m) continue;
    mainCount.set(m, (mainCount.get(m) ?? 0) + 1);
  }

  const dupMain = [...mainCount.entries()]
    .filter(([, c]) => c > 1)
    .map(([m]) => m);

  if (dupMain.length) {

    const byMain = new Map<string, string[]>();
    for (const [model, v] of entries) {
      const m = v.images[0];
      if (!m) continue;
      const list = byMain.get(m) ?? [];
      list.push(model);
      byMain.set(m, list);
    }

    for (const main of dupMain) {
      const models = byMain.get(main)!;
      if (models.length < 2) continue;

      const pool: string[] = [];
      for (const model of models) {
        const v = entries.find(([m]) => m === model)![1];
        for (const u of v.images) if (!pool.includes(u)) pool.push(u);
      }
      if (pool.length < models.length) continue;

      models.sort();
      models.forEach((model, i) => {
        const v = entries.find(([m]) => m === model)![1];
        const k = i % pool.length;
        v.images = [...pool.slice(k), ...pool.slice(0, k)];
      });
    }
  }
}

async function main() {
  const mock = JSON.parse(
    readFileSync(resolve(process.cwd(), 'scripts/data/frontend-mock.json'), 'utf-8'),
  );

  const all: Array<{ name: string; brand: string; categoryName: string }> = [
    ...(mock.products as any[]),
    ...((mock.sellerProducts ?? []) as any[]),
  ];
  const byModel = new Map<
    string,
    { brand: string; count: number; categoryName: string }
  >();
  for (const p of all) {
    const m = modelName(p.name);
    const cur = byModel.get(m);
    if (cur) cur.count++;
    else
      byModel.set(m, {
        brand: p.brand,
        count: 1,
        categoryName: p.categoryName ?? '',
      });
  }

  const dest = resolve(process.cwd(), 'scripts/data/model-images.json');
  const result: Record<string, ModelImages> = {};

  if (existsSync(dest)) {
    try {
      const prev = JSON.parse(readFileSync(dest, 'utf-8'));
      for (const [k, v] of Object.entries<any>(prev)) {

        if (v && Array.isArray(v.images) && v.images.length) result[k] = v;
      }
      if (Object.keys(result).length) {
        console.log(
          `[model-img] Đã có sẵn ${Object.keys(result).length} model, tiếp tục tra cứu phần còn lại.`,
        );
      }
    } catch {
          }
  }

  const models = [...byModel.keys()].sort();
  let found = 0;

  const CONCURRENCY = 10;
  let cursor = 0;

  const saver = setInterval(() => {
    try {
      writeFileSync(dest, JSON.stringify(result, null, 2), 'utf-8');
    } catch {
          }
  }, 5000);

  const worker = async (): Promise<void> => {
    while (cursor < models.length) {
      const model = models[cursor++];
      const info = byModel.get(model)!;
      if (result[model]?.images?.length >= 4) {
        found++;
        continue;
      }

      const hit = await resolveModel(model, info.brand, info.categoryName);
      if (hit) {
        found++;
        result[model] = hit;
      }
      console.log(
        `${hit ? '✓' : '✗'} ${model.padEnd(46)} ${hit ? `${hit.images.length} ảnh | ${hit.source} | ${hit.title}` : ''}`,
      );
      await wait(150);
    }
  };

  await Promise.all(
    Array.from({ length: CONCURRENCY }, () => worker()),
  );

  clearInterval(saver);

  distributePrimaryImages(result);

  writeFileSync(dest, JSON.stringify(result, null, 2), 'utf-8');
  const totalImages = Object.values(result).reduce((s, v) => s + v.images.length, 0);
  console.log(
    `\n[model-img] Tìm được ảnh cho ${found}/${models.length} model ` +
      `(${totalImages} ảnh duy nhất) -> ${dest}`,
  );

  const firstUse = new Map<string, string[]>();
  for (const [model, v] of Object.entries(result)) {
    const main = v.images[0];
    if (!main) continue;
    const list = firstUse.get(main) ?? [];
    list.push(model);
    firstUse.set(main, list);
  }
  const shared = [...firstUse.entries()].filter(([, l]) => l.length > 1);
  console.log(
    `[model-img] Ảnh chính dùng chung giữa các model: ${shared.length} nhóm` +
      (shared.length
        ? ` (nhiều nhất ${Math.max(...shared.map(([, l]) => l.length))} model)`
        : ''),
  );
  for (const [url, models] of shared.slice(0, 8)) {
    console.log(
      `   - ${decodeURIComponent(url.split('/').pop()?.split('?')[0] ?? '')}` +
        ` <- ${models.slice(0, 4).join(' | ')}`,
    );
  }
}

if (process.argv[1]?.endsWith('resolve-model-images.ts')) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

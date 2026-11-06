/**
 * Thử Openverse API cho 1 model.
 *
 * Chạy: npx tsx scripts/try-openverse.ts "Corsair HS60"
 */
const UA = 'henzo-store/1.0 (model image resolver; dev@henzo.local)';

async function main() {
  const q = process.argv[2] ?? 'Corsair HS60';
  const url =
    `https://api.openverse.org/v1/images/?q=${encodeURIComponent(q)}` +
    `&page_size=10&license_type=commercial`;
  console.log('URL:', url);
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 45000);
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'application/json' },
      signal: ctrl.signal,
    });
    console.log('status', r.status);
    const j = await r.json();
    console.log('count', j.result_count);
    for (const x of j.results ?? []) {
      console.log(' -', x.title, '|', x.license, '|', x.url);
      console.log('   thumb:', x.thumbnail);
    }
  } catch (e) {
    console.log('ERR', String(e));
  } finally {
    clearTimeout(t);
  }
}
void main();

export {};

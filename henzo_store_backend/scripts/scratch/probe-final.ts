/**
 * Probe cuối: tìm đúng category Commons cho các model còn thiếu.
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const UA = 'henzo-store/1.0 (model image resolver; dev@henzo.local)';

async function getJson(url: string): Promise<any> {
  for (let a = 0; a < 3; a++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } });
      if (r.status === 429) {
        await new Promise((s) => setTimeout(s, 2000 * (a + 1)));
        continue;
      }
      if (!r.ok) return null;
      return await r.json();
    } catch {
      await new Promise((s) => setTimeout(s, 800));
    }
  }
  return null;
}

/** Tìm category có tên chứa từ khoá. */
async function findCats(keyword: string, limit = 12): Promise<string[]> {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&list=search&srnamespace=14&srsearch=${encodeURIComponent(keyword)}` +
      `&srlimit=${limit}`,
  );
  return (d?.query?.search ?? []).map((x: any) => String(x.title ?? '').replace(/^Category:/, ''));
}

async function catMembers(cat: string): Promise<string[]> {
  const d = await getJson(
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
      `&list=categorymembers&cmtitle=${encodeURIComponent(`Category:${cat}`)}` +
      `&cmtype=file&cmlimit=200`,
  );
  return (d?.query?.categorymembers ?? []).map((x: any) => String(x.title ?? '').replace(/^File:/, ''));
}

async function catInfo(files: string[]) {
  const out: any[] = [];
  for (let i = 0; i < files.length; i += 40) {
    const chunk = files.slice(i, i + 40);
    const d = await getJson(
      `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
        `&titles=${encodeURIComponent(chunk.map((f) => `File:${f}`).join('|'))}` +
        `&prop=imageinfo&iiprop=url|mime|extmetadata&iiurlwidth=1000`,
    );
    for (const p of Object.values<any>(d?.query?.pages ?? {})) {
      const ii = (p.imageinfo ?? [])[0];
      if (!ii) continue;
      const em = ii.extmetadata ?? {};
      out.push({
        title: String(p.title ?? '').replace(/^File:/, ''),
        url: String(ii.thumburl ?? ii.url),
        desc: String(em.ImageDescription?.value ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 130),
        cats: String(em.Categories?.value ?? '').split('|').slice(0, 5),
      });
    }
  }
  return out;
}

const KEYS: Record<string, string[]> = {
  hyperx_cloud: ['HyperX Cloud', 'HyperX headset', 'HyperX'],
  steel_arctis: ['SteelSeries Arctis', 'Arctis'],
  razer_seiren: ['Razer Seiren', 'Seiren', 'Razer microphone'],
  elgato_sd: ['Stream Deck', 'Elgato Stream Deck'],
  endgame_xm: ['Endgame Gear', 'XM2'],
  gigabyte_mon: ['M27Q', 'M32UC', 'M34WMU', 'Gigabyte M'],
  aoc_agon: ['AGON', 'AG274QZM', 'CU34G2X', 'AOC gaming'],
  razer_raptor: ['Razer Raptor', 'Razer monitor'],
  icue_link: ['iCUE LINK', 'iCUE'],
  corsair_m75: ['Corsair M75', 'Corsair mouse', 'Corsair mice'],
  msi_321upx: ['MAG 321UPX', 'MSI MAG', 'MSI Optix'],
  wd_nvme: ['Western Digital NVMe', 'WD Blue SN', 'WD Black SN'],
  seagate_nvme: ['FireCuda', 'Seagate FireCuda', 'Seagate solid-state'],
  kingston_fury: ['Kingston Fury', 'FURY Beast', 'Fury Renegade'],
  gskill: ['Trident Z', 'G.Skill memory', 'G.Skill RAM'],
  deepcool_ak: ['AK620', 'DeepCool AK', 'DeepCool CPU'],
  coolermaster_mtt: ['MTT G200', 'Cooler Master MTT', 'Cooler Master air cooler'],
  lg_ultrawide: ['LG UltraWide', 'LG 34 inch'],
  keychron_k: ['Keychron K3', 'Keychron low profile'],
  lenovo_tp: ['ThinkPad TrackPoint Keyboard'],
  g502x: ['G502 X', 'G502'],
  mxs: ['MX Master 3S'],
  asus_tuf: ['ASUS TUF Gaming', 'TUF Gaming VG32'],
  steam_deck_like: ['Elgato'],
};

async function main() {
  const out: Record<string, any[]> = {};
  const seen = new Set<string>();
  for (const [k, kws] of Object.entries(KEYS)) {
    const cats = new Set<string>();
    for (const kw of kws) {
      for (const c of await findCats(kw)) cats.add(c);
    }
    const list: any[] = [];
    for (const c of [...cats].slice(0, 8)) {
      const members = await catMembers(c);
      const files = members.filter((f) => /\.(jpe?g|png|webp)$/i.test(f) && !/\.svg$/i.test(f));
      if (!files.length) continue;
      for (const info of await catInfo(files)) {
        if (seen.has(info.title)) continue;
        seen.add(info.title);
        list.push({ ...info, cat: c });
      }
    }
    out[k] = list;
    console.log(`\n### ${k}  (${list.length})`);
    list.slice(0, 22).forEach((i) => console.log(`   [${i.cat}] ${i.title}\n      ${i.desc}\n      ${i.cats.join(' | ')}`));
  }
  writeFileSync(resolve(process.cwd(), 'scripts/data/commons-final-probe.json'), JSON.stringify(out, null, 2), 'utf-8');
}

void main();

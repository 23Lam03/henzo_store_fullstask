const UA = 'Mozilla/5.0 (compatible; henzo-store/1.0; +https://henzo.local)';

async function openverse(q: string) {
  const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(q)}&page_size=12&license_type=all-cc&mature=false`;
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!r.ok) return { err: r.status, list: [] as any[] };
    const d: any = await r.json();
    return { err: 0, list: d.results ?? [] };
  } catch (e: any) {
    return { err: String(e?.message ?? e), list: [] as any[] };
  }
}

const TARGETS: Record<string, string[]> = {
  'JBL Quantum 910 Wireless': ['JBL Quantum 910 headset'],
  'SteelSeries Arctis Nova 7': ['SteelSeries Arctis Nova 7 headset'],
  'SteelSeries Arctis Nova Pro Wireless': ['SteelSeries Arctis Nova Pro headset'],
  'HyperX Cloud III Wireless': ['HyperX Cloud III headset'],
  'HyperX Cloud Alpha Wireless': ['HyperX Cloud Alpha headset'],
  'Endgame Gear XM2we Wireless': ['Endgame Gear XM2we mouse'],
  'Corsair M75 Wireless': ['Corsair M75 mouse'],
  'Keychron K3 Pro Low Profile': ['Keychron K3 keyboard'],
  'Razer Seiren V2 Pro': ['Razer Seiren V2 microphone'],
  'Elgato Stream Deck XL': ['Elgato Stream Deck XL'],
  'Corsair iCUE LINK System Hub': ['Corsair iCUE LINK System Hub'],
  'Razer Raptor 27in': ['Razer Raptor 27 monitor'],
  'Gigabyte M27Q X 27in': ['Gigabyte M27Q X monitor'],
  'Gigabyte M34WMU 34in': ['Gigabyte M34WMU monitor'],
  'Gigabyte M32UC 32in': ['Gigabyte M32UC monitor'],
  'AOC AGON PRO AG274QZM 27in': ['AOC AGON PRO AG274QZM'],
  'AOC CU34G2X 34in': ['AOC CU34G2X monitor'],
  'Kingston FURY Beast DDR5': ['Kingston Fury Beast DDR5 memory'],
  'Kingston FURY Renegade': ['Kingston Fury Renegade DDR5'],
  'Corsair RM850x': ['Corsair RM850x power supply'],
  'Corsair RM750e': ['Corsair RM750e power supply'],
  'Corsair MP700 Pro SE': ['Corsair MP700 PRO SSD'],
  'Cooler Master MTT G200 V2': ['Cooler Master MTT G200'],
  'DeepCool AK620 Digital': ['DeepCool AK620 Digital cooler'],
  'Seagate FireCuda 530': ['Seagate FireCuda 530 NVMe SSD'],
  'Western Digital Blue SN580': ['WD Blue SN580 NVMe SSD'],
  'G.Skill Trident Z5 RGB': ['G.Skill Trident Z5 RGB DDR5'],
  'G.Skill Ripjaws S5': ['G.Skill Ripjaws S5 DDR5'],
  'SteelSeries Rival 650 Wireless': ['SteelSeries Rival 650 wireless mouse'],
};

async function main() {
  for (const [model, qs] of Object.entries(TARGETS)) {
    console.log(`\n### ${model}`);
    for (const q of qs) {
      const { err, list } = await openverse(q);
      if (err) {
        console.log(`   [${q}] ERROR ${err}`);
        continue;
      }
      console.log(`   [${q}] ${list.length} kết quả`);
      list.slice(0, 8).forEach((r: any) =>
        console.log(`      - ${String(r.title ?? '').slice(0, 70)} | ${r.license} | ${r.url}`),
      );
    }
  }
}

void main();

export {};

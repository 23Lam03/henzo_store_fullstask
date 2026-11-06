import { API_BASE_URL, apiFetch } from './client';

export interface Province {
  code: string;
  name: string;
  slug: string;
  unit: string;
}

export interface District {
  code: string;
  name: string;
  slug: string;
  unit: string;
  provinceCode: string;
  provinceName: string;
}

export interface Ward {
  code: string;
  name: string;
  slug: string;
  unit: string;
  districtCode: string;
  districtName: string;
  provinceCode: string;
  provinceName: string;
}

let provincesCache: Province[] | null = null;
const districtsCache = new Map<string, District[]>();
const wardsCache = new Map<string, Ward[]>();
const districtWardsCache = new Map<string, Ward[]>();

export const locationsApi = {
    async provinces(): Promise<Province[]> {
    if (provincesCache) return provincesCache;
    const data = await apiFetch<Province[]>(
      `${API_BASE_URL}/locations/provinces`,
    );
    provincesCache = Array.isArray(data) ? data : [];
    return provincesCache;
  },

    async districts(provinceCode: string): Promise<District[]> {
    if (!provinceCode) return [];
    const cached = districtsCache.get(provinceCode);
    if (cached) return cached;
    const data = await apiFetch<District[]>(
      `${API_BASE_URL}/locations/provinces/${encodeURIComponent(provinceCode)}/districts`,
    );
    const list = Array.isArray(data) ? data : [];
    districtsCache.set(provinceCode, list);
    return list;
  },

    async wards(provinceCode: string): Promise<Ward[]> {
    if (!provinceCode) return [];
    const cached = wardsCache.get(provinceCode);
    if (cached) return cached;
    const data = await apiFetch<Ward[]>(
      `${API_BASE_URL}/locations/provinces/${encodeURIComponent(provinceCode)}/wards`,
    );
    const list = Array.isArray(data) ? data : [];
    wardsCache.set(provinceCode, list);
    return list;
  },

    async wardsOfDistrict(districtCode: string): Promise<Ward[]> {
    if (!districtCode) return [];
    const cached = districtWardsCache.get(districtCode);
    if (cached) return cached;
    const data = await apiFetch<Ward[]>(
      `${API_BASE_URL}/locations/districts/${encodeURIComponent(districtCode)}/wards`,
    );
    const list = Array.isArray(data) ? data : [];
    districtWardsCache.set(districtCode, list);
    return list;
  },
};

export function normalizeLocationName(text: string): string {
  return (text ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function findProvinceByName(
  provinces: Province[],
  name: string,
): Province | undefined {
  const key = normalizeLocationName(name);
  if (!key) return undefined;
  return (
    provinces.find((p) => normalizeLocationName(p.name) === key) ??
    provinces.find((p) => normalizeLocationName(p.name).endsWith(key))
  );
}

export function findDistrictByName(
  districts: District[],
  name: string,
): District | undefined {
  const key = normalizeLocationName(name);
  if (!key) return undefined;
  return (
    districts.find((d) => normalizeLocationName(d.name) === key) ??
    districts.find((d) => normalizeLocationName(d.name).endsWith(key))
  );
}

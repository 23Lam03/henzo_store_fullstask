import provincesRaw from '../data/provinces.json';
import districtsRaw from '../data/districts.json';
import wardsRaw from '../data/wards.json';

export interface ProvinceRecord {
  code: string;
  name: string;
  slug: string;
  unit: string;
}

export interface DistrictRecord {
  code: string;
  name: string;
  slug: string;
  unit: string;
  provinceCode: string;
  provinceName: string;
}

export interface WardRecord {
  code: string;
  name: string;
  slug: string;
  unit: string;
  districtCode: string;
  districtName: string;
  provinceCode: string;
  provinceName: string;
}

const provinces = provincesRaw as ProvinceRecord[];
const districts = districtsRaw as DistrictRecord[];
const wards = wardsRaw as WardRecord[];

const districtsByProvince = new Map<string, DistrictRecord[]>();
for (const d of districts) {
  const list = districtsByProvince.get(d.provinceCode) ?? [];
  list.push(d);
  districtsByProvince.set(d.provinceCode, list);
}

const wardsByDistrict = new Map<string, WardRecord[]>();
for (const w of wards) {
  const list = wardsByDistrict.get(w.districtCode) ?? [];
  list.push(w);
  wardsByDistrict.set(w.districtCode, list);
}

const provincesByCode = new Map(provinces.map(p => [p.code, p]));
const districtsByCode = new Map(districts.map(d => [d.code, d]));

export function listProvinces(): ProvinceRecord[] {
  return [...provinces].sort((a, b) => a.name.localeCompare(b.name, 'vi'));
}

export function listDistricts(provinceCode: string): DistrictRecord[] {
  return [...(districtsByProvince.get(provinceCode) ?? [])].sort((a, b) =>
    a.name.localeCompare(b.name, 'vi'),
  );
}

export function listWards(districtCode: string): WardRecord[] {
  return [...(wardsByDistrict.get(districtCode) ?? [])].sort((a, b) =>
    a.name.localeCompare(b.name, 'vi'),
  );
}

export function findProvince(code: string): ProvinceRecord | undefined {
  return provincesByCode.get(code);
}

export function findDistrict(code: string): DistrictRecord | undefined {
  return districtsByCode.get(code);
}

export function findProvinceByName(name: string): ProvinceRecord | undefined {
  const key = normalize(name);
  if (!key) return undefined;
  return provinces.find(
    p => normalize(p.name) === key || normalize(p.name).endsWith(key),
  );
}

export function findDistrictByName(
  provinceCode: string,
  name: string,
): DistrictRecord | undefined {
  const key = normalize(name);
  if (!key) return undefined;
  return listDistricts(provinceCode).find(
    d => normalize(d.name) === key || normalize(d.name).endsWith(key),
  );
}

export function findWardByName(
  districtCode: string,
  name: string,
): WardRecord | undefined {
  const key = normalize(name);
  if (!key) return undefined;
  return listWards(districtCode).find(
    w => normalize(w.name) === key || normalize(w.name).endsWith(key),
  );
}

function normalize(text: string): string {
  return (text ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Dữ liệu hành chính Việt Nam (tỉnh/thành phố → quận/huyện → phường/xã).
 *
 * Nguồn: bộ dữ liệu hành chính VN (63 tỉnh thành, 705 đơn vị cấp huyện,
 * 10.599 đơn vị cấp xã). Dữ liệu được nạp một lần rồi cache trong RAM vì
 * là dữ liệu tĩnh, không bao giờ thay đổi trong vòng đời ứng dụng.
 */
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

/** Index để tra cứu nhanh theo mã. */
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

/** Danh sách tỉnh/thành phố, sắp xếp theo tên. */
export function listProvinces(): ProvinceRecord[] {
  return [...provinces].sort((a, b) => a.name.localeCompare(b.name, 'vi'));
}

/** Danh sách quận/huyện thuộc một tỉnh. */
export function listDistricts(provinceCode: string): DistrictRecord[] {
  return [...(districtsByProvince.get(provinceCode) ?? [])].sort((a, b) =>
    a.name.localeCompare(b.name, 'vi'),
  );
}

/** Danh sách phường/xã thuộc một huyện. */
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

/**
 * Tìm tỉnh theo tên (không phân biệt hoa thường, bỏ dấu).
 * Dùng để tự động điền tỉnh từ địa chỉ cũ đã lưu.
 */
export function findProvinceByName(name: string): ProvinceRecord | undefined {
  const key = normalize(name);
  if (!key) return undefined;
  return provinces.find(
    p => normalize(p.name) === key || normalize(p.name).endsWith(key),
  );
}

/** Tìm huyện theo tên trong một tỉnh. */
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

/** Tìm xã theo tên trong một huyện. */
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

/** Bỏ dấu + hạ chữ thường + gộp khoảng trắng. */
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

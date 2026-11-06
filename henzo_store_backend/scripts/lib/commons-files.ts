/**
 * Verify danh sách file Commons và trả về map file -> URL (thumb 1000px).
 * Dùng để kiểm chứng toàn bộ pool ảnh trước khi gán cho model.
 */
const UA = 'henzo-store/1.0 (model image resolver; dev@henzo.local)';

async function getJson(url: string): Promise<any> {
  for (let a = 0; a < 6; a++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } });
      if (r.status === 429 || r.status >= 500) {
        await new Promise((s) => setTimeout(s, 1500 * (a + 1)));
        continue;
      }
      if (!r.ok) return null;
      return await r.json();
    } catch {
      await new Promise((s) => setTimeout(s, 800 * (a + 1)));
    }
  }
  return null;
}

/**
 * Tên file Commons từ URL (bỏ query + tiền tố `NNNpx-`).
 *
 * PHẢI lấy từ URL chứ không lấy từ `title` của API: Wikimedia chuẩn hoá
 * title (`File:Acer_CB5-311.jpg` -> `File:Acer CB5-311.jpg`, `_` -> space).
 * Nếu dùng title làm key, mọi file có `_` trong tên sẽ không khớp -> bị coi
 * là "không tồn tại" -> ảnh bị thay bằng ảnh generic (sai).
 */
function keyOf(url: string): string {
  const name = decodeURIComponent(url.split('?')[0]?.split('/').pop() ?? '');
  return name.replace(/^\d+px-/, '');
}

/**
 * Lấy URL (thumb 1000px) cho danh sách file Commons; bỏ file không tồn tại.
 * Chia chunk nhỏ + retry nhiều lần để không mất file do 429 của Commons.
 */
export async function resolveFiles(files: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const pending = [...new Set(files)];
  for (let i = 0; i < pending.length; i += 20) {
    const chunk = pending.slice(i, i + 20);
    const d = await getJson(
      `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
        `&titles=${encodeURIComponent(chunk.map((f) => `File:${f}`).join('|'))}` +
        `&prop=imageinfo&iiprop=url|mime&iiurlwidth=1000`,
    );
    if (!d?.query?.pages) {
      // Chunk lỗi -> thử lại từng file một để không bỏ sót.
      for (const f of chunk) {
        const one = await getJson(
          `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
            `&titles=${encodeURIComponent(`File:${f}`)}` +
            `&prop=imageinfo&iiprop=url|mime&iiurlwidth=1000`,
        );
        for (const p of Object.values<any>(one?.query?.pages ?? {})) {
          const ii = (p.imageinfo ?? [])[0];
          if (!ii || !/^image\/(jpeg|png|webp|tiff)$/.test(String(ii.mime))) continue;
          const u = String(ii.thumburl ?? ii.url);
          out.set(keyOf(u), u);
        }
      }
      continue;
    }
    for (const p of Object.values<any>(d.query.pages)) {
      const ii = (p.imageinfo ?? [])[0];
      if (!ii || !/^image\/(jpeg|png|webp|tiff)$/.test(String(ii.mime))) continue;
      const u = String(ii.thumburl ?? ii.url);
      out.set(keyOf(u), u);
    }
  }
  return out;
}

export { getJson };

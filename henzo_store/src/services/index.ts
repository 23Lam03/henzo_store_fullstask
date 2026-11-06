/**
 * Barrel export cho tầng API.
 *
 * Lưu ý: toàn bộ dữ liệu mock đã được chuyển sang backend TanStack
 * (`henzo_store_backend`). File `src/data/*` và `src/services/mock/*` chỉ
 * còn lại làm nguồn dữ liệu cho script seed của backend
 * (`henzo_store_backend/scripts/extract-frontend-data.ts`).
 */
export * from './api';

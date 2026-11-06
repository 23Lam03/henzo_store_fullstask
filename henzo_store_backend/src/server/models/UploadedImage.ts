/**
 * Model UploadedImage — lưu ảnh người dùng tải lên.
 *
 * Vì sao lưu trong MongoDB mà không lưu đĩa:
 *   Render (và hầu hết PaaS) dùng **ephemeral disk** — mỗi lần deploy
 *   hoặc restart là mất sạch thư mục `storage/uploads`. Ảnh sản phẩm /
 *   ảnh đại diện người dùng đã upload sẽ biến mất khỏi hệ thống.
 *
 *   Lưu binary trong MongoDB (GridFS không cần thiết vì ảnh nhỏ, giới hạn
 *   5MB) giúp dữ liệu sống dai cho tới khi bị xoá có chủ đích.
 *
 * Cơ chế:
 *   - `filename` là tên file sinh ra (UUID + ext), cũng là khoá tra cứu.
 *   - `data` là Buffer của file.
 *   - Route `/api/uploads/:filename` đọc từ collection này; nếu không có
 *     thì fallback sang thư mục đĩa (tương thích ngược với dữ liệu cũ).
 */
import { Schema, type InferSchemaType } from 'mongoose';
import { defineModel } from './registry';

const uploadedImageSchema = new Schema(
  {
    /** Tên file (UUID.ext) — khoá tra cứu duy nhất. */
    filename: { type: String, required: true, unique: true, index: true },
    /** MIME type đã xác thực qua magic number. */
    mimeType: { type: String, required: true },
    /** Kích thước file (byte). */
    size: { type: Number, default: 0 },
    /** Nội dung file. */
    data: { type: Buffer, required: true },
    /** Người upload (nếu đã đăng nhập). */
    uploadedBy: { type: String, default: '' },
  },
  { timestamps: true },
);

export type UploadedImageDoc = InferSchemaType<typeof uploadedImageSchema>;

export const UploadedImageModel = defineModel('UploadedImage', uploadedImageSchema);

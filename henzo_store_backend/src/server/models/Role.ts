/**
 * Model Role — cấu hình quyền hạn theo vai trò.
 *
 * Mặc định lấy từ `ROLE_PERMISSIONS` (constants). Khi admin chỉnh sửa quyền
 * của một vai trò, bản ghi này ghi đè giá trị mặc định.
 */
import { Schema, type InferSchemaType } from 'mongoose';
import { defineModel } from './registry';

const roleSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, uppercase: true, index: true },
    label: { type: String, default: '' },
    description: { type: String, default: '' },
    color: { type: String, default: '#4F46E5' },
    bg: { type: String, default: 'rgba(79,70,229,0.1)' },
    permissions: { type: [String], default: [] },
    /** Đánh dấu đây là bản ghi do admin chỉnh sửa (không phải mặc định). */
    isCustom: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export type RoleDoc = InferSchemaType<typeof roleSchema>;

export const RoleModel = defineModel('Role', roleSchema);

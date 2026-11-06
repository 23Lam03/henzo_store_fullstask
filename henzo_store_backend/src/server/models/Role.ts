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
        isCustom: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export type RoleDoc = InferSchemaType<typeof roleSchema>;

export const RoleModel = defineModel('Role', roleSchema);

import { Schema, type InferSchemaType } from 'mongoose';
import { defineModel } from './registry';

const uploadedImageSchema = new Schema(
  {
        filename: { type: String, required: true, unique: true, index: true },
        mimeType: { type: String, required: true },
        size: { type: Number, default: 0 },
        data: { type: Buffer, required: true },
        uploadedBy: { type: String, default: '' },
  },
  { timestamps: true },
);

export type UploadedImageDoc = InferSchemaType<typeof uploadedImageSchema>;

export const UploadedImageModel = defineModel('UploadedImage', uploadedImageSchema);

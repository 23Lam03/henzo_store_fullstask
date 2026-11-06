/**
 * Model SearchHistory — lịch sử tìm kiếm của người dùng (tối đa 10 gần nhất).
 */
import { Schema, type InferSchemaType } from 'mongoose';
import { defineModel } from './registry';

const searchHistorySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    query: { type: String, required: true, trim: true },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

searchHistorySchema.index({ userId: 1, timestamp: -1 });

export type SearchHistoryDoc = InferSchemaType<typeof searchHistorySchema>;

export const SearchHistoryModel = defineModel('SearchHistory', searchHistorySchema);

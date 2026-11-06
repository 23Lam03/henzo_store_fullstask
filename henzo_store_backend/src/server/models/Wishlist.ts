/**
 * Model Wishlist — danh sách yêu thích.
 */
import { Schema, type InferSchemaType } from 'mongoose';
import { defineModel } from './registry';

const wishlistItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  },
  { _id: true },
);

const wishlistSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    items: { type: [wishlistItemSchema], default: [] },
  },
  { timestamps: true },
);

export type WishlistDoc = InferSchemaType<typeof wishlistSchema>;

export const WishlistModel = defineModel('Wishlist', wishlistSchema);

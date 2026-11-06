import { Schema, type InferSchemaType } from 'mongoose';
import { defineModel } from './registry';

const reviewReplySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    userName: { type: String, default: '' },
    comment: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const reviewSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    productName: { type: String, default: '' },
    productImage: { type: String, default: '' },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', index: true },

    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    userName: { type: String, default: '' },
    userAvatar: { type: String, default: '' },

        orderId: { type: Schema.Types.ObjectId, ref: 'Order', index: true },

    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    images: { type: [String], default: [] },

        isVerified: { type: Boolean, default: false },
        isHidden: { type: Boolean, default: false, index: true },

        hasResponse: { type: Boolean, default: false },
    sellerResponse: { type: String, default: '' },
    sellerRespondedAt: { type: Date },

    replies: { type: [reviewReplySchema], default: [] },
  },
  { timestamps: true },
);

reviewSchema.index({ productId: 1, createdAt: -1 });
reviewSchema.index({ storeId: 1, isHidden: 1, createdAt: -1 });

export type ReviewDoc = InferSchemaType<typeof reviewSchema>;

export const ReviewModel = defineModel('Review', reviewSchema);

export function toReviewDto(review: any) {
  if (!review) return null;
  const obj = review.toObject ? review.toObject() : { ...review };
  delete obj.__v;
  return {
    id: String(obj._id),
    productId: obj.productId ? String(obj.productId) : '',
    productName: obj.productName ?? '',
    productImage: obj.productImage ?? '',
    storeId: obj.storeId ? String(obj.storeId) : '',
    storeName: obj.storeName ?? '',
    userId: obj.userId ? String(obj.userId) : '',
    userName: obj.userName ?? '',
    userAvatar: obj.userAvatar ?? '',
    orderId: obj.orderId ? String(obj.orderId) : '',
    rating: obj.rating,
    comment: obj.comment,
    images: obj.images ?? [],
    isVerified: obj.isVerified ?? false,
    isHidden: obj.isHidden ?? false,
    hasResponse: obj.hasResponse ?? false,
    sellerResponse: obj.sellerResponse ?? '',
    replies: (obj.replies ?? []).map((r: any) => ({
      id: String(r._id),
      userId: r.userId ? String(r.userId) : '',
      userName: r.userName ?? '',
      comment: r.comment,
      createdAt: r.createdAt,
    })),
    createdAt: obj.createdAt,
  };
}

export function toSellerReview(review: any) {
  if (!review) return null;
  const obj = review.toObject ? review.toObject() : { ...review };
  delete obj.__v;
  return {
    id: String(obj._id),
    productId: obj.productId ? String(obj.productId) : '',
    productName: obj.productName ?? '',
    productImage: obj.productImage ?? '',
    customerName: obj.userName ?? '',
    customerAvatar: obj.userAvatar ?? '',
    rating: obj.rating,
    content: obj.comment ?? '',
    images: obj.images ?? [],
    isHidden: obj.isHidden ?? false,
    hasResponse: obj.hasResponse ?? false,
    sellerResponse: obj.sellerResponse ?? '',
    createdAt: obj.createdAt,
    storeId: obj.storeId ? String(obj.storeId) : '',
    orderId: obj.orderId ? String(obj.orderId) : '',
  };
}

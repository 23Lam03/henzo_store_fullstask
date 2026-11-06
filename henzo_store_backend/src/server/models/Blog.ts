/**
 * Model Blog — bài viết tin tức.
 */
import { Schema, type InferSchemaType } from 'mongoose';
import { defineModel } from './registry';

const blogSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    excerpt: { type: String, default: '' },
    content: { type: String, default: '' },
    thumbnail: { type: String, default: '' },
    author: { type: String, default: '' },
    authorAvatar: { type: String, default: '' },
    category: { type: String, default: '', index: true },
    views: { type: Number, default: 0 },
    tags: { type: [String], default: [] },
  },
  { timestamps: true },
);

blogSchema.index({ createdAt: -1 });

export type BlogDoc = InferSchemaType<typeof blogSchema>;

export const BlogModel = defineModel('Blog', blogSchema);

export function toBlogDto(blog: any) {
  if (!blog) return null;
  const obj = blog.toObject ? blog.toObject() : { ...blog };
  delete obj.__v;
  return {
    id: String(obj._id),
    title: obj.title,
    slug: obj.slug,
    excerpt: obj.excerpt ?? '',
    content: obj.content ?? '',
    thumbnail: obj.thumbnail ?? '',
    author: obj.author ?? '',
    authorAvatar: obj.authorAvatar ?? '',
    category: obj.category ?? '',
    views: obj.views ?? 0,
    createdAt: obj.createdAt,
  };
}

import mongoose, { type Schema, type InferSchemaType } from 'mongoose';

export function defineModel<S extends Schema>(
  name: string,
  schema: S,
): mongoose.Model<InferSchemaType<S>> {
  const existing = mongoose.models[name];
  if (existing) {
    return existing as mongoose.Model<InferSchemaType<S>>;
  }
  return mongoose.model(name, schema) as mongoose.Model<InferSchemaType<S>>;
}

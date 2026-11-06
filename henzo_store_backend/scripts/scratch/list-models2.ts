import { connectDB, disconnectDB } from '../src/server/db';
import { ProductModel } from '../src/server/models/Product';

function modelName(name: string): string {
  return name
    .replace(/\s+\d+(?:\.\d+)?\s*(?:GB|TB|MB)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function main() {
  await connectDB();
  const docs = (await ProductModel.find({}).select('name slug').lean()) as any[];
  const groups = new Map<string, string[]>();
  for (const d of docs) {
    const m = modelName(d.name);
    groups.set(m, [...(groups.get(m) ?? []), d.name]);
  }
  console.log('UNIQUE (no capacity):', groups.size);
  for (const [m, list] of [...groups.entries()].sort()) {
    console.log(
      `${String(list.length).padStart(3)}x  ${m.padEnd(46)} e.g. ${list[0]}`,
    );
  }
  await disconnectDB();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});

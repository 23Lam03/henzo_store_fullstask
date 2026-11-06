import { connectDB, disconnectDB } from '../src/server/db';
import { BrandModel } from '../src/server/models/Brand';

async function main() {
  await connectDB();
  const brands = (await BrandModel.find({}).lean()) as any[];
  for (const b of brands) {
    console.log(
      `${b.name} | slug=${b.slug} | logo=${b.logo} | banner=${b.banner ?? ''} | color=${b.color} | count=${b.productCount}`,
    );
  }
  await disconnectDB();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});

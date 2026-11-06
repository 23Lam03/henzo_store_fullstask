import { connectDB, disconnectDB } from '../../src/server/db';
import { ProductModel } from '../../src/server/models/Product';
import { PRODUCT_VARIANTS } from '../../../henzo_store/src/data/productVariants';
async function main() {
  await connectDB();
  const rows = await ProductModel.find({}).select('name categoryName brand').lean();
  const set = new Map<string,string>();
  for (const r of rows as any[]) set.set(r.name, r.categoryName);
  console.log('=== distinct product names:', set.size);
  let i=0;
  for (const [n,c] of set) console.log(`${++i}\t${c}\t${n}`);
  await disconnectDB();
}
main().catch((e)=>{console.error(e);process.exit(1);});

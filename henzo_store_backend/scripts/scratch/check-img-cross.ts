import { connectDB, disconnectDB } from '../../src/server/db';
import { ProductModel } from '../../src/server/models/Product';
import { specModelKey } from '../../../henzo_store/src/data/modelSpecs';

(async () => {
  await connectDB();
  const ps = await ProductModel.find({});
  const img2models = new Map<string, Set<string>>();
  for (const p of ps) {
    const m = specModelKey(p.name);
    for (const i of p.images ?? []) {
      const s = img2models.get(i) ?? new Set<string>();
      s.add(m);
      img2models.set(i, s);
    }
  }
  const cross = [...img2models.entries()].filter(([, s]) => s.size > 1);
  const onlyOne = [...img2models.entries()].filter(([, s]) => s.size === 1).length;
  console.log('Tổng ảnh:', img2models.size);
  console.log('Ảnh riêng 1 model:', onlyOne);
  console.log('Ảnh dùng chung >1 model:', cross.length);
  cross.slice(0, 25).forEach(([i, s]) => console.log('  ', [...s].join(' <> '), '|', i.slice(0, 80)));
  await disconnectDB();
})();

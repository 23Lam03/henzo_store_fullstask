import { connectDB, disconnectDB } from '../../src/server/db';
import { ProductModel } from '../../src/server/models/Product';
import { specModelKey } from '../../../henzo_store/src/data/modelSpecs';

(async () => {
  await connectDB();
  const ps = await ProductModel.find({});

  const thumb2models = new Map<string, Set<string>>();
  const modelThumbs = new Map<string, Set<string>>();
  for (const p of ps) {
    const m = specModelKey(p.name);
    const first = (p.images ?? [])[0];
    if (!first) continue;
    const s = thumb2models.get(first) ?? new Set<string>();
    s.add(m);
    thumb2models.set(first, s);
    const t = modelThumbs.get(m) ?? new Set<string>();
    t.add(first);
    modelThumbs.set(m, t);
  }
  const cross = [...thumb2models.entries()].filter(([, s]) => s.size > 1);
  console.log('Thumbnail dùng chung cho >1 model:', cross.length, '/', thumb2models.size);
  console.log('\n--- Model dùng chung thumbnail với model khác (sai ảnh) ---');
  cross.slice(0, 20).forEach(([i, s]) => console.log('  ', [...s].join(' <> ')));
  console.log('\n--- Model có >1 thumbnail khác nhau (đúng, nhiều ảnh) ---');
  console.log('  số model:', modelThumbs.size);
  const multi = [...modelThumbs.entries()].filter(([, t]) => t.size > 1).length;
  console.log('  model nhiều ảnh khác nhau:', multi);
  const one = [...modelThumbs.entries()].filter(([, t]) => t.size === 1).length;
  console.log('  model chỉ 1 ảnh:', one);
  await disconnectDB();
})();

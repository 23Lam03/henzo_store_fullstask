import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function findProjectRoot(startDir: string): string {
  let dir = startDir;
  for (let i = 0; i < 8; i += 1) {
    if (existsSync(resolve(dir, 'package.json'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return startDir;
}

export const PROJECT_ROOT: string = findProjectRoot(

  dirname(dirname(dirname(fileURLToPath(import.meta.url)))),
);

export function resolveFromRoot(dir: string): string {
  return resolve(PROJECT_ROOT, dir);
}

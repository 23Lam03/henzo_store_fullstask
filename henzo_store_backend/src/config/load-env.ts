import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PROJECT_ROOT } from './paths';

function parseEnvFile(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!key || value === '') continue;
    result[key] = value;
  }
  return result;
}

function isProduction(): boolean {
  return (
    process.env.NODE_ENV === 'production' ||
    process.env.RENDER === 'true' ||
    Boolean(process.env.RENDER)
  );
}

export function loadEnvFiles(rootDir?: string): void {

  const here = rootDir ?? PROJECT_ROOT;

  const candidates = [
    '.env.local',
    `.env.${process.env.NODE_ENV ?? 'development'}`,
    '.env',
  ];

  if (!isProduction()) {
    candidates.push('.env.example');
  }

  for (const name of candidates) {
    const file = resolve(here, name);
    if (!existsSync(file)) continue;
    const parsed = parseEnvFile(readFileSync(file, 'utf8'));
    for (const [key, value] of Object.entries(parsed)) {
      if (process.env[key] === undefined) process.env[key] = value;
    }

    if (name !== '.env.example') break;
  }
}

import type { Vehicle } from '@/data/vehicles';
import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// Use a dedicated compare storage file so comparison wishlist and generated
// vehicles are kept separately from other app data.
const dbPath = process.env.COMPARE_DB_PATH ?? (process.env.VERCEL ? join(tmpdir(), 'compare.json') : join(process.cwd(), 'compare.json'));

export type CompareDb = {
  wishlist: string[];
  customVehicles: StoredVehicle[];
};

export type StoredVehicle = Vehicle & {
  source: 'gemini';
  sourceQuery: string;
  generatedAt: string;
};

const defaultDb: CompareDb = {
  wishlist: [],
  customVehicles: [],
};

function normalizeDb(input: Partial<CompareDb> | null | undefined): CompareDb {
  const wishlist = Array.isArray(input?.wishlist)
    ? Array.from(new Set(input.wishlist.filter((item): item is string => typeof item === 'string' && item.length > 0)))
    : [];

  const customVehicles = Array.isArray(input?.customVehicles)
    ? input.customVehicles
        .map((item) => normalizeStoredVehicle(item))
        .filter((item): item is StoredVehicle => item !== null)
    : [];

  return { wishlist, customVehicles };
}

function normalizeStoredVehicle(input: unknown): StoredVehicle | null {
  if (!input || typeof input !== 'object') {
    return null;
  }

  const record = input as Partial<StoredVehicle>;

  if (
    typeof record.id !== 'string' ||
    typeof record.name !== 'string' ||
    typeof record.model !== 'string' ||
    typeof record.year !== 'number' ||
    typeof record.engine !== 'string' ||
    typeof record.type !== 'string' ||
    typeof record.image !== 'string' ||
    !record.specs ||
    typeof record.specs !== 'object'
  ) {
    return null;
  }

  const specs = record.specs as Vehicle['specs'];
  const requiredSpecKeys: Array<keyof Vehicle['specs']> = [
    'hp',
    'torque',
    'transmission',
    'drivetrain',
    'displacement',
    'aspiration',
    'topSpeed',
    'zeroToHundred',
    'weight',
    'fuel',
    'productionYears',
    'bodyStyle',
  ];

  if (requiredSpecKeys.some((key) => typeof specs[key] !== 'string')) {
    return null;
  }

  return {
    id: record.id,
    name: record.name,
    model: record.model,
    year: record.year,
    engine: record.engine,
    type: record.type,
    image: record.image,
    specs,
    source: 'gemini',
    sourceQuery: typeof record.sourceQuery === 'string' ? record.sourceQuery : record.name,
    generatedAt: typeof record.generatedAt === 'string' ? record.generatedAt : new Date().toISOString(),
  };
}

export async function readCompareDb(): Promise<CompareDb> {
  if (!existsSync(dbPath)) {
    await writeCompareDb(defaultDb);
    return defaultDb;
  }

  const raw = await readFile(dbPath, 'utf8');

  if (!raw.trim()) {
    return defaultDb;
  }

  try {
    return normalizeDb(JSON.parse(raw) as Partial<CompareDb>);
  } catch {
    return defaultDb;
  }
}

export async function writeCompareDb(db: CompareDb): Promise<void> {
  const normalized = normalizeDb(db);
  await writeFile(dbPath, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8');
}

export function mergeWishlist(existing: string[], incoming: string[]): string[] {
  const next = [...existing];

  for (const id of incoming) {
    if (!next.includes(id)) {
      next.push(id);
    }
  }

  return next;
}

export function upsertStoredVehicle(existing: StoredVehicle[], nextVehicle: StoredVehicle): StoredVehicle[] {
  const next = [...existing];
  const index = next.findIndex((vehicle) => vehicle.id === nextVehicle.id);

  if (index >= 0) {
    next[index] = nextVehicle;
    return next;
  }

  next.push(nextVehicle);
  return next;
}
import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import { DB_MIGRATIONS_DIR_NAME } from '#lib/assets.ts';

const API_DIR = join(import.meta.dir, '..');
const API_DIST_DIR = join(API_DIR, 'dist');
const API_BINARY_FILE = join(API_DIST_DIR, 'nibrun-api');
const API_ENTRYPOINT = 'src/index.ts';
const DB_MIGRATIONS_DIR = join(API_DIR, 'src/db', DB_MIGRATIONS_DIR_NAME);

console.log('🧹 Cleaning dist dir...');
await rm(API_DIST_DIR, { recursive: true, force: true });

console.log('🔨 Compiling binary...');
const buildResult = await Bun.build({
  entrypoints: [API_ENTRYPOINT],
  compile: {
    outfile: API_BINARY_FILE,
    // @ts-expect-error: assets is still not in the types
    assets: [DB_MIGRATIONS_DIR],
  },
  naming: {
    asset: '[dir]/[name].[ext]',
  },
  minify: { whitespace: true, syntax: true },
  target: 'bun',
});

if (!buildResult.success) {
  console.error('❌ Build failed:', JSON.stringify(buildResult, null, 2));
  process.exit(1);
}

console.log('✅ Done');

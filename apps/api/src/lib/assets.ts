import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

// Shared with the build script, which embeds these folders into the binary under
// the same names.
export const DB_MIGRATIONS_DIR_NAME = 'migrations';
export const PUBLIC_DASHBOARD_DIR_NAME = 'public';

// Where each tree sits when running from source. A compiled binary reads the
// files off `Bun.embeddedFiles` instead, so it never looks these up.
const DB_MIGRATIONS_DIR = resolve(import.meta.dir, '..', 'db', DB_MIGRATIONS_DIR_NAME);
const PUBLIC_DASHBOARD_DIR = resolve(import.meta.dir, '..', '..', PUBLIC_DASHBOARD_DIR_NAME);

/** Keyed by the path of the file relative to the folder it came from. */
export type AssetFiles = Map<string, Blob>;

export function getMigrations(): AssetFiles {
  return isStandalone()
    ? readEmbeddedFolder(DB_MIGRATIONS_DIR_NAME)
    : readFolder(DB_MIGRATIONS_DIR);
}

export function getPublicAssets(): AssetFiles {
  return isStandalone()
    ? readEmbeddedFolder(PUBLIC_DASHBOARD_DIR_NAME)
    : readFolder(PUBLIC_DASHBOARD_DIR);
}

function isStandalone(): boolean {
  // @ts-expect-error: Bun types are not updated
  return Bun.isStandaloneExecutable;
}

// `--asset <folder>` embeds a tree under its basename, which each file keeps as
// the start of its name. Everything is embedded flat, so the name is the filter.
function readEmbeddedFolder(folderName: string): AssetFiles {
  const prefix = `${folderName}/`;

  const files: AssetFiles = new Map();
  for (const file of Bun.embeddedFiles) {
    // @ts-expect-error: Bun types are not updated
    const path: string = file.name;
    if (path.startsWith(prefix)) {
      files.set(path.slice(prefix.length), file);
    }
  }
  return sortedByPath(files);
}

function readFolder(folder: string): AssetFiles {
  if (!existsSync(folder)) {
    return new Map();
  }

  const files: AssetFiles = new Map();
  for (const entry of new Bun.Glob('**/*').scanSync({ cwd: folder, onlyFiles: true })) {
    const filePath = join(folder, entry);
    // Read eagerly, like the embedded files: a static route can't stream a lazy
    // BunFile, it needs the body in memory.
    const fileType = Bun.file(filePath).type;
    files.set(entry, new Blob([readFileSync(filePath)], { type: fileType }));
  }
  return sortedByPath(files);
}

// Migrations run in name order, and neither source promises one.
function sortedByPath(files: AssetFiles): AssetFiles {
  // biome-ignore lint/complexity/useMaxParams: a comparator compares two entries
  return new Map([...files].sort(([a], [b]) => (a < b ? -1 : 1)));
}

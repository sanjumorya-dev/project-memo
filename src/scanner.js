import fs from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_IGNORES = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  '.next',
  '.turbo',
  'coverage',
  '.idea',
  '.vscode',
  '.DS_Store',
]);

const SUPPORTED_EXTENSIONS = new Set(['.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.py']);

export async function scanProject(root) {
  const files = [];
  await walk(root, root, files);
  return files.sort((a, b) => a.localeCompare(b));
}

async function walk(root, currentDir, files) {
  const entries = await fs.readdir(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    if (DEFAULT_IGNORES.has(entry.name)) continue;

    const absolute = path.join(currentDir, entry.name);

    if (entry.isDirectory()) {
      await walk(root, absolute, files);
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (!SUPPORTED_EXTENSIONS.has(ext)) continue;

    files.push(path.relative(root, absolute));
  }
}

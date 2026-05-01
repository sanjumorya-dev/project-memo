import fs from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_IGNORES = new Set([
  '.git', 'node_modules', 'dist', 'build', '.next', '.turbo', 'coverage', '.idea', '.vscode', '.DS_Store'
]);

const SUPPORTED_EXTENSIONS = new Set(['.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.py']);

export async function scanProject(root) {
  const ignores = new Set(DEFAULT_IGNORES);
  for (const item of await readGitignoreLike(root)) ignores.add(item);

  const files = [];
  await walk(root, root, files, ignores);
  return files.sort((a, b) => a.localeCompare(b));
}

async function readGitignoreLike(root) {
  try {
    const content = await fs.readFile(path.join(root, '.gitignore'), 'utf8');
    return content
      .split('\n')
      .map((x) => x.trim())
      .filter((x) => x && !x.startsWith('#'))
      .map((x) => x.replace(/\/$/, ''));
  } catch {
    return [];
  }
}

async function walk(root, currentDir, files, ignores) {
  const entries = await fs.readdir(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    if (ignores.has(entry.name)) continue;

    const absolute = path.join(currentDir, entry.name);
    const relative = path.relative(root, absolute).replace(/\\/g, '/');
    if (ignores.has(relative)) continue;

    if (entry.isDirectory()) {
      await walk(root, absolute, files, ignores);
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (SUPPORTED_EXTENSIONS.has(ext)) files.push(relative);
  }
}

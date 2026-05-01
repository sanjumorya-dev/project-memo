import fs from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_IGNORES = ['.git', 'node_modules', 'dist', 'build', '.next', '.turbo', 'coverage', '.idea', '.vscode', '.DS_Store'];
const SUPPORTED_EXTENSIONS = new Set(['.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.py']);

export async function scanProject(root) {
  const ignoreRules = [
    ...DEFAULT_IGNORES.map((x) => ({ raw: x, regex: globToRegex(x), directoryOnly: true })),
    ...(await readGitignoreLike(root)).map((x) => ({ raw: x, regex: globToRegex(x.pattern), directoryOnly: x.directoryOnly })),
  ];

  const files = [];
  await walk(root, root, files, ignoreRules);
  return files.sort((a, b) => a.localeCompare(b));
}

async function readGitignoreLike(root) {
  try {
    const content = await fs.readFile(path.join(root, '.gitignore'), 'utf8');
    return content
      .split('\n')
      .map((x) => x.trim())
      .filter((x) => x && !x.startsWith('#'))
      .map((line) => ({
        pattern: line.replace(/^\//, '').replace(/\/$/, ''),
        directoryOnly: line.endsWith('/'),
      }));
  } catch {
    return [];
  }
}

async function walk(root, currentDir, files, ignoreRules) {
  const entries = await fs.readdir(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    const absolute = path.join(currentDir, entry.name);
    const relative = path.relative(root, absolute).replace(/\\/g, '/');

    if (shouldIgnore(relative, entry.isDirectory(), ignoreRules)) continue;

    if (entry.isDirectory()) {
      await walk(root, absolute, files, ignoreRules);
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (SUPPORTED_EXTENSIONS.has(ext)) files.push(relative);
  }
}

function shouldIgnore(relativePath, isDirectory, ignoreRules) {
  return ignoreRules.some((rule) => {
    if (rule.directoryOnly && !isDirectory) return false;
    return rule.regex.test(relativePath);
  });
}

function globToRegex(glob) {
  const normalized = glob.replace(/\\/g, '/');
  const escaped = normalized
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '___DOUBLESTAR___')
    .replace(/\*/g, '[^/]*')
    .replace(/___DOUBLESTAR___/g, '.*')
    .replace(/\?/g, '.');

  if (normalized.includes('/')) return new RegExp(`^${escaped}$`);
  return new RegExp(`(^|/)${escaped}($|/)`);
}

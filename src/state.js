import fs from 'node:fs/promises';
import path from 'node:path';

const STATE_PATH = '.project-memory/state.json';

export async function loadState(root) {
  const fullPath = path.join(root, STATE_PATH);
  try {
    const data = await fs.readFile(fullPath, 'utf8');
    return JSON.parse(data);
  } catch {
    return { generatedAt: null, files: {} };
  }
}

export async function saveState(root, state) {
  const fullPath = path.join(root, STATE_PATH);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, JSON.stringify(state, null, 2), 'utf8');
}

import fs from 'node:fs/promises';
import path from 'node:path';
import { sha256 } from './utils/hash.js';
import { parseJavaScript } from './parsers/javascript.js';
import { parsePython } from './parsers/python.js';

export async function analyzeFiles({ root, files, priorState, verbose = false }) {
  const fileState = {};
  const fileSummaries = [];
  const changeEvents = [];
  let changedCount = 0;
  let unchangedCount = 0;

  for (const relativePath of files) {
    const fullPath = path.join(root, relativePath);
    const source = await fs.readFile(fullPath, 'utf8');
    const hash = sha256(source);

    const previous = priorState.files?.[relativePath];
    const changed = !previous || previous.hash !== hash;

    let parsed;
    if (!changed && previous?.analysis) {
      unchangedCount += 1;
      parsed = previous.analysis;
    } else {
      changedCount += 1;
      parsed = parseFile(relativePath, source);
      changeEvents.push({ type: previous ? 'updated' : 'added', file: relativePath });
      if (verbose) console.log(`analyzed ${relativePath}`);
    }

    fileSummaries.push({ file: relativePath, ...parsed });
    fileState[relativePath] = { hash, analysis: parsed };
  }

  for (const oldFile of Object.keys(priorState.files || {})) {
    if (!files.includes(oldFile)) {
      changeEvents.push({ type: 'deleted', file: oldFile });
    }
  }

  return { fileState, fileSummaries, changeEvents, changedCount, unchangedCount };
}

function parseFile(relativePath, source) {
  const ext = path.extname(relativePath).toLowerCase();
  let parsed = { imports: [], exports: [], functions: [], classes: [] };

  try {
    if (['.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx'].includes(ext)) {
      parsed = parseJavaScript(source, ext);
    } else if (ext === '.py') {
      parsed = parsePython(source);
    }
  } catch (error) {
    parsed.parseError = error.message;
  }

  return {
    ...parsed,
    language: detectLanguage(ext),
    summary: compactSummary(relativePath, parsed),
  };
}

function detectLanguage(ext) {
  if (['.js', '.mjs', '.cjs', '.jsx'].includes(ext)) return 'JavaScript';
  if (['.ts', '.tsx'].includes(ext)) return 'TypeScript';
  if (ext === '.py') return 'Python';
  return 'Unknown';
}

function compactSummary(file, parsed) {
  const parts = [];
  if (parsed.classes?.length) parts.push(`${parsed.classes.length} class(es)`);
  if (parsed.functions?.length) parts.push(`${parsed.functions.length} function(s)`);
  if (parsed.imports?.length) parts.push(`${parsed.imports.length} import(s)`);
  if (parsed.exports?.length) parts.push(`${parsed.exports.length} export(s)`);
  return parts.length ? `${file}: ${parts.join(', ')}` : `${file}: minimal structural signals`;
}

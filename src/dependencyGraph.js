import path from 'node:path';

export function buildGraph(fileSummaries) {
  const nodes = new Map();

  for (const file of fileSummaries) {
    nodes.set(file.file, {
      imports: file.imports || [],
      outgoing: new Set(),
      incoming: new Set(),
    });
  }

  for (const [file, meta] of nodes.entries()) {
    for (const imp of meta.imports) {
      const resolved = resolveImport(file, imp, nodes);
      if (!resolved) continue;
      meta.outgoing.add(resolved);
      nodes.get(resolved).incoming.add(file);
    }
  }

  return nodes;
}

export function detectEntrypoints(fileSummaries, graph) {
  const conventional = ['index', 'main', 'app', 'server', 'cli'];
  const scored = [];

  for (const summary of fileSummaries) {
    const name = path.basename(summary.file).toLowerCase();
    const base = name.split('.')[0];
    const node = graph.get(summary.file);
    const score = (conventional.includes(base) ? 2 : 0) + (node?.incoming.size === 0 ? 1 : 0);
    scored.push({ file: summary.file, score });
  }

  return scored.filter((x) => x.score >= 2).map((x) => x.file);
}

function resolveImport(fromFile, importPath, nodes) {
  if (!importPath.startsWith('.')) return null;
  const dir = path.dirname(fromFile);
  const base = path.normalize(path.join(dir, importPath)).replace(/\\/g, '/');
  const candidates = [
    base,
    `${base}.js`,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.jsx`,
    `${base}.py`,
    `${base}/index.js`,
    `${base}/index.ts`,
  ];

  for (const candidate of candidates) {
    if (nodes.has(candidate)) return candidate;
  }
  return null;
}

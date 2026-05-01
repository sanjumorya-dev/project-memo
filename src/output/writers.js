import fs from 'node:fs/promises';
import path from 'node:path';

export async function writeProjectMap(root, summary) {
  const languageRows = Object.entries(summary.languageCounts)
    .map(([lang, count]) => `- ${lang}: ${count} file(s)`)
    .join('\n');

  const entrypoints = summary.entrypoints.length
    ? summary.entrypoints.map((x) => `- ${x}`).join('\n')
    : '- (none detected)';

  const hubs = summary.topHubs.length
    ? summary.topHubs.map((x) => `- ${x.file} (connections: ${x.degree})`).join('\n')
    : '- (none)';

  const content = `# PROJECT_MAP\n\n## High-Level Architecture\nThis project contains **${summary.totalFiles}** source file(s).\n\n## Language Distribution\n${languageRows}\n\n## Probable Entry Points\n${entrypoints}\n\n## Key Module Connectivity\n${hubs}\n\n## Flow (Inferred)\nEntrypoints import feature modules, which fan out to shared utilities and adapters. Follow FILE_INDEX.md dependency edges for exact file-level flow.\n`;

  await fs.writeFile(path.join(root, 'PROJECT_MAP.md'), content, 'utf8');
}

export async function writeFileIndex(root, files, graph) {
  const sections = files.map((file) => {
    const node = graph.get(file.file);
    const calledBy = [...(node?.incoming || [])];
    const calls = [...(node?.outgoing || [])];

    return `### ${file.file}\n- Language: ${file.language}\n- Summary: ${file.summary}\n- Functions: ${formatList(file.functions)}\n- Classes: ${formatList(file.classes)}\n- Imports: ${formatList(file.imports)}\n- Exports: ${formatList(file.exports)}\n- Calls Files: ${formatList(calls)}\n- Called By: ${formatList(calledBy)}\n`;
  });

  const content = `# FILE_INDEX\n\n${sections.join('\n')}`;
  await fs.writeFile(path.join(root, 'FILE_INDEX.md'), content, 'utf8');
}

export async function appendChangelog(root, changeEvents) {
  const filePath = path.join(root, 'CHANGELOG_AI.md');
  const now = new Date().toISOString();

  if (!changeEvents.length) return;

  const header = `\n## ${now}\n`;
  const lines = changeEvents.map((event) => `- ${event.type.toUpperCase()}: ${event.file}`).join('\n');

  await fs.appendFile(filePath, `${header}${lines}\n`, 'utf8');
}

function formatList(items) {
  if (!items || items.length === 0) return '(none)';
  return items.join(', ');
}

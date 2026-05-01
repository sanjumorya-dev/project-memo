import path from 'node:path';
import { scanProject } from './scanner.js';
import { loadState, saveState } from './state.js';
import { analyzeFiles } from './analyzer.js';
import { buildGraph, detectEntrypoints } from './dependencyGraph.js';
import { writeProjectMap, writeFileIndex, appendChangelog } from './output/writers.js';
import { summarizeProject } from './summarizer.js';

export async function run(options) {
  const root = path.resolve(options.root);
  const state = await loadState(root);

  const scanned = await scanProject(root);
  const analysis = await analyzeFiles({ root, files: scanned, priorState: state, verbose: options.verbose });

  const graph = buildGraph(analysis.fileSummaries);
  const entrypoints = detectEntrypoints(analysis.fileSummaries, graph);
  const projectSummary = summarizeProject(analysis.fileSummaries, graph, entrypoints);

  await writeProjectMap(root, projectSummary);
  await writeFileIndex(root, analysis.fileSummaries, graph);
  await appendChangelog(root, analysis.changeEvents);

  await saveState(root, {
    generatedAt: new Date().toISOString(),
    files: analysis.fileState,
  });

  return {
    scanned: scanned.length,
    changed: analysis.changedCount,
    unchanged: analysis.unchangedCount,
  };
}

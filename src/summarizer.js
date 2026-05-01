export function summarizeProject(files, graph, entrypoints) {
  const languageCounts = {};

  for (const file of files) {
    languageCounts[file.language] = (languageCounts[file.language] || 0) + 1;
  }

  const topHubs = [...graph.entries()]
    .map(([file, node]) => ({ file, degree: node.incoming.size + node.outgoing.size }))
    .sort((a, b) => b.degree - a.degree)
    .slice(0, 8);

  return {
    totalFiles: files.length,
    languageCounts,
    entrypoints,
    topHubs,
  };
}

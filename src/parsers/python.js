export function parsePython(source) {
  const lines = source.split('\n');
  const imports = [];
  const exports = [];
  const functions = [];
  const classes = [];

  for (const line of lines) {
    const importMatch = line.match(/^\s*import\s+([\w\.]+)/);
    if (importMatch) imports.push(importMatch[1]);

    const fromImportMatch = line.match(/^\s*from\s+([\w\.]+)\s+import\s+/);
    if (fromImportMatch) imports.push(fromImportMatch[1]);

    const functionMatch = line.match(/^\s*def\s+([A-Za-z_]\w*)\s*\(/);
    if (functionMatch) functions.push(functionMatch[1]);

    const classMatch = line.match(/^\s*class\s+([A-Za-z_]\w*)\s*[:\(]/);
    if (classMatch) classes.push(classMatch[1]);
  }

  for (const fn of functions) {
    if (!fn.startsWith('_')) exports.push(fn);
  }

  return { imports, exports, functions, classes };
}

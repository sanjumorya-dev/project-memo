function regexParseJavaScript(source) {
  const imports = [];
  const exports = [];
  const functions = [];
  const classes = [];

  for (const line of source.split('\n')) {
    const imp = line.match(/^\s*import\s+.+\s+from\s+['\"]([^'\"]+)['\"]/);
    if (imp) imports.push(imp[1]);
    const req = line.match(/require\(['\"]([^'\"]+)['\"]\)/);
    if (req) imports.push(req[1]);

    const expNamed = line.match(/^\s*export\s+(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/);
    if (expNamed) exports.push(expNamed[1]);
    if (/^\s*export\s+default\b/.test(line)) exports.push('default');

    const fn = line.match(/^\s*function\s+([A-Za-z_$][\w$]*)\s*\(/);
    if (fn) functions.push(fn[1]);

    const cls = line.match(/^\s*class\s+([A-Za-z_$][\w$]*)\b/);
    if (cls) classes.push(cls[1]);
  }

  return { imports, exports, functions, classes, parser: 'regex' };
}

export async function parseJavaScript(source, extension) {
  try {
    const parserMod = await import('@babel/parser');
    const traverseMod = await import('@babel/traverse');
    const parse = parserMod.parse;
    const traverse = traverseMod.default.default || traverseMod.default;

    const plugins = ['jsx'];
    if (extension.includes('ts')) plugins.push('typescript');

    const ast = parse(source, {
      sourceType: 'unambiguous',
      plugins,
      errorRecovery: true,
    });

    const imports = [];
    const exports = [];
    const functions = [];
    const classes = [];

    traverse(ast, {
      ImportDeclaration(path) {
        imports.push(path.node.source.value);
      },
      ExportNamedDeclaration(path) {
        if (path.node.declaration?.id?.name) exports.push(path.node.declaration.id.name);
      },
      ExportDefaultDeclaration() {
        exports.push('default');
      },
      FunctionDeclaration(path) {
        if (path.node.id?.name) functions.push(path.node.id.name);
      },
      ClassDeclaration(path) {
        if (path.node.id?.name) classes.push(path.node.id.name);
      },
    });

    return { imports, exports, functions, classes, parser: 'babel-ast' };
  } catch {
    return regexParseJavaScript(source);
  }
}

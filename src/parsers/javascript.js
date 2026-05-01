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

    const expNamed = line.match(/^\s*export\s+(?:async\s+)?(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/);
    if (expNamed) exports.push(expNamed[1]);
    const expList = line.match(/^\s*export\s*\{([^}]+)\}/);
    if (expList) {
      for (const token of expList[1].split(',')) {
        const name = token.trim().split(/\s+as\s+/i)[0]?.trim();
        if (name) exports.push(name);
      }
    }
    if (/^\s*export\s+default\b/.test(line)) exports.push('default');

    const fn = line.match(/^\s*(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/);
    if (fn) functions.push(fn[1]);

    const cls = line.match(/^\s*(?:export\s+)?class\s+([A-Za-z_$][\w$]*)\b/);
    if (cls) classes.push(cls[1]);
  }

  return { imports, exports: [...new Set(exports)], functions: [...new Set(functions)], classes, parser: 'regex' };
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
        const { declaration, specifiers } = path.node;
        if (declaration) {
          if (declaration.type === 'FunctionDeclaration' || declaration.type === 'ClassDeclaration') {
            if (declaration.id?.name) exports.push(declaration.id.name);
          } else if (declaration.type === 'VariableDeclaration') {
            for (const d of declaration.declarations || []) {
              if (d.id?.type === 'Identifier') exports.push(d.id.name);
            }
          }
        }
        for (const specifier of specifiers || []) {
          if (specifier.local?.name) exports.push(specifier.local.name);
        }
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

    return {
      imports,
      exports: [...new Set(exports)],
      functions: [...new Set(functions)],
      classes: [...new Set(classes)],
      parser: 'babel-ast',
    };
  } catch {
    return regexParseJavaScript(source);
  }
}

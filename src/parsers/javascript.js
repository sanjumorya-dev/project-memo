import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';

const traverse = traverseModule.default;

export function parseJavaScript(source, extension) {
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

  return { imports, exports, functions, classes };
}

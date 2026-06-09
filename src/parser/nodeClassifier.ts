import ts from "typescript";
import { Classification, NodeMeta, ValueType } from "./types";

/**
 * Maps a raw TypeScript `SyntaxKind` to the semantic node kind we visualize,
 * and extracts the metadata that drives each geometry's size/motion. Bound to
 * a SourceFile so it can read identifier text. Returns `null` for nodes we
 * don't render (the walker keeps descending into those).
 */
export function createClassifier(sf: ts.SourceFile) {
  const hasAsync = (node: ts.Node): boolean => {
    const mods = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;
    return !!mods?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword);
  };

  /** Count `await` expressions directly inside a function (not nested fns). */
  const countAwaits = (fn: ts.Node): number => {
    let n = 0;
    const visit = (node: ts.Node) => {
      if (ts.isAwaitExpression(node)) n++;
      if (
        node !== fn &&
        (ts.isFunctionDeclaration(node) ||
          ts.isFunctionExpression(node) ||
          ts.isArrowFunction(node) ||
          ts.isMethodDeclaration(node))
      ) {
        return; // don't descend into nested function bodies
      }
      node.forEachChild(visit);
    };
    const body = (fn as { body?: ts.Node }).body;
    body?.forEachChild(visit);
    return n;
  };

  const nameOf = (name?: ts.Node): string => {
    if (!name) return "anonymous";
    if (ts.isIdentifier(name)) return name.text;
    return name.getText(sf);
  };

  const valueType = (init?: ts.Expression): ValueType => {
    if (!init) return "unknown";
    if (ts.isStringLiteral(init) || ts.isTemplateExpression(init))
      return "string";
    if (ts.isNumericLiteral(init)) return "number";
    if (
      init.kind === ts.SyntaxKind.TrueKeyword ||
      init.kind === ts.SyntaxKind.FalseKeyword
    )
      return "boolean";
    if (ts.isObjectLiteralExpression(init) || ts.isArrayLiteralExpression(init))
      return "object";
    if (ts.isArrowFunction(init) || ts.isFunctionExpression(init))
      return "function";
    return "unknown";
  };

  const fnClassification = (
    node: ts.SignatureDeclaration,
    name: string,
  ): Classification => {
    const meta: NodeMeta = {
      params: node.parameters.length,
      awaits: countAwaits(node),
    };
    return { kind: hasAsync(node) ? "async" : "function", name, meta };
  };

  const classify = (node: ts.Node): Classification | null => {
    // Modules — import / export
    if (ts.isImportDeclaration(node)) {
      const spec = node.moduleSpecifier;
      const name = ts.isStringLiteral(spec) ? spec.text : "import";
      return { kind: "module", name, meta: { direction: "import" } };
    }
    if (ts.isExportDeclaration(node) || ts.isExportAssignment(node)) {
      const spec = ts.isExportDeclaration(node) && node.moduleSpecifier;
      const name = spec && ts.isStringLiteral(spec) ? spec.text : "export";
      return { kind: "module", name, meta: { direction: "export" } };
    }

    // Types — class / interface / enum / type alias
    if (ts.isClassDeclaration(node) || ts.isClassExpression(node)) {
      const methods = node.members.filter(
        (m) =>
          ts.isMethodDeclaration(m) ||
          ts.isConstructorDeclaration(m) ||
          ts.isGetAccessorDeclaration(m) ||
          ts.isSetAccessorDeclaration(m),
      ).length;
      return { kind: "class", name: nameOf(node.name), meta: { methods } };
    }
    if (ts.isInterfaceDeclaration(node))
      return {
        kind: "interface",
        name: node.name.text,
        meta: { methods: node.members.length },
      };
    if (ts.isEnumDeclaration(node))
      return { kind: "interface", name: node.name.text, meta: {} };
    if (ts.isTypeAliasDeclaration(node))
      return { kind: "interface", name: node.name.text, meta: {} };

    // Functions / methods / accessors
    if (ts.isFunctionDeclaration(node))
      return fnClassification(node, nameOf(node.name));
    if (ts.isMethodDeclaration(node))
      return fnClassification(node, nameOf(node.name));
    if (ts.isConstructorDeclaration(node))
      return fnClassification(node, "constructor");
    if (ts.isGetAccessorDeclaration(node))
      return fnClassification(node, `get ${nameOf(node.name)}`);
    if (ts.isSetAccessorDeclaration(node))
      return fnClassification(node, `set ${nameOf(node.name)}`);

    // Variables — an arrow/function initializer becomes a function node.
    if (ts.isVariableStatement(node)) {
      const decl = node.declarationList.declarations[0];
      if (decl && ts.isIdentifier(decl.name)) {
        const init = decl.initializer;
        if (init && (ts.isArrowFunction(init) || ts.isFunctionExpression(init)))
          return fnClassification(init, decl.name.text);
        return {
          kind: "variable",
          name: decl.name.text,
          meta: { valueType: valueType(init) },
        };
      }
    }

    // Loops
    if (
      ts.isForStatement(node) ||
      ts.isForOfStatement(node) ||
      ts.isForInStatement(node)
    )
      return { kind: "loop", name: "for", meta: {} };
    if (ts.isWhileStatement(node))
      return { kind: "loop", name: "while", meta: {} };
    if (ts.isDoStatement(node))
      return { kind: "loop", name: "do…while", meta: {} };

    // Branch — if / else
    if (ts.isIfStatement(node))
      return {
        kind: "branch",
        name: "if",
        meta: { conditions: node.elseStatement ? 2 : 1 },
      };

    // Try / catch
    if (ts.isTryStatement(node))
      return { kind: "trycatch", name: "try", meta: {} };

    return null;
  };

  return { classify };
}

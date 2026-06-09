import ts from "typescript";
import { ASTNode } from "./types";
import { buildTree } from "./astWalker";

export type {
  ASTNode,
  NodeKind,
  NodeMeta,
  ValueType,
  Classification,
} from "./types";

/**
 * Parse source text into a tree of structural nodes using the TypeScript
 * compiler API. Creates the SourceFile, seeds an implicit `program` root, then
 * hands off to the AST walker. Never throws on malformed input — the compiler
 * parses in error-recovery mode.
 */
export function parseCode(source: string): ASTNode {
  const sf = ts.createSourceFile(
    "input.tsx",
    source,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
    ts.ScriptKind.TSX,
  );

  const lineCount = Math.max(1, source.split("\n").length);
  const root: ASTNode = {
    id: "root",
    name: "program",
    kind: "program",
    startLine: 1,
    endLine: lineCount,
    children: [],
    lines: lineCount,
    depth: 0,
    meta: {},
  };

  return buildTree(sf, root);
}

/** Flatten a tree into a list (depth-first, parents before children). */
export function flatten(node: ASTNode): ASTNode[] {
  const out: ASTNode[] = [];
  const walk = (n: ASTNode) => {
    out.push(n);
    n.children.forEach(walk);
  };
  walk(node);
  return out;
}

/** Extract the source text for a node from the full source. */
export function nodeSource(source: string, node: ASTNode): string {
  return source
    .split("\n")
    .slice(node.startLine - 1, node.endLine)
    .join("\n");
}

import ts from "typescript";
import { ASTNode } from "./types";
import { createClassifier } from "./nodeClassifier";

const MAX_NODES = 400;

/**
 * Recursively traverse a SourceFile, emitting an ASTNode for every construct
 * the classifier recognizes and preserving nesting. Unrecognized nodes are
 * transparent — the walk descends through them to the next real construct.
 */
export function buildTree(sf: ts.SourceFile, root: ASTNode): ASTNode {
  const { classify } = createClassifier(sf);
  const lineOf = (pos: number) =>
    sf.getLineAndCharacterOfPosition(pos).line + 1;

  let counter = 0;
  let total = 0;

  const walk = (tsNode: ts.Node, parent: ASTNode) => {
    tsNode.forEachChild((child) => {
      if (total >= MAX_NODES) return;
      const det = classify(child);
      if (det) {
        const start = lineOf(child.getStart(sf));
        const end = lineOf(child.getEnd());
        const node: ASTNode = {
          id: `n${counter++}`,
          name: det.name,
          kind: det.kind,
          startLine: start,
          endLine: end,
          children: [],
          lines: end - start + 1,
          depth: parent.depth + 1,
          meta: det.meta,
        };
        parent.children.push(node);
        total++;
        walk(child, node);
      } else {
        walk(child, parent);
      }
    });
  };

  walk(sf, root);
  return root;
}

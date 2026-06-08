import { CodeNode, flatten } from "./parse";

export interface Placed {
  node: CodeNode;
  position: [number, number, number];
  /** Box dimensions [w, h, d]. */
  size: [number, number, number];
  color: string;
  parentId: string | null;
}

export interface LayoutResult {
  placed: Placed[];
  byId: Map<string, Placed>;
  edges: { from: [number, number, number]; to: [number, number, number] }[];
}

const SIBLING_GAP = 2.4;
const LEVEL_GAP = 3.4;
const DEPTH_FAN = 1.6;

const COLORS: Record<CodeNode["kind"], string> = {
  program: "#64748b",
  class: "#f59e0b",
  interface: "#a855f7",
  function: "#22d3ee",
  method: "#34d399",
  variable: "#60a5fa",
  block: "#94a3b8",
};

function boxHeight(lines: number): number {
  return Math.min(4, Math.max(0.5, Math.sqrt(lines) * 0.45));
}

/**
 * Lay out a parsed tree as a 3D tidy tree growing along +Y. Returns absolute
 * positions for every node plus parent→child edge segments.
 */
export function layout(root: CodeNode): LayoutResult {
  // First pass: assign an x-slot per node (classic tidy-tree packing).
  const xSlot = new Map<string, number>();
  let cursor = 0;

  const assignX = (node: CodeNode): number => {
    if (node.children.length === 0) {
      const x = cursor;
      cursor += 1;
      xSlot.set(node.id, x);
      return x;
    }
    const childXs = node.children.map(assignX);
    const x = (childXs[0] + childXs[childXs.length - 1]) / 2;
    xSlot.set(node.id, x);
    return x;
  };
  assignX(root);

  // Center the whole layout on x.
  const xs = [...xSlot.values()];
  const xMid = (Math.min(...xs) + Math.max(...xs)) / 2;

  const placed: Placed[] = [];
  const byId = new Map<string, Placed>();
  const edges: LayoutResult["edges"] = [];

  const positionOf = (node: CodeNode): [number, number, number] => [
    (xSlot.get(node.id)! - xMid) * SIBLING_GAP,
    node.depth * LEVEL_GAP,
    -node.depth * DEPTH_FAN,
  ];

  for (const node of flatten(root)) {
    if (node.kind === "program") continue; // root is implicit, not drawn
    const position = positionOf(node);
    const h = boxHeight(node.lines);
    const p: Placed = {
      node,
      position,
      size: [1.7, h, 1.7],
      color: COLORS[node.kind],
      parentId: null,
    };
    placed.push(p);
    byId.set(node.id, p);
  }

  // Build edges and parent links (skip edges to the implicit root).
  const linkChildren = (node: CodeNode) => {
    for (const child of node.children) {
      const childPlaced = byId.get(child.id);
      if (childPlaced) {
        if (node.kind !== "program") {
          childPlaced.parentId = node.id;
          edges.push({ from: positionOf(node), to: positionOf(child) });
        }
      }
      linkChildren(child);
    }
  };
  linkChildren(root);

  return { placed, byId, edges };
}

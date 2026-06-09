import { ASTNode, flatten } from "@/parser/astParser";
import { Shape, SHAPE_BY_KIND, colorOf } from "./sceneMap";

export interface Placed {
  node: ASTNode;
  position: [number, number, number];
  shape: Shape;
  color: string;
  parentId: string | null;
}

export interface LayoutResult {
  placed: Placed[];
  byId: Map<string, Placed>;
  edges: { from: [number, number, number]; to: [number, number, number] }[];
}

const SIBLING_GAP = 2.8;
const LEVEL_GAP = 3.6;
const DEPTH_FAN = 1.6;

/**
 * Lay out a parsed tree as a 3D tidy tree growing along +Y. Geometry type and
 * sizing are resolved per-node downstream (see NodeMesh); this stage only
 * computes absolute positions and parent→child edge segments.
 */
export function layout(root: ASTNode): LayoutResult {
  // First pass: assign an x-slot per node (classic tidy-tree packing).
  const xSlot = new Map<string, number>();
  let cursor = 0;

  const assignX = (node: ASTNode): number => {
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
  const xMid = xs.length ? (Math.min(...xs) + Math.max(...xs)) / 2 : 0;

  const placed: Placed[] = [];
  const byId = new Map<string, Placed>();
  const edges: LayoutResult["edges"] = [];

  const positionOf = (node: ASTNode): [number, number, number] => [
    (xSlot.get(node.id)! - xMid) * SIBLING_GAP,
    node.depth * LEVEL_GAP,
    -node.depth * DEPTH_FAN,
  ];

  for (const node of flatten(root)) {
    if (node.kind === "program") continue; // root is implicit, not drawn
    const p: Placed = {
      node,
      position: positionOf(node),
      shape: SHAPE_BY_KIND[node.kind].shape,
      color: colorOf(node),
      parentId: null,
    };
    placed.push(p);
    byId.set(node.id, p);
  }

  // Build edges and parent links (skip edges to the implicit root).
  const linkChildren = (node: ASTNode) => {
    for (const child of node.children) {
      const childPlaced = byId.get(child.id);
      if (childPlaced && node.kind !== "program") {
        childPlaced.parentId = node.id;
        edges.push({ from: positionOf(node), to: positionOf(child) });
      }
      linkChildren(child);
    }
  };
  linkChildren(root);

  return { placed, byId, edges };
}

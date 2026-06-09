import { ASTNode, NodeKind, ValueType } from "@/parser/astParser";

/**
 * Scene mapper — translates a semantic AST node kind into a 3D geometry
 * archetype. Single source of truth for the AST → shape design.
 */
export type Shape =
  | "box" // function declaration
  | "torus" // for / while loop
  | "sphere" // async / await
  | "octahedron" // if / else branch
  | "cylinder" // class declaration
  | "dot" // variable / const
  | "tube" // import / export
  | "icosahedron"; // try / catch

export interface ShapeSpec {
  shape: Shape;
  color: string;
  /** Human label for the legend / inspector. */
  label: string;
  /** three.js geometry name, surfaced in the inspector. */
  geometry: string;
  /** Short note on what the geometry encodes. */
  note: string;
}

export const SHAPE_BY_KIND: Record<NodeKind, ShapeSpec> = {
  program: {
    shape: "box",
    color: "#64748b",
    label: "program",
    geometry: "Group",
    note: "root scope",
  },
  function: {
    shape: "box",
    color: "#7c6cf0",
    label: "Function declaration",
    geometry: "BoxGeometry",
    note: "height = line count, width = param count",
  },
  loop: {
    shape: "torus",
    color: "#34d399",
    label: "For / while loop",
    geometry: "TorusGeometry",
    note: "spins continuously, radius = iteration depth",
  },
  async: {
    shape: "sphere",
    color: "#f5a524",
    label: "Async / await",
    geometry: "SphereGeometry",
    note: "pulsing sphere — pulse speed = await depth",
  },
  branch: {
    shape: "octahedron",
    color: "#f0734a",
    label: "If / else branch",
    geometry: "OctahedronGeometry",
    note: "diamond — edges shoot out per condition",
  },
  class: {
    shape: "cylinder",
    color: "#3b82f6",
    label: "Class declaration",
    geometry: "CylinderGeometry",
    note: "height = method count, stacked method rings",
  },
  interface: {
    shape: "cylinder",
    color: "#a855f7",
    label: "Interface / enum",
    geometry: "CylinderGeometry",
    note: "wireframe shell — member count = height",
  },
  variable: {
    shape: "dot",
    color: "#94a3b8",
    label: "Variable / const",
    geometry: "Points / Sprite",
    note: "floating dot — color = value type",
  },
  module: {
    shape: "tube",
    color: "#8b7cf0",
    label: "Import / export",
    geometry: "TubeGeometry",
    note: "glowing arc between module nodes",
  },
  trycatch: {
    shape: "icosahedron",
    color: "#10b981",
    label: "Try / catch",
    geometry: "IcosahedronGeometry",
    note: "bubble shield — dashed ring = error boundary",
  },
};

/** Variable dot color is driven by the inferred value type. */
export const VALUE_TYPE_COLOR: Record<ValueType, string> = {
  string: "#f0734a",
  number: "#3b82f6",
  boolean: "#f5a524",
  object: "#34d399",
  function: "#7c6cf0",
  unknown: "#94a3b8",
};

/** Resolve the final display color for a node (variables vary by value type). */
export function colorOf(node: ASTNode): string {
  if (node.kind === "variable" && node.meta.valueType) {
    return VALUE_TYPE_COLOR[node.meta.valueType];
  }
  return SHAPE_BY_KIND[node.kind].color;
}

/** Legend rows, in the order shown in the AST → shape design. */
export const LEGEND_KINDS: NodeKind[] = [
  "function",
  "loop",
  "async",
  "branch",
  "class",
  "variable",
  "module",
  "trycatch",
];

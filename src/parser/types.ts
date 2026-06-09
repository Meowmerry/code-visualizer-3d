/**
 * Shared AST types for the parsing pipeline:
 *   astParser → astWalker → nodeClassifier
 *
 * Each `NodeKind` maps to a distinct 3D geometry in the scene (see
 * scene/sceneMap.ts), following the AST → shape design.
 */
export type NodeKind =
  | "program"
  | "function" // function / method declaration  → Box
  | "loop" // for / while / do                    → Torus
  | "async" // async fn (uses await)              → Sphere
  | "branch" // if / else                         → Octahedron
  | "class" // class declaration                  → Cylinder
  | "interface" // interface / enum / type        → Cylinder (wire)
  | "variable" // variable / const                → floating dot
  | "module" // import / export                   → Tube
  | "trycatch"; // try / catch                    → Icosahedron

export type ValueType =
  | "string"
  | "number"
  | "boolean"
  | "object"
  | "function"
  | "unknown";

/** Geometry-driving metadata extracted while walking the AST. */
export interface NodeMeta {
  /** Function param count → box width. */
  params?: number;
  /** Class method count → cylinder height / ring stack. */
  methods?: number;
  /** if/else branch count → octahedron edges. */
  conditions?: number;
  /** await count → sphere pulse speed. */
  awaits?: number;
  /** Value type of a variable → dot color. */
  valueType?: ValueType;
  /** import vs export, for module nodes. */
  direction?: "import" | "export";
}

export interface ASTNode {
  id: string;
  name: string;
  kind: NodeKind;
  startLine: number; // 1-based, inclusive
  endLine: number; // 1-based, inclusive
  children: ASTNode[];
  /** Number of source lines spanned by this node. */
  lines: number;
  /** Nesting depth, 0 for the implicit program root. */
  depth: number;
  meta: NodeMeta;
}

/** Result of classifying a raw `ts.Node` into a visualized construct. */
export interface Classification {
  kind: NodeKind;
  name: string;
  meta: NodeMeta;
}

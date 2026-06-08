export type NodeKind =
  | "program"
  | "class"
  | "interface"
  | "function"
  | "method"
  | "variable"
  | "block";

export interface CodeNode {
  id: string;
  name: string;
  kind: NodeKind;
  startLine: number; // 1-based, inclusive
  endLine: number; // 1-based, inclusive
  children: CodeNode[];
  /** Number of source lines spanned by this node. */
  lines: number;
  /** Nesting depth, 0 for top-level. */
  depth: number;
}

interface Detection {
  kind: NodeKind;
  name: string;
}

const PATTERNS: { kind: NodeKind; re: RegExp }[] = [
  { kind: "class", re: /\bclass\s+([A-Za-z0-9_$]+)/ },
  { kind: "interface", re: /\b(?:interface|enum)\s+([A-Za-z0-9_$]+)/ },
  {
    kind: "function",
    re: /\bfunction\s*\*?\s*([A-Za-z0-9_$]+)\s*\(/,
  },
  {
    kind: "function",
    re: /\b(?:const|let|var)\s+([A-Za-z0-9_$]+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z0-9_$]+)\s*=>/,
  },
];

const METHOD_RE =
  /^\s*(?:(?:public|private|protected|static|readonly|async|get|set|override)\s+)*\*?\s*([A-Za-z0-9_$]+)\s*\([^)]*\)\s*(?::\s*[^={]+)?\{/;

const KEYWORDS = new Set([
  "if",
  "for",
  "while",
  "switch",
  "catch",
  "return",
  "function",
  "constructor",
]);

/**
 * Detect whether a line opens a named construct. `insideClass` enables
 * method detection (bare `name(...) {` shorthand only makes sense in a class).
 */
function detect(line: string, insideClass: boolean): Detection | null {
  for (const { kind, re } of PATTERNS) {
    const m = line.match(re);
    if (m) return { kind, name: m[1] };
  }
  if (insideClass) {
    const m = line.match(METHOD_RE);
    if (m && !KEYWORDS.has(m[1])) {
      return { kind: m[1] === "constructor" ? "method" : "method", name: m[1] };
    }
  }
  return null;
}

/**
 * Count net brace delta on a line while ignoring braces that appear inside
 * single/double/back-quoted strings and // line comments. Block comments are
 * not fully handled but rarely contain unbalanced braces in practice.
 */
function braceScan(line: string): { open: number; delta: number } {
  let depth = 0;
  let open = 0;
  let str: string | null = null;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (str) {
      if (c === "\\") {
        i++;
        continue;
      }
      if (c === str) str = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      str = c;
      continue;
    }
    if (c === "/" && line[i + 1] === "/") break;
    if (c === "{") {
      depth++;
      open++;
    } else if (c === "}") {
      depth--;
    }
  }
  return { open, delta: depth };
}

interface Frame {
  node: CodeNode;
  /** Brace depth at which this node's body was opened. */
  openDepth: number;
}

/**
 * Parse source text into a tree of structural nodes. Heuristic and
 * language-agnostic-ish, tuned for JS/TS. Never throws on malformed input.
 */
export function parseCode(source: string): CodeNode {
  const lines = source.split("\n");
  const root: CodeNode = {
    id: "root",
    name: "program",
    kind: "program",
    startLine: 1,
    endLine: lines.length,
    children: [],
    lines: lines.length,
    depth: 0,
  };

  const stack: Frame[] = [{ node: root, openDepth: 0 }];
  let depth = 0;
  let counter = 0;

  for (let i = 0; i < lines.length; i++) {
    const lineNo = i + 1;
    const line = lines[i];
    const parent = stack[stack.length - 1];
    const insideClass =
      parent.node.kind === "class" || parent.node.kind === "interface";

    const detection = detect(line, insideClass);
    const { open, delta } = braceScan(line);

    // Open a new construct if this line declares one and opens a body on it.
    if (detection && open > 0) {
      const node: CodeNode = {
        id: `n${counter++}`,
        name: detection.name,
        kind: detection.kind,
        startLine: lineNo,
        endLine: lineNo,
        children: [],
        lines: 1,
        depth: parent.node.depth + 1,
      };
      parent.node.children.push(node);
      // The body opens at the current depth; close when we return to it.
      stack.push({ node, openDepth: depth });
    }

    depth += delta;

    // Close any frames whose body has fully closed.
    while (
      stack.length > 1 &&
      depth <= stack[stack.length - 1].openDepth
    ) {
      const frame = stack.pop()!;
      frame.node.endLine = lineNo;
      frame.node.lines = frame.node.endLine - frame.node.startLine + 1;
    }
  }

  // Close anything left open at EOF.
  while (stack.length > 1) {
    const frame = stack.pop()!;
    frame.node.endLine = lines.length;
    frame.node.lines = frame.node.endLine - frame.node.startLine + 1;
  }

  return root;
}

/** Flatten a tree into a list (depth-first, parents before children). */
export function flatten(node: CodeNode): CodeNode[] {
  const out: CodeNode[] = [];
  const walk = (n: CodeNode) => {
    out.push(n);
    n.children.forEach(walk);
  };
  walk(node);
  return out;
}

/** Extract the source text for a node from the full source. */
export function nodeSource(source: string, node: CodeNode): string {
  return source
    .split("\n")
    .slice(node.startLine - 1, node.endLine)
    .join("\n");
}

import { create } from "zustand";
import { CodeNode, parseCode, nodeSource } from "./parse";
import { SAMPLE_CODE } from "./sample";

interface VisualizerState {
  code: string;
  tree: CodeNode;
  selectedId: string | null;
  hoveredId: string | null;

  explanation: string | null;
  explaining: boolean;
  explainError: string | null;

  setCode: (code: string) => void;
  select: (id: string | null) => void;
  hover: (id: string | null) => void;
  explainSelected: () => Promise<void>;
}

export const useStore = create<VisualizerState>((set, get) => ({
  code: SAMPLE_CODE,
  tree: parseCode(SAMPLE_CODE),
  selectedId: null,
  hoveredId: null,

  explanation: null,
  explaining: false,
  explainError: null,

  setCode: (code) =>
    set({
      code,
      tree: parseCode(code),
      // A re-parse invalidates the current selection/explanation.
      selectedId: null,
      explanation: null,
      explainError: null,
    }),

  select: (id) => set({ selectedId: id, explanation: null, explainError: null }),

  hover: (id) => set({ hoveredId: id }),

  explainSelected: async () => {
    const { selectedId, tree, code } = get();
    if (!selectedId) return;

    const node = findNode(tree, selectedId);
    if (!node) return;

    set({ explaining: true, explanation: null, explainError: null });
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: node.name,
          kind: node.kind,
          snippet: nodeSource(code, node),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${res.status})`);
      }
      const data = await res.json();
      set({ explanation: data.explanation, explaining: false });
    } catch (err) {
      set({
        explainError: err instanceof Error ? err.message : "Unknown error",
        explaining: false,
      });
    }
  },
}));

function findNode(node: CodeNode, id: string): CodeNode | null {
  if (node.id === id) return node;
  for (const child of node.children) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
}

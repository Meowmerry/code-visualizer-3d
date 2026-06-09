import { create } from "zustand";
import { ASTNode, parseCode } from "@/parser/astParser";
import { SAMPLE_CODE } from "@/sample";

interface SceneStore {
  /** Raw source in the editor. */
  code: string;
  /** Parsed scene graph (sceneGraph: ASTNode[] + AI annotations). */
  tree: ASTNode;
  selectedId: string | null;
  hoveredId: string | null;

  /** Streamed Claude explanation for the selected node. */
  aiText: string;
  explaining: boolean;
  explainError: string | null;

  setCode: (code: string) => void;
  select: (id: string | null) => void;
  hover: (id: string | null) => void;

  // AI streaming primitives — driven by the useNodeExplain hook.
  startExplain: () => void;
  appendAI: (chunk: string) => void;
  finishExplain: () => void;
  failExplain: (message: string) => void;
}

export const useSceneStore = create<SceneStore>((set) => ({
  code: SAMPLE_CODE,
  tree: parseCode(SAMPLE_CODE),
  selectedId: null,
  hoveredId: null,

  aiText: "",
  explaining: false,
  explainError: null,

  setCode: (code) =>
    set({
      code,
      tree: parseCode(code),
      // A re-parse invalidates the current selection/explanation.
      selectedId: null,
      aiText: "",
      explainError: null,
    }),

  select: (id) =>
    set({ selectedId: id, aiText: "", explainError: null, explaining: false }),

  hover: (id) => set({ hoveredId: id }),

  startExplain: () => set({ explaining: true, aiText: "", explainError: null }),
  appendAI: (chunk) => set((s) => ({ aiText: s.aiText + chunk })),
  finishExplain: () => set({ explaining: false }),
  failExplain: (message) => set({ explaining: false, explainError: message }),
}));

/** Depth-first lookup of a node by id within the scene graph. */
export function findNode(node: ASTNode, id: string): ASTNode | null {
  if (node.id === id) return node;
  for (const child of node.children) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
}

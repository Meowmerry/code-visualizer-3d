"use client";

import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { CodeNode } from "@/lib/parse";

function find(node: CodeNode, id: string): CodeNode | null {
  if (node.id === id) return node;
  for (const c of node.children) {
    const f = find(c, id);
    if (f) return f;
  }
  return null;
}

const KIND_COLOR: Record<string, string> = {
  class: "text-amber-400",
  interface: "text-purple-400",
  function: "text-cyan-400",
  method: "text-emerald-400",
  variable: "text-blue-400",
  block: "text-slate-400",
  program: "text-slate-400",
};

export function InfoPanel() {
  const tree = useStore((s) => s.tree);
  const selectedId = useStore((s) => s.selectedId);
  const explanation = useStore((s) => s.explanation);
  const explaining = useStore((s) => s.explaining);
  const explainError = useStore((s) => s.explainError);
  const explain = useStore((s) => s.explainSelected);

  const selected = useMemo(
    () => (selectedId ? find(tree, selectedId) : null),
    [tree, selectedId],
  );

  return (
    <div className="flex h-full flex-col bg-bg-panel">
      <div className="border-b border-white/5 px-4 py-2.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Inspector
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {!selected ? (
          <p className="text-sm leading-relaxed text-slate-500">
            Click a node in the 3D view to inspect it. Each box is a construct in
            your code — height scales with its line count, color with its kind.
          </p>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-[11px] font-semibold uppercase tracking-wider ${
                    KIND_COLOR[selected.kind] ?? "text-slate-400"
                  }`}
                >
                  {selected.kind}
                </span>
              </div>
              <h2 className="mt-1 break-all text-lg font-semibold text-slate-100">
                {selected.name}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                lines {selected.startLine}–{selected.endLine} ·{" "}
                {selected.lines} line{selected.lines === 1 ? "" : "s"} ·{" "}
                {selected.children.length} child
                {selected.children.length === 1 ? "" : "ren"}
              </p>
            </div>

            <button
              type="button"
              onClick={explain}
              disabled={explaining}
              className="w-full rounded-md bg-cyan-500/90 px-3 py-2 text-sm font-medium text-bg transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {explaining ? "Explaining…" : "Explain with Claude"}
            </button>

            {explainError && (
              <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {explainError}
              </p>
            )}

            {explanation && (
              <div className="rounded-md border border-white/5 bg-bg-subtle px-3 py-3 text-sm leading-relaxed text-slate-300">
                {explanation}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

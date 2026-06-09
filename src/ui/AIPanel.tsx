"use client";

import { useMemo } from "react";
import { useSceneStore, findNode } from "@/store/sceneStore";
import { ASTNode } from "@/parser/astParser";
import { SHAPE_BY_KIND, colorOf } from "@/scene/sceneMap";

/** Short, human-friendly facts pulled from the node's geometry metadata. */
function metaFacts(node: ASTNode): string[] {
  const m = node.meta;
  const facts: string[] = [];
  if (m.params !== undefined)
    facts.push(`${m.params} param${m.params === 1 ? "" : "s"}`);
  if (m.methods !== undefined)
    facts.push(`${m.methods} member${m.methods === 1 ? "" : "s"}`);
  if (m.awaits) facts.push(`${m.awaits} await${m.awaits === 1 ? "" : "s"}`);
  if (m.conditions !== undefined)
    facts.push(`${m.conditions} branch${m.conditions === 1 ? "" : "es"}`);
  if (m.valueType) facts.push(`${m.valueType} value`);
  if (m.direction) facts.push(m.direction);
  return facts;
}

/**
 * Slide-in AI drawer. Opens on node select; the explanation streams in
 * automatically via the useNodeExplain hook (mounted at the app root).
 */
export function AIPanel() {
  const tree = useSceneStore((s) => s.tree);
  const selectedId = useSceneStore((s) => s.selectedId);
  const select = useSceneStore((s) => s.select);
  const aiText = useSceneStore((s) => s.aiText);
  const explaining = useSceneStore((s) => s.explaining);
  const explainError = useSceneStore((s) => s.explainError);

  const selected = useMemo(
    () => (selectedId ? findNode(tree, selectedId) : null),
    [tree, selectedId],
  );

  const open = !!selected;
  const spec = selected ? SHAPE_BY_KIND[selected.kind] : null;
  const accent = selected ? colorOf(selected) : "#64748b";

  return (
    <aside
      className={`pointer-events-none absolute right-0 top-0 z-10 flex h-full w-[340px] max-w-[88vw] flex-col border-l border-white/10 bg-bg-panel/95 backdrop-blur transition-transform duration-300 ease-out ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {selected && spec && (
        <div className="pointer-events-auto flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Inspector
            </span>
            <button
              type="button"
              onClick={() => select(null)}
              className="rounded p-1 text-slate-500 transition hover:bg-white/5 hover:text-slate-200"
              aria-label="Close inspector"
            >
              ✕
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{ backgroundColor: accent }}
                  />
                  <span
                    className="text-[11px] font-semibold uppercase tracking-wider"
                    style={{ color: accent }}
                  >
                    {spec.label}
                  </span>
                </div>
                <h2 className="mt-1.5 break-all text-lg font-semibold text-slate-100">
                  {selected.name}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  lines {selected.startLine}–{selected.endLine} ·{" "}
                  {selected.lines} line{selected.lines === 1 ? "" : "s"} ·{" "}
                  {selected.children.length} child
                  {selected.children.length === 1 ? "" : "ren"}
                </p>
              </div>

              <div className="rounded-md border border-white/5 bg-bg-subtle px-3 py-2.5">
                <p className="text-[11px] uppercase tracking-wider text-slate-500">
                  {spec.geometry}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  {spec.note}
                </p>
                {metaFacts(selected).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {metaFacts(selected).map((f) => (
                      <span
                        key={f}
                        className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-300"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Claude explains
                  </span>
                </div>

                {explainError ? (
                  <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                    {explainError}
                  </p>
                ) : (
                  <div className="rounded-md border border-white/5 bg-bg-subtle px-3 py-3 text-sm leading-relaxed text-slate-300">
                    {aiText || (
                      <span className="text-slate-500">
                        {explaining ? "Thinking…" : "Streaming explanation…"}
                      </span>
                    )}
                    {explaining && (
                      <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-cyan-400 align-middle" />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

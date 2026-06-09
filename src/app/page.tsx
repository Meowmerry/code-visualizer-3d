"use client";

import dynamic from "next/dynamic";
import { CodeEditor } from "@/ui/CodeEditor";
import { AIPanel } from "@/ui/AIPanel";
import { Legend } from "@/ui/Legend";
import { useNodeExplain } from "@/ai/useNodeExplain";

// The 3D canvas is strictly client-side; skip SSR to avoid a hydration mismatch.
const SceneCanvas = dynamic(
  () => import("@/scene/SceneCanvas").then((m) => m.SceneCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm text-slate-500">
        Loading scene…
      </div>
    ),
  },
);

export default function Home() {
  // Stream a Claude explanation whenever a node is selected.
  useNodeExplain();

  return (
    <main className="flex h-screen w-screen flex-col">
      <header className="flex items-center gap-3 border-b border-white/5 bg-bg-panel px-5 py-3">
        <div className="h-2.5 w-2.5 rounded-sm bg-cyan-400" />
        <h1 className="text-sm font-semibold tracking-wide text-slate-200">
          Code Visualizer <span className="text-cyan-400">3D</span>
        </h1>
        <span className="ml-2 text-xs text-slate-500">
          structure of your code as an explorable scene
        </span>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="w-[30%] min-w-[300px] max-w-[520px] border-r border-white/5">
          <CodeEditor />
        </aside>

        <section className="relative min-w-0 flex-1 overflow-hidden">
          <SceneCanvas />
          <Legend />
          {/* AI inspector slides in from the right on node select. */}
          <AIPanel />
        </section>
      </div>
    </main>
  );
}

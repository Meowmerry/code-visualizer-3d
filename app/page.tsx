"use client";

import dynamic from "next/dynamic";
import { EditorPanel } from "@/components/EditorPanel";
import { InfoPanel } from "@/components/InfoPanel";
import { Legend } from "@/components/Legend";

// The 3D canvas is strictly client-side; skip SSR to avoid a hydration mismatch.
const Scene = dynamic(
  () => import("@/components/Scene").then((m) => m.Scene),
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
          <EditorPanel />
        </aside>

        <section className="relative min-w-0 flex-1">
          <Scene />
          <Legend />
        </section>

        <aside className="w-[24%] min-w-[260px] max-w-[400px] border-l border-white/5">
          <InfoPanel />
        </aside>
      </div>
    </main>
  );
}

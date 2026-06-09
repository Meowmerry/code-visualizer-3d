"use client";

import Editor from "@monaco-editor/react";
import { useSceneStore } from "@/store/sceneStore";

export function CodeEditor() {
  const code = useSceneStore((s) => s.code);
  const setCode = useSceneStore((s) => s.setCode);

  return (
    <div className="flex h-full flex-col bg-bg-panel">
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-2.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Source
        </span>
        <span className="text-[10px] text-slate-500">
          edits re-render the scene live
        </span>
      </div>
      <div className="min-h-0 flex-1">
        <Editor
          height="100%"
          defaultLanguage="typescript"
          theme="vs-dark"
          value={code}
          onChange={(value) => setCode(value ?? "")}
          options={{
            fontSize: 13,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: "on",
            padding: { top: 12 },
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            tabSize: 2,
          }}
        />
      </div>
    </div>
  );
}

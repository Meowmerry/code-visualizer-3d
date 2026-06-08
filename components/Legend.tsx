"use client";

const ITEMS: { label: string; color: string }[] = [
  { label: "class", color: "#f59e0b" },
  { label: "interface / enum", color: "#a855f7" },
  { label: "function", color: "#22d3ee" },
  { label: "method", color: "#34d399" },
  { label: "variable fn", color: "#60a5fa" },
];

export function Legend() {
  return (
    <div className="pointer-events-none absolute bottom-4 left-4 rounded-lg border border-white/5 bg-bg-panel/80 px-3 py-2.5 backdrop-blur">
      <ul className="space-y-1.5">
        {ITEMS.map((it) => (
          <li key={it.label} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: it.color }}
            />
            <span className="text-[11px] text-slate-400">{it.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

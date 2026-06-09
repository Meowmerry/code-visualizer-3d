"use client";

import { SHAPE_BY_KIND, LEGEND_KINDS } from "@/scene/sceneMap";

/** A tiny SVG glyph hinting at each node's 3D geometry. */
function Glyph({ shape, color }: { shape: string; color: string }) {
  const common = { stroke: color, strokeWidth: 1.6, fill: "none" };
  switch (shape) {
    case "box":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16">
          <rect x="3" y="3" width="10" height="10" rx="1.5" {...common} />
        </svg>
      );
    case "torus":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16">
          <circle cx="8" cy="8" r="5.5" {...common} />
          <circle cx="8" cy="8" r="2" {...common} />
        </svg>
      );
    case "sphere":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16">
          <circle cx="8" cy="8" r="5" fill={color} opacity="0.85" />
        </svg>
      );
    case "octahedron":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16">
          <rect
            x="4"
            y="4"
            width="8"
            height="8"
            transform="rotate(45 8 8)"
            {...common}
          />
        </svg>
      );
    case "cylinder":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16">
          <ellipse cx="8" cy="4" rx="4.5" ry="1.8" {...common} />
          <path d="M3.5 4 V12" {...common} />
          <path d="M12.5 4 V12" {...common} />
          <ellipse cx="8" cy="12" rx="4.5" ry="1.8" {...common} />
        </svg>
      );
    case "dot":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16">
          <circle cx="8" cy="8" r="2.6" fill={color} />
        </svg>
      );
    case "tube":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16">
          <path d="M3 12 Q8 1 13 12" {...common} />
        </svg>
      );
    case "icosahedron":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16">
          <circle
            cx="8"
            cy="8"
            r="5.5"
            stroke={color}
            strokeWidth="1.4"
            fill="none"
            strokeDasharray="2 1.6"
          />
          <circle cx="8" cy="8" r="2" fill={color} />
        </svg>
      );
    default:
      return null;
  }
}

export function Legend() {
  return (
    <div className="pointer-events-none absolute bottom-4 left-4 rounded-lg border border-white/5 bg-bg-panel/80 px-3 py-3 backdrop-blur">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        AST node → geometry
      </p>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        {LEGEND_KINDS.map((kind) => {
          const spec = SHAPE_BY_KIND[kind];
          return (
            <li key={kind} className="flex items-center gap-2">
              <Glyph shape={spec.shape} color={spec.color} />
              <span className="text-[11px] text-slate-400">{spec.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

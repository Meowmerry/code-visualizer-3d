"use client";

import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Line, Grid } from "@react-three/drei";
import { useStore } from "@/lib/store";
import { layout } from "@/lib/layout";
import { NodeBox } from "./NodeBox";

function SceneContents() {
  const tree = useStore((s) => s.tree);
  const selectedId = useStore((s) => s.selectedId);
  const select = useStore((s) => s.select);
  const hover = useStore((s) => s.hover);

  const { placed, edges } = useMemo(() => layout(tree), [tree]);

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[8, 14, 6]} intensity={1.1} />
      <directionalLight position={[-10, 6, -8]} intensity={0.4} color="#6ea8ff" />

      {edges.map((e, i) => (
        <Line
          key={i}
          points={[e.from, e.to]}
          color="#2a3550"
          lineWidth={1.2}
          transparent
          opacity={0.8}
        />
      ))}

      {placed.map((p) => (
        <NodeBox
          key={p.node.id}
          placed={p}
          selected={selectedId === p.node.id}
          dimmed={selectedId !== null && selectedId !== p.node.id}
          onSelect={select}
          onHover={hover}
        />
      ))}

      <Grid
        position={[0, -0.5, 0]}
        args={[60, 60]}
        cellSize={1.5}
        cellColor="#1b1b27"
        sectionSize={7.5}
        sectionColor="#2b2b40"
        fadeDistance={45}
        infiniteGrid
      />

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.1}
        minDistance={4}
        maxDistance={80}
      />
    </>
  );
}

export function Scene() {
  // Clicking empty space clears the selection.
  const select = useStore((s) => s.select);
  return (
    <Canvas
      camera={{ position: [10, 12, 18], fov: 50 }}
      onPointerMissed={() => select(null)}
      gl={{ antialias: true }}
    >
      <color attach="background" args={["#0a0a0f"]} />
      <fog attach="fog" args={["#0a0a0f", 35, 90]} />
      <SceneContents />
    </Canvas>
  );
}

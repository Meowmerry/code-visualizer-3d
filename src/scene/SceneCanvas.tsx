"use client";

import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import { useControls, folder } from "leva";
import { useSceneStore } from "@/store/sceneStore";
import { layout } from "@/scene/layout";
import { NodeMesh } from "./NodeMesh";
import { EdgeLine } from "./EdgeLine";
import { CameraRig } from "./CameraRig";

function SceneContents() {
  const tree = useSceneStore((s) => s.tree);
  const selectedId = useSceneStore((s) => s.selectedId);
  const select = useSceneStore((s) => s.select);
  const hover = useSceneStore((s) => s.hover);

  // leva debug GUI — tweak scene params live (collapsed by default).
  const { ambient, keyLight, rimLight, showEdges, fly } = useControls(
    "Scene",
    {
      Lighting: folder(
        {
          ambient: { value: 0.55, min: 0, max: 2, step: 0.05 },
          keyLight: { value: 1.1, min: 0, max: 3, step: 0.05 },
          rimLight: { value: 0.45, min: 0, max: 2, step: 0.05 },
        },
        { collapsed: true },
      ),
      showEdges: { value: true, label: "edges" },
      fly: { value: true, label: "fly-to on select" },
    },
    { collapsed: true },
  );

  const { placed, byId, edges } = useMemo(() => layout(tree), [tree]);
  const target =
    fly && selectedId ? byId.get(selectedId)?.position ?? null : null;

  return (
    <>
      <ambientLight intensity={ambient} />
      <directionalLight position={[8, 14, 6]} intensity={keyLight} />
      <directionalLight
        position={[-10, 6, -8]}
        intensity={rimLight}
        color="#6ea8ff"
      />
      <pointLight position={[0, 4, 6]} intensity={0.4} color="#a78bfa" />

      {showEdges &&
        edges.map((e, i) => (
          <EdgeLine key={i} from={e.from} to={e.to} />
        ))}

      {placed.map((p) => (
        <NodeMesh
          key={p.node.id}
          placed={p}
          selected={selectedId === p.node.id}
          dimmed={selectedId !== null && selectedId !== p.node.id}
          onSelect={select}
          onHover={hover}
        />
      ))}

      <Grid
        position={[0, -0.6, 0]}
        args={[80, 80]}
        cellSize={1.5}
        cellColor="#1b1b27"
        sectionSize={7.5}
        sectionColor="#2b2b40"
        fadeDistance={50}
        infiniteGrid
      />

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.1}
        minDistance={4}
        maxDistance={90}
      />
      <CameraRig target={target} />
    </>
  );
}

export function SceneCanvas() {
  // Clicking empty space clears the selection.
  const select = useSceneStore((s) => s.select);
  return (
    <Canvas
      camera={{ position: [10, 13, 20], fov: 50 }}
      onPointerMissed={() => select(null)}
      gl={{ antialias: true }}
    >
      <color attach="background" args={["#0a0a0f"]} />
      <fog attach="fog" args={["#0a0a0f", 40, 100]} />
      <SceneContents />
    </Canvas>
  );
}

"use client";

import { useMemo, useRef, useState } from "react";
import { ThreeEvent, useFrame } from "@react-three/fiber";
import { Text, Line } from "@react-three/drei";
import * as THREE from "three";
import { Placed } from "@/scene/layout";
import { clamp } from "@/utils/math";

interface Props {
  placed: Placed;
  selected: boolean;
  dimmed: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}

/**
 * Renders one AST node as its mapped geometry. The shape, sizing, and motion
 * are all driven by the node's kind + metadata (see scene/sceneMap.ts):
 *   function → Box · loop → Torus (spins) · async → Sphere (pulses)
 *   branch → Octahedron · class → Cylinder w/ rings · variable → dot
 *   module → Tube · trycatch → Icosahedron w/ dashed ring
 */
export function NodeMesh({ placed, selected, dimmed, onSelect, onHover }: Props) {
  const liftRef = useRef<THREE.Group>(null);
  const spinRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const { position, shape, color, node } = placed;
  const { lines, meta } = node;

  // Per-shape geometry sizing, derived once from the node metadata.
  const dims = useMemo(() => {
    const params = meta.params ?? 0;
    const methods = meta.methods ?? 0;
    const conditions = meta.conditions ?? 1;
    return {
      boxW: clamp(0.9 + params * 0.4, 0.9, 3.2),
      boxH: clamp(Math.sqrt(lines) * 0.5, 0.6, 4),
      torusR: clamp(0.7 + lines * 0.03, 0.7, 1.7),
      sphereR: clamp(0.6 + Math.sqrt(lines) * 0.16, 0.6, 1.8),
      pulseSpeed: 1.4 + (meta.awaits ?? 0) * 1.3,
      octaR: clamp(0.7 + conditions * 0.28, 0.7, 1.6),
      cylH: clamp(1 + methods * 0.45, 1, 4.6),
      rings: clamp(methods, 0, 6),
      icoR: clamp(0.8 + lines * 0.02, 0.8, 1.7),
    };
  }, [lines, meta]);

  // A dashed ring (try/catch error boundary) as a circle of points.
  const ringPoints = useMemo(() => {
    const pts: [number, number, number][] = [];
    const r = dims.icoR + 0.55;
    for (let i = 0; i <= 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      pts.push([Math.cos(a) * r, 0, Math.sin(a) * r]);
    }
    return pts;
  }, [dims.icoR]);

  // A short glowing arc for import/export module nodes.
  const tubeGeom = useMemo(() => {
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-0.9, -0.3, 0),
      new THREE.Vector3(0, 1.1, 0),
      new THREE.Vector3(0.9, -0.3, 0),
    );
    return new THREE.TubeGeometry(curve, 24, 0.16, 10, false);
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const k = Math.min(1, delta * 8);

    // Selection lift + scale on the wrapper group.
    const lift = liftRef.current;
    if (lift) {
      const targetLift = selected ? 0.5 : hovered ? 0.25 : 0;
      lift.position.y += (targetLift - lift.position.y) * k;
      const targetScale = selected ? 1.14 : hovered ? 1.06 : 1;
      const s = lift.scale.x + (targetScale - lift.scale.x) * k;
      lift.scale.setScalar(s);
    }

    // Per-shape ambient motion on the inner group.
    const spin = spinRef.current;
    if (spin) {
      if (shape === "torus") {
        spin.rotation.z += delta * 1.4;
        spin.rotation.x = 0.4;
      } else if (shape === "sphere") {
        const p = 1 + Math.sin(t * dims.pulseSpeed) * 0.12;
        spin.scale.setScalar(p);
      } else if (shape === "dot") {
        spin.position.y = Math.sin(t * 1.6 + position[0]) * 0.18;
      } else if (shape === "octahedron") {
        spin.rotation.y += delta * 0.5;
      } else if (shape === "icosahedron") {
        spin.rotation.y += delta * 0.25;
      } else if (shape === "tube") {
        spin.rotation.y = Math.sin(t * 0.8) * 0.4;
      }
    }
    if (ringRef.current) ringRef.current.rotation.y += delta * 0.6;
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect(node.id);
  };
  const handleOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
    onHover(node.id);
    document.body.style.cursor = "pointer";
  };
  const handleOut = () => {
    setHovered(false);
    onHover(null);
    document.body.style.cursor = "auto";
  };

  const emissiveIntensity = selected ? 0.95 : hovered ? 0.5 : 0.12;
  const opacity = dimmed ? 0.22 : 1;

  const material = (
    <meshStandardMaterial
      color={color}
      emissive={color}
      emissiveIntensity={emissiveIntensity}
      metalness={0.25}
      roughness={0.4}
      transparent
      opacity={opacity}
    />
  );

  // Approximate label height so text floats just above each shape.
  const labelY =
    shape === "cylinder"
      ? dims.cylH / 2 + 0.7
      : shape === "box"
        ? dims.boxH / 2 + 0.7
        : shape === "icosahedron"
          ? dims.icoR + 0.9
          : 1.4;

  return (
    <group
      position={position}
      onClick={handleClick}
      onPointerOver={handleOver}
      onPointerOut={handleOut}
    >
      <group ref={liftRef}>
        <group ref={spinRef}>
          {shape === "box" && (
            <mesh>
              <boxGeometry args={[dims.boxW, dims.boxH, 1.2]} />
              {material}
            </mesh>
          )}

          {shape === "torus" && (
            <mesh>
              <torusGeometry args={[dims.torusR, 0.24, 16, 40]} />
              {material}
            </mesh>
          )}

          {shape === "sphere" && (
            <mesh>
              <sphereGeometry args={[dims.sphereR, 32, 32]} />
              {material}
            </mesh>
          )}

          {shape === "octahedron" && (
            <mesh rotation={[0, Math.PI / 4, 0]}>
              <octahedronGeometry args={[dims.octaR, 0]} />
              {material}
            </mesh>
          )}

          {(shape === "cylinder") && (
            <group>
              <mesh>
                <cylinderGeometry args={[0.92, 0.92, dims.cylH, 28]} />
                <meshStandardMaterial
                  color={color}
                  emissive={color}
                  emissiveIntensity={emissiveIntensity}
                  metalness={0.25}
                  roughness={0.4}
                  transparent
                  opacity={opacity}
                  wireframe={node.kind === "interface"}
                />
              </mesh>
              {/* stacked method rings */}
              {Array.from({ length: dims.rings }).map((_, i) => {
                const y =
                  -dims.cylH / 2 +
                  ((i + 1) * dims.cylH) / (dims.rings + 1);
                return (
                  <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[0.98, 0.05, 8, 32]} />
                    <meshStandardMaterial
                      color="#ffffff"
                      emissive={color}
                      emissiveIntensity={0.6}
                      transparent
                      opacity={opacity}
                    />
                  </mesh>
                );
              })}
            </group>
          )}

          {shape === "dot" && (
            <mesh>
              <sphereGeometry args={[0.34, 20, 20]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={selected || hovered ? 1.2 : 0.8}
                transparent
                opacity={opacity}
              />
            </mesh>
          )}

          {shape === "tube" && (
            <mesh geometry={tubeGeom}>
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={selected || hovered ? 1 : 0.6}
                transparent
                opacity={opacity}
              />
            </mesh>
          )}

          {shape === "icosahedron" && (
            <group>
              <mesh>
                <icosahedronGeometry args={[dims.icoR, 0]} />
                {material}
              </mesh>
              {/* dashed error-boundary ring */}
              <group ref={ringRef}>
                <Line
                  points={ringPoints}
                  color={color}
                  lineWidth={1.5}
                  dashed
                  dashSize={0.25}
                  gapSize={0.18}
                  transparent
                  opacity={dimmed ? 0.25 : 0.9}
                />
              </group>
            </group>
          )}
        </group>
      </group>

      {(hovered || selected) && (
        <Text
          position={[0, labelY, 0]}
          fontSize={0.5}
          color="#ffffff"
          anchorX="center"
          anchorY="bottom"
          outlineWidth={0.04}
          outlineColor="#000000"
        >
          {node.name}
        </Text>
      )}
    </group>
  );
}

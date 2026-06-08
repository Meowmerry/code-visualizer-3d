"use client";

import { useRef, useState } from "react";
import { ThreeEvent, useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { Placed } from "@/lib/layout";

interface Props {
  placed: Placed;
  selected: boolean;
  dimmed: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}

export function NodeBox({ placed, selected, dimmed, onSelect, onHover }: Props) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const { position, size, color, node } = placed;

  // Gently lift and brighten the active box each frame.
  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const targetLift = selected ? 0.4 : hovered ? 0.2 : 0;
    mesh.position.y += (targetLift - mesh.position.y) * Math.min(1, delta * 8);
    const targetScale = selected ? 1.12 : hovered ? 1.06 : 1;
    const s = mesh.scale.x + (targetScale - mesh.scale.x) * Math.min(1, delta * 8);
    mesh.scale.setScalar(s);
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

  const emissive = selected ? color : hovered ? color : "#000000";
  const emissiveIntensity = selected ? 0.9 : hovered ? 0.45 : 0;
  const opacity = dimmed ? 0.25 : 1;

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={handleOver}
        onPointerOut={handleOut}
      >
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          metalness={0.3}
          roughness={0.45}
          transparent
          opacity={opacity}
        />
      </mesh>
      {(hovered || selected) && (
        <Text
          position={[0, size[1] / 2 + 0.7, 0]}
          fontSize={0.55}
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

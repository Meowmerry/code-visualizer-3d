"use client";

import { useMemo } from "react";
import * as THREE from "three";

interface Props {
  from: [number, number, number];
  to: [number, number, number];
  color?: string;
}

/**
 * A thin glowing tube connecting two nodes (parent → child containment). The
 * curve bows slightly toward the midpoint so overlapping edges stay readable.
 */
export function EdgeLine({ from, to, color = "#2a3550" }: Props) {
  const geometry = useMemo(() => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const mid = a.clone().lerp(b, 0.5);
    mid.y += a.distanceTo(b) * 0.08; // gentle bow
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    return new THREE.TubeGeometry(curve, 20, 0.035, 6, false);
  }, [from, to]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.4}
        transparent
        opacity={0.8}
      />
    </mesh>
  );
}

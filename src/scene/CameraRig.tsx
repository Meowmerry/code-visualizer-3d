"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/** Minimal shape of the OrbitControls instance we drive from the rig. */
interface OrbitLike {
  target: THREE.Vector3;
  update: () => void;
}

/**
 * On node selection, smoothly flies the camera to frame the selected node and
 * retargets the orbit pivot onto it. Idle when nothing is selected, leaving the
 * user in full control via OrbitControls.
 */
export function CameraRig({
  target,
}: {
  target: [number, number, number] | null;
}) {
  const { camera, controls } = useThree();
  const goal = useRef(new THREE.Vector3());
  const pivot = useRef(new THREE.Vector3());

  useFrame(() => {
    if (!target) return;
    const [x, y, z] = target;
    goal.current.set(x + 4.5, y + 3.2, z + 8.5);
    pivot.current.set(x, y, z);
    camera.position.lerp(goal.current, 0.05);
    const ctrl = controls as unknown as OrbitLike | null;
    if (ctrl?.target) {
      ctrl.target.lerp(pivot.current, 0.05);
      ctrl.update();
    }
  });
  return null;
}

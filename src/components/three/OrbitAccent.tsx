import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { palette } from "../shared/tokens";

function usePageVisible() {
  const [visible, setVisible] = useState(() => typeof document === "undefined" || !document.hidden);

  useEffect(() => {
    const onVisibility = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return visible;
}

function Orbit({ visible }: { visible: boolean }) {
  const group = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!visible || !group.current) return;
    group.current.rotation.x = clock.getElapsedTime() * 0.25;
    group.current.rotation.y = clock.getElapsedTime() * 0.38;
  });

  return (
    <group ref={group}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.05, 0.018, 10, 72]} />
        <meshStandardMaterial color={palette.mint} emissive={palette.mint} emissiveIntensity={0.65} />
      </mesh>
      <mesh rotation={[0.25, 0.7, 0]}>
        <torusGeometry args={[0.72, 0.014, 10, 64]} />
        <meshStandardMaterial color={palette.blue} emissive={palette.blue} emissiveIntensity={0.42} />
      </mesh>
      <mesh position={[0.72, 0.25, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color={palette.amber} emissive={palette.amber} emissiveIntensity={1} />
      </mesh>
    </group>
  );
}

export default function OrbitAccent() {
  const visible = usePageVisible();

  return (
    <Canvas
      camera={{ position: [0, 0, 4], fov: 42 }}
      dpr={[1, 1.4]}
      frameloop={visible ? "always" : "demand"}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
    >
      <ambientLight intensity={0.85} />
      <pointLight position={[2, 2, 4]} color={palette.mint} intensity={1.1} />
      <Orbit visible={visible} />
    </Canvas>
  );
}

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { palette } from "../shared/tokens";

const outcomes = [
  { label: "Recovered", count: 28, value: "₹55,372", height: 3.2, color: palette.mint },
  { label: "Awaiting", count: 14, value: "₹32,847", height: 1.8, color: palette.blue },
  { label: "Review", count: 9, value: "₹18,294", height: 1.15, color: palette.amber },
  { label: "Errors", count: 7, value: "₹12,630", height: 0.9, color: palette.red },
];

function usePageVisible() {
  const [visible, setVisible] = useState(() => typeof document === "undefined" || !document.hidden);

  useEffect(() => {
    const onVisibility = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return visible;
}

function Monument({ visible }: { visible: boolean }) {
  const group = useRef<THREE.Group>(null);
  const bars = useRef<Array<THREE.Group | null>>([]);

  useFrame(({ clock }) => {
    if (!visible) return;
    const elapsed = clock.getElapsedTime();
    if (group.current) {
      group.current.rotation.y = Math.sin(elapsed * 0.18) * 0.18;
      group.current.position.y = Math.sin(elapsed * 0.7) * 0.035;
    }
    bars.current.forEach((bar, index) => {
      if (!bar) return;
      const target = outcomes[index].height;
      const progress = Math.min(1, elapsed * 0.75 - index * 0.12);
      const eased = progress <= 0 ? 0.05 : 1 - Math.pow(1 - progress, 3);
      const height = Math.max(0.08, target * eased);
      bar.scale.y = height;
      bar.position.y = height / 2;
    });
  });

  return (
    <group ref={group} position={[0, -1.35, 0]}>
      {outcomes.map((item, index) => {
        const x = (index - 1.5) * 1.35;
        return (
          <group key={item.label} position={[x, 0, 0]}>
            <group ref={(node) => { bars.current[index] = node; }}>
              <mesh>
                <boxGeometry args={[0.72, 1, 0.72]} />
                <meshBasicMaterial color={item.color} />
              </mesh>
            </group>
          </group>
        );
      })}
    </group>
  );
}

export default function DataMonumentScene() {
  const visible = usePageVisible();

  return (
    <Canvas
      camera={{ position: [0, 2.3, 6.4], fov: 44 }}
      onCreated={({ camera }) => camera.lookAt(0, 0.35, 0)}
      dpr={[1, 1.5]}
      frameloop={visible ? "always" : "demand"}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
    >
      <color attach="background" args={[palette.void]} />
      <ambientLight intensity={1} />
      <Monument visible={visible} />
    </Canvas>
  );
}

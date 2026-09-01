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

interface OrbitAccentProps {
  status?: "live" | "running" | "idle";
}

function Orbit({ visible, status = "live" }: { visible: boolean; status?: "live" | "running" | "idle" }) {
  const group = useRef<THREE.Group>(null);
  const ring1 = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);
  const satellite = useRef<THREE.Mesh>(null);

  const primaryColor = status === "running" ? palette.amber : palette.mint;
  const secondaryColor = status === "running" ? palette.red : palette.blue;

  useFrame(({ clock }) => {
    if (!visible || !group.current) return;
    const time = clock.getElapsedTime();
    const speed = status === "running" ? 1.6 : 0.8;

    if (ring1.current) {
      ring1.current.rotation.x = time * 0.45 * speed;
      ring1.current.rotation.y = time * 0.65 * speed;
    }
    if (ring2.current) {
      ring2.current.rotation.y = -time * 0.55 * speed;
      ring2.current.rotation.z = time * 0.35 * speed;
    }
    if (satellite.current) {
      const r = 1.15;
      satellite.current.position.x = Math.cos(time * 1.2 * speed) * r;
      satellite.current.position.y = Math.sin(time * 0.9 * speed) * 0.4;
      satellite.current.position.z = Math.sin(time * 1.2 * speed) * r;
    }
  });

  return (
    <group ref={group}>
      {/* Outer Torus Ring */}
      <mesh ref={ring1} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[1.05, 0.022, 16, 72]} />
        <meshStandardMaterial
          color={primaryColor}
          emissive={primaryColor}
          emissiveIntensity={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Inner Torus Ring */}
      <mesh ref={ring2} rotation={[0.4, 0.8, 0]}>
        <torusGeometry args={[0.74, 0.016, 16, 64]} />
        <meshStandardMaterial
          color={secondaryColor}
          emissive={secondaryColor}
          emissiveIntensity={0.6}
          roughness={0.3}
        />
      </mesh>

      {/* Orbiting Satellite Node */}
      <mesh ref={satellite}>
        <sphereGeometry args={[0.09, 20, 20]} />
        <meshStandardMaterial
          color={palette.chalk}
          emissive={primaryColor}
          emissiveIntensity={1.4}
        />
      </mesh>

      {/* Central Core Bead */}
      <mesh>
        <sphereGeometry args={[0.16, 24, 24]} />
        <meshStandardMaterial
          color={primaryColor}
          emissive={primaryColor}
          emissiveIntensity={1.0}
        />
      </mesh>
    </group>
  );
}

export default function OrbitAccent({ status = "live" }: OrbitAccentProps) {
  const visible = usePageVisible();

  return (
    <Canvas
      camera={{ position: [0, 0, 3.8], fov: 42 }}
      dpr={[1, 1.4]}
      frameloop={visible ? "always" : "demand"}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      }}
      className="pointer-events-none"
    >
      <ambientLight intensity={0.9} />
      <pointLight position={[2, 2, 4]} color={status === "running" ? palette.amber : palette.mint} intensity={1.2} />
      <Orbit visible={visible} status={status} />
    </Canvas>
  );
}

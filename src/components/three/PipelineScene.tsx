import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
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

function FlowPath({ visible }: { visible: boolean }) {
  const particles = useRef<THREE.Group>(null);
  const orbit = useRef<THREE.Group>(null);
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-4.5, -0.7, 0),
        new THREE.Vector3(-2, 0.8, -0.7),
        new THREE.Vector3(0.4, -0.1, 0.45),
        new THREE.Vector3(2.4, 0.6, -0.45),
        new THREE.Vector3(4.5, -0.4, 0.15),
      ]),
    [],
  );
  const tube = useMemo(() => new THREE.TubeGeometry(curve, 96, 0.055, 12, false), [curve]);
  const nodePositions = useMemo(() => [0.02, 0.34, 0.66, 0.98].map((t) => curve.getPointAt(t)), [curve]);

  useFrame(({ clock }) => {
    if (!visible) return;
    const time = clock.getElapsedTime();
    if (orbit.current) {
      orbit.current.rotation.y = Math.sin(time * 0.18) * 0.12;
      orbit.current.rotation.x = Math.sin(time * 0.12) * 0.04;
    }
    particles.current?.children.forEach((child, index) => {
      const t = (time * 0.09 + index / 18) % 1;
      child.position.copy(curve.getPointAt(t));
    });
  });

  return (
    <group ref={orbit}>
      <mesh geometry={tube}>
        <meshBasicMaterial color={palette.blue} />
      </mesh>

      <group ref={particles}>
        {Array.from({ length: 18 }).map((_, index) => (
          <mesh key={index}>
            <sphereGeometry args={[0.07, 12, 12]} />
            <meshBasicMaterial color={index < 8 ? palette.amber : palette.mint} />
          </mesh>
        ))}
      </group>

      {nodePositions.map((position, index) => (
        <group key={index} position={position}>
          <mesh>
            <torusGeometry args={[0.32, 0.026, 10, 42]} />
            <meshBasicMaterial color={index < 2 ? palette.amber : index === 2 ? palette.blue : palette.mint} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshBasicMaterial color={palette.chalk} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default function PipelineScene() {
  const visible = usePageVisible();

  return (
    <Canvas
      camera={{ position: [0, 1.5, 7], fov: 42 }}
      onCreated={({ camera }) => camera.lookAt(0, 0, 0)}
      dpr={[1, 1.5]}
      frameloop={visible ? "always" : "demand"}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
    >
      <color attach="background" args={[palette.void]} />
      <ambientLight intensity={1} />
      <FlowPath visible={visible} />
    </Canvas>
  );
}

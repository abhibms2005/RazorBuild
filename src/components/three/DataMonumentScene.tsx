import { Canvas, useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { palette } from "../shared/tokens";
import { RendererCleanup } from "./RendererCleanup";

function usePageVisible() {
  const [visible, setVisible] = useState(() => typeof document === "undefined" || !document.hidden);

  useEffect(() => {
    const onVisibility = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return visible;
}

export interface MonumentData {
  recoveredCount: number;
  recoveredAmount: string;
  awaitingCount: number;
  awaitingAmount: string;
  reviewCount: number;
  reviewAmount: string;
  errorCount: number;
  errorAmount: string;
}

const defaultMonumentData: MonumentData = {
  recoveredCount: 28,
  recoveredAmount: "₹55,372",
  awaitingCount: 14,
  awaitingAmount: "₹32,847",
  reviewCount: 9,
  reviewAmount: "₹18,294",
  errorCount: 7,
  errorAmount: "₹12,630",
};

interface MonumentBarProps {
  label: string;
  count: number;
  amount: string;
  targetHeight: number;
  color: string;
  xPos: number;
  index: number;
  visible: boolean;
}

function MonumentBar({
  label,
  count,
  amount,
  targetHeight,
  color,
  xPos,
  index,
  visible,
}: MonumentBarProps) {
  const barMeshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const [currentHeight, setCurrentHeight] = useState(0.1);

  const barElapsedRef = useRef(0);

  useFrame((_state, delta) => {
    if (!visible) return;
    barElapsedRef.current += delta;
    const elapsed = barElapsedRef.current;

    // Eased growth entrance
    const startTime = 0.2 + index * 0.15;
    const progress = Math.max(0, Math.min(1, (elapsed - startTime) * 1.2));
    const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
    const h = Math.max(0.12, targetHeight * eased);

    // Ambient breathing oscillation
    const breath = Math.sin(elapsed * 1.5 + index) * 0.03;
    const finalHeight = h + (progress === 1 ? breath : 0);

    if (barMeshRef.current) {
      barMeshRef.current.scale.y = finalHeight;
      barMeshRef.current.position.y = finalHeight / 2;
    }
    if (groupRef.current) {
      groupRef.current.position.y = 0;
    }
    setCurrentHeight(finalHeight);
  });

  return (
    <group ref={groupRef} position={[xPos, 0, 0]}>
      {/* 3D Extruded Box with emissive glow */}
      <mesh ref={barMeshRef}>
        <boxGeometry args={[0.82, 1, 0.82]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
          roughness={0.2}
          metalness={0.3}
        />
      </mesh>

      {/* Top Cap Light Border */}
      <mesh position={[0, currentHeight, 0]}>
        <boxGeometry args={[0.84, 0.03, 0.84]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.7} />
      </mesh>

      {/* Billboarded 2D Monospace Label */}
      <Html
        position={[0, currentHeight + 0.42, 0]}
        center
        distanceFactor={7.5}
        className="pointer-events-none select-none"
      >
        <div className="flex flex-col items-center rounded bg-void-light/95 border border-chalk-muted/30 px-2.5 py-1 backdrop-blur-md shadow-xl">
          <span className="font-mono text-xs font-bold text-chalk whitespace-nowrap tabular-nums">
            {amount}
          </span>
          <span className="font-mono text-[9px] uppercase tracking-wider text-chalk-muted/80 whitespace-nowrap">
            {count} {label}
          </span>
        </div>
      </Html>
    </group>
  );
}

function MonumentScene({
  visible,
  data = defaultMonumentData,
}: {
  visible: boolean;
  data?: MonumentData;
}) {
  const rootGroup = useRef<THREE.Group>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  // Calculate proportional heights (max height ~3.4)
  const maxCount = Math.max(
    data.recoveredCount,
    data.awaitingCount,
    data.reviewCount,
    data.errorCount,
    1,
  );

  const bars = useMemo(() => {
    return [
      {
        label: "Recovered",
        count: data.recoveredCount,
        amount: data.recoveredAmount,
        targetHeight: (data.recoveredCount / maxCount) * 3.2 + 0.6,
        color: palette.mint,
        xPos: -2.1,
      },
      {
        label: "Awaiting",
        count: data.awaitingCount,
        amount: data.awaitingAmount,
        targetHeight: (data.awaitingCount / maxCount) * 3.2 + 0.6,
        color: palette.blue,
        xPos: -0.7,
      },
      {
        label: "Review",
        count: data.reviewCount,
        amount: data.reviewAmount,
        targetHeight: (data.reviewCount / maxCount) * 3.2 + 0.6,
        color: palette.amber,
        xPos: 0.7,
      },
      {
        label: "Errors",
        count: data.errorCount,
        amount: data.errorAmount,
        targetHeight: (data.errorCount / maxCount) * 3.2 + 0.6,
        color: palette.red,
        xPos: 2.1,
      },
    ];
  }, [data, maxCount]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -(e.clientY / window.innerHeight) * 2 + 1;
      mouseRef.current.targetX = nx * 0.35;
      mouseRef.current.targetY = ny * 0.2;
    };
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, []);

  const sceneElapsedRef = useRef(0);

  useFrame((_state, delta) => {
    if (!visible) return;
    sceneElapsedRef.current += delta;
    const time = sceneElapsedRef.current;

    mouseRef.current.x = THREE.MathUtils.lerp(mouseRef.current.x, mouseRef.current.targetX, 0.05);
    mouseRef.current.y = THREE.MathUtils.lerp(mouseRef.current.y, mouseRef.current.targetY, 0.05);

    if (rootGroup.current) {
      rootGroup.current.rotation.y = Math.sin(time * 0.16) * 0.12 + mouseRef.current.x * 0.15;
      rootGroup.current.rotation.x = -mouseRef.current.y * 0.08;
    }
  });

  return (
    <group ref={rootGroup} position={[0, -1.5, 0]}>
      {/* 4 Monument Bars */}
      {bars.map((bar, idx) => (
        <MonumentBar
          key={bar.label}
          {...bar}
          index={idx}
          visible={visible}
        />
      ))}

      {/* Reflective Dark Floor Plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[14, 10]} />
        <meshStandardMaterial
          color="#060608"
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Floor Grid Lines */}
      <gridHelper
        args={[12, 12, palette.amber, "#1c1c24"]}
        position={[0, 0.005, 0]}
      />
    </group>
  );
}

export default function DataMonumentScene({ data }: { data?: MonumentData }) {
  const visible = usePageVisible();

  return (
    <Canvas
      camera={{ position: [0, 2.2, 6.8], fov: 44 }}
      onCreated={({ camera }) => camera.lookAt(0, 0.2, 0)}
      dpr={[1, 1.5]}
      frameloop={visible ? "always" : "demand"}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      }}
      className="pointer-events-none"
    >
      <RendererCleanup />
      <color attach="background" args={[palette.void]} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 6, 4]} intensity={1.2} />
      <pointLight position={[-3, 4, 3]} color={palette.mint} intensity={0.9} />
      <pointLight position={[3, 3, 3]} color={palette.amber} intensity={0.8} />
      <MonumentScene visible={visible} data={data} />
    </Canvas>
  );
}

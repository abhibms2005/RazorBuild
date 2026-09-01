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

interface PipelineSceneProps {
  activeStage?: number; // 0: Detect, 1: Diagnose, 2: Recover, 3: Audit
}

const STAGES = [
  { step: "01", label: "DETECT", t: 0.04, color: palette.amber },
  { step: "02", label: "DIAGNOSE", t: 0.35, color: palette.blue },
  { step: "03", label: "RECOVER", t: 0.68, color: palette.mint },
  { step: "04", label: "AUDIT", t: 0.96, color: palette.mint },
];

/**
 * 3D Data Pipeline with CatmullRom spline, instanced particle stream, and interactive beacon nodes
 */
function PipelineMesh({ visible, activeStage = 0 }: { visible: boolean; activeStage: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const instancedParticlesRef = useRef<THREE.InstancedMesh>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  // 3D curved pipeline spline trajectory
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-5.2, -1.0, -0.4),
        new THREE.Vector3(-2.8, 1.2, -0.8),
        new THREE.Vector3(0.0, -0.2, 0.6),
        new THREE.Vector3(2.8, 0.9, -0.5),
        new THREE.Vector3(5.2, -0.6, 0.3),
      ]),
    [],
  );

  // Volumetric Tube Geometry
  const tubeGeometry = useMemo(() => new THREE.TubeGeometry(curve, 128, 0.07, 16, false), [curve]);

  // Gradient texture for the tube (amber -> blue -> mint)
  const tubeTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 32;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 512, 0);
      grad.addColorStop(0.0, palette.amber);
      grad.addColorStop(0.35, palette.blue);
      grad.addColorStop(0.7, palette.mint);
      grad.addColorStop(1.0, palette.mint);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 32);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }, []);

  // Node world positions along the spline
  const nodeData = useMemo(() => {
    return STAGES.map((s, idx) => ({
      ...s,
      index: idx,
      pos: curve.getPointAt(s.t),
    }));
  }, [curve]);

  // Instanced particles along the tube
  const particleCount = 140;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const particleOffsets = useMemo(() => {
    return Array.from({ length: particleCount }, (_, i) => ({
      offset: i / particleCount,
      speed: 0.045 + (i % 5) * 0.008,
      size: 0.05 + (i % 3) * 0.025,
      radialAngle: Math.random() * Math.PI * 2,
      radialDist: 0.04 + Math.random() * 0.05,
    }));
  }, [particleCount]);

  // Set initial colors for instanced particles
  useEffect(() => {
    if (!instancedParticlesRef.current) return;
    const mesh = instancedParticlesRef.current;
    const amberColor = new THREE.Color(palette.amber);
    const blueColor = new THREE.Color(palette.blue);
    const mintColor = new THREE.Color(palette.mint);

    for (let i = 0; i < particleCount; i++) {
      const t = i / particleCount;
      const col = t < 0.33 ? amberColor : t < 0.66 ? blueColor : mintColor;
      mesh.setColorAt(i, col);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [particleCount]);

  // Mouse parallax listener
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -(e.clientY / window.innerHeight) * 2 + 1;
      mouseRef.current.targetX = nx * 0.4;
      mouseRef.current.targetY = ny * 0.25;
    };
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, []);

  const elapsedRef = useRef(0);

  useFrame((_state, delta) => {
    if (!visible) return;
    elapsedRef.current += delta;
    const time = elapsedRef.current;

    // Lerp mouse parallax
    mouseRef.current.x = THREE.MathUtils.lerp(mouseRef.current.x, mouseRef.current.targetX, 0.05);
    mouseRef.current.y = THREE.MathUtils.lerp(mouseRef.current.y, mouseRef.current.targetY, 0.05);

    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(time * 0.15) * 0.08 + mouseRef.current.x * 0.15;
      groupRef.current.rotation.x = Math.cos(time * 0.12) * 0.04 - mouseRef.current.y * 0.12;
      groupRef.current.position.y = Math.sin(time * 0.3) * 0.05;
    }

    // Update instanced particles traveling along curve
    if (instancedParticlesRef.current) {
      for (let i = 0; i < particleCount; i++) {
        const p = particleOffsets[i];
        const progress = (time * p.speed + p.offset) % 1;
        const pt = curve.getPointAt(progress);
        const tangent = curve.getTangentAt(progress).normalize();

        // Calculate perpendicular offset around the tube
        const normal = new THREE.Vector3(0, 1, 0).cross(tangent).normalize();
        const binormal = tangent.clone().cross(normal).normalize();
        const radialOffset = normal
          .clone()
          .multiplyScalar(Math.cos(p.radialAngle + time) * p.radialDist)
          .add(binormal.clone().multiplyScalar(Math.sin(p.radialAngle + time) * p.radialDist));

        dummy.position.copy(pt).add(radialOffset);
        dummy.scale.set(p.size, p.size, p.size);
        dummy.updateMatrix();
        instancedParticlesRef.current.setMatrixAt(i, dummy.matrix);
      }
      instancedParticlesRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Volumetric Pipeline Ribbon Tube */}
      <mesh geometry={tubeGeometry}>
        <meshStandardMaterial
          map={tubeTexture}
          roughness={0.25}
          metalness={0.65}
          transparent
          opacity={0.88}
          emissive="#1a1a24"
          emissiveIntensity={0.25}
        />
      </mesh>

      {/* Instanced Glowing Data Particles */}
      <instancedMesh
        ref={instancedParticlesRef}
        args={[undefined, undefined, particleCount]}
      >
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
        />
      </instancedMesh>

      {/* 4 Interactive Beacon Nodes */}
      {nodeData.map((node) => {
        const isActive = activeStage === node.index;
        return (
          <group key={node.step} position={node.pos}>
            {/* Outer Torus Ring */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[isActive ? 0.38 : 0.32, isActive ? 0.035 : 0.024, 16, 48]} />
              <meshStandardMaterial
                color={node.color}
                emissive={node.color}
                emissiveIntensity={isActive ? 1.4 : 0.75}
                roughness={0.2}
              />
            </mesh>

            {/* Glowing Core Sphere */}
            <mesh>
              <sphereGeometry args={[isActive ? 0.16 : 0.12, 24, 24]} />
              <meshStandardMaterial
                color={palette.chalk}
                emissive={node.color}
                emissiveIntensity={isActive ? 1.8 : 0.9}
              />
            </mesh>

            {/* 3D Billboarded HTML Label */}
            <Html
              position={[0, isActive ? 0.62 : 0.52, 0]}
              center
              distanceFactor={8}
              className="pointer-events-none select-none"
            >
              <div
                className={`flex flex-col items-center px-2 py-0.5 rounded transition-all duration-300 ${
                  isActive
                    ? "bg-void-light/95 border border-chalk-muted/40 shadow-[0_0_16px_rgba(212,168,67,0.3)] scale-110"
                    : "bg-void/80 border border-chalk-muted/15"
                }`}
              >
                <span className="font-mono text-[9px] font-semibold text-ember">
                  {node.step}
                </span>
                <span className="font-mono text-[10px] font-bold tracking-widest text-chalk uppercase whitespace-nowrap">
                  {node.label}
                </span>
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

export default function PipelineScene({ activeStage = 0 }: PipelineSceneProps) {
  const visible = usePageVisible();

  return (
    <Canvas
      camera={{ position: [0, 1.2, 7.2], fov: 42 }}
      onCreated={({ camera }) => camera.lookAt(0, 0, 0)}
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
      <directionalLight position={[4, 5, 4]} intensity={1.2} color="#ffffff" />
      <pointLight position={[-3, 2, 2]} intensity={0.8} color={palette.amber} />
      <pointLight position={[3, -1, 2]} intensity={0.8} color={palette.mint} />
      <PipelineMesh visible={visible} activeStage={activeStage} />
    </Canvas>
  );
}

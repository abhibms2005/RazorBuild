import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { palette } from "../shared/tokens";
import { RendererCleanup } from "../three/RendererCleanup";

function usePageVisible() {
  const [visible, setVisible] = useState(() => typeof document === "undefined" || !document.hidden);

  useEffect(() => {
    const onVisibility = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return visible;
}

interface ParticleStreamProps {
  visible: boolean;
}

/**
 * Spline-guided data packets & ambient particle cloud matching scene-bg.png light trails
 */
function ParticleStream({ visible }: ParticleStreamProps) {
  const containerRef = useRef<THREE.Group>(null);
  const amberPacketsRef = useRef<THREE.Group>(null);
  const mintPacketsRef = useRef<THREE.Group>(null);
  const ambientPointsRef = useRef<THREE.Points>(null);

  // Mouse normalized target for gentle parallax
  const mouse = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const scrollRef = useRef({ y: 0 });

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -(e.clientY / window.innerHeight) * 2 + 1;
      mouse.current.targetX = nx * 0.35;
      mouse.current.targetY = ny * 0.2;
    };

    const onScroll = () => {
      scrollRef.current.y = window.scrollY * 0.001;
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Amber risk trail curve (converging towards center-right)
  const amberCurve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-6.0, 2.2, -1.5),
        new THREE.Vector3(-3.2, 1.4, -0.6),
        new THREE.Vector3(-0.8, 0.4, 0.2),
        new THREE.Vector3(1.5, -0.2, 0.6),
        new THREE.Vector3(4.8, -1.0, 0.0),
      ]),
    [],
  );

  // Mint / Cyan recovery trail curve (governed trajectory)
  const mintCurve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-5.0, -1.8, -1.2),
        new THREE.Vector3(-2.2, -0.8, -0.4),
        new THREE.Vector3(0.6, 0.1, 0.4),
        new THREE.Vector3(3.0, 0.8, 0.8),
        new THREE.Vector3(6.2, 1.6, 0.2),
      ]),
    [],
  );

  // Ambient floating dust particles
  const [ambientGeo, ambientMat] = useMemo(() => {
    const count = 75;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const amberColor = new THREE.Color(palette.amber);
    const mintColor = new THREE.Color(palette.mint);
    const blueColor = new THREE.Color(palette.blue);
    const chalkColor = new THREE.Color(palette.chalk);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4 - 0.5;

      const pick = Math.random();
      const col = pick < 0.35 ? amberColor : pick < 0.7 ? mintColor : pick < 0.9 ? blueColor : chalkColor;
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.07,
      vertexColors: true,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    return [geo, mat];
  }, []);

  const amberPacketCount = 14;
  const mintPacketCount = 16;

  const elapsedRef = useRef(0);

  useFrame((_state, delta) => {
    if (!visible) return;
    elapsedRef.current += delta;
    const time = elapsedRef.current;

    // Smooth mouse parallax lerp
    mouse.current.x = THREE.MathUtils.lerp(mouse.current.x, mouse.current.targetX, 0.05);
    mouse.current.y = THREE.MathUtils.lerp(mouse.current.y, mouse.current.targetY, 0.05);

    if (containerRef.current) {
      containerRef.current.position.x = mouse.current.x;
      containerRef.current.position.y = mouse.current.y - scrollRef.current.y * 1.5;
      containerRef.current.rotation.y = mouse.current.x * 0.08;
      containerRef.current.rotation.x = -mouse.current.y * 0.06;
    }

    // Animate amber data packets along spline
    if (amberPacketsRef.current) {
      amberPacketsRef.current.children.forEach((child, idx) => {
        const speed = 0.055;
        const offset = idx / amberPacketCount;
        const progress = (time * speed + offset) % 1;
        const pt = amberCurve.getPointAt(progress);
        child.position.copy(pt);

        // Gentle scale pulse
        const scale = 0.06 + 0.02 * Math.sin(time * 3 + idx);
        child.scale.set(scale, scale, scale);
      });
    }

    // Animate mint recovery packets along spline
    if (mintPacketsRef.current) {
      mintPacketsRef.current.children.forEach((child, idx) => {
        const speed = 0.065;
        const offset = idx / mintPacketCount;
        const progress = (time * speed + offset) % 1;
        const pt = mintCurve.getPointAt(progress);
        child.position.copy(pt);

        const scale = 0.065 + 0.025 * Math.cos(time * 2.8 + idx);
        child.scale.set(scale, scale, scale);
      });
    }

    // Ambient dust gentle oscillation
    if (ambientPointsRef.current) {
      ambientPointsRef.current.rotation.y = Math.sin(time * 0.04) * 0.04;
      ambientPointsRef.current.rotation.z = Math.cos(time * 0.03) * 0.02;
    }
  });

  return (
    <group ref={containerRef}>
      {/* Ambient floating dust */}
      <points ref={ambientPointsRef} geometry={ambientGeo} material={ambientMat} />

      {/* Amber risk data packets */}
      <group ref={amberPacketsRef}>
        {Array.from({ length: amberPacketCount }).map((_, i) => (
          <mesh key={`amber-${i}`}>
            <sphereGeometry args={[1, 12, 12]} />
            <meshBasicMaterial
              color={palette.amber}
              transparent
              opacity={0.8}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        ))}
      </group>

      {/* Mint / Cyan recovery data packets */}
      <group ref={mintPacketsRef}>
        {Array.from({ length: mintPacketCount }).map((_, i) => (
          <mesh key={`mint-${i}`}>
            <sphereGeometry args={[1, 12, 12]} />
            <meshBasicMaterial
              color={i % 3 === 0 ? palette.blue : palette.mint}
              transparent
              opacity={0.85}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

export default function HeroParticlesScene() {
  const visible = usePageVisible();

  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 45 }}
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
      <ambientLight intensity={0.8} />
      <ParticleStream visible={visible} />
    </Canvas>
  );
}

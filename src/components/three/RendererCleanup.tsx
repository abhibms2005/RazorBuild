import { useEffect } from "react";
import { useThree } from "@react-three/fiber";

/**
 * Drop this inside any <Canvas> to auto-dispose the WebGL renderer on unmount.
 * Prevents "WebGLRenderer: Context Lost" warnings from accumulated contexts
 * when navigating between pages with 3D scenes.
 */
export function RendererCleanup() {
  const { gl } = useThree();

  useEffect(() => {
    return () => {
      gl.dispose();
    };
  }, [gl]);

  return null;
}

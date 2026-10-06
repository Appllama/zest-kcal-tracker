import { Canvas, Fill, Shader } from "@shopify/react-native-skia";
import { useDerivedValue } from "react-native-reanimated";
import { backdropEffect } from "../motion/backdropShader";
import { FIGURE, type Scene } from "../hooks/useScene";

/** Neutral studio light, with one pale lemon accent beneath the native glass. */
export function ZestBackdrop({ scene }: { scene: Scene }) {
  const {
    figure,
    feetX,
    feetY,
    composerHeight,
    composerWidth,
    dockY,
    energy,
    spin,
    release,
    perch,
    pick,
  } = scene;
  const { width, height, bottom, reduced } = scene;
  const uniforms = useDerivedValue(() => ({
    size: [width, height],
    paper: [0.953, 0.953, 0.941],
    glow: [0.955, 0.895, 0.69],
    spot: [feetX.get(), feetY.get() - figure.get() * FIGURE.hero * 0.48],
    radius: figure.get() * 164,
    feet: [feetX.get(), feetY.get()],
    figure: (figure.get() * FIGURE.hero) / 42,
    dock: [width / 2, height - bottom - composerHeight.get() / 2 + dockY.get()],
    dockHalf: composerWidth.get() / 2,
    energy: reduced ? 0 : energy.get(),
    spin: spin.get(),
    release: reduced ? 0 : release.get(),
    settle: Math.max(perch.get(), pick.get()),
  }));
  return backdropEffect ? (
    <Canvas pointerEvents="none" style={{ position: "absolute", inset: 0 }}>
      <Fill>
        <Shader source={backdropEffect} uniforms={uniforms} />
      </Fill>
    </Canvas>
  ) : null;
}

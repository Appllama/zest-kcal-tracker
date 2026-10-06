import React, { createContext, useContext, useEffect, useState } from "react";
import { AccessibilityInfo, StyleSheet } from "react-native";
import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from "expo-glass-effect";
import Animated from "react-native-reanimated";
import type { ZestTheme } from "../../theme";

const AnimatedNativeGlass = Animated.createAnimatedComponent(GlassView);

const GlassThemeContext = createContext<ZestTheme | null>(null);
export const GlassThemeProvider = GlassThemeContext.Provider;
export function useGlassTheme() {
  const theme = useContext(GlassThemeContext);
  if (!theme) throw new Error("useGlassTheme outside GlassThemeProvider");
  return theme;
}

const available =
  process.env.EXPO_OS === "ios" &&
  isGlassEffectAPIAvailable() &&
  isLiquidGlassAvailable();

/** True where the system can draw Liquid Glass and the reader has not turned transparency down. */
export function useNativeGlass() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceTransparencyEnabled().then(setReduce);
    const s = AccessibilityInfo.addEventListener(
      "reduceTransparencyChanged",
      setReduce,
    );
    return () => s.remove();
  }, []);
  return available && !reduce;
}

/**
 * Native Liquid Glass. The system draws the material, its rim and its shadow;
 * nothing is painted over or under it. Where glass is unavailable it becomes a
 * plain opaque surface.
 */
export function GlassSurface({
  children,
  style,
  interactive = false,
  material = "regular",
  visible = true,
  materialize = 0.16,
}: React.PropsWithChildren<{
  style?: React.ComponentProps<typeof AnimatedNativeGlass>["style"];
  interactive?: boolean;
  material?: "clear" | "regular";
  visible?: boolean;
  /** Seconds the material takes to form or dissolve. */
  materialize?: number;
}>) {
  const theme = useGlassTheme();
  const native = useNativeGlass();
  if (!native)
    return (
      <Animated.View
        style={[
          {
            backgroundColor: "#f8f8f7",
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.line,
            borderCurve: "continuous",
            opacity: visible ? 1 : 0,
          },
          style,
        ]}
      >
        {children}
      </Animated.View>
    );
  return (
    <AnimatedNativeGlass
      colorScheme="light"
      glassEffectStyle={{
        style: visible ? material : "none",
        animate: true,
        animationDuration: materialize,
      }}
      isInteractive={interactive}
      style={[{ overflow: "visible", borderCurve: "continuous" }, style]}
    >
      {children}
    </AnimatedNativeGlass>
  );
}

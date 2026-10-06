import React from "react";
import { StyleSheet, type ViewStyle, type StyleProp } from "react-native";
import {
  Gesture,
  GestureDetector,
  Pressable,
} from "react-native-gesture-handler";
import { scheduleOnRN } from "react-native-worklets";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  useReducedMotion,
  type SharedValue,
} from "react-native-reanimated";
import { SNAP } from "../../motion/timing";

export function Symbol({
  name,
  size = 20,
  color = "#303030",
  weight = "regular",
}: {
  name: SymbolViewProps["name"];
  size?: number;
  color?: string;
  weight?: SymbolViewProps["weight"];
}) {
  return (
    <SymbolView
      name={name}
      size={size}
      tintColor={color}
      weight={weight}
      style={{ width: size, height: size }}
    />
  );
}

export function Touch({
  children,
  onPress,
  onLongPress,
  label,
  style,
  testID,
  disabled = false,
  expand = false,
  surfacePress,
}: React.PropsWithChildren<{
  onPress?: () => void;
  onLongPress?: () => void;
  label: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  disabled?: boolean;
  expand?: boolean;
  surfacePress?: SharedValue<number>;
}>) {
  const scale = useSharedValue(1);
  const stretchX = useSharedValue(1);
  const stretchY = useSharedValue(1);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const reduced = useReducedMotion();
  const animated = useAnimatedStyle(() => ({
    transform: surfacePress
      ? []
      : [
          { translateX: x.get() },
          { translateY: y.get() },
          { scaleX: scale.get() * stretchX.get() },
          { scaleY: scale.get() * stretchY.get() },
        ],
  }));
  const flex = StyleSheet.flatten(style)?.flex;
  const activate = () => {
    if (disabled) return;
    void Haptics.selectionAsync();
    onPress?.();
  };
  // The glass follows the finger on the UI thread and keeps its native optical effect.
  const elastic = Gesture.Pan()
    .enabled(!disabled)
    .minDistance(5)
    .hitSlop(5)
    .cancelsTouchesInView(false)
    .onBegin(() => {
      if (reduced) return;
      surfacePress?.set(withSpring(1, { damping: 19, stiffness: 390 }));
      stretchX.set(withSpring(1.1, { damping: 19, stiffness: 390 }));
      stretchY.set(withSpring(1.07, { damping: 19, stiffness: 390 }));
    })
    .onUpdate((e) => {
      if (reduced) return;
      surfacePress?.set(1 + Math.min(Math.abs(e.translationX), 38) / 110);
      x.set(Math.max(-12, Math.min(12, e.translationX * 0.24)));
      y.set(Math.max(-9, Math.min(9, e.translationY * 0.2)));
      stretchX.set(1.1 + Math.min(Math.abs(e.translationX), 38) * 0.002);
      stretchY.set(1.07 - Math.min(Math.abs(e.translationX), 38) * 0.0015);
    })
    .onEnd((e) => {
      if (Math.abs(e.translationX) < 64 && Math.abs(e.translationY) < 64)
        scheduleOnRN(activate);
    })
    .onFinalize(() => {
      const spring = { damping: 15, stiffness: 300, mass: 0.65 };
      surfacePress?.set(withSpring(0, spring));
      stretchX.set(withSpring(1, spring));
      stretchY.set(withSpring(1, spring));
      x.set(withSpring(0, spring));
      y.set(withSpring(0, spring));
    });
  const tap = Gesture.Tap()
    .enabled(!disabled)
    .maxDuration(900)
    .onEnd((_e, success) => {
      if (success) scheduleOnRN(activate);
    });
  if (expand)
    return (
      <GestureDetector gesture={Gesture.Race(elastic, tap)}>
        <Animated.View
          accessible
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityState={{ disabled }}
          onAccessibilityTap={activate}
          testID={testID}
          style={[style, animated]}
        >
          {children}
        </Animated.View>
      </GestureDetector>
    );
  return (
    <Pressable
      hitSlop={5}
      style={flex ? { flex } : undefined}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      testID={testID}
      disabled={disabled}
      onLongPress={onLongPress}
      onPressIn={() => {
        scale.set(withSpring(reduced ? 1 : 0.97, SNAP));
      }}
      onPressOut={() => {
        scale.set(withSpring(1, SNAP));
      }}
      onPress={() => {
        Haptics.selectionAsync();
        onPress?.();
      }}
    >
      <Animated.View style={[style, animated]}>{children}</Animated.View>
    </Pressable>
  );
}

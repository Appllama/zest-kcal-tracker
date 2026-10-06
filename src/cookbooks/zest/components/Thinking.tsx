import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  useReducedMotion,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { theme } from "../theme";

function Dot({ delay }: { delay: number }) {
  const p = useSharedValue(0.25);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) return;
    const timer = setTimeout(
      () =>
        p.set(
          withRepeat(
            withSequence(
              withTiming(0.85, { duration: 420 }),
              withTiming(0.25, { duration: 420 }),
            ),
            -1,
          ),
        ),
      delay,
    );
    return () => {
      clearTimeout(timer);
      cancelAnimation(p);
    };
  }, [delay, p, reduced]);
  const style = useAnimatedStyle(() => ({ opacity: p.get() }));
  return (
    <Animated.View
      style={[
        { width: 5, height: 5, borderRadius: 3, backgroundColor: theme.accent },
        style,
      ]}
    />
  );
}
export function Thinking() {
  return (
    <View
      accessible
      accessibilityLabel="Zest is thinking"
      style={{ flexDirection: "row", gap: 5, height: 28, alignItems: "center" }}
    >
      {[0, 120, 240].map((delay) => (
        <Dot key={delay} delay={delay} />
      ))}
    </View>
  );
}

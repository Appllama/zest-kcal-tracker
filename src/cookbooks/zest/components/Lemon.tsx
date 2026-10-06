import { useEffect } from "react";
import {
  Canvas,
  Circle,
  Group,
  Oval,
  Path,
  RoundedRect,
  vec,
} from "@shopify/react-native-skia";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { scheduleOnRN } from "react-native-worklets";
import { FIGURE, feetIn, type Scene } from "../hooks/useScene";

const [footX, footY] = feetIn(FIGURE.hero);

/** One live vector drawing, shared between its hero, composer and calendar positions. */
export function Lemon({
  scene,
  onPress,
  calendarOpen,
}: {
  scene: Scene;
  onPress: () => void;
  calendarOpen: boolean;
}) {
  const {
    gazeX,
    gazeY,
    headX,
    headY,
    bodyX,
    figure,
    feetX,
    feetY,
    reduced,
    hop,
    expression,
  } = scene;
  const lid = useSharedValue(1);
  const pressure = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    const id = setInterval(
      () =>
        lid.set(
          withSequence(
            withTiming(0.07, { duration: 95 }),
            withTiming(1, { duration: 135 }),
          ),
        ),
      3870,
    );
    return () => {
      clearInterval(id);
      cancelAnimation(lid);
    };
  }, [lid, reduced]);
  const place = useAnimatedStyle(() => ({
    transformOrigin: [footX, footY, 0],
    transform: [
      { translateX: feetX.get() - footX },
      { translateY: feetY.get() - footY - hop.get() * 12 },
      { scale: figure.get() },
      { rotateZ: `${bodyX.get() * 1.8}deg` },
      { scaleX: 1 + pressure.get() * 0.035 },
      { scaleY: 1 - pressure.get() * 0.05 },
    ],
  }));
  const head = useDerivedValue(() => [
    { translateX: headX.get() * 3.6 },
    { translateY: headY.get() * 2 },
    { rotate: headX.get() * 0.035 },
  ]);
  const pupils = useDerivedValue(() => [
    { translateX: gazeX.get() * 3 },
    { translateY: gazeY.get() * 2.3 },
  ]);
  const blink = useDerivedValue(() => [{ scaleY: lid.get() }]);
  const curious = useDerivedValue(() => Math.max(0, -expression.get()));
  const wry = useDerivedValue(() => Math.max(0, expression.get()));
  const smile = useDerivedValue(() => 1 - Math.max(0, expression.get()));
  const tap = Gesture.Tap()
    .maxDuration(650)
    .onBegin(() => pressure.set(withTiming(1, { duration: 100 })))
    .onFinalize((_event, success) => {
      pressure.set(withTiming(0, { duration: 170 }));
      if (success) scheduleOnRN(onPress);
    });
  return (
    <GestureDetector gesture={tap}>
      <Animated.View
        accessible
        accessibilityRole="button"
        accessibilityLabel={
          calendarOpen
            ? "Zest, close calorie calendar"
            : "Zest, open calorie calendar"
        }
        accessibilityHint="Your lemon opens your food diary."
        onAccessibilityTap={onPress}
        style={[
          {
            position: "absolute",
            left: 0,
            top: 0,
            width: FIGURE.hero,
            height: FIGURE.hero,
            zIndex: 45,
          },
          place,
        ]}
      >
        <Canvas
          pointerEvents="none"
          style={{ width: FIGURE.hero, height: FIGURE.hero }}
        >
          <Group transform={[{ scale: FIGURE.hero / 140 }]}>
            <Oval x={43} y={127} width={56} height={4} color="#272A2010" />
            {/* Soft little shoes keep their footing while the fruit looks around. */}
            <Path
              path="M47 112Q45 120 42 123Q38 132 56 130Q64 130 62 122L62 114Z"
              color="#667553"
            />
            <Path
              path="M80 112L80 123Q78 131 89 131L99 130Q104 128 97 123L95 112Z"
              color="#667553"
            />
            <Path
              path="M42 128Q49 130 60 128M82 128Q91 130 99 127"
              color="#DDE3CF"
              style="stroke"
              strokeWidth={2}
              strokeCap="round"
            />
            <Group transform={head} origin={vec(70, 76)}>
              {/* A lemon silhouette, not a yellow circle: pinched ends and one quiet leaf. */}
              <Path path="M59 29Q53 14 64 11Q72 10 73 27Z" color="#698152" />
              <Path path="M67 25Q67 4 91 8Q91 23 69 29Z" color="#7D945F" />
              <Path
                path="M70 24Q78 17 86 12"
                color="#5F784B"
                style="stroke"
                strokeWidth={1.5}
                strokeCap="round"
              />
              <Path
                path="M28 59Q25 35 49 31Q58 28 65 25Q72 19 78 25Q83 30 93 34Q115 47 114 72Q118 94 102 108Q99 120 90 118Q68 125 47 116Q28 110 24 94Q14 88 21 77Q25 70 28 59Z"
                color="#E6B838"
              />
              <Path
                path="M31 57Q30 37 51 33Q62 31 69 25Q76 28 88 34Q108 44 109 66Q113 84 104 99Q89 116 68 115Q39 115 28 96Q22 83 27 74Q30 67 31 57Z"
                color="#F3CE48"
              />
              <Path
                path="M37 52Q45 33 65 33Q75 31 81 35Q49 36 41 59Q34 72 33 81Q29 64 37 52Z"
                color="#FFE389"
              />
              <Path
                path="M26 82Q16 79 15 88Q13 97 20 100Q28 102 31 93Z"
                color="#F3CE48"
              />
              <Path
                path="M108 84Q116 77 123 85Q129 91 120 99Q111 103 107 94Z"
                color="#F3CE48"
              />
              <Group origin={vec(69, 66)} transform={blink}>
                {[43, 72].map((x) => (
                  <Group key={x}>
                    <RoundedRect
                      x={x}
                      y={50}
                      width={23}
                      height={32}
                      r={11.5}
                      color="#FFF9DF"
                    />
                    <Group transform={pupils}>
                      <RoundedRect
                        x={x + 7}
                        y={58}
                        width={9}
                        height={18}
                        r={4.5}
                        color="#35412E"
                      />
                      <Circle cx={x + 9} cy={61} r={2.3} color="white" />
                    </Group>
                  </Group>
                ))}
              </Group>
              <Group opacity={curious}>
                <Path
                  path="M43 44Q51 38 61 42M75 42Q83 39 92 45"
                  color="#687035"
                  style="stroke"
                  strokeWidth={2.4}
                  strokeCap="round"
                />
              </Group>
              <Group opacity={wry}>
                <Path
                  path="M45 44Q52 43 61 47M74 40Q84 34 94 40"
                  color="#687035"
                  style="stroke"
                  strokeWidth={2.7}
                  strokeCap="round"
                />
                <Path
                  path="M59 91Q70 96 81 86"
                  color="#5E622F"
                  style="stroke"
                  strokeWidth={2.7}
                  strokeCap="round"
                />
              </Group>
              <Oval x={35} y={80} width={10} height={4} color="#D89A3B66" />
              <Oval x={94} y={80} width={10} height={4} color="#D89A3B66" />
              <Path
                path="M60 88Q69 97 79 87"
                color="#5E622F"
                style="stroke"
                strokeWidth={2.7}
                strokeCap="round"
                opacity={smile}
              />
              <Circle cx={36} cy={63} r={1.2} color="#D7A93A" />
              <Circle cx={101} cy={57} r={1.1} color="#D7A93A" />
              <Circle cx={98} cy={101} r={1.2} color="#D7A93A" />
            </Group>
          </Group>
        </Canvas>
      </Animated.View>
    </GestureDetector>
  );
}

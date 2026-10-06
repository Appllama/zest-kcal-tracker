import { Image } from "expo-image";
import { useEffect, type PropsWithChildren } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from "react-native-reanimated";
import type { Meal, MealType } from "../data/diary";
import { useMealPhotoSource, useProteinArtwork } from "../data/photos";

const artwork = {
  Breakfast: require("../../../../assets/cookbooks/zest/stickers/toast.svg"),
  Lunch: require("../../../../assets/cookbooks/zest/stickers/bowl.svg"),
  Dinner: require("../../../../assets/cookbooks/zest/stickers/pasta.svg"),
  Snack: require("../../../../assets/cookbooks/zest/stickers/orange.svg"),
  Protein: require("../../../../assets/cookbooks/zest/stickers/eggs.svg"),
};
export type StickerKind = MealType | "Protein";

export function MealSticker({
  meal,
  size = 100,
  angle = 0,
}: {
  meal: Meal;
  size?: number;
  angle?: number;
}) {
  const source = useMealPhotoSource(meal.photo);
  if (!source)
    return <FoodSticker kind={meal.type} size={size} angle={angle} />;
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      style={{
        width: size,
        height: size,
        padding: size * 0.08,
        alignItems: "center",
        transform: [{ rotate: `${angle}deg` }],
      }}
    >
      <View
        style={{
          height: "100%",
          aspectRatio: 3 / 4,
          padding: 3,
          borderRadius: 9,
          backgroundColor: "#FFFEF9",
          boxShadow: "0 2px 5px rgba(30,34,22,.08)",
        }}
      >
        <Image
          source={source}
          style={{ flex: 1, borderRadius: 6 }}
          contentFit="cover"
          transition={0}
        />
      </View>
    </View>
  );
}

/** Original ink-and-paper food drawings. No emoji or extra mascot faces. */
export function FoodSticker({
  kind,
  size = 100,
  angle = 0,
}: {
  kind: StickerKind;
  size?: number;
  angle?: number;
}) {
  const protein = useProteinArtwork();
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      style={{
        width: size,
        height: size,
        transform: [{ rotate: `${angle}deg` }],
      }}
    >
      <Image
        source={kind === "Protein" ? protein : artwork[kind]}
        style={{ width: size, height: size }}
        contentFit="contain"
        transition={0}
      />
    </View>
  );
}

/** Each piece lands once, like placing a sticker; nothing oscillates while reading. */
export function StickerArrival({
  children,
  index = 0,
  offset = 12,
  spread = 0,
}: PropsWithChildren<{ index?: number; offset?: number; spread?: number }>) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.set(
      withDelay(
        index * 35,
        withSpring(1, { damping: 19, stiffness: 230, mass: 0.65 }),
      ),
    );
  }, [index, p]);
  const style = useAnimatedStyle(() => ({
    opacity: Math.min(1, p.get() * 2),
    transform: [
      { translateY: (1 - p.get()) * offset },
      { translateX: (1 - p.get()) * spread },
      { scale: 0.9 + p.get() * 0.1 },
    ],
  }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

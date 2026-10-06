import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
  type ComponentProps,
} from "react";
import { Text, View, type StyleProp, type TextStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { GlassSurface } from "./ui/GlassSurface";
import { Symbol, Touch } from "./ui/Touch";
import { FoodSticker, MealSticker } from "./Stickers";
import { mealTypes, type Meal, type MealType } from "../data/diary";
import { theme } from "../theme";

export const REPLY_EASE = Easing.bezier(0.23, 1, 0.32, 1);
export const CHOICE_RETIRE_MS = 190;
const AnimateReply = createContext(true);

/** Animate artwork and type only. Native glass forms with its own material API. */
function useReveal(active: boolean, delay = 0) {
  const reduced = useReducedMotion();
  const animate = useContext(AnimateReply);
  const [visible, setVisible] = useState(active && !animate);
  const progress = useSharedValue(active && !animate ? 1 : 0);
  useEffect(() => {
    const timer = setTimeout(
      () => {
        setVisible(active);
        progress.set(
          withTiming(active ? 1 : 0, {
            duration: !animate ? 0 : reduced ? 100 : active ? 230 : 120,
            easing: REPLY_EASE,
          }),
        );
      },
      active && !reduced && animate ? delay : 0,
    );
    return () => clearTimeout(timer);
  }, [active, animate, delay, progress, reduced]);
  const style = useAnimatedStyle(() => ({
    opacity: progress.get(),
    transform: [{ translateY: reduced ? 0 : (1 - progress.get()) * 5 }],
  }));
  return { visible, style };
}

function Reveal({
  children,
  active,
  delay = 0,
}: PropsWithChildren<{
  active: boolean;
  delay?: number;
}>) {
  const reveal = useReveal(active, delay);
  return (
    <Animated.View
      accessibilityElementsHidden={!reveal.visible}
      style={reveal.style}
    >
      {children}
    </Animated.View>
  );
}

/** Short language chunks arrive in order without changing the measured bubble. */
function ReplyCopy({
  text,
  active,
  delay = 0,
  style,
}: {
  text: string;
  active: boolean;
  delay?: number;
  style: StyleProp<TextStyle>;
}) {
  const reduced = useReducedMotion();
  const animate = useContext(AnimateReply);
  const [shown, setShown] = useState(active && !animate ? text : "");
  useEffect(() => {
    if (!active) return;
    const chunks = text.match(/\S+\s*/g) ?? [];
    const timers = (reduced || !animate ? [text] : chunks).map((_, index) =>
      setTimeout(
        () =>
          setShown(
            reduced || !animate ? text : chunks.slice(0, index + 1).join(""),
          ),
        reduced || !animate ? 0 : delay + index * 65,
      ),
    );
    return () => timers.forEach(clearTimeout);
  }, [active, animate, delay, reduced, text]);
  const reveal = useReveal(active, delay);
  return (
    <Animated.View
      accessible={active}
      accessibilityLabel={text}
      style={reveal.style}
    >
      <Text accessible={false} style={[style, { opacity: 0 }]}>
        {text}
      </Text>
      <Text
        accessible={false}
        style={[style, { position: "absolute", top: 0, left: 0, right: 0 }]}
      >
        {shown}
      </Text>
    </Animated.View>
  );
}

function MealChoice({
  type,
  index,
  active,
  onPress,
}: {
  type: MealType;
  index: number;
  active: boolean;
  onPress: () => void;
}) {
  const reveal = useReveal(active, 180 + index * 85);
  return (
    <View
      style={{ width: "48%" }}
      accessibilityElementsHidden={!reveal.visible}
    >
      <Touch
        label={`Log as ${type.toLowerCase()}`}
        onPress={onPress}
        disabled={!active || !reveal.visible}
        expand
      >
        <GlassSurface
          interactive
          visible={reveal.visible}
          materialize={0.2}
          style={{
            height: 92,
            borderRadius: 25,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Animated.View style={[{ alignItems: "center" }, reveal.style]}>
            <FoodSticker kind={type} size={72} angle={[-7, 6, -4, 8][index]} />
            <Text
              style={{
                marginTop: -5,
                marginBottom: 8,
                fontSize: 13,
                fontWeight: "500",
                color: theme.ink,
              }}
            >
              {type}
            </Text>
          </Animated.View>
        </GlassSurface>
      </Touch>
    </View>
  );
}

/** One identity and one settled height from meal choices through the estimate. */
export function MealReply(props: ComponentProps<typeof MealReplyBody>) {
  // Recycled, already completed replies render immediately when scrolled back.
  const [settledOnMount] = useState(props.complete);
  return (
    <AnimateReply.Provider value={!settledOnMount}>
      <MealReplyBody {...props} />
    </AnimateReply.Provider>
  );
}

function MealReplyBody({
  prompt,
  selecting,
  meal,
  complete,
  total,
  guide,
  thinking,
  onChoose,
  onEdit,
  onCalendar,
}: {
  prompt: string;
  selecting: boolean;
  meal?: Meal;
  complete: boolean;
  total: number;
  guide: number;
  thinking: React.ReactNode;
  onChoose: (type: MealType) => void;
  onEdit: () => void;
  onCalendar: () => void;
}) {
  const calendar = useReveal(complete, 460);
  return (
    <View style={{ minHeight: 240 }}>
      {(!meal || selecting) && (
        <View
          style={
            meal
              ? { position: "absolute", top: 0, left: 0, right: 0 }
              : undefined
          }
        >
          <ReplyCopy
            text={prompt}
            active={!selecting}
            delay={60}
            style={{
              fontSize: 23,
              lineHeight: 28,
              fontWeight: "500",
              letterSpacing: -0.25,
              color: theme.ink,
            }}
          />
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 10,
              marginTop: 18,
            }}
          >
            {mealTypes.map((type, index) => (
              <MealChoice
                key={type}
                type={type}
                index={index}
                active={!selecting}
                onPress={() => onChoose(type)}
              />
            ))}
          </View>
        </View>
      )}
      {meal && (
        <View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginHorizontal: -9,
            }}
          >
            <Reveal active>
              <MealSticker meal={meal} size={142} angle={-7} />
            </Reveal>
            <View
              style={{
                flex: 1,
                marginLeft: -1,
                minHeight: 130,
                justifyContent: "center",
              }}
            >
              {!complete && (
                <View style={{ position: "absolute", left: 12 }}>
                  <Reveal active delay={120}>
                    {thinking}
                  </Reveal>
                </View>
              )}
              <Touch
                label={`Edit ${meal.name}, ${meal.kcal} estimated kilocalories`}
                disabled={!complete}
                onPress={onEdit}
              >
                <ReplyCopy
                  text={meal.name}
                  active={complete}
                  style={{
                    fontSize: 14,
                    lineHeight: 18,
                    color: theme.muted,
                    marginBottom: 2,
                  }}
                />
                <Reveal active={complete} delay={100}>
                  <Text
                    accessibilityLabel={`${meal.kcal} estimated kilocalories`}
                    maxFontSizeMultiplier={1.1}
                    numberOfLines={1}
                    style={{
                      fontSize: meal.kcal >= 10000 ? 43 : 54,
                      lineHeight: 65,
                      fontWeight: "500",
                      letterSpacing: -2.6,
                      color: theme.ink,
                      fontVariant: ["tabular-nums"],
                    }}
                  >
                    {meal.kcal}
                  </Text>
                </Reveal>
                <Reveal active={complete} delay={210}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 9,
                    }}
                  >
                    <Text style={{ fontSize: 12, color: theme.muted }}>
                      kcal · estimated
                    </Text>
                    <Symbol name="pencil" size={13} color={theme.muted} />
                  </View>
                </Reveal>
              </Touch>
            </View>
          </View>
          <View style={{ marginTop: 2 }}>
            <ReplyCopy
              active={complete}
              delay={300}
              text={
                total > guide
                  ? "A plot twist. You’re fine."
                  : meal.photo?.sample && meal.photo.asset === "breakfast"
                    ? "Toast with ambition."
                    : "Saved. Nicely done."
              }
              style={{ fontSize: 18, letterSpacing: -0.4, color: theme.ink }}
            />
          </View>
          <View
            accessibilityElementsHidden={!calendar.visible}
            style={{ alignSelf: "flex-start", marginTop: 16 }}
          >
            <Touch
              label="See calorie calendar"
              onPress={onCalendar}
              disabled={!calendar.visible}
              expand
            >
              <GlassSurface
                interactive
                visible={calendar.visible}
                materialize={0.2}
                style={{
                  height: 44,
                  borderRadius: 22,
                  paddingHorizontal: 16,
                  justifyContent: "center",
                }}
              >
                <Animated.View
                  style={[
                    { flexDirection: "row", alignItems: "center", gap: 8 },
                    calendar.style,
                  ]}
                >
                  <Symbol name="calendar" size={17} color={theme.ink} />
                  <Text style={{ fontSize: 14, color: theme.ink }}>My day</Text>
                  <Symbol name="arrow.up.right" size={12} color={theme.muted} />
                </Animated.View>
              </GlassSurface>
            </Touch>
          </View>
        </View>
      )}
    </View>
  );
}

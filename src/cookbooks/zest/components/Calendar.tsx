import { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View, useWindowDimensions } from "react-native";
import { BlurView } from "expo-blur";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { GlassSurface } from "./ui/GlassSurface";
import { GlassButton } from "./ui/GlassButton";
import { Symbol, Touch } from "./ui/Touch";
import { FoodSticker, MealSticker, StickerArrival } from "./Stickers";
import {
  dayCaption,
  dayKey,
  intakeMood,
  mealsOn,
  monthCells,
  parseDay,
  totalOn,
  type Meal,
} from "../data/diary";
import { theme } from "../theme";
import type { Scene } from "../hooks/useScene";

const week = ["M", "T", "W", "T", "F", "S", "S"];
export function CalorieCalendar({
  scene,
  open,
  meals,
  guide,
  onClose,
  onAdd,
  onEdit,
  onGuide,
}: {
  scene: Scene;
  open: boolean;
  meals: Meal[];
  guide: number;
  onClose: () => void;
  onAdd: () => void;
  onEdit: (meal: Meal) => void;
  onGuide: () => void;
}) {
  const today = dayKey();
  const { fontScale } = useWindowDimensions();
  const largeText = fontScale > 1.2;
  const [selected, setSelected] = useState(today);
  const [month, setMonth] = useState(() => new Date());
  const cells = useMemo(
    () => monthCells(month.getFullYear(), month.getMonth()),
    [month],
  );
  const items = mealsOn(meals, selected);
  const total = totalOn(meals, selected);
  const { pick, reduced, expression } = scene;
  useEffect(() => {
    if (open)
      expression.set(withTiming(intakeMood(total, guide), { duration: 220 }));
  }, [open, total, guide, expression]);
  const panelTop = Math.max(180, scene.height - 616);
  const slide = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: reduced
          ? pick.get() < 0.01
            ? scene.height
            : 0
          : (1 - pick.get()) * (scene.height - panelTop + 20),
      },
    ],
  }));
  const blur = useAnimatedStyle(() => ({
    opacity: Math.max(0, Math.min(1, pick.get())),
  }));
  const stepMonth = (direction: number) => {
    const next = new Date(
      month.getFullYear(),
      month.getMonth() + direction,
      1,
      12,
    );
    setMonth(next);
    setSelected(
      today.startsWith(dayKey(next).slice(0, 7)) ? today : dayKey(next),
    );
    void Haptics.selectionAsync();
  };
  const closeControl = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - scene.pick.get()) * -130 }],
  }));
  return (
    <View
      pointerEvents={open ? "box-none" : "none"}
      accessibilityViewIsModal={open}
      accessibilityElementsHidden={!open}
      importantForAccessibility={open ? "auto" : "no-hide-descendants"}
      style={{ position: "absolute", inset: 0, zIndex: 30 }}
    >
      {/* A fixed blur material fades in on the compositor. Updating intensity
          recreates Expo's UIViewPropertyAnimator on every transition frame.
          This layer is a sibling of the glass, never a glass ancestor. */}
      <Animated.View
        pointerEvents="none"
        style={[{ position: "absolute", inset: 0 }, blur]}
      >
        <BlurView intensity={65} tint="light" style={{ flex: 1 }} />
      </Animated.View>
      <Animated.View
        style={[
          { position: "absolute", top: scene.top, right: 18 },
          closeControl,
        ]}
      >
        <GlassButton
          name="xmark"
          label="Close calorie calendar"
          onPress={onClose}
        />
      </Animated.View>
      <Animated.View
        style={[
          {
            position: "absolute",
            top: panelTop,
            left: 16,
            right: 16,
            height: scene.height - panelTop - scene.bottom - 16,
          },
          slide,
        ]}
      >
        {/* Keep the native material with its moving sheet, including offscreen.
            Re-forming it on open makes content arrive before the glass rim. */}
        <GlassSurface style={{ flex: 1, borderRadius: 36 }}>
          <Animated.View
            style={{ flex: 1, borderRadius: 36, overflow: "hidden" }}
          >
            <View style={{ flex: 1 }}>
              <ScrollView
                key={fontScale}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                  paddingHorizontal: 20,
                  paddingTop: 22,
                  paddingBottom: 30,
                }}
              >
                <View
                  style={{
                    flexDirection: largeText ? "column" : "row",
                    alignItems: largeText ? "stretch" : "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <Text
                    accessibilityRole="header"
                    maxFontSizeMultiplier={1.6}
                    style={{
                      fontSize: 28,
                      fontWeight: "600",
                      letterSpacing: -0.8,
                      color: theme.ink,
                    }}
                  >
                    {month.toLocaleDateString("en-US", { month: "long" })}
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "400",
                        letterSpacing: 0,
                        color: theme.muted,
                      }}
                    >
                      {" "}
                      {month.getFullYear()}
                    </Text>
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      marginRight: -8,
                      alignSelf: largeText ? "flex-end" : "auto",
                    }}
                  >
                    {selected !== today && (
                      <Touch
                        label="Return calendar to today"
                        onPress={() => {
                          setMonth(new Date());
                          setSelected(today);
                        }}
                        style={{
                          width: 44,
                          height: 44,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Symbol
                          name="arrow.counterclockwise"
                          size={16}
                          color={theme.muted}
                        />
                      </Touch>
                    )}
                    <Touch
                      label="Previous month"
                      onPress={() => stepMonth(-1)}
                      style={{
                        width: 44,
                        height: 44,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Symbol name="chevron.left" size={15} color={theme.ink} />
                    </Touch>
                    <Touch
                      label="Next month"
                      onPress={() => stepMonth(1)}
                      style={{
                        width: 44,
                        height: 44,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Symbol
                        name="chevron.right"
                        size={15}
                        color={theme.ink}
                      />
                    </Touch>
                  </View>
                </View>
                <View style={{ flexDirection: "row", height: 22 }}>
                  {week.map((day, i) => (
                    <Text
                      key={i}
                      maxFontSizeMultiplier={1.8}
                      style={{
                        flex: 1,
                        textAlign: "center",
                        color: theme.faint,
                        fontSize: 11,
                      }}
                    >
                      {day}
                    </Text>
                  ))}
                </View>
                <View>
                  {Array.from(
                    { length: Math.ceil(cells.length / 7) },
                    (_, row) => (
                      <View key={row} style={{ flexDirection: "row" }}>
                        {cells
                          .slice(row * 7, row * 7 + 7)
                          .map((day, column) => {
                            const i = row * 7 + column;
                            const logged = day ? mealsOn(meals, day) : [];
                            const food = logged.length
                              ? logged[parseDay(day!).getDate() % logged.length]
                              : undefined;
                            return (
                              <View
                                key={day ?? `blank-${i}`}
                                style={{
                                  flex: 1,
                                  height: 48,
                                  alignItems: "center",
                                }}
                              >
                                {day && (
                                  <Touch
                                    label={`${dayCaption(day)}, ${totalOn(meals, day)} kilocalories, ${day}`}
                                    onPress={() => {
                                      setSelected(day);
                                      void Haptics.selectionAsync();
                                    }}
                                    style={{
                                      width: 44,
                                      height: 47,
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                  >
                                    {selected === day && (
                                      <GlassSurface
                                        interactive
                                        materialize={0}
                                        style={{
                                          position: "absolute",
                                          left: 0,
                                          top: 0,
                                          width: 44,
                                          height: 47,
                                          borderRadius: 14,
                                        }}
                                      />
                                    )}
                                    {food ? (
                                      <>
                                        <MealSticker
                                          meal={food}
                                          size={34}
                                          angle={((i % 3) - 1) * 8}
                                        />
                                        <Text
                                          maxFontSizeMultiplier={1.8}
                                          style={{
                                            fontSize: 10,
                                            fontWeight: "500",
                                            marginTop: -6,
                                            color: theme.ink,
                                          }}
                                        >
                                          {parseDay(day).getDate()}
                                        </Text>
                                      </>
                                    ) : (
                                      <Text
                                        maxFontSizeMultiplier={1.8}
                                        style={{
                                          fontSize: 15,
                                          fontWeight:
                                            day === today ? "600" : "400",
                                          color:
                                            day > today ? "#A7A9A2" : theme.ink,
                                        }}
                                      >
                                        {parseDay(day).getDate()}
                                      </Text>
                                    )}
                                  </Touch>
                                )}
                              </View>
                            );
                          })}
                      </View>
                    ),
                  )}
                </View>
                <View
                  style={{
                    height: 0.5,
                    backgroundColor: theme.line,
                    marginTop: 12,
                    marginBottom: 14,
                  }}
                />
                <View
                  style={{
                    flexDirection: largeText ? "column" : "row",
                    alignItems: largeText ? "flex-start" : "center",
                    justifyContent: "space-between",
                    gap: largeText ? 8 : 0,
                  }}
                >
                  <View>
                    <Text style={{ color: theme.muted, fontSize: 12 }}>
                      {dayCaption(selected)}
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "baseline",
                        gap: 6,
                      }}
                    >
                      <Text
                        accessibilityLabel={`${total} kilocalories logged`}
                        maxFontSizeMultiplier={1.8}
                        style={{
                          fontSize: 43,
                          lineHeight: 51,
                          fontWeight: "500",
                          letterSpacing: -1.8,
                          fontVariant: ["tabular-nums"],
                          color: theme.ink,
                        }}
                      >
                        {total.toLocaleString()}
                      </Text>
                      <Text style={{ fontSize: 14, color: theme.muted }}>
                        kcal
                      </Text>
                    </View>
                  </View>
                  <Touch
                    label="Edit daily calorie guide"
                    onPress={onGuide}
                    style={{
                      minHeight: 55,
                      alignItems: "flex-end",
                      justifyContent: "center",
                      gap: 7,
                    }}
                  >
                    <View style={{ flexDirection: "row", gap: 3 }}>
                      {Array.from({ length: 12 }, (_, i) => (
                        <View
                          key={i}
                          style={{
                            width: 4,
                            height: 18,
                            borderRadius: 2,
                            backgroundColor:
                              i < Math.round(Math.min(1, total / guide) * 12)
                                ? total > guide
                                  ? "#B49458"
                                  : "#85916C"
                                : "#25272013",
                          }}
                        />
                      ))}
                    </View>
                    <Text style={{ fontSize: 11, color: theme.muted }}>
                      guide {guide.toLocaleString()}
                    </Text>
                  </Touch>
                </View>
                {items.length ? (
                  <Animated.View
                    key={selected}
                    entering={FadeIn.duration(120)}
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      alignItems: "center",
                      justifyContent: "center",
                      marginTop: 2,
                      paddingBottom: 3,
                    }}
                  >
                    {items.map((meal, i) => (
                      <View
                        key={meal.id}
                        style={{ width: "33.333%", alignItems: "center" }}
                      >
                        <StickerArrival
                          index={i}
                          offset={9}
                          spread={
                            ((Math.min(items.length, 3) - 1) / 2 - (i % 3)) * 32
                          }
                        >
                          <Touch
                            label={`Edit ${meal.name}, ${meal.kcal} kilocalories`}
                            onPress={() => onEdit(meal)}
                            style={{ minHeight: 100, alignItems: "center" }}
                          >
                            <MealSticker
                              meal={meal}
                              size={90}
                              angle={[-9, 5, -3][i % 3]}
                            />
                            <View
                              style={{
                                marginTop: -7,
                                paddingHorizontal: 9,
                                paddingVertical: 3,
                                borderRadius: 5,
                                backgroundColor: "#FFFDF5",
                                transform: [{ rotate: `${i % 2 ? 3 : -3}deg` }],
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 13,
                                  fontWeight: "500",
                                  color: theme.ink,
                                }}
                              >
                                {meal.kcal}
                              </Text>
                            </View>
                          </Touch>
                        </StickerArrival>
                      </View>
                    ))}
                  </Animated.View>
                ) : (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      minHeight: 105,
                      gap: 8,
                    }}
                  >
                    <View style={{ opacity: 0.35 }}>
                      <FoodSticker kind="Breakfast" size={100} angle={-7} />
                    </View>
                    {selected === today ? (
                      <Touch
                        label="Log a meal from calendar"
                        onPress={onAdd}
                        expand
                      >
                        <GlassSurface
                          interactive
                          style={{
                            height: 44,
                            borderRadius: 22,
                            paddingHorizontal: 16,
                            flexDirection: "row",
                            gap: 8,
                            alignItems: "center",
                          }}
                        >
                          <Symbol name="plus" size={17} color={theme.ink} />
                          <Text style={{ fontSize: 14, color: theme.ink }}>
                            First bite
                          </Text>
                        </GlassSurface>
                      </Touch>
                    ) : (
                      <Text style={{ fontSize: 15, color: theme.muted }}>
                        A blank page.
                      </Text>
                    )}
                  </View>
                )}
              </ScrollView>
            </View>
          </Animated.View>
        </GlassSurface>
      </Animated.View>
    </View>
  );
}

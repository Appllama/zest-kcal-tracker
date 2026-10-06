import { Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import Animated, { FadeIn, LinearTransition } from "react-native-reanimated";
import { Thinking } from "./Thinking";
import { VisualAnswer } from "./VisualAnswer";
import { MealReply, REPLY_EASE } from "./MealReply";
import { MealImage } from "../data/photos";
import { Symbol, Touch } from "./ui/Touch";
import { totalOn, type Meal, type MealType } from "../data/diary";
import type { Turn } from "../data/conversation";
import { theme } from "../theme";

export function ChatTurn({
  turn,
  meals,
  guide,
  reduced,
  onChoose,
  onEdit,
  onCalendar,
}: {
  turn: Turn;
  meals: Meal[];
  guide: number;
  reduced: boolean;
  onChoose: (turn: Turn, type: MealType) => void;
  onEdit: (meal: Meal) => void;
  onCalendar: () => void;
}) {
  return (
    <Animated.View
      key={
        turn.kind === "text" ? `${turn.id}-${turn.state ?? "sent"}` : turn.id
      }
      entering={
        turn.kind === "text" && !reduced
          ? FadeIn.delay(320).duration(140)
          : undefined
      }
      layout={
        (turn.kind === "question" || turn.kind === "meal") && !reduced
          ? LinearTransition.duration(280).easing(REPLY_EASE)
          : undefined
      }
      style={[
        { marginBottom: turn.role === "user" ? 20 : 24 },
        turn.role === "assistant" && {
          width: turn.state === "thinking" && turn.kind !== "meal" ? 72 : "92%",
          alignSelf: "flex-start",
          backgroundColor: "#FEFEFC",
          borderRadius: 28,
          borderCurve: "continuous",
          paddingHorizontal: 20,
          paddingVertical: 19,
          boxShadow: "0 3px 18px rgba(32, 35, 25, 0.035)",
        },
      ]}
    >
      {turn.kind === "photo" ? (
        <View
          style={{
            alignSelf: "flex-end",
            borderRadius: 22,
            padding: 5,
            transform: [{ rotate: "3deg" }],
            backgroundColor: "#FFFEF9",
            boxShadow: "0 4px 12px rgba(30, 34, 22, 0.09)",
          }}
        >
          <MealImage
            accessibilityLabel="Meal photo"
            photo={turn.photo}
            style={{ width: 168, height: 224, borderRadius: 17 }}
            contentFit="cover"
            transition={180}
          />
        </View>
      ) : turn.role === "user" ? (
        <View
          style={{
            alignSelf: "flex-end",
            backgroundColor: theme.heavy,
            paddingHorizontal: 17,
            paddingVertical: 12,
            borderRadius: 24,
            maxWidth: "90%",
          }}
        >
          <Text
            selectable
            style={{ fontSize: 17, lineHeight: 24, color: "white" }}
          >
            {turn.text}
          </Text>
        </View>
      ) : turn.kind === "question" && turn.state === "thinking" ? (
        <Thinking />
      ) : turn.kind === "question" || turn.kind === "meal" ? (
        (() => {
          const saved = meals.find((meal) => meal.id === turn.mealId);
          if (turn.kind === "meal" && turn.state === "complete" && !saved)
            return (
              <Text style={{ color: theme.muted, fontSize: 16 }}>
                Meal removed from your diary.
              </Text>
            );
          const meal =
            turn.kind === "meal" || turn.state === "confirming"
              ? (saved ?? turn.pendingMeal)
              : undefined;
          return (
            <MealReply
              key={turn.id}
              prompt={turn.text ?? "Which meal?"}
              selecting={turn.state === "confirming"}
              meal={meal}
              complete={turn.state === "complete"}
              total={meal ? totalOn(meals, meal.date) : 0}
              guide={guide}
              thinking={<Thinking />}
              onChoose={(type) => onChoose(turn, type)}
              onEdit={() => {
                if (saved) onEdit(saved);
              }}
              onCalendar={onCalendar}
            />
          );
        })()
      ) : turn.state === "thinking" ? (
        <Thinking />
      ) : (
        <View>
          {turn.answer ? (
            <VisualAnswer answer={turn.answer} />
          ) : (
            <Text
              selectable
              style={{
                fontSize: 20,
                lineHeight: 28,
                letterSpacing: -0.25,
                color: theme.ink,
              }}
            >
              {turn.text}
            </Text>
          )}
          {turn.state === "stopped" && (
            <Text
              style={{
                color: theme.muted,
                marginTop: 10,
                fontSize: 13,
              }}
            >
              Response stopped.
            </Text>
          )}
          {turn.state === "complete" && (
            <Touch
              label="Copy Zest’s answer"
              onPress={() => void Clipboard.setStringAsync(turn.text ?? "")}
              style={{
                width: 44,
                height: 44,
                justifyContent: "center",
                alignItems: "center",
                alignSelf: "flex-end",
                marginTop: 0,
              }}
            >
              <Symbol name="square.on.square" size={16} color={theme.muted} />
            </Touch>
          )}
        </View>
      )}
    </Animated.View>
  );
}

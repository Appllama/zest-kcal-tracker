import { Text, View } from "react-native";
import { FoodSticker } from "./Stickers";
import type { IntakeAnswer } from "../data/diary";
import { theme } from "../theme";

export function VisualAnswer({ answer }: { answer: IntakeAnswer }) {
  const protein = answer.unit?.includes("protein");
  return (
    <View
      accessible
      accessibilityLabel={[
        answer.value && `${answer.value} ${answer.unit}`,
        answer.caption,
        answer.detail,
      ]
        .filter(Boolean)
        .join(". ")}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginHorizontal: -8,
        }}
      >
        <FoodSticker
          kind={protein ? "Protein" : "Lunch"}
          size={118}
          angle={protein ? 7 : -5}
        />
        <View style={{ flex: 1, paddingLeft: 4 }}>
          <Text style={{ color: theme.muted, fontSize: 13 }}>
            {protein ? "Protein" : answer.value ? "Your log" : "A fresh page"}
          </Text>
          {answer.value ? (
            <View
              style={{ flexDirection: "row", alignItems: "baseline", gap: 5 }}
            >
              <Text
                adjustsFontSizeToFit
                numberOfLines={1}
                style={{
                  fontSize: 52,
                  lineHeight: 62,
                  fontWeight: "500",
                  letterSpacing: -2.2,
                  color: theme.ink,
                  flexShrink: 1,
                }}
              >
                {answer.value}
              </Text>
              <Text style={{ color: theme.muted, fontSize: 18 }}>
                {protein ? "g" : answer.unit}
              </Text>
            </View>
          ) : (
            <Text
              style={{
                fontSize: 20,
                lineHeight: 25,
                color: theme.ink,
                marginTop: 8,
              }}
            >
              {answer.detail.includes("protein")
                ? "No estimate yet."
                : "Nothing logged yet."}
            </Text>
          )}
          <Text style={{ fontSize: 12, lineHeight: 17, color: theme.muted }}>
            {answer.caption}
          </Text>
        </View>
      </View>
      {answer.value && protein && (
        <Text style={{ fontSize: 17, color: theme.ink, marginTop: 5 }}>
          {answer.detail.includes("Some meals")
            ? "Some estimates are missing."
            : "Little fuel. Big plans."}
        </Text>
      )}
    </View>
  );
}

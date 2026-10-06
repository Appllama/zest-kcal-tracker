import { useState } from "react";
import { Keyboard, Modal, Text, TextInput, View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";
import { useKeyboardPosition } from "../hooks/useKeyboardPosition";
import { GlassSurface } from "./ui/GlassSurface";
import { GlassButton } from "./ui/GlassButton";
import { Touch } from "./ui/Touch";
import { MealSticker } from "./Stickers";
import type { Meal } from "../data/diary";
import { theme } from "../theme";

const amount = z.coerce.number().int().min(1).max(10000);
export type EditRequest = {
  name: string;
  meal?: Meal;
  kcal?: number;
  guide?: boolean;
  onSave: (name: string, kcal: number) => void;
  onDelete?: () => void;
};
export function MealEditor({
  request,
  onClose,
}: {
  request: EditRequest;
  onClose: () => void;
}) {
  const [name, setName] = useState(request.name);
  const [kcal, setKcal] = useState(request.kcal ? String(request.kcal) : "");
  const [error, setError] = useState("");
  const keyboard = useKeyboardPosition();
  const bottom = useSafeAreaInsets().bottom + 8;
  const position = useAnimatedStyle(() => ({
    transform: [
      {
        translateY:
          -keyboard.height.get() + (bottom - 12) * keyboard.progress.get(),
      },
    ],
  }));
  const close = () => {
    Keyboard.dismiss();
    onClose();
  };
  const save = () => {
    const parsed = amount.safeParse(kcal);
    if (!parsed.success || (!request?.guide && !name.trim())) {
      setError(!parsed.success ? "Use 1–10,000 kcal." : "Add a meal name.");
      return;
    }
    request?.onSave(name.trim(), parsed.data);
    close();
  };
  return (
    <Modal
      transparent
      visible={!!request}
      animationType="fade"
      onRequestClose={close}
    >
      <View style={{ flex: 1 }}>
        <BlurView
          tint="light"
          intensity={30}
          style={{ position: "absolute", inset: 0 }}
        />
        <Animated.View
          style={[
            { position: "absolute", bottom, left: 16, right: 16 },
            position,
          ]}
        >
          <GlassSurface style={{ borderRadius: 32, padding: 22 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              {request.meal && (
                <View style={{ marginLeft: -10, marginRight: 3 }}>
                  <MealSticker meal={request.meal} size={62} angle={-7} />
                </View>
              )}
              <Text
                accessibilityRole="header"
                style={{
                  flex: 1,
                  fontSize: 23,
                  fontWeight: "600",
                  letterSpacing: -0.5,
                  color: theme.ink,
                }}
              >
                {request?.guide
                  ? "Daily guide"
                  : request?.kcal
                    ? "Edit meal"
                    : "Your estimate"}
              </Text>
              <GlassButton
                name="xmark"
                label="Cancel meal edit"
                size={40}
                onPress={close}
              />
            </View>
            {!request?.guide && (
              <TextInput
                accessibilityLabel="Meal name"
                placeholder="Meal name"
                value={name}
                onChangeText={(value) => {
                  setName(value);
                  setError("");
                }}
                maxLength={80}
                returnKeyType="next"
                style={{
                  minHeight: 48,
                  fontSize: 18,
                  color: theme.ink,
                  borderBottomWidth: 0.5,
                  borderColor: theme.line,
                  marginBottom: 8,
                }}
              />
            )}
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <TextInput
                accessibilityLabel={
                  request?.guide ? "Daily guide calories" : "Meal calories"
                }
                placeholder="0"
                value={kcal}
                onChangeText={(value) => {
                  setKcal(value.replace(/^0+(?=\d)/, ""));
                  setError("");
                }}
                keyboardType="number-pad"
                selectTextOnFocus
                maxLength={5}
                style={{
                  flex: 1,
                  minHeight: 66,
                  fontSize: 42,
                  color: theme.ink,
                  fontVariant: ["tabular-nums"],
                }}
              />
              <Text style={{ fontSize: 18, color: theme.muted }}>kcal</Text>
            </View>
            {error ? (
              <Text
                accessibilityRole="alert"
                style={{
                  fontSize: 13,
                  lineHeight: 18,
                  color: "#9E4638",
                  marginTop: 6,
                  marginBottom: 14,
                }}
              >
                {error}
              </Text>
            ) : (
              <View style={{ height: 16 }} />
            )}
            <Touch
              label={request?.guide ? "Save daily guide" : "Save meal"}
              onPress={save}
              style={{
                height: 50,
                borderRadius: 25,
                backgroundColor: theme.heavy,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "600", color: "white" }}>
                Save {request?.guide ? "guide" : "meal"}
              </Text>
            </Touch>
            {request?.onDelete && (
              <Touch
                label="Remove this meal"
                onPress={() => {
                  request.onDelete?.();
                  close();
                }}
                style={{
                  minHeight: 44,
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 6,
                }}
              >
                <Text style={{ color: "#936355", fontSize: 14 }}>
                  Remove meal
                </Text>
              </Touch>
            )}
          </GlassSurface>
        </Animated.View>
      </View>
    </Modal>
  );
}

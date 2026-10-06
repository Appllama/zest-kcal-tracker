import { useState } from "react";
import {
  Modal,
  Pressable,
  StatusBar,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { GlassSurface } from "./ui/GlassSurface";
import { GlassButton } from "./ui/GlassButton";
import { Touch, Symbol } from "./ui/Touch";
import { MealImage } from "../data/photos";
import { theme } from "../theme";
import type { MealPhoto } from "../data/diary";

/** Only the explicitly selected sample flow uses this simulated viewfinder.
 * Ordinary camera/library entry continues to use the native image picker.
 */
export function DemoCamera({
  onClose,
  onUse,
  onLibrary,
}: {
  onClose: () => void;
  onUse: (photo: MealPhoto) => void;
  onLibrary: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const safe = useSafeAreaInsets();
  const [review, setReview] = useState(false);
  const [ready, setReady] = useState(false);
  const [point, setPoint] = useState({
    x: (width - 28) / 2,
    y: ((width - 28) * 2) / 3,
  });
  const flash = useSharedValue(0);
  const focus = useSharedValue(0);
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.get() }));
  const focusStyle = useAnimatedStyle(() => ({
    opacity: focus.get(),
    transform: [{ scale: 1.1 - focus.get() * 0.1 }],
  }));
  const focusAt = (x: number, y: number) => {
    if (review) return;
    setPoint({ x, y });
    focus.set(
      withSequence(
        withTiming(1, { duration: 100 }),
        withDelay(380, withTiming(0, { duration: 200 })),
      ),
    );
    void Haptics.selectionAsync();
  };
  const capture = () => {
    if (!ready) return;
    flash.set(
      withSequence(
        withTiming(0.8, { duration: 55 }),
        withTiming(0, { duration: 130 }),
      ),
    );
    setReview(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };
  const photoWidth = width - 28;
  const photoHeight = Math.min(
    (photoWidth * 4) / 3,
    height - safe.top - safe.bottom - 190,
  );
  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <StatusBar barStyle="dark-content" />
      <View style={{ flex: 1, backgroundColor: theme.paper }}>
        <View
          style={{
            marginTop: safe.top + 4,
            paddingHorizontal: 18,
            height: 48,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <GlassButton
            name="xmark"
            label="Close sample camera"
            onPress={onClose}
          />
          <Text
            accessibilityRole="header"
            style={{ fontSize: 17, fontWeight: "500", color: theme.ink }}
          >
            {review ? "Your photo" : "Meal photo"}
          </Text>
          <View style={{ width: 44 }} />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            review
              ? "Captured dinner photo"
              : "Sample camera viewfinder. Tap to focus on dinner"
          }
          onPress={(e) =>
            focusAt(e.nativeEvent.locationX, e.nativeEvent.locationY)
          }
          style={{
            marginTop: 18,
            marginHorizontal: 14,
            width: photoWidth,
            height: photoHeight,
            borderRadius: 28,
            overflow: "hidden",
            backgroundColor: "#D0C2A7",
          }}
        >
          <MealImage
            photo={{ sample: true, asset: "dinner" }}
            contentFit="contain"
            transition={0}
            onDisplay={() => {
              if (ready) return;
              setReady(true);
              focusAt(photoWidth / 2, photoHeight / 2);
            }}
            style={{ width: photoWidth, height: photoHeight }}
          />
          {!review && (
            <Animated.View
              pointerEvents="none"
              style={[
                {
                  position: "absolute",
                  left: point.x - 34,
                  top: point.y - 34,
                  width: 68,
                  height: 68,
                  borderRadius: 15,
                  borderWidth: 1.25,
                  borderColor: "#FFF5AC",
                },
                focusStyle,
              ]}
            />
          )}
          <Animated.View
            pointerEvents="none"
            style={[
              { position: "absolute", inset: 0, backgroundColor: "white" },
              flashStyle,
            ]}
          />
        </Pressable>
        <View
          style={{
            position: "absolute",
            bottom: safe.bottom + 44,
            left: 32,
            right: 32,
            height: 76,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {review ? (
            <>
              <Touch
                label="Retake meal photo"
                onPress={() => setReview(false)}
                expand
              >
                <GlassSurface
                  interactive
                  style={{
                    height: 50,
                    borderRadius: 25,
                    paddingHorizontal: 19,
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 16, color: theme.ink }}>Retake</Text>
                </GlassSurface>
              </Touch>
              <Touch
                label="Use meal photo"
                onPress={() => onUse({ sample: true, asset: "dinner" })}
                expand
              >
                <GlassSurface
                  interactive
                  style={{
                    height: 50,
                    borderRadius: 25,
                    paddingHorizontal: 19,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 9,
                  }}
                >
                  <Symbol name="checkmark" size={17} color={theme.ink} />
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "500",
                      color: theme.ink,
                    }}
                  >
                    Use photo
                  </Text>
                </GlassSurface>
              </Touch>
            </>
          ) : (
            <>
              <Touch
                label="Open photo library from camera"
                onPress={onLibrary}
                style={{
                  width: 48,
                  height: 48,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 46,
                    padding: 2,
                    borderRadius: 10,
                    backgroundColor: "white",
                    transform: [{ rotate: "-5deg" }],
                  }}
                >
                  <MealImage
                    photo={{ sample: true, asset: "lunch" }}
                    contentFit="cover"
                    style={{ flex: 1, borderRadius: 8 }}
                  />
                </View>
              </Touch>
              <Touch
                label="Take dinner photo"
                onPress={capture}
                expand
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: 38,
                  borderWidth: 2,
                  borderColor: theme.ink,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: ready ? 1 : 0.45,
                }}
              >
                <View
                  style={{
                    width: 62,
                    height: 62,
                    borderRadius: 31,
                    backgroundColor: theme.ink,
                  }}
                />
              </Touch>
              <View style={{ width: 48 }} />
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

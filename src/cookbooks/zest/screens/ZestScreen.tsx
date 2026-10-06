import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Keyboard, Linking, Pressable, Text, View } from "react-native";
import {
  KeyboardController,
  KeyboardEvents,
} from "react-native-keyboard-controller";
import { scheduleOnRN } from "react-native-worklets";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { File, Paths } from "expo-file-system";
import { FlashList, type FlashListRef } from "@shopify/flash-list";
import Animated, {
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import {
  GlassThemeProvider,
  GlassSurface,
} from "../components/ui/GlassSurface";
import { GlassButton } from "../components/ui/GlassButton";
import { ProgressiveBlur } from "../components/ui/ProgressiveBlur";
import { Symbol, Touch } from "../components/ui/Touch";
import { useScene } from "../hooks/useScene";
import { ZestBackdrop } from "../components/Backdrop";
import { Lemon } from "../components/Lemon";
import { ZestComposer } from "../components/Composer";
import { CalorieCalendar } from "../components/Calendar";
import { MealEditor, type EditRequest } from "../components/MealEditor";
import { useDiary } from "../state/useDiary";
import {
  answerAbout,
  dayKey,
  intakeMood,
  totalOn,
  sampleEstimates,
  type Meal,
  type MealPhoto,
  type MealType,
} from "../data/diary";
import { theme } from "../theme";
import { MealPhotosProvider } from "../data/photos";
import { DemoCamera } from "../components/DemoCamera";
import { ZestChatScroll } from "../components/ChatScroll";
import { CHOICE_RETIRE_MS } from "../components/MealReply";

import { ChatTurn } from "../components/ChatTurn";
import type { Turn } from "../data/conversation";

let eventSequence = 0;
/** Called by event handlers; the sequence also distinguishes rapid attachments. */
function eventId(prefix: string) {
  return `${prefix}-${Date.now()}-${++eventSequence}`;
}
export function ZestScreen({
  demo = false,
  displayName = "Jaimin",
}: {
  demo?: boolean;
  displayName?: string;
}) {
  const scene = useScene();
  const meals = useDiary((s) => s.meals);
  const guide = useDiary((s) => s.guide);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [calendar, setCalendar] = useState(false);
  const [photoMenu, setPhotoMenu] = useState(false);
  const [sampleCamera, setSampleCamera] = useState(false);
  const [editor, setEditor] = useState<EditRequest | null>(null);
  const [focused, setFocused] = useState(false);
  const [inputHeight, setInputHeight] = useState(108);
  const [conversation, setConversation] = useState(0);
  const generation = useRef(0);
  const [busy, setBusy] = useState(false);
  const active = useRef(false);
  const pending = useRef<ReturnType<typeof setTimeout>[]>([]);
  const list = useRef<FlashListRef<Turn>>(null);
  const touching = useRef(false);
  const touches = useRef(0);
  const hasTurns = turns.length > 0;
  const {
    pick,
    perch,
    dockY,
    composerHeight,
    energy,
    mood,
    release,
    expression,
  } = scene;
  const clearTimers = useCallback(() => {
    pending.current.forEach(clearTimeout);
    pending.current = [];
  }, []);
  useEffect(() => clearTimers, [clearTimers]);
  useEffect(() => {
    if (demo) useDiary.getState().seedDemo();
  }, [demo]);
  useEffect(() => {
    if (!calendar)
      expression.set(
        withTiming(intakeMood(totalOn(meals, dayKey()), guide), {
          duration: 220,
        }),
      );
  }, [calendar, meals, guide, expression]);
  const later = (fn: () => void, ms: number) => {
    pending.current.push(setTimeout(fn, ms));
  };
  // A single native scroll follows measured content changes. No delayed
  // scrollToEnd calls compete with keyboard-controlled content insets.
  const followContent = () => {
    if (!touching.current && !KeyboardController.isVisible())
      list.current
        ?.getNativeScrollRef()
        ?.scrollToEnd({ animated: !scene.reduced });
  };
  useEffect(() => {
    const show = KeyboardEvents.addListener("keyboardDidShow", () =>
      setFocused(true),
    );
    const hide = KeyboardEvents.addListener("keyboardDidHide", () =>
      setFocused(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  const activity = (value: boolean) => {
    active.current = value;
    setBusy(value);
  };
  useEffect(() => {
    perch.set(
      withSpring(hasTurns ? 1 : 0, { damping: 25, stiffness: 170, mass: 0.95 }),
    );
  }, [hasTurns, perch]);
  useEffect(() => {
    mood.set(busy ? 2 : focused ? 1 : 0);
    energy.set(withTiming(busy ? 0.65 : 0, { duration: busy ? 850 : 220 }));
    if (!busy) release.set(withTiming(1, { duration: 650 }));
    else release.set(0);
  }, [busy, focused, energy, mood, release]);
  const openCalendar = () => {
    Keyboard.dismiss();
    setPhotoMenu(false);
    setCalendar(true);
    pick.set(withSpring(1, { damping: 26, stiffness: 180, mass: 0.9 }));
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  const closeCalendar = () => {
    // Preserve the native sheet tree until it has left the screen. React
    // unmounts/accessibility updates must not compete with the exit animation.
    pick.set(
      withSpring(0, { damping: 27, stiffness: 230, mass: 0.85 }, (finished) => {
        if (finished) scheduleOnRN(setCalendar, false);
      }),
    );
  };
  const dock = useAnimatedStyle(() => ({
    transform: [
      {
        translateY:
          dockY.get() + pick.get() * (composerHeight.get() + scene.bottom + 45),
      },
    ],
  }));
  const transcript = useAnimatedStyle(() => ({
    flex: 1,
    opacity: 1 - pick.get() * 0.82,
  }));
  const greeting = useAnimatedStyle(() => ({
    opacity:
      hasTurns || focused
        ? 0
        : 1 - Math.min(1, pick.get() * 2 + scene.keyboardProgress.get() * 2),
    transform: [{ translateY: -scene.keyboardProgress.get() * 90 }],
  }));
  const showPhotoMenu = () => {
    Keyboard.dismiss();
    setPhotoMenu((old) => !old);
  };
  const attach = (photo: MealPhoto) => {
    if (active.current) return;
    Keyboard.dismiss();
    setPhotoMenu(false);
    activity(true);
    const id = eventId("photo");
    setTurns((old) => [
      ...old,
      { id, role: "user", kind: "photo", photo },
      {
        id: `${id}-question`,
        role: "assistant",
        kind: "question",
        photo,
        state: "thinking",
      },
    ]);
    later(() => {
      list.current?.prepareForLayoutAnimationRender();
      setTurns((old) =>
        old.map((turn) =>
          turn.id === `${id}-question`
            ? {
                ...turn,
                state: "choosing",
                text:
                  photo.asset === "dinner"
                    ? "For dinner?"
                    : photo.asset === "lunch"
                      ? "For lunch?"
                      : photo.asset === "breakfast"
                        ? "For breakfast?"
                        : "Which meal?",
              }
            : turn,
        ),
      );
      activity(false);
    }, 900);
  };
  const choosePhoto = async (camera: boolean) => {
    setPhotoMenu(false);
    Keyboard.dismiss();
    try {
      if (camera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            "Camera access",
            "Allow camera access in Settings, or choose a photo from your library.",
            [
              { text: "Not now", style: "cancel" },
              {
                text: "Open Settings",
                onPress: () => void Linking.openSettings(),
              },
            ],
          );
          return;
        }
      }
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.85,
      };
      const result = camera
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      const source = new File(asset.uri);
      const extension = asset.uri.split(".").pop()?.split("?")[0] || "jpg";
      const local = new File(
        Paths.document,
        `${eventId("zest-meal")}.${extension}`,
      );
      source.copy(local);
      attach({ uri: local.uri, sample: false });
    } catch {
      Alert.alert(
        camera ? "Camera unavailable" : "Photo unavailable",
        camera
          ? "Choose a meal from your photo library on this device."
          : "That photo couldn’t be opened. Try another one.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Photo library", onPress: () => void choosePhoto(false) },
        ],
      );
    }
  };
  const editMeal = (meal: Meal) =>
    setEditor({
      name: meal.name,
      meal,
      kcal: meal.kcal,
      onSave: (name, kcal) => useDiary.getState().edit(meal.id, { name, kcal }),
      onDelete: () => useDiary.getState().remove(meal.id),
    });
  const chooseType = (turn: Turn, type: MealType) => {
    if (active.current || turn.state !== "choosing") return;
    const complete = (name: string, kcal: number) => {
      activity(true);
      const meal: Meal = {
        id: `meal-${turn.id}`,
        date: dayKey(),
        name,
        kcal,
        type,
        photo: turn.photo,
        protein: turn.photo?.sample
          ? sampleEstimates[turn.photo.asset ?? "breakfast"].protein
          : undefined,
        time:
          demo && turn.photo?.sample
            ? "9:41 PM"
            : new Date().toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              }),
      };
      // Retire the choices before introducing the receipt. Its photo then
      // stays mounted while the estimate arrives in short visual chunks.
      const replyId = turn.id;
      setTurns((old) =>
        old.map((item) =>
          item.id === replyId
            ? {
                ...item,
                mealId: meal.id,
                pendingMeal: meal,
                state: "confirming",
              }
            : item,
        ),
      );
      later(() => {
        setTurns((old) =>
          old.map((item) =>
            item.id === replyId
              ? { ...item, kind: "meal", state: "thinking" }
              : item,
          ),
        );
      }, CHOICE_RETIRE_MS);
      later(() => {
        useDiary.getState().add(meal);
        setTurns((old) =>
          old.map((item) =>
            item.id === replyId ? { ...item, state: "complete" } : item,
          ),
        );
        activity(false);
        scene.hop.set(
          withSequence(
            withTiming(0.3, { duration: 130 }),
            withTiming(0, { duration: 210 }),
          ),
        );
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      }, CHOICE_RETIRE_MS + 500);
    };
    if (turn.photo?.sample) {
      const estimate = sampleEstimates[turn.photo.asset ?? "breakfast"];
      complete(estimate.name, estimate.kcal);
    } else setEditor({ name: "", onSave: complete });
  };
  const send = async (question: string) => {
    if (active.current || !question.trim()) return false;
    active.current = true;
    const current = generation.current;
    // Let UIKit finish the keyboard transition before inserting messages or
    // clearing the field. These layout changes must not interrupt its travel.
    await KeyboardController.dismiss();
    if (current !== generation.current) return false;
    setPhotoMenu(false);
    activity(true);
    const id = eventId("answer");
    const diary = useDiary.getState();
    const answer = answerAbout(question, diary.meals, diary.guide);
    setTurns((old) => [
      ...old,
      { id: `${id}-prompt`, role: "user", kind: "text", text: question },
      { id, role: "assistant", kind: "text", state: "thinking", text: "" },
    ]);
    later(() => {
      setTurns((old) =>
        old.map((item) =>
          item.id === id
            ? {
                ...item,
                state: "complete",
                answer,
                text: [
                  answer.value && `${answer.value} ${answer.unit}`,
                  answer.caption,
                  answer.detail,
                ]
                  .filter(Boolean)
                  .join(". "),
              }
            : item,
        ),
      );
      activity(false);
    }, 620);
    return true;
  };
  const stop = () => {
    clearTimers();
    activity(false);
    setTurns((old) =>
      old.map((turn) =>
        turn.state === "thinking" || turn.state === "confirming"
          ? {
              ...turn,
              kind: turn.photo ? "question" : turn.kind,
              state: turn.photo ? "choosing" : "stopped",
              text: turn.photo ? "Which meal was this?" : turn.text,
            }
          : turn,
      ),
    );
  };
  const fresh = () => {
    generation.current += 1;
    setConversation((old) => old + 1);
    clearTimers();
    activity(false);
    Keyboard.dismiss();
    setTurns([]);
    setPhotoMenu(false);
    setSampleCamera(false);
    closeCalendar();
  };
  const look = (x: number, y: number) => {
    scene.touchX.set(x);
    scene.touchY.set(y);
    scene.touched.set(++touches.current);
  };
  return (
    <MealPhotosProvider>
      <GlassThemeProvider value={theme}>
        <View
          style={{ flex: 1, backgroundColor: theme.paper }}
          onTouchStart={(e) => look(e.nativeEvent.pageX, e.nativeEvent.pageY)}
          onTouchMove={(e) => look(e.nativeEvent.pageX, e.nativeEvent.pageY)}
        >
          <ZestBackdrop scene={scene} />
          <Animated.View
            style={transcript}
            accessibilityElementsHidden={calendar}
            importantForAccessibility={
              calendar ? "no-hide-descendants" : "auto"
            }
          >
            <FlashList
              ref={list}
              renderScrollComponent={ZestChatScroll}
              data={turns}
              extraData={meals}
              keyExtractor={(turn) => turn.id}
              keyboardDismissMode="interactive"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              maintainVisibleContentPosition={{ disabled: true }}
              onContentSizeChange={followContent}
              onScrollBeginDrag={() => {
                touching.current = true;
              }}
              onScrollEndDrag={() => {
                touching.current = false;
              }}
              onMomentumScrollEnd={() => {
                touching.current = false;
              }}
              contentContainerStyle={{
                paddingTop: scene.top + 78,
                paddingHorizontal: 24,
                paddingBottom: Math.max(scene.bottom + 178, inputHeight + 112),
              }}
              renderItem={({ item: turn }) => (
                <ChatTurn
                  turn={turn}
                  meals={meals}
                  guide={guide}
                  reduced={scene.reduced}
                  onChoose={chooseType}
                  onEdit={editMeal}
                  onCalendar={openCalendar}
                />
              )}
            />
          </Animated.View>
          <ProgressiveBlur
            edge="top"
            height={scene.top + 66}
            color={theme.paper}
          />
          <View
            accessibilityElementsHidden={calendar}
            style={{
              position: "absolute",
              top: scene.top,
              left: 18,
              right: 18,
              height: 44,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ width: 44 }} pointerEvents="none" />
            <View style={{ alignItems: "center" }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  letterSpacing: -0.35,
                  color: theme.ink,
                }}
              >
                Zest
              </Text>
            </View>
            <GlassButton
              name="square.and.pencil"
              label="New Zest conversation"
              onPress={fresh}
            />
          </View>
          <Animated.View
            pointerEvents={
              !hasTurns && !focused && !calendar ? "box-none" : "none"
            }
            accessibilityElementsHidden={hasTurns || focused || calendar}
            style={[
              {
                position: "absolute",
                top: scene.height * 0.495,
                left: 24,
                right: 24,
                alignItems: "center",
              },
              greeting,
            ]}
          >
            <Text
              accessibilityRole="header"
              style={{
                fontSize: 32,
                lineHeight: 37,
                fontWeight: "500",
                letterSpacing: -1.15,
                textAlign: "center",
                color: theme.ink,
              }}
            >
              Good evening,{"\n"}
              {displayName}.
            </Text>

            <Touch
              label="Log a meal"
              onPress={showPhotoMenu}
              expand
              style={{ marginTop: 28 }}
            >
              <GlassSurface
                interactive
                style={{
                  height: 48,
                  borderRadius: 24,
                  flexDirection: "row",
                  gap: 9,
                  paddingHorizontal: 21,
                  alignItems: "center",
                }}
              >
                <Symbol name="camera" size={17} color={theme.ink} />
                <Text
                  style={{ fontSize: 15, fontWeight: "500", color: theme.ink }}
                >
                  Log a meal
                </Text>
              </GlassSurface>
            </Touch>
          </Animated.View>
          <Animated.View
            pointerEvents={calendar ? "none" : "box-none"}
            accessibilityElementsHidden={calendar}
            style={[
              {
                position: "absolute",
                left: 0,
                right: 0,
                bottom: scene.bottom,
                alignItems: "center",
              },
              dock,
            ]}
          >
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: -scene.bottom,
              }}
            >
              <ProgressiveBlur
                edge="bottom"
                height={148 + scene.bottom}
                color={theme.paper}
              />
            </View>
            <ZestComposer
              key={conversation}
              scene={scene}
              busy={busy}
              onSend={send}
              onStop={stop}
              onPhoto={showPhotoMenu}
              onCalendar={openCalendar}
              onHeight={setInputHeight}
            />
          </Animated.View>
          <CalorieCalendar
            scene={scene}
            open={calendar}
            meals={meals}
            guide={guide}
            onClose={closeCalendar}
            onAdd={() => {
              closeCalendar();
              setPhotoMenu(true);
            }}
            onEdit={editMeal}
            onGuide={() =>
              setEditor({
                name: "Daily guide",
                kcal: guide,
                guide: true,
                onSave: (_name, kcal) => useDiary.getState().setGuide(kcal),
              })
            }
          />
          <Lemon
            scene={scene}
            calendarOpen={calendar}
            onPress={calendar ? closeCalendar : openCalendar}
          />
          {photoMenu && (
            <View style={{ position: "absolute", inset: 0, zIndex: 50 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Dismiss photo menu"
                onPress={() => setPhotoMenu(false)}
                style={{ position: "absolute", inset: 0 }}
              />
              <GlassSurface
                interactive
                style={{
                  position: "absolute",
                  left: 24,
                  bottom: scene.bottom + 72,
                  width: 232,
                  borderRadius: 28,
                  paddingVertical: 8,
                }}
              >
                {[
                  {
                    label: "Take a photo",
                    icon: "camera" as const,
                    mode: "camera",
                  },
                  {
                    label: "Photo library",
                    icon: "photo" as const,
                    mode: "library",
                  },
                  {
                    label: "Try a sample meal",
                    icon: "fork.knife" as const,
                    mode: "sample",
                  },
                ].map((item) => (
                  <Touch
                    key={item.label}
                    label={item.label}
                    onPress={() => {
                      if (
                        item.mode === "sample" ||
                        (demo && item.mode === "camera")
                      ) {
                        setPhotoMenu(false);
                        setSampleCamera(true);
                      } else void choosePhoto(item.mode === "camera");
                    }}
                    style={{
                      height: 52,
                      paddingHorizontal: 19,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 13,
                    }}
                  >
                    <Symbol name={item.icon} size={18} color={theme.ink} />
                    <Text style={{ fontSize: 16, color: theme.ink }}>
                      {item.label}
                    </Text>
                  </Touch>
                ))}
              </GlassSurface>
            </View>
          )}
          {sampleCamera && (
            <DemoCamera
              onClose={() => setSampleCamera(false)}
              onUse={(photo) => {
                setSampleCamera(false);
                attach(photo);
              }}
              onLibrary={() => {
                setSampleCamera(false);
                later(() => {
                  void choosePhoto(false);
                }, 400);
              }}
            />
          )}
          {editor && (
            <MealEditor request={editor} onClose={() => setEditor(null)} />
          )}
        </View>
      </GlassThemeProvider>
    </MealPhotosProvider>
  );
}

/** UI-thread gaze, tilt, keyboard and planted-feet motion for the Zest scene. */
import { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  SensorType,
  useAnimatedSensor,
  useDerivedValue,
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";
import { useReanimatedKeyboardAnimation } from "react-native-keyboard-controller";
import { leaning } from "../motion/tilt";

/**
 * The companion is drawn in a square, at one size for each place it can stand
 * so that it is sharp in all three. Its feet rest `feet` of the way down.
 */
export const FIGURE = { hero: 232, card: 116, perch: 84, feet: 218 / 232 };
/** Those sizes as a share of the largest; the scene works in these. */
export const SCALE = {
  hero: 1,
  card: FIGURE.card / FIGURE.hero,
  perch: FIGURE.perch / FIGURE.hero,
};
/** Where the feet are inside a drawing of the given size, on whole points. */
export function feetIn(size: number): [number, number] {
  "worklet";
  return [size / 2, Math.round(size * FIGURE.feet)];
}
/** Keyboard clearance, as in the first study. */
export const KEYBOARD_GAP = 12;

export type Scene = {
  width: number;
  height: number;
  top: number;
  bottom: number;
  reduced: boolean;
  keyboardHeight: SharedValue<number>;
  keyboardProgress: SharedValue<number>;
  /** Vertical travel of the composer dock as the keyboard moves. */
  dockY: SharedValue<number>;
  composerWidth: SharedValue<number>;
  composerHeight: SharedValue<number>;
  /** 0 standing in the middle of an empty page, 1 perched on the composer. */
  perch: SharedValue<number>;
  /** 0 closed, 1 the calendar is open. */
  pick: SharedValue<number>;
  /** Last touch on the page; `touched` changes with every one. */
  touchX: SharedValue<number>;
  touchY: SharedValue<number>;
  touched: SharedValue<number>;
  /** 0..1 charge while a reply is on its way; `release` fires as it arrives. */
  energy: SharedValue<number>;
  release: SharedValue<number>;
  /** Accumulated turns of the charge, so speed changes never jump. */
  spin: SharedValue<number>;
  /** A short pulse on every keystroke. */
  typing: SharedValue<number>;
  /** 0 idle, 1 composing, 2 thinking, 3 reading the reply out. */
  mood: SharedValue<number>;
  /** -1 curious, 0 content, 1 a playful raised eyebrow. */
  expression: SharedValue<number>;
  /**
   * Where the companion is looking, -1..1, +x right and +y down the screen.
   * The eyes get there first, the head follows, and the body leans last.
   */
  gazeX: SharedValue<number>;
  gazeY: SharedValue<number>;
  headX: SharedValue<number>;
  headY: SharedValue<number>;
  bodyX: SharedValue<number>;
  /** A hop: 0 on the ground, peaks mid-air. */
  hop: SharedValue<number>;
  /** Resting geometry while the calendar is closed. */
  restX: SharedValue<number>;
  restY: SharedValue<number>;
  restFigure: SharedValue<number>;
  /** Where its feet are right now, and its size as a share of the largest. */
  feetX: SharedValue<number>;
  feetY: SharedValue<number>;
  figure: SharedValue<number>;
};

/**
 * Eases a value toward its target and lands on it exactly once it is within
 * `slack`, so that a settled value stops changing and stops causing redraws.
 */
function approach(value: number, target: number, rate: number, slack: number) {
  "worklet";
  const next = value + (target - value) * rate;
  return Math.abs(target - next) < slack ? target : next;
}

/** Where the lemon stands above the calendar sheet. */
export function cardFloor(height: number) {
  "worklet";
  return Math.max(180, height - 616) + 3;
}

/**
 * One clock and one set of shared values for the whole screen. Everything
 * that moves reads from here on the UI thread; nothing crosses to JS per frame.
 */
export function useScene(): Scene {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  // Use the provider's iOS start-event values. UIKit animates this target
  // alongside the keyboard; per-frame transforms fight that native animation.
  const nativeKeyboard = useReanimatedKeyboardAnimation();
  const keyboardHeight = useDerivedValue(() => -nativeKeyboard.height.get());
  const keyboard = {
    height: keyboardHeight,
    progress: nativeKeyboard.progress,
  };
  const bottom = insets.bottom + 2;
  const dockY = useDerivedValue(
    () =>
      -keyboard.height.get() +
      (bottom - KEYBOARD_GAP) * keyboard.progress.get(),
  );
  const composerWidth = useSharedValue(width - 32);
  const composerHeight = useSharedValue(108);
  const perch = useSharedValue(0);
  const pick = useSharedValue(0);
  const touchX = useSharedValue(width / 2);
  const touchY = useSharedValue(height / 2);
  const touched = useSharedValue(0);
  const noticed = useSharedValue(0);
  const touchAt = useSharedValue(-10);
  const energy = useSharedValue(0);
  const release = useSharedValue(0);
  const spin = useSharedValue(0);
  const typing = useSharedValue(0);
  const mood = useSharedValue(0);
  const expression = useSharedValue(0);
  const time = useSharedValue(0);
  const gazeX = useSharedValue(0);
  const gazeY = useSharedValue(0);
  const headX = useSharedValue(0);
  const headY = useSharedValue(0);
  const bodyX = useSharedValue(0);
  const hop = useSharedValue(0);
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);
  const levelX = useSharedValue(0);
  const levelY = useSharedValue(0);
  const seeded = useSharedValue(0);

  // Which way is down, in the phone's own frame: x toward its right edge, y
  // toward its top. The simulator has no such sensor and reads zero throughout.
  const gravity = useAnimatedSensor(SensorType.GRAVITY, { interval: "auto" });
  // Turn rate, so a quick movement of the phone carries the gaze with it.
  const turning = useAnimatedSensor(SensorType.GYROSCOPE, { interval: "auto" });
  const swayX = useSharedValue(0);
  const swayY = useSharedValue(0);

  const heroFeetY = top(insets.top, height);
  const restX = useDerivedValue(() => {
    const perched = width / 2 + composerWidth.get() / 2 - 36;
    return width / 2 + (perched - width / 2) * perch.get();
  });
  const restY = useDerivedValue(() => {
    const standing = heroFeetY - 112 * keyboard.progress.get();
    // On the composer its feet rest just inside the top edge of the glass.
    const perched = height - bottom - composerHeight.get() + dockY.get() + 3;
    return standing + (perched - standing) * perch.get();
  });
  const restFigure = useDerivedValue(() => {
    const standing = SCALE.hero * (1 - 0.3 * keyboard.progress.get());
    return standing + (SCALE.perch - standing) * perch.get();
  });
  const feetX = useDerivedValue(() => {
    const card = width - 80;
    return restX.get() + (card - restX.get()) * pick.get();
  });
  const feetY = useDerivedValue(
    () => restY.get() + (cardFloor(height) - restY.get()) * pick.get(),
  );
  const figure = useDerivedValue(
    () => restFigure.get() + (SCALE.card - restFigure.get()) * pick.get(),
  );

  useFrameCallback((frame) => {
    "worklet";
    const dt = Math.min(64, frame.timeSincePreviousFrame ?? 16) / 1000;
    const now = time.get() + dt;
    time.set(now);
    const charge = energy.get();
    // The charge spins up like a motor: speed follows energy, phase never
    // jumps. With no charge it holds still, so an idle page redraws nothing.
    if (charge > 0 && !reduced)
      spin.set(spin.get() + dt * (0.07 + 2.4 * charge * charge));
    typing.set(Math.max(0, typing.get() - dt * 3.2));

    // The gaze leans toward whichever edge of the phone is lowered. A reading
    // of zero means no reading yet, so the first real one sets the level.
    const down = gravity.sensor.get();
    const pull = Math.hypot(down.x, down.y, down.z);
    if (pull > 1) {
      const lean = leaning(
        down.x / pull,
        down.y / pull,
        seeded.get() === 0 ? down.x / pull : levelX.get(),
        seeded.get() === 0 ? down.y / pull : levelY.get(),
        dt,
      );
      seeded.set(1);
      levelX.set(lean.levelX);
      levelY.set(lean.levelY);
      tiltX.set(lean.x);
      tiltY.set(lean.y);
    }

    const rate = turning.sensor.get();
    const follow = 1 - Math.exp(-dt / 0.18);
    const pushX = Math.max(-0.6, Math.min(0.6, rate.y * 0.2));
    const pushY = Math.max(-0.6, Math.min(0.6, -rate.x * 0.2));
    swayX.set(swayX.get() + (pushX - swayX.get()) * follow);
    swayY.set(swayY.get() + (pushY - swayY.get()) * follow);

    // Where to look: a recent touch wins, then the task at hand, then tilt and
    // drift. Worked out with +y up, as one would describe it.
    if (touched.get() !== noticed.get()) {
      noticed.set(touched.get());
      touchAt.set(now);
    }
    const since = now - touchAt.get();
    const attention = since < 1.3 ? 1 : Math.max(0, 1 - (since - 1.3) / 0.9);
    const size = figure.get() * FIGURE.hero;
    const faceX = feetX.get();
    const faceY = feetY.get() - size * 0.55;
    const dx = (touchX.get() - faceX) / 190;
    const dy = -(touchY.get() - faceY) / 190;
    const reach = Math.max(1, Math.hypot(dx, dy));
    const state = mood.get();
    const busyX = state === 2 ? 0.3 : state === 3 ? -0.55 : 0;
    const busyY = state === 2 ? 0.62 : state === 3 ? 0.42 : 0;
    const composing = typing.get();
    // Left alone it glances somewhere now and then and holds, as eyes do.
    // Holding still matters: whatever moves every frame is redrawn every frame.
    const beat = Math.floor(now / 6);
    const a = Math.sin(beat * 12.9898) * 43758.5453;
    const b = Math.sin(beat * 78.233) * 24634.6345;
    const driftX = beat === 0 ? 0 : (a - Math.floor(a) - 0.5) * 0.5;
    const driftY = beat === 0 ? 0 : (b - Math.floor(b) - 0.5) * 0.2;
    const open = 0; // The lemon keeps following touches while the calendar is open.
    const calm = (1 - attention) * (1 - open);
    let tx =
      (dx / reach) * attention * (1 - open) +
      calm *
        (busyX +
          tiltX.get() * 0.8 +
          swayX.get() +
          driftX * (state === 0 ? 1 : 0.3)) -
      calm * composing * 0.35 * perch.get();
    let ty =
      (dy / reach) * attention * (1 - open) +
      calm * (busyY + tiltY.get() * 0.8 + swayY.get() + driftY) -
      calm * composing * 0.5 * (1 - perch.get());
    if (reduced) {
      tx = 0;
      ty = 0;
    }
    // In steps too fine to see, so that sensor noise does not move the target.
    tx = Math.round(Math.max(-1, Math.min(1, tx)) * 128) / 128;
    ty = Math.round(Math.max(-1, Math.min(1, ty)) * 128) / 128;
    // The eyes notice first, the neck turns next, and the lean arrives last;
    // all three are quicker for a touch than for an idle wander.
    const quick = attention > 0.5;
    const eyes = 1 - Math.exp(-dt / (quick ? 0.045 : 0.16));
    const neck = 1 - Math.exp(-dt / (quick ? 0.12 : 0.3));
    const lean = 1 - Math.exp(-dt / (quick ? 0.22 : 0.45));
    gazeX.set(approach(gazeX.get(), tx, eyes, 0.004));
    gazeY.set(approach(gazeY.get(), -ty, eyes, 0.004));
    headX.set(approach(headX.get(), tx, neck, 0.004));
    headY.set(approach(headY.get(), -ty, neck, 0.004));
    bodyX.set(approach(bodyX.get(), tx, lean, 0.01));
  });

  return useMemo(
    () => ({
      width,
      height,
      top: insets.top,
      bottom,
      reduced,
      keyboardHeight: keyboard.height,
      keyboardProgress: keyboard.progress,
      dockY,
      composerWidth,
      composerHeight,
      perch,
      pick,
      touchX,
      touchY,
      touched,
      energy,
      release,
      spin,
      typing,
      mood,
      expression,
      gazeX,
      gazeY,
      headX,
      headY,
      bodyX,
      hop,
      restX,
      restY,
      restFigure,
      feetX,
      feetY,
      figure,
    }),
    // Shared values are stable for the life of the screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [width, height, insets.top, bottom, reduced],
  );
}

/** Ground line for a companion standing in the middle of an empty page. */
function top(inset: number, height: number) {
  return Math.max(inset + 258, height * 0.455);
}

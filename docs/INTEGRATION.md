# Integration

`src/app/index.tsx` mounts `ZestScreen` directly. The sole route accepts `demo=1`; this remounts the screen and resets its local diary to sample data. Any other value leaves the stored diary alone. There is no chat-collection route or root back action.

## Native providers and identity

Use GestureHandlerRootView, SafeAreaProvider, and KeyboardProvider from `_layout.tsx`. Keep native builds: the SwiftUI buttons and keyboard controller need their native modules. Change `name`, `slug`, `scheme`, and `ios.bundleIdentifier` in `app.json` before distributing your app. Pass a `displayName` prop to change the greeting without editing the illustration or diary logic.

## Data and service boundary

- `data/diary.ts` owns local dates, calendar cells, sample meal values and deterministic answers about today, yesterday, the last seven days, meal categories, protein and the guide.
- `state/diaryStore.ts` creates an isolated Zustand store using an injected StateStorage. `state/useDiary.ts` supplies the Expo FileSystem adapter and selective React subscriptions.
- The file contains only meals and guide, not live conversation state. Starting a new conversation retains the diary. Ordinary launch does not invent meals.
- Imported photos are copied into Documents before attaching. They require manual names and calories. There is no fabricated image analysis or protein estimate for user photos.
- Deleting a meal removes its diary entry. The copied image file currently remains until app data is cleared; add an explicit orphan-file cleanup policy before deploying a production tracker.

To add image recognition, replace the sample estimate boundary in `ZestScreen`, then preserve cancellation, duplicate-confirmation prevention and meal/photo identity. To add a language model, replace the `answerAbout` call while retaining the measured reply container and keyboard sequencing. Add network failure/retry behavior and your own privacy/retention design alongside that integration.

## Customize the visuals

The palette lives in `theme.ts`, image declarations in `data/photos.ts`, and original SVGs under `assets/cookbooks/zest/stickers/`. Lemon anatomy is in `components/Lemon.tsx`; its shared position/gaze values live in `hooks/useScene.ts`. Backdrop color triples are in `components/Backdrop.tsx`, with its shader in `motion/backdropShader.ts`.

Keep native glass surfaces transparent. They must not inherit `opacity < 1`, masks, clipping, or opaque decorative fills. Progressive blur masks are siblings of the material. SwiftUI `buttonStyle("glass")` owns circular icon press highlights; `Touch` owns the movable sticker/compound-control gesture.

## Accessibility and compatibility

All actions have accessibility labels. Reduce Transparency selects plain surfaces. Reduce Motion removes gaze drift, blinking, hop presentation and progressive travel where checked by the shared scene; native platform transitions remain under system control. The calendar supports large text with a scrollable layout. Check the actual native UI after changing type sizes or adding content.

The intended target is light-themed iPhone UI. Android/web and physical-camera, sensor, haptic and device frame-rate behavior have not been verified. The local answers support a limited English vocabulary; this is not a general assistant. No server, auth, EAS project, or environment variables are configured.

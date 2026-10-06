# Material and motion

Zest uses one shared scene on the UI thread. The lemon, composer, background and diary read the same values; a React state update does not drive every frame. Finished gaze values snap to rest so they stop causing redraws.

## Native glass

`components/ui/GlassSurface.tsx` renders `expo-glass-effect` GlassView when both API and material are available and Reduce Transparency is disabled. The system owns its rim, optics, shadow and interactive highlight. `GlassButton.tsx` hosts SwiftUI `buttonStyle("glass")` circular controls. Unsupported runtimes receive an opaque surface.

Build against an Apple SDK that provides Liquid Glass, run on a matching supported runtime, and retain `enableSceneSupport` in the Expo build-properties plugin. The approved material was verified with Xcode 27 and iOS 27. API availability on an older build/runtime is not proof of equivalent optics. Rebuild native code after changing SDK/config; Metro refresh cannot change the linked SDK or Info.plist.

Do not put alpha animation, a mask, a clipped decorative container or a painted surface behind/over the native material. Its blur and color response depend on the actual content behind it. The diary's fixed BlurView fades in a separate sibling; changing blur intensity every frame previously recreated UIKit's animator and interrupted travel.

## Chat flow

| Phase | Presentation |
| --- | --- |
| Attach | One photo identity enters the user bubble; a small visual thinking cue precedes meal selection. |
| Choices | The stable bubble grows over 280 ms; four glass sticker tiles form with an 85 ms stagger. Short copy arrives in 65 ms word chunks. |
| Confirm | Choice material retires over 190 ms. The same bubble and photo become the receipt; a 500 ms visual wait precedes the saved value. |
| Receipt | Photo remains mounted. Name, large number, unit, short comment and diary action reveal at 0/100/210/300/460 ms. |
| Diary answer | A 620 ms local wait yields a whole visual answer with a sticker and large value. No long typewriter paragraph. |
| Recycle | Already completed replies render immediately when revisited; old values do not stream again. |

A busy guard prevents repeated confirmation. Stop cancels pending callbacks; starting a new chat cancels pending work and clears the transcript while retaining saved diary data.

## Keyboard, calendar and character

The composer begins at 108 points and grows with measured text up to its supported limit. Keyboard Controller supplies native keyboard animation geometry with **12 points of clearance**. Sending awaits native keyboard dismissal before inserting messages or clearing the field. One measured content-size callback follows new replies; delayed scroll timers do not compete with keyboard insets.

The lemon moves from its centered welcome to the composer's edge, then to the diary's upper corner. Eyes notice touches first, the head follows, and the body leans last. The low warm light gathers beneath the glass while busy. Calendar opening retains its glass tree, and close removes accessibility only after its exit finishes.

A blank diary stays neutral. A small logged amount produces a curious expression, values within the guide stay content, and above-guide values produce a playful eyebrow. Copy stays supportive; the character does not prescribe compensation.

Reduce Motion suppresses gaze drift and blinking and removes the calendar's long travel. Hardware sensor and haptic response require a physical device. Native recordings are reviewed at normal speed and in consecutive frames; an encoded 60 fps file alone is not hardware performance evidence.

import { forwardRef, type ComponentRef } from "react";
import type { ScrollViewProps } from "react-native";
import { KeyboardChatScrollView } from "react-native-keyboard-controller";

/** Keep the list viewport fixed; native content insets follow the keyboard.
 * Resizing FlashList on every keyboard frame triggers layout and delayed
 * scrollToEnd corrections that visibly jump behind the composer.
 */
export const ZestChatScroll = forwardRef<
  ComponentRef<typeof KeyboardChatScrollView>,
  ScrollViewProps &
    Pick<
      React.ComponentProps<typeof KeyboardChatScrollView>,
      "extraContentPadding" | "freeze" | "keyboardLiftBehavior" | "offset"
    >
>(function ZestChatScroll(props, ref) {
  return (
    <KeyboardChatScrollView
      keyboardLiftBehavior="whenAtEnd"
      {...props}
      ref={ref}
      automaticallyAdjustContentInsets={false}
      contentInsetAdjustmentBehavior="never"
    />
  );
});

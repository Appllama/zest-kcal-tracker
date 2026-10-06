import { Button, Host, Image } from "@expo/ui/swift-ui";
import {
  accessibilityLabel,
  buttonBorderShape,
  buttonStyle,
  controlSize,
  foregroundStyle,
  frame,
} from "@expo/ui/swift-ui/modifiers";
import * as Haptics from "expo-haptics";
import { Symbol, Touch } from "./Touch";
import { GlassSurface, useGlassTheme, useNativeGlass } from "./GlassSurface";

type Icon = NonNullable<React.ComponentProps<typeof Button>["systemImage"]>;

/**
 * A round control that is the system's own glass button, so the press, the
 * highlight and the release are the platform's and not an imitation of them.
 */
export function GlassButton({
  name,
  label,
  onPress,
  size = 44,
}: {
  name: Icon;
  label: string;
  onPress: () => void;
  size?: number;
}) {
  const theme = useGlassTheme();
  const native = useNativeGlass();
  if (native)
    return (
      <Host
        colorScheme="light"
        ignoreSafeArea="all"
        style={{ width: size, height: size, overflow: "visible" }}
      >
        <Button
          onPress={() => {
            void Haptics.selectionAsync();
            onPress();
          }}
          modifiers={[
            buttonStyle("glass"),
            buttonBorderShape("circle"),
            controlSize("large"),
            accessibilityLabel(label),
            foregroundStyle(theme.ink),
          ]}
        >
          <Image
            systemName={name}
            size={18}
            modifiers={[frame({ width: size - 30, height: size - 30 })]}
          />
        </Button>
      </Host>
    );
  return (
    <Touch label={label} onPress={onPress} expand>
      <GlassSurface
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Symbol name={name} size={20} color={theme.ink} />
      </GlassSurface>
    </Touch>
  );
}

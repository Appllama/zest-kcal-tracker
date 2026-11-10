import {
  BottomSheet,
  Button,
  Group,
  Host,
  HStack,
  Image as SwiftImage,
  ScrollView,
  Spacer,
  Divider as ViewDivider,
  Text,
  TextField,
  VStack,
} from "@expo/ui/swift-ui";
import {
  accessibilityLabel,
  background,
  buttonStyle,
  cornerRadius,
  contentShape,
  foregroundStyle,
  shapes,
  font,
  frame,
  padding,
  presentationDetents,
  presentationDragIndicator,
  scrollEdgeEffectStyle,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Pressable,
  ScrollView as NativeScroll,
  StyleSheet,
  Text as NativeText,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Symbol } from "../cookbooks/zest/components/ui/Touch";
import { GlassSurface } from "../cookbooks/zest/components/ui/GlassSurface";
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  useAnimatedReaction,
  useDerivedValue,
  type SharedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { selectionAsync } from "expo-haptics";
import { scheduleOnRN } from "react-native-worklets";

const quick = ["👍", "❤️", "😂", "😮", "🙏"];
const railEmojis = [...quick, "😢", "🔥", "👏", "✨", "🎉"];
const catalog = [
  [
    "Rostos e pessoas",
    "😀|sorriso 😃|feliz 😄|alegria 😁|riso 😆|risada 😅|suor 😂|risada lágrimas 🤣|gargalhada 🙂|sorriso 🙃|invertido 😉|piscada 😊|feliz 😇|anjo 🥰|carinho 😍|apaixonado 🤩|estrelas 😘|beijo 😋|delícia 😛|língua 🤔|pensando 🤫|silêncio 🤐|segredo 😐|neutro 😒|tédio 🙄|olhos 😌|alívio 😴|sono 🤤|baba 😷|máscara 🤒|febre 🤢|enjoo 🤯|surpresa 😎|óculos 🥳|festa 😮|surpresa 😳|vergonha 🥺|súplica 😢|triste 😭|choro 😱|medo 😤|bufando 😠|raiva 😡|bravo 🤡|palhaço 👻|fantasma 👍|positivo 👎|negativo 👏|palmas 🙌|celebração 🙏|gratidão oração 🤝|acordo 💪|força 👋|oi ✌️|paz 🫶|amor",
  ],
  [
    "Animais e natureza",
    "🐶|cachorro 🐱|gato 🐭|rato 🐹|hamster 🐰|coelho 🦊|raposa 🐻|urso 🐼|panda 🐨|coala 🐯|tigre 🦁|leão 🐮|vaca 🐷|porco 🐸|sapo 🐵|macaco 🐔|galinha 🐧|pinguim 🦜|papagaio 🦋|borboleta 🐝|abelha 🐢|tartaruga 🐬|golfinho 🌵|cacto 🌿|folha 🌻|girassol 🌷|tulipa 🌹|rosa 🌞|sol 🌙|lua ⭐|estrela 🌈|arco-íris ☔|chuva ❄️|neve 🔥|fogo",
  ],
  [
    "Comida",
    "🍎|maçã 🍓|morango 🍌|banana 🍇|uva 🍉|melancia 🍒|cereja 🥑|abacate 🍅|tomate 🥕|cenoura 🍞|pão 🧀|queijo 🍕|pizza 🍔|hambúrguer 🍟|batata 🍣|sushi 🍝|macarrão 🍦|sorvete 🍰|bolo 🍫|chocolate 🍿|pipoca ☕|café 🍵|chá 🍺|cerveja 🍷|vinho 🧃|suco",
  ],
  [
    "Atividades e viagem",
    "⚽|futebol 🏀|basquete 🎾|tênis 🏐|vôlei 🏆|troféu 🏅|medalha 🎯|alvo 🎮|jogo 🎸|guitarra 🎤|microfone 🎨|arte 🎬|cinema 🎉|festa 🚗|carro 🚲|bicicleta 🚌|ônibus 🚆|trem ✈️|avião 🚀|foguete 🏖️|praia 🏕️|acampamento 🏠|casa 🗺️|mapa",
  ],
  [
    "Objetos e símbolos",
    "💡|ideia 📚|livros 📸|câmera 📱|celular 💻|computador 🎧|fone ⏰|relógio 🎁|presente 🔑|chave 💸|dinheiro 📝|nota 💬|conversa 📌|marcador ❤️|coração amor 🧡|coração laranja 💛|coração amarelo 💚|coração verde 💙|coração azul 💜|coração roxo 🤍|coração branco 🖤|coração preto 💔|coração partido 💕|corações ✨|brilho 💯|cem ✅|confirmado ❌|erro ❓|pergunta ⚠️|aviso ♻️|reciclagem",
  ],
  [
    "Bandeiras",
    "🇧🇷|brasil 🇵🇹|portugal 🇦🇷|argentina 🇺🇾|uruguai 🇨🇱|chile 🇲🇽|méxico 🇺🇸|estados unidos 🇨🇦|canadá 🇫🇷|frança 🇮🇹|itália 🇪🇸|espanha 🇩🇪|alemanha 🇬🇧|reino unido 🇯🇵|japão 🇰🇷|coreia 🏳️‍🌈|orgulho",
  ],
].map(([title, data]) => ({
  title,
  emojis: data.split(/ (?=\S+\|)/).map((item) => {
    const [emoji, name] = item.split("|");
    return { emoji, name };
  }),
}));
const normalize = (text: string) =>
  text
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
const searchable = catalog.flatMap(({ emojis }) => emojis);
let recent: string[] = [];

function EmojiButton({
  emoji,
  selected,
  width = 40,
  onPress,
}: {
  emoji: string;
  selected?: boolean;
  width?: number;
  onPress: () => void;
}) {
  return (
    <Button
      onPress={onPress}
      modifiers={[buttonStyle("plain"), accessibilityLabel(emoji)]}
    >
      <Text
        modifiers={[
          font({ size: 23 }),
          frame({ width, height: 40 }),
          background(selected ? "#F4D7D1" : "#00000000"),
          cornerRadius(20),
        ]}
      >
        {emoji}
      </Text>
    </Button>
  );
}

export type BubbleBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ContextPointer = {
  x: number;
  y: number;
  phase: "idle" | "moving" | "released";
};

const cell = 40;
const row = 44;
const reactionHeight = 50;
const actionsHeight = 140;
const gap = 8;

export function EntryActions({
  bounds,
  pointer,
  onClose,
  children,
  reaction,
  onReact,
  onContinue,
  onEdit,
  onDelete,
}: {
  bounds: BubbleBounds;
  pointer: SharedValue<ContextPointer>;
  onClose: () => void;
  children: ReactNode;
  reaction?: string;
  onReact: (emoji: string) => void;
  onContinue: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const source = bounds;
  const [sheetOpen, setSheetOpen] = useState(false);
  const pickedEmoji = useRef<string | undefined>(undefined);
  const closing = useRef(false);
  const pendingAction = useRef<(() => void) | undefined>(undefined);
  const phase = useSharedValue(0);
  useEffect(() => {
    phase.set(
      withTiming(1, { duration: 220, reduceMotion: ReduceMotion.System }),
    );
  }, [phase]);

  const minTop = insets.top + reactionHeight + gap * 2;
  const bottom = height - insets.bottom - actionsHeight - gap * 2;
  const previewHeight = Math.min(source.height, Math.max(48, bottom - minTop));
  const top = Math.max(minTop, Math.min(source.y, bottom - previewHeight));
  const right = Math.min(width - 10, source.x + source.width);
  const railWidth = Math.min(width - 24, 258);
  const menuWidth = Math.min(width - 24, 258);
  const railLeft = Math.max(12, right - railWidth);
  const railTop = top - reactionHeight - gap;
  const menuLeft = Math.max(12, right - menuWidth);
  const menuTop = top + previewHeight + gap;
  const railPadding = 7;
  const emojiViewport = railWidth - cell - 2 * railPadding;
  const railOffset = useSharedValue(0);
  const railScroll = useAnimatedScrollHandler(({ contentOffset }) => {
    railOffset.set(contentOffset.x);
  });
  const plusIndex = railEmojis.length;
  const firstAction = (actionsHeight - 3 * row) / 2;
  const target = useDerivedValue(() => {
    const point = pointer.get();
    if (point.phase === "idle") return -1;
    const rx = point.x - railLeft - railPadding;
    const ry = point.y - railTop;
    if (
      rx >= 0 &&
      rx < emojiViewport + cell &&
      ry >= 0 &&
      ry < reactionHeight
    ) {
      if (rx >= emojiViewport) return plusIndex;
      return Math.min(
        plusIndex - 1,
        Math.floor((rx + railOffset.get()) / cell),
      );
    }
    const mx = point.x - menuLeft;
    const my = point.y - menuTop - firstAction;
    if (mx >= 0 && mx < menuWidth && my >= 0 && my < 3 * row) {
      return plusIndex + 1 + Math.floor(my / row);
    }
    return -1;
  });
  const railHighlight = useAnimatedStyle(() => {
    const index = target.get();
    return {
      opacity: index >= 0 && index < plusIndex ? 1 : 0,
      transform: [{ translateX: Math.max(0, index) * cell }],
    };
  });
  const plusHighlight = useAnimatedStyle(() => ({
    opacity: target.get() === plusIndex ? 1 : 0,
  }));
  const menuHighlight = useAnimatedStyle(() => {
    const index = target.get() - plusIndex - 1;
    return {
      opacity: index >= 0 ? 1 : 0,
      transform: [{ translateY: Math.max(0, index) * row }],
    };
  });

  const backdropStyle = useAnimatedStyle(() => ({ opacity: phase.get() }));
  const actionsStyle = useAnimatedStyle(() => ({
    opacity: phase.get(),
    transform: [{ translateY: -6 * (1 - phase.get()) }],
  }));
  const railStyle = useAnimatedStyle(() => ({
    opacity: phase.get(),
    transform: [
      { translateY: 6 * (1 - phase.get()) },
      { scale: 0.94 + 0.06 * phase.get() },
    ],
  }));
  const previewStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (source.y - top) * (1 - phase.get()) }],
  }));

  function finish() {
    const action = pendingAction.current;
    pendingAction.current = undefined;
    onClose();
    action?.();
  }

  function close(action?: () => void) {
    if (closing.current) return;
    closing.current = true;
    pendingAction.current = action;
    phase.set(
      withTiming(
        0,
        { duration: 180, reduceMotion: ReduceMotion.System },
        (finished) => {
          if (finished) scheduleOnRN(finish);
        },
      ),
    );
  }

  function reactTo(emoji: string) {
    recent = [emoji, ...recent.filter((item) => item !== emoji)].slice(0, 18);
    close(() => onReact(emoji));
  }

  function commit(index: number) {
    if (index < plusIndex) reactTo(railEmojis[index]);
    else if (index === plusIndex) {
      pointer.set({ x: 0, y: 0, phase: "idle" });
      setSheetOpen(true);
    } else close([onContinue, onEdit, onDelete][index - plusIndex - 1]);
  }
  function selectionHaptic() {
    void selectionAsync().catch(() => {});
  }
  useAnimatedReaction(
    () => ({ index: target.get(), phase: pointer.get().phase }),
    (current, previous) => {
      if (current.index < 0) return;
      if (current.phase === "moving" && current.index !== previous?.index) {
        scheduleOnRN(selectionHaptic);
      }
      if (current.phase === "released" && previous?.phase !== "released") {
        scheduleOnRN(commit, current.index);
      }
    },
  );

  return (
    <View
      style={StyleSheet.absoluteFill}
      accessibilityViewIsModal
      onAccessibilityEscape={() => close()}
    >
      <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
        <Pressable
          accessibilityLabel="Fechar ações da entrada"
          onPress={() => close()}
          style={styles.scrim}
        />
      </Animated.View>
      <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        <View
          style={[
            styles.rail,
            {
              top: railTop,
              left: railLeft,
              width: railWidth,
            },
          ]}
        >
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <GlassSurface style={styles.railGlass} />
          </View>
          <Animated.View
            style={[
              styles.railContent,
              { paddingHorizontal: railPadding },
              railStyle,
            ]}
          >
            <Animated.ScrollView
              horizontal
              bounces={false}
              showsHorizontalScrollIndicator={false}
              style={{ width: emojiViewport, flexGrow: 0 }}
              onScroll={railScroll}
              scrollEventThrottle={16}
            >
              <View style={styles.emojiStrip}>
                <Animated.View
                  pointerEvents="none"
                  style={[styles.railHighlight, railHighlight]}
                />
                {railEmojis.map((emoji) => (
                  <Pressable
                    key={emoji}
                    accessibilityRole="button"
                    accessibilityLabel={emoji}
                    accessibilityState={{ selected: emoji === reaction }}
                    onPress={() => reactTo(emoji)}
                    style={[
                      styles.railCell,
                      emoji === reaction && styles.currentEmoji,
                    ]}
                  >
                    <NativeText style={styles.railEmoji}>{emoji}</NativeText>
                  </Pressable>
                ))}
              </View>
            </Animated.ScrollView>
            <Pressable
              style={styles.railCell}
              accessibilityRole="button"
              accessibilityLabel="Mais emojis"
              onPress={() => setSheetOpen(true)}
            >
              <Animated.View
                pointerEvents="none"
                style={[styles.railHighlight, plusHighlight]}
              />
              <Symbol name="plus" size={20} color="#211D1B" />
            </Pressable>
          </Animated.View>
        </View>
        <Animated.View
          style={[
            styles.preview,
            previewStyle,
            {
              top,
              left: Math.max(10, right - source.width),
              width: source.width,
              height: previewHeight,
            },
          ]}
        >
          {source.height > previewHeight ? (
            <NativeScroll nestedScrollEnabled>{children}</NativeScroll>
          ) : (
            children
          )}
        </Animated.View>
        <Animated.View
          style={[
            actionsStyle,
            styles.actions,
            {
              top: menuTop,
              left: menuLeft,
              width: menuWidth,
            },
          ]}
        >
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <GlassSurface style={styles.actionsGlass} />
          </View>
          <Animated.View
            pointerEvents="none"
            style={[styles.menuHighlight, { top: firstAction }, menuHighlight]}
          />
          <Host colorScheme="light" style={styles.actionRows}>
            <VStack spacing={0}>
              <MenuAction
                title="Continuar"
                icon="arrowshape.turn.up.left.fill"
                onPress={() => close(onContinue)}
              />
              <MenuAction
                title="Editar"
                icon="pencil"
                onPress={() => close(onEdit)}
              />
              <MenuAction
                title="Excluir"
                icon="trash"
                destructive
                onPress={() => close(onDelete)}
              />
            </VStack>
          </Host>
        </Animated.View>
        <EmojiSheet
          visible={sheetOpen}
          reaction={reaction}
          onClose={() => setSheetOpen(false)}
          onReact={(emoji) => {
            pickedEmoji.current = emoji;
            setSheetOpen(false);
          }}
          onDismiss={() => {
            const emoji = pickedEmoji.current;
            pickedEmoji.current = undefined;
            if (emoji) reactTo(emoji);
          }}
        />
      </View>
    </View>
  );
}

function MenuAction({
  title,
  icon,
  destructive,
  onPress,
}: {
  title: string;
  icon: "arrowshape.turn.up.left.fill" | "pencil" | "trash";
  destructive?: boolean;
  onPress: () => void;
}) {
  return (
    <Button
      role={destructive ? "destructive" : undefined}
      onPress={onPress}
      modifiers={[buttonStyle("plain"), accessibilityLabel(title)]}
    >
      <VStack spacing={0}>
        {destructive && <ViewDivider />}
        <HStack
          spacing={12}
          modifiers={[
            padding({ horizontal: 16 }),
            frame({ height: destructive ? row - 1 : row }),
            frame({ maxWidth: Infinity, alignment: "leading" }),
            contentShape(shapes.rectangle()),
            foregroundStyle(destructive ? "#B82018" : "#211D1B"),
          ]}
        >
          <SwiftImage
            systemName={icon}
            size={19}
            modifiers={[frame({ width: 22 })]}
          />
          <Text modifiers={[font({ size: 17 })]}>{title}</Text>
          <Spacer />
        </HStack>
      </VStack>
    </Button>
  );
}

function EmojiSheet({
  visible,
  reaction,
  onClose,
  onReact,
  onDismiss,
}: {
  visible: boolean;
  reaction?: string;
  onClose: () => void;
  onReact: (emoji: string) => void;
  onDismiss: () => void;
}) {
  const { width } = useWindowDimensions();
  const columns = 7;
  const emojiWidth = Math.max(32, Math.min(52, (width - 52) / columns));
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Tudo");
  const term = normalize(query);
  const groups = term
    ? [
        {
          title: "Resultados",
          emojis: searchable
            .filter(
              ({ name, emoji }) =>
                normalize(name).includes(term) || emoji.includes(query.trim()),
            )
            .map(({ emoji }) => emoji),
        },
      ]
    : [
        { title: "Reações padrão", emojis: quick },
        ...(recent.length ? [{ title: "Recentes", emojis: recent }] : []),
        ...catalog.map(({ title, emojis }) => ({
          title,
          emojis: emojis.map(({ emoji }) => emoji),
        })),
      ].filter(({ title }) => category === "Tudo" || category === title);
  return (
    <View style={styles.anchor} pointerEvents="none">
      <Host style={styles.fill} colorScheme="light">
        <BottomSheet
          isPresented={visible}
          onDismiss={() => {
            setQuery("");
            setCategory("Tudo");
            onDismiss();
          }}
          onIsPresentedChange={(open) => {
            if (!open) onClose();
          }}
        >
          <Group
            modifiers={[
              presentationDetents(["medium", "large"]),
              presentationDragIndicator("visible"),
            ]}
          >
            <VStack
              alignment="leading"
              spacing={10}
              modifiers={[padding({ top: 20, leading: 16, trailing: 16 })]}
            >
              <HStack
                spacing={9}
                modifiers={[
                  padding({ all: 10 }),
                  background("#F1EDE6"),
                  cornerRadius(18),
                ]}
              >
                <SwiftImage systemName="magnifyingglass" size={16} />
                <TextField
                  placeholder="Pesquisar emoji"
                  onTextChange={setQuery}
                  modifiers={[
                    frame({ maxWidth: Infinity, alignment: "leading" }),
                  ]}
                />
              </HStack>
              {!term && (
                <ScrollView
                  axes="horizontal"
                  showsIndicators={false}
                  modifiers={[frame({ height: 34 })]}
                >
                  <HStack spacing={12}>
                    {[
                      "Tudo",
                      ...(recent.length ? ["Recentes"] : []),
                      ...catalog.map(({ title }) => title),
                    ].map((title) => (
                      <Button
                        key={title}
                        label={title}
                        onPress={() => setCategory(title)}
                        modifiers={[
                          buttonStyle("borderless"),
                          tint(category === title ? "#B82018" : "#49413E"),
                        ]}
                      />
                    ))}
                  </HStack>
                </ScrollView>
              )}
              <ScrollView
                showsIndicators={false}
                modifiers={[
                  frame({ maxWidth: Infinity, alignment: "leading" }),
                  scrollEdgeEffectStyle("soft", "vertical"),
                ]}
              >
                <VStack
                  alignment="leading"
                  spacing={8}
                  modifiers={[
                    frame({ maxWidth: Infinity, alignment: "leading" }),
                  ]}
                >
                  {groups.map(({ title, emojis }) => (
                    <VStack key={title} alignment="leading" spacing={5}>
                      <Text
                        modifiers={[
                          font({ size: 13, weight: "semibold" }),
                          padding({ top: 6 }),
                        ]}
                      >
                        {title}
                      </Text>
                      {!emojis.length && <Text>Nenhum emoji encontrado.</Text>}
                      {Array.from(
                        { length: Math.ceil(emojis.length / columns) },
                        (_, row) => (
                          <HStack key={row} spacing={1}>
                            {emojis
                              .slice(row * columns, (row + 1) * columns)
                              .map((emoji) => (
                                <EmojiButton
                                  key={emoji}
                                  emoji={emoji}
                                  width={emojiWidth}
                                  selected={reaction === emoji}
                                  onPress={() => onReact(emoji)}
                                />
                              ))}
                          </HStack>
                        ),
                      )}
                    </VStack>
                  ))}
                </VStack>
              </ScrollView>
            </VStack>
          </Group>
        </BottomSheet>
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(30, 23, 20, 0.16)",
  },
  rail: {
    position: "absolute",
    height: reactionHeight,
  },
  preview: { position: "absolute" },
  actions: {
    position: "absolute",
    height: actionsHeight,
  },
  railGlass: { flex: 1, borderRadius: 25 },
  actionRows: { flex: 1, justifyContent: "center" },
  actionsGlass: { flex: 1, borderRadius: 20 },
  railContent: { flex: 1, flexDirection: "row", alignItems: "center" },
  emojiStrip: { flexDirection: "row" },
  railCell: {
    width: cell,
    height: cell,
    alignItems: "center",
    justifyContent: "center",
  },
  railEmoji: { fontSize: 25 },
  currentEmoji: { borderRadius: 20, backgroundColor: "#F4D7D1" },
  railHighlight: {
    position: "absolute",
    top: 0,
    width: cell,
    height: cell,
    borderRadius: 20,
    backgroundColor: "#D6281E33",
  },
  menuHighlight: {
    position: "absolute",
    left: 5,
    right: 5,
    height: row,
    borderRadius: 14,
    backgroundColor: "#3A302A17",
  },
  anchor: { position: "absolute", left: 0, bottom: 0, width: 44, height: 44 },
});

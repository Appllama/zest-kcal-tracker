import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
  type ComponentType,
  type ReactElement,
} from "react";
import {
  Image,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewProps,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeIn,
  ReduceMotion,
  useAnimatedStyle,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { selectionAsync } from "expo-haptics";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { scheduleOnRN } from "react-native-worklets";
import { dayKey, monthCells, parseDay } from "../cookbooks/zest/data/diary";
import { GlassButton } from "../cookbooks/zest/components/ui/GlassButton";
import NativeMaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { GlassSurface } from "../cookbooks/zest/components/ui/GlassSurface";
import { theme } from "../cookbooks/zest/theme";
import type { Entry } from "./entries";
import { entryPhotoUri, findDayPhoto, readDay } from "./storage";

const MaskedView = NativeMaskedView as unknown as ComponentType<
  ViewProps & { maskElement: ReactElement }
>;

const weekdays = ["S", "T", "Q", "Q", "S", "S", "D"];
const fullDate = (day: string) =>
  parseDay(day).toLocaleDateString("pt-BR", { dateStyle: "full" });
const reveal = FadeIn.duration(170).reduceMotion(ReduceMotion.System);

export function DiaryCalendar({
  index,
  initialDay,
  today,
  progress,
  renderEntry,
  onClose,
  onOpenDay,
}: {
  index: Map<string, string[]>;
  initialDay: string;
  today: string;
  progress: SharedValue<number>;
  renderEntry: (entry: Entry) => ReactNode;
  onClose: () => void;
  onOpenDay: (day: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const { height, fontScale } = useWindowDimensions();
  const [selected, setSelected] = useState(initialDay);
  const [month, setMonth] = useState(() => parseDay(initialDay));
  const [detail, setDetail] = useState<Entry>();
  const cells = monthCells(month.getFullYear(), month.getMonth());
  const [previews, setPreviews] = useState(new Map<string, string>());
  const monthKey = dayKey(month).slice(0, 7);
  useEffect(() => {
    const abort = new AbortController();
    const days = [...index].filter(
      ([day, ids]) => day.startsWith(monthKey) && ids.length > 0,
    );
    void Promise.all(
      days.map(async ([day, ids]) => {
        const photo = await findDayPhoto(ids, abort.signal).catch(
          () => undefined,
        );
        return [day, photo] as const;
      }),
    ).then((photos) => {
      if (!abort.signal.aborted) {
        setPreviews(
          new Map(
            photos.flatMap(([day, photo]) => (photo ? [[day, photo]] : [])),
          ),
        );
      }
    });
    return () => abort.abort();
  }, [index, monthKey]);
  const entries = useMemo(() => {
    try {
      return readDay(index.get(selected) ?? []);
    } catch {
      return [];
    }
  }, [index, selected]);
  const canOpenDay = selected === today || index.has(selected);
  const panelHeight = Math.min(580, height - insets.top - insets.bottom - 68);
  const compact = panelHeight < 470 && fontScale <= 1.2;
  const panel = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: (1 - progress.get()) * (panelHeight + insets.bottom + 30),
      },
    ],
  }));
  const travel = panelHeight + insets.bottom + 30;
  const pull = Gesture.Pan()
    .activeOffsetY(10)
    .onUpdate(({ translationY }) => {
      progress.set(Math.max(0, 1 - Math.max(0, translationY) / travel));
    })
    .onEnd(({ translationY, velocityY }, finished) => {
      if (finished && (translationY > 64 || velocityY > 650))
        scheduleOnRN(onClose);
      else
        progress.set(
          withTiming(1, { duration: 180, reduceMotion: ReduceMotion.System }),
        );
    });

  function stepMonth(direction: number) {
    const next = new Date(
      month.getFullYear(),
      month.getMonth() + direction,
      1,
      12,
    );
    setMonth(next);
    setSelected(dayKey(next));
  }

  return (
    <View
      style={StyleSheet.absoluteFill}
      accessibilityViewIsModal
      onAccessibilityEscape={onClose}
    >
      <Pressable
        accessible={false}
        onPress={onClose}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View
        style={[
          styles.position,
          { bottom: insets.bottom + 12, height: panelHeight },
          panel,
        ]}
      >
        <GlassSurface style={styles.panel}>
          <GestureDetector gesture={pull}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fechar calendário"
              onPress={onClose}
              style={styles.grabber}
            >
              <View style={styles.handle} />
            </Pressable>
          </GestureDetector>
          {detail ? (
            <Animated.View entering={reveal} style={styles.detail}>
              <View style={styles.monthRow}>
                <GlassButton
                  name="chevron.left"
                  label="Voltar ao calendário"
                  onPress={() => setDetail(undefined)}
                />
                <Text accessibilityRole="header" style={styles.month}>
                  {fullDate(selected)}
                </Text>
              </View>
              <ScrollView contentContainerStyle={styles.detailContent}>
                {renderEntry(detail)}
              </ScrollView>
            </Animated.View>
          ) : (
            <>
              <View style={[styles.monthRow, styles.monthHeader]}>
                <Text accessibilityRole="header" style={styles.month}>
                  {month.toLocaleDateString("pt-BR", {
                    month: "long",
                    year: "numeric",
                  })}
                </Text>
                <GlassButton
                  name="chevron.left"
                  size={40}
                  label="Mês anterior"
                  onPress={() => stepMonth(-1)}
                />
                <GlassButton
                  name="chevron.right"
                  size={40}
                  label="Próximo mês"
                  onPress={() => stepMonth(1)}
                />
              </View>
              <MaskedView
                style={styles.grow}
                maskElement={
                  <LinearGradient
                    colors={["transparent", "black", "black", "transparent"]}
                    locations={[0, 0.025, 0.94, 1]}
                    style={styles.grow}
                  />
                }
              >
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.content}
                >
                  <View style={styles.row}>
                    {weekdays.map((day, index) => (
                      <Text key={index} style={styles.weekday}>
                        {day}
                      </Text>
                    ))}
                  </View>
                  {Array.from({ length: 6 }, (_, row) => (
                    <View key={row} style={styles.row}>
                      {weekdays.map((_, column) => {
                        const day = cells[row * 7 + column];
                        const cell = [
                          styles.cell,
                          compact && styles.compactCell,
                        ];
                        if (!day) return <View key={column} style={cell} />;
                        const count = index.get(day)?.length ?? 0;
                        const thumbnail = previews.get(day);
                        return (
                          <Pressable
                            key={day}
                            accessibilityRole="button"
                            accessibilityState={{ selected: day === selected }}
                            accessibilityLabel={`${fullDate(day)}, ${count} entradas`}
                            onPress={() => {
                              if (day !== selected) void selectionAsync();
                              setSelected(day);
                            }}
                            style={cell}
                          >
                            {day === selected && (
                              <View
                                pointerEvents="none"
                                style={StyleSheet.absoluteFill}
                              >
                                <GlassSurface
                                  materialize={0}
                                  style={styles.selected}
                                />
                              </View>
                            )}
                            {thumbnail && (
                              <Image
                                source={{ uri: thumbnail }}
                                style={styles.thumbnail}
                              />
                            )}
                            <Text
                              style={[
                                styles.day,
                                day === today && styles.today,
                              ]}
                            >
                              {parseDay(day).getDate()}
                            </Text>
                            {!thumbnail && count > 0 && (
                              <View style={styles.dot} />
                            )}
                          </Pressable>
                        );
                      })}
                    </View>
                  ))}
                  <Animated.View
                    key={selected}
                    entering={reveal}
                    style={styles.dayFooter}
                  >
                    <View style={styles.monthRow}>
                      <Text
                        accessibilityRole="header"
                        style={[styles.date, styles.grow]}
                      >
                        {selected === today ? "Hoje" : fullDate(selected)}
                      </Text>
                      {canOpenDay && (
                        <GlassButton
                          name="arrow.right"
                          label="Abrir página do dia"
                          onPress={() => onOpenDay(selected)}
                        />
                      )}
                    </View>
                    {entries.length ? (
                      <MaskedView
                        style={styles.carousel}
                        maskElement={
                          <LinearGradient
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            colors={[
                              "transparent",
                              "black",
                              "black",
                              "transparent",
                            ]}
                            locations={[0, 0.045, 0.955, 1]}
                            style={styles.grow}
                          />
                        }
                      >
                        <FlatList
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.previews}
                          data={entries}
                          keyExtractor={(entry) => entry.id}
                          renderItem={({ item: entry }) => {
                            const photo = entryPhotoUri(entry);
                            return (
                              <Pressable
                                key={entry.id}
                                accessibilityRole="button"
                                accessibilityLabel={
                                  entry.text || "Abrir foto da entrada"
                                }
                                onPress={() => setDetail(entry)}
                                style={styles.preview}
                              >
                                {photo ? (
                                  <Image
                                    source={{ uri: photo }}
                                    style={styles.previewPhoto}
                                  />
                                ) : (
                                  <Text
                                    numberOfLines={2}
                                    style={styles.previewText}
                                  >
                                    {entry.text}
                                  </Text>
                                )}
                              </Pressable>
                            );
                          }}
                        />
                      </MaskedView>
                    ) : (
                      <Text style={styles.empty}>
                        Nenhuma entrada neste dia.
                      </Text>
                    )}
                  </Animated.View>
                </ScrollView>
              </MaskedView>
            </>
          )}
        </GlassSurface>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  position: { position: "absolute", left: 16, right: 16 },
  grow: { flex: 1 },
  grabber: {
    alignSelf: "center",
    width: 84,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  handle: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.faint,
  },
  panel: { flex: 1, borderRadius: 36 },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 38 },
  monthHeader: { paddingHorizontal: 16, paddingVertical: 6, minHeight: 54 },
  detail: { flex: 1, padding: 16 },
  detailContent: { paddingBottom: 12 },
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  month: { flex: 1, fontSize: 22, fontWeight: "600", color: theme.ink },
  row: { flexDirection: "row" },
  weekday: {
    flex: 1,
    textAlign: "center",
    color: theme.muted,
    fontSize: 12,
    marginBottom: 4,
  },
  cell: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  compactCell: { minHeight: 40 },
  selected: { flex: 1, borderRadius: 12 },
  day: { color: theme.ink, fontSize: 14 },
  today: { fontWeight: "700" },
  thumbnail: { width: 22, height: 22, borderRadius: 5 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: theme.accent },
  dayFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.line,
    marginTop: 8,
    paddingTop: 10,
  },
  date: { marginBottom: 8, fontSize: 16, fontWeight: "600", color: theme.ink },
  carousel: { height: 64, marginHorizontal: -16 },
  previews: { gap: 8, paddingHorizontal: 18, alignItems: "center" },
  preview: {
    width: 100,
    minHeight: 58,
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: theme.surface,
    overflow: "hidden",
  },
  previewPhoto: { width: 100, height: 58 },
  previewText: { color: theme.ink, padding: 8 },
  empty: { color: theme.muted },
});

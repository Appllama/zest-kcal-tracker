import { useLocalSearchParams } from "expo-router";
import { ZestScreen } from "../cookbooks/zest/screens/ZestScreen";
import { DiaryScreen } from "../diary/DiaryScreen";

/** The root is the product, with no collection route or back control. */
export default function Index() {
  const { demo } = useLocalSearchParams<{ demo?: string }>();
  if (demo === "1") return <ZestScreen demo={demo === "1"} />;
  return <DiaryScreen />;
}

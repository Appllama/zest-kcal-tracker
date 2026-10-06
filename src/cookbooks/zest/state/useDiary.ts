import { useStore } from "zustand";
import { File, Paths } from "expo-file-system";
import { createDiaryStore, type Diary } from "./diaryStore";

const file = () => new File(Paths.document, "zest-diary.json");
const diary = createDiaryStore({
  getItem: () => {
    try {
      return file().textSync();
    } catch {
      return null;
    }
  },
  setItem: (_key, value) => file().write(value),
  removeItem: () => {
    if (file().exists) file().delete();
  },
});

/** Selective React subscriptions plus the store API for event handlers. */
export const useDiary = Object.assign(
  <T>(selector: (state: Diary) => T) => useStore(diary, selector),
  diary,
);

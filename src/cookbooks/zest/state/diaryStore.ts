import { createStore } from "zustand/vanilla";
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware";
import { demoMeals, type Meal } from "../data/diary.ts";

export type Diary = {
  meals: Meal[];
  guide: number;
  add: (meal: Meal) => void;
  edit: (id: string, fields: Pick<Meal, "name" | "kcal">) => void;
  remove: (id: string) => void;
  setGuide: (guide: number) => void;
  seedDemo: () => void;
};

/** An isolated store with an injected storage boundary; native files live in useDiary. */
export function createDiaryStore(storage: StateStorage) {
  return createStore<Diary>()(
    persist(
      (set) => ({
        meals: [],
        guide: 2000,
        add: (meal) =>
          set((s) => ({
            meals: s.meals.some((m) => m.id === meal.id)
              ? s.meals
              : [...s.meals, meal],
          })),
        edit: (id, fields) =>
          set((s) => ({
            meals: s.meals.map((m) => (m.id === id ? { ...m, ...fields } : m)),
          })),
        remove: (id) =>
          set((s) => ({ meals: s.meals.filter((m) => m.id !== id) })),
        setGuide: (guide) => set({ guide }),
        seedDemo: () => set({ meals: demoMeals(), guide: 2000 }),
      }),
      {
        name: "zest-diary",
        storage: createJSONStorage(() => storage),
        partialize: (s) => ({ meals: s.meals, guide: s.guide }),
      },
    ),
  );
}

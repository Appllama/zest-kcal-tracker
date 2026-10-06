export const mealTypes = ["Breakfast", "Lunch", "Dinner", "Snack"] as const;
export type MealType = (typeof mealTypes)[number];
export type MealPhoto = {
  uri?: string;
  sample: boolean;
  asset?: "breakfast" | "lunch" | "dinner";
};
export const sampleEstimates = {
  breakfast: { name: "Avocado toast & eggs", kcal: 480, protein: 20 },
  lunch: { name: "Chickpea rice bowl", kcal: 640, protein: 18 },
  dinner: { name: "Pasta & garlic bread", kcal: 1120, protein: 32 },
};
export type Meal = {
  id: string;
  date: string;
  name: string;
  type: MealType;
  kcal: number;
  protein?: number;
  photo?: MealPhoto;
  time: string;
};

/** Local dates: a meal close to midnight must not move into another day. */
export function dayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function parseDay(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}
export function relativeDay(offset: number, base = new Date()) {
  const d = new Date(base);
  d.setDate(d.getDate() + offset);
  return dayKey(d);
}
export function mealsOn(meals: Meal[], date: string) {
  return meals.filter((meal) => meal.date === date);
}
export function totalOn(meals: Meal[], date: string) {
  return mealsOn(meals, date).reduce((sum, meal) => sum + meal.kcal, 0);
}
/** A reaction to the log, never a judgment about nutrition or the person. */
export function intakeMood(total: number, guide: number): -1 | 0 | 1 {
  if (!total) return 0;
  return total > guide ? 1 : total < guide * 0.4 ? -1 : 0;
}
export function monthCells(year: number, month: number) {
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const count = new Date(year, month + 1, 0).getDate();
  const size = Math.ceil((offset + count) / 7) * 7;
  return Array.from({ length: size }, (_, i) => {
    const day = i - offset + 1;
    return day < 1 || day > count
      ? null
      : dayKey(new Date(year, month, day, 12));
  });
}
export function dayCaption(date: string) {
  if (date === dayKey()) return "Today";
  if (date === relativeDay(-1)) return "Yesterday";
  return parseDay(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
export function encouragement(total: number, guide: number) {
  return total > guide
    ? "Plot twist. The lemon survives. Be kind to yourself."
    : "Logged it. Lived a little. That’s the idea.";
}
export type IntakeAnswer = {
  value?: string;
  unit?: string;
  caption: string;
  detail: string;
};
/** Local demo answers share the diary's actual values; no fabricated meal analysis. */
export function answerAbout(
  question: string,
  meals: Meal[],
  guide: number,
): IntakeAnswer {
  const q = question.toLowerCase();
  // A weekly question must work even when nothing has been logged today.
  if (/week/.test(q)) {
    const days = Array.from({ length: 7 }, (_, i) => relativeDay(-i));
    const total = meals
      .filter((meal) => days.includes(meal.date))
      .reduce((sum, meal) => sum + meal.kcal, 0);
    const logged = days.filter((day) => mealsOn(meals, day).length).length;
    return {
      value: total.toLocaleString(),
      unit: "kcal",
      caption: `Last 7 days · ${logged} logged`,
      detail: "Tap me to explore each day.",
    };
  }
  const date = q.includes("yesterday") ? relativeDay(-1) : dayKey();
  const items = mealsOn(meals, date);
  const total = totalOn(meals, date);
  const when = date === dayKey() ? "Today" : "Yesterday";
  if (!items.length)
    return {
      caption: when,
      detail: "Nothing logged yet. Let’s start with a meal photo.",
    };
  if (/protein/.test(q)) {
    const known = items.filter((meal) => meal.protein !== undefined);
    const protein = known.reduce((sum, meal) => sum + (meal.protein ?? 0), 0);
    return known.length
      ? {
          value: String(protein),
          unit: "g protein",
          caption: `${when} · estimated`,
          detail:
            known.length < items.length
              ? "Some meals don’t have a protein estimate yet."
              : "A little fuel for whatever’s next.",
        }
      : {
          caption: `${when} · protein`,
          detail: "No protein estimates for these meals yet.",
        };
  }
  if (/left|remaining|guide|goal|over|too much/.test(q)) {
    return {
      value: total.toLocaleString(),
      unit: "kcal",
      caption: `${when} · ${Math.abs(guide - total).toLocaleString()} ${total > guide ? "above" : "below"} your guide`,
      detail:
        total > guide
          ? encouragement(total, guide)
          : "A guide, not a grade. Listen to your appetite, too.",
    };
  }
  if (/breakfast|lunch|dinner|snack/.test(q)) {
    const type = mealTypes.find((type) => q.includes(type.toLowerCase()))!;
    const chosen = items.filter((meal) => meal.type === type);
    return chosen.length
      ? {
          value: chosen
            .reduce((sum, meal) => sum + meal.kcal, 0)
            .toLocaleString(),
          unit: "kcal",
          caption: `${when} · ${type.toLowerCase()}`,
          detail: chosen.map((meal) => meal.name).join(" + "),
        }
      : {
          caption: `${when} · ${type.toLowerCase()}`,
          detail: "Nothing logged here yet. Add a photo whenever you’re ready.",
        };
  }
  return {
    value: total.toLocaleString(),
    unit: "kcal",
    caption: `${when} · ${items.length} ${items.length === 1 ? "meal" : "meals"} logged`,
    detail:
      total > guide
        ? encouragement(total, guide)
        : "A good start. Keep today delicious.",
  };
}
/** Explicit demo data only; opening an ordinary diary never invents meals. */
export function demoMeals(): Meal[] {
  const totals = [1840, 2180, 1920, 2010, 1760, 1950, 1880, 2070, 1810, 1900];
  const history = totals.flatMap((total, i) => {
    const date = relativeDay(-i - 1);
    return [
      {
        id: `demo-${i}-b`,
        date,
        name: "Eggs on toast",
        type: "Breakfast" as const,
        kcal: 420,
        time: "9:12 AM",
      },
      {
        id: `demo-${i}-l`,
        date,
        name: "Roasted vegetable bowl",
        type: "Lunch" as const,
        kcal: 640,
        time: "1:10 PM",
      },
      {
        id: `demo-${i}-d`,
        date,
        name: "Pasta & a little dessert",
        type: "Dinner" as const,
        kcal: total - 1060,
        time: "7:35 PM",
      },
    ];
  });
  return [
    ...history,
    {
      id: "demo-today-breakfast",
      date: dayKey(),
      type: "Breakfast",
      ...sampleEstimates.breakfast,
      photo: { sample: true, asset: "breakfast" },
      time: "9:12 AM",
    },
    {
      id: "demo-today-lunch",
      date: dayKey(),
      type: "Lunch",
      ...sampleEstimates.lunch,
      photo: { sample: true, asset: "lunch" },
      time: "1:10 PM",
    },
  ];
}

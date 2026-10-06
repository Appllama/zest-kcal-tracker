import type { Meal, MealPhoto, IntakeAnswer } from "./diary";

export type Turn = {
  id: string;
  role: "user" | "assistant";
  kind: "text" | "photo" | "question" | "meal";
  text?: string;
  photo?: MealPhoto;
  mealId?: string;
  pendingMeal?: Meal;
  answer?: IntakeAnswer;
  state?: "thinking" | "choosing" | "confirming" | "complete" | "stopped";
};

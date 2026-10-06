import assert from "node:assert/strict";
import { test } from "node:test";
import { createDiaryStore } from "../src/cookbooks/zest/state/diaryStore.ts";
import { dayKey, totalOn } from "../src/cookbooks/zest/data/diary.ts";

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}
const meal = {
  id: "test-meal",
  date: dayKey(),
  name: "My lunch",
  kcal: 640,
  type: "Lunch",
  time: "1:00 PM",
};

test("ordinary launch is empty; a repeated confirmation does not duplicate a meal", () => {
  const store = createDiaryStore(memoryStorage());
  assert.deepEqual(store.getState().meals, []);
  store.getState().add(meal);
  store.getState().add(meal);
  assert.equal(store.getState().meals.length, 1);
  assert.equal(totalOn(store.getState().meals, dayKey()), 640);
});

test("edits, deletion and guide survive reopening the same storage", () => {
  const storage = memoryStorage();
  const first = createDiaryStore(storage);
  first.getState().add(meal);
  first.getState().edit(meal.id, { name: "Edited lunch", kcal: 720 });
  first.getState().setGuide(2200);
  const reopened = createDiaryStore(storage);
  assert.equal(reopened.getState().guide, 2200);
  assert.deepEqual(reopened.getState().meals, [
    { ...meal, name: "Edited lunch", kcal: 720 },
  ]);
  reopened.getState().remove(meal.id);
  assert.deepEqual(createDiaryStore(storage).getState().meals, []);
});

test("demo data is explicit, resettable and isolated from a separate diary", () => {
  const diary = createDiaryStore(memoryStorage());
  const other = createDiaryStore(memoryStorage());
  diary.getState().seedDemo();
  assert.equal(diary.getState().meals.length, 32);
  diary.getState().add(meal);
  diary.getState().seedDemo();
  assert.equal(diary.getState().meals.length, 32);
  assert.deepEqual(other.getState().meals, []);
});

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  answerAbout,
  dayKey,
  demoMeals,
  mealsOn,
  monthCells,
  parseDay,
  relativeDay,
  totalOn,
  intakeMood,
  sampleEstimates,
} from "../src/cookbooks/zest/data/diary.ts";

const meal = (changes = {}) => ({
  id: "test",
  date: dayKey(),
  name: "Toast",
  type: "Breakfast",
  kcal: 480,
  time: "9:41 AM",
  ...changes,
});
test("calendar covers leap years and Monday-based leading cells without date drift", () => {
  const feb = monthCells(2024, 1);
  assert.equal(feb.length, 35);
  assert.deepEqual(feb.slice(0, 4), [null, null, null, "2024-02-01"]);
  assert.equal(feb.filter(Boolean).length, 29);
  assert.equal(dayKey(parseDay("2024-02-29")), "2024-02-29");
  assert.equal(relativeDay(1, new Date(2024, 1, 29, 23, 59)), "2024-03-01");
  assert.equal(relativeDay(-1, new Date(2026, 0, 1, 0, 1)), "2025-12-31");
});
test("local late-night meals stay on their local date", () => {
  assert.equal(dayKey(new Date(2026, 9, 4, 23, 59)), "2026-10-04");
  const items = [
    meal(),
    meal({ id: "yesterday", date: relativeDay(-1), kcal: 300 }),
    meal({ id: "second", kcal: 120 }),
  ];
  assert.equal(totalOn(items, dayKey()), 600);
  assert.equal(mealsOn(items, relativeDay(-1)).length, 1);
});
test("visual answers use actual logged totals, categories and partial protein estimates", () => {
  const meals = [
    meal({ protein: 20 }),
    meal({ id: "dinner", type: "Dinner", kcal: 700 }),
  ];
  assert.equal(answerAbout("my day", meals, 2000).value, "1,180");
  assert.equal(answerAbout("breakfast", meals, 2000).value, "480");
  const protein = answerAbout("protein", meals, 2000);
  assert.equal(protein.value, "20");
  assert.match(protein.detail, /Some meals/);
  assert.equal(answerAbout("protein", [meal()], 2000).value, undefined);
  assert.match(answerAbout("lunch", meals, 2000).detail, /Nothing logged/);
});
test("weekly totals work without a meal today and exclude older records", () => {
  const records = [
    meal({ date: relativeDay(-1), kcal: 100 }),
    meal({ id: "six", date: relativeDay(-6), kcal: 200 }),
    meal({ id: "old", date: relativeDay(-7), kcal: 900 }),
  ];
  const answer = answerAbout("this week", records, 2000);
  assert.equal(answer.value, "300");
  assert.equal(answer.caption, "Last 7 days · 2 logged");
});
test("over-guide answers remain supportive without compensation advice", () => {
  const answer = answerAbout(
    "am I over my guide?",
    [meal({ kcal: 2180 })],
    2000,
  );
  assert.equal(answer.value, "2,180");
  assert.match(answer.caption, /180 above/);
  assert.match(answer.detail, /Be kind to yourself/);
  assert.doesNotMatch(answer.detail, /skip|burn|restrict|fast|guilt/);
  assert.match(answerAbout("today", [], 2000).detail, /Nothing logged/);
});
test("sample day shares its actual photos and estimates across dinner, diary and answer", () => {
  const records = demoMeals();
  assert.equal(records.length, 32);
  assert.equal(new Set(records.map((m) => m.id)).size, 32);
  assert.equal(totalOn(records, dayKey()), 1120);
  assert.equal(totalOn(records, relativeDay(-1)), 1840);
  assert.equal(totalOn(records, relativeDay(-2)), 2180);
  const dinner = meal({
    id: "dinner-photo",
    type: "Dinner",
    ...sampleEstimates.dinner,
    photo: { sample: true, asset: "dinner" },
  });
  const complete = [...records, dinner];
  assert.deepEqual(
    mealsOn(complete, dayKey()).map((m) => m.photo.asset),
    ["breakfast", "lunch", "dinner"],
  );
  assert.equal(totalOn(complete, dayKey()), 2240);
  assert.equal(answerAbout("protein", complete, 2000).value, "70");
  assert.equal(intakeMood(totalOn(complete, dayKey()), 2000), 1);
});

test("mascot reacts to logged amounts without treating an empty day as low", () => {
  assert.equal(intakeMood(0, 2000), 0);
  assert.equal(intakeMood(480, 2000), -1);
  assert.equal(intakeMood(1840, 2000), 0);
  assert.equal(intakeMood(2000, 2000), 0);
  assert.equal(intakeMood(2180, 2000), 1);
});

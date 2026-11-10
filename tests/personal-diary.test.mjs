import assert from "node:assert/strict";
import { test } from "node:test";
import {
  entryDayFromId,
  entrySchema,
  quotedEntryText,
  threadEntryIds,
} from "../src/diary/entries.ts";

test("diary keeps a continuation on the day it was written", () => {
  const first = {
    id: `${new Date(2026, 10, 8, 23, 55).getTime()}-first`,
    text: "Preciso pensar nisso.",
    createdAt: new Date(2026, 10, 8, 23, 55).toISOString(),
  };
  const continuation = {
    id: `${new Date(2026, 10, 9, 0, 5).getTime()}-continuation`,
    text: "Hoje vejo de outro jeito.",
    createdAt: new Date(2026, 10, 9, 0, 5).toISOString(),
    continuationOf: first.id,
    photo: "photo.jpg",
  };
  const reopened = [first, continuation].map((entry) =>
    entrySchema.parse(JSON.parse(JSON.stringify(entry))),
  );
  assert.deepEqual(
    reopened.map((entry) => entryDayFromId(entry.id)),
    ["2026-11-08", "2026-11-09"],
  );
  assert.equal(reopened[1].continuationOf, reopened[0].id);
  assert.equal(entryDayFromId(`.${first.id}`), undefined);
});

test("focusing a reply opens its original thread without unrelated entries", () => {
  const parents = new Map([
    ["reply", "root"],
    ["nested", "reply"],
    ["sibling", "root"],
    ["other-reply", "other"],
  ]);
  assert.deepEqual(threadEntryIds("nested", parents), [
    "root",
    "reply",
    "sibling",
    "nested",
  ]);
  assert.deepEqual(threadEntryIds("isolated", parents), ["isolated"]);
  assert.deepEqual(
    new Set(
      threadEntryIds(
        "a",
        new Map([
          ["a", "b"],
          ["b", "a"],
        ]),
      ),
    ),
    new Set(["a", "b"]),
  );
});

test("editing an entry preserves both legacy quotes and newer snapshots", () => {
  const entry = entrySchema.parse({
    id: "first",
    text: "Texto revisado outra vez",
    originalText: "Primeiro texto",
    createdAt: "2026-11-09T00:00:00.000Z",
    photo: "photo-2.jpg",
  });
  const legacy = {
    id: "reply",
    text: "Resposta",
    createdAt: entry.createdAt,
    continuationOf: entry.id,
  };
  assert.equal(quotedEntryText(legacy, entry), "Primeiro texto");
  assert.equal(
    quotedEntryText({ ...legacy, quotedText: "Segunda versão" }, entry),
    "Segunda versão",
  );
});

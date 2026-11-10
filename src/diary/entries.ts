import { z } from "zod";
import { dayKey } from "../cookbooks/zest/data/diary.ts";

const photoName = z.string().regex(/^photo(?:-[0-9]+)?\.[a-z0-9]+$/);
export const entrySchema = z.object({
  id: z.string(),
  text: z.string(),
  createdAt: z.iso.datetime(),
  photo: photoName.optional(),
  continuationOf: z.string().optional(),
  quotedText: z.string().optional(),
  quotedPhoto: photoName.nullable().optional(),
  originalText: z.string().optional(),
  reaction: z.string().optional(),
});

export type Entry = z.infer<typeof entrySchema>;

export function quotedEntryText(entry: Entry, previous?: Entry) {
  return entry.quotedText ?? previous?.originalText ?? previous?.text;
}

export function entryDayFromId(id: string) {
  const match = /^(\d+)-[a-z0-9]*$/.exec(id);
  if (!match) return undefined;
  const date = new Date(Number(match[1]));
  return Number.isFinite(date.getTime()) ? dayKey(date) : undefined;
}

export function threadEntryIds(
  id: string,
  parents: ReadonlyMap<string, string>,
) {
  const path = new Set<string>();
  let root = id;
  while (!path.has(root)) {
    path.add(root);
    const parent = parents.get(root);
    if (!parent || path.has(parent)) break;
    root = parent;
  }

  const children = new Map<string, string[]>();
  for (const [child, parent] of parents) {
    const siblings = children.get(parent) ?? [];
    siblings.push(child);
    children.set(parent, siblings);
  }
  const ids = new Set([root]);
  for (const parent of ids) {
    for (const child of children.get(parent) ?? []) ids.add(child);
  }
  return [...ids];
}

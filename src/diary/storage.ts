import { Directory, File, Paths } from "expo-file-system";
import {
  deleteAsync,
  moveAsync,
  writeAsStringAsync,
} from "expo-file-system/legacy";
import { entryDayFromId, entrySchema, type Entry } from "./entries";

const root = () => new Directory(Paths.document, "compasso-entries");
const revisionPattern = /^revision-(\d+)\.json$/;

function latestRevision(directory: Directory) {
  return directory.list().reduce((latest, item) => {
    const match = revisionPattern.exec(item.name);
    return match ? Math.max(latest, Number(match[1])) : latest;
  }, 0);
}

function entryFile(id: string) {
  if (!/^\d+-[a-z0-9]*$/.test(id)) return undefined;
  const directory = new Directory(root(), id);
  if (!directory.exists) return undefined;
  const revision = latestRevision(directory);
  return new File(
    directory,
    revision ? `revision-${revision}.json` : "entry.json",
  );
}

export function readEntry(id: string) {
  const file = entryFile(id);
  return file ? entrySchema.parse(JSON.parse(file.textSync())) : undefined;
}

export async function findDayPhoto(
  ids: readonly string[],
  signal: AbortSignal,
) {
  for (const id of ids) {
    if (signal.aborted) return undefined;
    const file = entryFile(id);
    if (!file) continue;
    const entry = entrySchema.parse(JSON.parse(await file.text()));
    if (entry.photo) return entryPhotoUri(entry);
  }
  return undefined;
}

const openedDays = () => new Directory(Paths.document, "compasso-days");

export function rememberDay(day: string) {
  const directory = openedDays();
  directory.create({ idempotent: true });
  new Directory(directory, day).create({ idempotent: true });
}

export function readDayIndex() {
  const index = new Map<string, string[]>();
  const opened = openedDays();
  if (opened.exists) {
    for (const item of opened.list()) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(item.name)) index.set(item.name, []);
    }
  }
  const directory = root();
  if (!directory.exists) return index;
  // Entry directories already carry their creation instant. Opening the app
  // only needs this index, without reading the text or images of past days.
  for (const item of directory.list()) {
    if (!(item instanceof Directory)) continue;
    const day = entryDayFromId(item.name);
    if (!day) continue;
    const ids = index.get(day) ?? [];
    ids.push(item.name);
    index.set(day, ids);
  }
  return index;
}

export function readDay(ids: readonly string[]) {
  return ids
    .map(readEntry)
    .filter((entry): entry is Entry => !!entry)
    .sort(
      (a, b) =>
        b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id),
    );
}

export async function readThreadLinks(
  ids: Iterable<string>,
  signal: AbortSignal,
) {
  const parents = new Map<string, string>();
  for (const id of ids) {
    if (signal.aborted) break;
    try {
      // The parent is immutable across edits, so the base record is enough.
      const file = new File(root(), id, "entry.json");
      const entry = entrySchema.parse(JSON.parse(await file.text()));
      if (entry.continuationOf) parents.set(id, entry.continuationOf);
    } catch {
      // A missing record need not prevent reading the rest of the thread.
    }
  }
  return parents;
}

export function entryPhotoUri(entry: Pick<Entry, "id" | "photo">) {
  return entry.photo ? new File(root(), entry.id, entry.photo).uri : undefined;
}

export async function setEntryReaction(id: string, emoji: string) {
  const entry = readEntry(id);
  if (!entry) throw new Error("Entry unavailable");
  const directory = new Directory(root(), id);
  const next = latestRevision(directory) + 1;
  const pending = new File(directory, ".reaction-pending.json").uri;
  const updated = {
    ...entry,
    reaction: entry.reaction === emoji ? undefined : emoji,
  };
  try {
    await writeAsStringAsync(pending, JSON.stringify(updated));
    await moveAsync({
      from: pending,
      to: new File(directory, `revision-${next}.json`).uri,
    });
  } catch (error) {
    await deleteAsync(pending, { idempotent: true }).catch(() => {});
    throw error;
  }
}

export function deleteEntries(ids: Iterable<string>) {
  const removed = new Set<string>();
  for (const id of ids) {
    if (!/^\d+-[a-z0-9]*$/.test(id)) continue;
    try {
      const directory = new Directory(root(), id);
      if (directory.exists) directory.delete();
      removed.add(id);
    } catch {
      // The caller retains failed entries in the selection for retry.
    }
  }
  return removed;
}

export async function saveEntry(
  text: string,
  photoUri: string | undefined,
  previous: Entry | undefined,
) {
  const directory = root();
  directory.create({ idempotent: true });
  const date = new Date();
  const id = `${date.getTime()}-${Math.random().toString(36).slice(2)}`;
  const pending = new Directory(directory, `.${id}`);
  const source = photoUri ? new File(photoUri) : undefined;
  const extension = source?.extension.toLowerCase();
  const photo = source
    ? `photo${extension && /^\.[a-z0-9]+$/.test(extension) ? extension : ".jpg"}`
    : undefined;
  const entry: Entry = {
    id,
    text,
    createdAt: date.toISOString(),
    photo,
    continuationOf: previous?.id,
    quotedText: previous?.text,
    quotedPhoto: previous ? (previous.photo ?? null) : undefined,
  };

  try {
    pending.create();
    if (source && photo) await source.copy(new File(pending, photo));
    new File(pending, "entry.json").write(JSON.stringify(entry));
    // Only publish the directory after both the entry and attachment are ready.
    pending.rename(id);
    return entry;
  } catch (error) {
    try {
      if (pending.exists) pending.delete();
    } catch {
      // An incomplete directory is ignored by readEntries.
    }
    throw error;
  }
}

export async function editEntry(entry: Entry, text: string, photoUri?: string) {
  const directory = new Directory(root(), entry.id);
  const revision = latestRevision(directory) + 1;
  const replacement =
    photoUri && photoUri !== entryPhotoUri(entry)
      ? new File(photoUri)
      : undefined;
  const extension = replacement?.extension.toLowerCase() ?? "";
  const photo = replacement
    ? `photo-${revision}${/^\.[a-z0-9]+$/.test(extension) ? extension : ".jpg"}`
    : photoUri
      ? entry.photo
      : undefined;
  const updated = {
    ...entry,
    reaction: readEntry(entry.id)?.reaction,
    text,
    photo,
    originalText: entry.originalText ?? entry.text,
  };
  const pending = new File(directory, ".revision-pending.json");
  const attachment =
    replacement && photo ? new File(directory, photo) : undefined;

  try {
    if (replacement && attachment) {
      if (attachment.exists) attachment.delete();
      await replacement.copy(attachment);
    }
    pending.write(JSON.stringify(updated));
    // Publish the metadata last so interrupted edits leave the prior revision readable.
    pending.rename(`revision-${revision}.json`);
    return updated;
  } catch (error) {
    try {
      if (pending.exists) pending.delete();
      if (attachment?.exists) attachment.delete();
    } catch {
      // Unpublished files are ignored and can be replaced on retry.
    }
    throw error;
  }
}

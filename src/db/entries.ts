import { getDb } from './database';
import { newId, nowISO } from '../domain/ids';
import type { Direction, Entry, EntryKind, EntryWithEvent, EntryWithFamily, ID } from '../domain/types';
import { orNull } from './families';
import {
  toEntry,
  toEntryWithEvent,
  toEntryWithFamily,
  type EntryRow,
  type EntryWithEventRow,
  type EntryWithFamilyRow,
} from './rows';

export interface EntryInput {
  familyId: ID;
  eventId: ID;
  direction: Direction;
  kind: EntryKind;
  amountMinor: number | null;
  currency: string;
  itemDescription?: string | null;
  photoPath?: string | null;
  note?: string | null;
}

const COLS =
  'en.id, en.family_id, en.event_id, en.direction, en.kind, en.amount_minor, en.currency, en.item_description, en.photo_path, en.note, en.created_at, en.updated_at';

export async function getEntry(id: ID): Promise<Entry | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<EntryRow>(`SELECT ${COLS} FROM entries en WHERE en.id = ?`, [id]);
  return row ? toEntry(row) : null;
}

/** All entries with a family, joined with their events. Used for ledger, totals and suggestions. */
export async function listEntriesForFamily(familyId: ID): Promise<EntryWithEvent[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<EntryWithEventRow>(
    `SELECT ${COLS}, ev.name AS ev_name, ev.type AS ev_type, ev.date AS ev_date, ev.host_family_id AS ev_host_family_id
     FROM entries en JOIN events ev ON ev.id = en.event_id
     WHERE en.family_id = ?
     ORDER BY ev.date DESC, en.created_at DESC`,
    [familyId],
  );
  return rows.map(toEntryWithEvent);
}

/** All entries at an event, joined with their families. Newest first so quick-add shows what was just entered. */
export async function listEntriesForEvent(eventId: ID): Promise<EntryWithFamily[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<EntryWithFamilyRow>(
    `SELECT ${COLS}, f.name AS fam_name, f.city AS fam_city
     FROM entries en JOIN families f ON f.id = en.family_id
     WHERE en.event_id = ?
     ORDER BY en.created_at DESC`,
    [eventId],
  );
  return rows.map(toEntryWithFamily);
}

/** Lightweight rows for every family at once, for balance chips on the families list. */
export async function listAllEntriesLite(): Promise<Pick<Entry, 'familyId' | 'direction' | 'amountMinor' | 'currency'>[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ family_id: string; direction: Direction; amount_minor: number | null; currency: string }>(
    `SELECT family_id, direction, amount_minor, currency FROM entries`,
  );
  return rows.map((r) => ({ familyId: r.family_id, direction: r.direction, amountMinor: r.amount_minor, currency: r.currency }));
}

export async function createEntry(input: EntryInput): Promise<Entry> {
  const db = await getDb();
  const id = newId();
  const ts = nowISO();
  await db.runAsync(
    `INSERT INTO entries (id, family_id, event_id, direction, kind, amount_minor, currency, item_description, photo_path, note, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      id,
      input.familyId,
      input.eventId,
      input.direction,
      input.kind,
      input.amountMinor,
      input.currency,
      orNull(input.itemDescription),
      input.photoPath ?? null,
      orNull(input.note),
      ts,
      ts,
    ],
  );
  return (await getEntry(id))!;
}

export async function updateEntry(id: ID, input: EntryInput): Promise<Entry> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE entries SET family_id = ?, event_id = ?, direction = ?, kind = ?, amount_minor = ?, currency = ?, item_description = ?, photo_path = ?, note = ?, updated_at = ?
     WHERE id = ?`,
    [
      input.familyId,
      input.eventId,
      input.direction,
      input.kind,
      input.amountMinor,
      input.currency,
      orNull(input.itemDescription),
      input.photoPath ?? null,
      orNull(input.note),
      nowISO(),
      id,
    ],
  );
  return (await getEntry(id))!;
}

export async function deleteEntry(id: ID): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM entries WHERE id = ?`, [id]);
}

/** Search entries across the app by note, item description or exact major amount. */
export async function searchEntries(text: string, limit = 50): Promise<(EntryWithFamily & { eventName: string; eventDate: string })[]> {
  const db = await getDb();
  const t = text.trim();
  if (!t) return [];
  const digits = t.replace(/[^\d]/g, '');
  const rows = await db.getAllAsync<EntryWithFamilyRow & { ev_name: string; ev_date: string }>(
    `SELECT ${COLS}, f.name AS fam_name, f.city AS fam_city, ev.name AS ev_name, ev.date AS ev_date
     FROM entries en JOIN families f ON f.id = en.family_id JOIN events ev ON ev.id = en.event_id
     WHERE en.note LIKE ? COLLATE NOCASE OR en.item_description LIKE ? COLLATE NOCASE
        OR (? <> '' AND CAST(en.amount_minor / 100 AS TEXT) = ?)
     ORDER BY ev.date DESC LIMIT ?`,
    [`%${t}%`, `%${t}%`, digits, digits, limit],
  );
  return rows.map((r) => ({ ...toEntryWithFamily(r), eventName: r.ev_name, eventDate: r.ev_date }));
}

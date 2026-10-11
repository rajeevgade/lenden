import { getDb } from './database';
import { newId, nowISO } from '../domain/ids';
import type { ID, Outfit } from '../domain/types';
import { orNull } from './families';
import { toOutfit, type OutfitRow } from './rows';

export interface OutfitInput {
  eventId: ID;
  personLabel: string;
  photoPath?: string | null;
  note?: string | null;
}

export interface OutfitWithEvent extends Outfit {
  eventName: string;
  eventDate: string;
}

const COLS = 'o.id, o.event_id, o.person_label, o.photo_path, o.note, o.created_at';

export async function listOutfitsForEvent(eventId: ID): Promise<Outfit[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<OutfitRow>(`SELECT ${COLS} FROM outfits o WHERE o.event_id = ? ORDER BY o.created_at ASC`, [
    eventId,
  ]);
  return rows.map(toOutfit);
}

/** Outfits worn to events hosted by a family — "what did we wear to their functions". */
export async function listOutfitsForHostFamily(familyId: ID): Promise<OutfitWithEvent[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<OutfitRow & { ev_name: string; ev_date: string }>(
    `SELECT ${COLS}, ev.name AS ev_name, ev.date AS ev_date
     FROM outfits o JOIN events ev ON ev.id = o.event_id
     WHERE ev.host_family_id = ?
     ORDER BY ev.date DESC, o.created_at ASC`,
    [familyId],
  );
  return rows.map((r) => ({ ...toOutfit(r), eventName: r.ev_name, eventDate: r.ev_date }));
}

export async function getOutfit(id: ID): Promise<Outfit | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<OutfitRow>(`SELECT ${COLS} FROM outfits o WHERE o.id = ?`, [id]);
  return row ? toOutfit(row) : null;
}

export async function createOutfit(input: OutfitInput): Promise<Outfit> {
  const db = await getDb();
  const id = newId();
  await db.runAsync(`INSERT INTO outfits (id, event_id, person_label, photo_path, note, created_at) VALUES (?,?,?,?,?,?)`, [
    id,
    input.eventId,
    input.personLabel.trim(),
    input.photoPath ?? null,
    orNull(input.note),
    nowISO(),
  ]);
  return (await getOutfit(id))!;
}

export async function updateOutfit(id: ID, input: OutfitInput): Promise<Outfit> {
  const db = await getDb();
  await db.runAsync(`UPDATE outfits SET person_label = ?, photo_path = ?, note = ? WHERE id = ?`, [
    input.personLabel.trim(),
    input.photoPath ?? null,
    orNull(input.note),
    id,
  ]);
  return (await getOutfit(id))!;
}

export async function deleteOutfit(id: ID): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM outfits WHERE id = ?`, [id]);
}

/** Distinct person labels used before, for the chip row on the outfit form. */
export async function listPersonLabels(): Promise<string[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ person_label: string }>(
    `SELECT person_label, COUNT(*) AS n FROM outfits GROUP BY person_label ORDER BY n DESC, person_label LIMIT 10`,
  );
  return rows.map((r) => r.person_label);
}

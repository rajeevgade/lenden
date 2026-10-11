import { getDb } from './database';
import { newId, nowISO } from '../domain/ids';
import type { Event, EventType, ID } from '../domain/types';
import { orNull } from './families';
import { toEvent, type EventRow } from './rows';

export interface EventInput {
  name: string;
  type: EventType;
  date: string;
  hostFamilyId?: ID | null;
  venue?: string | null;
  notes?: string | null;
}

export interface EventListItem extends Event {
  hostFamilyName: string | null;
  entryCount: number;
}

const COLS = 'e.id, e.name, e.type, e.date, e.host_family_id, e.venue, e.notes, e.created_at, e.updated_at';

export async function listEvents(search = ''): Promise<EventListItem[]> {
  const db = await getDb();
  const q = `%${search.trim()}%`;
  const rows = await db.getAllAsync<EventRow & { host_family_name: string | null; entry_count: number }>(
    `SELECT ${COLS}, f.name AS host_family_name, COUNT(en.id) AS entry_count
     FROM events e
     LEFT JOIN families f ON f.id = e.host_family_id
     LEFT JOIN entries en ON en.event_id = e.id
     WHERE (? = '%%' OR e.name LIKE ? COLLATE NOCASE OR f.name LIKE ? COLLATE NOCASE OR e.venue LIKE ? COLLATE NOCASE)
     GROUP BY e.id
     ORDER BY e.date DESC, e.created_at DESC`,
    [q, q, q, q],
  );
  return rows.map((r) => ({ ...toEvent(r), hostFamilyName: r.host_family_name, entryCount: r.entry_count }));
}

export async function listEventsHostedBy(familyId: ID): Promise<Event[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<EventRow>(`SELECT ${COLS} FROM events e WHERE e.host_family_id = ? ORDER BY e.date DESC`, [
    familyId,
  ]);
  return rows.map(toEvent);
}

export async function getEvent(id: ID): Promise<EventListItem | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<EventRow & { host_family_name: string | null; entry_count: number }>(
    `SELECT ${COLS}, f.name AS host_family_name, (SELECT COUNT(*) FROM entries en WHERE en.event_id = e.id) AS entry_count
     FROM events e LEFT JOIN families f ON f.id = e.host_family_id WHERE e.id = ?`,
    [id],
  );
  return row ? { ...toEvent(row), hostFamilyName: row.host_family_name, entryCount: row.entry_count } : null;
}

export async function createEvent(input: EventInput): Promise<Event> {
  const db = await getDb();
  const id = newId();
  const ts = nowISO();
  await db.runAsync(
    `INSERT INTO events (id, name, type, date, host_family_id, venue, notes, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?)`,
    [id, input.name.trim(), input.type, input.date, input.hostFamilyId ?? null, orNull(input.venue), orNull(input.notes), ts, ts],
  );
  return (await getEvent(id))!;
}

export async function updateEvent(id: ID, input: EventInput): Promise<Event> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE events SET name = ?, type = ?, date = ?, host_family_id = ?, venue = ?, notes = ?, updated_at = ? WHERE id = ?`,
    [input.name.trim(), input.type, input.date, input.hostFamilyId ?? null, orNull(input.venue), orNull(input.notes), nowISO(), id],
  );
  return (await getEvent(id))!;
}

export async function deleteEvent(id: ID): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM events WHERE id = ?`, [id]);
}

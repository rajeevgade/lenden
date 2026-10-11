import { getDb } from './database';
import { newId, nowISO } from '../domain/ids';
import type { Family, ID } from '../domain/types';
import { toFamily, type FamilyRow } from './rows';

export interface FamilyInput {
  name: string;
  relation?: string | null;
  city?: string | null;
  phone?: string | null;
  notes?: string | null;
}

export interface FamilyListItem extends Family {
  entryCount: number;
}

const COLS = 'id, name, relation, city, phone, notes, created_at, updated_at';
const F_COLS = 'f.id, f.name, f.relation, f.city, f.phone, f.notes, f.created_at, f.updated_at';

export async function listFamilies(search = ''): Promise<FamilyListItem[]> {
  const db = await getDb();
  const q = `%${search.trim()}%`;
  const rows = await db.getAllAsync<FamilyRow & { entry_count: number }>(
    `SELECT ${F_COLS}, COUNT(e.id) AS entry_count
     FROM families f LEFT JOIN entries e ON e.family_id = f.id
     WHERE (? = '%%' OR f.name LIKE ? COLLATE NOCASE OR f.city LIKE ? COLLATE NOCASE OR f.relation LIKE ? COLLATE NOCASE)
     GROUP BY f.id
     ORDER BY f.name COLLATE NOCASE ASC`,
    [q, q, q, q],
  );
  return rows.map((r) => ({ ...toFamily(r), entryCount: r.entry_count }));
}

/** Prefix/contains match for autocomplete, limited for speed. */
export async function searchFamilies(text: string, limit = 8): Promise<Family[]> {
  const db = await getDb();
  const t = text.trim();
  if (!t) {
    const rows = await db.getAllAsync<FamilyRow>(`SELECT ${COLS} FROM families ORDER BY updated_at DESC LIMIT ?`, [limit]);
    return rows.map(toFamily);
  }
  const rows = await db.getAllAsync<FamilyRow>(
    `SELECT ${COLS} FROM families
     WHERE name LIKE ? COLLATE NOCASE OR city LIKE ? COLLATE NOCASE
     ORDER BY CASE WHEN name LIKE ? COLLATE NOCASE THEN 0 ELSE 1 END, name COLLATE NOCASE
     LIMIT ?`,
    [`%${t}%`, `%${t}%`, `${t}%`, limit],
  );
  return rows.map(toFamily);
}

export async function getFamily(id: ID): Promise<Family | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<FamilyRow>(`SELECT ${COLS} FROM families WHERE id = ?`, [id]);
  return row ? toFamily(row) : null;
}

export async function createFamily(input: FamilyInput): Promise<Family> {
  const db = await getDb();
  const id = newId();
  const ts = nowISO();
  await db.runAsync(
    `INSERT INTO families (id, name, relation, city, phone, notes, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)`,
    [id, input.name.trim(), orNull(input.relation), orNull(input.city), orNull(input.phone), orNull(input.notes), ts, ts],
  );
  return (await getFamily(id))!;
}

export async function updateFamily(id: ID, input: FamilyInput): Promise<Family> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE families SET name = ?, relation = ?, city = ?, phone = ?, notes = ?, updated_at = ? WHERE id = ?`,
    [input.name.trim(), orNull(input.relation), orNull(input.city), orNull(input.phone), orNull(input.notes), nowISO(), id],
  );
  return (await getFamily(id))!;
}

export async function deleteFamily(id: ID): Promise<void> {
  const db = await getDb();
  await db.runAsync(`DELETE FROM families WHERE id = ?`, [id]);
}

export function orNull(v: string | null | undefined): string | null {
  const t = v?.trim();
  return t ? t : null;
}

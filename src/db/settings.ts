import { getDb } from './database';
import type { Settings } from '../domain/types';

export const DEFAULT_SETTINGS: Settings = {
  defaultCurrency: 'INR',
  householdName: '',
  locale: 'en-IN',
};

export async function getSettings(): Promise<Settings> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ key: string; value: string }>(`SELECT key, value FROM settings`);
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    defaultCurrency: map.defaultCurrency ?? DEFAULT_SETTINGS.defaultCurrency,
    householdName: map.householdName ?? DEFAULT_SETTINGS.householdName,
    locale: map.locale ?? DEFAULT_SETTINGS.locale,
  };
}

export async function setSetting<K extends keyof Settings>(key: K, value: Settings[K]): Promise<void> {
  const db = await getDb();
  await db.runAsync(`INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`, [
    key,
    String(value),
  ]);
}

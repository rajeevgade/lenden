import * as SQLite from 'expo-sqlite';
import { MIGRATIONS } from './migrations';

export type DB = SQLite.SQLiteDatabase;

let dbPromise: Promise<DB> | null = null;

/** Open (once) and migrate the app database. */
export function getDb(): Promise<DB> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('lenden.db');
      await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
      await migrate(db);
      return db;
    })();
  }
  return dbPromise;
}

async function migrate(db: DB): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;
  for (const m of MIGRATIONS) {
    if (m.version <= version) continue;
    await db.withTransactionAsync(async () => {
      await db.execAsync(m.sql);
      await db.execAsync(`PRAGMA user_version = ${m.version}`);
    });
    version = m.version;
  }
}

/** For tests and restore-from-backup: drop everything and re-run migrations. */
export async function resetDatabase(): Promise<DB> {
  const db = await getDb();
  await db.execAsync(`
    DROP TABLE IF EXISTS outfits;
    DROP TABLE IF EXISTS entries;
    DROP TABLE IF EXISTS events;
    DROP TABLE IF EXISTS families;
    DROP TABLE IF EXISTS settings;
    PRAGMA user_version = 0;
  `);
  await migrate(db);
  return db;
}

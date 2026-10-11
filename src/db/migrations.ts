export interface Migration {
  version: number;
  sql: string;
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    sql: `
      CREATE TABLE families (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        relation TEXT,
        city TEXT,
        phone TEXT,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX idx_families_name ON families(name COLLATE NOCASE);

      CREATE TABLE events (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        date TEXT NOT NULL,
        host_family_id TEXT REFERENCES families(id) ON DELETE SET NULL,
        venue TEXT,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX idx_events_date ON events(date);
      CREATE INDEX idx_events_host ON events(host_family_id);

      CREATE TABLE entries (
        id TEXT PRIMARY KEY NOT NULL,
        family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
        event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        direction TEXT NOT NULL CHECK (direction IN ('gave','received')),
        kind TEXT NOT NULL CHECK (kind IN ('cash','item')),
        amount_minor INTEGER,
        currency TEXT NOT NULL,
        item_description TEXT,
        photo_path TEXT,
        note TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX idx_entries_family ON entries(family_id);
      CREATE INDEX idx_entries_event ON entries(event_id);

      CREATE TABLE outfits (
        id TEXT PRIMARY KEY NOT NULL,
        event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        person_label TEXT NOT NULL,
        photo_path TEXT,
        note TEXT,
        created_at TEXT NOT NULL
      );
      CREATE INDEX idx_outfits_event ON outfits(event_id);

      CREATE TABLE settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `,
  },
];

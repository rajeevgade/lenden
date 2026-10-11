import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import JSZip from 'jszip';
import { getDb, resetDatabase } from '../db/database';
import type { EntryRow, EventRow, FamilyRow, OutfitRow } from '../db/rows';
import { listPhotoFiles } from './photos';
import { todayISO } from '../domain/dates';

export const BACKUP_FORMAT = 'lenden-backup';
export const BACKUP_VERSION = 1;

export interface BackupPayload {
  format: typeof BACKUP_FORMAT;
  version: number;
  exportedAt: string;
  families: FamilyRow[];
  events: EventRow[];
  entries: EntryRow[];
  outfits: OutfitRow[];
  settings: { key: string; value: string }[];
}

export async function buildBackupPayload(): Promise<BackupPayload> {
  const db = await getDb();
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    families: await db.getAllAsync<FamilyRow>('SELECT * FROM families'),
    events: await db.getAllAsync<EventRow>('SELECT * FROM events'),
    entries: await db.getAllAsync<EntryRow>('SELECT * FROM entries'),
    outfits: await db.getAllAsync<OutfitRow>('SELECT * FROM outfits'),
    settings: await db.getAllAsync<{ key: string; value: string }>('SELECT * FROM settings'),
  };
}

/** Pure: validate a parsed backup object. Throws with a readable message. */
export function validateBackup(obj: unknown): BackupPayload {
  if (!obj || typeof obj !== 'object') throw new Error('Not a backup file');
  const b = obj as Partial<BackupPayload>;
  if (b.format !== BACKUP_FORMAT) throw new Error('Not a LenDen backup');
  if (typeof b.version !== 'number' || b.version > BACKUP_VERSION) throw new Error('Backup is from a newer version of the app');
  for (const k of ['families', 'events', 'entries', 'outfits', 'settings'] as const) {
    if (!Array.isArray(b[k])) throw new Error(`Backup is missing ${k}`);
  }
  return b as BackupPayload;
}

export async function exportBackup(): Promise<void> {
  const payload = await buildBackupPayload();
  const zip = new JSZip();
  zip.file('data.json', JSON.stringify(payload));
  const docDir = FileSystem.documentDirectory!;
  for (const rel of await listPhotoFiles()) {
    const b64 = await FileSystem.readAsStringAsync(docDir + rel, { encoding: FileSystem.EncodingType.Base64 });
    zip.file(rel, b64, { base64: true });
  }
  const out = await zip.generateAsync({ type: 'base64', compression: 'DEFLATE' });
  const target = `${FileSystem.cacheDirectory}lenden-backup-${todayISO()}.zip`;
  await FileSystem.writeAsStringAsync(target, out, { encoding: FileSystem.EncodingType.Base64 });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(target, { mimeType: 'application/zip', UTI: 'public.zip-archive' });
  }
}

/** Returns false if the user cancelled the picker. */
export async function importBackup(): Promise<boolean> {
  const picked = await DocumentPicker.getDocumentAsync({ type: ['application/zip', 'application/octet-stream', '*/*'], copyToCacheDirectory: true });
  if (picked.canceled || !picked.assets[0]) return false;
  const uri = picked.assets[0].uri;
  const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  const zip = await JSZip.loadAsync(b64, { base64: true });
  const dataFile = zip.file('data.json');
  if (!dataFile) throw new Error('Backup is missing data.json');
  const payload = validateBackup(JSON.parse(await dataFile.async('string')));
  await restoreFromPayload(payload);

  const docDir = FileSystem.documentDirectory!;
  const photoDir = docDir + 'photos';
  await FileSystem.deleteAsync(photoDir, { idempotent: true });
  await FileSystem.makeDirectoryAsync(photoDir, { intermediates: true });
  const photoEntries = Object.keys(zip.files).filter((n) => n.startsWith('photos/') && !zip.files[n].dir);
  for (const name of photoEntries) {
    const content = await zip.files[name].async('base64');
    await FileSystem.writeAsStringAsync(docDir + name, content, { encoding: FileSystem.EncodingType.Base64 });
  }
  return true;
}

export async function restoreFromPayload(p: BackupPayload): Promise<void> {
  const db = await resetDatabase();
  await db.withTransactionAsync(async () => {
    for (const f of p.families) {
      await db.runAsync('INSERT INTO families (id,name,relation,city,phone,notes,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)', [
        f.id, f.name, f.relation, f.city, f.phone, f.notes, f.created_at, f.updated_at,
      ]);
    }
    for (const e of p.events) {
      await db.runAsync('INSERT INTO events (id,name,type,date,host_family_id,venue,notes,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)', [
        e.id, e.name, e.type, e.date, e.host_family_id, e.venue, e.notes, e.created_at, e.updated_at,
      ]);
    }
    for (const n of p.entries) {
      await db.runAsync(
        'INSERT INTO entries (id,family_id,event_id,direction,kind,amount_minor,currency,item_description,photo_path,note,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
        [n.id, n.family_id, n.event_id, n.direction, n.kind, n.amount_minor, n.currency, n.item_description, n.photo_path, n.note, n.created_at, n.updated_at],
      );
    }
    for (const o of p.outfits) {
      await db.runAsync('INSERT INTO outfits (id,event_id,person_label,photo_path,note,created_at) VALUES (?,?,?,?,?,?)', [
        o.id, o.event_id, o.person_label, o.photo_path, o.note, o.created_at,
      ]);
    }
    for (const s of p.settings) {
      await db.runAsync('INSERT INTO settings (key,value) VALUES (?,?)', [s.key, s.value]);
    }
  });
}

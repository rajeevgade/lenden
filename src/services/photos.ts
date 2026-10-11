import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { newId } from '../domain/ids';

/** Photos live under <documentDirectory>/photos/<id>.jpg; the DB stores only "photos/<id>.jpg". */
const PHOTOS_DIR = 'photos';

function docDir(): string {
  const d = FileSystem.documentDirectory;
  if (!d) throw new Error('No document directory available');
  return d;
}

export function photoUri(relativePath: string | null | undefined): string | null {
  return relativePath ? docDir() + relativePath : null;
}

async function ensureDir(): Promise<void> {
  const dir = docDir() + PHOTOS_DIR;
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
}

/** Copy a picked image into app storage and return its relative path. */
async function importPhoto(sourceUri: string): Promise<string> {
  await ensureDir();
  const rel = `${PHOTOS_DIR}/${newId()}.jpg`;
  await FileSystem.copyAsync({ from: sourceUri, to: docDir() + rel });
  return rel;
}

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  quality: 0.7,
  allowsEditing: false,
  exif: false,
};

export async function pickFromLibrary(): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;
  const res = await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
  if (res.canceled || !res.assets[0]) return null;
  return importPhoto(res.assets[0].uri);
}

export async function takePhoto(): Promise<string | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return null;
  const res = await ImagePicker.launchCameraAsync(PICKER_OPTIONS);
  if (res.canceled || !res.assets[0]) return null;
  return importPhoto(res.assets[0].uri);
}

export async function deletePhoto(relativePath: string | null | undefined): Promise<void> {
  if (!relativePath) return;
  try {
    await FileSystem.deleteAsync(docDir() + relativePath, { idempotent: true });
  } catch {
    // best effort
  }
}

export async function listPhotoFiles(): Promise<string[]> {
  await ensureDir();
  const names = await FileSystem.readDirectoryAsync(docDir() + PHOTOS_DIR);
  return names.map((n) => `${PHOTOS_DIR}/${n}`);
}

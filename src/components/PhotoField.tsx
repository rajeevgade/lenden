import React from 'react';
import { ActionSheetIOS, Alert, Image, Platform, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { deletePhoto, photoUri, pickFromLibrary, takePhoto } from '../services/photos';
import { t } from '../i18n';
import { colors, font, radius, space } from '../theme';

/** Shows the current photo (relative path) and lets the user replace or remove it. */
export function PhotoField({ value, onChange, aspect = 3 / 4 }: { value: string | null; onChange: (rel: string | null) => void; aspect?: number }) {
  async function choose() {
    const options = [t.common.takePhoto, t.common.chooseFromLibrary, ...(value ? [t.common.removePhoto] : []), t.common.cancel];
    const run = async (index: number) => {
      try {
        if (index === 0) {
          const p = await takePhoto();
          if (p) {
            await deletePhoto(value);
            onChange(p);
          }
        } else if (index === 1) {
          const p = await pickFromLibrary();
          if (p) {
            await deletePhoto(value);
            onChange(p);
          }
        } else if (value && index === 2) {
          await deletePhoto(value);
          onChange(null);
        }
      } catch (e) {
        Alert.alert(t.common.error, String(e));
      }
    };
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: options.length - 1, destructiveButtonIndex: value ? 2 : undefined },
        (i) => void run(i),
      );
    } else {
      Alert.alert(t.common.photo, undefined, [
        { text: t.common.takePhoto, onPress: () => void run(0) },
        { text: t.common.chooseFromLibrary, onPress: () => void run(1) },
        ...(value ? [{ text: t.common.removePhoto, style: 'destructive' as const, onPress: () => void run(2) }] : []),
        { text: t.common.cancel, style: 'cancel' as const },
      ]);
    }
  }

  return (
    <Pressable onPress={choose} style={{ alignSelf: 'flex-start' }}>
      {value ? (
        <Image source={{ uri: photoUri(value)! }} style={{ width: 160, aspectRatio: aspect, borderRadius: radius.md, backgroundColor: colors.chipBg }} />
      ) : (
        <View style={{ width: 160, aspectRatio: aspect, borderRadius: radius.md, backgroundColor: colors.chipBg, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: space.xs }}>
          <Ionicons name="camera-outline" size={32} color={colors.textMuted} />
          <Text style={font.caption}>{t.common.addPhoto}</Text>
        </View>
      )}
    </Pressable>
  );
}

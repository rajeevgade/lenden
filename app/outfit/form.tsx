import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { createOutfit, deleteOutfit, getOutfit, listPersonLabels, updateOutfit } from '../../src/db';
import { Button, Chip, ChipRow, Field, HeaderButton, Input, Loading, Screen, Spacer } from '../../src/components/ui';
import { PhotoField } from '../../src/components/PhotoField';
import { deletePhoto } from '../../src/services/photos';
import { t } from '../../src/i18n';
import { space } from '../../src/theme';

export default function OutfitFormScreen() {
  const { id, eventId } = useLocalSearchParams<{ id?: string; eventId: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [person, setPerson] = useState('');
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [labels, setLabels] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLabels(await listPersonLabels());
      if (id) {
        const o = await getOutfit(id);
        if (o) {
          setPerson(o.personLabel);
          setNote(o.note ?? '');
          setPhoto(o.photoPath);
        }
      }
      setLoading(false);
    })();
  }, [id]);

  async function onSave() {
    if (!person.trim()) {
      setError(t.outfit.errorPerson);
      return;
    }
    setSaving(true);
    try {
      const input = { eventId, personLabel: person, photoPath: photo, note };
      if (id) await updateOutfit(id, input);
      else await createOutfit(input);
      router.back();
    } catch (e) {
      Alert.alert(t.common.error, String(e));
      setSaving(false);
    }
  }

  function onDelete() {
    Alert.alert(t.common.confirmDeleteTitle, t.common.confirmDeleteBody, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.common.delete,
        style: 'destructive',
        onPress: async () => {
          await deletePhoto(photo);
          await deleteOutfit(id!);
          router.back();
        },
      },
    ]);
  }

  if (loading) return <Loading />;

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: id ? t.outfit.editOutfit : t.outfit.newOutfit,
          headerLeft: () => <HeaderButton label={t.common.cancel} bold={false} onPress={() => router.back()} />,
          headerRight: () => <HeaderButton label={t.common.save} onPress={onSave} disabled={saving} />,
        }}
      />
      <Field label={t.common.photo}>
        <PhotoField value={photo} onChange={setPhoto} />
      </Field>
      <Field label={t.outfit.person} error={error}>
        <Input value={person} onChangeText={(v) => { setPerson(v); setError(null); }} placeholder={t.outfit.personPlaceholder} invalid={!!error} autoCapitalize="words" autoFocus={!id} />
        {labels.length ? (
          <ChipRow>
            {labels.map((l) => (
              <Chip key={l} label={l} selected={person === l} onPress={() => setPerson(l)} />
            ))}
          </ChipRow>
        ) : null}
      </Field>
      <Field label={`${t.outfit.note} (${t.common.optional})`}>
        <Input value={note} onChangeText={setNote} placeholder={t.outfit.notePlaceholder} autoCapitalize="sentences" multiline style={{ minHeight: 72, paddingTop: 12 }} />
      </Field>
      <Spacer />
      <Button label={t.common.save} onPress={onSave} loading={saving} disabled={saving} />
      {id ? (
        <>
          <Spacer h={space.xl} />
          <Button label={t.common.delete} variant="destructive" onPress={onDelete} />
        </>
      ) : null}
    </Screen>
  );
}

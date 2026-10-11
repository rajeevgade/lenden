import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { createFamily, getFamily, updateFamily } from '../../src/db';
import { Button, Field, Input, Loading, Screen, Spacer } from '../../src/components/ui';
import { t } from '../../src/i18n';

export default function FamilyFormScreen() {
  const { id, name: prefillName } = useLocalSearchParams<{ id?: string; name?: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(prefillName ?? '');
  const [relation, setRelation] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getFamily(id).then((f) => {
      if (f) {
        setName(f.name);
        setRelation(f.relation ?? '');
        setCity(f.city ?? '');
        setPhone(f.phone ?? '');
        setNotes(f.notes ?? '');
      }
      setLoading(false);
    });
  }, [id]);

  async function onSave() {
    if (!name.trim()) {
      setNameError(t.common.requiredField);
      return;
    }
    setSaving(true);
    try {
      const input = { name, relation, city, phone, notes };
      if (id) {
        await updateFamily(id, input);
        router.back();
      } else {
        const f = await createFamily(input);
        router.replace({ pathname: '/family/[id]', params: { id: f.id } });
      }
    } catch (e) {
      Alert.alert(t.common.error, String(e));
      setSaving(false);
    }
  }

  if (loading) return <Loading />;

  return (
    <Screen>
      <Stack.Screen options={{ title: id ? t.families.editFamily : t.families.newFamily }} />
      <Field label={t.families.name} error={nameError}>
        <Input value={name} onChangeText={(v) => { setName(v); setNameError(null); }} placeholder={t.families.namePlaceholder} autoFocus autoCapitalize="words" returnKeyType="next" />
      </Field>
      <Field label={`${t.families.relation} (${t.common.optional})`}>
        <Input value={relation} onChangeText={setRelation} placeholder={t.families.relationPlaceholder} autoCapitalize="sentences" />
      </Field>
      <Field label={`${t.families.city} (${t.common.optional})`}>
        <Input value={city} onChangeText={setCity} autoCapitalize="words" />
      </Field>
      <Field label={`${t.families.phone} (${t.common.optional})`}>
        <Input value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      </Field>
      <Field label={`${t.common.notes} (${t.common.optional})`}>
        <Input value={notes} onChangeText={setNotes} multiline style={{ minHeight: 80, paddingTop: 12 }} />
      </Field>
      <Spacer />
      <Button label={t.common.save} onPress={onSave} loading={saving} disabled={saving} />
      <Spacer h={8} />
      <Button label={t.common.cancel} variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}

import React, { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, Text } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { createEvent, getEvent, getFamily, updateEvent } from '../../src/db';
import { EVENT_TYPES, type EventType, type Family } from '../../src/domain/types';
import { formatISODate, isValidISODate, todayISO } from '../../src/domain/dates';
import { Button, Chip, ChipRow, Field, Input, Loading, Screen, Segmented, Spacer } from '../../src/components/ui';
import { FamilyPicker } from '../../src/components/FamilyPicker';
import { t } from '../../src/i18n';
import { colors, font, radius, space } from '../../src/theme';

export default function EventFormScreen() {
  const { id, hostFamilyId } = useLocalSearchParams<{ id?: string; hostFamilyId?: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(!!id || !!hostFamilyId);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<EventType>('wedding');
  const [date, setDate] = useState(todayISO());
  const [showPicker, setShowPicker] = useState(false);
  const [hostMode, setHostMode] = useState<'us' | 'them'>(hostFamilyId ? 'them' : 'us');
  const [host, setHost] = useState<Family | null>(null);
  const [venue, setVenue] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<{ name?: string; date?: string; host?: string }>({});

  useEffect(() => {
    (async () => {
      if (id) {
        const e = await getEvent(id);
        if (e) {
          setName(e.name);
          setType(e.type);
          setDate(e.date);
          setVenue(e.venue ?? '');
          setNotes(e.notes ?? '');
          if (e.hostFamilyId) {
            setHostMode('them');
            setHost(await getFamily(e.hostFamilyId));
          }
        }
      } else if (hostFamilyId) {
        setHost(await getFamily(hostFamilyId));
      }
      setLoading(false);
    })();
  }, [id, hostFamilyId]);

  async function onSave() {
    const errs: typeof errors = {};
    if (!name.trim()) errs.name = t.common.requiredField;
    if (!isValidISODate(date)) errs.date = t.events.datePlaceholder;
    if (hostMode === 'them' && !host) errs.host = t.entry.errorFamily;
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      const input = { name, type, date, hostFamilyId: hostMode === 'them' ? host!.id : null, venue, notes };
      if (id) {
        await updateEvent(id, input);
        router.back();
      } else {
        const e = await createEvent(input);
        router.replace({ pathname: '/event/[id]', params: { id: e.id } });
      }
    } catch (e) {
      Alert.alert(t.common.error, String(e));
      setSaving(false);
    }
  }

  if (loading) return <Loading />;

  const dateObj = isValidISODate(date) ? new Date(date + 'T12:00:00') : new Date();

  return (
    <Screen>
      <Stack.Screen options={{ title: id ? t.events.editEvent : t.events.newEvent }} />

      <Field label={t.events.host} error={errors.host}>
        <Segmented
          value={hostMode}
          options={[
            { value: 'us', label: t.events.hostUs },
            { value: 'them', label: t.events.hostPlaceholder },
          ]}
          onChange={setHostMode}
        />
        {hostMode === 'them' ? (
          <>
            <Spacer h={space.sm} />
            <FamilyPicker value={host} onChange={setHost} />
          </>
        ) : null}
      </Field>

      <Field label={t.events.name} error={errors.name}>
        <Input value={name} onChangeText={setName} placeholder={t.events.namePlaceholder} autoCapitalize="sentences" />
      </Field>

      <Field label={t.events.type}>
        <ChipRow>
          {EVENT_TYPES.map((et) => (
            <Chip key={et} label={t.eventTypes[et]} selected={type === et} onPress={() => setType(et)} />
          ))}
        </ChipRow>
      </Field>

      <Field label={t.events.date} error={errors.date}>
        <Pressable
          onPress={() => setShowPicker(true)}
          style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, minHeight: 52, justifyContent: 'center', paddingHorizontal: space.md }}
        >
          <Text style={font.body}>{formatISODate(date)}</Text>
        </Pressable>
        {showPicker ? (
          <DateTimePicker
            value={dateObj}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={(ev, d) => {
              if (Platform.OS !== 'ios') setShowPicker(false);
              if (ev.type === 'dismissed' || !d) return;
              setDate(todayISO(d));
              if (Platform.OS === 'ios') setShowPicker(false);
            }}
          />
        ) : null}
      </Field>

      <Field label={`${t.events.venue} (${t.common.optional})`}>
        <Input value={venue} onChangeText={setVenue} autoCapitalize="words" />
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

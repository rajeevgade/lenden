import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  createEntry,
  deleteEntry,
  getEntry,
  getEvent,
  getFamily,
  listEntriesForFamily,
  updateEntry,
  type EventListItem,
} from '../../src/db';
import type { Direction, EntryKind, EntryWithEvent, Family } from '../../src/domain/types';
import { formatMoney, parseMoney, toMajorString, SUPPORTED_CURRENCIES, currencyInfo } from '../../src/domain/money';
import { suggestGift } from '../../src/domain/ledger';
import { formatISODate } from '../../src/domain/dates';
import { useSettings } from '../../src/hooks/useSettings';
import { Button, Caption, Chip, ChipRow, Field, Input, Loading, Screen, Segmented, Spacer } from '../../src/components/ui';
import { FamilyPicker } from '../../src/components/FamilyPicker';
import { EventPicker } from '../../src/components/EventPicker';
import { PhotoField } from '../../src/components/PhotoField';
import { deletePhoto } from '../../src/services/photos';
import { t } from '../../src/i18n';
import { colors, font, radius, space } from '../../src/theme';

type Params = { id?: string; familyId?: string; eventId?: string; direction?: Direction };

export default function EntryFormScreen() {
  const params = useLocalSearchParams<Params>();
  const router = useRouter();
  const { settings } = useSettings();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [family, setFamily] = useState<Family | null>(null);
  const [event, setEvent] = useState<EventListItem | null>(null);
  const [direction, setDirection] = useState<Direction>(params.direction ?? 'received');
  const [kind, setKind] = useState<EntryKind>('cash');
  const [amountText, setAmountText] = useState('');
  const [currency, setCurrency] = useState(settings.defaultCurrency);
  const [item, setItem] = useState('');
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [history, setHistory] = useState<EntryWithEvent[]>([]);
  const [errors, setErrors] = useState<{ family?: string; event?: string; amount?: string; item?: string }>({});

  const isEdit = !!params.id;

  // Load edit target or prefills.
  useEffect(() => {
    (async () => {
      if (params.id) {
        const e = await getEntry(params.id);
        if (e) {
          setFamily(await getFamily(e.familyId));
          setEvent(await getEvent(e.eventId));
          setDirection(e.direction);
          setKind(e.kind);
          setCurrency(e.currency);
          setAmountText(e.amountMinor != null ? toMajorString(e.amountMinor, e.currency) : '');
          setItem(e.itemDescription ?? '');
          setNote(e.note ?? '');
          setPhoto(e.photoPath);
        }
      } else {
        if (params.familyId) setFamily(await getFamily(params.familyId));
        if (params.eventId) {
          const ev = await getEvent(params.eventId);
          setEvent(ev);
          // At their function we are usually giving; at ours we are receiving.
          if (!params.direction && ev) setDirection(ev.hostFamilyId ? 'gave' : 'received');
        }
      }
      setLoading(false);
    })();
  }, [params.id, params.familyId, params.eventId, params.direction]);

  // Keep currency in sync with settings for new entries only.
  useEffect(() => {
    if (!isEdit) setCurrency((c) => c || settings.defaultCurrency);
  }, [settings.defaultCurrency, isEdit]);

  // History for suggestion.
  useEffect(() => {
    if (family) listEntriesForFamily(family.id).then(setHistory);
    else setHistory([]);
  }, [family?.id]);

  const suggestion = useMemo(() => (direction === 'gave' ? suggestGift(history, event?.type ?? null) : null), [history, direction, event?.type]);

  async function onSave() {
    const errs: typeof errors = {};
    if (!family) errs.family = t.entry.errorFamily;
    if (!event) errs.event = t.entry.errorEvent;
    const amountMinor = parseMoney(amountText, currency);
    if (kind === 'cash' && amountMinor == null) errs.amount = t.entry.errorAmount;
    if (kind === 'item' && !item.trim()) errs.item = t.entry.errorItem;
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    try {
      const input = {
        familyId: family!.id,
        eventId: event!.id,
        direction,
        kind,
        amountMinor: kind === 'cash' ? amountMinor : amountMinor ?? null,
        currency,
        itemDescription: kind === 'item' ? item : null,
        photoPath: photo,
        note,
      };
      if (params.id) await updateEntry(params.id, input);
      else await createEntry(input);
      router.back();
    } catch (e) {
      Alert.alert(t.common.error, String(e));
      setSaving(false);
    }
  }

  function onDelete() {
    Alert.alert(t.common.confirmDeleteTitle, t.entry.deleteWarning, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.common.delete,
        style: 'destructive',
        onPress: async () => {
          await deletePhoto(photo);
          await deleteEntry(params.id!);
          router.back();
        },
      },
    ]);
  }

  if (loading) return <Loading />;

  const sym = currencyInfo(currency).symbol;

  return (
    <Screen>
      <Stack.Screen options={{ title: isEdit ? t.entry.editEntry : t.entry.newEntry }} />

      <Field label={t.entry.family} error={errors.family}>
        <FamilyPicker value={family} onChange={setFamily} autoFocus={!family && !isEdit} />
      </Field>

      <Field label={t.entry.event} error={errors.event}>
        <EventPicker value={event} onChange={setEvent} />
      </Field>

      <Field label="">
        <Segmented
          value={direction}
          options={[
            { value: 'received', label: t.direction.received },
            { value: 'gave', label: t.direction.gave },
          ]}
          onChange={setDirection}
          colorsFor={(d) => (d === 'gave' ? colors.gave : colors.received)}
        />
      </Field>

      {suggestion ? (
        <Pressable
          onPress={() => {
            if (suggestion.basis.kind === 'cash' && suggestion.basis.amountMinor != null) {
              setKind('cash');
              setCurrency(suggestion.basis.currency);
              setAmountText(toMajorString(suggestion.basis.amountMinor, suggestion.basis.currency));
            }
          }}
          style={{ backgroundColor: colors.surfaceAlt, borderColor: colors.accent, borderWidth: 1, borderRadius: radius.md, padding: space.md, marginBottom: space.lg }}
        >
          <Text style={[font.label, { color: colors.accent }]}>{t.entry.suggestionLabel}</Text>
          <Text style={[font.bodyStrong, { marginTop: 2 }]}>
            {suggestion.basis.kind === 'cash' && suggestion.basis.amountMinor != null
              ? formatMoney(suggestion.basis.amountMinor, suggestion.basis.currency)
              : suggestion.basis.itemDescription}
            {'  '}
            <Text style={font.caption}>
              {suggestion.basis.event.name} · {formatISODate(suggestion.basis.event.date)}
            </Text>
          </Text>
          {suggestion.basis.kind === 'cash' ? <Caption style={{ color: colors.primary, marginTop: 2 }}>{t.entry.useAmount} →</Caption> : null}
        </Pressable>
      ) : null}

      <Field label="">
        <Segmented
          value={kind}
          options={[
            { value: 'cash', label: t.kind.cash },
            { value: 'item', label: t.kind.item },
          ]}
          onChange={setKind}
        />
      </Field>

      {kind === 'item' ? (
        <Field label={t.entry.itemDescription} error={errors.item}>
          <Input value={item} onChangeText={setItem} placeholder={t.entry.itemPlaceholder} autoCapitalize="sentences" />
        </Field>
      ) : null}

      <Field label={kind === 'cash' ? t.entry.amount : `${t.entry.estValue} (${t.common.optional})`} error={errors.amount}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
          <Text style={[font.money, { color: colors.textMuted }]}>{sym}</Text>
          <Input
            value={amountText}
            onChangeText={setAmountText}
            keyboardType="decimal-pad"
            placeholder="0"
            style={{ flex: 1, fontSize: 26, fontWeight: '700' }}
          />
        </View>
        <ChipRow>
          {SUPPORTED_CURRENCIES.map((c) => (
            <Chip key={c} label={c} selected={currency === c} onPress={() => setCurrency(c)} />
          ))}
        </ChipRow>
      </Field>

      <Field label={`${t.entry.note} (${t.common.optional})`}>
        <Input value={note} onChangeText={setNote} placeholder={t.entry.notePlaceholder} autoCapitalize="sentences" />
      </Field>

      <Field label={`${t.common.photo} (${t.common.optional})`}>
        <PhotoField value={photo} onChange={setPhoto} aspect={1} />
      </Field>

      <Spacer />
      <Button label={t.common.save} onPress={onSave} loading={saving} disabled={saving} />
      <Spacer h={8} />
      <Button label={t.common.cancel} variant="ghost" onPress={() => router.back()} />
      {isEdit ? (
        <>
          <Spacer h={space.xl} />
          <Button label={t.common.delete} variant="ghost" onPress={onDelete} style={{ alignSelf: 'center' }} />
        </>
      ) : null}
    </Screen>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { createEntry, getEvent, listEntriesForEvent, type EventListItem } from '../../../src/db';
import type { Direction, EntryKind, EntryWithFamily, Family } from '../../../src/domain/types';
import { currencyInfo, parseMoney } from '../../../src/domain/money';
import { useSettings } from '../../../src/hooks/useSettings';
import { Button, Caption, Input, Loading, Spacer } from '../../../src/components/ui';
import { FamilyPicker } from '../../../src/components/FamilyPicker';
import { EntryLine } from '../../../src/components/EntryLine';
import { t } from '../../../src/i18n';
import { colors, font, radius, space } from '../../../src/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function QuickAddScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { settings } = useSettings();

  const [event, setEvent] = useState<EventListItem | null>(null);
  const [family, setFamily] = useState<Family | null>(null);
  const [direction, setDirection] = useState<Direction>('received');
  const [kind, setKind] = useState<EntryKind>('cash');
  const [amountText, setAmountText] = useState('');
  const [item, setItem] = useState('');
  const [note, setNote] = useState('');
  const [recent, setRecent] = useState<EntryWithFamily[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const familyInput = useRef<TextInput | null>(null);
  const amountInput = useRef<TextInput | null>(null);

  useEffect(() => {
    getEvent(id).then((e) => {
      setEvent(e);
      if (e) setDirection(e.hostFamilyId ? 'gave' : 'received');
    });
    listEntriesForEvent(id).then((l) => setRecent(l.slice(0, 5)));
  }, [id]);

  const currency = settings.defaultCurrency;

  async function onSave() {
    if (!family) {
      setError(t.entry.errorFamily);
      return;
    }
    const amountMinor = parseMoney(amountText, currency);
    if (kind === 'cash' && amountMinor == null) {
      setError(t.entry.errorAmount);
      return;
    }
    if (kind === 'item' && !item.trim()) {
      setError(t.entry.errorItem);
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const saved = await createEntry({
        familyId: family.id,
        eventId: id,
        direction,
        kind,
        amountMinor: kind === 'cash' ? amountMinor : amountMinor ?? null,
        currency,
        itemDescription: kind === 'item' ? item : null,
        note,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setRecent((r) => [{ ...saved, family: { id: family.id, name: family.name, city: family.city } }, ...r].slice(0, 5));
      setSavedCount((n) => n + 1);
      setFamily(null);
      setAmountText('');
      setItem('');
      setNote('');
      setTimeout(() => familyInput.current?.focus(), 50);
    } catch (e) {
      Alert.alert(t.common.error, String(e));
    } finally {
      setSaving(false);
    }
  }

  if (!event) return <Loading />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: t.quickAdd.title,
          headerRight: () => (
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <Text style={[font.bodyStrong, { color: colors.primary }]}>{t.common.done}</Text>
            </Pressable>
          ),
        }}
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <ScrollView contentContainerStyle={{ padding: space.lg }} keyboardShouldPersistTaps="handled">
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[font.caption, { flex: 1 }]} numberOfLines={1}>
              {t.quickAdd.receivedAt(event.name)}
            </Text>
            <Text style={[font.caption, { color: colors.primary, fontWeight: '700' }]}>{t.quickAdd.saved(savedCount)}</Text>
          </View>
          <Spacer />

          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radius.lg,
              padding: space.lg,
              borderWidth: 2,
              borderColor: direction === 'gave' ? colors.gave : colors.received,
            }}
          >
            <Text style={[font.label, { color: direction === 'gave' ? colors.gave : colors.received, marginBottom: space.sm }]}>
              {direction === 'gave' ? t.direction.gave : t.direction.received}
            </Text>

            <FamilyPicker
              value={family}
              onChange={(f) => {
                setFamily(f);
                if (f) setTimeout(() => amountInput.current?.focus(), 50);
              }}
              placeholder={t.quickAdd.familyPlaceholder}
              autoFocus
              inputRef={familyInput}
            />
            <Spacer h={space.md} />

            {kind === 'cash' ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                <Text style={[font.bigMoney, { color: colors.textMuted }]}>{currencyInfo(currency).symbol}</Text>
                <Input
                  ref={amountInput}
                  value={amountText}
                  onChangeText={setAmountText}
                  keyboardType="decimal-pad"
                  placeholder={t.quickAdd.amountPlaceholder}
                  returnKeyType="done"
                  onSubmitEditing={onSave}
                  style={{ flex: 1, fontSize: 36, fontWeight: '700', minHeight: 64 }}
                />
              </View>
            ) : (
              <Input ref={amountInput} value={item} onChangeText={setItem} placeholder={t.entry.itemPlaceholder} returnKeyType="done" onSubmitEditing={onSave} autoCapitalize="sentences" />
            )}
            <Spacer h={space.sm} />
            <Input value={note} onChangeText={setNote} placeholder={t.entry.notePlaceholder} returnKeyType="done" onSubmitEditing={onSave} style={{ minHeight: 44, fontSize: 16 }} />

            {error ? <Text style={{ color: colors.danger, marginTop: space.sm }}>{error}</Text> : null}
            <Spacer h={space.md} />
            <Button label={t.quickAdd.saveNext} onPress={onSave} loading={saving} disabled={saving} style={{ minHeight: 60 }} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: space.md }}>
              <Pressable onPress={() => setKind((k) => (k === 'cash' ? 'item' : 'cash'))} hitSlop={8}>
                <Caption style={{ color: colors.primary }}>{kind === 'cash' ? t.quickAdd.itemInstead : t.quickAdd.cashInstead}</Caption>
              </Pressable>
              <Pressable onPress={() => setDirection((d) => (d === 'gave' ? 'received' : 'gave'))} hitSlop={8}>
                <Caption style={{ color: colors.primary }}>{direction === 'gave' ? t.quickAdd.switchToReceived : t.quickAdd.switchToGave}</Caption>
              </Pressable>
            </View>
          </View>

          {recent.length ? (
            <>
              <Spacer h={space.xl} />
              <Text style={[font.label, { marginBottom: space.sm }]}>{t.quickAdd.recent}</Text>
              {recent.map((e) => (
                <EntryLine key={e.id} entry={e} subtitle={e.family.name} onPress={() => router.push({ pathname: '/entry/form', params: { id: e.id } })} />
              ))}
            </>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

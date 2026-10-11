import React, { useMemo, useState } from 'react';
import { Alert, Image, Pressable, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { deleteEvent, getEvent, listEntriesForEvent, listOutfitsForEvent } from '../../../src/db';
import { totalsByCurrency } from '../../../src/domain/ledger';
import { formatISODate } from '../../../src/domain/dates';
import { useFocusedQuery } from '../../../src/hooks/useAsync';
import { Body, Button, Caption, Card, EmptyState, Loading, Row, Screen, Section, Spacer } from '../../../src/components/ui';
import { MoneyText } from '../../../src/components/MoneyText';
import { EntryLine } from '../../../src/components/EntryLine';
import { photoUri } from '../../../src/services/photos';
import { exportEventPdf } from '../../../src/services/pdf';
import { t } from '../../../src/i18n';
import { colors, font, hit, radius, space } from '../../../src/theme';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [exporting, setExporting] = useState(false);

  const q = useFocusedQuery(async () => {
    const [event, entries, outfits] = await Promise.all([getEvent(id), listEntriesForEvent(id), listOutfitsForEvent(id)]);
    return { event, entries, outfits };
  }, [id]);

  const totals = useMemo(() => totalsByCurrency(q.data?.entries ?? []), [q.data]);

  if (q.loading && !q.data) return <Loading />;
  const event = q.data?.event;
  if (!event) return <EmptyState title={t.common.error} />;
  const ours = event.hostFamilyId == null;

  function onDelete() {
    Alert.alert(t.common.confirmDeleteTitle, t.common.confirmDeleteBody, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.common.delete,
        style: 'destructive',
        onPress: async () => {
          await deleteEvent(id);
          router.back();
        },
      },
    ]);
  }

  async function onExport() {
    setExporting(true);
    try {
      await exportEventPdf(event!, q.data!.entries);
    } catch (e) {
      Alert.alert(t.common.error, String(e));
    } finally {
      setExporting(false);
    }
  }

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: event.name,
          headerRight: () => (
            <Row>
              <Pressable hitSlop={hit} onPress={onExport} disabled={exporting} accessibilityLabel={t.common.exportPdf}>
                <Ionicons name="share-outline" size={24} color={colors.primary} />
              </Pressable>
              <Pressable hitSlop={hit} onPress={() => router.push({ pathname: '/event/form', params: { id } })} accessibilityLabel={t.common.edit}>
                <Ionicons name="create-outline" size={24} color={colors.primary} />
              </Pressable>
            </Row>
          ),
        }}
      />

      <Caption style={{ marginBottom: space.md }}>
        {formatISODate(event.date)} · {t.eventTypes[event.type]}
        {event.venue ? ` · ${event.venue}` : ''}
      </Caption>
      {event.hostFamilyName ? (
        <Pressable onPress={() => router.push({ pathname: '/family/[id]', params: { id: event.hostFamilyId! } })} hitSlop={hit} style={{ marginBottom: space.md }}>
          <Text style={[font.bodyStrong, { color: colors.primary }]}>{t.events.hostedBy(event.hostFamilyName)}</Text>
        </Pressable>
      ) : (
        <Text style={[font.bodyStrong, { marginBottom: space.md }]}>{t.events.ourEvent}</Text>
      )}

      {/* Totals + actions */}
      <Card>
        {totals.length === 0 ? (
          <Body muted>{t.event.giftsEmpty}</Body>
        ) : (
          totals.map((tt, i) => (
            <Row key={tt.currency} style={{ justifyContent: 'space-between', marginTop: i ? space.md : 0 }}>
              <View>
                <Caption>{t.event.totalReceived}</Caption>
                <MoneyText amountMinor={tt.receivedMinor} currency={tt.currency} direction="received" />
                <Caption>{t.events.entries(tt.receivedCount)}</Caption>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Caption>{t.event.totalGave}</Caption>
                <MoneyText amountMinor={tt.gaveMinor} currency={tt.currency} direction="gave" />
                <Caption>{t.events.entries(tt.gaveCount)}</Caption>
              </View>
            </Row>
          ))
        )}
        <Spacer h={space.lg} />
        {ours ? (
          <>
            <Button label={t.event.quickAdd} onPress={() => router.push({ pathname: '/event/[id]/quick-add', params: { id } })} />
            <Caption style={{ textAlign: 'center', marginTop: space.xs }}>{t.event.quickAddHint}</Caption>
            <Spacer h={space.sm} />
            <Button label={t.event.addGift} variant="secondary" onPress={() => router.push({ pathname: '/entry/form', params: { eventId: id } })} />
          </>
        ) : (
          <Button label={t.event.addGift} onPress={() => router.push({ pathname: '/entry/form', params: { eventId: id, familyId: event.hostFamilyId!, direction: 'gave' } })} />
        )}
      </Card>

      <Spacer h={space.xl} />

      <Section title={t.event.gifts}>
        {q.data!.entries.length === 0 ? (
          <Body muted>{t.event.giftsEmpty}</Body>
        ) : (
          q.data!.entries.map((e) => (
            <EntryLine key={e.id} entry={e} subtitle={e.family.name} onPress={() => router.push({ pathname: '/entry/form', params: { id: e.id } })} />
          ))
        )}
      </Section>

      <Section
        title={t.event.outfits}
        right={
          <Pressable hitSlop={hit} onPress={() => router.push({ pathname: '/outfit/form', params: { eventId: id } })}>
            <Text style={[font.caption, { color: colors.primary, fontWeight: '700' }]}>＋ {t.event.addOutfit}</Text>
          </Pressable>
        }
      >
        {q.data!.outfits.length === 0 ? (
          <Body muted>{t.event.outfitsEmpty}</Body>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
            {q.data!.outfits.map((o) => (
              <Pressable key={o.id} onPress={() => router.push({ pathname: '/outfit/form', params: { id: o.id, eventId: id } })} style={{ width: '47%' }}>
                {o.photoPath ? (
                  <Image source={{ uri: photoUri(o.photoPath)! }} style={{ width: '100%', aspectRatio: 3 / 4, borderRadius: radius.md, backgroundColor: colors.chipBg }} />
                ) : (
                  <View style={{ width: '100%', aspectRatio: 3 / 4, borderRadius: radius.md, backgroundColor: colors.chipBg, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="shirt-outline" size={36} color={colors.textMuted} />
                  </View>
                )}
                <Text style={[font.bodyStrong, { marginTop: space.xs }]}>{o.personLabel}</Text>
                {o.note ? <Caption>{o.note}</Caption> : null}
              </Pressable>
            ))}
          </View>
        )}
      </Section>

      <Spacer h={space.xl} />
      <Button label={t.common.delete} variant="ghost" onPress={onDelete} style={{ alignSelf: 'center' }} />
    </Screen>
  );
}

import React, { useMemo, useState } from 'react';
import { Alert, Image, Pressable, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { deleteEvent, getEvent, listEntriesForEvent, listOutfitsForEvent } from '../../../src/db';
import { totalsByCurrency } from '../../../src/domain/ledger';
import { formatISODate } from '../../../src/domain/dates';
import { useFocusedQuery } from '../../../src/hooks/useAsync';
import { Button, Card, EmptyState, Group, HeaderIcon, Loading, Row, Screen, Section, Spacer, Txt } from '../../../src/components/ui';
import { MoneyText } from '../../../src/components/MoneyText';
import { EntryLine } from '../../../src/components/EntryLine';
import { photoUri } from '../../../src/services/photos';
import { exportEventPdf } from '../../../src/services/pdf';
import { t } from '../../../src/i18n';
import { hit, radius, space, useTheme } from '../../../src/theme';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
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
              <HeaderIcon name="share-outline" label={t.common.exportPdf} onPress={onExport} disabled={exporting} />
              <HeaderIcon name="create-outline" label={t.common.edit} onPress={() => router.push({ pathname: '/event/form', params: { id } })} />
            </Row>
          ),
        }}
      />

      <View style={{ marginBottom: space.md, marginLeft: space.xs }}>
        <Txt variant="subhead" tone="muted">
          {formatISODate(event.date)} · {t.eventTypes[event.type]}
          {event.venue ? ` · ${event.venue}` : ''}
        </Txt>
        {event.hostFamilyName ? (
          <Pressable onPress={() => router.push({ pathname: '/family/[id]', params: { id: event.hostFamilyId! } })} hitSlop={hit} style={{ marginTop: space.xs }}>
            <Txt variant="headline" tone="tint">
              {t.events.hostedBy(event.hostFamilyName)}
            </Txt>
          </Pressable>
        ) : (
          <Txt variant="headline" style={{ marginTop: space.xs }}>
            {t.events.ourEvent}
          </Txt>
        )}
      </View>

      {/* Totals + actions */}
      <Card>
        {totals.length === 0 ? (
          <Txt tone="muted">{t.event.giftsEmpty}</Txt>
        ) : (
          totals.map((tt, i) => (
            <Row key={tt.currency} style={{ justifyContent: 'space-between', alignItems: 'flex-start', marginTop: i ? space.lg : 0 }}>
              <View>
                <Txt variant="footnote" tone="muted">
                  {t.event.totalReceived}
                </Txt>
                <MoneyText amountMinor={tt.receivedMinor} currency={tt.currency} direction="received" />
                <Txt variant="footnote" tone="muted">
                  {t.events.entries(tt.receivedCount)}
                </Txt>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Txt variant="footnote" tone="muted">
                  {t.event.totalGave}
                </Txt>
                <MoneyText amountMinor={tt.gaveMinor} currency={tt.currency} direction="gave" />
                <Txt variant="footnote" tone="muted">
                  {t.events.entries(tt.gaveCount)}
                </Txt>
              </View>
            </Row>
          ))
        )}
        <Spacer h={space.lg} />
        {ours ? (
          <>
            <Button label={t.event.quickAdd} icon="flash" onPress={() => router.push({ pathname: '/event/[id]/quick-add', params: { id } })} />
            <Txt variant="footnote" tone="muted" style={{ textAlign: 'center', marginTop: space.xs }}>
              {t.event.quickAddHint}
            </Txt>
            <Spacer h={space.md} />
            <Button label={t.event.addGift} icon="add" variant="secondary" onPress={() => router.push({ pathname: '/entry/form', params: { eventId: id } })} />
          </>
        ) : (
          <Button
            label={t.event.addGift}
            icon="add"
            onPress={() => router.push({ pathname: '/entry/form', params: { eventId: id, familyId: event.hostFamilyId!, direction: 'gave' } })}
          />
        )}
      </Card>

      <Spacer h={space.xl} />

      <Section title={t.event.gifts}>
        {q.data!.entries.length === 0 ? (
          <Txt tone="muted" style={{ marginLeft: space.lg }}>
            {t.event.giftsEmpty}
          </Txt>
        ) : (
          <Group>
            {q.data!.entries.map((e) => (
              <EntryLine key={e.id} entry={e} subtitle={e.family.name} onPress={() => router.push({ pathname: '/entry/form', params: { id: e.id } })} />
            ))}
          </Group>
        )}
      </Section>

      <Section
        title={t.event.outfits}
        right={
          <Pressable hitSlop={hit} accessibilityRole="button" onPress={() => router.push({ pathname: '/outfit/form', params: { eventId: id } })}>
            <Txt variant="subhead" tone="tint" style={{ fontWeight: '600' }}>
              ＋ {t.event.addOutfit}
            </Txt>
          </Pressable>
        }
      >
        {q.data!.outfits.length === 0 ? (
          <Txt tone="muted" style={{ marginLeft: space.lg }}>
            {t.event.outfitsEmpty}
          </Txt>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
            {q.data!.outfits.map((o) => (
              <Pressable
                key={o.id}
                onPress={() => router.push({ pathname: '/outfit/form', params: { id: o.id, eventId: id } })}
                style={({ pressed }) => ({ width: '47%', opacity: pressed ? 0.7 : 1 })}
              >
                {o.photoPath ? (
                  <Image source={{ uri: photoUri(o.photoPath)! }} style={{ width: '100%', aspectRatio: 3 / 4, borderRadius: radius.md, backgroundColor: colors.surfaceAlt }} />
                ) : (
                  <View style={{ width: '100%', aspectRatio: 3 / 4, borderRadius: radius.md, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="shirt-outline" size={36} color={colors.textMuted} />
                  </View>
                )}
                <Txt variant="bodyStrong" style={{ marginTop: space.xs }}>
                  {o.personLabel}
                </Txt>
                {o.note ? (
                  <Txt variant="subhead" tone="muted">
                    {o.note}
                  </Txt>
                ) : null}
              </Pressable>
            ))}
          </View>
        )}
      </Section>

      <Card style={{ padding: 0 }}>
        <Button label={t.common.delete} variant="destructive" onPress={onDelete} />
      </Card>
    </Screen>
  );
}

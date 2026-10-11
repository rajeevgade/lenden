import React, { useMemo, useState } from 'react';
import { Alert, Image, Pressable, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { deleteFamily, getFamily, listEntriesForFamily, listEventsHostedBy, listOutfitsForHostFamily } from '../../src/db';
import { groupByEvent, suggestGift, totalsByCurrency } from '../../src/domain/ledger';
import { formatISODate } from '../../src/domain/dates';
import { formatMoney } from '../../src/domain/money';
import { useFocusedQuery } from '../../src/hooks/useAsync';
import { Body, Button, Caption, Card, EmptyState, Loading, Row, Screen, Section, Spacer } from '../../src/components/ui';
import { MoneyText } from '../../src/components/MoneyText';
import { EntryLine } from '../../src/components/EntryLine';
import { photoUri } from '../../src/services/photos';
import { exportFamilyLedgerPdf } from '../../src/services/pdf';
import { t } from '../../src/i18n';
import { colors, font, hit, radius, space } from '../../src/theme';

export default function FamilyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [exporting, setExporting] = useState(false);

  const q = useFocusedQuery(async () => {
    const [family, entries, outfits, hosted] = await Promise.all([
      getFamily(id),
      listEntriesForFamily(id),
      listOutfitsForHostFamily(id),
      listEventsHostedBy(id),
    ]);
    return { family, entries, outfits, hosted };
  }, [id]);

  const totals = useMemo(() => totalsByCurrency(q.data?.entries ?? []), [q.data]);
  const groups = useMemo(() => groupByEvent(q.data?.entries ?? []), [q.data]);
  const suggestion = useMemo(() => suggestGift(q.data?.entries ?? [], null), [q.data]);

  if (q.loading && !q.data) return <Loading />;
  const family = q.data?.family;
  if (!family) return <EmptyState title={t.common.error} />;

  function onDelete() {
    Alert.alert(t.common.confirmDeleteTitle, t.families.deleteWarning, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.common.delete,
        style: 'destructive',
        onPress: async () => {
          await deleteFamily(id);
          router.back();
        },
      },
    ]);
  }

  async function onExport() {
    setExporting(true);
    try {
      await exportFamilyLedgerPdf(family!, q.data!.entries);
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
          title: family.name,
          headerRight: () => (
            <Row>
              <Pressable hitSlop={hit} onPress={onExport} disabled={exporting} accessibilityLabel={t.common.exportPdf}>
                <Ionicons name="share-outline" size={24} color={colors.primary} />
              </Pressable>
              <Pressable hitSlop={hit} onPress={() => router.push({ pathname: '/family/form', params: { id } })} accessibilityLabel={t.common.edit}>
                <Ionicons name="create-outline" size={24} color={colors.primary} />
              </Pressable>
            </Row>
          ),
        }}
      />

      {family.relation || family.city ? <Caption style={{ marginBottom: space.md }}>{[family.relation, family.city].filter(Boolean).join(' · ')}</Caption> : null}

      {/* Totals */}
      <Card>
        {totals.length === 0 ? (
          <Body muted>{t.family.ledgerEmpty}</Body>
        ) : (
          totals.map((tt, i) => (
            <View key={tt.currency} style={{ marginTop: i ? space.lg : 0 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <View>
                  <Caption>{t.family.totalsReceived}</Caption>
                  <MoneyText amountMinor={tt.receivedMinor} currency={tt.currency} direction="received" />
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Caption>{t.family.totalsGave}</Caption>
                  <MoneyText amountMinor={tt.gaveMinor} currency={tt.currency} direction="gave" />
                </View>
              </Row>
              <View style={{ height: 1, backgroundColor: colors.border, marginVertical: space.md }} />
              <Row style={{ justifyContent: 'space-between' }}>
                <Caption>{tt.netMinor > 0 ? t.family.netAhead : tt.netMinor < 0 ? t.family.netBehind : t.family.netEven}</Caption>
                <MoneyText amountMinor={tt.netMinor} currency={tt.currency} showPlus />
              </Row>
            </View>
          ))
        )}
      </Card>

      <Spacer h={space.lg} />

      {/* Suggestion */}
      <Card style={{ backgroundColor: colors.surfaceAlt, borderColor: colors.accent }}>
        <Text style={[font.label, { color: colors.accent }]}>{t.family.suggestTitle}</Text>
        <Spacer h={space.xs} />
        {suggestion ? (
          <Body>
            {t.family.suggestBody(
              suggestion.basis.kind === 'cash' && suggestion.basis.amountMinor != null
                ? formatMoney(suggestion.basis.amountMinor, suggestion.basis.currency)
                : (suggestion.basis.itemDescription ?? ''),
              suggestion.basis.event.name,
              formatISODate(suggestion.basis.event.date),
            )}
          </Body>
        ) : (
          <Body muted>{t.family.suggestNoHistory}</Body>
        )}
        <Spacer />
        <Button label={t.family.addGift} onPress={() => router.push({ pathname: '/entry/form', params: { familyId: id } })} />
      </Card>

      <Spacer h={space.xl} />

      {/* Ledger */}
      <Section title={t.family.ledger}>
        {groups.length === 0 ? (
          <Body muted>{t.family.ledgerEmpty}</Body>
        ) : (
          groups.map((g) => (
            <View key={g.event.id} style={{ marginBottom: space.lg }}>
              <Pressable onPress={() => router.push({ pathname: '/event/[id]', params: { id: g.event.id } })} hitSlop={hit}>
                <Text style={font.bodyStrong}>{g.event.name}</Text>
                <Caption>
                  {formatISODate(g.event.date)} · {t.eventTypes[g.event.type]}
                </Caption>
              </Pressable>
              <Spacer h={space.sm} />
              {g.entries.map((e) => (
                <EntryLine key={e.id} entry={e} onPress={() => router.push({ pathname: '/entry/form', params: { id: e.id } })} />
              ))}
            </View>
          ))
        )}
      </Section>

      {/* Outfits worn to their functions */}
      {q.data && q.data.outfits.length > 0 ? (
        <Section title={t.family.outfits}>
          {q.data.outfits.map((o) => (
            <Pressable
              key={o.id}
              onPress={() => router.push({ pathname: '/outfit/form', params: { id: o.id, eventId: o.eventId } })}
              style={{ flexDirection: 'row', gap: space.md, alignItems: 'center', marginBottom: space.md }}
            >
              {o.photoPath ? (
                <Image source={{ uri: photoUri(o.photoPath)! }} style={{ width: 64, height: 64, borderRadius: radius.md, backgroundColor: colors.chipBg }} />
              ) : (
                <View style={{ width: 64, height: 64, borderRadius: radius.md, backgroundColor: colors.chipBg }} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={font.bodyStrong}>{o.personLabel}</Text>
                {o.note ? <Caption>{o.note}</Caption> : null}
                <Caption>
                  {o.eventName} · {formatISODate(o.eventDate)}
                </Caption>
              </View>
            </Pressable>
          ))}
        </Section>
      ) : null}

      <Spacer h={space.xl} />
      <Button label={t.common.delete} variant="ghost" onPress={onDelete} style={{ alignSelf: 'center' }} />
    </Screen>
  );
}

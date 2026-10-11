import React, { useMemo, useState } from 'react';
import { Alert, Image, Pressable, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { deleteFamily, getFamily, listEntriesForFamily, listEventsHostedBy, listOutfitsForHostFamily } from '../../src/db';
import { groupByEvent, suggestGift, totalsByCurrency } from '../../src/domain/ledger';
import { formatISODate } from '../../src/domain/dates';
import { formatMoney } from '../../src/domain/money';
import { useFocusedQuery } from '../../src/hooks/useAsync';
import { Button, Card, EmptyState, Group, HeaderIcon, ListRow, Loading, Row, Screen, Section, Separator, Spacer, Txt } from '../../src/components/ui';
import { MoneyText } from '../../src/components/MoneyText';
import { EntryLine } from '../../src/components/EntryLine';
import { photoUri } from '../../src/services/photos';
import { exportFamilyLedgerPdf } from '../../src/services/pdf';
import { t } from '../../src/i18n';
import { hit, radius, space, useTheme } from '../../src/theme';

export default function FamilyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
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
              <HeaderIcon name="share-outline" label={t.common.exportPdf} onPress={onExport} disabled={exporting} />
              <HeaderIcon name="create-outline" label={t.common.edit} onPress={() => router.push({ pathname: '/family/form', params: { id } })} />
            </Row>
          ),
        }}
      />

      {family.relation || family.city ? (
        <Txt variant="subhead" tone="muted" style={{ marginBottom: space.md, marginLeft: space.xs }}>
          {[family.relation, family.city].filter(Boolean).join(' · ')}
        </Txt>
      ) : null}

      {/* Totals */}
      <Card>
        {totals.length === 0 ? (
          <Txt tone="muted">{t.family.ledgerEmpty}</Txt>
        ) : (
          totals.map((tt, i) => (
            <View key={tt.currency} style={{ marginTop: i ? space.xl : 0 }}>
              {/* Balance leads: it is the number the gift-keeper opens this screen for. */}
              <Txt variant="label" tone="muted">
                {t.family.net}
              </Txt>
              <MoneyText amountMinor={tt.netMinor} currency={tt.currency} size="lg" showPlus />
              <Txt variant="subhead" tone="muted">
                {tt.netMinor > 0 ? t.family.netAhead : tt.netMinor < 0 ? t.family.netBehind : t.family.netEven}
              </Txt>
              <View style={{ marginVertical: space.md }}>
                <Separator inset={0} />
              </View>
              <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View>
                  <Txt variant="footnote" tone="muted">
                    {t.family.totalsReceived}
                  </Txt>
                  <MoneyText amountMinor={tt.receivedMinor} currency={tt.currency} direction="received" />
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Txt variant="footnote" tone="muted">
                    {t.family.totalsGave}
                  </Txt>
                  <MoneyText amountMinor={tt.gaveMinor} currency={tt.currency} direction="gave" />
                </View>
              </Row>
            </View>
          ))
        )}
      </Card>

      <Spacer h={space.lg} />

      {/* Suggestion */}
      <Card style={{ backgroundColor: colors.accentFill }}>
        <Row>
          <Ionicons name="bulb-outline" size={16} color={colors.accent} />
          <Txt variant="label" tone="accent">
            {t.family.suggestTitle}
          </Txt>
        </Row>
        <Spacer h={space.sm} />
        {suggestion ? (
          <Txt>
            {t.family.suggestBody(
              suggestion.basis.kind === 'cash' && suggestion.basis.amountMinor != null
                ? formatMoney(suggestion.basis.amountMinor, suggestion.basis.currency)
                : (suggestion.basis.itemDescription ?? ''),
              suggestion.basis.event.name,
              formatISODate(suggestion.basis.event.date),
            )}
          </Txt>
        ) : (
          <Txt tone="muted">{t.family.suggestNoHistory}</Txt>
        )}
        <Spacer h={space.lg} />
        <Button label={t.family.addGift} icon="add" onPress={() => router.push({ pathname: '/entry/form', params: { familyId: id } })} />
      </Card>

      <Spacer h={space.xl} />

      {/* Ledger: one group per event */}
      <Section title={t.family.ledger}>
        {groups.length === 0 ? (
          <Txt tone="muted" style={{ marginLeft: space.lg }}>
            {t.family.ledgerEmpty}
          </Txt>
        ) : (
          groups.map((g, i) => (
            <View key={g.event.id} style={{ marginTop: i ? space.lg : 0 }}>
              <Pressable
                onPress={() => router.push({ pathname: '/event/[id]', params: { id: g.event.id } })}
                hitSlop={hit}
                accessibilityRole="button"
                style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg, marginBottom: space.sm, opacity: pressed ? 0.6 : 1 })}
              >
                <View style={{ flex: 1 }}>
                  <Txt variant="headline">{g.event.name}</Txt>
                  <Txt variant="footnote" tone="muted">
                    {formatISODate(g.event.date)} · {t.eventTypes[g.event.type]}
                  </Txt>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
              </Pressable>
              <Group>
                {g.entries.map((e) => (
                  <EntryLine key={e.id} entry={e} onPress={() => router.push({ pathname: '/entry/form', params: { id: e.id } })} />
                ))}
              </Group>
            </View>
          ))
        )}
      </Section>

      {/* Outfits worn to their functions */}
      {q.data && q.data.outfits.length > 0 ? (
        <Section title={t.family.outfits}>
          <Group>
            {q.data.outfits.map((o) => (
              <ListRow
                key={o.id}
                title={o.personLabel}
                subtitle={[o.note, `${o.eventName} · ${formatISODate(o.eventDate)}`].filter(Boolean).join(' · ')}
                left={
                  o.photoPath ? (
                    <Image source={{ uri: photoUri(o.photoPath)! }} style={{ width: 56, height: 56, marginVertical: space.sm, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt }} />
                  ) : (
                    <View style={{ width: 56, height: 56, marginVertical: space.sm, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="shirt-outline" size={24} color={colors.textMuted} />
                    </View>
                  )
                }
                onPress={() => router.push({ pathname: '/outfit/form', params: { id: o.id, eventId: o.eventId } })}
              />
            ))}
          </Group>
        </Section>
      ) : null}

      <Card style={{ padding: 0 }}>
        <Button label={t.common.delete} variant="destructive" onPress={onDelete} />
      </Card>
    </Screen>
  );
}

import React, { useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { useRouter } from 'expo-router';
import { listAllEntriesLite, listFamilies } from '../../src/db';
import { primaryTotals } from '../../src/domain/ledger';
import { useFocusedQuery } from '../../src/hooks/useAsync';
import { Button, EmptyState, Fab, Input, ListRow, Loading, Screen } from '../../src/components/ui';
import { MoneyText } from '../../src/components/MoneyText';
import { t } from '../../src/i18n';
import { space } from '../../src/theme';

export default function FamiliesScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const families = useFocusedQuery(() => listFamilies(search), [search]);
  const entries = useFocusedQuery(() => listAllEntriesLite(), []);

  const balances = useMemo(() => {
    const byFamily = new Map<string, NonNullable<typeof entries.data>>();
    for (const e of entries.data ?? []) {
      const list = byFamily.get(e.familyId) ?? [];
      list.push(e);
      byFamily.set(e.familyId, list);
    }
    const out = new Map<string, { netMinor: number; currency: string }>();
    for (const [id, list] of byFamily) {
      const p = primaryTotals(list);
      if (p) out.set(id, { netMinor: p.netMinor, currency: p.currency });
    }
    return out;
  }, [entries.data]);

  const data = families.data ?? [];
  const showEmpty = !families.loading && data.length === 0 && search === '';

  return (
    <Screen scroll={false} padded={false}>
      <View style={{ padding: space.lg, paddingBottom: space.sm }}>
        <Input value={search} onChangeText={setSearch} placeholder={t.families.searchPlaceholder} returnKeyType="search" clearButtonMode="while-editing" />
      </View>
      {families.loading && data.length === 0 ? (
        <Loading />
      ) : showEmpty ? (
        <EmptyState
          title={t.families.empty}
          hint={t.families.emptyHint}
          action={<Button label={t.families.addFamily} onPress={() => router.push('/family/form')} />}
        />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(f) => f.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 120 }}
          renderItem={({ item }) => {
            const bal = balances.get(item.id);
            return (
              <ListRow
                title={item.name}
                subtitle={[item.relation, item.city, t.families.entries(item.entryCount)].filter(Boolean).join(' · ')}
                right={bal ? <MoneyText amountMinor={bal.netMinor} currency={bal.currency} size="sm" showPlus /> : null}
                onPress={() => router.push({ pathname: '/family/[id]', params: { id: item.id } })}
              />
            );
          }}
        />
      )}
      {!showEmpty ? <Fab label={t.families.addFamily} onPress={() => router.push('/family/form')} /> : null}
    </Screen>
  );
}

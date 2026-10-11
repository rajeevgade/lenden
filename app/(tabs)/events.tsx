import React, { useMemo, useState } from 'react';
import { SectionList, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { listEvents, type EventListItem } from '../../src/db';
import { formatISODate, isUpcoming } from '../../src/domain/dates';
import { useFocusedQuery } from '../../src/hooks/useAsync';
import { Button, EmptyState, Fab, Input, ListRow, Loading, Screen } from '../../src/components/ui';
import { t } from '../../src/i18n';
import { colors, font, space } from '../../src/theme';

export default function EventsScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const events = useFocusedQuery(() => listEvents(search), [search]);

  const sections = useMemo(() => {
    const all = events.data ?? [];
    const upcoming = all.filter((e) => isUpcoming(e.date)).sort((a, b) => a.date.localeCompare(b.date));
    const past = all.filter((e) => !isUpcoming(e.date));
    const out: { title: string; data: EventListItem[] }[] = [];
    if (upcoming.length) out.push({ title: t.events.upcoming, data: upcoming });
    if (past.length) out.push({ title: t.events.past, data: past });
    return out;
  }, [events.data]);

  const showEmpty = !events.loading && sections.length === 0 && search === '';

  return (
    <Screen scroll={false} padded={false}>
      <View style={{ padding: space.lg, paddingBottom: space.sm }}>
        <Input value={search} onChangeText={setSearch} placeholder={t.events.searchPlaceholder} returnKeyType="search" clearButtonMode="while-editing" />
      </View>
      {events.loading && !events.data ? (
        <Loading />
      ) : showEmpty ? (
        <EmptyState title={t.events.empty} hint={t.events.emptyHint} action={<Button label={t.events.addEvent} onPress={() => router.push('/event/form')} />} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(e) => e.id}
          keyboardShouldPersistTaps="handled"
          stickySectionHeadersEnabled={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          renderSectionHeader={({ section }) => (
            <Text style={[font.label, { paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.sm, backgroundColor: colors.bg }]}>
              {section.title}
            </Text>
          )}
          renderItem={({ item }) => (
            <ListRow
              title={item.name}
              subtitle={`${formatISODate(item.date)} · ${item.hostFamilyName ? t.events.hostedBy(item.hostFamilyName) : t.events.ourEvent} · ${t.events.entries(item.entryCount)}`}
              onPress={() => router.push({ pathname: '/event/[id]', params: { id: item.id } })}
            />
          )}
        />
      )}
      {!showEmpty ? <Fab label={t.events.addEvent} onPress={() => router.push('/event/form')} /> : null}
    </Screen>
  );
}

import React, { useMemo, useState } from 'react';
import { SectionList, View } from 'react-native';
import { useRouter } from 'expo-router';
import { listEvents, type EventListItem } from '../../src/db';
import { formatISODate, isUpcoming } from '../../src/domain/dates';
import { useFocusedQuery } from '../../src/hooks/useAsync';
import { Button, EmptyState, Fab, LargeTitle, ListRow, Loading, rowPosition, Screen, SearchField, Txt } from '../../src/components/ui';
import { t } from '../../src/i18n';
import { space } from '../../src/theme';


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
    <Screen scroll={false} padded={false} edges={['top', 'left', 'right']}>
      <LargeTitle>{t.tabs.events}</LargeTitle>
      {showEmpty ? null : (
        <View style={{ paddingHorizontal: space.lg, paddingBottom: space.sm }}>
          <SearchField value={search} onChangeText={setSearch} placeholder={t.events.searchPlaceholder} />
        </View>
      )}
      {events.loading && !events.data ? (
        <Loading />
      ) : showEmpty ? (
        <EmptyState
          icon="calendar-outline"
          title={t.events.empty}
          hint={t.events.emptyHint}
          action={<Button label={t.events.addEvent} icon="add" onPress={() => router.push('/event/form')} />}
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(e) => e.id}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          stickySectionHeadersEnabled={false}
          contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: 120 }}
          renderSectionHeader={({ section }) => (
            <Txt variant="label" tone="muted" style={{ paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.sm }}>
              {section.title}
            </Txt>
          )}
          renderItem={({ item, index, section }) => (
            <ListRow
              position={rowPosition(index, section.data.length)}
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

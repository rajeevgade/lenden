import React, { useEffect, useState } from 'react';
import { FlatList, Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { listEvents, type EventListItem } from '../db';
import { formatISODate } from '../domain/dates';
import { t } from '../i18n';
import { font, radius, space, useTheme } from '../theme';
import { HeaderButton, ListRow, SearchField } from './ui';

export function EventPicker({ value, onChange }: { value: EventListItem | null; onChange: (e: EventListItem) => void }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [events, setEvents] = useState<EventListItem[]>([]);

  useEffect(() => {
    if (open) listEvents(search).then(setEvents);
  }, [open, search]);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        style={({ pressed }) => ({
          backgroundColor: pressed ? colors.surfaceAlt : colors.surface,
          borderWidth: value ? 2 : 0,
          borderColor: colors.tint,
          borderRadius: radius.md,
          minHeight: 52,
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.sm,
          paddingHorizontal: space.lg,
          paddingVertical: space.sm,
        })}
      >
        <View style={{ flex: 1 }}>
          {value ? (
            <>
              <Text style={[font.bodyStrong, { color: colors.text }]}>{value.name}</Text>
              <Text style={[font.subhead, { color: colors.textMuted }]}>
                {formatISODate(value.date)} · {value.hostFamilyName ? t.events.hostedBy(value.hostFamilyName) : t.events.ourEvent}
              </Text>
            </>
          ) : (
            <Text style={[font.body, { color: colors.textTertiary }]}>{t.entry.eventPlaceholder}</Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
      </Pressable>
      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['bottom']}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.sm }}>
            <Text style={[font.headline, { color: colors.text }]}>{t.entry.event}</Text>
            <HeaderButton label={t.common.cancel} bold={false} onPress={() => setOpen(false)} />
          </View>
          <View style={{ paddingHorizontal: space.lg, paddingBottom: space.md }}>
            <SearchField value={search} onChangeText={setSearch} placeholder={t.events.searchPlaceholder} autoFocus />
          </View>
          <FlatList
            data={events}
            keyExtractor={(e) => e.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: space.xl }}
            renderItem={({ item, index }) => (
              <ListRow
                title={item.name}
                subtitle={`${formatISODate(item.date)} · ${item.hostFamilyName ? t.events.hostedBy(item.hostFamilyName) : t.events.ourEvent}`}
                position={events.length === 1 ? 'only' : index === 0 ? 'first' : index === events.length - 1 ? 'last' : 'middle'}
                chevron={false}
                onPress={() => {
                  onChange(item);
                  setOpen(false);
                }}
              />
            )}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}

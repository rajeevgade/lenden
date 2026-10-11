import React, { useEffect, useState } from 'react';
import { FlatList, Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listEvents, type EventListItem } from '../db';
import { formatISODate } from '../domain/dates';
import { t } from '../i18n';
import { colors, font, radius, space } from '../theme';
import { Button, Input, ListRow } from './ui';

export function EventPicker({ value, onChange }: { value: EventListItem | null; onChange: (e: EventListItem) => void }) {
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
        style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: value ? colors.primary : colors.border, borderRadius: radius.md, minHeight: 52, justifyContent: 'center', paddingHorizontal: space.md }}
      >
        {value ? (
          <>
            <Text style={font.bodyStrong}>{value.name}</Text>
            <Text style={font.caption}>
              {formatISODate(value.date)} · {value.hostFamilyName ? t.events.hostedBy(value.hostFamilyName) : t.events.ourEvent}
            </Text>
          </>
        ) : (
          <Text style={[font.body, { color: colors.textMuted }]}>{t.entry.eventPlaceholder}</Text>
        )}
      </Pressable>
      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'bottom']}>
          <View style={{ padding: space.lg }}>
            <Input value={search} onChangeText={setSearch} placeholder={t.events.searchPlaceholder} autoFocus />
          </View>
          <FlatList
            data={events}
            keyExtractor={(e) => e.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <ListRow
                title={item.name}
                subtitle={`${formatISODate(item.date)} · ${item.hostFamilyName ? t.events.hostedBy(item.hostFamilyName) : t.events.ourEvent}`}
                onPress={() => {
                  onChange(item);
                  setOpen(false);
                }}
              />
            )}
          />
          <View style={{ padding: space.lg }}>
            <Button label={t.common.cancel} variant="secondary" onPress={() => setOpen(false)} />
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { formatMoney } from '../domain/money';
import type { Entry } from '../domain/types';
import { t } from '../i18n';
import { colors, font, radius, space } from '../theme';
import { Caption } from './ui';
import { directionColor } from './MoneyText';

export function giftLabel(entry: Entry): string {
  if (entry.kind === 'cash') return entry.amountMinor != null ? formatMoney(entry.amountMinor, entry.currency) : '';
  const value = entry.amountMinor != null ? ` (≈ ${formatMoney(entry.amountMinor, entry.currency)})` : '';
  return `${entry.itemDescription ?? ''}${value}`;
}

export function EntryLine({ entry, onPress, subtitle }: { entry: Entry; onPress?: () => void; subtitle?: string }) {
  const label = entry.direction === 'gave' ? t.direction.gave : t.direction.received;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        backgroundColor: pressed ? colors.surfaceAlt : colors.surface,
        borderRadius: radius.md,
        padding: space.md,
        marginBottom: space.sm,
        borderLeftWidth: 4,
        borderLeftColor: directionColor(entry.direction),
      })}
    >
      <View style={{ flex: 1 }}>
        <Text style={[font.caption, { color: directionColor(entry.direction), fontWeight: '700' }]}>{label}</Text>
        {subtitle ? <Text style={font.bodyStrong}>{subtitle}</Text> : null}
        {entry.note ? <Caption>{entry.note}</Caption> : null}
      </View>
      <Text style={[font.money, { color: directionColor(entry.direction), fontSize: entry.kind === 'cash' ? 20 : 15, maxWidth: '50%', textAlign: 'right' }]}>
        {giftLabel(entry)}
      </Text>
    </Pressable>
  );
}

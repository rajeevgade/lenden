import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatMoney } from '../domain/money';
import type { Entry } from '../domain/types';
import { t } from '../i18n';
import { font, radius, space, useTheme } from '../theme';
import { Txt, type RowPosition } from './ui';
import { directionColor } from './MoneyText';

export function giftLabel(entry: Entry): string {
  if (entry.kind === 'cash') return entry.amountMinor != null ? formatMoney(entry.amountMinor, entry.currency) : '';
  const value = entry.amountMinor != null ? ` (≈ ${formatMoney(entry.amountMinor, entry.currency)})` : '';
  return `${entry.itemDescription ?? ''}${value}`;
}

/**
 * One gift as a table cell: direction badge, who/note, amount. Works inside <Group> (gets `position`)
 * or standalone as its own rounded row.
 */
export function EntryLine({
  entry,
  onPress,
  subtitle,
  position = 'only',
}: {
  entry: Entry;
  onPress?: () => void;
  subtitle?: string;
  position?: RowPosition;
}) {
  const { colors } = useTheme();
  const color = directionColor(entry.direction, colors);
  const gave = entry.direction === 'gave';
  const top = position === 'only' || position === 'first';
  const bottom = position === 'only' || position === 'last';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? colors.surfaceAlt : colors.surface,
          borderTopLeftRadius: top ? radius.md : 0,
          borderTopRightRadius: top ? radius.md : 0,
          borderBottomLeftRadius: bottom ? radius.md : 0,
          borderBottomRightRadius: bottom ? radius.md : 0,
        },
      ]}
    >
      <View style={[styles.badge, { backgroundColor: color + '22' }]}>
        <Ionicons name={gave ? 'arrow-up' : 'arrow-down'} size={18} color={color} />
      </View>
      <View style={[styles.body, !bottom && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator }]}>
        <View style={{ flex: 1 }}>
          {subtitle ? (
            <Txt variant="bodyStrong" numberOfLines={1}>
              {subtitle}
            </Txt>
          ) : null}
          <Txt variant={subtitle ? 'subhead' : 'bodyStrong'} style={{ color }}>
            {gave ? t.direction.gave : t.direction.received}
          </Txt>
          {entry.note ? (
            <Txt variant="subhead" tone="muted" numberOfLines={2}>
              {entry.note}
            </Txt>
          ) : null}
        </View>
        <Txt style={[font.money, { color, fontSize: entry.kind === 'cash' ? 20 : 15, maxWidth: '55%', textAlign: 'right' }]}>{giftLabel(entry)}</Txt>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingLeft: space.lg, gap: space.md, minHeight: 60 },
  badge: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.md, paddingRight: space.lg },
});

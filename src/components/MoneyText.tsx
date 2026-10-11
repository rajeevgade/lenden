import React from 'react';
import { Text, type TextStyle } from 'react-native';
import { formatMoney } from '../domain/money';
import { colors, font } from '../theme';
import type { Direction } from '../domain/types';

export function directionColor(direction: Direction): string {
  return direction === 'gave' ? colors.gave : colors.received;
}

export function MoneyText({
  amountMinor,
  currency,
  direction,
  size = 'md',
  showPlus,
  style,
}: {
  amountMinor: number;
  currency: string;
  direction?: Direction;
  size?: 'sm' | 'md' | 'lg';
  showPlus?: boolean;
  style?: TextStyle;
}) {
  const base = size === 'lg' ? font.bigMoney : size === 'md' ? font.money : font.bodyStrong;
  const color = direction ? directionColor(direction) : amountMinor < 0 ? colors.gave : amountMinor > 0 ? colors.received : colors.text;
  return <Text style={[base, { color }, style]}>{formatMoney(amountMinor, currency, { showPlus })}</Text>;
}

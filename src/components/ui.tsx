import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type PressableProps,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { font, hit, radius, space, useTheme, type Palette } from '../theme';
import { t } from '../i18n';

/*
 * Shared building blocks, styled after iOS grouped settings screens: grey page, white rounded
 * groups, hairline separators, tint-coloured actions. Everything reads colours from useTheme(),
 * so light and dark mode come for free. Touch targets stay ≥ 50pt for older users.
 */

/* ---------- Text ---------- */

type Tone = 'default' | 'muted' | 'tertiary' | 'tint' | 'accent' | 'gave' | 'received' | 'danger' | 'onPrimary';

function toneColor(c: Palette, tone: Tone): string {
  switch (tone) {
    case 'muted':
      return c.textMuted;
    case 'tertiary':
      return c.textTertiary;
    case 'tint':
      return c.tint;
    case 'accent':
      return c.accent;
    case 'gave':
      return c.gave;
    case 'received':
      return c.received;
    case 'danger':
      return c.danger;
    case 'onPrimary':
      return c.onPrimary;
    default:
      return c.text;
  }
}

/** Themed text. `variant` picks the type style from `font`, `tone` the colour. */
export function Txt({ variant = 'body', tone = 'default', style, ...rest }: TextProps & { variant?: keyof typeof font; tone?: Tone }) {
  const { colors } = useTheme();
  return <Text style={[font[variant], { color: toneColor(colors, tone) }, style]} {...rest} />;
}

export function Title({ children }: { children: React.ReactNode }) {
  return <Txt variant="title">{children}</Txt>;
}
export function H2({ children }: { children: React.ReactNode }) {
  return <Txt variant="h2">{children}</Txt>;
}
export function Body({ children, muted, style }: { children: React.ReactNode; muted?: boolean; style?: StyleProp<TextStyle> }) {
  return (
    <Txt tone={muted ? 'muted' : 'default'} style={style}>
      {children}
    </Txt>
  );
}
export function Caption({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return (
    <Txt variant="caption" tone="muted" style={style}>
      {children}
    </Txt>
  );
}

/** iOS large title for tab roots (the tab navigator's own header is hidden). */
export function LargeTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <View style={styles.largeTitleRow}>
      <Txt variant="largeTitle" style={{ flex: 1 }} accessibilityRole="header">
        {children}
      </Txt>
      {right}
    </View>
  );
}

/* ---------- Layout ---------- */

export function Screen({
  children,
  scroll = true,
  padded = true,
  edges = ['bottom', 'left', 'right'],
  style,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  /** Tab roots without a header pass 'top' too. */
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const inner = padded ? styles.padded : undefined;
  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.bg }, style]} edges={edges}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[inner, { paddingBottom: space.xxl * 2 }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, inner]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

/** A grouped section: small uppercase header, content, optional footnote underneath. */
export function Section({
  title,
  children,
  right,
  footer,
  style,
}: {
  title?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
  footer?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.section, style]}>
      {title || right ? (
        <View style={styles.sectionHeader}>
          {title ? (
            <Txt variant="label" tone="muted">
              {title}
            </Txt>
          ) : (
            <View />
          )}
          {right}
        </View>
      ) : null}
      {children}
      {footer ? (
        <Txt variant="footnote" tone="muted" style={styles.sectionFooter}>
          {footer}
        </Txt>
      ) : null}
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return <View style={[styles.card, { backgroundColor: colors.surface }, style]}>{children}</View>;
}

export type RowPosition = 'only' | 'first' | 'middle' | 'last';

/** Where row `index` of `count` sits in an inset group, so ends round off and separators stop at the last row. */
export function rowPosition(index: number, count: number): RowPosition {
  return count === 1 ? 'only' : index === 0 ? 'first' : index === count - 1 ? 'last' : 'middle';
}

/**
 * Inset grouped list: rounds the outer corners and draws hairline separators between rows.
 * Children that accept `position` (ListRow) get it injected.
 */
export function Group({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  const items = React.Children.toArray(children).filter(React.isValidElement);
  return (
    <View style={[styles.group, { backgroundColor: colors.surface }, style]}>
      {items.map((child, i) => {
        return React.cloneElement(child as React.ReactElement<{ position?: RowPosition }>, { position: rowPosition(i, items.length) });
      })}
    </View>
  );
}

export function Row({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.row, style]}>{children}</View>;
}

export function Spacer({ h = space.md }: { h?: number }) {
  return <View style={{ height: h }} />;
}

export function Separator({ inset = space.lg }: { inset?: number }) {
  const { colors } = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.separator, marginLeft: inset }} />;
}

/* ---------- Controls ---------- */

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'destructive';

/**
 * primary: filled tint · secondary: tinted fill · danger: filled red ·
 * ghost: plain tint text · destructive: plain red text (iOS "Delete" rows).
 */
export function Button({
  label,
  variant = 'primary',
  loading,
  icon,
  style,
  ...rest
}: PressableProps & { label: string; variant?: ButtonVariant; loading?: boolean; icon?: React.ComponentProps<typeof Ionicons>['name'] }) {
  const { colors } = useTheme();
  const bg =
    variant === 'primary' ? colors.primary : variant === 'danger' ? colors.danger : variant === 'secondary' ? colors.tintFill : 'transparent';
  const fg =
    variant === 'primary' || variant === 'danger' ? colors.onPrimary : variant === 'destructive' ? colors.danger : colors.tint;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={hit}
      style={({ pressed }) => [styles.button, { backgroundColor: bg, opacity: rest.disabled ? 0.5 : pressed ? 0.7 : 1 }, style as ViewStyle]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.row}>
          {icon ? <Ionicons name={icon} size={20} color={fg} /> : null}
          <Text style={[styles.buttonText, { color: fg }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

/** Floating "add" pill. Not stock iOS, but a big labelled target beats a small "+" for our users. */
export function Fab({ label, onPress }: { label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.fab, { backgroundColor: colors.primary, shadowColor: colors.shadow }, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
    >
      <Ionicons name="add" size={22} color={colors.onPrimary} />
      <Text style={[styles.fabText, { color: colors.onPrimary }]}>{label}</Text>
    </Pressable>
  );
}

/** Text action for a stack header (Save / Cancel on a modal form). `bold` for the confirming action. */
export function HeaderButton({ label, onPress, disabled, bold = true }: { label: string; onPress: () => void; disabled?: boolean; bold?: boolean }) {
  const { colors } = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} disabled={disabled} hitSlop={hit} style={{ opacity: disabled ? 0.4 : 1, paddingHorizontal: space.xs }}>
      <Text style={[font.body, { color: colors.tint, fontWeight: bold ? '600' : '400' }]}>{label}</Text>
    </Pressable>
  );
}

/** Icon action for a stack header (share, edit). */
export function HeaderIcon({ name, onPress, label, disabled }: { name: React.ComponentProps<typeof Ionicons>['name']; onPress: () => void; label: string; disabled?: boolean }) {
  const { colors } = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} disabled={disabled} hitSlop={hit} style={{ opacity: disabled ? 0.4 : 1, padding: space.xs }}>
      <Ionicons name={name} size={24} color={colors.tint} />
    </Pressable>
  );
}

export function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string | null }) {
  const { colors } = useTheme();
  return (
    <View style={styles.field}>
      {label ? (
        <Txt variant="label" tone="muted" style={styles.fieldLabel}>
          {label}
        </Txt>
      ) : null}
      {children}
      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
    </View>
  );
}

export const Input = React.forwardRef<TextInput, TextInputProps & { invalid?: boolean }>(function Input({ style, invalid, ...rest }, ref) {
  const { colors, dark } = useTheme();
  return (
    <TextInput
      ref={ref}
      placeholderTextColor={colors.textTertiary}
      selectionColor={colors.tint}
      keyboardAppearance={dark ? 'dark' : 'light'}
      style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: invalid ? colors.danger : 'transparent' }, style]}
      {...rest}
    />
  );
});

/** iOS search field: grey fill, magnifier, clear button. */
export function SearchField({ value, onChangeText, placeholder, autoFocus }: { value: string; onChangeText: (v: string) => void; placeholder: string; autoFocus?: boolean }) {
  const { colors, dark } = useTheme();
  return (
    <View style={[styles.search, { backgroundColor: colors.fill }]}>
      <Ionicons name="search" size={18} color={colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        selectionColor={colors.tint}
        keyboardAppearance={dark ? 'dark' : 'light'}
        returnKeyType="search"
        clearButtonMode="while-editing"
        autoCorrect={false}
        autoFocus={autoFocus}
        style={[styles.searchInput, { color: colors.text }]}
      />
    </View>
  );
}

export function Chip({ label, selected, onPress, color }: { label: string; selected?: boolean; onPress?: () => void; color?: string }) {
  const { colors } = useTheme();
  const bg = selected ? (color ?? colors.primary) : colors.surface;
  const fg = selected ? colors.onPrimary : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      hitSlop={hit}
      style={({ pressed }) => [styles.chip, { backgroundColor: bg, borderColor: selected ? 'transparent' : colors.separator, opacity: pressed ? 0.7 : 1 }]}
    >
      <Text style={[styles.chipText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

export function ChipRow({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  );
}

/** iOS segmented control. `colorsFor` tints the selected thumb (e.g. gave/received). */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  colorsFor,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  colorsFor?: (v: T) => string;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.segmented, { backgroundColor: colors.fill }]} accessibilityRole="tablist">
      {options.map((o) => {
        const active = o.value === value;
        const tinted = active ? colorsFor?.(o.value) : undefined;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.value)}
            style={[
              styles.segment,
              active && [styles.segmentActive, { backgroundColor: tinted ?? colors.elevated, shadowColor: colors.shadow }],
            ]}
          >
            <Text style={[styles.segmentText, { color: tinted ? colors.onTinted : colors.text }, active && { fontWeight: '700' }]} numberOfLines={1}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * A table cell. Inside <Group> it gets `position` for corners and separators; standalone it renders
 * as its own rounded card. Shows a chevron when tappable unless `chevron={false}`.
 */
export function ListRow({
  title,
  subtitle,
  right,
  left,
  onPress,
  chevron,
  position = 'only',
}: {
  title: string;
  subtitle?: string | null;
  right?: React.ReactNode;
  left?: React.ReactNode;
  onPress?: () => void;
  chevron?: boolean;
  position?: RowPosition;
}) {
  const { colors } = useTheme();
  const top = position === 'only' || position === 'first';
  const bottom = position === 'only' || position === 'last';
  const showChevron = chevron ?? !!onPress;
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.listRow,
        {
          backgroundColor: pressed ? colors.surfaceAlt : colors.surface,
          borderTopLeftRadius: top ? radius.md : 0,
          borderTopRightRadius: top ? radius.md : 0,
          borderBottomLeftRadius: bottom ? radius.md : 0,
          borderBottomRightRadius: bottom ? radius.md : 0,
        },
      ]}
    >
      {left}
      <View style={[styles.flex, styles.listRowBody, !bottom && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator }]}>
        <View style={styles.flex}>
          <Txt variant="bodyStrong" numberOfLines={1}>
            {title}
          </Txt>
          {subtitle ? (
            <Txt variant="subhead" tone="muted" numberOfLines={1} style={{ marginTop: 2 }}>
              {subtitle}
            </Txt>
          ) : null}
        </View>
        {right}
        {showChevron ? <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} /> : null}
      </View>
    </Pressable>
  );
}

export function EmptyState({
  title,
  hint,
  action,
  icon,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.empty}>
      {icon ? (
        <View style={[styles.emptyIcon, { backgroundColor: colors.tintFill }]}>
          <Ionicons name={icon} size={36} color={colors.tint} />
        </View>
      ) : null}
      <Txt variant="h2" style={{ textAlign: 'center' }}>
        {title}
      </Txt>
      {hint ? (
        <Txt tone="muted" style={{ textAlign: 'center', marginTop: space.sm }}>
          {hint}
        </Txt>
      ) : null}
      {action ? <View style={{ marginTop: space.xl, alignSelf: 'stretch' }}>{action}</View> : null}
    </View>
  );
}

export function Loading() {
  const { colors } = useTheme();
  return (
    <View style={[styles.empty, { flex: 1 }]}>
      <ActivityIndicator color={colors.tint} />
      <Txt variant="caption" tone="muted" style={{ marginTop: space.sm }}>
        {t.common.loading}
      </Txt>
    </View>
  );
}

/* ---------- Styles (layout only; colours are applied inline from the theme) ---------- */

const styles = StyleSheet.create({
  flex: { flex: 1 },
  padded: { padding: space.lg },
  largeTitleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: space.sm },
  section: { marginBottom: space.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: space.lg, marginBottom: space.sm },
  sectionFooter: { paddingHorizontal: space.lg, marginTop: space.sm },
  card: { borderRadius: radius.md, padding: space.lg },
  group: { borderRadius: radius.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  button: {
    minHeight: 52,
    paddingHorizontal: space.xl,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { fontSize: 17, fontWeight: '600' },
  fab: {
    position: 'absolute',
    right: space.lg,
    bottom: space.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    borderRadius: radius.pill,
    paddingVertical: 14,
    paddingLeft: 18,
    paddingRight: 22,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  fabText: { fontSize: 17, fontWeight: '600' },
  field: { marginBottom: space.lg },
  fieldLabel: { marginBottom: space.xs + 2, marginLeft: space.lg },
  input: {
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: space.lg,
    minHeight: 52,
    fontSize: 17,
  },
  search: { flexDirection: 'row', alignItems: 'center', gap: space.sm, borderRadius: radius.md - 2, paddingHorizontal: space.md, minHeight: 44 },
  searchInput: { flex: 1, fontSize: 17, paddingVertical: space.sm },
  error: { marginTop: space.xs, marginLeft: space.lg, fontSize: 14 },
  chip: { paddingVertical: 9, paddingHorizontal: 16, borderRadius: radius.pill, borderWidth: StyleSheet.hairlineWidth },
  chipText: { fontSize: 15, fontWeight: '600' },
  chipRow: { gap: space.sm, paddingVertical: space.xs },
  segmented: { flexDirection: 'row', borderRadius: radius.sm + 2, padding: 3 },
  segment: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, paddingHorizontal: space.sm },
  segmentActive: { shadowOpacity: 0.12, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  segmentText: { fontSize: 16, fontWeight: '500' },
  listRow: { flexDirection: 'row', alignItems: 'center', paddingLeft: space.lg, gap: space.md, minHeight: 56 },
  listRowBody: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.md, paddingRight: space.md },
  empty: { alignItems: 'center', justifyContent: 'center', padding: space.xxl },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: space.lg },
});

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
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, font, hit, radius, space } from '../theme';
import { t } from '../i18n';

/* ---------- Layout ---------- */

export function Screen({
  children,
  scroll = true,
  padded = true,
  style,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const inner = padded ? styles.padded : undefined;
  return (
    <SafeAreaView style={[styles.screen, style]} edges={['bottom', 'left', 'right']}>
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

export function Section({ title, children, right }: { title?: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <View style={styles.section}>
      {title ? (
        <View style={styles.sectionHeader}>
          <Text style={font.label}>{title}</Text>
          {right}
        </View>
      ) : null}
      {children}
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Row({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.row, style]}>{children}</View>;
}

export function Spacer({ h = space.md }: { h?: number }) {
  return <View style={{ height: h }} />;
}

/* ---------- Text ---------- */

export function Title({ children }: { children: React.ReactNode }) {
  return <Text style={font.title}>{children}</Text>;
}
export function H2({ children }: { children: React.ReactNode }) {
  return <Text style={font.h2}>{children}</Text>;
}
export function Body({ children, muted, style }: { children: React.ReactNode; muted?: boolean; style?: object }) {
  return <Text style={[font.body, muted && { color: colors.textMuted }, style]}>{children}</Text>;
}
export function Caption({ children, style }: { children: React.ReactNode; style?: object }) {
  return <Text style={[font.caption, style]}>{children}</Text>;
}

/* ---------- Controls ---------- */

export function Button({
  label,
  variant = 'primary',
  loading,
  style,
  ...rest
}: PressableProps & { label: string; variant?: 'primary' | 'secondary' | 'danger' | 'ghost'; loading?: boolean }) {
  const bg =
    variant === 'primary' ? colors.primary : variant === 'danger' ? colors.danger : variant === 'secondary' ? colors.chipBg : 'transparent';
  const fg = variant === 'primary' || variant === 'danger' ? colors.primaryText : variant === 'ghost' ? colors.primary : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={hit}
      style={({ pressed }) => [styles.button, { backgroundColor: bg, opacity: pressed || rest.disabled ? 0.7 : 1 }, style as ViewStyle]}
      {...rest}
    >
      {loading ? <ActivityIndicator color={fg} /> : <Text style={[styles.buttonText, { color: fg }]}>{label}</Text>}
    </Pressable>
  );
}

export function Fab({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.fab, pressed && { opacity: 0.8 }]}>
      <Text style={styles.fabText}>＋ {label}</Text>
    </Pressable>
  );
}

/** Text action for a stack header (e.g. Save on a modal form), so it stays reachable while the keyboard is up. */
export function HeaderButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} disabled={disabled} hitSlop={hit} style={{ opacity: disabled ? 0.5 : 1 }}>
      <Text style={[font.bodyStrong, { color: colors.primary }]}>{label}</Text>
    </Pressable>
  );
}

export function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string | null }) {
  return (
    <View style={styles.field}>
      {label ? <Text style={[font.label, { marginBottom: space.xs }]}>{label}</Text> : null}
      {children}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export const Input = React.forwardRef<TextInput, TextInputProps>(function Input({ style, ...rest }, ref) {
  return <TextInput ref={ref} placeholderTextColor={colors.textMuted} style={[styles.input, style]} {...rest} />;
});

export function Chip({ label, selected, onPress, color }: { label: string; selected?: boolean; onPress?: () => void; color?: string }) {
  const bg = selected ? (color ?? colors.primary) : colors.chipBg;
  const fg = selected ? colors.primaryText : colors.text;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} hitSlop={hit} style={[styles.chip, { backgroundColor: bg }]}>
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
  return (
    <View style={styles.segmented}>
      {options.map((o) => {
        const active = o.value === value;
        const bg = active ? (colorsFor?.(o.value) ?? colors.primary) : 'transparent';
        return (
          <Pressable
            key={o.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.value)}
            style={[styles.segment, { backgroundColor: bg }]}
          >
            <Text style={[styles.segmentText, active && { color: colors.primaryText }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ListRow({
  title,
  subtitle,
  right,
  onPress,
}: {
  title: string;
  subtitle?: string | null;
  right?: React.ReactNode;
  onPress?: () => void;
}) {
  return (
    <Pressable accessibilityRole={onPress ? 'button' : undefined} onPress={onPress} style={({ pressed }) => [styles.listRow, pressed && { backgroundColor: colors.surfaceAlt }]}>
      <View style={styles.flex}>
        <Text style={font.bodyStrong} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={font.caption} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </Pressable>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <View style={styles.empty}>
      <Text style={font.h2}>{title}</Text>
      {hint ? <Text style={[font.body, { color: colors.textMuted, textAlign: 'center', marginTop: space.sm }]}>{hint}</Text> : null}
      {action ? <View style={{ marginTop: space.lg }}>{action}</View> : null}
    </View>
  );
}

export function Loading() {
  return (
    <View style={styles.empty}>
      <ActivityIndicator color={colors.primary} />
      <Text style={[font.caption, { marginTop: space.sm }]}>{t.common.loading}</Text>
    </View>
  );
}

/* ---------- Styles ---------- */

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  padded: { padding: space.lg },
  section: { marginBottom: space.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  button: {
    minHeight: 52,
    paddingHorizontal: space.xl,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { fontSize: 17, fontWeight: '700' },
  fab: {
    position: 'absolute',
    right: space.lg,
    bottom: space.xl,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: 14,
    paddingHorizontal: 22,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  fabText: { color: colors.primaryText, fontSize: 17, fontWeight: '700' },
  field: { marginBottom: space.lg },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    minHeight: 52,
    fontSize: 18,
    color: colors.text,
  },
  error: { color: colors.danger, marginTop: space.xs, fontSize: 14 },
  chip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: radius.pill },
  chipText: { fontSize: 15, fontWeight: '600' },
  chipRow: { gap: space.sm, paddingVertical: space.xs },
  segmented: { flexDirection: 'row', backgroundColor: colors.chipBg, borderRadius: radius.md, padding: 4 },
  segment: { flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm },
  segmentText: { fontSize: 16, fontWeight: '700', color: colors.text },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: 14,
    paddingHorizontal: space.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  empty: { alignItems: 'center', padding: space.xxl, marginTop: space.xxl },
});

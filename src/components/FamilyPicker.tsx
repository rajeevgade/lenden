import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View, type TextInput } from 'react-native';
import { createFamily, searchFamilies } from '../db';
import type { Family } from '../domain/types';
import { t } from '../i18n';
import { colors, font, radius, space } from '../theme';
import { Input } from './ui';

/**
 * Type-ahead picker. `value` is the selected family (or null). Typing clears the selection;
 * tapping a suggestion or the "Add new" row sets it. Designed for one-handed use at an event.
 */
export function FamilyPicker({
  value,
  onChange,
  placeholder,
  autoFocus,
  allowCreate = true,
  inputRef,
  onSubmitEditing,
}: {
  value: Family | null;
  onChange: (f: Family | null) => void;
  placeholder?: string;
  autoFocus?: boolean;
  allowCreate?: boolean;
  inputRef?: React.RefObject<TextInput | null>;
  onSubmitEditing?: () => void;
}) {
  const [text, setText] = useState(value?.name ?? '');
  const [results, setResults] = useState<Family[]>([]);
  const [open, setOpen] = useState(false);
  const seq = useRef(0);

  useEffect(() => {
    setText(value?.name ?? '');
  }, [value?.id, value?.name]);

  useEffect(() => {
    if (!open) return;
    const my = ++seq.current;
    searchFamilies(text).then((r) => {
      if (my === seq.current) setResults(r);
    });
  }, [text, open]);

  const trimmed = text.trim();
  const exact = results.some((r) => r.name.toLowerCase() === trimmed.toLowerCase());
  const showCreate = allowCreate && trimmed.length > 0 && !exact && !value;

  async function onCreate() {
    const f = await createFamily({ name: trimmed });
    onChange(f);
    setOpen(false);
  }

  function select(f: Family) {
    onChange(f);
    setText(f.name);
    setOpen(false);
  }

  return (
    <View>
      <Input
        ref={inputRef}
        value={text}
        onChangeText={(v) => {
          setText(v);
          if (value) onChange(null);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder ?? t.entry.familyPlaceholder}
        autoFocus={autoFocus}
        autoCapitalize="words"
        autoCorrect={false}
        returnKeyType="next"
        onSubmitEditing={() => {
          if (!value && results[0] && trimmed) select(results[0]);
          else if (!value && showCreate) void onCreate();
          onSubmitEditing?.();
        }}
        style={value ? { borderColor: colors.primary, borderWidth: 2 } : undefined}
      />
      {open && !value && (results.length > 0 || showCreate) ? (
        <View style={{ backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, marginTop: space.xs, overflow: 'hidden' }}>
          {results.map((f) => (
            <Pressable key={f.id} onPress={() => select(f)} style={({ pressed }) => ({ padding: space.md, backgroundColor: pressed ? colors.surfaceAlt : 'transparent', borderBottomWidth: 1, borderBottomColor: colors.border })}>
              <Text style={font.bodyStrong}>{f.name}</Text>
              {f.city || f.relation ? <Text style={font.caption}>{[f.relation, f.city].filter(Boolean).join(' · ')}</Text> : null}
            </Pressable>
          ))}
          {showCreate ? (
            <Pressable onPress={onCreate} style={({ pressed }) => ({ padding: space.md, backgroundColor: pressed ? colors.surfaceAlt : 'transparent' })}>
              <Text style={[font.bodyStrong, { color: colors.primary }]}>{t.entry.createFamily(trimmed)}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

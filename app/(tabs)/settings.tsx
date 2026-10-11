import React, { useState } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useSettings } from '../../src/hooks/useSettings';
import { SUPPORTED_CURRENCIES, currencyInfo } from '../../src/domain/money';
import { exportBackup, importBackup } from '../../src/services/backup';
import { Chip, ChipRow, Group, Input, LargeTitle, ListRow, Screen, Section, Txt } from '../../src/components/ui';
import { t } from '../../src/i18n';
import { space, useTheme } from '../../src/theme';

/** iOS Settings-style glyph: white icon on a small coloured rounded square. */
function RowIcon({ name, color, iconColor }: { name: React.ComponentProps<typeof Ionicons>['name']; color: string; iconColor?: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ width: 30, height: 30, borderRadius: 7, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={name} size={18} color={iconColor ?? colors.onPrimary} />
    </View>
  );
}

export default function SettingsScreen() {
  const { colors } = useTheme();
  const { settings, update } = useSettings();
  const [household, setHousehold] = useState(settings.householdName);
  const [busy, setBusy] = useState<'export' | 'import' | null>(null);

  async function onExport() {
    setBusy('export');
    try {
      await exportBackup();
    } catch (e) {
      Alert.alert(t.common.error, String(e));
    } finally {
      setBusy(null);
    }
  }

  function onImport() {
    Alert.alert(t.settings.backupImport, t.settings.backupImportConfirm, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.settings.backupImport,
        style: 'destructive',
        onPress: async () => {
          setBusy('import');
          try {
            const ok = await importBackup();
            if (ok) Alert.alert(t.settings.restoreDone);
          } catch (e) {
            Alert.alert(t.common.error, String(e));
          } finally {
            setBusy(null);
          }
        },
      },
    ]);
  }

  // Spinner replaces the chevron on the row that is working; the other row is disabled meanwhile.
  const spinner = <ActivityIndicator color={colors.tint} />;

  return (
    <Screen padded={false} edges={['top', 'left', 'right']}>
      <LargeTitle>{t.tabs.settings}</LargeTitle>
      <View style={{ paddingHorizontal: space.lg, paddingTop: space.md }}>
        <Section title={t.settings.household}>
          <Input value={household} onChangeText={setHousehold} onBlur={() => void update('householdName', household.trim())} placeholder={t.settings.householdPlaceholder} />
        </Section>

        <Section title={t.settings.currency}>
          <ChipRow>
            {SUPPORTED_CURRENCIES.map((c) => (
              <Chip key={c} label={`${currencyInfo(c).symbol} ${c}`} selected={settings.defaultCurrency === c} onPress={() => void update('defaultCurrency', c)} />
            ))}
          </ChipRow>
        </Section>

        <Section title={t.settings.backup} footer={`${t.settings.backupExportHint} ${t.settings.backupImportHint}`}>
          <Group>
            <ListRow
              left={<RowIcon name="share-outline" color={colors.primary} />}
              title={t.settings.backupExport}
              onPress={busy === null ? onExport : undefined}
              right={busy === 'export' ? spinner : null}
              chevron={busy !== 'export'}
            />
            <ListRow
              left={<RowIcon name="refresh" color={colors.accent} iconColor={colors.surface} />}
              title={t.settings.backupImport}
              onPress={busy === null ? onImport : undefined}
              right={busy === 'import' ? spinner : null}
              chevron={busy !== 'import'}
            />
          </Group>
        </Section>

        <Section title={t.settings.about} footer={t.settings.aboutBody}>
          <Group>
            <ListRow
              title={t.settings.version}
              right={
                <Txt tone="muted" style={{ paddingRight: space.xs }}>
                  {Constants.expoConfig?.version ?? '—'}
                </Txt>
              }
            />
          </Group>
        </Section>
      </View>
    </Screen>
  );
}

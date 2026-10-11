import React, { useState } from 'react';
import { Alert } from 'react-native';
import Constants from 'expo-constants';
import { useSettings } from '../../src/hooks/useSettings';
import { SUPPORTED_CURRENCIES, currencyInfo } from '../../src/domain/money';
import { exportBackup, importBackup } from '../../src/services/backup';
import { Body, Button, Caption, Card, Chip, ChipRow, Field, Input, Screen, Section, Spacer } from '../../src/components/ui';
import { t } from '../../src/i18n';

export default function SettingsScreen() {
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

  return (
    <Screen>
      <Field label={t.settings.household}>
        <Input value={household} onChangeText={setHousehold} onBlur={() => void update('householdName', household.trim())} placeholder={t.settings.householdPlaceholder} />
      </Field>

      <Field label={t.settings.currency}>
        <ChipRow>
          {SUPPORTED_CURRENCIES.map((c) => (
            <Chip key={c} label={`${currencyInfo(c).symbol} ${c}`} selected={settings.defaultCurrency === c} onPress={() => void update('defaultCurrency', c)} />
          ))}
        </ChipRow>
      </Field>

      <Section title={t.settings.backup}>
        <Card>
          <Body>{t.settings.backupExport}</Body>
          <Caption>{t.settings.backupExportHint}</Caption>
          <Spacer />
          <Button label={t.settings.backupExport} onPress={onExport} loading={busy === 'export'} disabled={busy !== null} />
          <Spacer h={24} />
          <Body>{t.settings.backupImport}</Body>
          <Caption>{t.settings.backupImportHint}</Caption>
          <Spacer />
          <Button label={t.settings.backupImport} variant="secondary" onPress={onImport} loading={busy === 'import'} disabled={busy !== null} />
        </Card>
      </Section>

      <Section title={t.settings.about}>
        <Card>
          <Body>{t.settings.aboutBody}</Body>
          <Spacer h={8} />
          <Caption>
            {t.settings.version} {Constants.expoConfig?.version ?? '—'}
          </Caption>
        </Card>
      </Section>
    </Screen>
  );
}

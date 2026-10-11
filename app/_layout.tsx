import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { getDb } from '../src/db';
import { SettingsProvider } from '../src/hooks/useSettings';
import { colors, font } from '../src/theme';
import { t } from '../src/i18n';
import { Loading } from '../src/components/ui';

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDb()
      .then(() => setReady(true))
      .catch((e) => setError(String(e)));
  }, []);

  if (error) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.bg }}>
        <Text style={font.h2}>{t.common.error}</Text>
        <Text style={font.caption}>{error}</Text>
      </View>
    );
  }
  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <Loading />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.bg },
            headerTintColor: colors.primary,
            headerTitleStyle: { color: colors.text, fontWeight: '700' },
            headerShadowVisible: false,
            headerBackButtonDisplayMode: 'minimal',
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="family/[id]" options={{ title: '' }} />
          <Stack.Screen name="family/form" options={{ presentation: 'modal', title: t.families.newFamily }} />
          <Stack.Screen name="event/[id]/index" options={{ title: '' }} />
          <Stack.Screen name="event/form" options={{ presentation: 'modal', title: t.events.newEvent }} />
          <Stack.Screen name="event/[id]/quick-add" options={{ presentation: 'fullScreenModal', title: t.quickAdd.title }} />
          <Stack.Screen name="entry/form" options={{ presentation: 'modal', title: t.entry.newEntry }} />
          <Stack.Screen name="outfit/form" options={{ presentation: 'modal', title: t.outfit.newOutfit }} />
        </Stack>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}

import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';
import { t } from '../../src/i18n';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

/** iOS convention: filled glyph when selected, outline otherwise. */
function tabIcon(filled: IconName, outline: IconName) {
  function TabIcon({ color, size, focused }: { color: string; size: number; focused: boolean }) {
    return <Ionicons name={focused ? filled : outline} color={color} size={size} />;
  }
  return TabIcon;
}

export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        // Tab roots draw their own large title (see LargeTitle in ui.tsx).
        headerShown: false,
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.separator },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t.tabs.families, tabBarIcon: tabIcon('people', 'people-outline') }} />
      <Tabs.Screen name="events" options={{ title: t.tabs.events, tabBarIcon: tabIcon('calendar', 'calendar-outline') }} />
      <Tabs.Screen name="settings" options={{ title: t.tabs.settings, tabBarIcon: tabIcon('settings', 'settings-outline') }} />
    </Tabs>
  );
}

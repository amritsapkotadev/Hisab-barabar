import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, Users, Receipt, User, Plus, Scale } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useTheme';
import AddActionsModal from '@/components/AddActionsModal';

// All tab icons come from lucide and share one size and stroke weight.
const ICON_SIZE = 22;
const ICON_STROKE = 2;
const TAB_PADDING = 8;

export const unstable_settings = {
  initialRouteName: __DEV__ ? 'logo-preview' : 'index',
};

export default function TabLayout() {
  const { colors: COLORS, styles } = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const [addVisible, setAddVisible] = useState(false);
  const insets = useSafeAreaInsets();

  return (
    <>
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          paddingTop: TAB_PADDING,
          paddingBottom: TAB_PADDING + insets.bottom,
          height: 56 + TAB_PADDING * 2 + insets.bottom,
          elevation: 0,
          shadowOpacity: 0,
        },
        // Equal-width items, content centred, no per-item padding
        tabBarItemStyle: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 0,
          paddingHorizontal: 0,
        },
        tabBarActiveTintColor: COLORS.text,
        tabBarInactiveTintColor: COLORS.textTertiary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: 'Inter-SemiBold',
          marginTop: 4,
          marginBottom: 0,
        },
      }}>
      <Tabs.Screen
        name="logo-preview"
        options={{
          title: 'Logo',
          href: __DEV__ ? undefined : null,
          tabBarIcon: ({ color }) => (
            <Scale size={ICON_SIZE} strokeWidth={ICON_STROKE} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarAccessibilityLabel: t('tabs.home'),
          tabBarIcon: ({ color }) => (
            <Home size={ICON_SIZE} strokeWidth={ICON_STROKE} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: t('tabs.groups'),
          tabBarAccessibilityLabel: t('tabs.groups'),
          tabBarIcon: ({ color }) => (
            <Users size={ICON_SIZE} strokeWidth={ICON_STROKE} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Add',
          tabBarButton: () => (
            <View style={styles.addWrapper}>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setAddVisible(true);
                }}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Add"
              >
                <Plus size={ICON_SIZE} strokeWidth={ICON_STROKE} color={COLORS.actionText} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: t('tabs.history'),
          tabBarAccessibilityLabel: t('tabs.history'),
          tabBarIcon: ({ color }) => (
            <Receipt size={ICON_SIZE} strokeWidth={ICON_STROKE} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarAccessibilityLabel: t('tabs.profile'),
          tabBarIcon: ({ color }) => (
            <User size={ICON_SIZE} strokeWidth={ICON_STROKE} color={color} />
          ),
        }}
      />
    </Tabs>
    <AddActionsModal visible={addVisible} onClose={() => setAddVisible(false)} />
    </>
  );
}

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
  addWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.action,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.action,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
});

import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Pressable, StyleSheet, Modal, Animated, Easing } from 'react-native';
import { router } from 'expo-router';
import { Receipt, Users, ScanLine, ChevronRight, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useTheme';

interface AddActionsModalProps {
  visible: boolean;
  onClose: () => void;
}

const ACTIONS = [
  { label: 'Add Expense', description: 'Split a bill or record a payment', icon: Receipt, route: '/add-expense-advanced' },
  { label: 'Create Group', description: 'Start a new group with friends', icon: Users, route: '/add-group' },
  { label: 'Join Group', description: 'Enter a code or scan an invite', icon: ScanLine, route: '/joingroupbycode' },
] as const;

export default function AddActionsModal({ visible, onClose }: AddActionsModalProps) {
  const { colors: COLORS, styles } = useThemedStyles(createStyles);
  const slide = useRef(new Animated.Value(0)).current;
  const closing = useRef(false);

  useEffect(() => {
    if (!visible) {
      slide.setValue(0);
      closing.current = false;
      return;
    }

    closing.current = false;
    slide.setValue(0);
    Animated.timing(slide, {
      toValue: 1,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visible, slide]);

  const handleClose = (afterClose?: () => void) => {
    if (closing.current) return;
    closing.current = true;
    Animated.timing(slide, {
      toValue: 0,
      duration: 180,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) {
        closing.current = false;
        return;
      }
      onClose();
      afterClose?.();
    });
  };

  const handlePress = (route: (typeof ACTIONS)[number]['route']) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handleClose(() => router.push(route));
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={() => handleClose()} statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: slide }]}
        />
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => handleClose()}
          accessibilityRole="button"
          accessibilityLabel="Close create menu"
        />
        <Animated.View
          style={[
            styles.sheet,
            {
              opacity: slide,
              transform: [{ translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [280, 0] }) }],
            },
          ]}
        >
          <Pressable>
            <View style={styles.handle} />
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>Create</Text>
                <Text style={styles.subtitle}>What would you like to do?</Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => handleClose()}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <X size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.list}>
              {ACTIONS.map(({ label, description, icon: Icon, route }) => (
                <TouchableOpacity
                  key={label}
                  style={styles.row}
                  onPress={() => handlePress(route)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={label}
                >
                  <View style={styles.iconBox}>
                    <Icon size={20} color={COLORS.text} />
                  </View>
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle}>{label}</Text>
                    <Text style={styles.rowDescription}>{description}</Text>
                  </View>
                  <ChevronRight size={18} color={COLORS.textTertiary} />
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    backgroundColor: COLORS.overlay,
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 32,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.borderStrong,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Inter-Bold',
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'Inter-SemiBold',
  },
  rowDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
});

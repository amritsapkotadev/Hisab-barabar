import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CircleAlert, Info } from 'lucide-react-native';
import { type AppAlertButton, type AppAlertState } from '@/contexts/AppAlertContext';
import { type ThemeColors } from '@/constants/theme';

type ThemedAlertProps = {
  alert: AppAlertState | null;
  colors: ThemeColors;
  onPressButton: (button: AppAlertButton) => void;
  onRequestClose: () => void;
};

export default function ThemedAlert({
  alert,
  colors: COLORS,
  onPressButton,
  onRequestClose,
}: ThemedAlertProps) {
  const styles = createStyles(COLORS);
  const hasDestructiveAction = alert?.buttons.some((button) => button.style === 'destructive') ?? false;
  const hasChoiceList = (alert?.buttons.length ?? 0) > 2;

  return (
    <Modal
      visible={alert !== null}
      transparent
      animationType="fade"
      onRequestClose={onRequestClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.dialog} accessibilityViewIsModal>
          <View style={[styles.icon, hasDestructiveAction && styles.destructiveIcon]}>
            {hasDestructiveAction
              ? <CircleAlert size={22} color={COLORS.negative} />
              : <Info size={22} color={COLORS.textSecondary} />}
          </View>
          <Text style={styles.title}>{alert?.title}</Text>
          {!!alert?.message && <Text style={styles.message}>{alert.message}</Text>}
          <View style={[styles.actions, hasChoiceList && styles.choiceList]}>
            {alert?.buttons.map((button, index) => {
              const isDestructive = button.style === 'destructive';
              const isCancel = button.style === 'cancel';
              const isPrimary = !hasChoiceList && !isCancel && !isDestructive &&
                (alert.buttons.length === 1 || index === alert.buttons.length - 1);
              return (
                <TouchableOpacity
                  key={`${button.text}-${index}`}
                  style={[
                    styles.actionButton,
                    hasChoiceList && styles.choiceButton,
                    isPrimary && styles.primaryButton,
                    isCancel && styles.cancelButton,
                    isDestructive && styles.destructiveButton,
                  ]}
                  onPress={() => onPressButton(button)}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                >
                  <Text style={[
                    styles.actionText,
                    isPrimary && styles.primaryText,
                    isDestructive && styles.destructiveText,
                  ]}>
                    {button.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: COLORS.overlay,
  },
  dialog: {
    width: '100%',
    maxWidth: 420,
    padding: 22,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    backgroundColor: COLORS.surfaceSecondary,
  },
  destructiveIcon: {
    backgroundColor: `${COLORS.negative}15`,
  },
  title: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  message: {
    marginTop: 8,
    color: COLORS.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Inter-Regular',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 22,
  },
  choiceList: {
    flexDirection: 'column',
    marginTop: 18,
  },
  actionButton: {
    minHeight: 46,
    minWidth: 92,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  choiceButton: {
    width: '100%',
    alignItems: 'flex-start',
  },
  primaryButton: {
    borderColor: COLORS.action,
    backgroundColor: COLORS.action,
  },
  cancelButton: {
    backgroundColor: COLORS.surfaceSecondary,
  },
  destructiveButton: {
    borderColor: `${COLORS.negative}35`,
    backgroundColor: `${COLORS.negative}12`,
  },
  actionText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  primaryText: {
    color: COLORS.actionText,
  },
  destructiveText: {
    color: COLORS.negative,
  },
});

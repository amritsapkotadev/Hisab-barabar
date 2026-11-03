import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Trash2, AlertTriangle } from 'lucide-react-native';
import { useToast } from '@/components/Toast';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useTheme';

interface DeleteConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  requiresConfirmation?: boolean;
  confirmationText?: string;
  isDangerous?: boolean;
}

export default function DeleteConfirmationModal({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Delete',
  requiresConfirmation = false,
  confirmationText = '',
  isDangerous = true,
}: DeleteConfirmationModalProps) {
  const { colors: COLORS, styles } = useThemedStyles(createStyles);
  const toast = useToast();
  const [confirmationInput, setConfirmationInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const isConfirmationValid = !requiresConfirmation || 
    confirmationInput.trim().toLowerCase() === confirmationText.toLowerCase();

  const handleConfirm = async () => {
    if (!isConfirmationValid) {
      toast.error(`Please type "${confirmationText}" to confirm`);
      return;
    }

    setIsDeleting(true);
    try {
      await onConfirm();
      setConfirmationInput('');
      onClose();
    } catch (error) {
      toast.error('Failed to delete. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setConfirmationInput('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      onRequestClose={handleClose}
      accessible
      accessibilityViewIsModal
      accessibilityLabel="Delete Confirmation Modal"
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <View style={styles.container} accessibilityRole="alert" aria-modal={true}>
          <View style={styles.content}>
            <View style={styles.titleRow}>
              <Trash2
                size={22}
                color={isDangerous ? COLORS.negative : COLORS.textSecondary}
                accessibilityLabel="Delete"
              />
              <Text style={styles.title}>{title}</Text>
            </View>
            <Text style={styles.message}>{message}</Text>

            {requiresConfirmation && (
              <View style={styles.confirmationSection}>
                <Text style={styles.confirmationLabel}>
                  Type "{confirmationText}" to confirm:
                </Text>
                <TextInput
                  style={styles.confirmationInput}
                  value={confirmationInput}
                  onChangeText={setConfirmationInput}
                  placeholder={confirmationText}
                  placeholderTextColor={COLORS.textTertiary}
                  autoCapitalize="none"
                  autoCorrect={false}
                  accessibilityLabel="Confirmation Input"
                  autoFocus
                />
              </View>
            )}

            {isDangerous && (
              <View style={styles.dangerBox}>
                <AlertTriangle size={16} color={COLORS.negative} />
                <Text style={styles.dangerText}>This action cannot be undone.</Text>
              </View>
            )}
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={isDeleting}
              accessibilityLabel="Cancel"
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.confirmButton,
                isDangerous && styles.dangerButton,
                (!isConfirmationValid || isDeleting) && styles.disabledButton,
              ]}
              onPress={handleConfirm}
              disabled={!isConfirmationValid || isDeleting}
              accessibilityLabel={confirmText}
              accessibilityRole="button"
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color={COLORS.actionText} />
              ) : (
                <Text style={styles.confirmButtonText}>{confirmText}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 22,
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 16,
  },
  content: {
    padding: 22,
    paddingBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  title: {
    flexShrink: 1,
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Inter-Bold',
  },
  message: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    fontFamily: 'Inter-Regular',
  },
  confirmationSection: {
    marginTop: 14,
  },
  confirmationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  confirmationInput: {
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.text,
    fontFamily: 'Inter-Regular',
  },
  dangerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: `${COLORS.negative}0F`,
    borderWidth: 1,
    borderColor: `${COLORS.negative}33`,
  },
  dangerText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.negative,
    fontFamily: 'Inter-SemiBold',
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 22,
    paddingBottom: 22,
    paddingTop: 0,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.surfaceSecondary,
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'Inter-SemiBold',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: COLORS.action,
    minHeight: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerButton: {
    backgroundColor: COLORS.negative,
  },
  disabledButton: {
    backgroundColor: COLORS.surfaceMuted,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.actionText,
    fontFamily: 'Inter-SemiBold',
  },
});
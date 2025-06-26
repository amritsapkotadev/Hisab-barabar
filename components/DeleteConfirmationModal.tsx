import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { X, Trash2, AlertTriangle } from 'lucide-react-native';

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
      Alert.alert('Error', `Please type "${confirmationText}" to confirm`);
      return;
    }

    setIsDeleting(true);
    try {
      await onConfirm();
      setConfirmationInput('');
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete. Please try again.');
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
        <View style={styles.container} accessibilityRole="dialog" aria-modal="true">
          <View style={styles.header}>
            <View style={[styles.iconContainer, isDangerous && styles.dangerIconContainer]}>
              {isDangerous ? (
                <AlertTriangle size={24} color="#dc2626" accessibilityLabel="Danger" />
              ) : (
                <Trash2 size={24} color="#6b7280" accessibilityLabel="Delete" />
              )}
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose} accessibilityLabel="Close Modal">
              <X size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={styles.title}>{title}</Text>
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
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="none"
                  autoCorrect={false}
                  accessibilityLabel="Confirmation Input"
                  autoFocus
                />
              </View>
            )}

            {isDangerous && (
              <View style={styles.warningCard}>
                <Text style={styles.warningText}>
                  ⚠️ This action cannot be undone. All data will be permanently deleted.
                </Text>
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
                isDangerous && { shadowColor: '#dc2626', shadowOpacity: 0.3, shadowRadius: 6, elevation: 6 },
              ]}
              onPress={handleConfirm}
              disabled={!isConfirmationValid || isDeleting}
              accessibilityLabel={confirmText}
              accessibilityRole="button"
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Trash2 size={16} color="#ffffff" />
                  <Text style={styles.confirmButtonText}>{confirmText}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 0,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dangerIconContainer: {
    backgroundColor: '#fef2f2',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  confirmationSection: {
    marginBottom: 16,
  },
  confirmationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  confirmationInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  warningCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  warningText: {
    fontSize: 12,
    color: '#92400e',
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingTop: 0,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#6b7280',
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dangerButton: {
    backgroundColor: '#dc2626',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});
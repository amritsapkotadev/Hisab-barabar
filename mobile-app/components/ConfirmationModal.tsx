import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useTheme';

type ConfirmationModalProps = {
  visible: boolean;
  message: string;
  onConfirm: () => void;
};

export default function ConfirmationModal({
  visible,
  message,
  onConfirm
}: ConfirmationModalProps) {
  const { colors: COLORS, styles } = useThemedStyles(createStyles);
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 3,
          useNativeDriver: true
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true
        })
      ]).start();
    } else {
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onConfirm}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Animated.View 
            style={{
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim
            }}
          >
            <CheckCircle2 size={60} color={COLORS.positive} />
          </Animated.View>
          <Text style={styles.message}>{message}</Text>
          <TouchableOpacity 
            style={styles.okButton}
            onPress={onConfirm}
          >
            <Text style={styles.okButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center'
  },
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 22,
    padding: 24,
    width: '80%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 16,
    color: COLORS.text,
    fontFamily: 'Inter-Medium',
    lineHeight: 24,
  },
  okButton: {
    backgroundColor: COLORS.action,
    minHeight: 48,
    paddingHorizontal: 36,
    justifyContent: 'center',
    borderRadius: 14,
    marginTop: 8
  },
  okButtonText: {
    color: COLORS.actionText,
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  }
});

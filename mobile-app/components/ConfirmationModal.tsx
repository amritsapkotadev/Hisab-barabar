import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';

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
            <CheckCircle2 size={60} color="#10b981" />
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    alignItems: 'center'
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 16,
    color: '#333'
  },
  okButton: {
    backgroundColor: '#10b981',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginTop: 8
  },
  okButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14
  }
});

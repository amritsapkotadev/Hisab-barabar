import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useCameraPermission, useCameraDevices, useCodeScanner, Camera } from 'react-native-vision-camera';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

export default function QRScannerScreen() {
  const [hasPermission, setHasPermission] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const devices = useCameraDevices();
  const device = devices.back;
  
  const { hasPermission: cameraPermission, requestPermission } = useCameraPermission();

  useEffect(() => {
    (async () => {
      if (!cameraPermission) {
        const granted = await requestPermission();
        setHasPermission(granted);
      } else {
        setHasPermission(true);
      }
    })();
  }, [cameraPermission]);

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: (codes) => {
      if (codes.length > 0 && codes[0].value) {
        setScannedData(codes[0].value);
        // Handle the scanned QR code data (e.g., join group)
        handleJoinGroup(codes[0].value);
      }
    },
  });

  const handleJoinGroup = async (qrData: string) => {
    try {
      // Parse the QR data (assuming it contains groupId and invitation code)
      const data = JSON.parse(qrData);
      
      if (data.groupId && data.invitationCode) {
        // Call your API to join the group
        await apiService.joinGroup(data.groupId, data.invitationCode);
        
        // Show success message and navigate back
        alert('Successfully joined the group!');
        router.back();
      }
    } catch (error) {
      console.error('Error joining group:', error);
      alert('Invalid QR code or group invitation');
    }
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text>Camera permission not granted</Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <Text>Camera device not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <ChevronLeft size={24} color="#FFF" />
      </TouchableOpacity>
      
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        codeScanner={codeScanner}
      />
      
      <View style={styles.overlay}>
        <View style={styles.border} />
        <Text style={styles.helpText}>Scan a group QR code to join</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 20,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  border: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#7E57C2',
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  helpText: {
    marginTop: 30,
    color: '#FFF',
    fontSize: 16,
  },
});
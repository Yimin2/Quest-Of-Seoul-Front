import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText, ThemedView } from '@shared/ui';

export default function CameraModeScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraReady, setIsCameraReady] = useState(false);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  if (!permission) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText>카메라 권한 상태를 확인하는 중...</ThemedText>
      </ThemedView>
    );
  }

  if (!permission.granted) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText style={styles.title}>카메라 접근 권한이 필요합니다.</ThemedText>
        <Pressable style={styles.permissionButton} onPress={requestPermission}>
          <ThemedText style={styles.permissionText}>권한 허용하기</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        onCameraReady={() => setIsCameraReady(true)}
      />
      <ThemedText style={styles.statusText}>
        {isCameraReady ? '카메라가 준비되었습니다.' : '카메라를 준비 중입니다...'}
      </ThemedText>

      <Pressable style={styles.closeButton} onPress={() => router.back()}>
        <Ionicons name="close" size={24} color="#fff" />
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  statusText: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    color: '#fff',
    fontSize: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  title: {
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: '#5B7DFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  permissionText: {
    color: '#fff',
    fontWeight: '600',
  },
});

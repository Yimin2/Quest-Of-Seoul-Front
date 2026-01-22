import { ThemedText } from '@shared/ui';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Platform, Pressable, Share, StyleSheet, View } from 'react-native';

// expo-media-library를 동적으로 import (설치되지 않은 경우 대비)
let MediaLibrary: any = null;
try {
  MediaLibrary = require('expo-media-library');
} catch (e) {
  // Ignore
}

export default function PhotoZoneSaveScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const photoUri = params.photoUri as string;
  const questId = params.questId as string;
  const questName = params.questName as string;

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);

      if (!MediaLibrary) {
        // expo-media-library가 없는 경우 공유 기능으로 대체
        await handleShare();
        setSaving(false);
        return;
      }

      // 미디어 라이브러리 권한 요청
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Media library permission is required to save photos.');
        setSaving(false);
        return;
      }

      // base64 데이터를 임시 파일로 저장
      const filename = `photo-zone-${Date.now()}.jpg`;
      const fileUri = `${FileSystem.cacheDirectory}${filename}`;

      // base64에서 data:image/jpeg;base64, 부분 제거
      const base64Data = photoUri.replace(/^data:image\/\w+;base64,/, '');

      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: 'base64',
      });

      // MediaLibrary에 저장
      await MediaLibrary.createAssetAsync(fileUri);

      // 임시 파일 삭제
      await FileSystem.deleteAsync(fileUri, { idempotent: true });

      Alert.alert('Save Complete', 'Photo has been saved to gallery.');
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to save photo.');
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: `Quest of Seoul - ${questName}\n${photoUri}`,
        url: Platform.OS === 'ios' ? photoUri : undefined,
      });

      if (result.action === Share.sharedAction) {
        Alert.alert('Share Complete', 'Photo has been shared.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share photo.');
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </Pressable>
        <ThemedText style={styles.headerTitle}>{questName}</ThemedText>
        <Pressable onPress={handleBack}>
          <Ionicons name="close" size={24} color="#fff" />
        </Pressable>
      </View>

      {/* Photo Display */}
      <View style={styles.photoContainer}>
        <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="contain" />
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Pressable
          style={[styles.actionButton, styles.discoverButton]}
          onPress={() => router.back()}
        >
          <Ionicons name="sparkles" size={20} color="#fff" />
          <ThemedText style={styles.actionButtonText}>no Discover this place more</ThemedText>
        </Pressable>

        <Pressable style={[styles.actionButton, styles.nextButton]} onPress={() => router.back()}>
          <Ionicons name="flag" size={20} color="#fff" />
          <ThemedText style={styles.actionButtonText}>Move on to next quest</ThemedText>
        </Pressable>
      </View>

      {/* Save and Share Buttons */}
      <View style={styles.saveShareButtons}>
        <Pressable
          style={[styles.saveShareButton, styles.saveButton]}
          onPress={handleSave}
          disabled={saving}
        >
          <Ionicons name="download" size={20} color="#fff" />
          <ThemedText style={styles.saveShareButtonText}>
            {saving ? '저장 중...' : '저장'}
          </ThemedText>
        </Pressable>

        <Pressable style={[styles.saveShareButton, styles.shareButton]} onPress={handleShare}>
          <Ionicons name="share-social" size={20} color="#fff" />
          <ThemedText style={styles.saveShareButtonText}>공유</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  photoContainer: {
    flex: 1,
    marginHorizontal: 20,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
    marginBottom: 20,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  actionButtons: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    gap: 8,
  },
  discoverButton: {
    backgroundColor: '#fff',
  },
  nextButton: {
    backgroundColor: '#FF7F50',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  saveShareButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  saveShareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  saveButton: {
    backgroundColor: '#5B7DFF',
  },
  shareButton: {
    backgroundColor: '#76C7AD',
  },
  saveShareButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});

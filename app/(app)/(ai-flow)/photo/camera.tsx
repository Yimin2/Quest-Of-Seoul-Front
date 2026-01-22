import { ThemedText } from '@shared/ui';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ScreenCapture from 'expo-screen-capture';
import { useEffect, useRef, useState } from 'react';
import { Alert, Dimensions, Image, Pressable, StyleSheet, View } from 'react-native';
import Svg, { ClipPath, Defs, G, Path, Rect } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

interface OverlayImage {
  id: number;
  source: any;
  position: { x: number; y: number };
}

export default function PhotoZoneCameraScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const questId = params.questId as string;
  const questName = params.questName as string;

  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [overlayImages, setOverlayImages] = useState<OverlayImage[]>([]);
  const [rawPhotoUri, setRawPhotoUri] = useState<string | null>(null);
  const [combinedPhoto, setCombinedPhoto] = useState<string | null>(null);
  const [scannedQRCodes, setScannedQRCodes] = useState<Set<string>>(new Set());

  const cameraRef = useRef<CameraView>(null);
  const overlayIdCounter = useRef<number>(Date.now());

  // QR 코드 리스트
  const validQRCodes = ['QUEST-STAMP-001', 'QUEST-STAMP-002', 'QUEST-STAMP-003'];

  const characterImages = [
    require('@/assets/images/c_1.png'),
    require('@/assets/images/c_2.png'),
    require('@/assets/images/c_3.png'),
  ];

  useEffect(() => {
    if (!permission) requestPermission();
  }, [permission]);

  const onBarcodeScanned = ({ data }: any) => {
    if (scanning) return;

    let clean = data.trim().toUpperCase();

    // 이미 스캔된 QR 코드인지 확인
    if (scannedQRCodes.has(clean)) {
      return; // 이미 스캔된 QR 코드면 무시
    }

    setScanning(true);

    const index = validQRCodes.indexOf(clean);

    if (index !== -1) {
      // 스캔된 QR 코드를 Set에 추가
      setScannedQRCodes((prev) => new Set(prev).add(clean));

      overlayIdCounter.current += 1;
      // 고유 ID 생성: 타임스탬프 + 카운터 + 인덱스 + 랜덤
      const uniqueId =
        Date.now() * 10000 +
        overlayIdCounter.current * 100 +
        index * 10 +
        Math.floor(Math.random() * 10);
      const newOverlay: OverlayImage = {
        id: uniqueId,
        source: characterImages[index],
        position: { x: width * 0.2, y: height * 0.3 },
      };

      setOverlayImages((prev) => [...prev, newOverlay]);
      Alert.alert('QR Success!', `Character ${index + 1} added`);
    } else {
      Alert.alert('QR Failed', 'Please scan a valid QR code');
    }

    setTimeout(() => setScanning(false), 2000);
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });

      setRawPhotoUri(photo.uri);
    } catch (e) {
      Alert.alert('Error', 'Failed to take picture');
    }
  };

  const mergeWithScreenshot = async () => {
    try {
      // @ts-ignore: captureScreenAsync does not exist on expo-screen-capture
      const uri = await ScreenCapture.captureScreenAsync({
        quality: 0.7,
      });

      setCombinedPhoto(uri);
    } catch (e) {
      Alert.alert('Error', 'Failed to capture screen');
    }
  };

  const goToSaveScreen = () => {
    if (!combinedPhoto) return;

    router.push({
      pathname: '/(app)/(ai-flow)/photo/save',
      params: {
        photoUri: combinedPhoto,
        questId: questId,
        questName: questName,
      },
    });
  };

  // =======================
  // 촬영 후 미리보기
  // =======================
  if (rawPhotoUri && !combinedPhoto) {
    return (
      <View style={styles.previewContainer}>
        <Image source={{ uri: rawPhotoUri }} style={styles.previewImage} />

        {/* 오버레이 이미지 */}
        {overlayImages.map((overlay) => (
          <Image
            key={overlay.id}
            source={overlay.source}
            style={[
              styles.overlayImage,
              {
                left: overlay.position.x,
                top: overlay.position.y,
              },
            ]}
          />
        ))}

        <View style={styles.previewButtons}>
          <Pressable
            style={[styles.previewButton, styles.retakeButton]}
            onPress={() => {
              setRawPhotoUri(null);
              setOverlayImages([]);
              setScannedQRCodes(new Set());
            }}
          >
            <ThemedText style={styles.previewButtonText}>다시 찍기</ThemedText>
          </Pressable>

          <Pressable
            style={[styles.previewButton, styles.saveButton]}
            onPress={mergeWithScreenshot}
          >
            <ThemedText style={styles.previewButtonText}>확정</ThemedText>
          </Pressable>
        </View>
      </View>
    );
  }

  // =======================
  // 최종 저장 화면 이동
  // =======================
  if (combinedPhoto) {
    goToSaveScreen();
    return null;
  }

  // =======================
  // 기본 카메라 화면
  // =======================
  if (!permission?.granted) {
    return (
      <View style={styles.center}>
        <ThemedText style={styles.permissionText}>카메라 권한이 필요합니다.</ThemedText>
        <Pressable style={styles.permissionButton} onPress={requestPermission}>
          <ThemedText style={styles.permissionButtonText}>권한 허용하기</ThemedText>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Svg width="17" height="17" viewBox="0 0 17 17" fill="none">
            <Path
              d="M3.125 16.25C3.37364 16.25 3.6121 16.1512 3.78791 15.9754C3.96373 15.7996 4.0625 15.5611 4.0625 15.3125L4.0625 14.0625L5.3125 14.0625C5.56114 14.0625 5.7996 13.9637 5.97541 13.7879C6.15123 13.6121 6.25 13.3736 6.25 13.125C6.25 12.8764 6.15123 12.6379 5.97541 12.4621C5.7996 12.2863 5.56114 12.1875 5.3125 12.1875L4.0625 12.1875L4.0625 10.9375C4.0625 10.6889 3.96373 10.4504 3.78791 10.2746C3.6121 10.0988 3.37364 10 3.125 10C2.87636 10 2.6379 10.0988 2.46209 10.2746C2.28627 10.4504 2.1875 10.6889 2.1875 10.9375L2.1875 12.1875L0.937498 12.1875C0.688858 12.1875 0.450402 12.2863 0.274587 12.4621C0.0987705 12.6379 -1.61242e-06 12.8764 -1.63415e-06 13.125C-1.65589e-06 13.3736 0.0987704 13.6121 0.274587 13.7879C0.450402 13.9637 0.688858 14.0625 0.937498 14.0625L2.1875 14.0625L2.1875 15.3125C2.1875 15.5611 2.28627 15.7996 2.46209 15.9754C2.6379 16.1512 2.87636 16.25 3.125 16.25ZM13.75 15C14.413 15 15.0489 14.7366 15.5178 14.2678C15.9866 13.7989 16.25 13.163 16.25 12.5L16.25 2.5C16.25 1.83696 15.9866 1.20108 15.5178 0.732235C15.0489 0.263394 14.413 1.74676e-06 13.75 1.68879e-06L3.75 8.14564e-07C3.08696 7.56599e-07 2.45107 0.263393 1.98223 0.732234C1.51339 1.20107 1.25 1.83696 1.25 2.5L1.25 8.98875C1.74292 8.47357 2.41311 8.16484 3.125 8.125C3.76856 8.15893 4.38094 8.41285 4.85969 8.84427C5.33843 9.27569 5.6545 9.85843 5.755 10.495C6.39157 10.5955 6.97431 10.9116 7.40573 11.3903C7.83715 11.8691 8.09107 12.4814 8.125 13.125C8.08516 13.8369 7.77643 14.5071 7.26125 15L12.3925 15L13.75 15ZM12.5 12.5C12.1685 12.5 11.8505 12.3683 11.6161 12.1339C11.3817 11.8995 11.25 11.5815 11.25 11.25C11.25 10.9185 11.3817 10.6005 11.6161 10.3661C11.8505 10.1317 12.1685 10 12.5 10C12.8315 10 13.1495 10.1317 13.3839 10.3661C13.6183 10.6005 13.75 10.9185 13.75 11.25C13.75 11.5815 13.6183 11.8995 13.3839 12.1339C13.1495 12.3683 12.8315 12.5 12.5 12.5ZM6.25 8.49125C6.16778 8.49123 6.08637 8.47499 6.01044 8.44346C5.93451 8.41193 5.86555 8.36573 5.8075 8.3075L3.3075 5.8075C3.19066 5.69037 3.12504 5.53169 3.125 5.36625L3.125 2.5C3.125 2.33424 3.19085 2.17527 3.30806 2.05806C3.42527 1.94085 3.58424 1.875 3.75 1.875L13.75 1.875C13.9158 1.875 14.0747 1.94085 14.1919 2.05806C14.3092 2.17527 14.375 2.33424 14.375 2.5L14.375 5.36625C14.375 5.53169 14.3093 5.69037 14.1925 5.8075L12.9425 7.0575C12.8844 7.1157 12.8155 7.16188 12.7395 7.19339C12.6636 7.2249 12.5822 7.24112 12.5 7.24112C12.4178 7.24112 12.3364 7.2249 12.2605 7.19339C12.1845 7.16188 12.1156 7.1157 12.0575 7.0575L10.4425 5.4425C10.3844 5.3843 10.3155 5.33812 10.2395 5.30661C10.1636 5.2751 10.0822 5.25888 10 5.25888C9.91779 5.25888 9.83639 5.2751 9.76046 5.30661C9.68453 5.33812 9.61556 5.3843 9.5575 5.4425L6.6925 8.3075C6.63445 8.36573 6.56549 8.41193 6.48956 8.44346C6.41362 8.47499 6.33222 8.49123 6.25 8.49125Z"
              fill="white"
            />
          </Svg>
          <ThemedText style={styles.headerTitle}>Code Scan</ThemedText>
        </View>
        <Pressable onPress={() => router.back()}>
          <Svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <G clipPath="url(#clip0_6_24772)">
              <Path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M1.82891 0.313458C1.62684 0.118289 1.35619 0.0102947 1.07527 0.0127358C0.794342 0.015177 0.525614 0.127858 0.326962 0.32651C0.128311 0.525161 0.0156299 0.793889 0.0131887 1.07481C0.0107476 1.35574 0.118742 1.62638 0.313911 1.82846L5.98498 7.49953L0.313911 13.1706C0.211579 13.2694 0.129955 13.3877 0.0738023 13.5184C0.0176498 13.6491 -0.0119069 13.7897 -0.0131431 13.932C-0.0143794 14.0742 0.0127296 14.2153 0.066602 14.347C0.120474 14.4787 0.200031 14.5983 0.300631 14.6989C0.40123 14.7995 0.520857 14.879 0.652532 14.9329C0.784206 14.9868 0.925291 15.0139 1.06756 15.0127C1.20982 15.0114 1.35041 14.9819 1.48113 14.9257C1.61185 14.8696 1.73008 14.7879 1.82891 14.6856L7.49998 9.01453L13.1711 14.6856C13.3731 14.8808 13.6438 14.9888 13.9247 14.9863C14.2056 14.9839 14.4743 14.8712 14.673 14.6726C14.8717 14.4739 14.9843 14.2052 14.9868 13.9242C14.9892 13.6433 14.8812 13.3727 14.6861 13.1706L9.01498 7.49953L14.6861 1.82846C14.8812 1.62638 14.9892 1.35574 14.9868 1.07481C14.9843 0.793889 14.8717 0.525161 14.673 0.32651C14.4743 0.127858 14.2056 0.015177 13.9247 0.0127358C13.6438 0.0102947 13.3731 0.118289 13.1711 0.313458L7.49998 5.98453L1.82891 0.313458Z"
                fill="white"
              />
            </G>
            <Defs>
              <ClipPath id="clip0_6_24772">
                <Rect width="15" height="15" fill="white" />
              </ClipPath>
            </Defs>
          </Svg>
        </Pressable>
      </View>

      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={onBarcodeScanned}
        />
        {overlayImages.map((overlay) => (
          <Image
            key={overlay.id}
            source={overlay.source}
            style={[styles.overlayImage, { left: overlay.position.x, top: overlay.position.y }]}
          />
        ))}
      </View>

      <Pressable style={styles.captureButton} onPress={takePicture}>
        <View style={styles.captureInner} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A', paddingTop: 60 },
  center: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  permissionText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: '#5B7DFF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#fff',
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
  },

  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
    backgroundColor: '#000',
  },

  overlayImage: {
    position: 'absolute',
    width: 120,
    height: 120,
    resizeMode: 'contain',
  },

  captureButton: {
    alignSelf: 'center',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 30,
  },
  captureInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#5B7DFF',
  },

  previewContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  previewButtons: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  previewButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  retakeButton: { backgroundColor: '#64748B' },
  saveButton: { backgroundColor: '#5B7DFF' },
  previewButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

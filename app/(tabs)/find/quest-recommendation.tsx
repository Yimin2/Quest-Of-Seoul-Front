import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { aiStationApi } from '@shared/api';

const API_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  (Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000');

const categories = [
  'History',
  'Nature',
  'Culture',
  'Events',
  'Shopping',
  'Food',
  'Extreme',
  'Activities',
];

export default function QuestRecommendationScreen() {
  const router = useRouter();
  const { from } = useLocalSearchParams();
  const [images, setImages] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCategoryBox, setShowCategoryBox] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow location access.');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
    })();
  }, []);

  const convertToBase64 = async (uri: string) => {
    const file = new File(uri);
    return file.base64();
  };

  const pickImage = async () => {
    if (images.length >= 3) {
      Alert.alert('Maximum 3 Images', 'You can upload up to 3 images.');
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Please allow photo library access.');
      return;
    }

    const remainingSlots = 3 - images.length;

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      allowsMultipleSelection: true,
      selectionLimit: remainingSlots,
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!result.canceled) {
      const newImages = result.assets.map((asset) => asset.uri);
      setImages([...images, ...newImages].slice(0, 3));
    }
  };

  const openCamera = async () => {
    if (images.length >= 3) {
      Alert.alert('Maximum 3 Images', 'You can upload up to 3 images.');
      return;
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Please allow camera access.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImages([...images, result.assets[0].uri].slice(0, 3));
    }
  };

  const chooseUploadMethod = () => {
    Alert.alert('Upload Image', 'How would you like to upload the image?', [
      { text: 'Take Photo', onPress: openCamera },
      { text: 'Choose from Album', onPress: pickImage },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleRecommend = async () => {
    if (images.length === 0 || !selectedCategory) return;

    setIsLoading(true);

    try {
      // 모든 이미지로 검색 후 결과 병합
      const allRecommendations = [];
      const seenPlaceIds = new Set<string>();

      for (const imageUri of images) {
        const base64 = await convertToBase64(imageUri);

        const data = await aiStationApi.similarPlaces({
          image: base64,
          limit: 5,
          quest_only: true,
          latitude: location?.latitude || 37.5665,
          longitude: location?.longitude || 126.978,
          radius_km: 10.0,
        });

        if (data.success && data.recommendations) {
          // 중복 제거하면서 결과 추가
          for (const rec of data.recommendations) {
            const placeId = rec.place_id || rec.quest_id;
            const placeIdStr = String(placeId);
            if (placeId && !seenPlaceIds.has(placeIdStr)) {
              seenPlaceIds.add(placeIdStr);
              allRecommendations.push(rec);
            }
          }
        }
      }

      if (allRecommendations.length === 0) {
        throw new Error('No recommendations found.');
      }

      // 유사도 기준으로 정렬
      allRecommendations.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));

      router.push({
        pathname: '/(tabs)/find/recommendation-result',
        params: {
          category: selectedCategory,
          imageUri: images[0], // 첫 번째 이미지를 대표로 사용
          result: JSON.stringify(allRecommendations.slice(0, 10)), // 최대 10개
        },
      });
    } catch (err) {
      Alert.alert('Error', 'Failed to load recommendations.');
    } finally {
      setIsLoading(false);
    }
  };

  const isButtonReady = Boolean(images.length > 0 && selectedCategory);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <LinearGradient
        colors={['#659DF2', 'rgba(118, 199, 173, 0.60)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerCard}
      >
        {/* 왼쪽 상단 뒤로가기 버튼 */}
        <Pressable
          onPress={() => {
            if (from === 'ai-station') {
              router.push('/(tabs)/ai-station');
            } else if (from === 'find') {
              router.push('/(tabs)/find');
            } else {
              router.back();
            }
          }}
          style={styles.backButton}
        >
          <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <Path
              d="M10.6058 3.07254C10.681 2.99299 10.7397 2.8994 10.7788 2.79712C10.8178 2.69485 10.8363 2.58589 10.8332 2.47647C10.8301 2.36706 10.8055 2.25932 10.7607 2.15941C10.716 2.05951 10.652 1.96939 10.5725 1.89421C10.4929 1.81903 10.3993 1.76025 10.297 1.72124C10.1948 1.68223 10.0858 1.66374 9.97639 1.66684C9.86697 1.66993 9.75923 1.69455 9.65933 1.73928C9.55942 1.78401 9.46931 1.84799 9.39413 1.92754L2.31079 9.42754C2.16451 9.58227 2.08301 9.78712 2.08301 10C2.08301 10.213 2.16451 10.4178 2.31079 10.5725L9.39413 18.0734C9.46881 18.1547 9.55891 18.2203 9.65918 18.2665C9.75945 18.3127 9.8679 18.3385 9.97823 18.3424C10.0886 18.3463 10.1986 18.3283 10.3019 18.2893C10.4052 18.2504 10.4997 18.1913 10.58 18.1155C10.6602 18.0397 10.7246 17.9487 10.7694 17.8478C10.8142 17.7469 10.8386 17.6381 10.841 17.5278C10.8434 17.4174 10.8238 17.3076 10.7834 17.2049C10.7431 17.1021 10.6827 17.0084 10.6058 16.9292L4.06246 10L10.6058 3.07254Z"
              fill="white"
            />
          </Svg>
        </Pressable>

        {/* 오른쪽 상단 카메라 아이콘 */}
        <Pressable style={styles.cameraButton} onPress={chooseUploadMethod}>
          <Svg width="23" height="22" viewBox="0 0 23 22" fill="none">
            <Path
              d="M1.66357 6.1001C1.67866 8.19164 1.67583 10.3134 1.67432 12.3677V15.2212C1.67432 15.6994 1.80209 16.0753 2.03076 16.3306C2.25874 16.5849 2.59202 16.726 3.01611 16.7261H10.1353C10.3504 16.7261 10.5562 16.8215 10.7065 16.9888C10.8563 17.1557 10.9398 17.3809 10.9399 17.6147C10.9399 17.8488 10.8565 18.0747 10.7065 18.2417C10.5562 18.409 10.3504 18.5044 10.1353 18.5044H10.0981L10.0942 18.4897H3.01221C2.14461 18.4897 1.40489 18.151 0.883301 17.5698C0.36227 16.9891 0.0610501 16.1684 0.0610352 15.2065V12.353C0.0610352 10.3035 0.0608524 8.18496 0.050293 6.10205C0.0463588 5.66034 0.121534 5.22206 0.271973 4.81299C0.422538 4.40368 0.645245 4.031 0.927246 3.71826H0.928223C1.20491 3.41729 1.53399 3.18155 1.896 3.02686C2.25759 2.87239 2.6444 2.80147 3.03174 2.81885H3.03271C3.54663 2.83528 4.06691 2.83251 4.60498 2.82764C4.68265 1.22777 5.75989 0.0629721 7.2251 0.0561523C9.11084 0.0477597 11.0253 0.0477612 12.9126 0.0561523C14.3736 0.0561523 15.4506 1.2228 15.5327 2.8208H15.7554C16.2921 2.8208 16.8478 2.82115 17.4038 2.84131H17.4048C18.1308 2.87384 18.8155 3.21996 19.314 3.8042C19.8124 4.38836 20.0862 5.16477 20.0776 5.96826V7.91162C20.0776 8.14582 19.9934 8.37151 19.8433 8.53857C19.693 8.70566 19.488 8.80127 19.2729 8.80127C19.0579 8.80122 18.8529 8.70571 18.7026 8.53857C18.5525 8.37151 18.4693 8.14582 18.4692 7.91162V5.97803C18.4791 5.62867 18.364 5.28988 18.1509 5.03564C17.9377 4.7815 17.6431 4.63257 17.3335 4.61963C17.0762 4.60708 16.8129 4.60198 16.5493 4.6001L15.7642 4.60107H14.9438C14.6653 4.57118 14.4079 4.42697 14.2212 4.19873C14.0345 3.97031 13.9314 3.67276 13.9312 3.36572V3.01025C13.9312 2.65067 13.8268 2.3596 13.6489 2.15869C13.4714 1.95836 13.2165 1.84296 12.9067 1.84131C11.0242 1.83292 9.11588 1.83292 7.23486 1.84131C6.92448 1.84131 6.67146 1.95663 6.49463 2.15674C6.31727 2.35746 6.21224 2.64798 6.2085 3.00537V3.36963C6.20888 3.69429 6.09446 4.00729 5.88818 4.23975C5.70745 4.44333 5.46879 4.57086 5.21338 4.60205L5.10303 4.60986H4.6499C4.07984 4.60986 3.54082 4.6092 2.98975 4.59912H2.98779C2.81821 4.58826 2.64806 4.61734 2.48877 4.68408C2.32946 4.75083 2.18392 4.8542 2.06201 4.98779C1.93193 5.1329 1.82985 5.30654 1.76123 5.49756C1.69262 5.68863 1.65916 5.89318 1.66357 6.09912V6.1001Z"
              fill="white"
              fillOpacity="0.5"
              stroke="white"
              strokeWidth="0.1"
            />
            <Path
              d="M22.1001 12.9084C22.1041 13.3508 21.9677 13.7831 21.7107 14.1432C21.4536 14.5034 21.089 14.7728 20.6693 14.9128L15.4916 16.6927C15.3603 16.7389 15.2244 16.7707 15.0863 16.7878V20.7233C15.0863 21.0418 14.9599 21.3472 14.7349 21.5725C14.5099 21.7978 14.2046 21.9246 13.8862 21.925C13.5679 21.9242 13.2628 21.7973 13.0379 21.5721C12.813 21.3468 12.6864 21.0416 12.686 20.7233V14.785C12.686 14.7522 12.686 14.721 12.686 14.6883V11.1284C12.686 11.0972 12.686 11.0645 12.686 11.0333C12.6907 10.9285 12.7037 10.8243 12.725 10.7216C12.784 10.425 12.9057 10.1444 13.0821 9.89868C13.2585 9.65299 13.4854 9.44788 13.7476 9.29714C14.0098 9.14641 14.3012 9.05355 14.6023 9.02476C14.9033 8.99598 15.2071 9.03193 15.4931 9.13025L20.6709 10.9102C21.0893 11.0501 21.4528 11.3187 21.7095 11.6776C21.9661 12.0364 22.1029 12.4672 22.1001 12.9084Z"
              fill="white"
              fillOpacity="0.5"
            />
            <Path
              d="M9.33154 6.08105C9.95823 5.91259 10.6168 5.89719 11.2505 6.03711C11.8841 6.17703 12.4747 6.46809 12.9722 6.88477C13.1408 7.02596 13.2467 7.22822 13.2661 7.44727C13.2855 7.66635 13.2169 7.88407 13.0757 8.05273C12.9345 8.22139 12.7323 8.32721 12.5132 8.34668C12.2941 8.36612 12.0764 8.29739 11.9077 8.15625C11.6147 7.91155 11.2669 7.74113 10.894 7.65918C10.5212 7.57724 10.1337 7.58623 9.76514 7.68555C9.39662 7.78488 9.05703 7.97136 8.77588 8.22949C8.4947 8.48765 8.28027 8.81019 8.1499 9.16895C8.01954 9.5277 7.97799 9.91258 8.02783 10.291C8.07769 10.6695 8.21718 11.031 8.43604 11.3438C8.65486 11.6564 8.94628 11.9114 9.28467 12.0879C9.62299 12.2643 9.99879 12.3569 10.3804 12.3574C10.6003 12.3574 10.8118 12.4451 10.9673 12.6006C11.1227 12.756 11.2104 12.9667 11.2104 13.1865C11.2104 13.4065 11.1228 13.6179 10.9673 13.7734C10.8121 13.9286 10.6017 14.0152 10.3823 14.0156V14.0166H10.3804V14.0156C9.73214 14.0157 9.09326 13.8605 8.51807 13.5615C7.94227 13.2622 7.44727 12.8282 7.07471 12.2969C6.70214 11.7655 6.46357 11.1521 6.37842 10.5088C6.29329 9.86559 6.36404 9.21142 6.58545 8.60156C6.80691 7.9917 7.17191 7.44363 7.6499 7.00488C8.12787 6.56622 8.70507 6.24956 9.33154 6.08105Z"
              fill="white"
              fillOpacity="0.5"
              stroke="white"
              strokeWidth="0.1"
            />
          </Svg>
        </Pressable>

        {/* 헤더 콘텐츠 */}
        <View style={styles.headerContent}>
          {/* 왼쪽: 라이언 이미지 */}
          <Image source={require('@/assets/images/rion.png')} style={styles.rionImage} />

          {/* 왼쪽 아래: 카메라 SVG */}
          <Svg width="33" height="33" viewBox="0 0 40 40" fill="none" style={styles.cameraSvg}>
            <Path
              d="M26.5937 4.62025L26.5926 4.62096C28.7105 5.15028 29.8508 7.2367 29.3788 9.59131L29.7236 9.6775C30.505 9.87277 31.3137 10.0749 32.1152 10.3064L32.1161 10.3066C33.1537 10.6159 34.0188 11.3637 34.5288 12.3893C35.0388 13.4149 35.1546 14.6382 34.8515 15.7988L34.1447 18.6268C34.0609 18.962 33.8601 19.2546 33.5862 19.4395C33.3122 19.6245 32.9865 19.6871 32.6808 19.6108C32.375 19.5344 32.1162 19.3256 31.9614 19.0334C31.8069 18.7415 31.7682 18.3889 31.8519 18.0538L32.5549 15.2409C32.6978 14.7303 32.6535 14.1891 32.4328 13.7357C32.2397 13.3391 31.9254 13.0385 31.5465 12.8801L31.3802 12.8204C31.0102 12.7085 30.6286 12.6053 30.2456 12.5066L29.1016 12.2227L27.9107 11.9251C27.5225 11.7827 27.2045 11.484 27.0184 11.0891C26.8325 10.6944 26.7915 10.231 26.9013 9.78951L27.0308 9.27127C27.1628 8.74332 27.117 8.27534 26.9277 7.91175C26.7386 7.54877 26.4037 7.28407 25.9471 7.1674C23.2106 6.47052 20.4336 5.77649 17.6931 5.10458L17.6922 5.10435C17.2342 4.98997 16.8167 5.06647 16.4802 5.29771C16.1432 5.52953 15.8824 5.92061 15.7459 6.44389L15.6135 6.9735C15.4974 7.44049 15.2201 7.84845 14.8407 8.10807C14.4612 8.36772 14.0098 8.45838 13.5845 8.35781L12.9251 8.19301C12.0953 7.98563 11.3111 7.78913 10.513 7.57407L10.5111 7.57359C10.2645 7.49492 10.0025 7.47468 9.74271 7.51444C9.54792 7.54425 9.35729 7.60765 9.1776 7.70136L9.00162 7.80535C8.75663 7.97107 8.54209 8.18828 8.37094 8.44395C8.19979 8.69968 8.0759 8.98874 8.00673 9.29309L8.00649 9.29404C7.26774 12.3433 6.49133 15.4304 5.74194 18.4196L4.70414 22.5722C4.52929 23.2721 4.5782 23.8715 4.82175 24.3329C5.06486 24.7934 5.50538 25.1237 6.1283 25.2795L16.4884 27.8687C16.7941 27.9451 17.0531 28.153 17.208 28.4451C17.3627 28.7371 17.4012 29.0895 17.3175 29.4247C17.2337 29.7599 17.0338 30.0528 16.76 30.2376C16.4859 30.4227 16.1596 30.4842 15.8538 30.4078L15.8178 30.3988L15.8166 30.3753L5.49254 27.7951C4.23699 27.4812 3.29076 26.7253 2.74657 25.6966C2.20258 24.6681 2.06177 23.3698 2.41043 21.9748L3.44823 17.8222C3.8209 16.331 4.19985 14.8149 4.57837 13.2921L5.70638 8.72222C5.86062 8.08074 6.12913 7.4735 6.4952 6.93535C6.86144 6.397 7.31832 5.93804 7.8397 5.58733L8.03391 5.46676C8.49059 5.19837 8.98387 5.01828 9.49098 4.93704C10.0707 4.84419 10.6562 4.88195 11.2108 5.04776L11.2098 5.04752C11.9589 5.26039 12.7242 5.44674 13.5166 5.63711C14.202 3.33331 16.1896 2.03064 18.3161 2.55152C21.0635 3.22517 23.8502 3.92162 26.5937 4.62025Z"
              fill="white"
              stroke="white"
              strokeWidth="0.1"
            />
            <Path
              d="M35.2947 26.6402C35.1395 27.2855 34.7838 27.865 34.2788 28.2956C33.7737 28.7262 33.1452 28.9856 32.4835 29.0367L24.3012 29.7439C24.0934 29.7633 23.8842 29.7602 23.677 29.7348L22.2457 35.462C22.1298 35.9254 21.8348 36.3239 21.4254 36.57C21.016 36.816 20.5256 36.8895 20.0621 36.7743C19.5991 36.6573 19.2014 36.3617 18.956 35.9521C18.7106 35.5426 18.6375 35.0524 18.7526 34.589L20.9124 25.9473C20.9243 25.8996 20.9356 25.8542 20.9475 25.8066L22.2422 20.6261C22.2536 20.5808 22.2655 20.5331 22.2768 20.4877C22.3217 20.337 22.3786 20.19 22.4469 20.0483C22.6406 19.638 22.9198 19.274 23.2659 18.9806C23.6119 18.6872 24.0167 18.4712 24.453 18.3472C24.8894 18.2232 25.3473 18.1941 25.7959 18.2617C26.2445 18.3293 26.6735 18.4921 27.0539 18.7392L33.9414 23.2126C34.4994 23.5684 34.9307 24.0914 35.1738 24.707C35.4168 25.3225 35.4591 25.9992 35.2947 26.6402Z"
              fill="white"
            />
            <Path
              d="M19.1974 12.086C20.1665 12.0689 21.1254 12.2851 21.993 12.7173C22.8606 13.1496 23.6116 13.7848 24.1816 14.5688L24.248 14.6699C24.3897 14.9119 24.4439 15.1966 24.3998 15.4759C24.3495 15.7954 24.1744 16.082 23.9129 16.2723C23.6515 16.4624 23.3251 16.5408 23.0058 16.4905C22.6864 16.4401 22.3997 16.265 22.2095 16.0036C21.8698 15.5378 21.4232 15.1606 20.907 14.904C20.3906 14.6473 19.8196 14.5189 19.2431 14.5294C18.6666 14.54 18.1009 14.6886 17.5944 14.9639C17.0878 15.2393 16.6547 15.6331 16.3323 16.1111C16.0099 16.5891 15.8077 17.1383 15.7422 17.7111C15.6767 18.2838 15.7505 18.864 15.9566 19.4024C16.1628 19.9408 16.4956 20.4219 16.9269 20.8045C17.3582 21.187 17.875 21.4604 18.434 21.6009C18.7476 21.6793 19.0178 21.8786 19.1842 22.1558C19.3505 22.433 19.3993 22.7651 19.3209 23.0788C19.2425 23.3924 19.0432 23.6626 18.766 23.8289C18.4896 23.9947 18.1589 24.0428 17.8461 23.9654L17.8459 23.9664L17.843 23.9657L17.8433 23.9647C16.9036 23.73 16.0341 23.2734 15.3086 22.6317C14.5826 21.9894 14.0221 21.1815 13.6746 20.2765C13.3272 19.3716 13.2027 18.396 13.3123 17.4329C13.4219 16.4699 13.7626 15.5473 14.3045 14.7437C14.8464 13.94 15.5743 13.2784 16.4261 12.8158C17.2777 12.3532 18.2284 12.1032 19.1974 12.086Z"
              fill="white"
              stroke="white"
              strokeWidth="0.1"
            />
          </Svg>

          {/* 오른쪽: 텍스트 */}
          <View style={styles.textContainer}>
            <Text style={styles.headerTitle}>AI Docent{'\n'}Recommendations</Text>
            <Text style={styles.headerSubtitle}>
              Show me an image of the place!{'\n'}I will find out similar places for you
            </Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.contentContainer}>
        <TouchableOpacity
          style={styles.stackedImagesContainer}
          onPress={images.length === 0 ? chooseUploadMethod : undefined}
          activeOpacity={images.length > 0 ? 1 : 0.7}
        >
          {/* 빈 슬롯들 (뒤에서부터) */}
          {images.length === 0 && (
            <>
              {/* 세 번째 카드 (맨 뒤) */}
              <View style={[styles.imageCard, styles.cardBack3]}>
                <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={styles.plusIcon}>
                  <Path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" fill="white" />
                </Svg>
              </View>
              {/* 두 번째 카드 (중간) */}
              <View style={[styles.imageCard, styles.cardBack2]}>
                <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={styles.plusIcon}>
                  <Path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" fill="white" />
                </Svg>
              </View>
              {/* 첫 번째 카드 (맨 앞) */}
              <View style={[styles.imageCard, styles.cardFront]}>
                <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={styles.plusIcon}>
                  <Path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" fill="white" />
                </Svg>
                <Text style={styles.uploadText}>Add image of the place{'\n'}up to 3</Text>
              </View>
            </>
          )}

          {/* 이미지가 있을 때 */}
          {images.length > 0 && (
            <View style={styles.imageStackWrapper}>
              {/* 세 번째 슬롯 (맨 뒤) */}
              {images.length >= 3 ? (
                <View style={[styles.imageCard, styles.cardBack3]}>
                  <Image source={{ uri: images[2] }} style={styles.cardImage} />
                  <TouchableOpacity style={styles.closeButton} onPress={() => removeImage(2)}>
                    <Ionicons name="close" size={18} color="white" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.imageCard, styles.cardBack3]}
                  onPress={chooseUploadMethod}
                >
                  <Svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    style={styles.plusIcon}
                  >
                    <Path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" fill="white" />
                  </Svg>
                </TouchableOpacity>
              )}

              {/* 두 번째 슬롯 (중간) */}
              {images.length >= 2 ? (
                <View style={[styles.imageCard, styles.cardBack2]}>
                  <Image source={{ uri: images[1] }} style={styles.cardImage} />
                  <TouchableOpacity style={styles.closeButton} onPress={() => removeImage(1)}>
                    <Ionicons name="close" size={18} color="white" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.imageCard, styles.cardBack2]}
                  onPress={chooseUploadMethod}
                >
                  <Svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    style={styles.plusIcon}
                  >
                    <Path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" fill="white" />
                  </Svg>
                </TouchableOpacity>
              )}

              {/* 첫 번째 슬롯 (맨 앞) */}
              <View style={[styles.imageCard, styles.cardFront]}>
                <Image source={{ uri: images[0] }} style={styles.cardImage} />
                <TouchableOpacity style={styles.closeButton} onPress={() => removeImage(0)}>
                  <Ionicons name="close" size={18} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </TouchableOpacity>

        <View style={[styles.filterContainer, showCategoryBox && styles.filterContainerExpanded]}>
          <TouchableOpacity
            style={styles.filterToggle}
            onPress={() => setShowCategoryBox(!showCategoryBox)}
          >
            <Text style={styles.filterToggleText}>Choose a filter for accuracy</Text>
            <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <Path
                d="M14.8571 9.14286H9.14286V14.8571C9.14286 15.1602 9.02245 15.4509 8.80812 15.6653C8.5938 15.8796 8.3031 16 8 16C7.6969 16 7.40621 15.8796 7.19188 15.6653C6.97755 15.4509 6.85714 15.1602 6.85714 14.8571V9.14286H1.14286C0.839753 9.14286 0.549063 9.02245 0.334735 8.80812C0.120408 8.5938 0 8.3031 0 8C0 7.6969 0.120408 7.40621 0.334735 7.19188C0.549063 6.97755 0.839753 6.85714 1.14286 6.85714H6.85714V1.14286C6.85714 0.839753 6.97755 0.549062 7.19188 0.334735C7.40621 0.120408 7.6969 0 8 0C8.3031 0 8.5938 0.120408 8.80812 0.334735C9.02245 0.549062 9.14286 0.839753 9.14286 1.14286V6.85714H14.8571C15.1602 6.85714 15.4509 6.97755 15.6653 7.19188C15.8796 7.40621 16 7.6969 16 8C16 8.3031 15.8796 8.5938 15.6653 8.80812C15.4509 9.02245 15.1602 9.14286 14.8571 9.14286Z"
                fill="white"
              />
            </Svg>
          </TouchableOpacity>

          {showCategoryBox && (
            <View style={styles.categoriesWrapper}>
              <View style={styles.tags}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setSelectedCategory(cat)}
                    style={[styles.tag, selectedCategory === cat && styles.tagSelected]}
                  >
                    <Text style={styles.tagText}>{cat}</Text>
                  </TouchableOpacity>
                ))}

                {/* Nearest Trip 버튼 - 카테고리와 같은 flexWrap 안에 */}
                <TouchableOpacity style={styles.nearestTripButton}>
                  <Svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <Path
                      d="M0.702404 4.91659L10.515 0.198826C11.8218 -0.304898 12.2965 0.157875 11.8177 1.48066L7.27664 11.2848C7.19557 11.5085 7.0441 11.6992 6.84541 11.8277C6.64672 11.9563 6.41175 12.0156 6.1765 11.9965C5.94125 11.9775 5.7187 11.8811 5.54286 11.7223C5.36702 11.5634 5.24762 11.3508 5.20293 11.1169C4.88639 9.47878 2.79239 7.36153 1.14478 7.05438L0.876926 7.00114C0.645723 6.95733 0.435121 6.8382 0.277417 6.66205C0.119713 6.4859 0.0236217 6.26241 0.00381896 6.02586C-0.0159837 5.7893 0.041604 5.55272 0.16779 5.35237C0.293975 5.15201 0.481761 4.99892 0.702404 4.91659Z"
                      fill="#659DF2"
                    />
                  </Svg>
                  <Text style={styles.nearestTripText}>Nearest Trip</Text>
                </TouchableOpacity>

                {/* Most Rewarded 버튼 */}
                <TouchableOpacity style={styles.mostRewardedButton}>
                  <Svg width="20" height="12" viewBox="0 0 20 12" fill="none">
                    <Path
                      d="M20 6.01852V6.40605C20 6.95444 19.6761 7.42058 19.1766 7.73499C19.7955 8.20661 20.1267 8.90489 19.9385 9.56296L19.8281 9.92856C19.5241 10.9796 18.0185 11.3818 16.7518 10.753L15.6009 10.1845C15.2737 10.0249 14.9847 9.79533 14.754 9.51178C14.5684 9.77264 14.3614 10.0172 14.1351 10.243C13.5333 10.8518 12.8086 11.3225 12.0105 11.623C11.2123 11.9234 10.3595 12.0467 9.50996 11.9842C8.66045 11.9218 7.83422 11.6751 7.08756 11.2611C6.3409 10.847 5.69133 10.2753 5.18307 9.5849C4.96318 9.83235 4.69766 10.0341 4.40134 10.179L3.25044 10.7475C1.98373 11.3763 0.485391 10.9742 0.174141 9.92307L0.0637369 9.55748C-0.117222 8.90672 0.20671 8.20843 0.825589 7.7295C0.326142 7.41509 0.00221698 6.94347 0.00221698 6.40056V6.01852C0.0101927 5.75959 0.0822858 5.50681 0.211893 5.28329C0.3415 5.05976 0.524483 4.87261 0.744145 4.73893C0.201268 4.31119 -0.108158 3.68785 0.0347993 3.07548L0.121656 2.6989C0.362332 1.67158 1.75028 1.17255 3.02966 1.65697L4.224 2.11213C4.52453 2.22443 4.80229 2.39105 5.04373 2.60385C5.59192 1.79501 6.3284 1.13458 7.18842 0.680588C8.04845 0.226594 9.00569 -0.00705826 9.97604 0.00016241C10.9464 0.00738308 11.9001 0.25526 12.7534 0.722003C13.6067 1.18875 14.3335 1.86007 14.8698 2.67697C15.1289 2.42675 15.4372 2.23431 15.7746 2.11213L16.9671 1.65697C18.2483 1.17255 19.6345 1.67158 19.8751 2.6989L19.962 3.07548C20.105 3.68785 19.8009 4.31119 19.2526 4.73893C19.4733 4.87195 19.6574 5.05882 19.788 5.28239C19.9185 5.50597 19.9915 5.75908 20 6.01852Z"
                      fill="white"
                    />
                  </Svg>
                  <Text style={styles.mostRewardedText}>Most Rewarded</Text>
                </TouchableOpacity>

                {/* Newest 버튼 */}
                <TouchableOpacity style={styles.newestButton}>
                  <Svg width="18" height="15" viewBox="0 0 18 15" fill="none">
                    <Path
                      d="M12.123 6.07301C12.1281 6.25547 12.0705 6.43423 11.9598 6.57932C11.849 6.72441 11.6918 6.82709 11.5144 6.87021C10.4739 7.25357 9.4394 7.63701 8.39275 8.00212C8.29819 8.03135 8.21218 8.08322 8.1422 8.15321C8.07221 8.22319 8.02034 8.30913 7.99111 8.40369C7.63209 9.41992 7.26089 10.4301 6.8897 11.4463C6.84863 11.6365 6.74459 11.8072 6.59439 11.9309C6.4442 12.0546 6.25666 12.1241 6.06213 12.1279C5.86266 12.1221 5.67076 12.0501 5.51657 11.9235C5.36237 11.7968 5.2546 11.6226 5.21019 11.428C4.84508 10.4179 4.47389 9.40773 4.10878 8.38542C4.08225 8.2961 4.03386 8.21493 3.96798 8.14905C3.9021 8.08317 3.82082 8.03474 3.7315 8.00821C2.68486 7.63701 1.65038 7.25357 0.609818 6.87021C0.428683 6.82757 0.268404 6.72251 0.157109 6.57338C0.0458138 6.42424 -0.0093729 6.24067 0.00130314 6.05489C-0.00443045 5.87089 0.0527584 5.69037 0.163386 5.54323C0.274013 5.3961 0.431468 5.29109 0.609818 5.24551C1.63821 4.86823 2.66661 4.4848 3.70109 4.11969C3.79564 4.09045 3.88165 4.03858 3.95164 3.9686C4.02162 3.89861 4.07345 3.81268 4.10269 3.71812C4.46171 2.70798 4.83294 1.69175 5.20414 0.675522C5.2454 0.485953 5.34966 0.315954 5.49996 0.193282C5.65026 0.0706099 5.83772 0.00244089 6.03171 0C6.42724 0 6.70717 0.225235 6.87755 0.693795C7.24875 1.70394 7.61991 2.72016 7.98502 3.73639C8.01015 3.82709 8.05799 3.90984 8.124 3.97692C8.19001 4.044 8.27201 4.09311 8.3623 4.11969C9.41706 4.48886 10.4658 4.87027 11.5083 5.26378C11.6895 5.30502 11.8504 5.40862 11.9628 5.5566C12.0751 5.70459 12.1319 5.88741 12.123 6.07301Z"
                      fill="white"
                    />
                    <Path
                      d="M17.0945 11.5314C17.0971 11.6354 17.065 11.7372 17.0033 11.821C16.9416 11.9047 16.8538 11.9656 16.7538 11.9939L14.9708 12.6449C14.9162 12.6594 14.8661 12.6878 14.8256 12.7272C14.7851 12.7667 14.7555 12.8159 14.7396 12.8701C14.5327 13.4787 14.3197 14.0323 14.1311 14.6165C14.1075 14.7249 14.0476 14.8221 13.9612 14.8918C13.8749 14.9615 13.7674 14.9997 13.6564 14.9999C13.5423 14.9996 13.4317 14.9602 13.3431 14.8882C13.2545 14.8162 13.1933 14.716 13.1696 14.6043C12.9566 13.9958 12.7436 13.4421 12.5611 12.864C12.5454 12.8123 12.5172 12.7653 12.479 12.7271C12.4408 12.6889 12.3937 12.6606 12.342 12.6449L10.553 11.9939C10.4507 11.9673 10.3609 11.906 10.2987 11.8205C10.2366 11.7351 10.206 11.6308 10.2122 11.5253C10.21 11.419 10.2436 11.315 10.3076 11.23C10.3716 11.145 10.4623 11.084 10.5652 11.0568L12.3359 10.4178C12.3903 10.4008 12.4397 10.3708 12.48 10.3306C12.5202 10.2903 12.5501 10.2408 12.5672 10.1865C12.7741 9.57795 12.987 9.02428 13.1757 8.44618C13.197 8.33611 13.2561 8.23696 13.3427 8.16584C13.4294 8.09473 13.5382 8.05603 13.6503 8.05665C13.7645 8.05695 13.8751 8.09639 13.9637 8.16837C14.0523 8.24035 14.1135 8.34061 14.1371 8.45227C14.3501 9.06079 14.5631 9.61446 14.7457 10.1926C14.7586 10.2456 14.7859 10.2942 14.8245 10.3328C14.8631 10.3714 14.9116 10.3987 14.9647 10.4117C15.5732 10.6247 16.1817 10.8499 16.7903 11.0689C16.8841 11.1029 16.9644 11.1662 17.0192 11.2496C17.0741 11.3329 17.1005 11.4318 17.0945 11.5314Z"
                      fill="white"
                    />
                  </Svg>
                  <Text style={styles.newestText}>Newest</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {isButtonReady && (
          <TouchableOpacity
            style={[styles.buttonActive, isLoading && styles.buttonDisabled]}
            onPress={handleRecommend}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Recommend Me!</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#34495E',
  },
  headerCard: {
    width: '100%',
    height: 244,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 23,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    marginTop: 30,
    alignItems: 'center',
    paddingHorizontal: 0,
    position: 'relative',
  },
  rionImage: {
    width: 68.403,
    height: 68.403,
    transform: [{ rotate: '-15deg' }],
    marginLeft: 20,
  },
  cameraSvg: {
    position: 'absolute',
    left: 80,
    top: 90,
    width: 33,
    height: 32.737,
    transform: [{ rotate: '14.032deg' }],
  },
  textContainer: {
    flex: 1,
    marginLeft: 35,
    marginTop: 10,
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    letterSpacing: -0.18,
    marginBottom: 8,
  },
  headerSubtitle: {
    color: '#FFF',
    fontFamily: 'Pretendard',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    letterSpacing: -0.12,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  stackedImagesContainer: {
    width: 320,
    height: 230,
    marginBottom: 10,
    alignSelf: 'center',
    position: 'relative',
  },
  imageStackWrapper: {
    width: 320,
    height: 230,
    position: 'relative',
    alignSelf: 'center',
  },
  imageCard: {
    width: 190,
    height: 190,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFF',
    borderStyle: 'dashed',
    backgroundColor: '#34495E',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
  cardBack3: {
    left: 130,
    top: 20,
    zIndex: 1,
  },
  cardBack2: {
    left: 65,
    top: 20,
    zIndex: 2,
  },
  cardFront: {
    left: 0,
    top: 20,
    zIndex: 3,
  },
  plusIcon: {
    position: 'absolute',
    top: 15,
    right: 15,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 10,
  },
  uploadInner: { justifyContent: 'center', alignItems: 'center' },
  uploadText: {
    color: '#FFF',
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
  },
  addMoreButton: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    backgroundColor: '#F47A3A',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeButton: {
    position: 'absolute',
    right: 8,
    top: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  filterContainer: {
    width: 320,
    alignSelf: 'center',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#FEFEFE',
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  filterContainerExpanded: {
    paddingBottom: 15,
  },
  filterToggle: {
    height: 50,
    paddingHorizontal: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterToggleText: {
    color: '#FFF',
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '400',
  },
  categoriesWrapper: {
    paddingHorizontal: 15,
    paddingTop: 15,
  },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  tag: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 42,
    backgroundColor: '#FF7F50',
  },
  tagText: {
    color: '#FFF',
    fontFamily: 'Pretendard',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
    letterSpacing: -0.12,
  },
  tagSelected: { borderWidth: 2, borderColor: 'white' },
  nearestTripButton: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    borderRadius: 42,
    backgroundColor: '#FFF',
  },
  nearestTripText: {
    color: '#659DF2',
    fontFamily: 'Pretendard',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
    letterSpacing: -0.12,
  },
  mostRewardedButton: {
    flexDirection: 'row',
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    borderRadius: 42,
    backgroundColor: '#76C7AD',
  },
  mostRewardedText: {
    color: '#FFF',
    fontFamily: 'Pretendard',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
    letterSpacing: -0.12,
  },
  newestButton: {
    flexDirection: 'row',
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    borderRadius: 42,
    backgroundColor: '#4888D3',
  },
  newestText: {
    color: '#FFF',
    fontFamily: 'Pretendard',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
    letterSpacing: -0.12,
  },
  buttonActive: {
    width: 320,
    height: 50,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 35,
    backgroundColor: '#FF7F50',
    marginTop: 20,
    alignSelf: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFF',
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
  },
});

import Constants from 'expo-constants';
import { Platform } from 'react-native';

// 개발 환경 API URL
const DEV_API_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  // eslint-disable-next-line sonarjs/no-clear-text-protocols
  (Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000');

// 프로덕션 환경 API URL (임시 주소, 나중에 실주소로 변경 필요)
const PROD_API_URL = 'https://api.questofseoul.com';

export const API_URL = __DEV__ ? DEV_API_URL : PROD_API_URL;

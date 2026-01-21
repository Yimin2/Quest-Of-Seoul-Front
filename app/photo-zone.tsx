import { Images } from '@/constants/images';
import { useQuestStore } from '@/store/useQuestStore';
import { Ionicons } from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import { ThemedText } from '@shared/ui';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export default function PhotoZoneScreen() {
  const router = useRouter();
  const { activeQuest } = useQuestStore();
  const params = useLocalSearchParams();

  // quest_id로부터 이미지 URL 가져오기
  const questImageUrl = activeQuest?.quest.place_image_url || (params.questImageUrl as string);
  const questName =
    activeQuest?.quest.name || (params.questName as string) || 'Gyeongbokgung Palace';

  const close = () => router.back();

  const handleStart = () => {
    router.replace({
      pathname: '/photo-zone-qr',
      params: {
        questId: activeQuest?.quest_id?.toString() || (params.questId as string),
        questImageUrl: questImageUrl,
        questName: questName,
      },
    });
  };

  return (
    <View style={styles.container}>
      {/* Gradient Background */}
      <LinearGradient
        colors={['#34495E', '#76C7AD', '#FF7F50']}
        locations={[0, 0.601, 1]}
        style={styles.gradientBackgroundTop}
      />

      {/* Sparkle Image */}
      <Image
        source={Images.sparkle}
        // @ts-ignore - mixBlendMode is supported in React Native but not in types
        style={[styles.sparkleImage, { mixBlendMode: 'color-dodge' }]}
        resizeMode="cover"
      />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {/* Photo Zone Icon */}
          <Svg width="17" height="17" viewBox="0 0 17 17" fill="none">
            <Path
              d="M3.125 16.25C3.37364 16.25 3.6121 16.1512 3.78791 15.9754C3.96373 15.7996 4.0625 15.5611 4.0625 15.3125L4.0625 14.0625L5.3125 14.0625C5.56114 14.0625 5.7996 13.9637 5.97541 13.7879C6.15123 13.6121 6.25 13.3736 6.25 13.125C6.25 12.8764 6.15123 12.6379 5.97541 12.4621C5.7996 12.2863 5.56114 12.1875 5.3125 12.1875L4.0625 12.1875L4.0625 10.9375C4.0625 10.6889 3.96373 10.4504 3.78791 10.2746C3.6121 10.0988 3.37364 10 3.125 10C2.87636 10 2.6379 10.0988 2.46209 10.2746C2.28627 10.4504 2.1875 10.6889 2.1875 10.9375L2.1875 12.1875L0.937498 12.1875C0.688858 12.1875 0.450402 12.2863 0.274587 12.4621C0.0987705 12.6379 -1.61242e-06 12.8764 -1.63415e-06 13.125C-1.65589e-06 13.3736 0.0987704 13.6121 0.274587 13.7879C0.450402 13.9637 0.688858 14.0625 0.937498 14.0625L2.1875 14.0625L2.1875 15.3125C2.1875 15.5611 2.28627 15.7996 2.46209 15.9754C2.6379 16.1512 2.87636 16.25 3.125 16.25ZM13.75 15C14.413 15 15.0489 14.7366 15.5178 14.2678C15.9866 13.7989 16.25 13.163 16.25 12.5L16.25 2.5C16.25 1.83696 15.9866 1.20108 15.5178 0.732235C15.0489 0.263394 14.413 1.74676e-06 13.75 1.68879e-06L3.75 8.14564e-07C3.08696 7.56599e-07 2.45107 0.263393 1.98223 0.732234C1.51339 1.20107 1.25 1.83696 1.25 2.5L1.25 8.98875C1.74292 8.47357 2.41311 8.16484 3.125 8.125C3.76856 8.15893 4.38094 8.41285 4.85969 8.84427C5.33843 9.27569 5.6545 9.85843 5.755 10.495C6.39157 10.5955 6.97431 10.9116 7.40573 11.3903C7.83715 11.8691 8.09107 12.4814 8.125 13.125C8.08516 13.8369 7.77643 14.5071 7.26125 15L12.3925 15L13.75 15ZM12.5 12.5C12.1685 12.5 11.8505 12.3683 11.6161 12.1339C11.3817 11.8995 11.25 11.5815 11.25 11.25C11.25 10.9185 11.3817 10.6005 11.6161 10.3661C11.8505 10.1317 12.1685 10 12.5 10C12.8315 10 13.1495 10.1317 13.3839 10.3661C13.6183 10.6005 13.75 10.9185 13.75 11.25C13.75 11.5815 13.6183 11.8995 13.3839 12.1339C13.1495 12.3683 12.8315 12.5 12.5 12.5ZM6.25 8.49125C6.16778 8.49123 6.08637 8.47499 6.01044 8.44346C5.93451 8.41193 5.86555 8.36573 5.8075 8.3075L3.3075 5.8075C3.19066 5.69037 3.12504 5.53169 3.125 5.36625L3.125 2.5C3.125 2.33424 3.19085 2.17527 3.30806 2.05806C3.42527 1.94085 3.58424 1.875 3.75 1.875L13.75 1.875C13.9158 1.875 14.0747 1.94085 14.1919 2.05806C14.3092 2.17527 14.375 2.33424 14.375 2.5L14.375 5.36625C14.375 5.53169 14.3093 5.69037 14.1925 5.8075L12.9425 7.0575C12.8844 7.1157 12.8155 7.16188 12.7395 7.19339C12.6636 7.2249 12.5822 7.24112 12.5 7.24112C12.4178 7.24112 12.3364 7.2249 12.2605 7.19339C12.1845 7.16188 12.1156 7.1157 12.0575 7.0575L10.4425 5.4425C10.3844 5.3843 10.3155 5.33812 10.2395 5.30661C10.1636 5.2751 10.0822 5.25888 10 5.25888C9.91779 5.25888 9.83639 5.2751 9.76046 5.30661C9.68453 5.33812 9.61556 5.3843 9.5575 5.4425L6.6925 8.3075C6.63445 8.36573 6.56549 8.41193 6.48956 8.44346C6.41362 8.47499 6.33222 8.49123 6.25 8.49125Z"
              fill="white"
            />
          </Svg>
          <ThemedText style={styles.headerTitle}>{questName}</ThemedText>
        </View>
        <Pressable onPress={close}>
          <Ionicons name="close" size={24} color="#fff" />
        </Pressable>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Gradient Photo Zone Title */}
        <MaskedView
          maskElement={<ThemedText style={styles.gradientTitle}>{'Photo\nZone'}</ThemedText>}
        >
          <LinearGradient
            colors={['#FF8051', '#A7FFE3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0.7 }}
            style={styles.gradientBackground}
          >
            <ThemedText style={[styles.gradientTitle, { opacity: 0 }]}>{'Photo\nZone'}</ThemedText>
          </LinearGradient>
        </MaskedView>

        {/* Photo Icon + Thumbnail */}
        <View style={styles.imageContainer}>
          {/* Photo Icon - positioned to overlap */}
          <View style={styles.photoIconWrapper}>
            <Image source={Images.photo} style={styles.photoIcon} resizeMode="contain" />
          </View>
          {/* Thumbnail Image */}
          <Image
            source={questImageUrl ? { uri: questImageUrl } : Images.quizThumbnail}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        </View>

        <ThemedText type="subtitle" style={styles.placeName}>
          {questName}
        </ThemedText>

        <Pressable style={styles.startBtn} onPress={handleStart}>
          <ThemedText style={styles.startBtnText}>START!</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#34495E',
    paddingTop: 60,
  },
  gradientBackgroundTop: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 343,
    zIndex: 0,
  },
  sparkleImage: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: 343,
    zIndex: 1,
    opacity: 1,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 17,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#FFF',
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
  },

  /* Content */
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
  },
  gradientTitle: {
    fontFamily: 'BagelFatOne-Regular',
    fontSize: 48,
    lineHeight: 56,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 4,
  },
  gradientBackground: {
    marginBottom: 20,
  },
  imageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  photoIconWrapper: {
    marginRight: -25,
    marginTop: 5,
    zIndex: 1,
  },
  photoIcon: {
    width: 100,
    height: 102,
  },
  thumbnail: {
    width: 120,
    height: 124,
    borderRadius: 10,
    backgroundColor: '#EF6A39',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6.5,
    elevation: 8,
  },
  placeName: {
    color: '#FFF',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 60,
  },
  points: {
    color: '#FFF',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  subPoints: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,
    marginBottom: 40,
  },
  startBtn: {
    width: 320,
    height: 50,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    borderRadius: 35,
    backgroundColor: '#FFF',
    marginHorizontal: 20,
  },
  startBtnText: {
    color: '#659DF2',
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
  },
});

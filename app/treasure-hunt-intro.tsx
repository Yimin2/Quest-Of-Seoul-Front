import { Ionicons } from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Defs, Path, RadialGradient, Stop } from 'react-native-svg';

import { useQuestStore } from '@/store/useQuestStore';
import { Images } from '@shared/config';
import { ThemedText } from '@shared/ui';

export default function TreasureHuntIntroScreen() {
  const router = useRouter();
  const { activeQuest } = useQuestStore();

  // Access quest_id and place_id from active quest
  const questId = activeQuest?.quest_id;
  const placeId = activeQuest?.place_id;
  const questName = activeQuest?.quest.name || 'Unknown Place';
  const rewardPoint = activeQuest?.quest.reward_point || 300;
  const placeImageUrl = activeQuest?.quest.place_image_url || null;

  const close = () => router.back();
  const startTreasureHunt = () => {
    router.push('/stamp/stamp-quest' as any);
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
          {/* Treasure Icon */}
          <Svg width="17" height="17" viewBox="0 0 17 17" fill="none">
            <Path
              d="M10 10.8333C10.2361 10.8333 10.4411 10.7467 10.615 10.5733C10.7889 10.4 10.8756 10.195 10.875 9.95833C10.8744 9.72167 10.7878 9.51694 10.615 9.34417C10.4422 9.17139 10.2372 9.08444 10 9.08333C9.76278 9.08222 9.55805 9.16917 9.38583 9.34417C9.21361 9.51917 9.12667 9.72389 9.125 9.95833C9.12333 10.1928 9.21028 10.3978 9.38583 10.5733C9.56139 10.7489 9.76611 10.8356 10 10.8333ZM10 8.16667C10.1528 8.16667 10.2953 8.11111 10.4275 8C10.5597 7.88889 10.6394 7.74306 10.6667 7.5625C10.6944 7.39583 10.7533 7.24305 10.8433 7.10417C10.9333 6.96528 11.0967 6.77778 11.3333 6.54167C11.75 6.125 12.0278 5.78806 12.1667 5.53083C12.3056 5.27361 12.375 4.97167 12.375 4.625C12.375 4 12.1561 3.48944 11.7183 3.09333C11.2806 2.69722 10.7078 2.49944 10 2.5C9.54167 2.5 9.125 2.60417 8.75 2.8125C8.375 3.02083 8.07639 3.31944 7.85417 3.70833C7.77083 3.84722 7.76389 3.99306 7.83333 4.14583C7.90278 4.29861 8.02083 4.40972 8.1875 4.47917C8.34028 4.54861 8.48972 4.55556 8.63583 4.5C8.78194 4.44444 8.90333 4.34722 9 4.20833C9.125 4.02778 9.27083 3.8925 9.4375 3.8025C9.60417 3.7125 9.79167 3.66722 10 3.66667C10.3333 3.66667 10.6042 3.76056 10.8125 3.94833C11.0208 4.13611 11.125 4.38944 11.125 4.70833C11.125 4.90278 11.0694 5.08694 10.9583 5.26083C10.8472 5.43472 10.6528 5.65333 10.375 5.91667C9.97222 6.26389 9.71528 6.53139 9.60417 6.71917C9.49306 6.90694 9.42361 7.18111 9.39583 7.54167C9.38194 7.70833 9.43417 7.85417 9.5525 7.97917C9.67083 8.10417 9.82 8.16667 10 8.16667ZM5 13.3333C4.54167 13.3333 4.14944 13.1703 3.82333 12.8442C3.49722 12.5181 3.33389 12.1256 3.33333 11.6667V1.66667C3.33333 1.20833 3.49667 0.816111 3.82333 0.49C4.15 0.163889 4.54222 0.000555556 5 0H15C15.4583 0 15.8508 0.163333 16.1775 0.49C16.5042 0.816667 16.6672 1.20889 16.6667 1.66667V11.6667C16.6667 12.125 16.5036 12.5175 16.1775 12.8442C15.8514 13.1708 15.4589 13.3339 15 13.3333H5ZM1.66667 16.6667C1.20833 16.6667 0.816111 16.5036 0.49 16.1775C0.163889 15.8514 0.000555556 15.4589 0 15V4.16667C0 3.93056 0.0800001 3.73278 0.24 3.57333C0.4 3.41389 0.597778 3.33389 0.833333 3.33333C1.06889 3.33278 1.26694 3.41278 1.4275 3.57333C1.58806 3.73389 1.66778 3.93167 1.66667 4.16667V15H12.5C12.7361 15 12.9342 15.08 13.0942 15.24C13.2542 15.4 13.3339 15.5978 13.3333 15.8333C13.3328 16.0689 13.2528 16.2669 13.0933 16.4275C12.9339 16.5881 12.7361 16.6678 12.5 16.6667H1.66667Z"
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
        {/* Gradient Treasure Hunt Title */}
        <MaskedView
          maskElement={<ThemedText style={styles.gradientTitle}>{'Treasure\nHunt'}</ThemedText>}
        >
          <LinearGradient
            colors={['#FF8051', '#A7FFE3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0.7 }}
            style={styles.gradientBackground}
          >
            <ThemedText style={[styles.gradientTitle, { opacity: 0 }]}>
              {'Treasure\nHunt'}
            </ThemedText>
          </LinearGradient>
        </MaskedView>

        {/* QR Icon + Thumbnail */}
        <View style={styles.imageContainer}>
          {/* QR Icon - positioned to overlap */}
          <View style={styles.quizIconWrapper}>
            <Svg width="84" height="84" viewBox="0 0 84 84" fill="none">
              <Path
                d="M26.3293 82.834C12.062 82.834 0.500316 71.3143 0.500246 57.1133C0.500248 42.9081 12.0658 31.3877 26.3333 31.3877C27.6282 31.3877 29.7669 31.5377 31.9387 31.9873C34.1252 32.44 36.2708 33.1819 37.6428 34.3223L37.9924 34.6133L38.3157 34.293L41.9905 30.6338C43.0696 29.5588 43.6114 28.7325 43.6174 27.9521C43.6205 27.5459 43.4779 27.2056 43.2864 26.9121C43.1032 26.6314 42.8553 26.3653 42.6233 26.1143L42.6233 26.1133C42.2206 25.6728 41.7995 25.2148 41.4719 24.5635L41.4544 24.5283L41.4319 24.498L41.4319 24.4971L41.4309 24.4961C41.4301 24.495 41.4289 24.4929 41.427 24.4902C41.4228 24.4842 41.4157 24.4746 41.4065 24.4609C41.3879 24.4332 41.3591 24.3893 41.3235 24.332C41.2522 24.2174 41.1517 24.0464 41.0393 23.8271C40.8135 23.3867 40.5426 22.7574 40.3626 22.0049C40.0049 20.5094 40.005 18.5372 41.4241 16.5518C42.2886 15.4049 43.935 14.0315 46.0335 13.6338C48.0957 13.243 50.69 13.7762 53.5305 16.6045L53.8831 16.9561L54.2356 16.6055L55.4602 15.3887L55.7913 15.0605L55.4876 14.708C55.4866 14.7069 55.4843 14.7043 55.4817 14.7012C55.4764 14.6949 55.4676 14.6849 55.4563 14.6709C55.4335 14.6427 55.3993 14.5988 55.3557 14.541C55.2684 14.4253 55.1451 14.2529 55.0051 14.0322C54.7242 13.5894 54.3808 12.9587 54.1292 12.2061C53.6286 10.7085 53.4939 8.75181 54.9036 6.7832C55.7559 5.65845 57.3308 4.51945 59.1838 4.16504C61.0124 3.81541 63.142 4.22189 65.1682 6.23828L65.5208 6.58984L65.8733 6.23828L70.1575 1.97168C71.503 0.631989 72.9717 0.362461 74.2786 0.555663C75.6079 0.752277 76.7754 1.43217 77.4329 1.99414L81.0891 5.62988C82.6881 7.2231 82.9941 8.84009 82.7698 10.2129C82.5404 11.6167 81.7471 12.8067 81.0891 13.4629L49.2473 45.1709L48.9641 45.4531L49.177 45.792L49.178 45.793C49.179 45.7946 49.1804 45.7978 49.1829 45.8018C49.1878 45.8098 49.195 45.8227 49.2053 45.8398C49.2259 45.8742 49.2572 45.9264 49.2971 45.9961C49.3772 46.1361 49.4933 46.3466 49.6331 46.6201C49.9126 47.1672 50.2873 47.9686 50.6624 48.9766C51.4132 50.9943 52.1624 53.8301 52.1624 57.1094C52.1621 71.3144 40.5966 82.8339 26.3293 82.834ZM26.3293 66.7588C27.5983 66.761 28.8553 66.5137 30.0286 66.0303C31.2023 65.5466 32.2699 64.8364 33.1692 63.9404C34.0684 63.0444 34.7819 61.9795 35.2698 60.8076C35.7576 59.6359 36.0106 58.3796 36.0129 57.1103L36.0129 57.1074C36.007 54.5446 34.9832 52.0888 33.1672 50.2803C31.3517 48.4722 28.8925 47.4597 26.3303 47.4639L26.3303 47.4629C23.7674 47.4582 21.3075 48.4718 19.4915 50.2803C17.6755 52.0888 16.6517 54.5446 16.6458 57.1074L16.6458 57.1103C16.6481 58.3795 16.9002 59.6359 17.3879 60.8076C17.8759 61.9795 18.5902 63.0444 19.4895 63.9404C20.3887 64.8363 21.4556 65.5466 22.6292 66.0303C23.8026 66.5138 25.0602 66.761 26.3293 66.7588Z"
                fill="url(#paint0_radial_qr)"
                stroke="white"
              />
              <Defs>
                <RadialGradient
                  id="paint0_radial_qr"
                  cx="0"
                  cy="0"
                  r="1"
                  gradientUnits="userSpaceOnUse"
                  gradientTransform="translate(41.6676 41.6669) rotate(90) scale(41.6671 41.6676)"
                >
                  <Stop stopColor="white" />
                  <Stop offset="1" stopColor="white" stopOpacity="0.8" />
                </RadialGradient>
              </Defs>
            </Svg>
          </View>
          {/* Thumbnail Image */}
          <Image
            source={placeImageUrl ? { uri: placeImageUrl } : Images.quizThumbnail}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        </View>

        <ThemedText type="subtitle" style={styles.placeName}>
          {questName}
        </ThemedText>

        <ThemedText style={styles.points}>Total 150 pts</ThemedText>
        <ThemedText style={styles.subPoints}>3 QR code scans</ThemedText>

        <Pressable style={styles.startBtn} onPress={startTreasureHunt}>
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

  /* Point Container */
  pointContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 10,
  },
  pointBox: {
    flexDirection: 'row',
    width: 76,
    height: 47,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    borderRadius: 10,
    backgroundColor: '#76C7AD',
  },
  mintSection: {
    flexDirection: 'column',
    alignItems: 'center',
    width: 26,
    gap: 2,
  },
  mintLabel: {
    color: '#FFF',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 9,
    fontWeight: '500',
    lineHeight: 10,
  },
  pointValue: {
    color: '#FFF',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },

  /* Progress Indicators */
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  progressDot: {
    width: 40,
    height: 10,
    borderRadius: 25,
    backgroundColor: '#222D39',
  },
  progressDotCompleted: {
    backgroundColor: '#FFF',
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
  quizIconWrapper: {
    marginRight: -25,
    marginTop: 5,
    zIndex: 1,
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

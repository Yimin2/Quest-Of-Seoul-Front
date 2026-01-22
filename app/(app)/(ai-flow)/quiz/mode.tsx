import { Ionicons } from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Defs, Path, RadialGradient, Stop } from 'react-native-svg';

import { useQuestStore } from '@entities/quest';
import { Images } from '@shared/config';
import { ThemedText } from '@shared/ui';

export default function QuizModeScreen() {
  const router = useRouter();
  const { activeQuest } = useQuestStore();

  // Access quest_id and place_id from active quest
  const questId = activeQuest?.quest_id;
  const placeId = activeQuest?.place_id;
  const questName = activeQuest?.quest.name || 'Unknown Place';
  const rewardPoint = activeQuest?.quest.reward_point || 300;
  const placeImageUrl = activeQuest?.quest.place_image_url || null;

  // 현재 퀴즈 진행 상태 (0 = 아직 시작 안함)
  const currentQuizIndex = 0;
  const totalQuizzes = 5;

  const close = () => router.back();
  const startQuiz = () => {
    if (questId) {
      // Quest mode: pass quest_id to use quest quizzes with scoring system
      router.replace({
        pathname: '/(app)/(ai-flow)/quiz/screen',
        params: {
          questId: questId.toString(),
          questName: questName,
          rewardPoint: rewardPoint.toString(),
          quizScoreMax: '100',
          perQuestionScore: '20',
          hintPenaltyScore: '10',
        },
      });
    } else {
      // Fallback to general quiz mode
      router.replace({
        pathname: '/(app)/(ai-flow)/quiz/screen',
        params: { landmark: questName },
      });
    }
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
          {/* Quiz Icon */}
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

      {/* Point Box with Progress Indicators */}
      <View style={styles.pointContainer}>
        <View style={styles.pointBox}>
          {/* Mint Icon & Label */}
          <View style={styles.mintSection}>
            <Svg width="26" height="16" viewBox="0 0 26 16" fill="none">
              <Path
                d="M26 7.93746V8.44855C26 9.17179 25.5789 9.78656 24.9296 10.2012C25.7342 10.8232 26.1647 11.7441 25.92 12.612L25.7765 13.0942C25.3813 14.4804 23.4241 15.0108 21.7773 14.1815L20.2812 13.4317C19.8558 13.2212 19.4801 12.9185 19.1802 12.5445C18.9389 12.8886 18.6698 13.2111 18.3756 13.5088C17.5932 14.3118 16.6512 14.9326 15.6136 15.3288C14.576 15.7251 13.4673 15.8876 12.363 15.8053C11.2586 15.7229 10.1845 15.3976 9.21383 14.8516C8.24317 14.3055 7.39873 13.5515 6.738 12.641C6.45213 12.9673 6.10695 13.2334 5.72174 13.4245L4.22558 14.1742C2.57885 15.0035 0.631008 14.4732 0.226384 13.0869L0.0828579 12.6048C-0.152389 11.7465 0.268722 10.8256 1.07327 10.194C0.423985 9.77932 0.00288208 9.15732 0.00288208 8.44131V7.93746C0.0132505 7.59598 0.106971 7.26261 0.27546 6.96781C0.443949 6.67301 0.681828 6.42619 0.967388 6.2499C0.261648 5.68577 -0.140606 4.86369 0.0452391 4.05607L0.158153 3.55942C0.471031 2.20455 2.27536 1.54641 3.93856 2.18527L5.49121 2.78556C5.88189 2.93367 6.24297 3.15341 6.55685 3.43406C7.26949 2.36734 8.22692 1.49633 9.34495 0.897587C10.463 0.298841 11.7074 -0.00930872 12.9688 0.000214193C14.2303 0.0097371 15.4701 0.336647 16.5794 0.952207C17.6887 1.56777 18.6335 2.45313 19.3308 3.5305C19.6676 3.20049 20.0683 2.9467 20.507 2.78556L22.0573 2.18527C23.7228 1.54641 25.5248 2.20455 25.8377 3.55942L25.9506 4.05607C26.1365 4.86369 25.7412 5.68577 25.0284 6.2499C25.3153 6.42532 25.5546 6.67178 25.7243 6.96663C25.8941 7.26149 25.9889 7.5953 26 7.93746Z"
                fill="url(#paint0_radial_6_9622)"
              />
              <Defs>
                <RadialGradient
                  id="paint0_radial_6_9622"
                  cx="0"
                  cy="0"
                  r="1"
                  gradientUnits="userSpaceOnUse"
                  gradientTransform="translate(13 7.91304) rotate(90) scale(7.91304 13)"
                >
                  <Stop stopColor="white" />
                  <Stop offset="1" stopColor="white" stopOpacity="0.85" />
                </RadialGradient>
              </Defs>
            </Svg>
            <ThemedText style={styles.mintLabel}>mint</ThemedText>
          </View>

          {/* Point Value */}
          <ThemedText style={styles.pointValue}>{rewardPoint}</ThemedText>
        </View>

        {/* Progress Indicators */}
        <View style={styles.progressContainer}>
          {[...Array(totalQuizzes)].map((_, index) => (
            <View
              key={index}
              style={[styles.progressDot, index < currentQuizIndex && styles.progressDotCompleted]}
            />
          ))}
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Gradient Quiz Time Title */}
        <MaskedView
          maskElement={<ThemedText style={styles.gradientTitle}>{'Quiz\nTime'}</ThemedText>}
        >
          <LinearGradient
            colors={['#FF8051', '#A7FFE3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0.7 }}
            style={styles.gradientBackground}
          >
            <ThemedText style={[styles.gradientTitle, { opacity: 0 }]}>{'Quiz\nTime'}</ThemedText>
          </LinearGradient>
        </MaskedView>

        {/* Quiz Icon + Thumbnail */}
        <View style={styles.imageContainer}>
          {/* Quiz Icon - positioned to overlap */}
          <View style={styles.quizIconWrapper}>
            <Svg width="84" height="84" viewBox="0 0 84 84" fill="none">
              <Path
                d="M4.16797 17.167C5.21824 17.1645 6.07935 17.5159 6.78418 18.2207C7.48874 18.9254 7.83796 19.7844 7.83301 20.8311V75.5H62.5C63.5544 75.5 64.4154 75.8519 65.1172 76.5537C65.8188 77.2553 66.1694 78.1144 66.167 79.165C66.1645 80.2171 65.8125 81.08 65.1123 81.7852C64.414 82.4883 63.555 82.838 62.502 82.833H8.33301C6.17511 82.8329 4.34104 82.0714 2.80371 80.5342C1.36224 79.0927 0.601341 77.3887 0.509766 75.4004L0.5 74.999V20.833C0.500072 19.7788 0.851624 18.9194 1.55273 18.2207C2.25494 17.5209 3.1158 17.1695 4.16797 17.167ZM75 0.5C77.1579 0.5 78.9938 1.26331 80.5342 2.80371C82.0744 4.34406 82.8356 6.17839 82.833 8.33301V58.333C82.833 60.4912 82.0709 62.3268 80.5332 63.8672C78.9961 65.4069 77.1614 66.1695 75.001 66.167H25C22.842 66.167 21.0081 65.4045 19.4707 63.8672C17.9333 62.3298 17.1697 60.4942 17.167 58.333V8.33301C17.1671 6.1753 17.9297 4.34114 19.4697 2.80371C20.9141 1.36176 22.6172 0.601333 24.6006 0.509766L25.001 0.5H75ZM50.002 44.917C48.6761 44.9109 47.5251 45.4031 46.5732 46.3701C45.6257 47.3329 45.1343 48.4792 45.125 49.7881C45.1157 51.1027 45.609 52.2545 46.5752 53.2207C47.5402 54.1857 48.6894 54.6773 50 54.666V54.667L50.002 54.666H50.0039C51.3209 54.665 52.4697 54.1756 53.4277 53.2207C54.3876 52.2639 54.8781 51.1121 54.875 49.79C54.8718 48.47 54.3826 47.3211 53.4287 46.3672C52.4748 45.4132 51.3242 44.9232 50.002 44.917ZM50 12C47.6294 12 45.4612 12.5392 43.5068 13.625C41.5514 14.7114 39.9956 16.2686 38.8418 18.2842C38.337 19.1255 38.2996 20.0294 38.7119 20.9365C39.1156 21.8243 39.8052 22.4647 40.7451 22.8564C41.6158 23.2484 42.4962 23.2947 43.3564 22.9678C44.1889 22.6512 44.8743 22.0971 45.4102 21.3271L45.4111 21.3262C45.9984 20.4779 46.6711 19.8592 47.4248 19.4521C48.1781 19.0453 49.033 18.8358 50 18.833C51.5676 18.833 52.7945 19.2723 53.7275 20.1133C54.6491 20.9439 55.125 22.0677 55.125 23.542C55.1249 24.4127 54.8775 25.241 54.3701 26.0352C53.848 26.8522 52.9116 27.9108 51.5332 29.2178C49.5293 30.9465 48.1912 32.3264 47.5908 33.3408C46.979 34.3747 46.622 35.8333 46.4805 37.667C46.3989 38.6466 46.7133 39.5144 47.3994 40.2393C48.0903 40.969 48.9697 41.333 50 41.333C50.8969 41.333 51.7203 41.0035 52.459 40.3828C53.2189 39.7442 53.675 38.9023 53.8281 37.8867L53.8271 37.8857C53.9556 37.122 54.2264 36.4262 54.6367 35.793C55.0566 35.145 55.8415 34.2378 57.0195 33.0625L57.0205 33.0615C59.1106 30.9714 60.5429 29.2445 61.2734 27.8916C62.014 26.5201 62.375 24.9258 62.375 23.125C62.375 19.8681 61.2271 17.1771 58.9268 15.0957C56.7719 13.1461 54.0076 12.1289 50.6738 12.0117L50 12Z"
                fill="url(#paint0_radial_quiz)"
                stroke="white"
              />
              <Defs>
                <RadialGradient
                  id="paint0_radial_quiz"
                  cx="0"
                  cy="0"
                  r="1"
                  gradientUnits="userSpaceOnUse"
                  gradientTransform="translate(41.6667 41.6667) rotate(90) scale(41.6667 41.6667)"
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

        {questId ? (
          <>
            <ThemedText style={styles.points}>Quiz Score: 100 pts</ThemedText>
            <ThemedText style={styles.subPoints}>5 questions × 20 pts each</ThemedText>
          </>
        ) : (
          <>
            <ThemedText style={styles.points}>Total {rewardPoint} pts</ThemedText>
            <ThemedText style={styles.subPoints}>5 questions × 60 pts each</ThemedText>
          </>
        )}

        <Pressable style={styles.startBtn} onPress={startQuiz}>
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

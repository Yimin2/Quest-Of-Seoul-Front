import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image, ImageBackground, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@shared/ui';

export default function QuizCompleteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    score?: string;
    detail?: string;
    quizCount?: string;
    isQuestMode?: string;
    questName?: string;
    questCompleted?: string;
    rewardPoint?: string;
    alreadyCompleted?: string;
  }>();

  const handleSeeResult = () => {
    // Navigate to the actual result screen with all params
    router.replace({
      pathname: '/quiz-result',
      params: {
        score: params.score,
        detail: params.detail,
        quizCount: params.quizCount,
        isQuestMode: params.isQuestMode,
        questName: params.questName,
        questCompleted: params.questCompleted,
        rewardPoint: params.rewardPoint,
        alreadyCompleted: params.alreadyCompleted,
      },
    });
  };

  return (
    <ImageBackground
      source={require('@/assets/images/mint-completed.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        {/* Candy Image 1 */}
        <Image
          source={require('@/assets/images/candy 3.png')}
          style={styles.candyImage1}
          resizeMode="contain"
        />

        {/* Candy Image 2 */}
        <Image
          source={require('@/assets/images/candy 3.png')}
          style={styles.candyImage2}
          resizeMode="contain"
        />

        {/* Candy Image 3 */}
        <Image
          source={require('@/assets/images/candy 3.png')}
          style={styles.candyImage3}
          resizeMode="contain"
        />

        {/* Title */}
        <ThemedText style={styles.title}>Quiz{'\n'}Completed!</ThemedText>

        {/* See Result Button */}
        <Pressable style={styles.resultButton} onPress={handleSeeResult}>
          <ThemedText style={styles.resultButtonText}>See Result</ThemedText>
        </Pressable>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#34495E',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 60,
  },
  candyImage1: {
    position: 'absolute',
    top: 263,
    left: -2,
    width: 86,
    height: 51,
    aspectRatio: 86 / 51,
  },
  candyImage2: {
    position: 'absolute',
    top: 174,
    right: 10,
    width: 86,
    height: 51,
    transform: [{ rotate: '-26.935deg' }],
    aspectRatio: 86 / 51,
  },
  candyImage3: {
    position: 'absolute',
    top: 92,
    left: 60,
    width: 38,
    height: 23,
    transform: [{ rotate: '21.61deg' }],
    aspectRatio: 38 / 23,
  },
  title: {
    color: '#FFF',
    textAlign: 'center',
    fontFamily: 'BagelFatOne-Regular',
    fontSize: 48,
    fontWeight: '400',
    lineHeight: 48,
    marginTop: 110,
  },
  resultButton: {
    width: 320,
    height: 50,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    borderRadius: 35,
    backgroundColor: '#FFF',
  },
  resultButtonText: {
    color: '#659DF2',
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
  },
});

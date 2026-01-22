import { Ionicons } from '@expo/vector-icons';
import { Images } from '@shared/config';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Defs, Path, RadialGradient, Stop } from 'react-native-svg';

import { questApi, quizApi, QuizItem } from '@shared/api';
import { ThemedText } from '@shared/ui';

export default function QuizScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    landmark?: string;
    questId?: string;
    questName?: string;
    rewardPoint?: string;
  }>();

  const questId = params.questId ? parseInt(params.questId) : null;
  const questName = params.questName || params.landmark || 'Unknown Place';
  const rewardPoint = params.rewardPoint ? parseInt(params.rewardPoint) : 300;
  const isQuestMode = !!questId;

  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [step, setStep] = useState(0);
  const quiz = quizzes[step];

  const [selected, setSelected] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const [totalScore, setTotalScore] = useState(isQuestMode ? 0 : 25);
  const [scoreList, setScoreList] = useState<number[]>([]);
  const [progress, setProgress] = useState<string[]>([]);
  const [hintUsed, setHintUsed] = useState(false);
  const [questAlreadyCompleted, setQuestAlreadyCompleted] = useState(false);
  const [allAnswered, setAllAnswered] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false); // 이미 완료된 퀘스트를 다시 보는 모드
  const [isRetryMode, setIsRetryMode] = useState(false); // 힌트 사용 후 두 번째 시도인지 여부
  const [questionResults, setQuestionResults] = useState<('pending' | 'correct' | 'wrong')[]>([]); // 각 문항별 결과

  // 화면이 포커스를 얻을 때마다 항상 "처음 상태"로 리셋 (항상 새 게임처럼)
  useFocusEffect(
    useCallback(() => {
      setStep(0);
      setSelected(null);
      setIsCorrect(null);
      setShowResult(false);
      setShowHint(false);
      setTotalScore(isQuestMode ? 0 : 25);
      setScoreList([]);
      setProgress([]);
      setHintUsed(false);
      setQuestAlreadyCompleted(false);
      setAllAnswered(false);
      setIsReviewMode(false);
      setIsRetryMode(false);
      setQuestionResults((prev) => (prev.length > 0 ? Array(prev.length).fill('pending') : []));
    }, [isQuestMode]),
  );
  useEffect(() => {
    const loadQuizzes = async () => {
      try {
        setLoading(true);
        setError(null);

        if (isQuestMode && questId) {
          // Quest mode: check if quest is already completed
          try {
            const questDetail = await questApi.getQuestDetail(questId);
            if (questDetail.user_status?.status === 'completed') {
              setQuestAlreadyCompleted(true);
            }
          } catch (err) {
            // Ignore
          }

          const questQuizData = await quizApi.getQuestQuizzes(questId);
          const quizItems = quizApi.convertQuestQuizzesToItems(questQuizData);
          setQuizzes(quizItems);
          setQuestionResults(Array(quizItems.length).fill('pending'));
        } else {
          const data = await quizApi.getMultipleQuizzes(
            params.landmark || 'Gyeongbokgung Palace',
            5,
            'en',
          );
          setQuizzes(data);
          setQuestionResults(Array(data.length).fill('pending'));
        }
      } catch (err) {
        setError('Failed to load quizzes. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadQuizzes();
  }, [questId, params.landmark, isQuestMode]);

  const onSelect = async (choice: string) => {
    // 결과 카드가 이미 떠 있거나, 서버에 제출 중이면 무시
    if (showResult || submitting) return;

    const choiceIndex = quiz.choices.indexOf(choice);

    // Review mode: 서버에 다시 제출하지 않고 로컬에서만 정답 표시
    if (isReviewMode) {
      const correct = choice === quiz.answer;
      setSelected(choice);
      setIsCorrect(correct);
      setShowResult(true);
      return;
    }

    if (isQuestMode && questId) {
      // Quest mode: 백엔드에 정답 제출 (시도 횟수/힌트 여부는 프론트에서 관리)
      setSubmitting(true);
      try {
        const isLastQuiz = step === quizzes.length - 1;
        const result = await quizApi.submitQuestQuiz(questId, quiz.id, choiceIndex, isLastQuiz);
        const correct = result.is_correct;

        setSelected(choice);
        setIsCorrect(correct);

        // 프론트에서 이번 문제 획득 점수 계산 (0 / 10 / 20)
        const earned = correct ? (hintUsed || isRetryMode ? 10 : 20) : 0;

        // 화면에 보이는 퀴즈 포인트는 항상 0에서 시작해서
        // 각 문제마다 +10 / +20 / +0씩만 누적
        // 재시도인 경우: 이전 점수를 빼고 새 점수를 더함
        if (isRetryMode && scoreList[step] !== undefined) {
          setTotalScore((prev) => prev - scoreList[step] + earned);
        } else {
          setTotalScore((prev) => prev + earned);
        }

        // scoreList를 인덱스 기반으로 업데이트 (재시도 시 덮어쓰기)
        setScoreList((prev) => {
          const next = [...prev];
          next[step] = earned;
          return next;
        });
        setProgress((prev) => [...prev, correct ? 'correct' : 'wrong']);

        // 현재 문항의 최종 결과 기록 (correct / wrong)
        setQuestionResults((prev) => {
          const next = [...prev];
          next[step] = correct ? 'correct' : 'wrong';
          return next;
        });

        // 🔥 B 로직: 첫 번째 시도에서 오답이고, 아직 힌트를 쓰지 않았다면
        // → 힌트 모달 강제 오픈, 결과 카드(showResult)는 띄우지 않음
        if (!correct && !hintUsed && !isRetryMode) {
          setHintUsed(true); // 힌트 사용 확정
          setIsRetryMode(true); // 이제 두 번째 시도 모드
          setShowHint(true); // 힌트 모달 표시

          // ❗ 두 번째 선택을 위해 상태 초기화 (다시 선택 가능하도록)
          setSelected(null);
          setIsCorrect(null);

          return; // 결과 카드는 표시하지 않음
        }

        // 두 번째 시도이거나(재시도 모드) / 첫 시도에 정답인 경우 → 결과 카드 표시
        setShowResult(true);

        if (result.completed) {
          if (result.already_completed) {
            setQuestAlreadyCompleted(true);
          }
        }
      } catch (err) {
        setError('Failed to submit answer. Please try again.');
      } finally {
        setSubmitting(false);
      }
    } else {
      // General mode: local check
      const correct = choice === quiz.answer;
      setSelected(choice);
      setIsCorrect(correct);

      const earned = correct ? 60 : 5;
      setTotalScore((prev) => prev + earned);
      setScoreList((prev) => [...prev, earned]);
      setProgress((prev) => [...prev, correct ? 'correct' : 'wrong']);
      setQuestionResults((prev) => {
        const next = [...prev];
        next[step] = correct ? 'correct' : 'wrong';
        return next;
      });

      setShowResult(true);
    }
  };

  const onHintPress = () => {
    // 이미 힌트를 쓴 상태라면 단순히 다시 모달만 열어줌
    if (hintUsed) {
      setShowHint(true);
      return;
    }

    // 🔥 B 로직: 힌트 사용 시 점수 차감 없음, 두 번째 시도 모드로 전환
    setHintUsed(true);
    setIsRetryMode(true);
    setShowHint(true);
  };

  const onContinue = () => {
    const isLast = step === quizzes.length - 1;

    if (isLast) {
      // Mark all questions as answered
      setAllAnswered(true);
      // 마지막 문제에서는 바로 결과 화면으로 이동 (Done! → 결과 창)
      goToResults();
    } else {
      // Move to next question
      setStep(step + 1);
      setSelected(null);
      setIsCorrect(null);
      setShowResult(false);
      setHintUsed(false);
      setIsRetryMode(false);
      setShowHint(false);
    }
  };

  const onPrevious = () => {
    if (step > 0) {
      setStep(step - 1);
      setSelected(null);
      setIsCorrect(null);
      setShowResult(false);
      setHintUsed(false);
      setIsRetryMode(false);
      setShowHint(false);
    }
  };

  const onNext = () => {
    if (step < quizzes.length - 1) {
      setStep(step + 1);
      setSelected(null);
      setIsCorrect(null);
      setShowResult(false);
      setHintUsed(false);
      setIsRetryMode(false);
      setShowHint(false);
    }
  };

  const goToResults = () => {
    // 먼저 quiz-complete 중간 화면으로 이동
    router.replace({
      pathname: '/(app)/(ai-flow)/quiz/completed',
      params: {
        score: totalScore.toString(),
        detail: JSON.stringify(scoreList),
        quizCount: quizzes.length.toString(),
        isQuestMode: isQuestMode ? 'true' : 'false',
        questName: questName,
        questCompleted: 'true',
        rewardPoint: totalScore.toString(),
        alreadyCompleted: questAlreadyCompleted ? 'true' : 'false',
      },
    });
  };

  const isLastProblem = step === quizzes.length - 1;

  if (loading) {
    return (
      <View style={styles.background}>
        <View style={[styles.container, { justifyContent: 'center' }]}>
          <ActivityIndicator size="large" color="#FFA46F" />
          <ThemedText style={{ color: '#fff', marginTop: 20 }}>Loading quizzes...</ThemedText>
        </View>
      </View>
    );
  }

  if (error || !quiz) {
    return (
      <View style={styles.background}>
        <View style={[styles.container, { justifyContent: 'center' }]}>
          <ThemedText style={{ color: '#fff', textAlign: 'center', marginBottom: 20 }}>
            {error || 'No quiz available'}
          </ThemedText>
          <Pressable style={styles.hintBtn} onPress={() => router.back()}>
            <ThemedText style={styles.hintBtnText}>Go Back</ThemedText>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.background}>
      {/* Sparkle Background - lowest z-index */}
      <Image source={Images.sparkle} style={styles.sparkleBackground} />

      {/* Horang Image - bottom center (changes based on answer) */}
      <Image
        source={showResult ? (isCorrect ? Images.horangHappy : Images.horangSad) : Images.horang}
        style={styles.horangImage}
        resizeMode="contain"
      />

      <Modal transparent visible={showHint} animationType="fade">
        <View style={styles.hintOverlay}>
          <View style={styles.hintBox}>
            <ThemedText style={styles.hintTitle}>HINT</ThemedText>
            <ThemedText style={styles.hintText}>{quiz.hint}</ThemedText>
            <Pressable style={styles.hintCloseBtn} onPress={() => setShowHint(false)}>
              <Svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <Path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M1.70708 0.293407C1.51848 0.111249 1.26588 0.0104547 1.00368 0.0127331C0.741483 0.0150115 0.490671 0.12018 0.305263 0.305589C0.119854 0.490997 0.0146856 0.741809 0.0124071 1.00401C0.0101287 1.2662 0.110923 1.5188 0.293081 1.70741L5.58608 7.00041L0.293081 12.2934C0.197571 12.3857 0.121389 12.496 0.0689798 12.618C0.0165708 12.74 -0.0110155 12.8712 -0.0121693 13.004C-0.0133231 13.1368 0.0119786 13.2685 0.0622595 13.3914C0.11254 13.5143 0.186793 13.6259 0.280686 13.7198C0.374579 13.8137 0.486231 13.8879 0.609127 13.9382C0.732024 13.9885 0.863703 14.0138 0.996482 14.0127C1.12926 14.0115 1.26048 13.9839 1.38249 13.9315C1.50449 13.8791 1.61483 13.8029 1.70708 13.7074L7.00008 8.41441L12.2931 13.7074C12.4817 13.8896 12.7343 13.9904 12.9965 13.9881C13.2587 13.9858 13.5095 13.8806 13.6949 13.6952C13.8803 13.5098 13.9855 13.259 13.9878 12.9968C13.99 12.7346 13.8892 12.482 13.7071 12.2934L8.41408 7.00041L13.7071 1.70741C13.8892 1.5188 13.99 1.2662 13.9878 1.00401C13.9855 0.741809 13.8803 0.490997 13.6949 0.305589C13.5095 0.12018 13.2587 0.0150115 12.9965 0.0127331C12.7343 0.0104547 12.4817 0.111249 12.2931 0.293407L7.00008 5.58641L1.70708 0.293407Z"
                  fill="white"
                />
              </Svg>
            </Pressable>
          </View>
        </View>
      </Modal>

      <View style={styles.container}>
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
            <ThemedText style={styles.pointValue}>{totalScore}</ThemedText>
          </View>

          {/* Progress Indicators */}
          <View style={styles.progressContainer}>
            {quizzes.map((_, index) => (
              <Pressable
                key={index}
                onPress={() => {
                  setStep(index);
                  setSelected(null);
                  setIsCorrect(null);
                  setShowResult(false);
                  setHintUsed(false);
                }}
                style={[
                  styles.progressDot,
                  // 이미 답한 문항은 정오에 따라 색상 표시
                  questionResults[index] === 'correct' && styles.progressDotCorrect,
                  questionResults[index] === 'wrong' && styles.progressDotWrong,
                  // 아직 풀지 않은 현재 문항은 하이라이트
                  questionResults[index] === 'pending' &&
                    index === step &&
                    styles.progressDotCurrent,
                ]}
              />
            ))}
          </View>
        </View>

        {showResult &&
          (isCorrect ? (
            <View style={styles.correctResultCard}>
              <ThemedText style={styles.correctResultText}>Correct !</ThemedText>
            </View>
          ) : (
            <View style={styles.wrongResultCard}>
              <ThemedText style={styles.wrongResultText}>OOPS !</ThemedText>
            </View>
          ))}

        {!showResult && (
          <View style={styles.questionCard}>
            <ThemedText type="subtitle" style={styles.qIndex}>
              Q{quiz.id}
            </ThemedText>
            <ThemedText style={styles.question}>{quiz.question}</ThemedText>
          </View>
        )}

        <View style={styles.choiceWrapper}>
          {quiz.choices.map((c, i) => {
            const isSelectedChoice = selected === c;
            const isWrongSelected = showResult && isSelectedChoice && !isCorrect;
            const isCorrectSelected = showResult && isSelectedChoice && isCorrect;

            // 오답 선택한 경우 별도 스타일 적용
            if (isWrongSelected) {
              return (
                <View key={i} style={styles.wrongChoiceSelected}>
                  {/* X Icon */}
                  <Svg
                    width="19"
                    height="19"
                    viewBox="0 0 19 19"
                    fill="none"
                    style={styles.wrongChoiceIcon}
                  >
                    <Path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M5 0L0 5L4.16667 9.16667L0 13.3333L5 18.3333L9.16667 14.1667L13.3333 18.3333L18.3333 13.3333L14.1667 9.16667L18.3333 5L13.3333 0L9.16667 4.16667L5 0Z"
                      fill="white"
                    />
                  </Svg>
                  <ThemedText style={styles.choiceText}>{c}</ThemedText>
                  <ThemedText style={styles.wrongChoicePoint}>
                    {isQuestMode ? '+0p' : '+5p'}
                  </ThemedText>
                </View>
              );
            }

            // 정답 선택한 경우 별도 스타일 적용
            if (isCorrectSelected) {
              // 퀘스트 모드일 때: 힌트 사용 여부에 따라 20 / 10 점 표시
              const perQuestionPoint = isQuestMode ? (hintUsed || isRetryMode ? 10 : 20) : 60;

              return (
                <View key={i} style={styles.correctChoiceSelected}>
                  {/* Left section: Icon + Text */}
                  <View style={styles.correctChoiceLeft}>
                    {/* Check Icon */}
                    <Svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      style={styles.correctChoiceIcon}
                    >
                      <Path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M1.6665 10L3.74984 7.91667L7.9165 12.0833L16.2498 3.75L18.3332 5.83333L7.9165 16.25L1.6665 10Z"
                        fill="white"
                        stroke="white"
                        strokeWidth="1.66667"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                    <ThemedText style={styles.choiceText}>{c}</ThemedText>
                  </View>
                  {/* Right section: Points */}
                  <ThemedText style={styles.correctChoicePoint}>+{perQuestionPoint}p</ThemedText>
                </View>
              );
            }

            return (
              <Pressable
                key={i}
                style={styles.choice}
                disabled={showResult || submitting}
                onPress={() => onSelect(c)}
              >
                <ThemedText style={styles.choiceText}>{c}</ThemedText>
              </Pressable>
            );
          })}
        </View>

        {!showResult && !isReviewMode && !allAnswered && (
          <Pressable style={styles.hintBtn} onPress={onHintPress}>
            {/* Lock Icon - changes based on hintUsed */}
            {hintUsed ? (
              <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <Path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M10 1.66699C10.9092 1.66699 11.7642 1.91033 12.5 2.33699C12.5996 2.38909 12.6876 2.46079 12.7588 2.54779C12.8299 2.63478 12.8827 2.73527 12.9141 2.84321C12.9454 2.95115 12.9545 3.06431 12.941 3.17588C12.9274 3.28745 12.8914 3.39513 12.8352 3.49243C12.779 3.58974 12.7036 3.67466 12.6137 3.74209C12.5238 3.80952 12.4212 3.85806 12.312 3.8848C12.2028 3.91154 12.0894 3.91592 11.9785 3.89768C11.8676 3.87944 11.7615 3.83895 11.6667 3.77866C11.1598 3.48603 10.5849 3.33201 9.9996 3.33208C9.41435 3.33215 8.83943 3.48631 8.33265 3.77905C7.82587 4.0718 7.4051 4.49282 7.11265 4.99977C6.82021 5.50672 6.66639 6.08174 6.66667 6.66699L15.8333 6.66783C16.2754 6.66783 16.6993 6.84342 17.0118 7.15598C17.3244 7.46854 17.5 7.89246 17.5 8.33449V16.6678C17.5 17.1099 17.3244 17.5338 17.0118 17.8463C16.6993 18.1589 16.2754 18.3345 15.8333 18.3345H4.16667C3.72464 18.3345 3.30072 18.1589 2.98816 17.8463C2.67559 17.5338 2.5 17.1099 2.5 16.6678V8.33366C2.5 7.89163 2.67559 7.46771 2.98816 7.15515C3.30072 6.84259 3.72464 6.66699 4.16667 6.66699H5C5 5.34091 5.52678 4.06914 6.46447 3.13146C7.40215 2.19378 8.67392 1.66699 10 1.66699ZM10 10.0003C9.63312 10.0003 9.2765 10.1214 8.98544 10.3448C8.69439 10.5681 8.48515 10.8812 8.3902 11.2356C8.29524 11.59 8.31987 11.9658 8.46026 12.3048C8.60065 12.6437 8.84895 12.9269 9.16667 13.1103V14.167C9.16667 14.388 9.25446 14.6 9.41074 14.7562C9.56702 14.9125 9.77899 15.0003 10 15.0003C10.221 15.0003 10.433 14.9125 10.5893 14.7562C10.7455 14.6 10.8333 14.388 10.8333 14.167V13.1103C11.151 12.9269 11.3994 12.6437 11.5397 12.3048C11.6801 11.9658 11.7048 11.59 11.6098 11.2356C11.5148 10.8812 11.3056 10.5681 11.0146 10.3448C10.7235 10.1214 10.3669 10.0003 10 10.0003ZM16.5983 4.18449L17.4033 4.40116C17.6086 4.46541 17.781 4.60654 17.8847 4.79501C17.9883 4.98349 18.015 5.20473 17.9592 5.41245C17.9035 5.62017 17.7696 5.7983 17.5855 5.90957C17.4015 6.02084 17.1815 6.05665 16.9717 6.00949L16.1675 5.79449C15.9549 5.73654 15.7739 5.59676 15.6641 5.40572C15.5544 5.21468 15.5247 4.98793 15.5817 4.77508C15.6386 4.56223 15.7776 4.3806 15.9681 4.26992C16.1586 4.15924 16.3852 4.12853 16.5983 4.18449ZM15.5275 1.74199C15.6332 1.77032 15.7323 1.81921 15.8192 1.88584C15.906 1.95248 15.9788 2.03557 16.0335 2.13037C16.0883 2.22516 16.1238 2.32981 16.138 2.43833C16.1523 2.54685 16.145 2.65711 16.1167 2.76283L16.0092 3.16449C15.9813 3.27065 15.9327 3.37026 15.8662 3.4576C15.7997 3.54493 15.7167 3.61827 15.6217 3.67341C15.5268 3.72854 15.422 3.76438 15.3132 3.77887C15.2044 3.79336 15.0938 3.78621 14.9877 3.75784C14.8817 3.72946 14.7823 3.68042 14.6953 3.61353C14.6083 3.54664 14.5353 3.46322 14.4806 3.36805C14.4259 3.27288 14.3906 3.16785 14.3766 3.05898C14.3626 2.95011 14.3703 2.83956 14.3992 2.73366L14.5075 2.33116C14.5647 2.11783 14.7043 1.93595 14.8956 1.82547C15.0868 1.715 15.3141 1.68497 15.5275 1.74199Z"
                  fill="white"
                />
              </Svg>
            ) : (
              <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <Path
                  d="M4.99992 18.333C4.54159 18.333 4.14936 18.17 3.82325 17.8438C3.49714 17.5177 3.33381 17.1252 3.33325 16.6663V8.33301C3.33325 7.87468 3.49659 7.48245 3.82325 7.15634C4.14992 6.83023 4.54214 6.6669 4.99992 6.66634H5.83325V4.99968C5.83325 3.8469 6.23964 2.8644 7.05242 2.05218C7.8652 1.23995 8.8477 0.833564 9.99992 0.833008C11.1521 0.832453 12.1349 1.23884 12.9483 2.05218C13.7616 2.86551 14.1677 3.84801 14.1666 4.99968V6.66634H14.9999C15.4583 6.66634 15.8508 6.82968 16.1774 7.15634C16.5041 7.48301 16.6671 7.87523 16.6666 8.33301V16.6663C16.6666 17.1247 16.5035 17.5172 16.1774 17.8438C15.8513 18.1705 15.4588 18.3336 14.9999 18.333H4.99992ZM9.99992 14.1663C10.4583 14.1663 10.8508 14.0033 11.1774 13.6772C11.5041 13.3511 11.6671 12.9586 11.6666 12.4997C11.666 12.0408 11.503 11.6486 11.1774 11.323C10.8519 10.9975 10.4594 10.8341 9.99992 10.833C9.54047 10.8319 9.14825 10.9952 8.82325 11.323C8.49825 11.6508 8.33492 12.043 8.33325 12.4997C8.33159 12.9563 8.49492 13.3488 8.82325 13.6772C9.15159 14.0055 9.54381 14.1686 9.99992 14.1663ZM7.49992 6.66634H12.4999V4.99968C12.4999 4.30523 12.2569 3.71495 11.7708 3.22884C11.2846 2.74273 10.6944 2.49968 9.99992 2.49968C9.30547 2.49968 8.7152 2.74273 8.22909 3.22884C7.74297 3.71495 7.49992 4.30523 7.49992 4.99968V6.66634Z"
                  fill="white"
                />
              </Svg>
            )}

            {/* Center Text */}
            <ThemedText style={styles.hintBtnText}>
              {hintUsed ? 'Unlocked Hint' : 'Need Hint?'}
            </ThemedText>

            {/* Right Section: -5 mint */}
            {!hintUsed && (
              <View style={styles.hintCostSection}>
                <ThemedText style={styles.hintCostText}>-</ThemedText>
                <Svg width="20" height="12" viewBox="0 0 20 12" fill="none">
                  <Path
                    d="M20 6.01851V6.40605C20 6.95444 19.6761 7.42058 19.1766 7.73499C19.7955 8.20661 20.1267 8.90489 19.9385 9.56296L19.8281 9.92856C19.5241 10.9796 18.0185 11.3818 16.7518 10.753L15.6009 10.1845C15.2737 10.0249 14.9847 9.79533 14.754 9.51177C14.5684 9.77264 14.3614 10.0172 14.1351 10.243C13.5333 10.8518 12.8086 11.3225 12.0105 11.623C11.2123 11.9234 10.3595 12.0467 9.50997 11.9842C8.66045 11.9218 7.83422 11.6751 7.08756 11.2611C6.3409 10.847 5.69133 10.2753 5.18307 9.5849C4.96318 9.83235 4.69766 10.0341 4.40134 10.179L3.25044 10.7475C1.98373 11.3763 0.485391 10.9742 0.174141 9.92307L0.0637369 9.55747C-0.117222 8.90671 0.20671 8.20843 0.825589 7.7295C0.326142 7.41509 0.00221698 6.94346 0.00221698 6.40056V6.01851C0.0101927 5.75959 0.0822858 5.50681 0.211893 5.28329C0.3415 5.05976 0.524483 4.87261 0.744145 4.73893C0.201267 4.31119 -0.108158 3.68785 0.0347993 3.07548L0.121656 2.6989C0.362332 1.67158 1.75028 1.17255 3.02966 1.65697L4.224 2.11213C4.52453 2.22443 4.80229 2.39105 5.04373 2.60385C5.59192 1.79501 6.3284 1.13458 7.18842 0.680588C8.04845 0.226594 9.00569 -0.00705826 9.97604 0.00016241C10.9464 0.00738308 11.9001 0.25526 12.7534 0.722003C13.6067 1.18875 14.3335 1.86007 14.8698 2.67697C15.1289 2.42675 15.4372 2.23431 15.7746 2.11213L16.9671 1.65697C18.2483 1.17255 19.6345 1.67158 19.8751 2.6989L19.962 3.07548C20.105 3.68785 19.8009 4.31119 19.2526 4.73893C19.4733 4.87195 19.6574 5.05882 19.788 5.28239C19.9185 5.50596 19.9915 5.75907 20 6.01851Z"
                    fill="white"
                  />
                </Svg>
                <ThemedText style={styles.hintCostText}>5</ThemedText>
              </View>
            )}
          </Pressable>
        )}

        {showResult &&
          !allAnswered &&
          !isReviewMode &&
          (isCorrect ? (
            <Pressable style={styles.correctContinueBtn} onPress={onContinue}>
              <ThemedText style={styles.hintBtnText}>
                {isLastProblem ? 'Done!' : 'Continue'}
              </ThemedText>
              <View style={styles.hintCostSection}>
                <ThemedText style={styles.hintCostText}>
                  {isQuestMode ? (hintUsed || isRetryMode ? '+10p' : '+20p') : '+60p'}
                </ThemedText>
              </View>
            </Pressable>
          ) : (
            <Pressable style={styles.wrongContinueBtn} onPress={onContinue}>
              <ThemedText style={styles.hintBtnText}>
                {isLastProblem ? 'Done!' : 'Continue'}
              </ThemedText>
              <View style={styles.hintCostSection}>
                <ThemedText style={styles.hintCostText}>{isQuestMode ? '+0p' : '+5p'}</ThemedText>
              </View>
            </Pressable>
          ))}

        {/* Navigation buttons - 현재는 리뷰 모드만 사용 (플레이 모드에서는 숨김) */}
        {isReviewMode && (
          // 리뷰(솔브드) 모드: 하단 solved 바 + 양쪽 화살표만
          <View style={styles.solvedContainer}>
            <Pressable
              style={[styles.solvedArrowBtn, step === 0 && styles.navBtnDisabled]}
              onPress={onPrevious}
              disabled={step === 0}
            >
              <Ionicons name="chevron-back" size={24} color="#FFF" />
            </Pressable>

            <View style={styles.solvedPill}>
              <ThemedText style={styles.solvedText}>solved</ThemedText>
            </View>

            <Pressable
              style={[styles.solvedArrowBtn, step === quizzes.length - 1 && styles.navBtnDisabled]}
              onPress={onNext}
              disabled={step === quizzes.length - 1}
            >
              <Ionicons name="chevron-forward" size={24} color="#FFF" />
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#34495E',
  },
  sparkleBackground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    zIndex: 0,
    mixBlendMode: 'color-dodge',
  },
  horangImage: {
    position: 'absolute',
    bottom: 15,
    alignSelf: 'center',
    width: 141,
    height: 202,
    zIndex: 1,
  },
  container: {
    flex: 1,
    paddingTop: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    zIndex: 2,
  },

  /* Header */
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    flexShrink: 1,
    maxWidth: '75%',
  },

  /* Point Container */
  pointContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
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
  // 정답인 경우
  progressDotCorrect: {
    backgroundColor: '#76C7AD',
  },
  // 오답인 경우
  progressDotWrong: {
    backgroundColor: '#FF7F50',
  },
  // 아직 풀지 않은 현재 문항
  progressDotCurrent: {
    backgroundColor: '#FFF',
  },
  questionCard: {
    width: '100%',
    padding: 20,
    paddingHorizontal: 10,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFF',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
    marginBottom: 20,
  },
  qIndex: {
    color: '#34495E',
    textAlign: 'center',
    fontFamily: 'BagelFatOne-Regular',
    fontSize: 20,
    fontWeight: '400',
  },
  question: {
    color: '#34495E',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '400',
  },
  choiceWrapper: {
    width: '100%',
    gap: 12,
    marginTop: 10,
  },
  choice: {
    height: 47,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFF',
    flexDirection: 'row',
  },
  choiceText: {
    color: '#FFF',
    fontFamily: 'Pretendard',
    fontSize: 14,
    fontWeight: '700',
  },
  choicePoint: {
    position: 'absolute',
    right: 14,
    top: '50%',
    marginTop: -10,
    color: '#fff',
    fontWeight: '700',
  },
  hintBtn: {
    position: 'absolute',
    bottom: 35,
    width: 320,
    height: 50,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    borderRadius: 35,
    backgroundColor: '#222D39',
    flexDirection: 'row',
    zIndex: 3,
  },
  hintBtnText: {
    color: '#FFF',
    fontFamily: 'Pretendard',
    fontSize: 16,
    fontWeight: '700',
  },
  hintCostSection: {
    flexDirection: 'row',
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  hintCostText: {
    color: '#FFF',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
  },
  continueBtn: {
    marginTop: 25,
    paddingVertical: 16,
    paddingHorizontal: 60,
    borderRadius: 30,
  },
  continueCorrect: {
    backgroundColor: '#FFA46F',
  },
  continueWrong: {
    backgroundColor: '#FF7F50',
  },
  continueText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  resultCard: {
    width: '100%',
    padding: 20,
    borderRadius: 18,
    marginBottom: 16,
    backgroundColor: '#FDF2E9',
  },
  resultTail: {
    position: 'absolute',
    bottom: -10,
    left: '50%',
    marginLeft: -10,
    width: 20,
    height: 20,
    backgroundColor: '#FDF2E9',
    transform: [{ rotate: '45deg' }],
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
    color: '#000',
  },
  correctText: { color: '#FF6F41' },
  wrongText: { color: '#58CC7B' },
  resultDesc: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    color: '#000',
  },
  hintOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hintBox: {
    width: 320,
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 10,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    borderRadius: 10,
    backgroundColor: '#FEF5E7',
  },
  hintTitle: {
    color: '#4A90E2',
    textAlign: 'center',
    fontFamily: 'Pretendard',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 36,
    letterSpacing: -0.18,
  },
  hintText: {
    color: '#4A90E2',
    textAlign: 'center',
    fontFamily: 'Pretendard',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: -0.16,
  },
  hintCloseBtn: {
    width: 50,
    height: 50,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 41,
    backgroundColor: '#659DF2',
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 25,
    gap: 10,
  },
  // Solved(리뷰) 모드 하단 바
  solvedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 25,
    gap: 16,
  },
  solvedArrowBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#659DF2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  solvedPill: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  solvedText: {
    color: '#34495E',
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'lowercase',
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 4,
  },
  navBtnDisabled: {
    opacity: 0.3,
  },
  navBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  resultsBtn: {
    flex: 1,
    backgroundColor: '#FFA46F',
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  resultsBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  wrongResultCard: {
    width: '100%',
    height: 70,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FF7F50',
    backgroundColor: '#FF7F50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  wrongResultText: {
    color: '#FFF',
    textAlign: 'center',
    fontFamily: 'BagelFatOne-Regular',
    fontSize: 20,
    fontWeight: '400',
  },
  wrongChoiceSelected: {
    height: 47,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFF',
    backgroundColor: 'rgba(255, 127, 80, 0.70)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  wrongChoiceIcon: {
    marginRight: 8,
  },
  wrongChoicePoint: {
    marginLeft: 'auto',
    color: '#FFF',
    fontFamily: 'Pretendard',
    fontSize: 14,
    fontWeight: '700',
  },
  wrongContinueBtn: {
    position: 'absolute',
    bottom: 35,
    width: 320,
    height: 50,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    borderRadius: 35,
    backgroundColor: '#FF7F50',
    flexDirection: 'row',
    zIndex: 3,
  },
  correctResultCard: {
    width: '100%',
    padding: 20,
    paddingHorizontal: 10,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#76C7AD',
    backgroundColor: '#76C7AD',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
    marginBottom: 20,
  },
  correctResultText: {
    color: '#FFF',
    textAlign: 'center',
    fontFamily: 'BagelFatOne-Regular',
    fontSize: 20,
    fontWeight: '400',
  },
  correctChoiceSelected: {
    height: 47,
    paddingVertical: 8,
    paddingHorizontal: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'stretch',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFF',
    backgroundColor: 'rgba(118, 199, 173, 0.50)',
    flexDirection: 'row',
  },
  correctChoiceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  correctChoiceIcon: {
    flexShrink: 0,
  },
  correctChoicePoint: {
    color: '#FFF',
    fontFamily: 'Pretendard',
    fontSize: 14,
    fontWeight: '700',
  },
  correctContinueBtn: {
    position: 'absolute',
    bottom: 35,
    width: 320,
    height: 50,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    borderRadius: 35,
    backgroundColor: '#76C7AD',
    flexDirection: 'row',
    zIndex: 3,
  },
});

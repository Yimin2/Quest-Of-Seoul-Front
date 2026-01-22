import { RouteResultList } from '@widgets/route-result-list';
import type { ChatSession, Quest } from '@shared/api';
import { questApi } from '@shared/api';
import { useAuthStore } from '@entities/user';
import { useChatHistoryStore } from '@entities/chat';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText, ThemedView } from '@shared/ui';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';

// 🔥 Supabase URL 절대경로 처리
const SUPABASE_URL =
  Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;

const getFullImageUrl = (url?: string | null): string | null => {
  // 🔥 NULL, undefined, 빈 문자열, "null" 문자열 모두 필터링
  if (!url || url === 'null' || url === 'undefined' || url.trim().length === 0) {
    return null;
  }

  // HTTP/HTTPS로 시작하면 절대경로
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // 상대경로인 경우 절대경로로 변환
  if (url.startsWith('/storage')) {
    return `${SUPABASE_URL}${url}`;
  }

  // 기타 경우 그대로 반환 (하지만 5자 미만이면 무효)
  return url.length > 5 ? url : null;
};

export default function ChatHistoryScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<'ai' | 'plus' | 'plan'>('ai');
  const { sessions, isLoading, error, fetchChatList } = useChatHistoryStore();
  const { isAuthenticated } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRouteResults, setShowRouteResults] = useState(false);
  const [routeQuests, setRouteQuests] = useState<Quest[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      loadChats();
    }
  }, [tab, isAuthenticated]);

  const loadChats = async () => {
    let params: {
      limit?: number;
      mode?: 'explore' | 'quest';
      function_type?: 'rag_chat' | 'vlm_chat' | 'route_recommend';
    } = { limit: 20 };

    if (tab === 'ai') {
      // 일반 AI 채팅: Explore 모드 RAG 채팅
      params.mode = 'explore';
      params.function_type = 'rag_chat';
    } else if (tab === 'plus') {
      // AI PLUS 채팅: Quest 모드 RAG + VLM 채팅 모두 포함
      params.mode = 'quest';
      // function_type을 지정하지 않으면 quest mode의 모든 채팅 (rag_chat, vlm_chat) 가져옴
    } else if (tab === 'plan') {
      // Plan 채팅: 여행 경로 추천
      params.mode = 'explore';
      params.function_type = 'route_recommend';
    }

    await fetchChatList(params);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadChats();
    setRefreshing(false);
  };

  const handleSessionPress = (session: ChatSession) => {
    setSelectedSession(session);
    setShowDetailModal(true);
  };

  const formatTime = (timeAgo: string) => {
    // API에서 이미 "5분전", "01월 01일" 형식으로 제공됨
    return timeAgo;
  };

  // 🔥 추천 결과 보기 핸들러
  const handleShowRouteResults = async (chat: any) => {
    try {
      const questIds = chat.options?.quest_ids;

      if (!questIds || questIds.length === 0) {
        alert(
          'This recommendation result cannot be viewed.\nPlease request a new travel route recommendation.',
        );
        return;
      }

      const allQuests = await questApi.getQuestList();

      const selectedQuests = allQuests.filter((q: Quest) => questIds.includes(q.id));

      if (selectedQuests.length === 0) {
        alert('Could not find recommended quests.');
        return;
      }

      setRouteQuests(selectedQuests);
      setShowRouteResults(true);
      setShowDetailModal(false);
    } catch (error) {
      alert('An error occurred while loading the recommendation results.');
    }
  };

  /** --------------------------------------------------
   *  메시지 렌더링 전략 함수
   *  chat: 각 메시지 row
   *  type: session.function_type (rag_chat, vlm_chat, route_recommend)
   * --------------------------------------------------*/
  const renderChatMessage = (chat: any, type: string) => {
    const imageUrl = getFullImageUrl(chat.image_url);

    // 📌 AI PLUS - 이미지 + 텍스트
    if (type === 'vlm_chat') {
      return (
        <View key={chat.id} style={{ marginBottom: 20 }}>
          {/* User Bubble */}
          <View style={[styles.bubble, styles.userBubble]}>
            {chat.user_message && (
              <ThemedText style={styles.userMessageText}>{chat.user_message}</ThemedText>
            )}
            {imageUrl && (
              <Image
                source={{ uri: imageUrl }}
                style={styles.bubbleImage}
                resizeMode="cover"
                onError={() => {}}
                onLoad={() => {}}
              />
            )}
          </View>

          {/* AI Bubble */}
          <View style={[styles.bubble, styles.assistantBubble]}>
            <ThemedText style={styles.assistantMessageText}>{chat.ai_response}</ThemedText>
          </View>
        </View>
      );
    }

    if (type === 'route_recommend') {
      return (
        <View key={chat.id} style={{ marginBottom: 20 }}>
          <View style={styles.planBubble}>
            <ThemedText style={styles.planTitle}>
              {chat.title || 'Travel Recommendation Result'}
            </ThemedText>

            {chat.selected_theme && (
              <ThemedText style={styles.planMeta}>• Theme: {chat.selected_theme}</ThemedText>
            )}

            {chat.selected_districts &&
              Array.isArray(chat.selected_districts) &&
              chat.selected_districts.length > 0 && (
                <ThemedText style={styles.planMeta}>
                  • Districts: {chat.selected_districts.join(', ')}
                </ThemedText>
              )}

            {chat.include_cart && (
              <ThemedText style={styles.planMeta}>• Cart places included</ThemedText>
            )}

            {chat.user_message && (
              <ThemedText style={styles.planMeta}>📝 요청: {chat.user_message}</ThemedText>
            )}

            <ThemedText style={styles.planMessage}>{chat.ai_response}</ThemedText>

            {chat.options?.quest_ids && chat.options.quest_ids.length > 0 ? (
              <Pressable
                style={styles.planButton}
                onPress={() => {
                  handleShowRouteResults(chat);
                }}
              >
                <ThemedText style={styles.planButtonText}>
                  View Results ({chat.options.quest_ids.length})
                </ThemedText>
              </Pressable>
            ) : (
              <View style={[styles.planButton, styles.planButtonDisabled]}>
                <ThemedText style={[styles.planButtonText, styles.planButtonTextDisabled]}>
                  ⚠️ Previous Version (Results Unavailable)
                </ThemedText>
              </View>
            )}
          </View>
        </View>
      );
    }

    // 📌 일반 AI Chat — 텍스트만
    return (
      <View key={chat.id} style={{ marginBottom: 20 }}>
        {/* User */}
        <View style={[styles.bubble, styles.userBubble]}>
          <ThemedText style={styles.userMessageText}>{chat.user_message}</ThemedText>
        </View>

        {/* AI */}
        <View style={[styles.bubble, styles.assistantBubble]}>
          <ThemedText style={styles.assistantMessageText}>{chat.ai_response}</ThemedText>
        </View>
      </View>
    );
  };

  const renderItem = ({ item }: { item: ChatSession }) => {
    const isAiPlus = tab === 'plus';
    const isPlan = tab === 'plan';
    const landmark = item.chats?.[0]?.landmark;

    // 제목: user_message를 우선 표시
    const displayTitle = item.chats?.[0]?.user_message || item.title || '제목 없음';

    return (
      <View style={styles.chatListItem}>
        <Pressable style={styles.chatCardLeft} onPress={() => handleSessionPress(item)}>
          {isPlan ? (
            // Plan Chat 아이콘 (깃발 모양)
            <View style={{ marginLeft: 10, marginRight: 10 }}>
              <Svg width="16" height="22" viewBox="0 0 16 22" fill="none">
                <Path
                  d="M15.9999 6.63451C16.0066 7.38848 15.7748 8.1252 15.3379 8.73889C14.901 9.35258 14.2814 9.81169 13.5681 10.0503L4.76816 13.0835C4.54505 13.1621 4.31418 13.2164 4.07946 13.2455V19.9521C4.07946 20.4948 3.86466 21.0153 3.48221 21.3993C3.09977 21.7832 2.58091 21.9993 2.0397 22C1.49871 21.9986 0.980318 21.7823 0.598025 21.3985C0.215732 21.0147 0.000698957 20.4945 0 19.9521V9.83245C0 9.77667 0 9.72352 0 9.66774V3.60128C0 3.54816 0 3.49235 0 3.43923C0.00793704 3.26067 0.0300822 3.08304 0.0662244 2.90801C0.166435 2.4025 0.373411 1.92434 0.673174 1.50566C0.972937 1.08697 1.35853 0.737447 1.80416 0.480573C2.24979 0.223698 2.74508 0.0654658 3.25677 0.0164061C3.76845 -0.0326536 4.28471 0.0286175 4.77081 0.196159L13.5707 3.22939C14.2818 3.46786 14.8996 3.92555 15.3359 4.53707C15.7721 5.14859 16.0045 5.88267 15.9999 6.63451Z"
                  fill="#659DF2"
                />
              </Svg>
            </View>
          ) : isAiPlus ? (
            // AI PLUS Chat 아이콘 (이미지 + 더블 스타 합친 아이콘) - QuestImageFindIcon
            <View
              style={{
                width: 35,
                height: 35,
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
              }}
            >
              {/* 더블 스타 아이콘 - 오른쪽 위 */}
              <View style={{ position: 'absolute', top: 0, right: 0 }}>
                <Svg
                  width={23.899}
                  height={20.97}
                  viewBox="0 0 35 31"
                  fill="none"
                  style={{ aspectRatio: 23.9 / 20.97 }}
                >
                  <Path
                    d="M24.8198 12.4333C24.8304 12.8069 24.7124 13.1729 24.4857 13.4699C24.2589 13.767 23.9371 13.9772 23.574 14.0654C21.4436 14.8503 19.3257 15.6353 17.1828 16.3828C16.9892 16.4427 16.8131 16.5489 16.6699 16.6921C16.5266 16.8354 16.4204 17.0114 16.3605 17.205C15.6255 19.2855 14.8655 21.3536 14.1056 23.4341C14.0215 23.8235 13.8085 24.173 13.501 24.4263C13.1935 24.6795 12.8095 24.8217 12.4112 24.8296C12.0029 24.8177 11.61 24.6704 11.2943 24.411C10.9786 24.1517 10.758 23.795 10.667 23.3967C9.91953 21.3286 9.15957 19.2605 8.41207 17.1675C8.35776 16.9847 8.25868 16.8185 8.1238 16.6836C7.98892 16.5488 7.82251 16.4496 7.63966 16.3953C5.49682 15.6353 3.37889 14.8503 1.24851 14.0654C0.877659 13.9782 0.549514 13.7631 0.321655 13.4577C0.0937964 13.1524 -0.0191895 12.7766 0.00266798 12.3962C-0.00907064 12.0195 0.108014 11.6499 0.334506 11.3487C0.560998 11.0475 0.883362 10.8325 1.24851 10.7392C3.35397 9.96677 5.45946 9.18178 7.57738 8.43428C7.77097 8.37443 7.94706 8.26823 8.09035 8.12495C8.23363 7.98167 8.33975 7.80573 8.3996 7.61214C9.13465 5.54407 9.89468 3.46354 10.6546 1.383C10.7391 0.994897 10.9526 0.646857 11.2603 0.395709C11.568 0.14456 11.9518 0.00499726 12.349 0C13.1588 0 13.7319 0.461127 14.0807 1.42041C14.8407 3.48849 15.6005 5.56902 16.3481 7.64955C16.3995 7.83524 16.4974 8.00466 16.6326 8.14198C16.7677 8.27931 16.9356 8.37987 17.1205 8.43428C19.2799 9.19008 21.427 9.97096 23.5615 10.7766C23.9324 10.861 24.2618 11.0731 24.4918 11.3761C24.7219 11.6791 24.8381 12.0534 24.8198 12.4333Z"
                    fill="#659DF2"
                  />
                  <Path
                    d="M34.9983 23.6091C35.0036 23.8219 34.9378 24.0304 34.8115 24.2019C34.6852 24.3733 34.5055 24.4979 34.3006 24.5559L30.6503 25.8887C30.5384 25.9183 30.436 25.9765 30.3531 26.0572C30.2702 26.138 30.2095 26.2388 30.1769 26.3498C29.7533 27.5957 29.3173 28.7292 28.9311 29.9252C28.8828 30.1472 28.7601 30.3461 28.5834 30.4888C28.4067 30.6315 28.1864 30.7097 27.9593 30.7102C27.7256 30.7096 27.4992 30.6289 27.3178 30.4815C27.1364 30.3341 27.0111 30.1289 26.9626 29.9003C26.5266 28.6544 26.0905 27.5209 25.7168 26.3374C25.6847 26.2315 25.627 26.1352 25.5487 26.0569C25.4705 25.9787 25.3742 25.9208 25.2683 25.8887L21.6055 24.5559C21.3962 24.5015 21.2122 24.3759 21.085 24.201C20.9577 24.026 20.8951 23.8125 20.9079 23.5966C20.9034 23.3789 20.9722 23.1659 21.1032 22.9919C21.2343 22.818 21.42 22.6931 21.6305 22.6373L25.2558 21.3291C25.3671 21.2942 25.4683 21.233 25.5507 21.1506C25.6331 21.0681 25.6944 20.9668 25.7293 20.8555C26.1528 19.6097 26.5889 18.4762 26.9751 17.2926C27.0187 17.0673 27.1397 16.8643 27.3171 16.7187C27.4946 16.5731 27.7173 16.4939 27.9468 16.4951C28.1805 16.4958 28.407 16.5765 28.5884 16.7239C28.7697 16.8712 28.8951 17.0765 28.9435 17.3051C29.3796 18.5509 29.8156 19.6845 30.1894 20.868C30.2159 20.9767 30.2717 21.076 30.3508 21.1551C30.4299 21.2342 30.5292 21.2901 30.6379 21.3166C31.8837 21.7527 33.1295 22.2137 34.3754 22.6622C34.5674 22.7317 34.7319 22.8614 34.8442 23.0321C34.9564 23.2027 35.0105 23.4052 34.9983 23.6091Z"
                    fill="#659DF2"
                  />
                </Svg>
              </View>
              {/* 이미지 아이콘 - 왼쪽 아래 */}
              <View style={{ position: 'absolute', bottom: 0, left: 0 }}>
                <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
                  <Path
                    d="M13.4142 5.96214C13.4142 6.35744 13.2571 6.73655 12.9776 7.01606C12.6981 7.29558 12.319 7.45261 11.9237 7.45261C11.5284 7.45261 11.1493 7.29558 10.8698 7.01606C10.5903 6.73655 10.4332 6.35744 10.4332 5.96214C10.4332 5.56685 10.5903 5.18774 10.8698 4.90823C11.1493 4.62871 11.5284 4.47168 11.9237 4.47168C12.319 4.47168 12.6981 4.62871 12.9776 4.90823C13.2571 5.18774 13.4142 5.56685 13.4142 5.96214Z"
                    fill="#659DF2"
                  />
                  <Path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M8.90029 0.931409H8.98525C10.706 0.931409 12.0541 0.931409 13.1064 1.073C14.1825 1.21758 15.0321 1.52014 15.699 2.18638C16.366 2.85336 16.6678 3.70293 16.8124 4.77979C16.954 5.83131 16.954 7.17944 16.954 8.90018V8.96576C16.954 10.3884 16.954 11.5525 16.8765 12.5004C16.799 13.4543 16.6403 14.2495 16.2841 14.9112C16.1281 15.2024 15.933 15.4649 15.699 15.6989C15.0321 16.3659 14.1825 16.6677 13.1056 16.8123C12.0541 16.9539 10.706 16.9539 8.98525 16.9539H8.90029C7.17955 16.9539 5.83142 16.9539 4.77915 16.8123C3.70304 16.6677 2.85347 16.3652 2.18649 15.6989C1.59552 15.108 1.28998 14.3724 1.12826 13.4588C0.968035 12.5623 0.938971 11.4466 0.933009 10.062C0.932015 9.70925 0.931519 9.33614 0.931519 8.94266V8.89944C0.931519 7.17869 0.931519 5.83057 1.07311 4.7783C1.21769 3.70218 1.52025 2.85262 2.18649 2.18564C2.85347 1.51865 3.70304 1.21683 4.7799 1.07226C5.83142 0.930664 7.17955 0.930664 8.90029 0.930664M4.9282 2.17967C3.97579 2.30785 3.40122 2.55229 2.97718 2.97633C2.5524 3.40111 2.30871 3.97494 2.18053 4.92809C2.05086 5.89689 2.04937 7.16975 2.04937 8.94191V9.57089L2.79535 8.91807C3.12256 8.63164 3.54641 8.48029 3.98103 8.49468C4.41566 8.50907 4.82857 8.68812 5.13612 8.99557L8.33317 12.1926C8.58126 12.4407 8.9089 12.5932 9.25841 12.6235C9.60792 12.6538 9.95691 12.5598 10.2439 12.3581L10.466 12.2016C10.8801 11.9106 11.3807 11.7687 11.8859 11.7992C12.3912 11.8296 12.8711 12.0306 13.2472 12.3692L15.3562 14.2673C15.5694 13.8217 15.6953 13.2359 15.7624 12.4095C15.8354 11.5115 15.8362 10.3921 15.8362 8.94191C15.8362 7.16975 15.8347 5.89689 15.705 4.92809C15.5768 3.97494 15.3324 3.40036 14.9084 2.97558C14.4836 2.55154 13.9097 2.30785 12.9566 2.17967C11.9878 2.05 10.7149 2.04851 8.94277 2.04851C7.17061 2.04851 5.897 2.05 4.9282 2.17967Z"
                    fill="#659DF2"
                  />
                </Svg>
              </View>
            </View>
          ) : (
            // 일반 AI Chat 아이콘 (별 1개)
            <Svg width="19" height="17" viewBox="0 0 19 17" fill="none">
              <Path
                d="M13.3377 6.68146C13.3433 6.8822 13.28 7.07886 13.1581 7.23849C13.0363 7.39812 12.8633 7.51108 12.6682 7.55852C11.5234 7.9803 10.3852 8.40215 9.2337 8.80384C9.12967 8.836 9.03504 8.89307 8.95804 8.97007C8.88104 9.04706 8.82398 9.14161 8.79181 9.24564C8.39682 10.3637 7.98843 11.475 7.58004 12.5931C7.53486 12.8023 7.42039 12.9902 7.25515 13.1262C7.0899 13.2623 6.88357 13.3388 6.66955 13.343C6.4501 13.3366 6.23897 13.2574 6.06932 13.1181C5.89968 12.9787 5.78111 12.787 5.73225 12.573C5.33056 11.4616 4.92217 10.3503 4.52048 9.22554C4.49129 9.12728 4.43805 9.03797 4.36557 8.96549C4.29309 8.89301 4.20366 8.83973 4.1054 8.81054C2.95388 8.40215 1.81575 7.9803 0.670922 7.55852C0.471636 7.51162 0.295298 7.39603 0.172851 7.23195C0.0504043 7.06788 -0.0103121 6.86591 0.00143372 6.66152C-0.00487438 6.45909 0.0580448 6.26048 0.179757 6.0986C0.301469 5.93672 0.474701 5.8212 0.670922 5.77105C1.80236 5.35597 2.9338 4.93413 4.07193 4.53243C4.17596 4.50027 4.27059 4.4432 4.34759 4.36621C4.42459 4.28921 4.48161 4.19466 4.51378 4.09063C4.90877 2.97929 5.3172 1.86124 5.72559 0.743201C5.77099 0.53464 5.8857 0.347609 6.05106 0.212647C6.21642 0.0776842 6.42265 0.00268544 6.63608 0C7.07125 0 7.37922 0.247801 7.56668 0.763306C7.97507 1.87465 8.38342 2.99269 8.78511 4.11074C8.81276 4.21052 8.86539 4.30156 8.93802 4.37536C9.01065 4.44916 9.10086 4.5032 9.20019 4.53243C10.3606 4.93859 11.5144 5.35822 12.6615 5.79115C12.8608 5.83652 13.0378 5.9505 13.1614 6.11331C13.2851 6.27612 13.3475 6.47726 13.3377 6.68146Z"
                fill="#659DF2"
              />
              <Path
                d="M18.8072 12.6872C18.81 12.8016 18.7747 12.9136 18.7068 13.0057C18.6389 13.0979 18.5423 13.1648 18.4322 13.196L16.4706 13.9122C16.4105 13.9281 16.3555 13.9594 16.3109 14.0028C16.2663 14.0462 16.2337 14.1003 16.2162 14.16C15.9886 14.8295 15.7543 15.4386 15.5467 16.0813C15.5208 16.2006 15.4549 16.3075 15.3599 16.3842C15.265 16.4609 15.1466 16.5029 15.0245 16.5032C14.8989 16.5029 14.7773 16.4595 14.6798 16.3803C14.5823 16.3011 14.515 16.1908 14.4889 16.0679C14.2546 15.3985 14.0203 14.7893 13.8195 14.1533C13.8022 14.0964 13.7712 14.0446 13.7292 14.0026C13.6871 13.9606 13.6353 13.9295 13.5785 13.9122L11.6102 13.196C11.4977 13.1667 11.3988 13.0992 11.3304 13.0052C11.262 12.9112 11.2284 12.7965 11.2352 12.6805C11.2328 12.5635 11.2698 12.449 11.3402 12.3555C11.4106 12.262 11.5104 12.1949 11.6236 12.1649L13.5718 11.462C13.6315 11.4432 13.6859 11.4103 13.7302 11.366C13.7745 11.3217 13.8074 11.2673 13.8262 11.2075C14.0538 10.538 14.2881 9.92884 14.4956 9.29283C14.5191 9.17172 14.5841 9.06264 14.6794 8.9844C14.7748 8.90616 14.8945 8.86358 15.0178 8.86427C15.1434 8.8646 15.2651 8.90799 15.3626 8.98718C15.46 9.06637 15.5274 9.17668 15.5535 9.29953C15.7878 9.96902 16.0221 10.5782 16.2229 11.2142C16.2372 11.2726 16.2672 11.326 16.3097 11.3685C16.3522 11.411 16.4055 11.441 16.4639 11.4553C17.1334 11.6896 17.8029 11.9373 18.4724 12.1784C18.5756 12.2157 18.664 12.2854 18.7243 12.3771C18.7847 12.4688 18.8137 12.5776 18.8072 12.6872Z"
                fill="#659DF2"
              />
            </Svg>
          )}
          <View style={styles.chatCardTextColumn}>
            {isPlan ? (
              // Plan Chat: 2줄 구조 (지역,테마 / 시간)
              <>
                {/* 지역, 테마 정보 */}
                <View style={styles.chatCardTimeRow}>
                  {item.chats?.[0]?.selected_districts &&
                    item.chats[0].selected_districts.length > 0 && (
                      <>
                        <ThemedText style={styles.planInfoText} numberOfLines={1}>
                          {item.chats[0].selected_districts[0]}
                        </ThemedText>
                        {item.chats?.[0]?.selected_theme && (
                          <ThemedText style={styles.planInfoText}>, </ThemedText>
                        )}
                      </>
                    )}
                  {item.chats?.[0]?.selected_theme && (
                    <ThemedText style={styles.planInfoText} numberOfLines={1}>
                      {item.chats[0].selected_theme}
                    </ThemedText>
                  )}
                </View>
                {/* 시간 정보 */}
                <ThemedText style={styles.chatCardTime}>{formatTime(item.time_ago)}</ThemedText>
              </>
            ) : (
              // AI Chat & AI PLUS Chat
              <>
                <ThemedText style={styles.chatCardTitle} numberOfLines={1}>
                  {displayTitle}
                </ThemedText>
                <View style={styles.chatCardTimeRow}>
                  {isAiPlus && landmark ? (
                    // AI PLUS Chat: 장소명 · 시간
                    <>
                      <ThemedText style={styles.chatCardLandmark} numberOfLines={1}>
                        {landmark}
                      </ThemedText>
                      <ThemedText style={styles.chatCardTimeSeparator}> · </ThemedText>
                      <ThemedText style={styles.chatCardTime}>
                        {formatTime(item.time_ago)}
                      </ThemedText>
                    </>
                  ) : (
                    // AI Chat: 시간만
                    <ThemedText style={styles.chatCardTime}>{formatTime(item.time_ago)}</ThemedText>
                  )}
                </View>
              </>
            )}
          </View>
        </Pressable>
        <Pressable style={styles.deleteButton}>
          <Svg width="15" height="19" viewBox="0 0 15 19" fill="none">
            <Path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M9.4 4.83491e-08C9.7498 9.07165e-05 10.0907 0.110238 10.3744 0.31484C10.6581 0.519441 10.8703 0.808125 10.9808 1.14L11.4333 2.5H14.1667C14.3877 2.5 14.5996 2.5878 14.7559 2.74408C14.9122 2.90036 15 3.11232 15 3.33333C15 3.55435 14.9122 3.76631 14.7559 3.92259C14.5996 4.07887 14.3877 4.16667 14.1667 4.16667L14.1642 4.22583L13.4417 14.345C13.3966 14.9755 13.1143 15.5655 12.6517 15.9963C12.1891 16.4271 11.5805 16.6666 10.9483 16.6667H4.05167C3.41955 16.6666 2.81092 16.4271 2.34831 15.9963C1.88569 15.5655 1.60342 14.9755 1.55833 14.345L0.835833 4.225L0.833333 4.16667C0.61232 4.16667 0.400358 4.07887 0.244078 3.92259C0.0877973 3.76631 0 3.55435 0 3.33333C0 3.11232 0.0877973 2.90036 0.244078 2.74408C0.400358 2.5878 0.61232 2.5 0.833333 2.5H3.56667L4.01917 1.14C4.12975 0.80799 4.34203 0.51921 4.62592 0.314596C4.9098 0.109982 5.25089 -8.42177e-05 5.60083 4.83491e-08H9.4ZM5 6.66667C4.79589 6.66669 4.59889 6.74163 4.44636 6.87726C4.29383 7.0129 4.19638 7.19979 4.1725 7.4025L4.16667 7.5V12.5C4.1669 12.7124 4.24823 12.9167 4.39404 13.0711C4.53985 13.2256 4.73913 13.3185 4.95116 13.331C5.1632 13.3434 5.37198 13.2744 5.53486 13.1381C5.69774 13.0018 5.80241 12.8084 5.8275 12.5975L5.83333 12.5V7.5C5.83333 7.27899 5.74554 7.06702 5.58926 6.91074C5.43297 6.75446 5.22101 6.66667 5 6.66667ZM10 6.66667C9.77899 6.66667 9.56702 6.75446 9.41074 6.91074C9.25446 7.06702 9.16667 7.27899 9.16667 7.5V12.5C9.16667 12.721 9.25446 12.933 9.41074 13.0893C9.56702 13.2455 9.77899 13.3333 10 13.3333C10.221 13.3333 10.433 13.2455 10.5893 13.0893C10.7455 12.933 10.8333 12.721 10.8333 12.5V7.5C10.8333 7.27899 10.7455 7.06702 10.5893 6.91074C10.433 6.75446 10.221 6.66667 10 6.66667ZM9.4 1.66667H5.6L5.3225 2.5H9.6775L9.4 1.66667Z"
              fill="white"
            />
          </Svg>
        </Pressable>
      </View>
    );
  };

  const getData = () => {
    if (tab === 'plan') {
    }
    return sessions;
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={26} color="#fff" />
          </Pressable>
          <ThemedText style={styles.headerTitle}>AI Station</ThemedText>
          <View style={styles.modeToggleButtons}>
            <Pressable style={[styles.modeButton, styles.modeButtonActive]}>
              <ThemedText style={[styles.modeButtonText, styles.modeButtonTextActive]}>
                Explore Mode
              </ThemedText>
            </Pressable>
            <Pressable style={styles.modeButton}>
              <ThemedText style={styles.modeButtonText}>Quest Mode</ThemedText>
            </Pressable>
          </View>
        </View>
        {/* Short cuts Section */}
        <View style={styles.shortcutsSection}>
          <ThemedText style={styles.shortcutsTitle}>Short cuts</ThemedText>

          <View style={styles.shortcutsRow}>
            {/* New AI Chat */}
            <Pressable style={styles.shortcutItem}>
              <View style={styles.shortcutIconContainer}>
                <Svg width="50" height="50" viewBox="0 0 50 50" fill="none">
                  <Circle cx="25" cy="25" r="24.5" fill="url(#paint0_radial_ai)" stroke="white" />
                  <Path
                    d="M30.2855 22.3513C30.295 22.6848 30.1897 23.0116 29.9872 23.2768C29.7847 23.542 29.4974 23.7297 29.1732 23.8085C27.271 24.5093 25.38 25.2102 23.4668 25.8776C23.2939 25.9311 23.1367 26.0259 23.0088 26.1538C22.8809 26.2817 22.786 26.4388 22.7326 26.6117C22.0763 28.4693 21.3978 30.3158 20.7192 32.1734C20.6442 32.5211 20.454 32.8332 20.1794 33.0593C19.9049 33.2854 19.5621 33.4124 19.2065 33.4194C18.8418 33.4088 18.491 33.2773 18.2092 33.0457C17.9273 32.8142 17.7303 32.4957 17.6491 32.14C16.9817 30.2935 16.3032 28.447 15.6358 26.5783C15.5873 26.415 15.4988 26.2666 15.3784 26.1462C15.258 26.0258 15.1094 25.9372 14.9461 25.8888C13.0329 25.2102 11.1419 24.5093 9.23974 23.8085C8.90862 23.7306 8.61564 23.5385 8.41219 23.2659C8.20875 22.9933 8.10787 22.6577 8.12738 22.3181C8.1169 21.9818 8.22144 21.6518 8.42367 21.3829C8.62589 21.1139 8.91372 20.922 9.23974 20.8386C11.1196 20.149 12.9995 19.4481 14.8905 18.7807C15.0634 18.7272 15.2206 18.6324 15.3485 18.5045C15.4764 18.3765 15.5712 18.2195 15.6246 18.0466C16.2809 16.2001 16.9595 14.3425 17.6381 12.4848C17.7135 12.1383 17.9041 11.8276 18.1788 11.6033C18.4536 11.3791 18.7962 11.2545 19.1509 11.25C19.8739 11.25 20.3856 11.6617 20.697 12.5182C21.3756 14.3647 22.0541 16.2224 22.7215 18.08C22.7674 18.2458 22.8548 18.3971 22.9755 18.5197C23.0962 18.6423 23.2461 18.7321 23.4111 18.7807C25.3392 19.4555 27.2562 20.1527 29.162 20.872C29.4932 20.9474 29.7873 21.1368 29.9927 21.4073C30.1981 21.6778 30.3018 22.012 30.2855 22.3513Z"
                    fill="#659DF2"
                  />
                  <Path
                    d="M39.3732 32.3293C39.3779 32.5194 39.3192 32.7056 39.2064 32.8586C39.0937 33.0117 38.9332 33.1229 38.7503 33.1747L35.4911 34.3647C35.3912 34.3912 35.2997 34.4431 35.2257 34.5152C35.1516 34.5873 35.0975 34.6773 35.0684 34.7764C34.6902 35.8888 34.3009 36.9009 33.956 37.9688C33.9129 38.167 33.8034 38.3445 33.6456 38.472C33.4878 38.5994 33.2912 38.6693 33.0884 38.6697C32.8797 38.6691 32.6776 38.597 32.5156 38.4655C32.3537 38.3339 32.2417 38.1506 32.1985 37.9465C31.8092 36.8341 31.4198 35.8221 31.0861 34.7653C31.0575 34.6708 31.0059 34.5848 30.9361 34.5149C30.8662 34.4451 30.7802 34.3934 30.6857 34.3647L27.4154 33.1747C27.2285 33.1261 27.0642 33.014 26.9506 32.8578C26.837 32.7016 26.7811 32.511 26.7925 32.3182C26.7885 32.1238 26.8499 31.9336 26.9669 31.7783C27.0839 31.623 27.2497 31.5115 27.4376 31.4617L30.6746 30.2936C30.7739 30.2625 30.8642 30.2078 30.9379 30.1342C31.0115 30.0606 31.0661 29.9701 31.0973 29.8708C31.4755 28.7584 31.8648 27.7463 32.2096 26.6896C32.2485 26.4884 32.3566 26.3072 32.515 26.1772C32.6734 26.0472 32.8723 25.9764 33.0772 25.9776C33.2859 25.9781 33.4881 26.0502 33.65 26.1818C33.812 26.3134 33.9239 26.4966 33.9672 26.7007C34.3565 27.8131 34.7458 28.8252 35.0795 29.8819C35.1032 29.979 35.153 30.0677 35.2236 30.1383C35.2943 30.2089 35.3829 30.2588 35.4799 30.2825C36.5923 30.6718 37.7047 31.0835 38.817 31.4839C38.9885 31.546 39.1353 31.6618 39.2356 31.8142C39.3358 31.9665 39.3841 32.1473 39.3732 32.3293Z"
                    fill="#659DF2"
                  />
                  <Defs>
                    <RadialGradient
                      id="paint0_radial_ai"
                      cx="0"
                      cy="0"
                      r="1"
                      gradientUnits="userSpaceOnUse"
                      gradientTransform="translate(25 25) rotate(90) scale(25)"
                    >
                      <Stop stopColor="white" />
                      <Stop offset="1" stopColor="white" stopOpacity="0.8" />
                    </RadialGradient>
                  </Defs>
                </Svg>
              </View>
              <ThemedText style={styles.shortcutLabel}>New AI Chat</ThemedText>
            </Pressable>

            {/* New Plan Chat */}
            <Pressable style={styles.shortcutItem}>
              <View style={styles.shortcutIconContainer}>
                <Svg width="50" height="50" viewBox="0 0 50 50" fill="none">
                  <Circle cx="25" cy="25" r="24.5" fill="url(#paint0_radial_plan)" stroke="white" />
                  <Path
                    d="M40.6249 10.3966C40.6291 10.8678 40.4843 11.3283 40.2112 11.7118C39.9381 12.0954 39.5509 12.3823 39.105 12.5314L33.6051 14.4272C33.4657 14.4763 33.3214 14.5103 33.1747 14.5284V18.7201C33.1747 19.0592 33.0404 19.3846 32.8014 19.6245C32.5624 19.8645 32.2381 19.9996 31.8998 20C31.5617 19.9991 31.2377 19.8639 30.9988 19.6241C30.7598 19.3842 30.6254 19.0591 30.625 18.7201V12.3953C30.625 12.3604 30.625 12.3272 30.625 12.2923V8.5008C30.625 8.4676 30.625 8.43272 30.625 8.39952C30.63 8.28792 30.6438 8.1769 30.6664 8.06751C30.729 7.75156 30.8584 7.45271 31.0457 7.19104C31.2331 6.92936 31.4741 6.7109 31.7526 6.55036C32.0311 6.38981 32.3407 6.29092 32.6605 6.26025C32.9803 6.22959 33.3029 6.26789 33.6068 6.3726L39.1067 8.26837C39.5511 8.41741 39.9373 8.70347 40.2099 9.08567C40.4826 9.46787 40.6278 9.92667 40.6249 10.3966Z"
                    fill="#659DF2"
                  />
                  <Path
                    d="M10.6596 42.0312C10.3605 38.7664 11.8709 32.3703 20.3048 32.9045C28.7388 33.4388 30.6977 28.3783 30.623 25.7812"
                    stroke="#659DF2"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray="1 1"
                  />
                  <Defs>
                    <RadialGradient
                      id="paint0_radial_plan"
                      cx="0"
                      cy="0"
                      r="1"
                      gradientUnits="userSpaceOnUse"
                      gradientTransform="translate(25 25) rotate(90) scale(25)"
                    >
                      <Stop stopColor="white" />
                      <Stop offset="1" stopColor="white" stopOpacity="0.8" />
                    </RadialGradient>
                  </Defs>
                </Svg>
              </View>
              <ThemedText style={styles.shortcutLabel}>New Plan Chat</ThemedText>
            </Pressable>

            {/* Image Find */}
            <Pressable style={styles.shortcutItem}>
              <View style={styles.shortcutIconContainer}>
                <Svg width="50" height="50" viewBox="0 0 50 50" fill="none">
                  <Circle
                    cx="25"
                    cy="25"
                    r="24.5"
                    fill="url(#paint0_radial_image)"
                    stroke="white"
                  />
                  <Defs>
                    <RadialGradient
                      id="paint0_radial_image"
                      cx="0"
                      cy="0"
                      r="1"
                      gradientUnits="userSpaceOnUse"
                      gradientTransform="translate(25 25) rotate(90) scale(25)"
                    >
                      <Stop stopColor="white" />
                      <Stop offset="1" stopColor="white" stopOpacity="0.8" />
                    </RadialGradient>
                  </Defs>
                </Svg>
                <Svg
                  width="32"
                  height="32"
                  viewBox="0 0 32 32"
                  fill="none"
                  style={{ position: 'absolute', top: 9, left: 9 }}
                >
                  <Path
                    d="M15.625 31.25C24.2544 31.25 31.25 24.2544 31.25 15.625C31.25 6.99555 24.2544 0 15.625 0C6.99555 0 0 6.99555 0 15.625C0 24.2544 6.99555 31.25 15.625 31.25Z"
                    fill="url(#paint0_linear_image)"
                  />
                  <Defs>
                    <LinearGradient
                      id="paint0_linear_image"
                      x1="15.625"
                      y1="0"
                      x2="15.625"
                      y2="31.25"
                      gradientUnits="userSpaceOnUse"
                    >
                      <Stop stopColor="#659DF2" />
                      <Stop offset="1" stopColor="#76C7AD" />
                    </LinearGradient>
                  </Defs>
                </Svg>
                <Svg
                  width="21"
                  height="21"
                  viewBox="0 0 21 21"
                  fill="none"
                  style={{ position: 'absolute', top: 14.5, left: 14.5 }}
                >
                  <Path
                    d="M12.3311 0.255859L12.3301 0.256836C13.7465 0.256898 14.7818 1.34299 14.9365 2.80859H14.9541C15.4493 2.80859 15.9665 2.80836 16.4844 2.82715H16.4863C17.2169 2.85985 17.901 3.2085 18.3955 3.78809C18.8887 4.36627 19.1563 5.13042 19.1484 5.91797V7.71191C19.1484 7.97564 19.055 8.23399 18.8809 8.42773C18.7059 8.62227 18.4622 8.7373 18.2021 8.7373C17.9423 8.73724 17.6993 8.62206 17.5244 8.42773C17.3503 8.23397 17.2559 7.97561 17.2559 7.71191V5.92188C17.2636 5.64637 17.173 5.38213 17.0098 5.1875C16.8472 4.99373 16.628 4.88635 16.4033 4.87695L16.4014 4.87598C15.9332 4.85314 15.4413 4.85627 14.9639 4.85938H14.1973L14.1836 4.8584C13.8694 4.82473 13.5839 4.66264 13.3799 4.41309C13.1763 4.16405 13.0667 3.84371 13.0664 3.51562V3.18652C13.0663 2.89325 12.9811 2.67576 12.8564 2.53516C12.7495 2.41472 12.5999 2.33534 12.4082 2.31641L12.3232 2.31152C10.5857 2.30378 8.82407 2.30378 7.08789 2.31152H7.08691C6.85435 2.31157 6.67818 2.39583 6.55664 2.5332C6.43218 2.67406 6.34681 2.89209 6.34375 3.18457V3.51855L6.33887 3.64746C6.31273 3.94818 6.19345 4.23462 5.99609 4.45703C5.76989 4.71183 5.45672 4.86298 5.12207 4.86719H4.70117C4.17503 4.86719 3.67513 4.86775 3.16406 4.8584L3.15332 4.85742C3.02865 4.84943 2.90267 4.8703 2.78418 4.91992C2.66555 4.96962 2.55536 5.04799 2.46191 5.15039C2.36075 5.26365 2.28015 5.40001 2.22559 5.55176C2.18441 5.66638 2.15895 5.78779 2.15039 5.91113L2.14746 6.03516V6.03809C2.1614 7.97032 2.15862 9.93056 2.15723 11.8271V14.4619C2.15729 14.8685 2.26513 15.1615 2.43359 15.3496C2.59891 15.5341 2.84809 15.6464 3.19238 15.6465H9.76562C10.0258 15.6465 10.2694 15.7624 10.4443 15.957C10.6182 16.1507 10.7119 16.4084 10.7119 16.6719C10.7118 16.9354 10.6184 17.193 10.4443 17.3867C10.2694 17.5814 10.0257 17.6963 9.76562 17.6963H9.5791L9.5752 17.6826H3.18848C2.33147 17.6826 1.59378 17.3467 1.07227 16.7656C0.552552 16.1865 0.259766 15.3779 0.259766 14.4473V11.8135C0.259766 9.92112 0.259746 7.96548 0.25 6.04297L0.250977 6.04199C0.247299 5.61038 0.320432 5.18192 0.467773 4.78125C0.615415 4.37989 0.833877 4.01288 1.1123 3.7041L1.11426 3.70312C1.38854 3.40472 1.71611 3.16933 2.07812 3.01465C2.44028 2.85994 2.82849 2.78889 3.21777 2.80664H3.2168C3.62676 2.8197 4.04155 2.81873 4.4707 2.81543C4.62159 1.34748 5.65821 0.262659 7.07715 0.255859C8.819 0.248107 10.5878 0.248107 12.3311 0.255859Z"
                    fill="white"
                    stroke="white"
                    strokeWidth="0.5"
                  />
                  <Path
                    d="M13.937 9.23828C14.144 9.21849 14.3537 9.24297 14.5503 9.31055L19.3306 10.9541L19.3345 10.9551C19.6208 11.0509 19.8697 11.2349 20.0454 11.4805C20.2211 11.7261 20.3149 12.0213 20.313 12.3232V12.3301C20.3157 12.6329 20.2223 12.9293 20.0464 13.1758C19.8705 13.4222 19.6207 13.6063 19.3335 13.7021L19.3286 13.7041L14.5483 15.3477L14.5454 15.3486C14.4582 15.3793 14.3677 15.4008 14.2759 15.4121L13.8364 15.4658V19.542C13.8363 19.7034 13.7727 19.8585 13.6587 19.9727C13.5448 20.0866 13.3901 20.1499 13.229 20.1504C13.0677 20.1497 12.9133 20.0858 12.7993 19.9717C12.7137 19.8859 12.6558 19.7774 12.6323 19.6602L12.6206 19.541V10.6016C12.6243 10.5366 12.6328 10.4719 12.646 10.4082L12.647 10.4043C12.6875 10.2006 12.771 10.0077 12.8921 9.83887C13.0133 9.66998 13.1699 9.52938 13.3501 9.42578C13.5302 9.32225 13.7302 9.25812 13.937 9.23828Z"
                    fill="white"
                    stroke="white"
                  />
                  <Path
                    d="M8.97021 5.8252C9.58037 5.66117 10.2214 5.64703 10.8384 5.7832C11.4553 5.91941 12.0308 6.20184 12.5151 6.60742C12.7123 6.77247 12.8361 7.00951 12.8589 7.26562C12.8816 7.52179 12.8013 7.77641 12.6362 7.97363C12.4712 8.17072 12.235 8.29457 11.979 8.31738C11.7229 8.34011 11.4682 8.25972 11.271 8.09473C11.0257 7.88988 10.7344 7.74736 10.4224 7.67871C10.1102 7.6101 9.7857 7.61804 9.47705 7.70117C9.16834 7.78435 8.88347 7.94002 8.64795 8.15625C8.41244 8.37248 8.23273 8.64287 8.12354 8.94336C8.01443 9.24371 7.9793 9.56598 8.021 9.88281C8.06276 10.1998 8.18048 10.5027 8.36377 10.7646C8.54695 11.0263 8.79057 11.2399 9.07373 11.3877C9.3572 11.5355 9.67294 11.6129 9.99268 11.6133H9.9917C10.2487 11.6133 10.4955 11.7158 10.6772 11.8975C10.859 12.0792 10.9614 12.3259 10.9614 12.583C10.9614 12.8401 10.8591 13.0867 10.6772 13.2686C10.4958 13.45 10.2501 13.5513 9.99365 13.5518V13.5527H9.9917V13.5518C9.36039 13.5518 8.7384 13.4005 8.17822 13.1094C7.61773 12.818 7.13569 12.3961 6.77295 11.8789C6.41019 11.3616 6.17719 10.7641 6.09424 10.1377C6.01133 9.51136 6.08079 8.87416 6.29639 8.28027C6.51208 7.6863 6.86793 7.15287 7.3335 6.72559C7.79895 6.29843 8.36014 5.98927 8.97021 5.8252Z"
                    fill="white"
                    stroke="white"
                    strokeWidth="0.5"
                  />
                </Svg>
              </View>
              <ThemedText style={styles.shortcutLabel}>Image Find</ThemedText>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Chat Type Tabs */}
      <View style={styles.chatTypeTabs}>
        <Pressable
          style={[styles.chatTypeTab, tab === 'ai' && styles.chatTypeTabActive]}
          onPress={() => setTab('ai')}
        >
          <ThemedText style={styles.chatTypeTabText}>AI Chat</ThemedText>
        </Pressable>
        <Pressable
          style={[styles.chatTypeTab, tab === 'plus' && styles.chatTypeTabActive]}
          onPress={() => setTab('plus')}
        >
          <ThemedText style={styles.chatTypeTabText}>AI PLUS Chat</ThemedText>
        </Pressable>
        <Pressable
          style={[styles.chatTypeTab, tab === 'plan' && styles.chatTypeTabActive]}
          onPress={() => setTab('plan')}
        >
          <ThemedText style={styles.chatTypeTabText}>Plan Chat</ThemedText>
        </Pressable>
      </View>
      {/* Chat List Section */}
      <View style={styles.chatListSection}>
        {/* Chat List Title */}
        <View style={styles.chatListHeader}>
          <ThemedText style={styles.chatListTitle}>Chat List</ThemedText>
        </View>

        {/* Chat list */}
        {!isAuthenticated ? (
          <View style={styles.emptyContainer}>
            <ThemedText style={styles.emptyText}>로그인이 필요합니다.</ThemedText>
          </View>
        ) : error ? (
          <View style={styles.emptyContainer}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
            <Pressable onPress={loadChats} style={styles.retryButton}>
              <ThemedText style={styles.retryText}>다시 시도</ThemedText>
            </Pressable>
          </View>
        ) : isLoading && !refreshing ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color="#5B7DFF" />
          </View>
        ) : getData().length === 0 ? (
          <View style={styles.emptyContainer}>
            <ThemedText style={styles.emptyText}>채팅 내역이 없습니다.</ThemedText>
          </View>
        ) : (
          <FlatList
            data={getData()}
            keyExtractor={(item) => item.session_id}
            renderItem={renderItem}
            style={{ width: '100%' }}
            contentContainerStyle={{ paddingBottom: 30, paddingHorizontal: 20 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          />
        )}
      </View>
      {/* Route Results Modal */}
      <Modal
        visible={showRouteResults}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => {
          setShowRouteResults(false);
        }}
      >
        {routeQuests.length > 0 ? (
          <RouteResultList
            places={routeQuests}
            onPressPlace={(quest) => {
              setShowRouteResults(false);
              router.push({
                pathname: '/(app)/(tabs)/map/quest-detail',
                params: { quest: JSON.stringify(quest) },
              });
            }}
            onClose={() => {
              setShowRouteResults(false);
            }}
            onStartNavigation={() => {
              if (routeQuests.length > 0) {
                setShowRouteResults(false);
                router.push({
                  pathname: '/(app)/(tabs)/map/quest-detail',
                  params: { quest: JSON.stringify(routeQuests[0]) },
                });
              }
            }}
          />
        ) : (
          <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ThemedText>Loading data...</ThemedText>
          </ThemedView>
        )}
      </Modal>

      {/* Chat Detail Modal */}
      {selectedSession && (
        <Modal
          visible={showDetailModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowDetailModal(false)}
        >
          <ThemedView style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderContent}>
                <ThemedText type="subtitle" style={styles.modalTitle}>
                  {selectedSession.title || 'Chat History'}
                </ThemedText>
                <ThemedText style={styles.modalSubtitle}>
                  {selectedSession.chats?.length || 0} messages
                </ThemedText>
              </View>
              <Pressable onPress={() => setShowDetailModal(false)} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color="#fff" />
              </Pressable>
            </View>

            {/* Chat Messages - 타입별 렌더링 */}
            <ScrollView
              style={styles.modalContent}
              contentContainerStyle={styles.chatMessagesContainer}
            >
              {selectedSession.chats && selectedSession.chats.length > 0 ? (
                selectedSession.chats.map((chat) =>
                  renderChatMessage(chat, selectedSession.function_type || 'rag_chat'),
                )
              ) : (
                <View style={styles.emptyContainer}>
                  <ThemedText style={styles.emptyText}>채팅 내역이 없습니다.</ThemedText>
                </View>
              )}
            </ScrollView>
          </ThemedView>
        </Modal>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 0,
    paddingHorizontal: 0,
    backgroundColor: '#34495E',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    height: 244,
    width: '100%',
    backgroundColor: '#34495E',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  backButton: {
    width: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modeToggleButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  shortcutsSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  shortcutsTitle: {
    color: 'rgba(255, 255, 255, 0.50)',
    fontFamily: 'Pretendard',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: -0.16,
    marginBottom: 16,
  },
  shortcutsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shortcutItem: {
    alignItems: 'center',
    gap: 8,
  },
  shortcutIconContainer: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  shortcutLabel: {
    color: '#FFF',
    textAlign: 'center',
    fontFamily: 'Pretendard',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: -0.16,
  },
  modeButton: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 42,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  modeButtonText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'right',
    lineHeight: 16,
    letterSpacing: -0.12,
  },
  modeButtonTextActive: {
    color: '#659DF2',
  },
  modeBadge: {
    backgroundColor: '#3E4A63',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    fontSize: 12,
    color: '#fff',
  },
  chatTypeTabs: {
    flexDirection: 'row',
    backgroundColor: '#1B2630',
    width: '100%',
  },
  chatTypeTab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1B2630',
  },
  chatTypeTabActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#659DF2',
    backgroundColor: '#1B2630',
  },
  chatTypeTabText: {
    color: '#FFF',
    textAlign: 'center',
    fontFamily: 'Pretendard',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: -0.16,
  },
  chatListSection: {
    flex: 1,
    backgroundColor: '#34495E',
  },
  chatListHeader: {
    backgroundColor: '#34495E',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  chatListTitle: {
    color: 'rgba(255, 255, 255, 0.50)',
    fontFamily: 'Pretendard',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: -0.16,
  },
  chatListItem: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    gap: 5,
    marginBottom: 10,
  },
  chatCardLeft: {
    flexDirection: 'row',
    height: 70,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 10,
    flex: 1,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
    backgroundColor: '#222D39',
  },
  chatCardTextColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  chatCardTitle: {
    color: '#FFF',
    fontFamily: 'Pretendard',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: -0.16,
  },
  chatCardTime: {
    color: 'rgba(255, 255, 255, 0.50)',
    fontFamily: 'Pretendard',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: -0.16,
  },
  chatCardTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatCardTimeSeparator: {
    color: 'rgba(255, 255, 255, 0.50)',
    fontFamily: 'Pretendard',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: -0.16,
  },
  chatCardLandmark: {
    color: '#659DF2',
    fontFamily: 'Pretendard',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: -0.16,
    flex: 1,
  },
  planInfoText: {
    color: '#FFF',
    fontFamily: 'Pretendard',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: -0.16,
  },
  deleteButton: {
    width: 35,
    height: 70,
    paddingHorizontal: 3,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    backgroundColor: '#659DF2',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#A5B4CC',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#5B7DFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#2F3F5B',
  },
  modalHeaderContent: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#0F1A2A',
  },
  modalContentInner: {
    padding: 20,
    gap: 20,
  },
  messageGroup: {
    gap: 12,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  userBubble: {
    backgroundColor: '#5B7DFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    maxWidth: '80%',
  },
  userMessageText: {
    color: '#fff',
    fontSize: 15,
  },
  aiMessageContainer: {
    alignItems: 'flex-start',
  },
  aiBubble: {
    backgroundColor: '#2F3F5B',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    maxWidth: '80%',
  },
  aiMessageText: {
    color: '#fff',
    fontSize: 15,
  },
  // Quest Chat 스타일 추가
  chatMessagesContainer: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    gap: 10,
  },
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#C1C9D9',
  },
  assistantMessageText: {
    color: '#1F2937',
    fontSize: 15,
  },
  bubbleImage: {
    width: 180,
    height: 180,
    borderRadius: 12,
    marginTop: 6,
  },
  planBubble: {
    backgroundColor: '#1E2A3B',
    padding: 18,
    borderRadius: 14,
    marginBottom: 16,
    alignSelf: 'stretch',
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  planMeta: {
    fontSize: 13,
    color: '#A5B4CC',
    marginBottom: 4,
  },
  planMessage: {
    marginTop: 12,
    color: '#fff',
    fontSize: 15,
  },
  planButton: {
    marginTop: 14,
    backgroundColor: '#5B7DFF',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  planButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  planButtonDisabled: {
    backgroundColor: '#3E4A63',
    opacity: 0.6,
  },
  planButtonTextDisabled: {
    color: '#94A3B8',
  },
  planMessageTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
  },
});

import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Defs, LinearGradient as SvgLinearGradient, Path, Stop } from "react-native-svg";
import { useQuestStore } from "@/store/useQuestStore";
import { router } from "expo-router";
import * as Location from "expo-location";
import { mapApi } from "@/services/api";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const HEADER_HEIGHT = 50;
const MIN_HEIGHT = 307; // 초기 모달 높이
const MAX_HEIGHT = SCREEN_HEIGHT - HEADER_HEIGHT; // 헤더 바로 아래까지

interface Quest {
  id: number;
  place_id: string | null;
  name: string;
  title: string | null;
  description: string;
  category: string | null;
  latitude: number;
  longitude: number;
  reward_point: number;
  points: number;
  difficulty: "easy" | "medium" | "hard";
  is_active: boolean;
  completion_count: number;
  created_at: string;
  district?: string;
  place_image_url?: string;
  distance_km?: number;
}

interface QuestMiniModalProps {
  quest: Quest;
  onClose: () => void;
}

export default function QuestMiniModal({
  quest,
  onClose,
}: QuestMiniModalProps) {
  // Zustand store
  const { addQuest, isQuestSelected } = useQuestStore();
  const isSelected = isQuestSelected(quest.id);

  // 모달의 높이를 애니메이션
  const modalHeight = useRef(new Animated.Value(MIN_HEIGHT)).current;
  const currentHeight = useRef(MIN_HEIGHT);
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollOffsetY = useRef(0);
  const [calculatedDistance, setCalculatedDistance] = useState<number | null>(null);

  // Calculate distance if not provided
  useEffect(() => {
    if (quest.distance_km !== undefined && quest.distance_km !== null && quest.distance_km > 0) {
      setCalculatedDistance(quest.distance_km);
      return;
    }

    if (!quest.latitude || !quest.longitude) {
      return;
    }

    const calculateDistance = async () => {
      try {
        const distance = mapApi.calculateDistance(
          37.5665,
          126.9780,
          quest.latitude,
          quest.longitude
        );
        setCalculatedDistance(distance);
      } catch (error) {
        // Ignore
      }
    };

    calculateDistance();
  }, [quest]);

  const displayDistance = (quest.distance_km && quest.distance_km > 0) ? quest.distance_km : calculatedDistance;

  const handleAddQuest = () => {
    addQuest(quest);
  };

  useEffect(() => {
    // 모달이 마운트되면 초기 높이로 애니메이션
    Animated.spring(modalHeight, {
      toValue: MIN_HEIGHT,
      useNativeDriver: false, // height는 native driver 사용 불가
      tension: 50,
      friction: 8,
    }).start(() => {
      currentHeight.current = MIN_HEIGHT;
    });
  }, [modalHeight]);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      // 확장된 상태에서는 스크롤이 맨 위에 있고 아래로 드래그할 때만 모달 드래그 허용
      if (isExpanded) {
        const isDraggingDown = gestureState.dy > 0;
        const isAtTop = scrollOffsetY.current <= 0;
        return isDraggingDown && isAtTop;
      }
      return true;
    },
    onPanResponderMove: (_, gestureState) => {
      // dy가 음수면 위로 드래그, 양수면 아래로 드래그
      const newHeight = currentHeight.current - gestureState.dy;

      // MIN_HEIGHT와 MAX_HEIGHT 사이로 제한
      if (newHeight >= MIN_HEIGHT && newHeight <= MAX_HEIGHT) {
        modalHeight.setValue(newHeight);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      const newHeight = currentHeight.current - gestureState.dy;
      const velocity = -gestureState.vy; // 음수를 양수로 변환 (위로 = 양수)
      const midPoint = (MIN_HEIGHT + MAX_HEIGHT) / 2;

      // 빠르게 아래로 스와이프하면 닫기
      if (velocity < -0.5 && newHeight < MIN_HEIGHT + 100) {
        handleClose();
        return;
      }

      // 최대 높이의 70% 이상이거나 빠른 위로 스와이프면 전체 페이지로 전환
      const FULL_PAGE_THRESHOLD = MAX_HEIGHT * 0.7;
      if (newHeight > FULL_PAGE_THRESHOLD || (velocity > 1.5 && newHeight > midPoint)) {
        // 전체 페이지로 네비게이트
        onClose();
        router.push({
          pathname: "/(tabs)/map/quest-detail",
          params: {
            quest: JSON.stringify(quest),
          },
        });
        return;
      }

      // 스냅 포인트 결정
      let targetHeight: number;

      if (newHeight > midPoint) {
        targetHeight = MAX_HEIGHT; // 최대로 확장
        setIsExpanded(true);
      } else {
        targetHeight = MIN_HEIGHT; // 최소로 축소
        setIsExpanded(false);
      }

      Animated.spring(modalHeight, {
        toValue: targetHeight,
        useNativeDriver: false,
        tension: 50,
        friction: 8,
      }).start(() => {
        currentHeight.current = targetHeight;
        // 확장될 때 스크롤 위치 초기화
        if (targetHeight === MAX_HEIGHT) {
          scrollOffsetY.current = 0;
          scrollViewRef.current?.scrollTo({ y: 0, animated: false });
        }
      });
    },
  });

  const handleClose = () => {
    Animated.timing(modalHeight, {
      toValue: 0,
      duration: 250,
      useNativeDriver: false,
    }).start(() => {
      onClose();
    });
  };

  return (
    <>
      {/* 배경 오버레이 (클릭시 닫기) */}
      <Pressable style={styles.backdrop} onPress={handleClose} />

      {/* 모달 */}
      <Animated.View
        style={[styles.container, { height: modalHeight }]}
        {...panResponder.panHandlers}
      >
        {/* 드래그 핸들 */}
        <View style={styles.handleBar} />

        {isExpanded ? (
          // 확장된 상태: 이미지 상단 꽉 차게
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            onScroll={(e) => {
              scrollOffsetY.current = e.nativeEvent.contentOffset.y;
            }}
            scrollEventThrottle={16}
          >
            <Image
              source={{
                uri: quest.place_image_url || "https://picsum.photos/300/300",
              }}
              style={styles.expandedImage}
            />
            <View style={styles.expandedContent}>
              {/* 제목과 버튼을 가로로 배치 */}
              <View style={styles.expandedTitleRow}>
                <Text style={styles.expandedTitle}>
                  {quest.category || "Quest"}
                </Text>
                <Pressable style={styles.expandedRelatedBtn}>
                  <Text style={styles.expandedRelatedBtnText}>
                    See Related Places
                  </Text>
                </Pressable>
              </View>
              <View style={styles.expandedNameAddressGroup}>
                <Text style={styles.expandedName}>{quest.name}</Text>
                <Text style={styles.expandedAddress}>
                  {quest.district || "Seoul"}
                </Text>
              </View>
              <View style={styles.expandedButtonRow}>
                <View style={styles.expandedButton}>
                  <View style={styles.expandedButtonDistanceBadge}>
                    <Svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <Path
                        d="M9.49609 0.501953C9.4967 0.511802 9.50014 0.523321 9.5 0.537109C9.49887 0.64138 9.4678 0.808104 9.38184 1.04883L5.61035 9.19434L5.60156 9.21387L5.59375 9.2334C5.56315 9.31782 5.50604 9.38903 5.43262 9.43652C5.35932 9.48388 5.27333 9.50595 5.1875 9.49902C5.1016 9.49207 5.01943 9.45648 4.9541 9.39746C4.88881 9.33843 4.84406 9.25842 4.82715 9.16992V9.16895L4.79199 9.01465C4.59556 8.24175 4.04883 7.43937 3.41504 6.80273C2.7393 6.12398 1.87207 5.54092 1.04492 5.38672L0.828125 5.34375L0.824219 5.34277L0.761719 5.32617C0.701821 5.30413 0.647322 5.2667 0.603516 5.21777C0.545136 5.15242 0.508439 5.06864 0.500977 4.97949C0.493596 4.89034 0.515442 4.8013 0.5625 4.72656C0.609571 4.65182 0.679301 4.59552 0.759766 4.56543L0.78125 4.55762L0.801758 4.54785L8.95898 0.625C9.19511 0.535375 9.35976 0.503188 9.46289 0.5C9.47568 0.499607 9.48672 0.501617 9.49609 0.501953Z"
                        fill="#659DF2"
                        stroke="#F5F5F5"
                      />
                    </Svg>
                    <Text style={styles.expandedButtonDistanceText}>
                      {displayDistance !== null && displayDistance !== undefined
                        ? `${displayDistance.toFixed(1)}km`
                        : "Calculating..."}
                    </Text>
                  </View>
                  <Text style={styles.expandedButtonSubText}>
                    {displayDistance !== null && displayDistance !== undefined
                      ? `${displayDistance.toFixed(1)}km far from your place`
                      : "Getting your location..."}
                  </Text>
                </View>
                <View style={styles.expandedButtonRight}>
                  <View style={styles.expandedButtonMintBadge}>
                    <Svg width="16" height="10" viewBox="0 0 16 10" fill="none">
                      <Path
                        d="M7.97656 0.5C8.66625 0.505346 9.34579 0.688996 9.95508 1.03613C10.5644 1.38334 11.0863 1.88423 11.4727 2.49707L11.8076 3.02832L12.25 2.58301C12.4078 2.42426 12.5942 2.30362 12.7959 2.22754L12.8047 2.22461L13.7578 1.84473C14.1608 1.68634 14.5665 1.6956 14.874 1.81055C15.1809 1.92526 15.3604 2.12924 15.4121 2.3584L15.4814 2.6709V2.67188C15.5433 2.94777 15.4221 3.28911 15.0869 3.56152L14.5449 4.00098L15.1367 4.37207C15.2406 4.43732 15.3299 4.53127 15.3945 4.64648C15.443 4.73304 15.476 4.82923 15.4912 4.92969L15.5 5.03125V5.33789C15.5 5.58665 15.3625 5.83372 15.0674 6.02734L14.4883 6.40723L15.0303 6.83789C15.4195 7.14688 15.5503 7.53718 15.4688 7.83594L15.3818 8.13477L15.3809 8.13965C15.3167 8.37087 15.1173 8.5688 14.7861 8.66113C14.4546 8.75345 14.0298 8.72287 13.6309 8.5166H13.6299L12.71 8.04199L12.707 8.04102C12.5122 7.94195 12.3377 7.79878 12.1973 7.61914L11.7764 7.0791L11.3906 7.64453C11.2577 7.8391 11.1098 8.02158 10.9482 8.18945L10.9453 8.19141C10.5132 8.64672 9.99469 8.9976 9.42578 9.2207C8.85712 9.44368 8.25031 9.53447 7.64648 9.48828C7.04246 9.44203 6.45323 9.25922 5.91992 8.95117C5.38666 8.64311 4.92044 8.21673 4.55469 7.69922L4.18359 7.17383L3.76562 7.66309C3.63164 7.82006 3.47111 7.9469 3.29395 8.03711L3.29199 8.03809L2.37207 8.51172H2.37109C1.97187 8.71816 1.54829 8.74853 1.21777 8.65625C0.888053 8.56416 0.686747 8.36684 0.620117 8.13281L0.619141 8.12988L0.533203 7.83398C0.454976 7.53756 0.584715 7.14438 0.974609 6.83008L1.50879 6.39941L0.93457 6.02344C0.640255 5.83044 0.502024 5.57912 0.501953 5.33398V5.03027C0.505997 4.89354 0.542223 4.76088 0.606445 4.64551C0.670593 4.53039 0.759897 4.43663 0.863281 4.37109L1.44727 4.00098L0.912109 3.5625C0.577499 3.28772 0.454259 2.9457 0.515625 2.67188V2.6709L0.584961 2.35645C0.63714 2.12824 0.817559 1.92506 1.12402 1.81055C1.43186 1.69559 1.83729 1.68655 2.23926 1.84473V1.8457L3.19434 2.22461L3.19824 2.22559C3.37976 2.29627 3.54914 2.40209 3.69727 2.53809L4.13184 2.9375L4.4541 2.44238C4.84885 1.83571 5.3772 1.34256 5.99121 1.00488C6.60505 0.667345 7.28698 0.494722 7.97656 0.5Z"
                        fill="#76C7AD"
                        stroke="white"
                      />
                    </Svg>
                    <Text style={styles.expandedButtonMintText}>
                      {quest.points}
                    </Text>
                  </View>
                  <Text style={styles.expandedButtonRightSubText}>
                    {quest.points} is on this Quest
                  </Text>
                </View>
              </View>
              <Pressable style={styles.navigationButton}>
                <Svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  style={styles.navigationIcon}
                >
                  <Path
                    d="M1.17067 8.19432L17.5251 0.331377C19.7029 -0.508163 20.4942 0.263125 19.6961 2.46777L12.1277 18.808C11.9926 19.1808 11.7402 19.4987 11.409 19.7129C11.0779 19.9271 10.6862 20.0259 10.2942 19.9942C9.90209 19.9624 9.53116 19.8019 9.2381 19.5371C8.94503 19.2723 8.74604 18.9179 8.67155 18.5282C8.14399 15.798 4.65398 12.2692 1.90796 11.7573L1.46154 11.6686C1.0762 11.5955 0.725202 11.397 0.462362 11.1034C0.199522 10.8098 0.0393695 10.4374 0.00636494 10.0431C-0.0266396 9.64883 0.06934 9.25454 0.279649 8.92061C0.489959 8.58669 0.802935 8.33154 1.17067 8.19432Z"
                    fill="white"
                  />
                </Svg>
                <Text style={styles.navigationText}>
                  Do you need navigation?
                </Text>
                <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <Path
                    d="M9.39421 16.9279C9.31903 17.0075 9.26025 17.1011 9.22124 17.2034C9.18223 17.3056 9.16374 17.4146 9.16683 17.524C9.16993 17.6334 9.19455 17.7412 9.23928 17.8411C9.28401 17.941 9.34798 18.0311 9.42754 18.1063C9.5071 18.1815 9.60069 18.2402 9.70296 18.2792C9.80524 18.3183 9.91419 18.3367 10.0236 18.3337C10.133 18.3306 10.2408 18.3059 10.3407 18.2612C10.4406 18.2165 10.5307 18.1525 10.6059 18.0729L17.6892 10.5729C17.8355 10.4182 17.917 10.2134 17.917 10.0004C17.917 9.78752 17.8355 9.58267 17.6892 9.42795L10.6059 1.92711C10.5312 1.84581 10.4411 1.78016 10.3408 1.73397C10.2405 1.68779 10.1321 1.66198 10.0218 1.65806C9.91144 1.65414 9.80143 1.67219 9.69814 1.71114C9.59484 1.75009 9.50031 1.80918 9.42004 1.88498C9.33978 1.96078 9.27537 2.05176 9.23057 2.15266C9.18576 2.25356 9.16145 2.36235 9.15905 2.47273C9.15664 2.5831 9.17619 2.69285 9.21656 2.7956C9.25693 2.89835 9.31732 2.99206 9.39421 3.07128L15.9375 10.0004L9.39421 16.9279Z"
                    fill="white"
                  />
                </Svg>
              </Pressable>
              <Text style={styles.overviewTitle}>OverView</Text>
              <Text style={styles.overviewDescription}>
                {quest.description}
              </Text>
              <View style={styles.dividerLine} />
              <View style={styles.aiDocentRow}>
                <View style={styles.aiDocentIconContainer}>
                  <Svg width="45" height="45" viewBox="0 0 53 53" fill="none">
                    <Defs>
                      <SvgLinearGradient
                        id="aiDocentGradient"
                        x1={4}
                        y1={0}
                        x2={49}
                        y2={45}
                        gradientUnits="userSpaceOnUse"
                      >
                        <Stop stopColor="#659DF2" />
                        <Stop offset="1" stopColor="#76C7AD" />
                      </SvgLinearGradient>
                    </Defs>
                    <Path
                      d="M44 0C46.7613 0.000171843 49 2.23868 49 5V40C48.9998 42.7611 46.7611 44.9998 44 45H27.5332C27.5996 44.6929 27.6808 44.3902 27.7871 44.1025C29.0112 42.0261 36.3795 41.424 36.3799 37.8984C36.3826 37.4247 36.3369 36.9514 36.2432 36.4883C35.811 34.3404 34.3653 33.2984 33.2471 32.7803C33.1412 32.7311 33.0388 32.686 32.9404 32.6475C32.6092 32.5146 32.325 32.4244 32.127 32.3633C31.97 32.3186 31.8079 32.2985 31.6455 32.3027C30.516 32.3027 28.6213 33.0176 26.9912 33.0322C25.3613 33.0176 23.4674 32.3028 22.3379 32.3027C22.1754 32.2992 22.0127 32.3192 21.8555 32.3633C21.6413 32.4297 21.3248 32.5285 20.96 32.6826L20.8682 32.7227C19.7362 33.2195 18.1955 34.249 17.7285 36.4795C17.6332 36.9454 17.5862 37.4215 17.5889 37.8984C17.5893 41.424 24.9625 42.0261 26.1816 44.1025C26.2889 44.3902 26.3714 44.6928 26.4385 45H9C6.23872 45 4.00022 42.7612 4 40V5C4 2.23858 6.23858 8.08481e-08 9 0H44ZM22.7988 2.56152C22.5262 1.81322 21.4679 1.81322 21.1953 2.56152L19.959 5.96191L16.5586 7.19824C15.8103 7.47082 15.8103 8.52918 16.5586 8.80176L19.959 10.0381L21.1953 13.4385C21.4679 14.1868 22.5262 14.1868 22.7988 13.4385L24.0352 10.0381L27.4355 8.80176C28.1839 8.52918 28.1839 7.47082 27.4355 7.19824L24.0352 5.96191L22.7988 2.56152ZM31.4033 8.28027C31.267 7.90637 30.7389 7.90638 30.6025 8.28027L29.9834 9.98047L28.2832 10.5986C27.9093 10.735 27.9094 11.2639 28.2832 11.4004L29.9834 12.0186L30.6025 13.7188C30.7388 14.0929 31.267 14.0929 31.4033 13.7188L32.0225 12.0186L33.7227 11.4004C34.0964 11.2639 34.0965 10.735 33.7227 10.5986L32.0225 9.98047L31.4033 8.28027Z"
                      fill="url(#aiDocentGradient)"
                    />
                  </Svg>
                </View>
                <Text style={styles.aiDocentTitle}>
                  AI Docent{"\n"}Recommendations
                </Text>
              </View>
            </View>
          </ScrollView>
        ) : (
          // 축소된 상태: 기존 가로 레이아웃
          <View style={styles.contentWrapper}>
            {/* 왼쪽 이미지 카드 */}
            <View style={styles.imageCardContainer}>
              <Image
                source={{
                  uri: quest.place_image_url || "https://picsum.photos/300/300",
                }}
                style={styles.image}
              />
              {/* Category text - top left (no background badge) */}
              <Text style={styles.placeCategoryText}>
                {quest.category || "Quest"}
              </Text>

              {/* Plus button - top right */}
              <Pressable style={styles.plusButton} onPress={handleAddQuest}>
                <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <Path
                    d="M14.8571 9.14286H9.14286V14.8571C9.14286 15.1602 9.02245 15.4509 8.80812 15.6653C8.59379 15.8796 8.30311 16 8 16C7.6969 16 7.40621 15.8796 7.19188 15.6653C6.97755 15.4509 6.85714 15.1602 6.85714 14.8571V9.14286H1.14286C0.839753 9.14286 0.549063 9.02245 0.334735 8.80812C0.120408 8.59379 0 8.30311 0 8C0 7.6969 0.120408 7.40621 0.334735 7.19188C0.549063 6.97755 0.839753 6.85714 1.14286 6.85714H6.85714V1.14286C6.85714 0.839753 6.97755 0.549062 7.19188 0.334735C7.40621 0.120407 7.6969 0 8 0C8.30311 0 8.59379 0.120407 8.80812 0.334735C9.02245 0.549062 9.14286 0.839753 9.14286 1.14286V6.85714H14.8571C15.1602 6.85714 15.4509 6.97755 15.6653 7.19188C15.8796 7.40621 16 7.6969 16 8C16 8.30311 15.8796 8.59379 15.6653 8.80812C15.4509 9.02245 15.1602 9.14286 14.8571 9.14286Z"
                    fill="white"
                  />
                </Svg>
              </Pressable>

              {/* Distance badge - bottom left */}
              <View style={styles.distanceBadge}>
                <Svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <Path
                    d="M9.49609 0.501953C9.4967 0.511802 9.50014 0.523321 9.5 0.537109C9.49887 0.64138 9.4678 0.808104 9.38184 1.04883L5.61035 9.19434L5.60156 9.21387L5.59375 9.2334C5.56315 9.31782 5.50604 9.38903 5.43262 9.43652C5.35932 9.48388 5.27333 9.50595 5.1875 9.49902C5.1016 9.49207 5.01943 9.45648 4.9541 9.39746C4.88881 9.33843 4.84406 9.25842 4.82715 9.16992V9.16895L4.79199 9.01465C4.59556 8.24175 4.04883 7.43937 3.41504 6.80273C2.7393 6.12398 1.87207 5.54092 1.04492 5.38672L0.828125 5.34375L0.824219 5.34277L0.761719 5.32617C0.701821 5.30413 0.647322 5.2667 0.603516 5.21777C0.545136 5.15242 0.508439 5.06864 0.500977 4.97949C0.493596 4.89034 0.515442 4.8013 0.5625 4.72656C0.609571 4.65182 0.679301 4.59552 0.759766 4.56543L0.78125 4.55762L0.801758 4.54785L8.95898 0.625C9.19511 0.535375 9.35976 0.503188 9.46289 0.5C9.47568 0.499607 9.48672 0.501617 9.49609 0.501953Z"
                    stroke="#F5F5F5"
                  />
                </Svg>
                <Text style={styles.distanceText}>
                  {displayDistance !== null && displayDistance !== undefined
                    ? `${displayDistance.toFixed(1)}km`
                    : "..."}
                </Text>
              </View>

              {/* Mint badge - bottom right */}
              <LinearGradient
                colors={["#76C7AD", "#3A6154"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.mintBadge}
              >
                <Svg width="16" height="10" viewBox="0 0 16 10" fill="none">
                  <Path
                    d="M7.97656 0.5C8.66625 0.505346 9.34579 0.688996 9.95508 1.03613C10.5644 1.38334 11.0863 1.88423 11.4727 2.49707L11.8076 3.02832L12.25 2.58301C12.4078 2.42426 12.5942 2.30362 12.7959 2.22754L12.8047 2.22461L13.7578 1.84473C14.1608 1.68634 14.5665 1.6956 14.874 1.81055C15.1809 1.92526 15.3604 2.12924 15.4121 2.3584L15.4814 2.6709V2.67188C15.5433 2.94777 15.4221 3.28911 15.0869 3.56152L14.5449 4.00098L15.1367 4.37207C15.2406 4.43732 15.3299 4.53127 15.3945 4.64648C15.443 4.73304 15.476 4.82923 15.4912 4.92969L15.5 5.03125V5.33789C15.5 5.58665 15.3625 5.83372 15.0674 6.02734L14.4883 6.40723L15.0303 6.83789C15.4195 7.14688 15.5503 7.53718 15.4688 7.83594L15.3818 8.13477L15.3809 8.13965C15.3167 8.37087 15.1173 8.5688 14.7861 8.66113C14.4546 8.75345 14.0298 8.72287 13.6309 8.5166H13.6299L12.71 8.04199L12.707 8.04102C12.5122 7.94195 12.3377 7.79878 12.1973 7.61914L11.7764 7.0791L11.3906 7.64453C11.2577 7.8391 11.1098 8.02158 10.9482 8.18945L10.9453 8.19141C10.5132 8.64672 9.99469 8.9976 9.42578 9.2207C8.85712 9.44368 8.25031 9.53447 7.64648 9.48828C7.04246 9.44203 6.45323 9.25922 5.91992 8.95117C5.38666 8.64311 4.92044 8.21673 4.55469 7.69922L4.18359 7.17383L3.76562 7.66309C3.63164 7.82006 3.47111 7.9469 3.29395 8.03711L3.29199 8.03809L2.37207 8.51172H2.37109C1.97187 8.71816 1.54829 8.74853 1.21777 8.65625C0.888053 8.56416 0.686747 8.36684 0.620117 8.13281L0.619141 8.12988L0.533203 7.83398C0.454976 7.53756 0.584715 7.14438 0.974609 6.83008L1.50879 6.39941L0.93457 6.02344C0.640255 5.83044 0.502024 5.57912 0.501953 5.33398V5.03027C0.505997 4.89354 0.542223 4.76088 0.606445 4.64551C0.670593 4.53039 0.759897 4.43663 0.863281 4.37109L1.44727 4.00098L0.912109 3.5625C0.577499 3.28772 0.454259 2.9457 0.515625 2.67188V2.6709L0.584961 2.35645C0.63714 2.12824 0.817559 1.92506 1.12402 1.81055C1.43186 1.69559 1.83729 1.68655 2.23926 1.84473V1.8457L3.19434 2.22461L3.19824 2.22559C3.37976 2.29627 3.54914 2.40209 3.69727 2.53809L4.13184 2.9375L4.4541 2.44238C4.84885 1.83571 5.3772 1.34256 5.99121 1.00488C6.60505 0.667345 7.28698 0.494722 7.97656 0.5Z"
                    fill="#76C7AD"
                    stroke="white"
                  />
                </Svg>
                <Text style={styles.mintText}>{quest.points}</Text>
              </LinearGradient>
            </View>

            {/* 오른쪽 영역 */}
            <View style={styles.rightColumn}>
              {/* See Related Places 버튼 */}
              <Pressable style={styles.relatedBtn}>
                <Text style={styles.relatedBtnText}>See Related Places</Text>
              </Pressable>

              {/* 간격을 위한 빈 View */}
              <View style={{ flex: 1 }} />

              {/* 텍스트들 - 하단 정렬 */}
              <View style={styles.titleBox}>
                <Text style={styles.title}>{quest.name}</Text>
                <Text style={styles.districtText}>
                  {quest.district || "Seoul"}
                </Text>
              </View>
            </View>
          </View>
        )}
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  /** 배경 오버레이 */
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 1500,
  },

  /** 전체 모달 */
  container: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#34495E",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    paddingTop: 20, // 드래그 핸들 공간
    alignItems: "center",
    zIndex: 1501,
  },

  /** 드래그 핸들 */
  handleBar: {
    width: 40,
    height: 5,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 3,
    marginBottom: 15,
  },

  /** 확장된 레이아웃 */
  expandedLayout: {
    width: "100%",
    flex: 1,
  },

  /** 확장된 상태의 이미지 */
  expandedImage: {
    width: "100%",
    height: 268,
    flexShrink: 0,
  },

  /** ScrollView */
  scrollView: {
    flex: 1,
  },

  /** 확장된 상태의 콘텐츠 */
  expandedContent: {
    paddingTop: 29,
    paddingHorizontal: 29,
    paddingBottom: 20,
    gap: 33,
  },

  /** 확장된 상태의 제목과 버튼 Row */
  expandedTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },

  /** 확장된 상태의 관련 장소 버튼 */
  expandedRelatedBtn: {
    width: 154,
    height: 38,
    flexShrink: 0,
    borderRadius: 10,
    backgroundColor: "#4D647C",
    justifyContent: "center",
    alignItems: "center",
  },

  /** 확장된 상태의 관련 장소 버튼 텍스트 */
  expandedRelatedBtnText: {
    color: "#FFF",
    fontFamily: "Inter",
    fontSize: 14,
    fontWeight: "400",
  },

  /** 내용 전체 wrapper */
  contentWrapper: {
    width: 325,
    height: 156.931,
    flexDirection: "row",
    gap: 12,
  },

  /** 이미지 카드 컨테이너 */
  imageCardContainer: {
    width: 156.931,
    height: 156.931,
    position: "relative",
  },

  /** 왼쪽 이미지 */
  image: {
    width: 156.931,
    height: 156.931,
    borderRadius: 10,
  },

  /** 카테고리 텍스트 (검색 페이지 스타일) */
  placeCategoryText: {
    position: "absolute",
    top: 10,
    left: 10,
    color: "#FFF",
    fontFamily: "Inter",
    fontSize: 14,
    fontWeight: "600",
  },

  /** 플러스 버튼 (검색 페이지 스타일) */
  plusButton: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 38,
    height: 38,
    padding: 11,
    borderRadius: 10,
    backgroundColor: "rgba(255, 127, 80, 0.85)",
    justifyContent: "center",
    alignItems: "center",
  },

  /** 거리 배지 (검색 페이지 스타일) */
  distanceBadge: {
    position: "absolute",
    bottom: 5,
    left: 5,
    height: 16,
    paddingHorizontal: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flexShrink: 0,
    borderRadius: 14,
    backgroundColor: "rgba(52, 73, 94, 0.50)",
  },

  /** 거리 텍스트 (검색 페이지 스타일) */
  distanceText: {
    color: "#FFF",
    fontFamily: "Pretendard",
    fontSize: 10,
    fontWeight: "600",
  },

  /** 민트 배지 (검색 페이지 스타일) */
  mintBadge: {
    position: "absolute",
    bottom: 5,
    right: 5,
    height: 16,
    paddingHorizontal: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flexShrink: 0,
    borderRadius: 14,
  },

  /** 민트 텍스트 (검색 페이지 스타일) */
  mintText: {
    color: "#FFF",
    fontFamily: "Pretendard",
    fontSize: 10,
    fontWeight: "600",
  },

  /** 오른쪽 상·하 정렬 column */
  rightColumn: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "flex-start",
    gap: 10,
  },

  /** See Related Places 버튼 박스 */
  relatedBtn: {
    width: 154,
    height: 40,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#4D647C",

    justifyContent: "center",
    alignItems: "center",
  },

  relatedBtnText: {
    color: "#FFF",
    fontFamily: "Pretendard",
    fontSize: 14,
    fontWeight: "400",
    letterSpacing: -0.16,
    lineHeight: 20,
  },

  /** 제목/서브텍스트 wrapper */
  titleBox: {
    width: 142,
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 5,
  },

  /** 제목 */
  title: {
    color: "#FFF",
    fontFamily: "Inter",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
    letterSpacing: -0.18,
  },

  /** 확장된 상태의 제목 */
  expandedTitle: {
    color: "#FFF",
    fontFamily: "Inter",
    fontSize: 20,
    fontWeight: "700",
  },

  /** 확장된 상태의 name과 address 그룹 */
  expandedNameAddressGroup: {
    gap: 10,
  },

  /** 확장된 상태의 name */
  expandedName: {
    color: "#FFF",
    fontFamily: "Inter",
    fontSize: 20,
    fontWeight: "700",
  },

  /** 확장된 상태의 주소 */
  expandedAddress: {
    color: "#FFF",
    fontFamily: "Inter",
    fontSize: 12,
    fontWeight: "400",
  },

  /** 확장된 상태의 버튼 Row */
  expandedButtonRow: {
    flexDirection: "row",
    gap: 5,
    width: "100%",
  },

  /** 확장된 상태의 버튼 */
  expandedButton: {
    flex: 1,
    height: 60,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.85)",
    backgroundColor: "#FFF",
  },

  /** 확장된 상태의 버튼 거리 배지 */
  expandedButtonDistanceBadge: {
    height: 16,
    paddingHorizontal: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flexShrink: 0,
    borderRadius: 14,
    backgroundColor: "rgba(52, 73, 94, 0.50)",
  },

  /** 확장된 상태의 버튼 거리 텍스트 */
  expandedButtonDistanceText: {
    color: "#FFF",
    fontFamily: "Pretendard",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
    letterSpacing: -0.12,
  },

  /** 확장된 상태의 버튼 서브 텍스트 */
  expandedButtonSubText: {
    color: "#34495E",
    fontFamily: "Inter",
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16,
    letterSpacing: 0,
    textAlign: "center",
  },

  /** 오른쪽 박스 */
  expandedButtonRight: {
    flex: 1,
    height: 60,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#76C7AD",
    backgroundColor: "#76C7AD",
  },

  /** 오른쪽 박스 민트 배지 */
  expandedButtonMintBadge: {
    height: 16,
    paddingHorizontal: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flexShrink: 0,
    borderRadius: 14,
    backgroundColor: "rgba(52, 73, 94, 0.50)",
  },

  /** 오른쪽 박스 민트 텍스트 */
  expandedButtonMintText: {
    color: "#FFF",
    fontFamily: "Pretendard",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
    letterSpacing: -0.12,
  },

  /** 오른쪽 박스 서브 텍스트 */
  expandedButtonRightSubText: {
    color: "#34495E",
    fontFamily: "Inter",
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16,
    letterSpacing: 0,
    textAlign: "center",
  },

  /** 네비게이션 버튼 */
  navigationButton: {
    width: "100%",
    height: 47,
    marginTop: -23,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#659DF2",
    backgroundColor: "#659DF2",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },

  /** 네비게이션 아이콘 */
  navigationIcon: {
    width: 20,
    height: 20,
  },

  /** 네비게이션 텍스트 */
  navigationText: {
    color: "#FFF",
    fontFamily: "Inter",
    fontSize: 14,
    fontWeight: "400",
    marginLeft: 8,
  },

  /** OverView 제목 */
  overviewTitle: {
    color: "#FFF",
    fontFamily: "Inter",
    fontSize: 16,
    fontWeight: "600",
    marginTop: -5,
  },

  /** OverView 설명 */
  overviewDescription: {
    color: "#FFF",
    fontFamily: "Inter",
    fontSize: 12,
    fontWeight: "400",
    marginTop: -15,
  },

  /** 구분선 */
  dividerLine: {
    width: "100%",
    height: 1,
    backgroundColor: "#FFF",
    marginTop: 10,
  },

  /** AI Docent Row */
  aiDocentRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 25,
  },

  /** AI Docent 아이콘 컨테이너 */
  aiDocentIconContainer: {
    width: 45,
    height: 45,
  },

  /** AI Docent 아이콘 */
  aiDocentIcon: {
    width: 53,
    height: 53,
  },

  /** AI Docent 제목 */
  aiDocentTitle: {
    color: "#FFF",
    fontFamily: "Inter",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 15,
  },

  /** 하단 장소 텍스트 */
  subTitle: {
    color: "#FFF",
    fontFamily: "Pretendard",
    fontSize: 12,
    fontWeight: "400",
    lineHeight: 16,
    letterSpacing: -0.12,
  },

  /** 지역 텍스트 */
  districtText: {
    color: "#FFF",
    fontFamily: "Pretendard",
    fontSize: 12,
    fontWeight: "400",
    lineHeight: 16,
    letterSpacing: -0.12,
    marginTop: 5,
  },
});

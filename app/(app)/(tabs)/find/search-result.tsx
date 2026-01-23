import React, { useState, useRef } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, G, Defs, ClipPath, Rect } from 'react-native-svg';

import { useQuestStore } from '@entities/quest';

export default function RecommendationResultScreen() {
  const router = useRouter();
  const { category, result } = useLocalSearchParams();
  const allRecommendations = JSON.parse((result as string) || '[]');

  const recommendations = allRecommendations.filter((item: any) => item.quest_id);

  const [activeIndex, setActiveIndex] = useState(0);

  const { selectedQuests, addQuest, isQuestSelected, removeQuest } = useQuestStore();
  const lastTap = useRef<number>(0);

  const handleAddToCart = (item: any) => {
    if (!item.quest_id) {
      Alert.alert('Notice', 'This place has no connected quest.');
      return;
    }

    const quest = {
      id: item.quest_id,
      place_id: item.place_id,
      name: item.name,
      title: item.name,
      category: item.category,
      latitude: item.latitude,
      longitude: item.longitude,
      reward_point: item.reward_point,
      points: item.reward_point || 0,
      description: item.description || '',
      district: item.district,
      difficulty: 'medium' as const,
      is_active: true,
      completion_count: 0,
      created_at: new Date().toISOString(),
      place_image_url: item.place_image_url,
      distance_km: item.distance_km,
    };

    if (isQuestSelected(quest.id)) {
      Alert.alert('Notice', 'This quest has already been added.');
      return;
    }

    addQuest(quest);
    Alert.alert('Success', `${item.name} has been added to cart.`);
  };

  const handleCardPress = async (item: any) => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;

    if (now - lastTap.current < DOUBLE_PRESS_DELAY) {
      // 더블 클릭: 상세 페이지로 이동
      lastTap.current = 0;

      if (!item.quest_id) {
        Alert.alert('Notice', 'This place has no connected quest.');
        return;
      }

      // quest-detail expects a 'quest' object as JSON string
      const questData = {
        id: item.quest_id,
        place_id: item.place_id,
        name: item.name,
        title: item.name, // Using name as title
        description: item.description || 'No description available',
        category: item.category,
        latitude: item.latitude,
        longitude: item.longitude,
        reward_point: item.reward_point,
        points: item.reward_point, // Using reward_point as points
        difficulty: 'medium', // Default difficulty
        is_active: true,
        completion_count: 0,
        created_at: new Date().toISOString(),
        district: item.district,
        place_image_url: item.place_image_url,
        distance_km: item.distance_km,
      };

      router.push({
        pathname: '/(app)/(tabs)/map/quest-detail',
        params: {
          quest: JSON.stringify(questData),
        },
      });
    } else {
      lastTap.current = now;
    }
  };

  const handleStartQuests = () => {
    if (selectedQuests.length === 0) {
      Alert.alert('Notice', 'Please add quests to cart.');
      return;
    }

    router.push('/(app)/(tabs)/map');
  };

  return (
    <View style={styles.container}>
      <View style={styles.dismissRow}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <G clipPath="url(#clip0_6_5064)">
              <Path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M1.82891 0.313946C1.62684 0.118777 1.35619 0.0107829 1.07527 0.0132241C0.794342 0.0156653 0.525614 0.128346 0.326962 0.326998C0.128311 0.525649 0.0156299 0.794377 0.0131887 1.0753C0.0107476 1.35623 0.118742 1.62687 0.313911 1.82895L5.98498 7.50002L0.313911 13.1711C0.211579 13.2699 0.129955 13.3882 0.0738023 13.5189C0.0176498 13.6496 -0.0119069 13.7902 -0.0131431 13.9324C-0.0143794 14.0747 0.0127296 14.2158 0.066602 14.3475C0.120474 14.4791 0.200031 14.5988 0.300631 14.6994C0.40123 14.8 0.520857 14.8795 0.652532 14.9334C0.784206 14.9873 0.925291 15.0144 1.06756 15.0131C1.20982 15.0119 1.35041 14.9824 1.48113 14.9262C1.61185 14.87 1.73008 14.7884 1.82891 14.6861L7.49998 9.01502L13.1711 14.6861C13.3731 14.8813 13.6438 14.9893 13.9247 14.9868C14.2056 14.9844 14.4743 14.8717 14.673 14.673C14.8717 14.4744 14.9843 14.2057 14.9868 13.9247C14.9892 13.6438 14.8812 13.3732 14.6861 13.1711L9.01498 7.50002L14.6861 1.82895C14.8812 1.62687 14.9892 1.35623 14.9868 1.0753C14.9843 0.794377 14.8717 0.525649 14.673 0.326998C14.4743 0.128346 14.2056 0.0156653 13.9247 0.0132241C13.6438 0.0107829 13.3731 0.118777 13.1711 0.313946L7.49998 5.98502L1.82891 0.313946Z"
                fill="white"
              />
            </G>
            <Defs>
              <ClipPath id="clip0_6_5064">
                <Rect width="15" height="15" fill="white" />
              </ClipPath>
            </Defs>
          </Svg>
        </TouchableOpacity>
      </View>

      <Text style={styles.headerTitle}>I considered the image and filter you chose!</Text>

      <View style={styles.newTagRow}>
        <View style={styles.imageTagChip}>
          <Svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <Path
              d="M11.25 5C11.25 5.33152 11.1183 5.64946 10.8839 5.88388C10.6495 6.1183 10.3315 6.25 10 6.25C9.66848 6.25 9.35054 6.1183 9.11612 5.88388C8.8817 5.64946 8.75 5.33152 8.75 5C8.75 4.66848 8.8817 4.35054 9.11612 4.11612C9.35054 3.8817 9.66848 3.75 10 3.75C10.3315 3.75 10.6495 3.8817 10.8839 4.11612C11.1183 4.35054 11.25 4.66848 11.25 5Z"
              fill="white"
            />
            <Path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M7.46438 0.781143H7.53562C8.97875 0.781143 10.1094 0.781143 10.9919 0.899893C11.8944 1.02114 12.6069 1.27489 13.1663 1.83364C13.7256 2.39302 13.9787 3.10552 14.1 4.00864C14.2188 4.89052 14.2188 6.02114 14.2188 7.46427V7.51927C14.2188 8.71239 14.2188 9.68864 14.1537 10.4836C14.0887 11.2836 13.9556 11.9505 13.6569 12.5055C13.526 12.7497 13.3625 12.9699 13.1663 13.1661C12.6069 13.7255 11.8944 13.9786 10.9913 14.0999C10.1094 14.2186 8.97875 14.2186 7.53562 14.2186H7.46438C6.02125 14.2186 4.89062 14.2186 4.00813 14.0999C3.10563 13.9786 2.39313 13.7249 1.83375 13.1661C1.33812 12.6705 1.08188 12.0536 0.94625 11.2874C0.811875 10.5355 0.7875 9.59989 0.7825 8.43864C0.781667 8.14281 0.78125 7.82989 0.78125 7.49989V7.46364C0.78125 6.02052 0.78125 4.88989 0.9 4.00739C1.02125 3.10489 1.275 2.39239 1.83375 1.83302C2.39313 1.27364 3.10562 1.02052 4.00875 0.899268C4.89062 0.780518 6.02125 0.780518 7.46438 0.780518M4.13312 1.82802C3.33437 1.93552 2.8525 2.14052 2.49687 2.49614C2.14062 2.85239 1.93625 3.33364 1.82875 4.13302C1.72 4.94552 1.71875 6.01302 1.71875 7.49927V8.02677L2.34437 7.47927C2.6188 7.23905 2.97426 7.11212 3.33877 7.12419C3.70328 7.13626 4.04957 7.28642 4.3075 7.54427L6.98875 10.2255C7.19682 10.4335 7.47159 10.5615 7.76472 10.5869C8.05784 10.6123 8.35052 10.5334 8.59125 10.3643L8.7775 10.233C9.1248 9.98898 9.54463 9.87 9.96834 9.89554C10.392 9.92109 10.7945 10.0896 11.11 10.3736L12.8788 11.9655C13.0575 11.5918 13.1631 11.1005 13.2194 10.4074C13.2806 9.65427 13.2812 8.71552 13.2812 7.49927C13.2812 6.01302 13.28 4.94552 13.1712 4.13302C13.0637 3.33364 12.8587 2.85177 12.5031 2.49552C12.1469 2.13989 11.6656 1.93552 10.8663 1.82802C10.0538 1.71927 8.98625 1.71802 7.5 1.71802C6.01375 1.71802 4.94562 1.71927 4.13312 1.82802Z"
              fill="white"
            />
          </Svg>
          <Text style={styles.imageTagText}>Image</Text>
          <TouchableOpacity>
            <Svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <Path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M1.21927 0.200508C1.08456 0.0703956 0.904128 -0.00160044 0.716845 2.70019e-05C0.529561 0.00165444 0.350409 0.0767751 0.217975 0.209209C0.0855406 0.341644 0.0104199 0.520796 0.00879249 0.708079C0.00716504 0.895362 0.0791611 1.07579 0.209274 1.21051L3.98999 4.99122L0.209274 8.77194C0.141052 8.83783 0.0866365 8.91665 0.0492015 9.00379C0.0117665 9.09094 -0.00793794 9.18467 -0.00876209 9.27951C-0.00958625 9.37435 0.0084864 9.46841 0.0444013 9.55619C0.0803162 9.64397 0.133354 9.72372 0.20042 9.79079C0.267487 9.85786 0.347238 9.91089 0.435021 9.94681C0.522804 9.98272 0.616861 10.0008 0.711703 9.99997C0.806546 9.99915 0.900274 9.97945 0.98742 9.94201C1.07457 9.90458 1.15338 9.85016 1.21927 9.78194L4.99999 6.00122L8.7807 9.78194C8.91542 9.91205 9.09585 9.98405 9.28313 9.98242C9.47042 9.98079 9.64957 9.90567 9.782 9.77324C9.91444 9.6408 9.98956 9.46165 9.99118 9.27437C9.99281 9.08708 9.92082 8.90665 9.7907 8.77194L6.00999 4.99122L9.7907 1.21051C9.92082 1.07579 9.99281 0.895362 9.99118 0.708079C9.98956 0.520796 9.91444 0.341644 9.782 0.209209C9.64957 0.0767751 9.47042 0.00165444 9.28313 2.70019e-05C9.09585 -0.00160044 8.91542 0.0703956 8.7807 0.200508L4.99999 3.98122L1.21927 0.200508Z"
                fill="white"
              />
            </Svg>
          </TouchableOpacity>
        </View>
        {category && (
          <View style={styles.categoryTagChip}>
            <Text style={styles.categoryTagText}>{category}</Text>
            <TouchableOpacity>
              <Svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <G clipPath="url(#clip0_6_5082)">
                  <Path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M1.21927 0.209298C1.08456 0.0791846 0.904128 0.00718862 0.716845 0.00881606C0.529561 0.0104435 0.350409 0.0855642 0.217975 0.217999C0.0855406 0.350433 0.0104199 0.529585 0.00879249 0.716868C0.00716504 0.904152 0.0791611 1.08458 0.209274 1.2193L3.98999 5.00001L0.209274 8.78073C0.141052 8.84662 0.0866365 8.92544 0.0492015 9.01258C0.0117665 9.09973 -0.00793794 9.19345 -0.00876209 9.2883C-0.00958625 9.38314 0.0084864 9.4772 0.0444013 9.56498C0.0803162 9.65276 0.133354 9.73251 0.20042 9.79958C0.267487 9.86665 0.347238 9.91968 0.435021 9.9556C0.522804 9.99151 0.616861 10.0096 0.711703 10.0088C0.806546 10.0079 0.900274 9.98823 0.98742 9.9508C1.07457 9.91336 1.15338 9.85895 1.21927 9.79073L4.99999 6.01001L8.7807 9.79073C8.91542 9.92084 9.09585 9.99284 9.28313 9.99121C9.47042 9.98958 9.64957 9.91446 9.782 9.78203C9.91444 9.64959 9.98956 9.47044 9.99118 9.28316C9.99281 9.09587 9.92082 8.91544 9.7907 8.78073L6.00999 5.00001L9.7907 1.2193C9.92082 1.08458 9.99281 0.904152 9.99118 0.716868C9.98956 0.529585 9.91444 0.350433 9.782 0.217999C9.64957 0.0855642 9.47042 0.0104435 9.28313 0.00881606C9.09585 0.00718862 8.91542 0.0791846 8.7807 0.209298L4.99999 3.99001L1.21927 0.209298Z"
                    fill="white"
                  />
                </G>
                <Defs>
                  <ClipPath id="clip0_6_5082">
                    <Rect width="10" height="10" fill="white" />
                  </ClipPath>
                </Defs>
              </Svg>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.carouselContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={260}
          onScroll={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / 260);
            setActiveIndex(index);
          }}
          scrollEventThrottle={16}
          contentContainerStyle={styles.horizontalList}
        >
          {recommendations.map((item: any) => (
            <Pressable
              key={item.place_id || item.id}
              style={styles.cardWrapper}
              onPress={() => handleCardPress(item)}
            >
              <View style={styles.placeImageContainer}>
                {item.place_image_url ? (
                  <Image source={{ uri: item.place_image_url }} style={styles.placeImage} />
                ) : (
                  <View style={[styles.placeImage, styles.placeholderImage]}>
                    <Ionicons name="image" size={24} color="#9FB3C8" />
                  </View>
                )}
                <Text style={styles.placeCategoryText}>{item.category || 'Place'}</Text>

                {/* + 버튼 (우측 상단) */}
                {item.quest_id && (
                  <Pressable
                    style={styles.plusButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleAddToCart(item);
                    }}
                  >
                    <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <Path
                        d="M14.8571 9.14286H9.14286V14.8571C9.14286 15.1602 9.02245 15.4509 8.80812 15.6653C8.59379 15.8796 8.30311 16 8 16C7.6969 16 7.40621 15.8796 7.19188 15.6653C6.97755 15.4509 6.85714 15.1602 6.85714 14.8571V9.14286H1.14286C0.839753 9.14286 0.549063 9.02245 0.334735 8.80812C0.120408 8.59379 0 8.30311 0 8C0 7.6969 0.120408 7.40621 0.334735 7.19188C0.549063 6.97755 0.839753 6.85714 1.14286 6.85714H6.85714V1.14286C6.85714 0.839753 6.97755 0.549062 7.19188 0.334735C7.40621 0.120407 7.6969 0 8 0C8.30311 0 8.59379 0.120407 8.80812 0.334735C9.02245 0.549062 9.14286 0.839753 9.14286 1.14286V6.85714H14.8571C15.1602 6.85714 15.4509 6.97755 15.6653 7.19188C15.8796 7.40621 16 7.6969 16 8C16 8.30311 15.8796 8.59379 15.6653 8.80812C15.4509 9.02245 15.1602 9.14286 14.8571 9.14286Z"
                        fill="white"
                      />
                    </Svg>
                  </Pressable>
                )}

                {/* 거리 뱃지 (좌하단) */}
                {item.distance_km !== undefined && (
                  <View style={styles.distanceBadge}>
                    <Svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <Path
                        d="M9.49609 0.501953C9.4967 0.511802 9.50014 0.523321 9.5 0.537109C9.49887 0.64138 9.4678 0.808104 9.38184 1.04883L5.61035 9.19434L5.60156 9.21387L5.59375 9.2334C5.56315 9.31782 5.50604 9.38903 5.43262 9.43652C5.35932 9.48388 5.27333 9.50595 5.1875 9.49902C5.1016 9.49207 5.01943 9.45648 4.9541 9.39746C4.88881 9.33843 4.84406 9.25842 4.82715 9.16992V9.16895L4.79199 9.01465C4.59556 8.24175 4.04883 7.43937 3.41504 6.80273C2.7393 6.12398 1.87207 5.54092 1.04492 5.38672L0.828125 5.34375L0.824219 5.34277L0.761719 5.32617C0.701821 5.30413 0.647322 5.2667 0.603516 5.21777C0.545136 5.15242 0.508439 5.06864 0.500977 4.97949C0.493596 4.89034 0.515442 4.8013 0.5625 4.72656C0.609571 4.65182 0.679301 4.59552 0.759766 4.56543L0.78125 4.55762L0.801758 4.54785L8.95898 0.625C9.19511 0.535375 9.35976 0.503188 9.46289 0.5C9.47568 0.499607 9.48672 0.501617 9.49609 0.501953Z"
                        stroke="#F5F5F5"
                      />
                    </Svg>
                    <Text style={styles.distanceText}>{item.distance_km.toFixed(1)}km</Text>
                  </View>
                )}

                {/* 포인트 뱃지 (우하단) */}
                {item.reward_point && (
                  <LinearGradient
                    colors={['#76C7AD', '#3A6154']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.pointBadge}
                  >
                    <Svg width="16" height="10" viewBox="0 0 16 10" fill="none">
                      <Path
                        d="M7.97656 0.5C8.66625 0.505346 9.34579 0.688997 9.95508 1.03613C10.5644 1.38334 11.0863 1.88423 11.4727 2.49707L11.8076 3.02832L12.25 2.58301C12.4078 2.42426 12.5942 2.30362 12.7959 2.22754L12.8047 2.22461L13.7578 1.84473C14.1608 1.68634 14.5665 1.6956 14.874 1.81055C15.1809 1.92526 15.3604 2.12924 15.4121 2.3584L15.4814 2.6709V2.67188C15.5433 2.94777 15.4221 3.28911 15.0869 3.56152L14.5449 4.00098L15.1367 4.37207C15.2406 4.43731 15.3299 4.53127 15.3945 4.64648C15.443 4.73304 15.476 4.82923 15.4912 4.92969L15.5 5.03125V5.33789C15.5 5.58665 15.3625 5.83372 15.0674 6.02734L14.4883 6.40723L15.0303 6.83789C15.4195 7.14688 15.5503 7.53718 15.4688 7.83594L15.3818 8.13477L15.3809 8.13965C15.3167 8.37087 15.1173 8.5688 14.7861 8.66113C14.4546 8.75345 14.0298 8.72287 13.6309 8.5166H13.6299L12.71 8.04199L12.707 8.04102C12.5122 7.94195 12.3377 7.79878 12.1973 7.61914L11.7764 7.0791L11.3906 7.64453C11.2577 7.8391 11.1098 8.02158 10.9482 8.18945L10.9453 8.19141C10.5132 8.64672 9.99469 8.9976 9.42578 9.2207C8.85712 9.44368 8.25031 9.53447 7.64648 9.48828C7.04246 9.44203 6.45323 9.25922 5.91992 8.95117C5.38666 8.64311 4.92044 8.21673 4.55469 7.69922L4.18359 7.17383L3.76562 7.66309C3.63164 7.82007 3.4711 7.9469 3.29395 8.03711L3.29199 8.03809L2.37207 8.51172H2.37109C1.97187 8.71816 1.54829 8.74853 1.21777 8.65625C0.888054 8.56416 0.686747 8.36684 0.620117 8.13281L0.619141 8.12988L0.533203 7.83398C0.454976 7.53756 0.584715 7.14438 0.974609 6.83008L1.50879 6.39941L0.93457 6.02344C0.640256 5.83044 0.502024 5.57912 0.501953 5.33398V5.03027C0.505997 4.89354 0.542223 4.76088 0.606445 4.64551C0.670593 4.53039 0.759897 4.43663 0.863281 4.37109L1.44727 4.00098L0.912109 3.5625C0.577499 3.28772 0.454259 2.9457 0.515625 2.67188V2.6709L0.584961 2.35645C0.63714 2.12824 0.817559 1.92506 1.12402 1.81055C1.43186 1.69559 1.83729 1.68655 2.23926 1.84473V1.8457L3.19434 2.22461L3.19824 2.22559C3.37976 2.29627 3.54914 2.40209 3.69727 2.53809L4.13184 2.9375L4.4541 2.44238C4.84885 1.83571 5.3772 1.34256 5.99121 1.00488C6.60505 0.667345 7.28698 0.494722 7.97656 0.5Z"
                        stroke="#F5F5F5"
                      />
                    </Svg>
                    <Text style={styles.pointText}>{item.reward_point}</Text>
                  </LinearGradient>
                )}
              </View>
              <View style={styles.placeInfoBottom}>
                <Text style={styles.placeNameText} numberOfLines={2}>
                  {item.name}
                </Text>
                {item.district && <Text style={styles.placeLocationText}>{item.district}</Text>}
              </View>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.dotsRow}>
          {recommendations.map((_: any, index: number) => (
            <View key={index} style={[styles.dot, activeIndex === index && styles.dotActive]} />
          ))}
        </View>
      </View>

      {/* 장바구니 + START 버튼 */}
      <View style={styles.routeContainer} pointerEvents="box-none">
        <LinearGradient
          colors={['#FF7F50', '#994C30']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.routeBar}
        >
          <View style={styles.questSlotsContainer}>
            {[0, 1, 2, 3].map((index) => {
              const selectedQuest = selectedQuests[index];
              return (
                <Pressable
                  key={index}
                  style={styles.questSlot}
                  onPress={() => selectedQuest && removeQuest(selectedQuest.id)}
                >
                  {selectedQuest ? (
                    <Image
                      source={{
                        uri: selectedQuest.place_image_url || 'https://picsum.photos/58/60',
                      }}
                      style={styles.slotQuestImage}
                    />
                  ) : (
                    <Text style={styles.slotPlusIcon}>+</Text>
                  )}
                </Pressable>
              );
            })}
          </View>

          <Pressable
            style={[styles.startButton, selectedQuests.length > 0 && styles.startButtonActive]}
            onPress={handleStartQuests}
            disabled={selectedQuests.length === 0}
          >
            <Text
              style={[
                styles.startButtonText,
                selectedQuests.length > 0 && styles.startButtonTextActive,
              ]}
            >
              START
            </Text>
          </Pressable>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#10202F',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 100,
  },
  dismissRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  resultTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  closeButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFF',
    textAlign: 'center',
    fontFamily: 'Pretendard',
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 24,
    letterSpacing: 0,
    marginTop: 10,
    marginBottom: 14,
  },
  newTagRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
    justifyContent: 'center',
  },
  imageTagChip: {
    flexDirection: 'row',
    height: 36,
    paddingHorizontal: 10,
    paddingVertical: 0,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    borderRadius: 42,
    backgroundColor: '#659DF2',
  },
  imageTagText: {
    color: '#FFF',
    fontFamily: 'Pretendard',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 20,
    letterSpacing: -0.16,
  },
  categoryTagChip: {
    flexDirection: 'row',
    height: 36,
    paddingHorizontal: 10,
    paddingVertical: 0,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    borderRadius: 42,
    backgroundColor: '#FF7F50',
  },
  categoryTagText: {
    color: '#FFF',
    fontFamily: 'Pretendard',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
    letterSpacing: -0.12,
  },
  carouselContainer: {
    flex: 1,
    position: 'relative',
  },
  horizontalList: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingLeft: 60,
    paddingRight: 60,
    alignItems: 'center',
  },
  cardWrapper: {
    width: 240,
    marginRight: 20,
    alignItems: 'center',
  },
  placeImageContainer: {
    position: 'relative',
    width: 240,
    height: 240,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#2C3E50',
  },
  placeImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2C3E50',
  },
  placeCategoryText: {
    position: 'absolute',
    top: 8,
    left: 8,
    color: '#FFF',
    fontFamily: 'Pretendard',
    fontSize: 11,
    fontWeight: '600',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  plusButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 38,
    height: 38,
    padding: 11,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 127, 80, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  distanceBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  distanceText: {
    color: '#F5F5F5',
    fontFamily: 'Pretendard',
    fontSize: 11,
    fontWeight: '600',
  },
  pointBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pointText: {
    color: '#FFF',
    fontFamily: 'Pretendard',
    fontSize: 11,
    fontWeight: '600',
  },
  placeInfoBottom: {
    marginTop: 8,
  },
  placeNameText: {
    color: '#FFF',
    fontFamily: 'Pretendard',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: 4,
  },
  placeLocationText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'Pretendard',
    fontSize: 12,
    fontWeight: '400',
  },
  dotsRow: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(33, 46, 56, 1)' },
  dotActive: { backgroundColor: 'rgba(102, 158, 242, 1)' },

  /* Bottom Route Selection Bar */
  routeContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1600,
    elevation: 1600,
  },
  routeBar: {
    width: 325,
    height: 73,
    borderRadius: 20,
    paddingHorizontal: 8.68,
    paddingVertical: 6.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4.82,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  questSlotsContainer: {
    flexDirection: 'row',
    gap: 4.82,
  },
  questSlot: {
    width: 58,
    height: 60,
    backgroundColor: '#EF6A39',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 4,
    overflow: 'hidden',
  },
  slotQuestImage: {
    width: 58,
    height: 60,
    borderRadius: 10,
  },
  slotPlusIcon: {
    fontSize: 32,
    fontWeight: '300',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 32,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 1,
  },
  startButton: {
    width: 58,
    height: 60,
    backgroundColor: '#EF6A39',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 4,
  },
  startButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  startButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(154, 77, 49, 0.46)',
    textAlign: 'center',
    lineHeight: 20,
    letterSpacing: -0.16,
  },
  startButtonTextActive: {
    color: '#EF6A39',
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    letterSpacing: -0.16,
  },
});

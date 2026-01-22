import { pointsApi, Reward, rewardApi } from '@shared/api';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { ThemedText } from '@shared/ui';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Defs, Path, RadialGradient, Stop } from 'react-native-svg';

const CATEGORIES = [
  { key: 'food', label: 'Food' },
  { key: 'cafe', label: 'Cafe' },
  { key: 'shopping', label: 'Shopping' },
  { key: 'ticket', label: 'Ticket' },
  { key: 'activity', label: 'Activity' },
  { key: 'entertainment', label: 'Entertainment' },
  { key: 'beauty', label: 'Beauty' },
  { key: 'wellness', label: 'Wellness' },
];

// Custom SVG icon for chopsticks (food category)
const ChopsticksIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path
      d="M18.5561 6.70475C18.7302 6.51876 18.9687 6.40625 19.223 6.39018C19.4773 6.37411 19.7281 6.4557 19.9242 6.61829C20.1204 6.78087 20.2471 7.0122 20.2785 7.26503C20.3098 7.51787 20.2435 7.77315 20.0931 7.97875L20.0131 8.07475L8.04806 20.7977C7.87394 20.9837 7.63539 21.0962 7.38112 21.1123C7.12686 21.1284 6.87604 21.0468 6.67989 20.8842C6.48374 20.7216 6.35704 20.4903 6.32567 20.2375C6.29429 19.9846 6.3606 19.7293 6.51106 19.5237L6.59106 19.4277L18.5561 6.70475ZM12.3541 3.38975C12.4819 3.16937 12.6891 3.00611 12.9332 2.9333C13.1774 2.86049 13.4401 2.88363 13.6678 2.99798C13.8955 3.11233 14.071 3.30927 14.1583 3.5486C14.2457 3.78793 14.2385 4.05159 14.1381 4.28575L14.0861 4.38975L5.58606 19.1127C5.45932 19.3354 5.25199 19.5008 5.00682 19.5751C4.76166 19.6493 4.49736 19.6266 4.26843 19.5117C4.03949 19.3968 3.86339 19.1984 3.77643 18.9575C3.68947 18.7165 3.69828 18.4514 3.80106 18.2167L3.85406 18.1127L12.3541 3.38975Z"
      fill="white"
    />
  </Svg>
);

export default function ShopScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('food');
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [userMint, setUserMint] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const fetchUserPoints = async () => {
    try {
      const data = await pointsApi.getPoints();
      setUserMint(data.total_points);
    } catch (err) {}
  };

  const fetchRewards = async () => {
    try {
      setLoading(true);
      const data = await rewardApi.getRewards(selectedCategory, search);
      setRewards(data.rewards);
    } catch (e) {
      Alert.alert('Error', 'Failed to load reward list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserPoints();
    fetchRewards();
  }, [selectedCategory, search]);

  // Refresh points when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchUserPoints();
      fetchRewards();
    }, []),
  );

  const handleRewardClick = (item: Reward) => {
    // Navigate to coupon detail page
    router.push({
      pathname: '/(app)/(shop-flow)/reward-detail',
      params: {
        reward: JSON.stringify(item),
        category: CATEGORIES.find((c) => c.key === selectedCategory)?.label || selectedCategory,
      },
    });
  };

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.push('/(app)/(shop-flow)/my-purchase')} style={styles.menuButton}>
          <Svg width="15" height="10" viewBox="0 0 15 10" fill="none">
            <Path
              d="M0.833336 10C0.597225 10 0.399447 9.92 0.240003 9.76C0.0805585 9.6 0.000558429 9.40222 2.87356e-06 9.16667C-0.000552682 8.93111 0.0794474 8.73333 0.240003 8.57333C0.400559 8.41333 0.598336 8.33333 0.833336 8.33333H14.1667C14.4028 8.33333 14.6008 8.41333 14.7608 8.57333C14.9208 8.73333 15.0006 8.93111 15 9.16667C14.9994 9.40222 14.9194 9.60028 14.76 9.76083C14.6006 9.92139 14.4028 10.0011 14.1667 10H0.833336ZM0.833336 5.83333C0.597225 5.83333 0.399447 5.75333 0.240003 5.59333C0.0805585 5.43333 0.000558429 5.23556 2.87356e-06 5C-0.000552682 4.76444 0.0794474 4.56667 0.240003 4.40667C0.400559 4.24667 0.598336 4.16667 0.833336 4.16667H14.1667C14.4028 4.16667 14.6008 4.24667 14.7608 4.40667C14.9208 4.56667 15.0006 4.76444 15 5C14.9994 5.23556 14.9194 5.43361 14.76 5.59417C14.6006 5.75472 14.4028 5.83444 14.1667 5.83333H0.833336ZM0.833336 1.66667C0.597225 1.66667 0.399447 1.58667 0.240003 1.42667C0.0805585 1.26667 0.000558429 1.06889 2.87356e-06 0.833333C-0.000552682 0.597778 0.0794474 0.4 0.240003 0.24C0.400559 0.0800001 0.598336 0 0.833336 0H14.1667C14.4028 0 14.6008 0.0800001 14.7608 0.24C14.9208 0.4 15.0006 0.597778 15 0.833333C14.9994 1.06889 14.9194 1.26694 14.76 1.4275C14.6006 1.58806 14.4028 1.66778 14.1667 1.66667H0.833336Z"
              fill="white"
            />
          </Svg>
        </Pressable>

        <View style={styles.headerRight}>
          {/* Search Box */}
          <View style={styles.searchBox}>
            <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <Path
                d="M15.1753 4.32863C14.0003 3.15758 12.4092 2.5 10.7504 2.5C9.0916 2.5 7.50043 3.15758 6.32546 4.32863C5.41627 5.23994 4.80963 6.40903 4.58797 7.67716C4.3663 8.94528 4.54037 10.251 5.08648 11.4167L2.68227 13.8212C2.47232 14.015 2.30371 14.2492 2.18654 14.5098C2.06937 14.7704 2.00605 15.052 2.00041 15.3377C1.99478 15.6234 2.04692 15.9072 2.15373 16.1722C2.26053 16.4372 2.4198 16.6779 2.62195 16.8798C2.82409 17.0817 3.06493 17.2407 3.33004 17.3472C3.59516 17.4537 3.87908 17.5055 4.16471 17.4995C4.45035 17.4935 4.73181 17.4299 4.99223 17.3124C5.25265 17.1948 5.48665 17.0259 5.68016 16.8157L8.08438 14.4112C8.91748 14.8022 9.82643 15.0049 10.7467 15.005C11.5694 15.0046 12.3839 14.8415 13.1433 14.525C13.9027 14.2086 14.592 13.745 15.1716 13.1611C16.3425 11.986 17 10.3946 17 8.73562C17 7.07663 16.3425 5.48528 15.1716 4.31017L15.1753 4.32863ZM14.4157 10.2697C14.0402 11.1836 13.3381 11.9251 12.4462 12.3498C11.5543 12.7746 10.5362 12.8523 9.59014 12.5678C8.64408 12.2834 7.83768 11.6571 7.3278 10.8109C6.81793 9.96461 6.64105 8.95894 6.83163 7.98949C7.0222 7.02004 7.56657 6.15612 8.35882 5.5659C9.15107 4.97569 10.1345 4.70136 11.1179 4.79628C12.1012 4.89119 13.0141 5.34861 13.6788 6.07947C14.3436 6.81032 14.7127 7.76238 14.7144 8.75038C14.7151 9.27151 14.6136 9.78766 14.4157 10.2697Z"
                fill="#34495E"
                fillOpacity="0.55"
              />
            </Svg>
            <TextInput
              placeholder="Search Coupons"
              placeholderTextColor="rgba(52, 73, 94, 0.55)"
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {/* Mint Box */}
          <View style={styles.mintBox}>
            <View style={styles.mintLeftColumn}>
              <Svg width="26" height="16" viewBox="0 0 26 16" fill="none">
                <Path
                  d="M26 7.93746V8.44855C26 9.17179 25.5789 9.78656 24.9296 10.2012C25.7342 10.8232 26.1647 11.7441 25.92 12.612L25.7765 13.0942C25.3813 14.4804 23.4241 15.0108 21.7773 14.1815L20.2812 13.4317C19.8558 13.2212 19.4801 12.9185 19.1802 12.5445C18.9389 12.8886 18.6698 13.2111 18.3756 13.5088C17.5932 14.3118 16.6512 14.9326 15.6136 15.3288C14.576 15.7251 13.4673 15.8876 12.363 15.8053C11.2586 15.7229 10.1845 15.3976 9.21383 14.8516C8.24317 14.3055 7.39872 13.5515 6.738 12.641C6.45213 12.9673 6.10695 13.2334 5.72174 13.4245L4.22558 14.1742C2.57885 15.0035 0.631008 14.4732 0.226384 13.0869L0.0828579 12.6048C-0.152389 11.7465 0.268722 10.8256 1.07327 10.194C0.423985 9.77932 0.00288208 9.15732 0.00288208 8.44131V7.93746C0.0132505 7.59598 0.106971 7.26261 0.27546 6.96781C0.443949 6.67301 0.681828 6.42619 0.967388 6.2499C0.261648 5.68577 -0.140606 4.86369 0.0452391 4.05606L0.158153 3.55942C0.471031 2.20455 2.27536 1.54641 3.93855 2.18527L5.49121 2.78556C5.88189 2.93367 6.24297 3.15341 6.55685 3.43406C7.26949 2.36734 8.22692 1.49633 9.34495 0.897587C10.463 0.298841 11.7074 -0.00930872 12.9688 0.000214193C14.2303 0.0097371 15.4701 0.336647 16.5794 0.952207C17.6887 1.56777 18.6335 2.45313 19.3308 3.5305C19.6676 3.20049 20.0683 2.9467 20.507 2.78556L22.0573 2.18527C23.7228 1.54641 25.5248 2.20455 25.8377 3.55942L25.9506 4.05606C26.1365 4.86369 25.7412 5.68577 25.0284 6.2499C25.3153 6.42532 25.5546 6.67178 25.7243 6.96663C25.8941 7.26149 25.9889 7.5953 26 7.93746Z"
                  fill="url(#paint0_radial_mint)"
                />
                <Defs>
                  <RadialGradient
                    id="paint0_radial_mint"
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
            <ThemedText style={styles.mintValue}>{userMint}</ThemedText>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.contentContainer}>
        {/* ====================== */}
        {/* ⭐ 상단 배너 추가       */}
        {/* ====================== */}
        <Pressable style={styles.bannerWrapper} onPress={() => router.push('/(app)/(shop-flow)/day-pass')}>
          <Image
            source={require('@/assets/images/store_pass.png')}
            style={styles.bannerImage}
            resizeMode="cover"
          />

          {/* 텍스트 오버레이 - 왼쪽 */}
          <View style={styles.bannerTextWrapper}>
            <ThemedText style={styles.bannerTitle}>
              Your best choice {'\n'}for Seoul Tour
            </ThemedText>
          </View>

          {/* 텍스트 오버레이 - 오른쪽 */}
          <Pressable style={styles.bannerRightText} onPress={() => router.push('/(app)/(shop-flow)/day-pass')}>
            <ThemedText style={styles.bannerRightTextLabel}>Day Pass Trials</ThemedText>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </Pressable>
        </Pressable>

        {/* Category Pick */}
        <ThemedText style={styles.categoryPickTitle}>Category Pick</ThemedText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryPickScrollView}
          contentContainerStyle={styles.categoryPickScrollContent}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={styles.categoryPickItem}
              onPress={() => setSelectedCategory(cat.key)}
            >
              <View
                style={[
                  styles.categoryPickIcon,
                  selectedCategory === cat.key && styles.categoryPickIconSelected,
                ]}
              >
                {cat.key === 'food' ? (
                  <ChopsticksIcon />
                ) : (
                  <Ionicons
                    name={
                      cat.key === 'cafe'
                        ? 'cafe'
                        : cat.key === 'shopping'
                          ? 'bag'
                          : cat.key === 'ticket'
                            ? 'ticket'
                            : cat.key === 'activity'
                              ? 'star'
                              : cat.key === 'entertainment'
                                ? 'game-controller'
                                : cat.key === 'beauty'
                                  ? 'cut'
                                  : 'fitness'
                    }
                    size={24}
                    color="#fff"
                  />
                )}
              </View>
              <ThemedText
                style={[
                  styles.categoryPickLabel,
                  selectedCategory === cat.key && styles.categoryPickLabelSelected,
                ]}
                numberOfLines={1}
              >
                {cat.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Reward list */}
        <View style={styles.sectionHeaderRow}>
          <ThemedText style={styles.sectionTitle}>
            {CATEGORIES.find((c) => c.key === selectedCategory)?.label || 'Rewards'}
          </ThemedText>
          <ThemedText style={styles.countText}>{rewards.length} Coupons</ThemedText>
        </View>

        {loading ? (
          <ThemedText style={styles.loadingText}>Loading...</ThemedText>
        ) : rewards.length === 0 ? (
          <ThemedText style={styles.emptyText}>No rewards available</ThemedText>
        ) : (
          <View style={styles.rewardGrid}>
            {rewards.map((item) => (
              <Pressable
                key={item.id}
                style={styles.rewardCard}
                onPress={() => handleRewardClick(item)}
              >
                <View style={styles.rewardImageContainer}>
                  {item.image_url ? (
                    <Image
                      source={{ uri: item.image_url }}
                      style={styles.rewardImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <Ionicons name="gift" size={50} color="#76C7AD" />
                  )}
                </View>

                <View style={styles.rewardInfo}>
                  <ThemedText style={styles.rewardBrand} numberOfLines={1}>
                    {CATEGORIES.find((c) => c.key === selectedCategory)?.label || selectedCategory}
                  </ThemedText>
                  <ThemedText style={styles.rewardTitle} numberOfLines={2}>
                    {item.name}
                  </ThemedText>
                  <View style={styles.rewardPriceBadge}>
                    <Svg width="13" height="8" viewBox="0 0 13 8" fill="none">
                      <Path
                        d="M13 4.01234V4.2707C13 4.63629 12.7895 4.94705 12.4648 5.15666C12.8671 5.47107 13.0823 5.9366 12.96 6.37531L12.8883 6.61904C12.6907 7.31976 11.712 7.58787 10.8887 7.16865L10.1406 6.78965C9.9279 6.68324 9.74007 6.53022 9.5901 6.34118C9.46947 6.51509 9.3349 6.67816 9.18782 6.82864C8.79662 7.23454 8.3256 7.54833 7.80681 7.74864C7.28802 7.94896 6.73366 8.0311 6.18148 7.98947C5.62929 7.94784 5.09225 7.7834 4.60692 7.50738C4.12158 7.23136 3.69936 6.85023 3.369 6.38993C3.22607 6.5549 3.05348 6.68943 2.86087 6.78599L2.11279 7.16499C1.28943 7.58421 0.315504 7.3161 0.113192 6.61538L0.041429 6.37165C-0.0761944 5.93781 0.134361 5.47229 0.536633 5.153C0.211993 4.94339 0.00144104 4.62898 0.00144104 4.26704V4.01234C0.00662526 3.83973 0.0534857 3.67121 0.13773 3.52219C0.221975 3.37317 0.340914 3.24841 0.483694 3.15929C0.130824 2.87412 -0.0703029 2.45857 0.0226196 2.05032L0.0790765 1.79927C0.235516 1.11439 1.13768 0.781702 1.96928 1.10464L2.7456 1.40809C2.94094 1.48295 3.12149 1.59403 3.27843 1.7359C3.63475 1.19668 4.11346 0.756388 4.67248 0.453726C5.23149 0.151063 5.8537 -0.00470551 6.48442 0.000108273C7.11515 0.00492205 7.73507 0.170173 8.28972 0.481336C8.84437 0.792498 9.31677 1.24004 9.66538 1.78465C9.8338 1.61783 10.0342 1.48954 10.2535 1.40809L11.0286 1.10464C11.8614 0.781702 12.7624 1.11439 12.9188 1.79927L12.9753 2.05032C13.0682 2.45857 12.8706 2.87412 12.5142 3.15929C12.6577 3.24797 12.7773 3.37255 12.8622 3.5216C12.9471 3.67064 12.9944 3.83938 13 4.01234Z"
                        fill="#F5F5F5"
                      />
                    </Svg>
                    <ThemedText style={styles.rewardPrice}>{item.point_cost}</ThemedText>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#34495E',
  },
  scrollContent: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },

  /** Custom Header */
  header: {
    width: '100%',
    height: 121,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    borderBottomWidth: 4,
    borderBottomColor: '#76C7AD',
    backgroundColor: '#34495E',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 50,
  },
  menuButton: {
    marginLeft: 20,
    marginRight: 20,
    flexShrink: 0,
  },
  headerRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 10,
  },
  searchBox: {
    width: 209,
    height: 47,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    backgroundColor: '#FFF',
    marginRight: 5,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Pretendard',
    color: '#34495E',
  },
  mintBox: {
    width: 76,
    height: 47,
    paddingHorizontal: 8,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 10,
    backgroundColor: '#76C7AD',
    flexShrink: 0,
  },
  mintLeftColumn: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  mintLabel: {
    color: '#FFF',
    fontSize: 10,
    fontFamily: 'Pretendard',
    fontWeight: '700',
    lineHeight: 12,
    textAlign: 'center',
  },
  mintValue: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: 'Pretendard',
    fontWeight: '700',
    lineHeight: 16,
  },

  /** Category Pick */
  categoryPickTitle: {
    color: 'rgba(255, 255, 255, 0.50)',
    fontFamily: 'Pretendard',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: -0.16,
    marginBottom: 8,
    marginTop: 20,
  },
  categoryPickScrollView: {
    marginBottom: 28,
  },
  categoryPickScrollContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingRight: 20,
  },
  categoryPickItem: {
    width: 50,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 5,
    marginRight: 20,
  },
  categoryPickIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#222D39',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryPickIconSelected: {
    backgroundColor: '#76C7AD',
  },
  categoryPickLabel: {
    color: '#fff',
    textAlign: 'center',
    fontFamily: 'Pretendard',
    fontSize: 10,
    fontWeight: '400',
    lineHeight: 14,
    letterSpacing: -0.16,
    width: '100%',
  },
  categoryPickLabelSelected: {
    color: '#76C7AD',
  },

  /** Banner */
  bannerWrapper: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerTextWrapper: {
    position: 'absolute',
    top: '50%',
    left: 20,
    transform: [{ translateY: -12 }],
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    fontFamily: 'Inter',
    lineHeight: 24,
    letterSpacing: 0,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowRadius: 4,
  },
  bannerRightText: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bannerRightTextLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowRadius: 4,
  },

  /** Search Row (old - not used) */
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  categoryBtn: {
    backgroundColor: '#1FC58E',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  couponBtn: {
    backgroundColor: '#394B70',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  categoryText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },

  /** Mint Card */
  mintCard: {
    backgroundColor: '#1A2D48',
    borderRadius: 16,
    padding: 20,
    marginBottom: 28,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cloudIcon: {
    marginRight: 16,
  },
  mintTitle: {
    color: '#A8B7D8',
    fontSize: 14,
  },
  mintAmount: {
    color: '#7DFFA4',
    fontSize: 26,
    fontWeight: '800',
  },

  /** Section */
  sectionHeaderRow: {
    display: 'flex',
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#FFF',
    fontFamily: 'Inter',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
    letterSpacing: 0,
  },

  /** Category Tags */
  tag: {
    backgroundColor: '#394B70',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  tagSelected: {
    backgroundColor: '#1FC58E',
  },
  tagText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  /** Reward Grid */
  rewardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 10,
    marginBottom: 32,
  },
  rewardCard: {
    // (화면너비 - 패딩32 - gap20) / 3
    width: (Dimensions.get('window').width - 32 - 20) / 3,
    flexShrink: 0,
  },
  rewardImageContainer: {
    width: '100%',
    aspectRatio: 100 / 130,
    borderRadius: 10,
    backgroundColor: '#D9D9D9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    overflow: 'hidden',
  },
  rewardImage: {
    width: '100%',
    height: '100%',
  },
  rewardInfo: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 5,
    alignSelf: 'stretch',
  },
  rewardBrand: {
    color: '#FFF',
    fontFamily: 'Pretendard',
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 16,
    letterSpacing: -0.12,
  },
  rewardTitle: {
    color: '#FFF',
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 14,
    letterSpacing: -0.18,
  },
  rewardPriceBadge: {
    flexDirection: 'row',
    width: 47,
    paddingVertical: 2,
    paddingHorizontal: 5,
    alignItems: 'center',
    gap: 3,
    borderRadius: 14,
    backgroundColor: '#76C7AD',
  },
  rewardPrice: {
    color: '#FFF',
    textAlign: 'right',
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
    letterSpacing: -0.18,
  },

  countText: {
    color: '#76C7AD',
    fontFamily: 'Pretendard',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: -0.16,
  },
  loadingText: {
    textAlign: 'center',
    color: '#A8B7D8',
    marginTop: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 20,
  },
});

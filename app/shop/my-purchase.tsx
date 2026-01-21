import { ClaimedReward, pointsApi, rewardApi } from '@/services/api';
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
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Defs, Path, RadialGradient, Stop } from 'react-native-svg';

type TabType = 'day-pass' | 'available' | 'used';

export default function MyPurchaseScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('available');
  const [userMint, setUserMint] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [coupons, setCoupons] = useState<ClaimedReward[]>([]);

  const fetchUserPoints = async () => {
    try {
      const data = await pointsApi.getPoints();
      setUserMint(data.total_points);
    } catch (err) {
      // Ignore
    }
  };

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await rewardApi.getClaimedRewards();
      setCoupons(res.claimed_rewards || []);
    } catch (e) {
      Alert.alert('Error', 'Failed to load purchase list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserPoints();
    fetchCoupons();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchUserPoints();
      fetchCoupons();
    }, []),
  );

  // Filter coupons based on active tab
  const getFilteredCoupons = () => {
    if (activeTab === 'day-pass') {
      // Day Pass는 별도 처리 필요 (현재는 빈 배열)
      return [];
    } else if (activeTab === 'available') {
      return coupons.filter((c) => !c.used_at);
    } else {
      return coupons.filter((c) => c.used_at);
    }
  };

  const filteredCoupons = getFilteredCoupons();

  // Day Pass 데이터 (임시 - 나중에 API로 가져올 수 있음)
  const [dayPassData, setDayPassData] = useState<{
    days: number;
    expiresAt: string | null;
  } | null>(null);

  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  // Day Pass 남은 시간 계산 및 실시간 업데이트
  useEffect(() => {
    if (!dayPassData?.expiresAt) {
      setTimeLeft(null);
      return;
    }

    const updateTimeLeft = () => {
      const now = new Date().getTime();
      const expires = new Date(dayPassData.expiresAt!).getTime();
      const diff = expires - now;

      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} left`,
      );
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [dayPassData]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable onPress={() => router.back()}>
            <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <Path
                d="M10.6058 3.07206C10.681 2.9925 10.7397 2.89891 10.7788 2.79664C10.8178 2.69436 10.8363 2.5854 10.8332 2.47599C10.8301 2.36657 10.8055 2.25883 10.7607 2.15893C10.716 2.05902 10.652 1.9689 10.5725 1.89372C10.4929 1.81854 10.3993 1.75977 10.297 1.72075C10.1948 1.68174 10.0858 1.66325 9.97639 1.66635C9.86697 1.66944 9.75923 1.69406 9.65933 1.73879C9.55942 1.78353 9.46931 1.8475 9.39413 1.92706L2.31079 9.42706C2.16451 9.58178 2.08301 9.78663 2.08301 9.99956C2.08301 10.2125 2.16451 10.4173 2.31079 10.5721L9.39413 18.0729C9.46881 18.1542 9.55891 18.2198 9.65918 18.266C9.75945 18.3122 9.8679 18.338 9.97823 18.3419C10.0886 18.3459 10.1986 18.3278 10.3019 18.2889C10.4052 18.2499 10.4997 18.1908 10.58 18.115C10.6602 18.0392 10.7246 17.9482 10.7694 17.8473C10.8142 17.7464 10.8386 17.6376 10.841 17.5273C10.8434 17.4169 10.8238 17.3072 10.7834 17.2044C10.7431 17.1016 10.6827 17.0079 10.6058 16.9287L4.06246 9.99956L10.6058 3.07206Z"
                fill="white"
              />
            </Svg>
          </Pressable>
          <ThemedText style={styles.headerTitle}>My Purchase</ThemedText>
        </View>
        <View style={styles.mintBadge}>
          <View style={styles.mintIconContainer}>
            <Svg width="26" height="16" viewBox="0 0 26 16" fill="none">
              <Path
                d="M26 7.93746V8.44855C26 9.17179 25.5789 9.78656 24.9296 10.2012C25.7342 10.8232 26.1647 11.7441 25.92 12.612L25.7765 13.0942C25.3813 14.4804 23.4241 15.0108 21.7773 14.1815L20.2812 13.4317C19.8558 13.2212 19.4801 12.9185 19.1802 12.5445C18.9389 12.8886 18.6698 13.2111 18.3756 13.5088C17.5932 14.3118 16.6512 14.9326 15.6136 15.3288C14.576 15.7251 13.4673 15.8876 12.363 15.8053C11.2586 15.7229 10.1845 15.3976 9.21383 14.8516C8.24317 14.3055 7.39872 13.5515 6.738 12.641C6.45213 12.9673 6.10695 13.2334 5.72174 13.4245L4.22558 14.1742C2.57885 15.0035 0.631008 14.4732 0.226384 13.0869L0.0828579 12.6048C-0.152389 11.7465 0.268722 10.8256 1.07327 10.194C0.423985 9.77932 0.00288208 9.15732 0.00288208 8.44131V7.93746C0.0132505 7.59598 0.106971 7.26261 0.27546 6.96781C0.443949 6.67301 0.681828 6.42619 0.967388 6.2499C0.261648 5.68577 -0.140606 4.86369 0.0452391 4.05606L0.158153 3.55942C0.471031 2.20455 2.27536 1.54641 3.93855 2.18527L5.49121 2.78556C5.88189 2.93367 6.24297 3.15341 6.55685 3.43406C7.26949 2.36734 8.22692 1.49633 9.34495 0.897587C10.463 0.298841 11.7074 -0.00930872 12.9688 0.000214193C14.2303 0.0097371 15.4701 0.336647 16.5794 0.952207C17.6887 1.56777 18.6335 2.45313 19.3308 3.5305C19.6676 3.20049 20.0683 2.9467 20.507 2.78556L22.0573 2.18527C23.7228 1.54641 25.5248 2.20455 25.8377 3.55942L25.9506 4.05606C26.1365 4.86369 25.7412 5.68577 25.0284 6.2499C25.3153 6.42532 25.5546 6.67178 25.7243 6.96663C25.8941 7.26149 25.9889 7.5953 26 7.93746Z"
                fill="url(#paint0_radial_mypurchase)"
              />
              <Defs>
                <RadialGradient
                  id="paint0_radial_mypurchase"
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

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'day-pass' && styles.activeTab]}
          onPress={() => setActiveTab('day-pass')}
        >
          <ThemedText style={[styles.tabText, activeTab === 'day-pass' && styles.activeTabText]}>
            Day Pass
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'available' && styles.activeTab]}
          onPress={() => setActiveTab('available')}
        >
          <ThemedText style={[styles.tabText, activeTab === 'available' && styles.activeTabText]}>
            Available
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'used' && styles.activeTab]}
          onPress={() => setActiveTab('used')}
        >
          <ThemedText style={[styles.tabText, activeTab === 'used' && styles.activeTabText]}>
            Used
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ThemedText style={styles.emptyText}>Loading...</ThemedText>
        ) : activeTab === 'day-pass' ? (
          dayPassData ? (
            <DayPassCard days={dayPassData.days} timeLeft={timeLeft} />
          ) : (
            <View style={styles.dayPassEmptyContainer}>
              <Image
                source={require('@/assets/images/face-2-2.png')}
                style={styles.dayPassEmptyImage}
                resizeMode="contain"
              />
              <Svg width="130" height="46" viewBox="0 0 130 46" fill="none">
                <Path
                  d="M15.936 36.3333C12.5016 36.3333 9.59688 35.5873 7.22173 34.0952C4.84658 32.6032 3.04918 30.5397 1.82951 27.9048C0.609835 25.2698 0 22.2381 0 18.8095C0 15.4127 0.609835 12.3968 1.82951 9.76191C3.04918 7.09524 4.84658 5.01587 7.22173 3.52381C9.59688 2 12.5016 1.2381 15.936 1.2381C19.3703 1.2381 22.259 2 24.602 3.52381C26.9772 5.01587 28.7746 7.09524 29.9943 9.76191C31.2139 12.3968 31.8238 15.4127 31.8238 18.8095C31.8238 22.2381 31.2139 25.2698 29.9943 27.9048C28.7746 30.5397 26.9772 32.6032 24.602 34.0952C22.259 35.5873 19.3703 36.3333 15.936 36.3333ZM6.06625 18.0476C6.06625 19.0317 6.30698 19.9683 6.78843 20.8571C7.26988 21.7143 8.21672 22.4127 9.62897 22.9524C11.0412 23.4603 13.1436 23.7143 15.936 23.7143C18.7284 23.7143 20.8146 23.4603 22.1948 22.9524C23.607 22.4127 24.5539 21.7143 25.0353 20.8571C25.5168 19.9683 25.7575 19.0317 25.7575 18.0476C25.7575 17.0317 25.5168 16.127 25.0353 15.3333C24.5539 14.5079 23.607 13.8571 22.1948 13.381C20.8146 12.873 18.7284 12.619 15.936 12.619C13.1436 12.619 11.0412 12.873 9.62897 13.381C8.21672 13.8571 7.26988 14.5079 6.78843 15.3333C6.30698 16.127 6.06625 17.0317 6.06625 18.0476Z"
                  fill="#FEF5E7"
                />
                <Path
                  d="M45.7997 36.2857C42.0444 36.2857 39.0434 35.1905 36.7966 33C34.5819 30.7778 33.4746 27.6508 33.4746 23.619C33.4746 21.1429 33.9881 18.9683 35.0152 17.0952C36.0423 15.2222 37.4706 13.7619 39.3001 12.7143C41.1617 11.6349 43.3283 11.0952 45.7997 11.0952C48.56 11.0952 50.8549 11.6349 52.6844 12.7143C54.5139 13.7619 55.878 15.2222 56.7767 17.0952C57.7075 18.9683 58.1729 21.1429 58.1729 23.619C58.1729 27.6508 57.1458 30.7778 55.0917 33C53.0696 35.1905 49.9722 36.2857 45.7997 36.2857ZM39.2038 22.8095C39.2038 23.7937 39.7013 24.4921 40.6963 24.9048C41.6913 25.2857 43.3924 25.4762 45.7997 25.4762C48.2069 25.4762 49.9081 25.2857 50.903 24.9048C51.898 24.4921 52.3955 23.7937 52.3955 22.8095C52.3955 21.8571 51.898 21.1905 50.903 20.8095C49.9081 20.4286 48.2069 20.2381 45.7997 20.2381C43.3924 20.2381 41.6913 20.4286 40.6963 20.8095C39.7013 21.1905 39.2038 21.8571 39.2038 22.8095Z"
                  fill="#FEF5E7"
                />
                <Path
                  d="M77.0867 36.1905C75.3214 36.1905 73.845 35.6508 72.6574 34.5714C71.5019 33.4921 70.7637 32.0952 70.4427 30.381H69.5761V41.3333C69.5761 42.6349 69.207 43.7302 68.4688 44.619C67.7306 45.5397 66.6072 46 65.0986 46C63.6543 46 62.5309 45.5397 61.7285 44.619C60.9582 43.7302 60.573 42.6032 60.573 41.2381V23.4286C60.573 21.8413 60.5088 20.5079 60.3804 19.4286C60.2841 18.3175 60.1879 17.3175 60.0916 16.4286C59.9632 15.0952 60.236 13.9683 60.91 13.0476C61.5841 12.0952 62.6753 11.5238 64.1839 11.3333C66.1418 11.0794 67.5219 11.4286 68.3243 12.381C69.1589 13.3016 69.5761 14.746 69.5761 16.7143V19L69.7687 19.0476C69.9292 17.8095 70.2983 16.6032 70.876 15.4286C71.4859 14.2222 72.3364 13.2381 73.4277 12.4762C74.519 11.6825 75.8991 11.2857 77.5682 11.2857C80.3606 11.2857 82.4308 12.3968 83.7788 14.619C85.159 16.8095 85.8491 19.746 85.8491 23.4286C85.8491 31.9365 82.9283 36.1905 77.0867 36.1905ZM69.3835 23.3333C69.3835 23.8413 69.4477 24.2381 69.5761 24.5238C69.7687 25.127 70.1699 25.5714 70.7797 25.8571C71.4217 26.1111 72.3685 26.2381 73.6203 26.2381C75.2251 26.2381 76.3164 26 76.8941 25.5238C77.504 25.0476 77.8089 24.3175 77.8089 23.3333C77.8089 22.3175 77.52 21.5873 76.9423 21.1429C76.3645 20.6667 75.2733 20.4286 73.6684 20.4286C72.3846 20.4286 71.4217 20.5714 70.7797 20.8571C70.1699 21.1111 69.7687 21.5397 69.5761 22.1429C69.4477 22.4286 69.3835 22.8254 69.3835 23.3333Z"
                  fill="#FEF5E7"
                />
                <Path
                  d="M100.386 36.8095C98.1712 36.8095 96.117 36.6032 94.2233 36.1905C92.3617 35.746 90.8692 35.0635 89.7458 34.1429C88.6224 33.1905 88.0607 31.9365 88.0607 30.381C88.0607 29.0159 88.478 27.8889 89.3125 27C90.147 26.1111 91.2543 25.6667 92.6345 25.6667C93.5011 25.6667 94.3677 25.8095 95.2343 26.0952C96.133 26.3492 97.0799 26.6032 98.0749 26.8571C99.0699 27.1111 100.145 27.2381 101.301 27.2381C102.328 27.2381 103.018 27.1905 103.371 27.0952C103.724 26.9683 103.9 26.746 103.9 26.4286C103.9 26.0476 103.676 25.7937 103.226 25.6667C102.809 25.5397 102.087 25.381 101.06 25.1905L97.5934 24.5238C96.1491 24.2381 94.7368 23.873 93.3567 23.4286C92.0086 22.9524 90.8852 22.254 89.9865 21.3333C89.1199 20.4127 88.6866 19.1587 88.6866 17.5714C88.6866 15.4127 89.6495 13.7302 91.5753 12.5238C93.5332 11.3175 96.3577 10.7143 100.049 10.7143C102.167 10.7143 104.061 10.9206 105.73 11.3333C107.431 11.746 108.779 12.3651 109.774 13.1905C110.769 13.9841 111.267 14.9841 111.267 16.1905C111.299 17.4921 110.946 18.5397 110.207 19.3333C109.469 20.127 108.538 20.5238 107.415 20.5238C106.613 20.5238 105.794 20.4286 104.96 20.2381C104.157 20.0159 103.275 19.7937 102.312 19.5714C101.381 19.3175 100.306 19.1746 99.0859 19.1429C98.2193 19.0794 97.5132 19.127 96.9675 19.2857C96.4219 19.4444 96.1491 19.6984 96.1491 20.0476C96.1491 20.4286 96.47 20.6984 97.112 20.8571C97.7539 20.9841 98.7168 21.1587 100.001 21.381L103.419 22C105.505 22.3492 107.158 22.7937 108.378 23.3333C109.63 23.8413 110.528 24.5556 111.074 25.4762C111.62 26.3968 111.892 27.6667 111.892 29.2857C111.892 30.9683 111.395 32.381 110.4 33.5238C109.437 34.6349 108.089 35.4603 106.356 36C104.623 36.5397 102.633 36.8095 100.386 36.8095Z"
                  fill="#FEF5E7"
                />
                <Path
                  d="M116.805 6.57143C116.773 5.42857 116.966 4.36508 117.383 3.38095C117.832 2.36508 118.554 1.55556 119.549 0.952383C120.544 0.317461 121.828 0 123.401 0C125.006 0 126.29 0.317461 127.253 0.952383C128.248 1.55556 128.954 2.36508 129.371 3.38095C129.82 4.36508 130.029 5.42857 129.997 6.57143C129.965 7.61905 129.804 8.60318 129.515 9.52381C129.226 10.4444 128.889 11.3968 128.504 12.381C128.119 13.3333 127.766 14.3968 127.445 15.5714C127.124 16.7143 126.916 18.0317 126.819 19.5238C126.723 20.7619 126.37 21.6825 125.76 22.2857C125.15 22.8571 124.364 23.1429 123.401 23.1429C122.406 23.1429 121.604 22.8571 120.994 22.2857C120.384 21.7143 120.047 20.7937 119.983 19.5238C119.886 18.0317 119.678 16.7143 119.357 15.5714C119.036 14.3968 118.683 13.3333 118.298 12.381C117.912 11.3968 117.575 10.4444 117.287 9.52381C116.998 8.60318 116.837 7.61905 116.805 6.57143ZM123.401 37.0952C121.507 37.0952 120.031 36.6032 118.972 35.619C117.912 34.6032 117.383 33.2698 117.383 31.619C117.383 29.9365 117.912 28.5714 118.972 27.5238C120.063 26.4762 121.539 25.9524 123.401 25.9524C125.198 25.9524 126.627 26.4762 127.686 27.5238C128.745 28.5397 129.275 29.8889 129.275 31.5714C129.275 33.2222 128.761 34.5556 127.734 35.5714C126.707 36.5873 125.263 37.0952 123.401 37.0952Z"
                  fill="#FEF5E7"
                />
              </Svg>
              <Pressable
                style={styles.goToDayPassButton}
                onPress={() => router.push('/shop/day-pass')}
              >
                <ThemedText style={styles.goToDayPassText}>Go see Day Pass Trials</ThemedText>
              </Pressable>
            </View>
          )
        ) : filteredCoupons.length === 0 ? (
          <ThemedText style={styles.emptyText}>
            {activeTab === 'available' ? 'No available purchases yet.' : 'No used purchases yet.'}
          </ThemedText>
        ) : (
          <View style={styles.grid}>
            {filteredCoupons.map((item) => (
              <PurchaseItem
                key={item.id}
                item={item}
                isUsed={activeTab === 'used'}
                onPress={() => {
                  router.push({
                    pathname: '/shop/my-purchase-coupon-detail',
                    params: {
                      coupon: JSON.stringify(item),
                    },
                  });
                }}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function DayPassCard({ days, timeLeft }: { days: number; timeLeft: string | null }) {
  return (
    <View style={styles.dayPassCard}>
      <ThemedText style={styles.dayPassTitle}>{days} Day</ThemedText>

      <View style={styles.dayPassFeatures}>
        <View style={styles.dayPassFeatureRow}>
          <Ionicons name="flash" size={20} color="#FFF" />
          <ThemedText style={styles.dayPassFeatureText}>Mint 1.3X collects</ThemedText>
        </View>

        <View style={styles.dayPassFeatureRow}>
          <Ionicons name="infinite-outline" size={20} color="#FFF" />
          <ThemedText style={styles.dayPassFeatureText}>Infinite AI Docent Chat</ThemedText>
        </View>

        <View style={styles.dayPassFeatureRow}>
          <Ionicons name="construct-outline" size={20} color="#FFF" />
          <ThemedText style={styles.dayPassFeatureText}>Automatic tour route generate</ThemedText>
        </View>
      </View>

      {timeLeft && (
        <View style={styles.timeLeftContainer}>
          <View style={styles.timeLeftDivider} />
          <ThemedText style={styles.timeLeftText}>{timeLeft}</ThemedText>
        </View>
      )}
    </View>
  );
}

function PurchaseItem({
  item,
  onPress,
  isUsed = false,
}: {
  item: ClaimedReward;
  onPress?: () => void;
  isUsed?: boolean;
}) {
  return (
    <Pressable style={styles.rewardCard} onPress={onPress}>
      <View style={[styles.rewardImageContainer, isUsed && styles.rewardImageContainerUsed]}>
        {item.rewards?.image_url ? (
          <Image
            source={{ uri: item.rewards.image_url }}
            style={[styles.rewardImage, isUsed && styles.rewardImageUsed]}
            resizeMode="cover"
          />
        ) : (
          <Ionicons name="gift" size={50} color={isUsed ? '#A0A0A0' : '#76C7AD'} />
        )}
        {isUsed && <View style={styles.usedOverlay} />}
      </View>
      <View style={styles.rewardInfo}>
        <ThemedText style={styles.rewardBrand} numberOfLines={1}>
          {item.rewards.type || 'Reward'}
        </ThemedText>
        <ThemedText style={styles.rewardTitle} numberOfLines={2}>
          {item.rewards.name}
        </ThemedText>
        <View style={styles.rewardPriceBadge}>
          <Svg width="13" height="8" viewBox="0 0 13 8" fill="none">
            <Path
              d="M13 4.01234V4.2707C13 4.63629 12.7895 4.94705 12.4648 5.15666C12.8671 5.47107 13.0823 5.9366 12.96 6.37531L12.8883 6.61904C12.6907 7.31976 11.712 7.58787 10.8887 7.16865L10.1406 6.78965C9.9279 6.68324 9.74007 6.53022 9.5901 6.34118C9.46947 6.51509 9.3349 6.67816 9.18782 6.82864C8.79662 7.23454 8.3256 7.54833 7.80681 7.74864C7.28802 7.94896 6.73366 8.0311 6.18148 7.98947C5.62929 7.94784 5.09225 7.7834 4.60692 7.50738C4.12158 7.23136 3.69936 6.85023 3.369 6.38993C3.22607 6.5549 3.05348 6.68943 2.86087 6.78599L2.11279 7.16499C1.28943 7.58421 0.315504 7.3161 0.113192 6.61538L0.041429 6.37165C-0.0761944 5.93781 0.134361 5.47229 0.536633 5.153C0.211993 4.94339 0.00144104 4.62898 0.00144104 4.26704V4.01234C0.00662526 3.83973 0.0534857 3.67121 0.13773 3.52219C0.221975 3.37317 0.340914 3.24841 0.483694 3.15929C0.130824 2.87412 -0.0703029 2.45857 0.0226196 2.05032L0.0790765 1.79927C0.235516 1.11439 1.13768 0.781702 1.96928 1.10464L2.7456 1.40809C2.94094 1.48295 3.12149 1.59403 3.27843 1.7359C3.63475 1.19668 4.11346 0.756388 4.67248 0.453726C5.23149 0.151063 5.8537 -0.00470551 6.48442 0.000108273C7.11515 0.00492205 7.73507 0.170173 8.28972 0.481336C8.84437 0.792498 9.31677 1.24004 9.66538 1.78465C9.8338 1.61783 10.0342 1.48954 10.2535 1.40809L11.0286 1.10464C11.8614 0.781702 12.7624 1.11439 12.9188 1.79927L12.9753 2.05032C13.0682 2.45857 12.8706 2.87412 12.5142 3.15929C12.6577 3.24797 12.7773 3.37255 12.8622 3.5216C12.9471 3.67064 12.9944 3.83938 13 4.01234Z"
              fill="#F5F5F5"
            />
          </Svg>
          <ThemedText style={styles.rewardPrice}>{item.rewards.point_cost}</ThemedText>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#34495E',
  },
  header: {
    width: '100%',
    height: 121,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    backgroundColor: '#34495E',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    borderBottomWidth: 4,
    borderBottomColor: '#76C7AD',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
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
  mintBadge: {
    width: 76,
    height: 47,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    borderRadius: 10,
    backgroundColor: '#76C7AD',
    flexDirection: 'row',
  },
  mintIconContainer: {
    width: 26,
    flexDirection: 'column',
    alignItems: 'center',
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
  mintValue: {
    color: '#FFF',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1B2630',
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#76C7AD',
  },
  tabText: {
    color: '#FFF',
    textAlign: 'center',
    fontFamily: 'Pretendard',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: -0.16,
  },
  activeTabText: {
    color: '#FFF',
    fontWeight: '400',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 10,
    marginBottom: 32,
  },
  rewardCard: {
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
  rewardImageContainerUsed: {
    backgroundColor: '#D9D9D9',
  },
  rewardImage: {
    width: '100%',
    height: '100%',
  },
  rewardImageUsed: {
    opacity: 0.5,
  },
  usedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(217, 217, 217, 0.5)',
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
  emptyText: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 40,
    fontSize: 14,
  },
  // Day Pass Card
  dayPassCard: {
    backgroundColor: '#76C7AD',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    alignItems: 'center',
  },
  dayPassTitle: {
    color: '#FFF',
    fontFamily: 'Inter',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
  },
  dayPassFeatures: {
    width: '100%',
    flexDirection: 'column',
    gap: 12,
    marginBottom: 20,
  },
  dayPassFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dayPassFeatureText: {
    color: '#FFF',
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  timeLeftContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
  },
  timeLeftDivider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 12,
  },
  timeLeftText: {
    color: '#FFF',
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
  },
  dayPassEmptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingTop: 60,
  },
  dayPassEmptyImage: {
    width: 150,
    height: 150,
  },
  goToDayPassButton: {
    width: 320,
    height: 50,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    borderRadius: 35,
    backgroundColor: '#FF7F50',
    marginTop: 40,
  },
  goToDayPassText: {
    color: '#FFF',
    fontFamily: 'Pretendard',
    fontSize: 16,
    fontWeight: '700',
  },
});

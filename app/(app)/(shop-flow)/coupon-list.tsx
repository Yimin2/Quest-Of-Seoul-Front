import { ClaimedReward, useClaimedRewards, usePoints, useUseReward } from '@shared/api';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@shared/ui';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

export default function MyCouponScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<'available' | 'used'>('available');

  // React Query Hooks
  const { data: pointsData, isLoading: isPointsLoading, error: pointsError, isError: isPointsError } = usePoints();
  const {
    data: rewardsData,
    isLoading: isCouponsLoading,
    error: couponsError,
    isError: isCouponsError,
  } = useClaimedRewards();
  const useRewardMutation = useUseReward();

  const userMint = pointsData?.total_points || 0;
  const coupons = rewardsData?.claimed_rewards || [];
  const loading = isCouponsLoading || isPointsLoading;

  // Error Handling
  useEffect(() => {
    if (isPointsError && pointsError) {
      Alert.alert('Error', 'Failed to load points data.');
    }
    if (isCouponsError && couponsError) {
      Alert.alert('Error', couponsError.message || 'Failed to load coupons.');
    }
  }, [isPointsError, pointsError, isCouponsError, couponsError]);

  // Day Pass 데이터 (추후 API 연동 필요)
  const [dayPassData, setDayPassData] = useState<{
    days: number;
    expiresAt: string | null;
  } | null>(null);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  // Day Pass 타이머
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

  const handleUseCoupon = async (id: number, name: string) => {
    Alert.alert('Use Coupon', `Would you like to use ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Use',
        onPress: () => {
          useRewardMutation.mutate(id, {
            onSuccess: (res) => {
              if (res.status === 'success') {
                Alert.alert('Used ✅', 'Coupon has been successfully used!');
              } else {
                Alert.alert('Error', 'This coupon has already been used.');
              }
            },
            onError: (error: any) => {
              Alert.alert('Error', error.message || 'An error occurred while using the coupon.');
            },
          });
        },
      },
    ]);
  };

  // Filter coupons
  const availableCoupons = coupons.filter((c) => !c.used_at);
  const usedCoupons = coupons.filter((c) => c.used_at);

  return (
    <ScrollView style={styles.container}>
      {/* 💎 Mint Card */}
      <View style={styles.mintCard}>
        <Ionicons name="cloud" size={60} color="#7DFFA4" style={styles.cloudIcon} />
        <View>
          <ThemedText style={styles.mintTitle}>You have</ThemedText>
          <ThemedText style={styles.mintAmount}>{userMint.toLocaleString()} mints</ThemedText>
        </View>
      </View>

      {/* 🎫 Day Pass Card */}
      {dayPassData ? (
        <DayPassCard days={dayPassData.days} timeLeft={timeLeft} />
      ) : (
        <Pressable
          style={styles.dayPassEmptyCard}
          onPress={() => router.push('/(app)/(shop-flow)/day-pass')}
        >
          <View style={styles.dayPassEmptyLeft}>
            <Ionicons name="ticket-outline" size={32} color="#76C7AD" />
            <View>
              <ThemedText style={styles.dayPassEmptyTitle}>No Day Pass</ThemedText>
              <ThemedText style={styles.dayPassEmptySubtitle}>Get premium benefits</ThemedText>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#7DFFA4" />
        </Pressable>
      )}

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <ThemedText style={styles.statNumber}>{availableCoupons.length}</ThemedText>
          <ThemedText style={styles.statLabel}>Available</ThemedText>
        </View>
        <View style={styles.statBox}>
          <ThemedText style={styles.statNumber}>{usedCoupons.length}</ThemedText>
          <ThemedText style={styles.statLabel}>Used</ThemedText>
        </View>
        <View style={styles.statBox}>
          <ThemedText style={styles.statNumber}>{coupons.length}</ThemedText>
          <ThemedText style={styles.statLabel}>Total</ThemedText>
        </View>
      </View>

      {/* Available Coupons */}
      <View style={{ marginTop: 20 }}>
        <ThemedText style={styles.sectionTitle}>Available Coupons</ThemedText>
        {loading ? (
          <ThemedText style={styles.emptyText}>Loading...</ThemedText>
        ) : availableCoupons.length === 0 ? (
          <ThemedText style={styles.emptyText}>You don't have any coupons yet.</ThemedText>
        ) : (
          availableCoupons.map((item) => (
            <CouponItem
              key={item.id}
              item={item}
              onUse={() => handleUseCoupon(item.id, item.rewards.name)}
              onPress={() =>
                router.push({
                  pathname: '/(app)/(shop-flow)/coupon-detail',
                  params: { mode: 'owned', coupon: JSON.stringify(item) },
                })
              }
            />
          ))
        )}
      </View>

      {/* Used Coupons */}
      {usedCoupons.length > 0 && (
        <View style={{ marginTop: 20, marginBottom: 40 }}>
          <ThemedText style={styles.sectionTitle}>Used Coupons</ThemedText>
          {usedCoupons.map((item) => (
            <CouponItem
              key={item.id}
              item={item}
              used
              onPress={() =>
                router.push({
                  pathname: '/(app)/(shop-flow)/coupon-detail',
                  params: { mode: 'owned', coupon: JSON.stringify(item) },
                })
              }
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

/* ----------------------- Coupon Item Component ----------------------- */

function CouponItem({
  item,
  used = false,
  onUse,
  onPress,
}: {
  item: ClaimedReward;
  used?: boolean;
  onUse?: () => void;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.couponCard, used && styles.usedCard]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.couponImgPlaceholder}>
        {item.rewards?.image_url ? (
          <Image
            source={{ uri: item.rewards.image_url }}
            style={styles.couponImage}
            resizeMode="cover"
          />
        ) : (
          <Ionicons name="gift" size={30} color={used ? '#666' : '#7DFFA4'} />
        )}
      </View>

      <View style={{ flex: 1 }}>
        <ThemedText style={styles.couponTitle}>{item.rewards.name}</ThemedText>
        <ThemedText style={styles.couponBrand}>{item.rewards.description || 'Reward'}</ThemedText>
        <ThemedText style={styles.dateText}>
          Acquired: {new Date(item.claimed_at).toLocaleDateString('en-US')}
        </ThemedText>
        {used && item.used_at && (
          <ThemedText style={styles.usedTag}>
            Used: {new Date(item.used_at).toLocaleDateString('en-US')}
          </ThemedText>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {/* QR Code */}
        <TouchableOpacity style={styles.qrButton}>
          <Ionicons name="qr-code" size={20} color="#fff" />
        </TouchableOpacity>

        {/* Use button */}
        {!used && onUse && (
          <TouchableOpacity
            style={styles.useButton}
            onPress={(e) => {
              e.stopPropagation?.();
              onUse();
            }}
          >
            <ThemedText style={styles.useText}>Use</ThemedText>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1A2A',
    padding: 16,
    paddingTop: 60,
  },

  /** Header */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },

  /** Mint Card */
  mintCard: {
    backgroundColor: '#1A2D48',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cloudIcon: {
    marginRight: 14,
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

  /** Tabs */
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#32425A',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#7DFFA4',
  },
  tabText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  /** Stats */
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#1A2D48',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#7DFFA4',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#A8B7D8',
  },

  /** Section */
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 20,
    marginBottom: 20,
  },

  /** Coupon Item */
  couponCard: {
    flexDirection: 'row',
    backgroundColor: '#1A2D48',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  usedCard: {
    opacity: 0.6,
  },
  couponImgPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#0F1A2A',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  couponImage: {
    width: '100%',
    height: '100%',
  },
  couponTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  couponBrand: {
    color: '#A3B4CF',
    fontSize: 12,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 11,
    color: '#8899bb',
  },
  usedTag: {
    marginTop: 4,
    fontSize: 11,
    color: '#FF6B6B',
  },

  /** Actions */
  actions: {
    alignItems: 'center',
    gap: 8,
  },
  qrButton: {
    backgroundColor: '#394B70',
    padding: 10,
    borderRadius: 10,
  },
  useButton: {
    backgroundColor: '#1FC58E',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  useText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },

  /** Day Pass Empty Card */
  dayPassEmptyCard: {
    flexDirection: 'row',
    backgroundColor: '#1A2D48',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#76C7AD',
    borderStyle: 'dashed',
  },
  dayPassEmptyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dayPassEmptyTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  dayPassEmptySubtitle: {
    color: '#A8B7D8',
    fontSize: 12,
  },

  /** Day Pass Card */
  dayPassCard: {
    backgroundColor: '#76C7AD',
    borderRadius: 16,
    padding: 20,
    marginTop: 12,
    alignItems: 'center',
  },
  dayPassTitle: {
    color: '#FFF',
    fontFamily: 'Inter',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  dayPassFeatures: {
    width: '100%',
    flexDirection: 'column',
    gap: 10,
  },
  dayPassFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dayPassFeatureText: {
    color: '#FFF',
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '500',
  },
  timeLeftContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
  },
  timeLeftDivider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 10,
  },
  timeLeftText: {
    color: '#FFF',
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
  },
});

/* ----------------------- Day Pass Card Component ----------------------- */
function DayPassCard({ days, timeLeft }: { days: number; timeLeft: string | null }) {
  return (
    <View style={styles.dayPassCard}>
      <ThemedText style={styles.dayPassTitle}>{days} Day Pass</ThemedText>
      <View style={styles.dayPassFeatures}>
        <View style={styles.dayPassFeatureRow}>
          <Ionicons name="flash" size={18} color="#FFF" />
          <ThemedText style={styles.dayPassFeatureText}>Mint 1.3X collects</ThemedText>
        </View>
        <View style={styles.dayPassFeatureRow}>
          <Ionicons name="infinite-outline" size={18} color="#FFF" />
          <ThemedText style={styles.dayPassFeatureText}>Infinite AI Docent Chat</ThemedText>
        </View>
        <View style={styles.dayPassFeatureRow}>
          <Ionicons name="construct-outline" size={18} color="#FFF" />
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

import { ClaimedReward, pointsApi, rewardApi } from '@shared/api';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { ThemedText } from '@shared/ui';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function MyCouponScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<'available' | 'used'>('available');
  const [userMint, setUserMint] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [coupons, setCoupons] = useState<ClaimedReward[]>([]);

  const fetchUserPoints = async () => {
    try {
      const data = await pointsApi.getPoints();
      setUserMint(data.total_points);
    } catch (err) {}
  };

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await rewardApi.getClaimedRewards();
      setCoupons(res.claimed_rewards || []);
    } catch (e) {
      Alert.alert('Error', 'Failed to load coupon list.');
    } finally {
      setLoading(false);
    }
  };

  const handleUseCoupon = async (id: number, name: string) => {
    Alert.alert('Use Coupon', `Would you like to use ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Use',
        onPress: async () => {
          try {
            const res = await rewardApi.useReward(id);
            if (res.status === 'success') {
              Alert.alert('Used ✅', 'Coupon has been successfully used!');
              fetchCoupons();
            } else {
              Alert.alert('Error', 'This coupon has already been used.');
            }
          } catch (e: any) {
            Alert.alert('Error', e.message || 'An error occurred while using the coupon.');
          }
        },
      },
    ]);
  };

  useEffect(() => {
    fetchUserPoints();
    fetchCoupons();
  }, []);

  // Refresh when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchUserPoints();
      fetchCoupons();
    }, []),
  );

  // Filter coupons
  const availableCoupons = coupons.filter((c) => !c.used_at);
  const usedCoupons = coupons.filter((c) => c.used_at);

  return (
    <ScrollView style={styles.container}>
      {/* 🔙 Back Button + Title */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={30} color="#fff" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>My Coupon</ThemedText>
        <View style={{ width: 30 }} />
      </View>

      {/* 💎 Mint Card */}
      <View style={styles.mintCard}>
        <Ionicons name="cloud" size={60} color="#7DFFA4" style={styles.cloudIcon} />
        <View>
          <ThemedText style={styles.mintTitle}>You have</ThemedText>
          <ThemedText style={styles.mintAmount}>{userMint.toLocaleString()} mints</ThemedText>
        </View>
      </View>

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
            />
          ))
        )}
      </View>

      {/* Used Coupons */}
      {usedCoupons.length > 0 && (
        <View style={{ marginTop: 20, marginBottom: 40 }}>
          <ThemedText style={styles.sectionTitle}>Used Coupons</ThemedText>
          {usedCoupons.map((item) => (
            <CouponItem key={item.id} item={item} used />
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
}: {
  item: ClaimedReward;
  used?: boolean;
  onUse?: () => void;
}) {
  return (
    <View style={[styles.couponCard, used && styles.usedCard]}>
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
          <TouchableOpacity style={styles.useButton} onPress={onUse}>
            <ThemedText style={styles.useText}>Use</ThemedText>
          </TouchableOpacity>
        )}
      </View>
    </View>
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
});

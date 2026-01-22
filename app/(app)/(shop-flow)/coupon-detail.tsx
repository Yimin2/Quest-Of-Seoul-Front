import { Reward, rewardApi } from '@shared/api';
import { usePointsStore } from '@entities/points';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@shared/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { ClipPath, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

export default function CouponDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [reward, setReward] = useState<Reward | null>(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const { fetchPoints } = usePointsStore();

  // Parse reward data from params
  useEffect(() => {
    if (params.reward) {
      try {
        const rewardData = JSON.parse(params.reward as string);
        setReward(rewardData);
      } catch (e) {
        // Ignore
      }
    }
  }, [params.reward]);

  const handleShowConfirmModal = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmPurchase = async () => {
    if (!reward) return;

    try {
      setLoading(true);
      setShowConfirmModal(false);
      const res = await rewardApi.claim(reward.id);
      if (res.status === 'success') {
        Alert.alert(
          'Purchase Complete! 🎉',
          `You have purchased ${reward.name}!\n\nQR Code: ${res.qr_code}\n\nCheck it in My Coupon.`,
          [
            {
              text: 'OK',
              onPress: () => {
                fetchPoints();
                router.back();
              },
            },
          ],
        );
      } else {
        Alert.alert(
          'Insufficient Points 💸',
          `Required: ${res.required}\nCurrent: ${res.current}\nShortage: ${res.shortage}`,
        );
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'An error occurred during purchase.');
    } finally {
      setLoading(false);
    }
  };

  if (!reward) {
    return (
      <View style={styles.container}>
        <ThemedText style={styles.loadingText}>Loading...</ThemedText>
      </View>
    );
  }

  const category = (params.category as string) || 'Coupon';

  return (
    <View style={styles.container}>
      {/* Image Container with Header */}
      <View style={styles.imageContainer}>
        {reward.image_url ? (
          <Image source={{ uri: reward.image_url }} style={styles.couponImage} resizeMode="cover" />
        ) : (
          <Ionicons name="gift" size={120} color="#76C7AD" />
        )}
      </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.contentContainer}>
        {/* Category Badge */}
        <View style={styles.categoryBadge}>
          <ThemedText style={styles.categoryText}>{category}</ThemedText>
          <Pressable style={styles.relatedButton}>
            <ThemedText style={styles.relatedText} numberOfLines={1}>
              See Related Coupons
            </ThemedText>
          </Pressable>
        </View>

        {/* Product Info */}
        <View style={styles.productInfoContainer}>
          <ThemedText style={styles.brandText}>{category}</ThemedText>
          <ThemedText style={styles.productName}>{reward.name}</ThemedText>
          <View style={styles.priceContainer}>
            <Svg width="47" height="20" viewBox="0 0 47 20">
              <Defs>
                <LinearGradient id="mintGradient" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0" stopColor="#76C7AD" />
                  <Stop offset="1" stopColor="#3A6154" />
                </LinearGradient>
              </Defs>
              <Rect width="47" height="20" rx="14" fill="url(#mintGradient)" />
              <G transform="translate(5, 6)">
                <Path
                  d="M13 4.01234V4.2707C13 4.63629 12.7895 4.94705 12.4648 5.15666C12.8671 5.47107 13.0823 5.9366 12.96 6.37531L12.8883 6.61904C12.6907 7.31976 11.712 7.58787 10.8887 7.16865L10.1406 6.78965C9.9279 6.68324 9.74007 6.53022 9.5901 6.34118C9.46947 6.51509 9.3349 6.67816 9.18782 6.82864C8.79662 7.23454 8.3256 7.54833 7.80681 7.74864C7.28802 7.94896 6.73366 8.0311 6.18148 7.98947C5.62929 7.94784 5.09225 7.7834 4.60692 7.50738C4.12158 7.23136 3.69936 6.85023 3.369 6.38993C3.22607 6.5549 3.05348 6.68943 2.86087 6.78599L2.11279 7.16499C1.28943 7.58421 0.315504 7.3161 0.113192 6.61538L0.041429 6.37165C-0.0761944 5.93781 0.134361 5.47229 0.536633 5.153C0.211993 4.94339 0.00144104 4.62898 0.00144104 4.26704V4.01234C0.00662526 3.83973 0.0534857 3.67121 0.13773 3.52219C0.221975 3.37317 0.340914 3.24841 0.483694 3.15929C0.130824 2.87412 -0.0703029 2.45857 0.0226196 2.05032L0.0790765 1.79927C0.235516 1.11439 1.13768 0.781702 1.96928 1.10464L2.7456 1.40809C2.94094 1.48295 3.12149 1.59403 3.27843 1.7359C3.63475 1.19668 4.11346 0.756388 4.67248 0.453726C5.23149 0.151063 5.8537 -0.00470551 6.48442 0.000108273C7.11515 0.00492205 7.73507 0.170173 8.28972 0.481336C8.84437 0.792498 9.31677 1.24004 9.66538 1.78465C9.8338 1.61783 10.0342 1.48954 10.2535 1.40809L11.0286 1.10464C11.8614 0.781702 12.7624 1.11439 12.9188 1.79927L12.9753 2.05032C13.0682 2.45857 12.8706 2.87412 12.5142 3.15929C12.6577 3.24797 12.7773 3.37255 12.8622 3.5216C12.9471 3.67064 12.9944 3.83938 13 4.01234Z"
                  fill="#F5F5F5"
                />
              </G>
            </Svg>
            <ThemedText style={styles.priceText}>{reward.point_cost}</ThemedText>
          </View>
        </View>

        {/* Overview Section */}
        <ThemedText style={styles.sectionTitle}>OverView</ThemedText>
        <ThemedText style={styles.descriptionText}>
          {reward.description || 'Standard coupon'}
        </ThemedText>

        {/* Usage Section */}
        <ThemedText style={styles.sectionTitle}>Usage of redemption</ThemedText>
        <ThemedText style={styles.descriptionText}>Anywhere</ThemedText>
      </ScrollView>

      {/* Bottom CTA Button */}
      <View style={styles.bottomContainer}>
        <Pressable
          style={[styles.ctaButton, loading && styles.ctaButtonDisabled]}
          onPress={handleShowConfirmModal}
          disabled={loading}
        >
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <Path
              d="M12.586 2.586C12.211 2.2109 11.7024 2.00011 11.172 2H4C3.46957 2 2.96086 2.21071 2.58579 2.58579C2.21071 2.96086 2 3.46957 2 4V11.172C2.00011 11.7024 2.2109 12.211 2.586 12.586L10.586 20.586C10.9611 20.9609 11.4697 21.1716 12 21.1716C12.5303 21.1716 13.0389 20.9609 13.414 20.586L20.586 13.414C20.9609 13.0389 21.1716 12.5303 21.1716 12C21.1716 11.4697 20.9609 10.9611 20.586 10.586L12.586 2.586ZM7 9C6.46943 8.99987 5.96065 8.78897 5.58558 8.41371C5.21051 8.03845 4.99987 7.52957 5 6.999C5.00013 6.46843 5.21103 5.95965 5.58629 5.58458C5.96155 5.20951 6.47043 4.99887 7.001 4.999C7.53157 4.99913 8.04035 5.21003 8.41542 5.58529C8.79049 5.96055 9.00113 6.46943 9.001 7C9.00087 7.53057 8.78997 8.03935 8.41471 8.41442C8.03945 8.78949 7.53057 9.00013 7 9Z"
              fill="white"
            />
          </Svg>
          <ThemedText style={styles.ctaText}>{loading ? 'Processing...' : 'Get Coupon'}</ThemedText>
        </Pressable>
      </View>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowConfirmModal(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <ThemedText style={styles.modalTitle}>Get this coupon?</ThemedText>
            <ThemedText style={styles.modalSubtitle}>Would you like to get this coupon?</ThemedText>

            {/* Coupon Preview Image */}
            <View style={styles.modalImageContainer}>
              {reward.image_url ? (
                <Image
                  source={{ uri: reward.image_url }}
                  style={styles.modalImage}
                  resizeMode="cover"
                />
              ) : (
                <Ionicons name="gift" size={60} color="#76C7AD" />
              )}
            </View>

            {/* Product Info - Same structure as detail page */}
            <View style={styles.modalProductInfo}>
              <ThemedText style={styles.modalBrandText}>{category}</ThemedText>
              <ThemedText style={styles.modalProductName} numberOfLines={2}>
                {reward.name}
              </ThemedText>
              <View style={styles.priceContainer}>
                <Svg width="47" height="20" viewBox="0 0 47 20">
                  <Defs>
                    <LinearGradient id="mintGradientModal" x1="0" y1="0" x2="1" y2="0">
                      <Stop offset="0" stopColor="#76C7AD" />
                      <Stop offset="1" stopColor="#3A6154" />
                    </LinearGradient>
                  </Defs>
                  <Rect width="47" height="20" rx="14" fill="url(#mintGradientModal)" />
                  <G transform="translate(5, 6)">
                    <Path
                      d="M13 4.01234V4.2707C13 4.63629 12.7895 4.94705 12.4648 5.15666C12.8671 5.47107 13.0823 5.9366 12.96 6.37531L12.8883 6.61904C12.6907 7.31976 11.712 7.58787 10.8887 7.16865L10.1406 6.78965C9.9279 6.68324 9.74007 6.53022 9.5901 6.34118C9.46947 6.51509 9.3349 6.67816 9.18782 6.82864C8.79662 7.23454 8.3256 7.54833 7.80681 7.74864C7.28802 7.94896 6.73366 8.0311 6.18148 7.98947C5.62929 7.94784 5.09225 7.7834 4.60692 7.50738C4.12158 7.23136 3.69936 6.85023 3.369 6.38993C3.22607 6.5549 3.05348 6.68943 2.86087 6.78599L2.11279 7.16499C1.28943 7.58421 0.315504 7.3161 0.113192 6.61538L0.041429 6.37165C-0.0761944 5.93781 0.134361 5.47229 0.536633 5.153C0.211993 4.94339 0.00144104 4.62898 0.00144104 4.26704V4.01234C0.00662526 3.83973 0.0534857 3.67121 0.13773 3.52219C0.221975 3.37317 0.340914 3.24841 0.483694 3.15929C0.130824 2.87412 -0.0703029 2.45857 0.0226196 2.05032L0.0790765 1.79927C0.235516 1.11439 1.13768 0.781702 1.96928 1.10464L2.7456 1.40809C2.94094 1.48295 3.12149 1.59403 3.27843 1.7359C3.63475 1.19668 4.11346 0.756388 4.67248 0.453726C5.23149 0.151063 5.8537 -0.00470551 6.48442 0.000108273C7.11515 0.00492205 7.73507 0.170173 8.28972 0.481336C8.84437 0.792498 9.31677 1.24004 9.66538 1.78465C9.8338 1.61783 10.0342 1.48954 10.2535 1.40809L11.0286 1.10464C11.8614 0.781702 12.7624 1.11439 12.9188 1.79927L12.9753 2.05032C13.0682 2.45857 12.8706 2.87412 12.5142 3.15929C12.6577 3.24797 12.7773 3.37255 12.8622 3.5216C12.9471 3.67064 12.9944 3.83938 13 4.01234Z"
                      fill="#F5F5F5"
                    />
                  </G>
                </Svg>
                <ThemedText style={styles.priceText}>{reward.point_cost}</ThemedText>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelButton}
                onPress={() => setShowConfirmModal(false)}
              >
                <Ionicons name="close" size={24} color="#FF7F50" />
              </Pressable>
              <Pressable style={styles.modalConfirmButton} onPress={handleConfirmPurchase}>
                <ThemedText style={styles.modalMintPrefix}>-</ThemedText>
                <Svg width="20" height="12" viewBox="0 0 20 12" fill="none">
                  <Path
                    d="M20 6.01851V6.40605C20 6.95444 19.6761 7.42058 19.1766 7.73499C19.7955 8.20661 20.1267 8.90489 19.9385 9.56296L19.8281 9.92856C19.5241 10.9796 18.0185 11.3818 16.7518 10.753L15.6009 10.1845C15.2737 10.0249 14.9847 9.79533 14.754 9.51177C14.5684 9.77264 14.3614 10.0172 14.1351 10.243C13.5333 10.8518 12.8086 11.3225 12.0105 11.623C11.2123 11.9234 10.3595 12.0467 9.50997 11.9842C8.66045 11.9218 7.83422 11.6751 7.08756 11.2611C6.3409 10.847 5.69133 10.2753 5.18307 9.5849C4.96318 9.83235 4.69766 10.0341 4.40134 10.179L3.25044 10.7475C1.98373 11.3763 0.485391 10.9742 0.174141 9.92307L0.0637369 9.55747C-0.117222 8.90671 0.20671 8.20843 0.825589 7.7295C0.326142 7.41509 0.00221698 6.94346 0.00221698 6.40056V6.01851C0.0101927 5.75959 0.0822858 5.50681 0.211893 5.28329C0.3415 5.05976 0.524483 4.87261 0.744145 4.73893C0.201267 4.31119 -0.108158 3.68785 0.0347993 3.07548L0.121656 2.6989C0.362332 1.67158 1.75028 1.17255 3.02966 1.65697L4.224 2.11213C4.52453 2.22443 4.80229 2.39105 5.04373 2.60385C5.59192 1.79501 6.3284 1.13458 7.18842 0.680588C8.04845 0.226594 9.00569 -0.00705826 9.97604 0.00016241C10.9464 0.00738308 11.9001 0.25526 12.7534 0.722003C13.6067 1.18875 14.3335 1.86007 14.8698 2.67697C15.1289 2.42675 15.4372 2.23431 15.7746 2.11213L16.9671 1.65697C18.2483 1.17255 19.6345 1.67158 19.8751 2.6989L19.962 3.07548C20.105 3.68785 19.8009 4.31119 19.2526 4.73893C19.4733 4.87195 19.6574 5.05882 19.788 5.28239C19.9185 5.50596 19.9915 5.75907 20 6.01851Z"
                    fill="white"
                  />
                </Svg>
                <ThemedText style={styles.modalMintAmount}>{reward.point_cost}</ThemedText>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#34495E',
  },
  imageContainer: {
    width: '100%',
    height: 263,
    backgroundColor: '#5B8A6F',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  couponImage: {
    width: '100%',
    height: '100%',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
  },
  menuButton: {
    padding: 8,
  },
  closeButton: {
    padding: 8,
  },
  scrollContent: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120,
  },
  categoryBadge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  categoryText: {
    color: '#FFF',
    fontFamily: 'Inter',
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 24,
    letterSpacing: 0,
  },
  relatedButton: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#4D647C',
    flexShrink: 0,
  },
  relatedText: {
    color: '#FFF',
    fontFamily: 'Pretendard',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: -0.16,
  },
  productInfoContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 15,
    marginBottom: 30,
    alignSelf: 'stretch',
  },
  brandText: {
    color: '#FFF',
    fontFamily: 'Pretendard',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    letterSpacing: -0.12,
  },
  productName: {
    color: '#FFF',
    fontFamily: 'Inter',
    fontSize: 20,
    fontWeight: '400',
    lineHeight: 24,
    letterSpacing: -0.18,
  },
  priceContainer: {
    width: 47,
    height: 20,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceText: {
    position: 'absolute',
    right: 5,
    top: 4,
    color: '#FFF',
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
    letterSpacing: -0.18,
  },
  sectionTitle: {
    color: '#FFF',
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
    letterSpacing: 0,
    marginBottom: 12,
  },
  descriptionText: {
    color: '#FFF',
    fontFamily: 'Pretendard',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    letterSpacing: 0,
    marginBottom: 24,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#34495E',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 40,
  },
  ctaButton: {
    backgroundColor: '#FF7F50',
    height: 56,
    borderRadius: 35,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  ctaButtonDisabled: {
    opacity: 0.6,
  },
  ctaText: {
    color: '#FFF',
    fontFamily: 'Pretendard',
    fontSize: 18,
    fontWeight: '700',
  },
  loadingText: {
    color: '#FFF',
    textAlign: 'center',
    marginTop: 100,
    fontSize: 16,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: 320,
    paddingHorizontal: 10,
    paddingTop: 40,
    paddingBottom: 20,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    backgroundColor: '#FFF',
    borderRadius: 20,
  },
  modalTitle: {
    color: '#4A90E2',
    textAlign: 'center',
    fontFamily: 'Pretendard',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 36,
    letterSpacing: -0.18,
  },
  modalSubtitle: {
    color: '#4A90E2',
    textAlign: 'center',
    fontFamily: 'Pretendard',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: -0.16,
  },
  modalMintPrefix: {
    color: '#FFF',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
  },
  modalMintAmount: {
    color: '#FFF',
    textAlign: 'center',
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
  },
  modalImageContainer: {
    width: 260,
    height: 130,
    borderRadius: 10,
    backgroundColor: '#D9D9D9',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
    marginHorizontal: 20,
    overflow: 'hidden',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalProductInfo: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
    alignSelf: 'stretch',
    paddingHorizontal: 20,
  },
  modalBrandText: {
    color: '#333',
    fontFamily: 'Pretendard',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    letterSpacing: -0.12,
  },
  modalProductName: {
    color: '#333',
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: -0.18,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    alignSelf: 'stretch',
    justifyContent: 'center',
    marginTop: 10,
  },
  modalCancelButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#FF7F50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalConfirmButton: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF7F50',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
    padding: 3,
  },
});

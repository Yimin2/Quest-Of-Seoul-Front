import { ClaimedReward, rewardApi } from '@shared/api';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@shared/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { ClipPath, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

export default function MyPurchaseCouponDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [coupon, setCoupon] = useState<ClaimedReward | null>(null);
  const [showBarcode, setShowBarcode] = useState(false);

  // Parse coupon data from params
  useEffect(() => {
    if (params.coupon) {
      try {
        const couponData = JSON.parse(params.coupon as string);
        setCoupon(couponData);
      } catch (e) {
        // Ignore
      }
    }
  }, [params.coupon]);

  const handleUseCoupon = async () => {
    if (!coupon) return;

    try {
      const res = await rewardApi.useReward(coupon.id);
      if (res.status === 'success') {
        setShowBarcode(true);
      } else {
        Alert.alert('Error', 'This coupon has already been used.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'An error occurred while using the coupon.');
    }
  };

  if (!coupon) {
    return (
      <View style={styles.container}>
        <ThemedText style={styles.loadingText}>Loading...</ThemedText>
      </View>
    );
  }

  const category = coupon.rewards?.type || 'Coupon';

  // Barcode 화면
  if (showBarcode) {
    return <BarcodeScreen coupon={coupon} onClose={() => setShowBarcode(false)} />;
  }

  return (
    <View style={styles.container}>
      {/* Image Container with Header */}
      <View style={styles.imageContainer}>
        {coupon.rewards?.image_url ? (
          <Image
            source={{ uri: coupon.rewards.image_url }}
            style={styles.couponImage}
            resizeMode="cover"
          />
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
          <ThemedText style={styles.productName}>{coupon.rewards.name}</ThemedText>
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
            <ThemedText style={styles.priceText}>{coupon.rewards.point_cost}</ThemedText>
          </View>
        </View>

        {/* Overview Section */}
        <ThemedText style={styles.sectionTitle}>OverView</ThemedText>
        <ThemedText style={styles.descriptionText}>
          {coupon.rewards.description || 'Standard coupon'}
        </ThemedText>

        {/* Usage Section */}
        <ThemedText style={styles.sectionTitle}>Usage of redemption</ThemedText>
        <ThemedText style={styles.descriptionText}>Anywhere</ThemedText>
      </ScrollView>

      {/* Bottom CTA Button - Use this coupon */}
      {!coupon.used_at && (
        <View style={styles.bottomContainer}>
          <Pressable style={styles.useButton} onPress={handleUseCoupon}>
            <Ionicons name="barcode-outline" size={24} color="#FFF" />
            <ThemedText style={styles.useButtonText}>Use this coupon</ThemedText>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function BarcodeScreen({ coupon, onClose }: { coupon: ClaimedReward; onClose: () => void }) {
  // 바코드 번호 생성 (qr_code가 있으면 사용, 없으면 생성)
  const barcodeValue = coupon.qr_code || `978${String(coupon.id).padStart(9, '0')}`;

  // 간단한 바코드 패턴 생성 (CODE128 스타일)
  const generateBarcodePattern = (value: string) => {
    const patterns: { width: number; x: number }[] = [];
    let x = 0;
    const thinBar = 2;
    const thickBar = 4;

    // 시작 패턴
    patterns.push({ width: thickBar, x });
    x += thickBar + thinBar;
    patterns.push({ width: thinBar, x });
    x += thinBar + thinBar;
    patterns.push({ width: thickBar, x });
    x += thickBar + thinBar;

    // 데이터 패턴
    for (let i = 0; i < value.length; i++) {
      const char = value.charCodeAt(i);
      const pattern = (char % 4) + 1; // 1-4 사이

      for (let j = 0; j < pattern; j++) {
        const width = j % 2 === 0 ? thickBar : thinBar;
        patterns.push({ width, x });
        x += width + thinBar;
      }
    }

    // 종료 패턴
    patterns.push({ width: thickBar, x });
    x += thickBar + thinBar;
    patterns.push({ width: thinBar, x });
    x += thinBar + thinBar;
    patterns.push({ width: thickBar, x });

    return { patterns, totalWidth: x + thickBar };
  };

  const { patterns, totalWidth } = generateBarcodePattern(barcodeValue);

  return (
    <View style={barcodeStyles.container}>
      {/* 바코드와 텍스트를 세로로 회전된 레이아웃 */}
      <View style={barcodeStyles.rotatedContainer}>
        <View style={barcodeStyles.content}>
          {/* 바코드 영역 */}
          <View style={barcodeStyles.barcodeContainer}>
            <View style={[barcodeStyles.barcode, { width: totalWidth }]}>
              <Svg width={totalWidth} height={300} viewBox={`0 0 ${totalWidth} 300`}>
                {patterns.map((pattern, index) => (
                  <Rect
                    key={index}
                    x={pattern.x}
                    y={0}
                    width={pattern.width}
                    height={300}
                    fill="#000000"
                  />
                ))}
              </Svg>
            </View>
            <ThemedText style={barcodeStyles.barcodeNumber}>{barcodeValue}</ThemedText>
          </View>

          {/* 텍스트 영역 */}
          <View style={barcodeStyles.textContainer}>
            <ThemedText style={barcodeStyles.textBrand}>
              {coupon.rewards.type || 'Reward'}
            </ThemedText>
            <ThemedText style={barcodeStyles.textName}>{coupon.rewards.name}</ThemedText>
            <View style={barcodeStyles.textPriceBadge}>
              <Svg width="13" height="8" viewBox="0 0 13 8" fill="none">
                <Path
                  d="M13 4.01234V4.2707C13 4.63629 12.7895 4.94705 12.4648 5.15666C12.8671 5.47107 13.0823 5.9366 12.96 6.37531L12.8883 6.61904C12.6907 7.31976 11.712 7.58787 10.8887 7.16865L10.1406 6.78965C9.9279 6.68324 9.74007 6.53022 9.5901 6.34118C9.46947 6.51509 9.3349 6.67816 9.18782 6.82864C8.79662 7.23454 8.3256 7.54833 7.80681 7.74864C7.28802 7.94896 6.73366 8.0311 6.18148 7.98947C5.62929 7.94784 5.09225 7.7834 4.60692 7.50738C4.12158 7.23136 3.69936 6.85023 3.369 6.38993C3.22607 6.5549 3.05348 6.68943 2.86087 6.78599L2.11279 7.16499C1.28943 7.58421 0.315504 7.3161 0.113192 6.61538L0.041429 6.37165C-0.0761944 5.93781 0.134361 5.47229 0.536633 5.153C0.211993 4.94339 0.00144104 4.62898 0.00144104 4.26704V4.01234C0.00662526 3.83973 0.0534857 3.67121 0.13773 3.52219C0.221975 3.37317 0.340914 3.24841 0.483694 3.15929C0.130824 2.87412 -0.0703029 2.45857 0.0226196 2.05032L0.0790765 1.79927C0.235516 1.11439 1.13768 0.781702 1.96928 1.10464L2.7456 1.40809C2.94094 1.48295 3.12149 1.59403 3.27843 1.7359C3.63475 1.19668 4.11346 0.756388 4.67248 0.453726C5.23149 0.151063 5.8537 -0.00470551 6.48442 0.000108273C7.11515 0.00492205 7.73507 0.170173 8.28972 0.481336C8.84437 0.792498 9.31677 1.24004 9.66538 1.78465C9.8338 1.61783 10.0342 1.48954 10.2535 1.40809L11.0286 1.10464C11.8614 0.781702 12.7624 1.11439 12.9188 1.79927L12.9753 2.05032C13.0682 2.45857 12.8706 2.87412 12.5142 3.15929C12.6577 3.24797 12.7773 3.37255 12.8622 3.5216C12.9471 3.67064 12.9944 3.83938 13 4.01234Z"
                  fill="#F5F5F5"
                />
              </Svg>
              <ThemedText style={barcodeStyles.textPrice}>{coupon.rewards.point_cost}</ThemedText>
            </View>
          </View>
        </View>
      </View>

      {/* Close Button */}
      <Pressable style={barcodeStyles.closeButton} onPress={onClose}>
        <Ionicons name="close" size={30} color="#34495E" />
      </Pressable>
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
  useButton: {
    backgroundColor: '#FF7F50',
    height: 56,
    borderRadius: 35,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  useButtonText: {
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
});

const barcodeStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  rotatedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '90deg' }],
    width: '100%',
    height: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 60,
  },
  barcodeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  barcode: {
    height: 300,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000',
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  barcodeNumber: {
    color: '#000',
    fontSize: 14,
    fontFamily: 'monospace',
    marginTop: 12,
    textAlign: 'center',
  },
  textContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 12,
  },
  textBrand: {
    color: '#000',
    fontFamily: 'Pretendard',
    fontSize: 16,
    fontWeight: '700',
  },
  textName: {
    color: '#000',
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '400',
  },
  textPriceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#76C7AD',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    marginTop: 4,
  },
  textPrice: {
    color: '#FFF',
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '700',
  },
  closeButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#34495E',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    elevation: 1000,
  },
});

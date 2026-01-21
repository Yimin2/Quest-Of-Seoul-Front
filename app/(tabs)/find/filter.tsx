import { questApi } from '@/services/api';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

type SortByType = 'nearest' | 'rewarded' | 'newest';

export default function FindFilterScreen() {
  const [selectedThemes, setSelectedThemes] = useState<string[]>(['All Themes']);
  const [selectedSort, setSelectedSort] = useState<SortByType>('nearest');
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>(['All Districts']);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Get user location on mount
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setUserLocation({
          latitude: 37.5665,
          longitude: 126.978,
        });
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    })();
  }, []);

  const toggleTheme = (theme: string) => {
    if (theme === 'All Themes') {
      setSelectedThemes(['All Themes']);
    } else {
      const newThemes = selectedThemes.filter((t) => t !== 'All Themes');
      if (newThemes.includes(theme)) {
        const filtered = newThemes.filter((t) => t !== theme);
        setSelectedThemes(filtered.length === 0 ? ['All Themes'] : filtered);
      } else {
        setSelectedThemes([...newThemes, theme]);
      }
    }
  };

  const toggleDistrict = (district: string) => {
    if (district === 'All Districts') {
      setSelectedDistricts(['All Districts']);
    } else {
      const newDistricts = selectedDistricts.filter((d) => d !== 'All Districts');
      if (newDistricts.includes(district)) {
        const filtered = newDistricts.filter((d) => d !== district);
        setSelectedDistricts(filtered.length === 0 ? ['All Districts'] : filtered);
      } else {
        setSelectedDistricts([...newDistricts, district]);
      }
    }
  };

  const handleRefresh = () => {
    setSelectedThemes(['All Themes']);
    setSelectedSort('nearest');
    setSelectedDistricts(['All Districts']);
  };

  const mapDistrictToApi = (district: string): string => {
    return district.replace('-district', '-gu');
  };

  const handleApplyFilters = async () => {
    if (!userLocation) {
      Alert.alert('Location Required', 'Please enable location services to use filters.');
      return;
    }

    setLoading(true);
    try {
      // Navigate back to find tab with filter settings
      router.push({
        pathname: '/(tabs)/find',
        params: {
          selectedThemes: selectedThemes.join(','),
          selectedDistricts: selectedDistricts.join(','),
          selectedSort: selectedSort,
          fromFilter: 'true',
        },
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to apply filters. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Filter</Text>
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <Path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M2.43855 0.401017C2.16912 0.140791 1.80826 -0.00320088 1.43369 5.40037e-05C1.05912 0.00330889 0.700819 0.15355 0.43595 0.418419C0.171081 0.683288 0.0208399 1.04159 0.017585 1.41616C0.0143301 1.79072 0.158322 2.15159 0.418548 2.42102L7.97998 9.98245L0.418548 17.5439C0.282105 17.6757 0.173273 17.8333 0.098403 18.0076C0.023533 18.1819 -0.0158759 18.3693 -0.0175242 18.559C-0.0191725 18.7487 0.0169728 18.9368 0.0888026 19.1124C0.160632 19.2879 0.266708 19.4474 0.400841 19.5816C0.534973 19.7157 0.694476 19.8218 0.870042 19.8936C1.04561 19.9654 1.23372 20.0016 1.42341 19.9999C1.61309 19.9983 1.80055 19.9589 1.97484 19.884C2.14913 19.8092 2.30677 19.7003 2.43855 19.5639L9.99998 12.0024L17.5614 19.5639C17.8308 19.8241 18.1917 19.9681 18.5663 19.9648C18.9408 19.9616 19.2991 19.8113 19.564 19.5465C19.8289 19.2816 19.9791 18.9233 19.9824 18.5487C19.9856 18.1742 19.8416 17.8133 19.5814 17.5439L12.02 9.98245L19.5814 2.42102C19.8416 2.15159 19.9856 1.79072 19.9824 1.41616C19.9791 1.04159 19.8289 0.683288 19.564 0.418419C19.2991 0.15355 18.9408 0.00330889 18.5663 5.40037e-05C18.1917 -0.00320088 17.8308 0.140791 17.5614 0.401017L9.99998 7.96245L2.43855 0.401017Z"
              fill="white"
            />
          </Svg>
        </Pressable>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Themes</Text>
          <Text style={styles.sectionSubtitle}>Multiple selections allowed</Text>
        </View>

        {/* Categories */}
        <View style={styles.categoriesContainer}>
          {[
            'All Themes',
            'Attractions',
            'History',
            'Culture',
            'Nature',
            'Food',
            'Drinks',
            'Shopping',
            'Activities',
            'Events',
          ].map((theme) => (
            <Pressable
              key={theme}
              style={selectedThemes.includes(theme) ? styles.categoryActive : styles.category}
              onPress={() => toggleTheme(theme)}
            >
              <Text
                style={
                  selectedThemes.includes(theme) ? styles.categoryActiveText : styles.categoryText
                }
              >
                {theme}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Sort By Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Sort By</Text>
          <Text style={styles.sectionSubtitle}>Multiple selections allowed</Text>
        </View>

        {/* Sort By Categories */}
        <View style={styles.sortContainer}>
          <Pressable
            style={[styles.sortButton, selectedSort === 'nearest' && styles.sortActiveNearest]}
            onPress={() => setSelectedSort('nearest')}
          >
            <Svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <Path
                d="M0.702404 4.91659L10.515 0.198826C11.8218 -0.304898 12.2965 0.157875 11.8177 1.48066L7.27664 11.2848C7.19557 11.5085 7.0441 11.6992 6.84541 11.8277C6.64672 11.9563 6.41175 12.0156 6.1765 11.9965C5.94125 11.9775 5.7187 11.8811 5.54286 11.7223C5.36702 11.5634 5.24762 11.3508 5.20293 11.1169C4.88639 9.47878 2.79239 7.36153 1.14478 7.05438L0.876926 7.00114C0.645723 6.95733 0.435121 6.8382 0.277417 6.66205C0.119713 6.4859 0.0236217 6.26241 0.00381896 6.02586C-0.0159837 5.7893 0.041604 5.55272 0.16779 5.35237C0.293975 5.15201 0.481761 4.99892 0.702404 4.91659Z"
                fill={selectedSort === 'nearest' ? '#659DF2' : 'white'}
              />
            </Svg>
            <Text
              style={[styles.sortText, selectedSort === 'nearest' && styles.sortActiveTextNearest]}
            >
              Nearest Trip
            </Text>
          </Pressable>
          <Pressable
            style={[styles.sortButton, selectedSort === 'rewarded' && styles.sortActiveRewarded]}
            onPress={() => setSelectedSort('rewarded')}
          >
            <Svg width="20" height="12" viewBox="0 0 20 12" fill="none">
              <Path
                d="M20 6.01852V6.40605C20 6.95444 19.6761 7.42058 19.1766 7.73499C19.7955 8.20661 20.1267 8.90489 19.9385 9.56296L19.8281 9.92856C19.5241 10.9796 18.0185 11.3818 16.7518 10.753L15.6009 10.1845C15.2737 10.0249 14.9847 9.79533 14.754 9.51178C14.5684 9.77264 14.3614 10.0172 14.1351 10.243C13.5333 10.8518 12.8086 11.3225 12.0105 11.623C11.2123 11.9234 10.3595 12.0467 9.50997 11.9842C8.66045 11.9218 7.83422 11.6751 7.08756 11.2611C6.3409 10.847 5.69133 10.2753 5.18307 9.5849C4.96318 9.83235 4.69766 10.0341 4.40134 10.179L3.25044 10.7475C1.98373 11.3763 0.485391 10.9742 0.174141 9.92307L0.0637369 9.55748C-0.117222 8.90672 0.20671 8.20843 0.825589 7.7295C0.326142 7.41509 0.00221698 6.94347 0.00221698 6.40056V6.01852C0.0101927 5.75959 0.0822858 5.50681 0.211893 5.28329C0.341499 5.05976 0.524483 4.87261 0.744145 4.73893C0.201268 4.31119 -0.108158 3.68785 0.0347993 3.07548L0.121656 2.6989C0.362332 1.67158 1.75028 1.17255 3.02966 1.65697L4.224 2.11213C4.52453 2.22443 4.80229 2.39105 5.04373 2.60385C5.59192 1.79501 6.3284 1.13458 7.18842 0.680588C8.04845 0.226594 9.00569 -0.00705826 9.97604 0.00016241C10.9464 0.00738308 11.9001 0.25526 12.7534 0.722003C13.6067 1.18875 14.3335 1.86007 14.8698 2.67697C15.1289 2.42675 15.4372 2.23431 15.7746 2.11213L16.9671 1.65697C18.2483 1.17255 19.6345 1.67158 19.8751 2.6989L19.962 3.07548C20.105 3.68785 19.8009 4.31119 19.2526 4.73893C19.4733 4.87195 19.6574 5.05882 19.788 5.28239C19.9185 5.50597 19.9915 5.75908 20 6.01852Z"
                fill="white"
              />
            </Svg>
            <Text style={styles.sortText}>Most Rewarded</Text>
          </Pressable>
          <Pressable
            style={[styles.sortButton, selectedSort === 'newest' && styles.sortActiveNewest]}
            onPress={() => setSelectedSort('newest')}
          >
            <Svg width="18" height="15" viewBox="0 0 18 15" fill="none">
              <Path
                d="M12.123 6.07301C12.1281 6.25547 12.0705 6.43423 11.9598 6.57932C11.849 6.72441 11.6918 6.82709 11.5144 6.87021C10.4739 7.25357 9.4394 7.63701 8.39275 8.00212C8.29819 8.03135 8.21218 8.08322 8.1422 8.15321C8.07221 8.22319 8.02035 8.30913 7.99111 8.40369C7.63209 9.41992 7.26089 10.4301 6.8897 11.4463C6.84863 11.6365 6.74459 11.8072 6.59439 11.9309C6.4442 12.0546 6.25666 12.1241 6.06213 12.1279C5.86266 12.1221 5.67076 12.0501 5.51657 11.9235C5.36237 11.7968 5.2546 11.6226 5.21019 11.428C4.84508 10.4179 4.47389 9.40773 4.10878 8.38541C4.08225 8.2961 4.03386 8.21493 3.96798 8.14905C3.9021 8.08317 3.82082 8.03474 3.7315 8.00821C2.68486 7.63701 1.65038 7.25357 0.609818 6.87021C0.428683 6.82757 0.268404 6.72251 0.157109 6.57338C0.0458138 6.42424 -0.0093729 6.24067 0.00130314 6.05489C-0.00443045 5.87089 0.0527584 5.69037 0.163386 5.54323C0.274013 5.3961 0.431468 5.29109 0.609818 5.24551C1.63821 4.86823 2.66661 4.4848 3.70109 4.11969C3.79564 4.09045 3.88165 4.03858 3.95164 3.9686C4.02162 3.89861 4.07345 3.81268 4.10269 3.71812C4.46171 2.70798 4.83294 1.69175 5.20414 0.675522C5.2454 0.485953 5.34966 0.315954 5.49996 0.193282C5.65026 0.0706099 5.83772 0.00244089 6.03171 0C6.42724 0 6.70717 0.225235 6.87755 0.693795C7.24875 1.70394 7.61991 2.72016 7.98502 3.73639C8.01015 3.82709 8.05799 3.90984 8.124 3.97692C8.19001 4.044 8.27201 4.09311 8.3623 4.11969C9.41706 4.48886 10.4658 4.87027 11.5083 5.26378C11.6895 5.30502 11.8504 5.40862 11.9628 5.5566C12.0751 5.70459 12.1319 5.88741 12.123 6.07301Z"
                fill="white"
              />
              <Path
                d="M17.0945 11.5314C17.0971 11.6354 17.065 11.7372 17.0033 11.821C16.9416 11.9047 16.8538 11.9656 16.7538 11.9939L14.9708 12.6449C14.9162 12.6594 14.8661 12.6878 14.8256 12.7272C14.7851 12.7667 14.7555 12.8159 14.7396 12.8701C14.5327 13.4787 14.3197 14.0323 14.1311 14.6165C14.1075 14.7249 14.0476 14.8221 13.9612 14.8918C13.8749 14.9615 13.7674 14.9997 13.6564 14.9999C13.5423 14.9996 13.4317 14.9602 13.3431 14.8882C13.2545 14.8162 13.1933 14.716 13.1696 14.6043C12.9566 13.9958 12.7436 13.4421 12.5611 12.864C12.5454 12.8123 12.5172 12.7653 12.479 12.7271C12.4408 12.6889 12.3937 12.6606 12.342 12.6449L10.553 11.9939C10.4507 11.9673 10.3609 11.906 10.2987 11.8205C10.2366 11.7351 10.206 11.6308 10.2122 11.5253C10.21 11.419 10.2436 11.315 10.3076 11.23C10.3716 11.145 10.4623 11.084 10.5652 11.0568L12.3359 10.4178C12.3903 10.4008 12.4397 10.3708 12.48 10.3306C12.5202 10.2903 12.5501 10.2408 12.5672 10.1865C12.7741 9.57795 12.987 9.02428 13.1757 8.44618C13.197 8.33611 13.2561 8.23696 13.3427 8.16584C13.4294 8.09473 13.5382 8.05603 13.6503 8.05665C13.7644 8.05695 13.8751 8.09639 13.9637 8.16837C14.0523 8.24035 14.1135 8.34061 14.1371 8.45227C14.3501 9.06079 14.5631 9.61446 14.7457 10.1926C14.7586 10.2456 14.7859 10.2942 14.8245 10.3328C14.8631 10.3714 14.9116 10.3987 14.9647 10.4117C15.5732 10.6247 16.1817 10.8499 16.7903 11.0689C16.8841 11.1029 16.9644 11.1662 17.0192 11.2496C17.0741 11.3329 17.1005 11.4318 17.0945 11.5314Z"
                fill="white"
              />
            </Svg>
            <Text style={styles.sortText}>Newest</Text>
          </Pressable>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Districts Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Districts</Text>
          <Text style={styles.sectionSubtitle}>Multiple selections allowed</Text>
        </View>

        {/* Districts Description */}
        <Text style={styles.districtDescription}>
          Seoul is divided{'\n'}into 25 autonomous districts{'\n'}called &quot;gu&quot;
        </Text>

        {/* Districts Categories */}
        <View style={styles.categoriesContainer}>
          {[
            'All Districts',
            'Dobong-district',
            'Dongdaemun-district',
            'Dongjak-district',
            'Eunpyeong-district',
            'Gangbuk-district',
            'Gangdong-district',
            'Gangnam-district',
            'Gangseo-district',
            'Geumcheon-district',
            'Guro-district',
            'Gwanak-district',
            'Gwangjin-district',
            'Jongno-district',
            'Jung-district',
            'Jungnang-district',
            'Mapo-district',
            'Nowon-district',
            'Seocho-district',
            'Seodaemun-district',
            'Seongbuk-district',
            'Seongdong-district',
            'Songpa-district',
            'Yangcheon-district',
            'Yeongdeungpo-district',
            'Yongsan-district',
          ].map((district) => (
            <Pressable
              key={district}
              style={selectedDistricts.includes(district) ? styles.districtActive : styles.category}
              onPress={() => toggleDistrict(district)}
            >
              <Text
                style={
                  selectedDistricts.includes(district)
                    ? styles.districtActiveText
                    : styles.categoryText
                }
              >
                {district}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Fixed Bar */}
      <View style={styles.bottomBar}>
        <Pressable style={styles.refreshButton} onPress={handleRefresh}>
          <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <Path
              d="M10 20C7.20833 20 4.84375 19.0313 2.90625 17.0938C0.96875 15.1563 0 12.7917 0 10C0 7.20834 0.96875 4.84375 2.90625 2.90625C4.84375 0.968754 7.20833 4.31034e-06 10 4.31034e-06C11.4375 4.31034e-06 12.8125 0.296671 14.125 0.890004C15.4375 1.48334 16.5625 2.3325 17.5 3.4375V1.25C17.5 0.895838 17.62 0.599171 17.86 0.360004C18.1 0.120838 18.3967 0.000837644 18.75 4.31034e-06C19.1033 -0.000829023 19.4004 0.119171 19.6412 0.360004C19.8821 0.600838 20.0017 0.897504 20 1.25V7.5C20 7.85417 19.88 8.15125 19.64 8.39125C19.4 8.63125 19.1033 8.75084 18.75 8.75H12.5C12.1458 8.75 11.8492 8.63 11.61 8.39C11.3708 8.15 11.2508 7.85334 11.25 7.5C11.2492 7.14667 11.3692 6.85 11.61 6.61C11.8508 6.37 12.1475 6.25 12.5 6.25H16.5C15.8333 5.08334 14.9221 4.16667 13.7662 3.5C12.6104 2.83334 11.355 2.5 10 2.5C7.91667 2.5 6.14583 3.22917 4.6875 4.6875C3.22917 6.14584 2.5 7.91667 2.5 10C2.5 12.0833 3.22917 13.8542 4.6875 15.3125C6.14583 16.7708 7.91667 17.5 10 17.5C11.4167 17.5 12.7137 17.1408 13.8912 16.4225C15.0687 15.7042 15.98 14.7404 16.625 13.5313C16.7917 13.2396 17.0263 13.0367 17.3288 12.9225C17.6313 12.8083 17.9383 12.8029 18.25 12.9063C18.5833 13.0104 18.8229 13.2292 18.9687 13.5625C19.1146 13.8958 19.1042 14.2083 18.9375 14.5C18.0833 16.1667 16.8646 17.5 15.2813 18.5C13.6979 19.5 11.9375 20 10 20Z"
              fill="white"
            />
          </Svg>
        </Pressable>

        <Pressable style={styles.applyButton} onPress={handleApplyFilters} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.applyButtonText}>Apply</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#659DF2',
  },
  header: {
    width: '100%',
    height: 105,
    flexShrink: 0,
    backgroundColor: '#659DF2',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: 72,
    paddingHorizontal: 25,
  },
  headerTitle: {
    color: '#FFF',
    fontFamily: 'Inter',
    fontSize: 16,
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: 22,
    letterSpacing: -0.18,
  },
  closeButton: {
    width: 20,
    height: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 28,
  },
  sectionTitle: {
    color: '#FFF',
    fontFamily: 'Pretendard',
    fontSize: 24,
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: 32,
    letterSpacing: 0,
  },
  sectionSubtitle: {
    color: '#FFF',
    fontFamily: 'Pretendard',
    fontSize: 12,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 16,
    letterSpacing: 0,
  },
  categoriesContainer: {
    marginTop: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryActive: {
    display: 'flex',
    paddingVertical: 7,
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 42,
    backgroundColor: '#FF7F50',
  },
  categoryActiveText: {
    color: '#FFF',
    fontFamily: 'Pretendard',
    fontSize: 13,
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: 16,
    letterSpacing: -0.12,
  },
  category: {
    display: 'flex',
    paddingVertical: 7,
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 42,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  categoryText: {
    color: '#FFF',
    fontFamily: 'Pretendard',
    fontSize: 13,
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: 16,
    letterSpacing: -0.12,
  },
  divider: {
    height: 1,
    backgroundColor: '#FFF',
    marginTop: 30,
    marginBottom: 30,
  },
  sortContainer: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    alignContent: 'center',
    gap: 5,
    flexWrap: 'wrap',
  },
  sortButton: {
    display: 'flex',
    paddingVertical: 7,
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    borderRadius: 42,
    borderWidth: 1,
    borderColor: '#FFF',
    flexDirection: 'row',
  },
  sortActiveNearest: {
    backgroundColor: '#FFF',
    borderWidth: 0,
  },
  sortActiveRewarded: {
    backgroundColor: '#76C7AD',
    borderWidth: 0,
  },
  sortActiveNewest: {
    backgroundColor: '#34495E',
    borderWidth: 0,
  },
  sortActiveTextNearest: {
    color: '#659DF2',
  },
  sortText: {
    color: '#FFF',
    fontFamily: 'Pretendard',
    fontSize: 13,
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: 16,
    letterSpacing: -0.12,
  },
  districtDescription: {
    color: '#FFF',
    fontFamily: 'Pretendard',
    fontSize: 16,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 24,
    letterSpacing: 0,
    marginTop: 16,
  },
  districtActive: {
    display: 'flex',
    paddingVertical: 7,
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 42,
    backgroundColor: '#FFF',
  },
  districtActiveText: {
    color: '#659DF2',
    fontFamily: 'Pretendard',
    fontSize: 13,
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: 16,
    letterSpacing: -0.12,
  },
  bottomBar: {
    width: '100%',
    height: 80,
    flexShrink: 0,
    backgroundColor: '#659DF2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 25,
  },
  refreshButton: {
    width: 20,
    height: 20,
  },
  applyButton: {
    display: 'flex',
    width: 269,
    height: 50,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
    borderRadius: 35,
    backgroundColor: '#FF7F50',
  },
  applyButtonText: {
    color: '#FFF',
    fontFamily: 'Inter',
    fontSize: 16,
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: 16,
  },
});

import { mapApi, pointsApi, questApi, type Quest } from '@shared/api';
import { Images } from '@shared/config';
import { useQuestStore } from '@entities/quest';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

type SortByType = 'nearest' | 'rewarded' | 'newest';

export default function FindScreen() {
  const params = useLocalSearchParams();
  const { selectedQuests, addQuest, removeQuest, startQuest, reorderQuests } = useQuestStore();
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [userMint, setUserMint] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [selectedSort, setSelectedSort] = useState<SortByType>('nearest');
  const [selectedThemes, setSelectedThemes] = useState<string[]>(['All Themes']);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>(['All Districts']);

  useEffect(() => {
    fetchUserPoints();
    getUserLocation();
  }, []);

  // Update filters when coming back from filter page
  useEffect(() => {
    if (params.fromFilter === 'true') {
      if (params.selectedThemes) {
        setSelectedThemes((params.selectedThemes as string).split(','));
      }
      if (params.selectedDistricts) {
        setSelectedDistricts((params.selectedDistricts as string).split(','));
      }
      if (params.selectedSort) {
        setSelectedSort(params.selectedSort as SortByType);
      }
    }
  }, [params.fromFilter, params.selectedThemes, params.selectedDistricts, params.selectedSort]);

  const fetchUserPoints = async () => {
    try {
      const data = await pointsApi.getPoints();
      setUserMint(data.total_points);
    } catch (err) {}
  };

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setUserLocation({ latitude: 37.5665, longitude: 126.978 });
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      setUserLocation({ latitude: 37.5665, longitude: 126.978 });
    }
  };

  // Fetch quests with filters (with optional search debounce)
  useEffect(() => {
    if (!userLocation) return; // Wait for user location

    const fetchQuests = async () => {
      setLoading(true);
      try {
        const filterParams = {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          radius_km: 50.0,
          limit: 100,
          sort_by: selectedSort,
          categories: selectedThemes.includes('All Themes')
            ? []
            : selectedThemes.map((theme) => (theme === 'Attractions' ? 'Attraction' : theme)),
          districts: selectedDistricts.includes('All Districts')
            ? []
            : selectedDistricts.map((d) => d.replace('-district', '-gu')),
        };

        const response = await questApi.getFilteredQuests(filterParams);

        if (response && response.quests && Array.isArray(response.quests)) {
          // Client-side filtering by search query (only if search query exists)
          let filteredQuests = searchQuery.trim()
            ? response.quests.filter(
                (quest) =>
                  quest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  quest.description?.toLowerCase().includes(searchQuery.toLowerCase()),
              )
            : response.quests;

          // Calculate distance if not provided by backend
          filteredQuests = filteredQuests.map((quest) => {
            if (quest.distance_km === undefined && quest.latitude && quest.longitude) {
              const distance = mapApi.calculateDistance(
                userLocation.latitude,
                userLocation.longitude,
                quest.latitude,
                quest.longitude,
              );
              return { ...quest, distance_km: distance };
            }
            return quest;
          });

          setSearchResults(filteredQuests);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    };

    // Debounce only when there's a search query, otherwise fetch immediately
    if (searchQuery.trim()) {
      const timeoutId = setTimeout(fetchQuests, 500);
      return () => clearTimeout(timeoutId);
    } else {
      fetchQuests();
    }
  }, [searchQuery, selectedThemes, selectedDistricts, selectedSort, userLocation]);

  const handleRefresh = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedThemes(['All Themes']);
    setSelectedSort('nearest');
    setSelectedDistricts(['All Districts']);
  };

  return (
    <View style={styles.outerContainer}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 102 }}>
        <View style={styles.fullHeader}>
          {/* 검색 + walk + mint */}
          <View style={styles.topRow}>
            <View style={styles.searchBox}>
              <Svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={styles.searchIcon}>
                <Path
                  d="M15.1753 4.32863C14.0003 3.15758 12.4092 2.5 10.7504 2.5C9.0916 2.5 7.50043 3.15758 6.32546 4.32863C5.41627 5.23994 4.80963 6.40903 4.58797 7.67716C4.3663 8.94528 4.54037 10.251 5.08648 11.4167L2.68227 13.8212C2.47232 14.015 2.30371 14.2492 2.18654 14.5098C2.06937 14.7704 2.00605 15.052 2.00041 15.3377C1.99478 15.6234 2.04692 15.9072 2.15373 16.1722C2.26053 16.4372 2.4198 16.6779 2.62195 16.8798C2.82409 17.0817 3.06493 17.2407 3.33004 17.3472C3.59516 17.4537 3.87908 17.5055 4.16471 17.4995C4.45035 17.4935 4.73181 17.4299 4.99223 17.3124C5.25265 17.1948 5.48665 17.0259 5.68016 16.8157L8.08438 14.4112C8.91749 14.8022 9.82643 15.0049 10.7467 15.005C11.5694 15.0046 12.3839 14.8415 13.1433 14.525C13.9027 14.2086 14.592 13.745 15.1716 13.1611C16.3425 11.986 17 10.3946 17 8.73562C17 7.07663 16.3425 5.48528 15.1716 4.31017L15.1753 4.32863ZM14.4157 10.2697C14.0402 11.1836 13.3381 11.9251 12.4462 12.3498C11.5543 12.7746 10.5362 12.8523 9.59014 12.5678C8.64407 12.2834 7.83768 11.6571 7.3278 10.8109C6.81793 9.96461 6.64105 8.95894 6.83163 7.98949C7.0222 7.02004 7.56657 6.15612 8.35882 5.5659C9.15107 4.97569 10.1345 4.70136 11.1179 4.79628C12.1012 4.89119 13.0141 5.34861 13.6788 6.07947C14.3436 6.81032 14.7127 7.76238 14.7144 8.75038C14.7151 9.27151 14.6136 9.78766 14.4157 10.2697Z"
                  fill="#34495E"
                  fillOpacity="0.55"
                />
              </Svg>
              <TextInput
                placeholder="Search place name"
                placeholderTextColor="rgba(52, 73, 94, 0.55)"
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
              />
            </View>

            <View style={styles.walkBox}>
              <View style={styles.statColumn}>
                <Svg width="14" height="19" viewBox="0 0 14 19" fill="none">
                  <Path
                    d="M4.5858 18.8191L3.41542 18.9879C2.81182 19.0742 1.78496 18.6936 1.70399 18.0461C1.62302 17.4026 2.51737 16.7434 3.12097 16.6531L4.29138 16.4844C4.89498 16.3981 5.92185 16.7827 6.00282 17.4301C6.08379 18.0736 5.1894 18.7328 4.5858 18.8191Z"
                    fill="white"
                    opacity="0.95"
                  />
                  <Path
                    d="M3.76134 15.6447L3.42645 15.6918C2.1162 15.8802 0.603508 14.9463 0.426844 13.5533L0.0219997 10.3554C-0.0205015 10.0237 -0.00130306 9.68644 0.0785638 9.36275C0.158431 9.03906 0.297396 8.73531 0.487452 8.46891C0.677508 8.20251 0.914951 7.97869 1.18621 7.81021C1.45748 7.64172 1.75722 7.53187 2.06833 7.48699L3.02525 7.34966C3.33657 7.30438 3.65322 7.32505 3.95705 7.41044C4.26088 7.49584 4.54593 7.6443 4.79585 7.84733C5.04577 8.05036 5.25567 8.30395 5.41352 8.59359C5.57136 8.88324 5.67405 9.20326 5.7157 9.53528L6.12055 12.7332C6.29721 14.134 5.06792 15.4642 3.76134 15.6447Z"
                    fill="white"
                    opacity="0.95"
                  />
                  <Path
                    d="M10.309 11.6502L9.13492 11.5286C8.52764 11.4658 7.6112 10.8419 7.66273 10.1945C7.72161 9.54703 8.73373 9.11934 9.34101 9.18213L10.5151 9.30374C11.1224 9.37045 12.0388 9.99436 11.9873 10.6418C11.9247 11.2892 10.9126 11.7208 10.309 11.6502Z"
                    fill="white"
                    opacity="0.95"
                  />
                  <Path
                    d="M10.1838 8.36199L9.84521 8.32669C8.53128 8.19328 7.2689 6.91413 7.38667 5.5133L7.6774 2.30356C7.70782 1.97015 7.79958 1.64641 7.94737 1.3508C8.09517 1.0552 8.2961 0.793527 8.53876 0.580733C8.78142 0.367938 9.06104 0.208185 9.36161 0.110606C9.66218 0.0130264 9.97782 -0.0204648 10.2905 0.0120301L11.2512 0.110127C11.8821 0.1766 12.4624 0.507317 12.8648 1.02969C13.2671 1.55206 13.4585 2.22335 13.3969 2.89607L13.1061 6.10576C12.9773 7.50659 11.4978 8.49933 10.1838 8.36199Z"
                    fill="white"
                    opacity="0.95"
                  />
                </Svg>
                <Text style={styles.statLabel}>walk</Text>
              </View>
              <Text style={styles.statValue}>0.1</Text>
            </View>

            <View style={styles.mintBox}>
              <View style={styles.statColumn}>
                <Svg width="26" height="16" viewBox="0 0 26 16" fill="none">
                  <Path
                    d="M26 7.93746V8.44855C26 9.17179 25.5789 9.78656 24.9296 10.2012C25.7342 10.8232 26.1647 11.7441 25.92 12.612L25.7765 13.0942C25.3813 14.4804 23.4241 15.0108 21.7773 14.1815L20.2812 13.4317C19.8558 13.2212 19.4801 12.9185 19.1802 12.5445C18.9389 12.8886 18.6698 13.2111 18.3756 13.5088C17.5932 14.3118 16.6512 14.9326 15.6136 15.3288C14.576 15.7251 13.4673 15.8876 12.363 15.8053C11.2586 15.7229 10.1845 15.3976 9.21383 14.8516C8.24317 14.3055 7.39873 13.5515 6.738 12.641C6.45213 12.9673 6.10695 13.2334 5.72174 13.4245L4.22558 14.1742C2.57885 15.0035 0.631008 14.4732 0.226384 13.0869L0.0828579 12.6048C-0.152389 11.7465 0.268722 10.8256 1.07327 10.194C0.423985 9.77932 0.00288208 9.15732 0.00288208 8.44131V7.93746C0.0132505 7.59598 0.106971 7.26261 0.27546 6.96781C0.443949 6.67301 0.681828 6.42619 0.967388 6.2499C0.261648 5.68577 -0.140606 4.86369 0.0452391 4.05607L0.158153 3.55942C0.471031 2.20455 2.27536 1.54641 3.93856 2.18527L5.49121 2.78556C5.88189 2.93367 6.24297 3.15341 6.55685 3.43406C7.26949 2.36734 8.22692 1.49633 9.34495 0.897587C10.463 0.298841 11.7074 -0.00930872 12.9688 0.000214193C14.2303 0.0097371 15.4701 0.336647 16.5794 0.952207C17.6887 1.56777 18.6335 2.45313 19.3308 3.5305C19.6676 3.20049 20.0683 2.9467 20.507 2.78556L22.0573 2.18527C23.7228 1.54641 25.5248 2.20455 25.8377 3.55942L25.9506 4.05607C26.1365 4.86369 25.7412 5.68577 25.0284 6.2499C25.3153 6.42532 25.5546 6.67178 25.7243 6.96663C25.8941 7.26149 25.9889 7.5953 26 7.93746Z"
                    fill="white"
                    opacity="0.95"
                  />
                </Svg>
                <Text style={styles.statLabel}>mint</Text>
              </View>
              <Text style={styles.statValue}>{userMint}</Text>
            </View>
          </View>

          {/* 새로고침과 필터 */}
          <View style={styles.filterRowContainer}>
            <Pressable style={styles.refreshButton} onPress={handleRefresh}>
              <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <Path
                  d="M10 20C7.20833 20 4.84375 19.0313 2.90625 17.0938C0.96875 15.1563 0 12.7917 0 10C0 7.20834 0.96875 4.84375 2.90625 2.90625C4.84375 0.968754 7.20833 4.31034e-06 10 4.31034e-06C11.4375 4.31034e-06 12.8125 0.296671 14.125 0.890004C15.4375 1.48334 16.5625 2.3325 17.5 3.4375V1.25C17.5 0.895838 17.62 0.599171 17.86 0.360004C18.1 0.120838 18.3967 0.000837644 18.75 4.31034e-06C19.1033 -0.000829023 19.4004 0.119171 19.6412 0.360004C19.8821 0.600838 20.0017 0.897504 20 1.25V7.5C20 7.85417 19.88 8.15125 19.64 8.39125C19.4 8.63125 19.1033 8.75084 18.75 8.75H12.5C12.1458 8.75 11.8492 8.63 11.61 8.39C11.3708 8.15 11.2508 7.85334 11.25 7.5C11.2492 7.14667 11.3692 6.85 11.61 6.61C11.8508 6.37 12.1475 6.25 12.5 6.25H16.5C15.8333 5.08334 14.9221 4.16667 13.7662 3.5C12.6104 2.83334 11.355 2.5 10 2.5C7.91667 2.5 6.14583 3.22917 4.6875 4.6875C3.22917 6.14584 2.5 7.91667 2.5 10C2.5 12.0833 3.22917 13.8542 4.6875 15.3125C6.14583 16.7708 7.91667 17.5 10 17.5C11.4167 17.5 12.7137 17.1408 13.8912 16.4225C15.0687 15.7042 15.98 14.7404 16.625 13.5313C16.7917 13.2396 17.0263 13.0367 17.3288 12.9225C17.6313 12.8083 17.9383 12.8029 18.25 12.9063C18.5833 13.0104 18.8229 13.2292 18.9687 13.5625C19.1146 13.8958 19.1042 14.2083 18.9375 14.5C18.0833 16.1667 16.8646 17.5 15.2813 18.5C13.6979 19.5 11.9375 20 10 20Z"
                  fill="white"
                />
              </Svg>
            </Pressable>

            <View style={styles.filterCategoryRow}>
              <Pressable onPress={() => router.push('/(tabs)/find/filter')}>
                <Svg
                  width="30"
                  height="30"
                  viewBox="0 0 30 30"
                  fill="none"
                  style={styles.filterIcon}
                >
                  <Path
                    d="M26.5625 15H11.1188M5.6675 15H3.4375M5.6675 15C5.6675 14.2773 5.9546 13.5842 6.46563 13.0731C6.97667 12.5621 7.66979 12.275 8.3925 12.275C9.11522 12.275 9.80833 12.5621 10.3194 13.0731C10.8304 13.5842 11.1175 14.2773 11.1175 15C11.1175 15.7227 10.8304 16.4158 10.3194 16.9269C9.80833 17.4379 9.11522 17.725 8.3925 17.725C7.66979 17.725 6.97667 17.4379 6.46563 16.9269C5.9546 16.4158 5.6675 15.7227 5.6675 15ZM26.5625 23.2587H19.3775M19.3775 23.2587C19.3775 23.9816 19.0897 24.6755 18.5786 25.1867C18.0674 25.6978 17.3741 25.985 16.6513 25.985C15.9285 25.985 15.2354 25.6966 14.7244 25.1856C14.2133 24.6746 13.9262 23.9815 13.9262 23.2587M19.3775 23.2587C19.3775 22.5359 19.0897 21.8432 18.5786 21.3321C18.0674 20.8209 17.3741 20.5337 16.6513 20.5337C15.9285 20.5337 15.2354 20.8208 14.7244 21.3319C14.2133 21.8429 13.9262 22.536 13.9262 23.2587M13.9262 23.2587H3.4375M26.5625 6.74124H22.6813M17.23 6.74124H3.4375M17.23 6.74124C17.23 6.01852 17.5171 5.32541 18.0281 4.81437C18.5392 4.30333 19.2323 4.01624 19.955 4.01624C20.3129 4.01624 20.6672 4.08672 20.9978 4.22366C21.3284 4.36061 21.6288 4.56133 21.8819 4.81437C22.1349 5.06741 22.3356 5.36781 22.4726 5.69842C22.6095 6.02904 22.68 6.38338 22.68 6.74124C22.68 7.09909 22.6095 7.45344 22.4726 7.78405C22.3356 8.11466 22.1349 8.41506 21.8819 8.6681C21.6288 8.92114 21.3284 9.12186 20.9978 9.25881C20.6672 9.39575 20.3129 9.46623 19.955 9.46623C19.2323 9.46623 18.5392 9.17914 18.0281 8.6681C17.5171 8.15706 17.23 7.46395 17.23 6.74124Z"
                    stroke="white"
                    strokeWidth="1.875"
                    strokeMiterlimit="10"
                    strokeLinecap="round"
                  />
                </Svg>
              </Pressable>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 16 }}
              >
                {/* Themes */}
                {selectedThemes.map((theme) => (
                  <View key={theme} style={styles.categoryChipActive}>
                    <Text style={styles.categoryTextActive}>{theme}</Text>
                  </View>
                ))}

                {/* Sort */}
                <View style={styles.sortButtonActive}>
                  <Svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <Path
                      d="M0.702404 4.91659L10.515 0.198826C11.8218 -0.304898 12.2965 0.157875 11.8177 1.48066L7.27664 11.2848C7.19557 11.5085 7.0441 11.6992 6.84541 11.8277C6.64672 11.9563 6.41175 12.0156 6.1765 11.9965C5.94125 11.9775 5.7187 11.8811 5.54286 11.7223C5.36702 11.5634 5.24762 11.3508 5.20293 11.1169C4.88639 9.47878 2.79239 7.36153 1.14478 7.05438L0.876926 7.00114C0.645723 6.95733 0.435121 6.8382 0.277417 6.66205C0.119713 6.4859 0.0236217 6.26241 0.00381896 6.02586C-0.0159837 5.7893 0.041604 5.55272 0.16779 5.35237C0.293975 5.15201 0.481761 4.99892 0.702404 4.91659Z"
                      fill="#659DF2"
                    />
                  </Svg>
                  <Text style={styles.sortTextActive}>
                    {selectedSort === 'nearest'
                      ? 'Nearest Trip'
                      : selectedSort === 'rewarded'
                        ? 'Most Rewarded'
                        : 'Newest'}
                  </Text>
                </View>

                {/* Districts */}
                {selectedDistricts.map((district) => (
                  <View key={district} style={styles.districtChipActive}>
                    <Text style={styles.districtTextActive}>{district}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>

        {/* 검색 결과 */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFF" />
          </View>
        )}

        {!loading && searchResults.length > 0 && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>
              {searchQuery
                ? `Found ${searchResults.length} place${searchResults.length > 1 ? 's' : ''}`
                : `${searchResults.length} places available`}
            </Text>
            <View style={styles.resultsGrid}>
              {searchResults.map((quest) => (
                <Pressable
                  key={quest.id}
                  onPress={() => {
                    router.push({
                      pathname: '/(tabs)/map/quest-detail',
                      params: {
                        quest: JSON.stringify(quest),
                      },
                    });
                  }}
                  style={({ pressed }) => [styles.cardWrapper, pressed && { opacity: 0.95 }]}
                >
                  <View style={styles.placeImageContainer}>
                    {quest.place_image_url && (
                      <Image source={{ uri: quest.place_image_url }} style={styles.placeImage} />
                    )}
                    <Text style={styles.placeCategoryText}>{quest.category || 'Place'}</Text>
                    <Pressable
                      style={styles.plusButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        addQuest(quest);
                      }}
                    >
                      <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <Path
                          d="M14.8571 9.14286H9.14286V14.8571C9.14286 15.1602 9.02245 15.4509 8.80812 15.6653C8.59379 15.8796 8.30311 16 8 16C7.6969 16 7.40621 15.8796 7.19188 15.6653C6.97755 15.4509 6.85714 15.1602 6.85714 14.8571V9.14286H1.14286C0.839753 9.14286 0.549063 9.02245 0.334735 8.80812C0.120408 8.59379 0 8.30311 0 8C0 7.6969 0.120408 7.40621 0.334735 7.19188C0.549063 6.97755 0.839753 6.85714 1.14286 6.85714H6.85714V1.14286C6.85714 0.839753 6.97755 0.549062 7.19188 0.334735C7.40621 0.120407 7.6969 0 8 0C8.30311 0 8.59379 0.120407 8.80812 0.334735C9.02245 0.549062 9.14286 0.839753 9.14286 1.14286V6.85714H14.8571C15.1602 6.85714 15.4509 6.97755 15.6653 7.19188C15.8796 7.40621 16 7.6969 16 8C16 8.30311 15.8796 8.59379 15.6653 8.80812C15.4509 9.02245 15.1602 9.14286 14.8571 9.14286Z"
                          fill="white"
                        />
                      </Svg>
                    </Pressable>
                    {quest.distance_km !== undefined && (
                      <View style={styles.distanceBadge}>
                        <Svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <Path
                            d="M9.49609 0.501953C9.4967 0.511802 9.50014 0.523321 9.5 0.537109C9.49887 0.64138 9.4678 0.808104 9.38184 1.04883L5.61035 9.19434L5.60156 9.21387L5.59375 9.2334C5.56315 9.31782 5.50604 9.38903 5.43262 9.43652C5.35932 9.48388 5.27333 9.50595 5.1875 9.49902C5.1016 9.49207 5.01943 9.45648 4.9541 9.39746C4.88881 9.33843 4.84406 9.25842 4.82715 9.16992V9.16895L4.79199 9.01465C4.59556 8.24175 4.04883 7.43937 3.41504 6.80273C2.7393 6.12398 1.87207 5.54092 1.04492 5.38672L0.828125 5.34375L0.824219 5.34277L0.761719 5.32617C0.701821 5.30413 0.647322 5.2667 0.603516 5.21777C0.545136 5.15242 0.508439 5.06864 0.500977 4.97949C0.493596 4.89034 0.515442 4.8013 0.5625 4.72656C0.609571 4.65182 0.679301 4.59552 0.759766 4.56543L0.78125 4.55762L0.801758 4.54785L8.95898 0.625C9.19511 0.535375 9.35976 0.503188 9.46289 0.5C9.47568 0.499607 9.48672 0.501617 9.49609 0.501953Z"
                            stroke="#F5F5F5"
                          />
                        </Svg>
                        <Text style={styles.distanceText}>{quest.distance_km.toFixed(1)}km</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.placeInfoBottom}>
                    <Text style={styles.placeNameText} numberOfLines={2}>
                      {quest.name}
                    </Text>
                    {quest.district && (
                      <Text style={styles.placeLocationText}>{quest.district}</Text>
                    )}
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {!loading && searchQuery && searchResults.length === 0 && (
          <View style={styles.noResultsContainer}>
            <Image
              source={require('@/assets/images/face-2-2.png')}
              style={styles.docentFaceImage}
              resizeMode="contain"
            />
            <Svg width="130" height="46" viewBox="0 0 130 46" fill="none" style={styles.oopsText}>
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
            <View style={styles.noResultsTextContainer}>
              <Text style={styles.noResultsText}>
                <Text style={styles.noResultsRegular}>I can&apos;t find </Text>
                <Text style={styles.noResultsBold}>{searchQuery}</Text>
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Route Selection Bar */}
      <View style={styles.routeContainer} pointerEvents="box-none">
        <LinearGradient
          colors={['#FF7F50', '#994C30']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.routeBar}
        >
          <Pressable
            style={styles.questSlotsContainer}
            onPress={() => {
              // 빈 곳 탭 시 선택 취소
              if (selectedSlotIndex !== null) {
                setSelectedSlotIndex(null);
              }
            }}
          >
            {[0, 1, 2, 3].map((index) => {
              const quest = selectedQuests[index];
              const isSelected = selectedSlotIndex === index;

              const handlePress = () => {
                if (!quest) return;

                // 선택 모드일 때 → 교체
                if (selectedSlotIndex !== null) {
                  // 같은 슬롯 누르면 선택 해제
                  if (selectedSlotIndex === index) {
                    setSelectedSlotIndex(null);
                    return;
                  }

                  // 슬롯 교체
                  reorderQuests(selectedSlotIndex, index);
                  setSelectedSlotIndex(null);
                  return;
                }

                // 선택 모드가 아닐 때 → 삭제
                removeQuest(quest.id);
              };

              const handleLongPress = () => {
                if (quest) {
                  setSelectedSlotIndex(index);
                }
              };

              return (
                <Pressable
                  key={quest ? `quest-${quest.id}` : `empty-${index}`}
                  onPress={(e) => {
                    e.stopPropagation(); // 부모의 onPress 이벤트 전파 방지
                    handlePress();
                  }}
                  onLongPress={(e) => {
                    e.stopPropagation(); // 부모의 onPress 이벤트 전파 방지
                    handleLongPress();
                  }}
                  delayLongPress={200}
                  style={[styles.questSlot, isSelected && styles.questSlotSelected]}
                >
                  {quest ? (
                    <View style={styles.slotImageContainer}>
                      <Image
                        source={{
                          uri: quest.place_image_url || 'https://picsum.photos/58/60',
                        }}
                        style={styles.slotQuestImage}
                      />
                      {quest && (
                        <View style={styles.slotNumberContainer}>
                          <Text style={styles.slotNumber}>{index + 1}</Text>
                        </View>
                      )}
                      {quest && (
                        <View style={styles.slotRemoveIconContainer}>
                          <Svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <Path
                              d="M10.0322 11.6485L5.99158 7.60793L1.95097 11.6485C1.73664 11.8629 1.44595 11.9833 1.14285 11.9833C0.83974 11.9833 0.549051 11.8629 0.334723 11.6485C0.120396 11.4342 -1.2327e-05 11.1435 -1.19898e-05 10.8404C-1.2327e-05 10.5373 0.120396 10.2466 0.334724 10.0323L4.37533 5.99169L0.334723 1.95108C0.120395 1.73675 -1.20741e-05 1.44606 -1.23692e-05 1.14296C-1.20004e-05 0.83985 0.120395 0.549161 0.334723 0.334833C0.54905 0.120505 0.83974 9.80094e-05 1.14284 9.79777e-05C1.44595 9.79356e-05 1.73664 0.120506 1.95097 0.334833L5.99158 4.37544L10.0322 0.334833C10.2465 0.120506 10.5372 9.75563e-05 10.8403 9.75984e-05C11.1434 9.76248e-05 11.4341 0.120505 11.6484 0.334833C11.8628 0.549161 11.9832 0.83985 11.9832 1.14295C11.9832 1.44606 11.8628 1.73675 11.6484 1.95108L7.60782 5.99169L11.6484 10.0323C11.8628 10.2466 11.9832 10.5373 11.9832 10.8404C11.9832 11.1435 11.8628 11.4342 11.6484 11.6485C11.4341 11.8629 11.1434 11.9833 10.8403 11.9833C10.5372 11.9833 10.2465 11.8629 10.0322 11.6485Z"
                              fill="white"
                              stroke="rgba(0,0,0,0.3)"
                              strokeWidth="0.5"
                            />
                          </Svg>
                        </View>
                      )}
                    </View>
                  ) : (
                    <Image
                      source={Images.group55}
                      style={styles.slotPlusImage}
                      resizeMode="cover"
                    />
                  )}
                </Pressable>
              );
            })}
          </Pressable>

          <Pressable
            style={[styles.startButton, selectedQuests.length > 0 && styles.startButtonActive]}
            disabled={selectedQuests.length === 0}
            onPress={async () => {
              if (selectedQuests.length > 0) {
                // Start the first quest and navigate to map
                const firstQuest = selectedQuests[0];
                startQuest(firstQuest);

                // 위치 정보 수집 (1km 이내일 때만)
                if (userLocation) {
                  const distance = mapApi.calculateDistance(
                    userLocation.latitude,
                    userLocation.longitude,
                    firstQuest.latitude,
                    firstQuest.longitude,
                  );

                  if (distance <= 1.0) {
                    questApi
                      .startQuest({
                        quest_id: firstQuest.id,
                        place_id: firstQuest.place_id || undefined,
                        latitude: userLocation.latitude,
                        longitude: userLocation.longitude,
                        start_latitude: userLocation.latitude,
                        start_longitude: userLocation.longitude,
                      })
                      .catch(() => {
                        // Ignore
                      });
                  }
                }

                router.push('/(tabs)/map');
              }
            }}
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
  outerContainer: {
    flex: 1,
    backgroundColor: '#34495E',
  },

  container: {
    flex: 1,
    backgroundColor: '#34495E',
  },

  fullHeader: {
    backgroundColor: '#34495E',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  searchBox: {
    flex: 1,
    height: 52,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },

  searchIcon: {
    marginRight: 8,
  },

  searchText: {
    color: 'rgba(52, 73, 94, 0.55)',
    fontFamily: 'Inter',
    fontSize: 12,
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: 16,
    letterSpacing: -0.12,
  },

  walkBox: {
    width: 76,
    height: 47,
    backgroundColor: '#4888D3',
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },

  mintBox: {
    width: 76,
    height: 47,
    backgroundColor: '#76C7AD',
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },

  statColumn: {
    width: 26,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    flexShrink: 0,
  },

  statLabel: {
    color: '#FFF',
    textAlign: 'center',
    fontSize: 9,
    fontWeight: '500',
    lineHeight: 10,
    letterSpacing: 0,
  },

  statValue: {
    color: '#FFF',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    letterSpacing: 0,
  },

  filterRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },

  filterCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  filterIcon: {
    marginRight: 20,
  },

  refreshButton: {
    width: 20,
    height: 20,
    marginRight: 10,
  },

  categoryChipActive: {
    display: 'flex',
    paddingVertical: 7,
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 42,
    backgroundColor: '#FF7F50',
    marginRight: 5,
  },

  categoryTextActive: {
    color: '#FFF',
    fontFamily: 'Pretendard',
    fontSize: 13,
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: 16,
    letterSpacing: -0.12,
  },

  sortButtonActive: {
    display: 'flex',
    paddingVertical: 7,
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    borderRadius: 42,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    marginRight: 5,
  },

  sortTextActive: {
    color: '#659DF2',
    fontFamily: 'Pretendard',
    fontSize: 13,
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: 16,
    letterSpacing: -0.12,
  },

  districtChipActive: {
    display: 'flex',
    paddingVertical: 7,
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 42,
    backgroundColor: '#FFF',
    marginRight: 5,
  },

  districtTextActive: {
    color: '#659DF2',
    fontFamily: 'Pretendard',
    fontSize: 13,
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: 16,
    letterSpacing: -0.12,
  },

  searchInput: {
    flex: 1,
    color: '#34495E',
    fontFamily: 'Pretendard',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },

  resultsContainer: {
    padding: 20,
  },

  resultsTitle: {
    color: '#FFF',
    fontFamily: 'Pretendard',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },

  resultsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  cardWrapper: {
    width: '48%',
    marginBottom: 12,
  },

  placeImageContainer: {
    position: 'relative',
    width: '100%',
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#2C3E50',
  },

  placeImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
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

  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },

  docentFaceImage: {
    width: 108,
    height: 94,
    aspectRatio: 54 / 47,
    marginBottom: 20,
  },

  oopsText: {
    marginBottom: 20,
  },

  noResultsTextContainer: {
    alignItems: 'center',
  },

  noResultsText: {
    textAlign: 'center',
  },

  noResultsRegular: {
    color: '#FEF5E7',
    fontFamily: 'Pretendard',
    fontSize: 16,
    fontWeight: '400',
  },

  noResultsBold: {
    color: '#FEF5E7',
    fontFamily: 'Pretendard',
    fontSize: 16,
    fontWeight: '700',
  },

  recommendationCard: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
    gap: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FEF5E7',
    backgroundColor: '#FEF5E7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
    marginTop: 20,
    marginBottom: 10,
  },

  cardImagesContainer: {
    position: 'relative',
    width: 65,
    height: 66,
  },

  rionImage: {
    width: 65,
    height: 66,
    transform: [{ rotate: '-15deg' }],
    position: 'absolute',
    top: -15,
    left: 0,
  },

  mapIconImage: {
    width: 40,
    height: 40,
    transform: [{ rotate: '15deg' }],
    position: 'absolute',
    bottom: -20,
    right: -15,
  },

  cardTextContainer: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 10,
  },

  cardTitle: {
    color: '#4A90E2',
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    letterSpacing: -0.18,
    textAlign: 'left',
  },

  cardDescription: {
    color: '#4A90E2',
    fontFamily: 'Pretendard',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: -0.16,
    textAlign: 'left',
  },

  tryItButtonContainer: {
    marginBottom: 54,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
    borderRadius: 10,
  },

  tryItButton: {
    height: 47,
    flexShrink: 0,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  tryItIcon: {
    marginLeft: 13,
  },

  tryItText: {
    color: '#FFF',
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '400',
    marginLeft: 8,
    flex: 1,
  },

  tryItArrow: {
    marginRight: 17,
  },

  aiDocentCard: {
    padding: 20,
    alignItems: 'center',
    gap: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FEF5E7',
    backgroundColor: '#FEF5E7',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
    marginBottom: 10,
  },

  aiDocentIconContainer: {
    padding: 20,
    alignItems: 'center',
    gap: 10,
    flex: 1,
    borderRadius: 10,
    backgroundColor: '#FFF',
  },

  aiDocentTextContainer: {
    width: 161.865,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 10,
    flexShrink: 0,
  },

  aiDocentTitle: {
    color: '#4A90E2',
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    letterSpacing: -0.18,
    textAlign: 'left',
  },

  aiDocentDescription: {
    color: '#4A90E2',
    fontFamily: 'Pretendard',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: -0.16,
    textAlign: 'left',
  },

  askAiButtonContainer: {
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
    borderRadius: 10,
  },

  askAiButton: {
    height: 47,
    flexShrink: 0,
    borderRadius: 10,
    backgroundColor: '#8FB6F1',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
  },

  askAiArrow: {
    marginRight: 2,
  },

  // Bottom Route Selection Bar
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
  questSlotSelected: {
    backgroundColor: '#FF9B7A', // 꾸욱 누르면 색이 약간 진하게
    borderWidth: 2,
    borderColor: '#FF7F50',
    shadowColor: '#FF7F50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
  },
  slotImageContainer: {
    width: 58,
    height: 60,
    position: 'relative',
  },
  slotQuestImage: {
    width: 58,
    height: 60,
    borderRadius: 10,
  },
  slotNumberContainer: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(239, 106, 57, 0.9)',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  slotNumber: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 10,
  },
  slotRemoveIconContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -6 }, { translateY: -6 }],
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
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
  slotPlusImage: {
    width: 58,
    height: 60,
    borderRadius: 10,
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

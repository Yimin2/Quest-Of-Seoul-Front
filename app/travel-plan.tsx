import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Svg, { ClipPath, Defs, G, Path, Rect } from 'react-native-svg';

import { aiStationApi, mapApi } from '@/services/api';
import { useQuestStore } from '@entities/quest';
import { Images } from '@shared/config';
import { ThemedText } from '@shared/ui';

import RouteResultList from '@/components/RouteResultList';

const makeId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

type Message = {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  timestamp: Date;
};

const formatTimestamp = (date: Date) => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  return `${ampm} ${displayHours}:${displayMinutes}`;
};

const createInitialMessages = (): Message[] => [
  {
    id: makeId(),
    role: 'assistant',
    text: "Hello! I'll recommend a travel route in Seoul. Please answer the questions!",
    timestamp: new Date(),
  },
];

export default function TravelPlanScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const {
    selectedQuests,
    routeResults: storedRouteResults,
    setRouteResults: storeRouteResults,
    clearRouteResults,
  } = useQuestStore();

  const [messages, setMessages] = useState<Message[]>(createInitialMessages());
  const [questStep, setQuestStep] = useState<number>(0);
  const [preferences, setPreferences] = useState<any>({});
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [radiusKm, setRadiusKm] = useState<number | null>(null);

  // 선택된 옵션을 state로 관리
  const [currentSelection, setCurrentSelection] = useState<string | null>(null);
  const [canContinue, setCanContinue] = useState(false);
  const [pendingStepAnswer, setPendingStepAnswer] = useState<string | null>(null);

  const [routeResults, setRouteResults] = useState<any[] | null>(storedRouteResults);
  const [viewMode, setViewMode] = useState<'chat' | 'result'>(
    storedRouteResults ? 'result' : 'chat',
  );

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });
      }
    })();

    startTravelPlanFlow();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  // questStep 변경 시 상태 초기화
  useEffect(() => {
    setCurrentSelection(null);
    setCanContinue(false);
    setPendingStepAnswer(null);
  }, [questStep]);

  const addMessage = (text: string, role: 'assistant' | 'user') => {
    setMessages((prev) => [...prev, { id: makeId(), role, text, timestamp: new Date() }]);
  };

  const startTravelPlanFlow = () => {
    const cartCount = selectedQuests.length;
    if (cartCount > 0) {
      addMessage(`You have ${cartCount} place(s) in your quest cart.`, 'assistant');
      if (cartCount === 1) {
        addMessage(
          'Would you like me to create 4 courses including this place, or create 4 new courses?',
          'assistant',
        );
      } else {
        addMessage(
          `Would you like me to create 4 courses including the first place (${selectedQuests[0].name}), or create 4 new courses?`,
          'assistant',
        );
      }
      setQuestStep(0);
    } else {
      addMessage("I'll create a new travel route for you!", 'assistant');
      addMessage('Where would you like to start?', 'assistant');
      setQuestStep(1);
    }
  };

  const handleAnswer = useCallback(
    async (answer: string) => {
      addMessage(answer, 'user');

      if (questStep === 0) {
        if (answer.includes('Include') || answer.includes('Required')) {
          setPreferences((prev: any) => ({ ...prev, includeCart: true }));
          addMessage('Great! Where would you like to start?', 'assistant');
          setQuestStep(1);
        } else {
          setPreferences((prev: any) => ({ ...prev, includeCart: false }));
          addMessage("I'll ask you some questions to create a new course!", 'assistant');
          addMessage('Where would you like to start?', 'assistant');
          setQuestStep(1);
        }
        setCurrentSelection(null);
        setCanContinue(false);
        setPendingStepAnswer(null);
        return;
      }

      if (questStep === 1) {
        if (answer === 'Current Location') {
          if (location) {
            setPreferences((prev: any) => ({
              ...prev,
              useCurrentLocation: true,
              startLatitude: location.latitude,
              startLongitude: location.longitude,
            }));
            addMessage(
              'Starting from your current location! How far from the starting point are you willing to travel?',
              'assistant',
            );
          } else {
            addMessage('Unable to get location information. Please try again.', 'assistant');
            return;
          }
        } else {
          // 각 역의 위도/경도 매핑
          const stationCoordinates: {
            [key: string]: { lat: number; lon: number };
          } = {
            'Seoul Station': { lat: 37.5547, lon: 126.9707 },
            'Gangnam Station': { lat: 37.4979, lon: 127.0276 },
            'Hongik Univ. Station': { lat: 37.5572, lon: 126.9236 },
            'Myeongdong Station': { lat: 37.5635, lon: 126.9849 },
          };

          const coords = stationCoordinates[answer];
          if (coords) {
            setPreferences((prev: any) => ({
              ...prev,
              useCurrentLocation: false,
              startLocation: answer,
              startLatitude: coords.lat,
              startLongitude: coords.lon,
            }));
          } else {
            setPreferences((prev: any) => ({
              ...prev,
              useCurrentLocation: false,
              startLocation: answer,
            }));
          }
          addMessage(
            `Starting from ${answer}! How far from the starting point are you willing to travel?`,
            'assistant',
          );
        }
        setQuestStep(2);
        setCurrentSelection(null);
        setCanContinue(false);
        setPendingStepAnswer(null);
        return;
      }

      if (questStep === 2) {
        // Radius selection
        const radius = parseInt(answer.replace('km', ''));
        setRadiusKm(radius);
        setPreferences((prev: any) => ({
          ...prev,
          radius_km: radius,
        }));
        addMessage(
          `Within ${radius}km from the starting point! What travel theme would you like?`,
          'assistant',
        );
        setQuestStep(3);
        setCurrentSelection(null);
        setCanContinue(false);
        setPendingStepAnswer(null);
        return;
      }

      if (questStep === 3) {
        // Theme 다중 선택 처리
        if (answer === 'Done') {
          if (selectedThemes.length === 0) {
            addMessage('Please select at least 1 theme!', 'assistant');
            return;
          }

          setPreferences((prev: any) => ({
            ...prev,
            theme: selectedThemes, // 배열로 전달
            category: selectedThemes.length === 1 ? selectedThemes[0] : selectedThemes[0], // 첫 번째를 category로도 설정 (하위 호환성)
          }));

          const themeList = selectedThemes.join(', ');
          addMessage(`Selected themes: ${themeList}`, 'assistant');
          addMessage(
            'Great! Which districts would you like to visit? (You can select multiple or choose "Anywhere")',
            'assistant',
          );
          setQuestStep(4);
          setCurrentSelection(null);
          setCanContinue(false);
          setPendingStepAnswer(null);
          return;
        }

        // Theme 선택/해제는 renderOptions에서 처리
        return;
      }

      if (questStep === 4) {
        if (answer === 'Anywhere') {
          // Anywhere 선택 시 API 호출 (districts를 빈 배열로 설정)
          const finalPreferences = {
            ...preferences,
            districts: [], // 빈 배열 = anywhere (장소 고려 안 함)
          };
          setPreferences(finalPreferences);
          addMessage('Creating recommended courses for anywhere in Seoul...', 'assistant');
          setIsLoading(true);
          setCurrentSelection(null);
          setCanContinue(false);
          setPendingStepAnswer(null);

          try {
            // 장바구니에 담은 장소를 must_visit으로 설정
            const firstQuest = selectedQuests.length > 0 ? selectedQuests[0] : null;

            let mustVisitPlaceId: string | undefined = undefined;
            let mustVisitQuestId: number | undefined = undefined;

            if (firstQuest) {
              if (selectedQuests.length === 1 || finalPreferences.includeCart) {
                if (firstQuest.place_id) {
                  mustVisitPlaceId = firstQuest.place_id;
                } else if (firstQuest.id) {
                  mustVisitQuestId = firstQuest.id;
                }
              }
            }

            const radiusKmValue = finalPreferences.radius_km || radiusKm || 15.0;

            const startLat = finalPreferences.startLatitude;
            const startLon = finalPreferences.startLongitude;
            const hasStartPoint = startLat !== undefined && startLon !== undefined;

            const currentLat = finalPreferences.useCurrentLocation ? location?.latitude : undefined;
            const currentLon = finalPreferences.useCurrentLocation
              ? location?.longitude
              : undefined;

            const cleanPreferences: any = {
              theme: finalPreferences.theme,
              category: finalPreferences.category,
              districts: finalPreferences.districts || [],
            };
            if (finalPreferences.includeCart !== undefined) {
              cleanPreferences.include_cart = finalPreferences.includeCart;
            }
            if (finalPreferences.text_query) {
              cleanPreferences.text_query = finalPreferences.text_query;
            }

            const apiRequest: any = {
              preferences: cleanPreferences,
              radius_km: radiusKmValue,
              must_visit_place_id: mustVisitPlaceId,
              must_visit_quest_id: mustVisitQuestId,
            };

            if (hasStartPoint) {
              apiRequest.start_latitude = startLat;
              apiRequest.start_longitude = startLon;
              if (currentLat !== undefined && currentLon !== undefined) {
                apiRequest.latitude = currentLat;
                apiRequest.longitude = currentLon;
              }
            } else {
              if (currentLat !== undefined && currentLon !== undefined) {
                apiRequest.latitude = currentLat;
                apiRequest.longitude = currentLon;
              }
            }

            const response = await aiStationApi.routeRecommend(apiRequest);

            if (response.success && response.quests) {
              // 출발 지점 결정 (현재 위치 또는 지정된 위치)
              const startLat =
                finalPreferences.useCurrentLocation && location
                  ? location.latitude
                  : finalPreferences.startLatitude || location?.latitude;
              const startLon =
                finalPreferences.useCurrentLocation && location
                  ? location.longitude
                  : finalPreferences.startLongitude || location?.longitude;

              // 거리 계산 및 GPS 기준 정렬
              const questsWithDistance = response.quests.map((quest: any) => {
                let distance = null;
                if (startLat && startLon && quest.latitude && quest.longitude) {
                  distance = mapApi.calculateDistance(
                    startLat,
                    startLon,
                    quest.latitude,
                    quest.longitude,
                  );
                }
                return {
                  ...quest,
                  distance_km: distance ? Number(distance.toFixed(1)) : null,
                  distance_from_start: distance || Infinity,
                };
              });

              // GPS 기준 정렬 (출발 지점 기준 가까운 순)
              const sortedQuests = questsWithDistance.sort((a, b) => {
                const distA = a.distance_from_start ?? Infinity;
                const distB = b.distance_from_start ?? Infinity;
                return distA - distB;
              });

              setRouteResults(sortedQuests);
              storeRouteResults(sortedQuests);
              addMessage(
                `Recommended courses are ready! (${response.quests.length} places)`,
                'assistant',
              );
              addMessage('Please click the button below to view the results!', 'assistant');
              setQuestStep(5);
            } else {
              addMessage('Failed to create recommended courses. Please try again.', 'assistant');
              setQuestStep(0);
            }
          } catch (error) {
            addMessage('An error occurred. Please try again.', 'assistant');
            setQuestStep(0);
          } finally {
            setIsLoading(false);
          }
          return;
        }

        if (answer === 'Done') {
          if (selectedDistricts.length === 0) {
            addMessage('Please select at least 1 district!', 'assistant');
            return;
          }

          const finalPreferences = {
            ...preferences,
            districts: selectedDistricts,
          };
          setPreferences(finalPreferences);

          const districtList = selectedDistricts.join(', ');
          addMessage(`Creating recommended courses for ${districtList}...`, 'assistant');
          setIsLoading(true);
          setCurrentSelection(null);
          setCanContinue(false);
          setPendingStepAnswer(null);

          try {
            // 장바구니에 담은 장소를 must_visit으로 설정
            const firstQuest = selectedQuests.length > 0 ? selectedQuests[0] : null;

            let mustVisitPlaceId: string | undefined = undefined;
            let mustVisitQuestId: number | undefined = undefined;

            if (firstQuest) {
              if (selectedQuests.length === 1 || finalPreferences.includeCart) {
                if (firstQuest.place_id) {
                  mustVisitPlaceId = firstQuest.place_id;
                } else if (firstQuest.id) {
                  mustVisitQuestId = firstQuest.id;
                }
              }
            }

            const radiusKmValue = finalPreferences.radius_km || radiusKm || 15.0;

            const startLat = finalPreferences.startLatitude;
            const startLon = finalPreferences.startLongitude;
            const hasStartPoint = startLat !== undefined && startLon !== undefined;

            const currentLat = finalPreferences.useCurrentLocation ? location?.latitude : undefined;
            const currentLon = finalPreferences.useCurrentLocation
              ? location?.longitude
              : undefined;

            const cleanPreferences: any = {
              theme: finalPreferences.theme,
              category: finalPreferences.category,
              districts: finalPreferences.districts || [],
            };
            if (finalPreferences.includeCart !== undefined) {
              cleanPreferences.include_cart = finalPreferences.includeCart;
            }
            if (finalPreferences.text_query) {
              cleanPreferences.text_query = finalPreferences.text_query;
            }

            const apiRequest: any = {
              preferences: cleanPreferences,
              radius_km: radiusKmValue,
              must_visit_place_id: mustVisitPlaceId,
              must_visit_quest_id: mustVisitQuestId,
            };

            if (hasStartPoint) {
              apiRequest.start_latitude = startLat;
              apiRequest.start_longitude = startLon;
              if (currentLat !== undefined && currentLon !== undefined) {
                apiRequest.latitude = currentLat;
                apiRequest.longitude = currentLon;
              }
            } else {
              if (currentLat !== undefined && currentLon !== undefined) {
                apiRequest.latitude = currentLat;
                apiRequest.longitude = currentLon;
              }
            }

            const response = await aiStationApi.routeRecommend(apiRequest);

            if (response.success && response.quests) {
              // 출발 지점 결정
              const startLat =
                finalPreferences.useCurrentLocation && location
                  ? location.latitude
                  : finalPreferences.startLatitude || location?.latitude;
              const startLon =
                finalPreferences.useCurrentLocation && location
                  ? location.longitude
                  : finalPreferences.startLongitude || location?.longitude;

              // 거리 계산 및 GPS 기준 정렬
              const questsWithDistance = response.quests.map((quest: any) => {
                let distance = null;
                if (startLat && startLon && quest.latitude && quest.longitude) {
                  distance = mapApi.calculateDistance(
                    startLat,
                    startLon,
                    quest.latitude,
                    quest.longitude,
                  );
                }
                return {
                  ...quest,
                  distance_km: distance ? Number(distance.toFixed(1)) : null,
                  distance_from_start: distance || Infinity,
                };
              });

              // GPS 기준 정렬
              const sortedQuests = questsWithDistance.sort((a, b) => {
                const distA = a.distance_from_start ?? Infinity;
                const distB = b.distance_from_start ?? Infinity;
                return distA - distB;
              });

              setRouteResults(sortedQuests);
              storeRouteResults(sortedQuests);
              addMessage(
                `Recommended courses are ready! (${response.quests.length} places)`,
                'assistant',
              );
              addMessage('Please click the button below to view the results!', 'assistant');
              setQuestStep(5);
            } else {
              addMessage('Failed to create recommended courses. Please try again.', 'assistant');
              setQuestStep(0);
            }
          } catch (error) {
            addMessage('An error occurred. Please try again.', 'assistant');
            setQuestStep(0);
          } finally {
            setIsLoading(false);
          }
        }
        return;
      }

      if (questStep === 5) {
        if (answer === 'View Results') {
          setViewMode('result');
        } else {
          addMessage("I'll recommend again from the beginning!", 'assistant');
          setQuestStep(0);
          setPreferences({});
          setSelectedDistricts([]);
          setSelectedThemes([]);
          setRadiusKm(null);
          setRouteResults(null);
          startTravelPlanFlow();
        }
        setCurrentSelection(null);
        setCanContinue(false);
        setPendingStepAnswer(null);
        return;
      }
    },
    [questStep, preferences, location, selectedQuests, selectedDistricts, selectedThemes, radiusKm],
  );

  if (viewMode === 'result' && routeResults) {
    return (
      <RouteResultList
        places={routeResults}
        onPressPlace={(quest) => {
          router.push({
            pathname: '/(tabs)/map/quest-detail',
            params: { quest: JSON.stringify(quest) },
          });
        }}
        onClose={() => {
          setViewMode('chat');
          clearRouteResults();
        }}
        onStartNavigation={() => {
          // 4개 장소를 장바구니에 추가
          const { addQuest, clearQuests } = useQuestStore.getState();

          // 기존 장바구니 비우기 (선택사항 - 필요시 주석 처리)
          // clearQuests();

          // 최대 4개까지 장바구니에 추가
          const questsToAdd = routeResults.slice(0, 4);
          questsToAdd.forEach((quest) => {
            addQuest(quest);
          });

          // 맵 화면으로 이동
          router.push('/(tabs)/map');
        }}
      />
    );
  }

  const renderOptions = () => {
    if (isLoading) return null;

    switch (questStep) {
      case 0:
        return (
          <OptionRow
            options={['Include Required', 'Recommend 4 New']}
            selected={currentSelection}
            onSelect={(opt) => {
              setCurrentSelection(opt);
              setPendingStepAnswer(opt);
              setCanContinue(true);
            }}
          />
        );
      case 1:
        return (
          <OptionRow
            options={[
              'Current Location',
              'Seoul Station',
              'Gangnam Station',
              'Hongik Univ. Station',
              'Myeongdong Station',
            ]}
            selected={currentSelection}
            onSelect={(opt) => {
              setCurrentSelection(opt);
              setPendingStepAnswer(opt);
              setCanContinue(true);
            }}
          />
        );
      case 2:
        return (
          <OptionRow
            options={['5km', '10km', '15km', '20km', '25km', '30km']}
            selected={currentSelection}
            onSelect={(opt) => {
              setCurrentSelection(opt);
              setPendingStepAnswer(opt);
              setCanContinue(true);
            }}
          />
        );
      case 3:
        return (
          <View>
            <ThemeSelector
              selectedThemes={selectedThemes}
              onSelect={(theme) => {
                setSelectedThemes((prev) => {
                  const updated = prev.includes(theme)
                    ? prev.filter((t) => t !== theme)
                    : [...prev, theme];
                  setCanContinue(updated.length > 0);
                  return updated;
                });
              }}
            />
          </View>
        );
      case 4:
        return (
          <DistrictSelector
            selectedDistricts={selectedDistricts}
            onSelect={(district) => {
              if (district === 'Anywhere') {
                setSelectedDistricts(['Anywhere']);
                setCanContinue(true);
                setPendingStepAnswer('Anywhere');
              } else {
                setSelectedDistricts((prev) => {
                  const updated = prev.includes(district)
                    ? prev.filter((d) => d !== district)
                    : [...prev.filter((d) => d !== 'Anywhere'), district];
                  setCanContinue(updated.length > 0);
                  if (updated.length > 0) {
                    setPendingStepAnswer('Done');
                  } else {
                    setPendingStepAnswer(null);
                  }
                  return updated;
                });
              }
            }}
          />
        );
      case 5:
        return (
          <OptionRow
            options={['View Results', 'Recommend Again']}
            selected={currentSelection}
            onSelect={(opt) => {
              setCurrentSelection(opt);
              setPendingStepAnswer(opt);
              setCanContinue(true);
            }}
          />
        );
      default:
        return null;
    }
  };

  const exitToPrevious = () => {
    router.back();
  };

  const handleClose = () => {
    // 대화 종료 - 초기화하고 이전 화면으로
    setMessages(createInitialMessages());
    setQuestStep(0);
    setPreferences({});
    setSelectedDistricts([]);
    setSelectedThemes([]);
    setRadiusKm(null);
    setRouteResults(null);
    clearRouteResults();
    router.back();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: '#8FB6F1' }}
    >
      <View style={styles.container}>
        {/* Background Stars */}
        <View style={styles.backgroundStars}>
          <Svg width="194" height="195" viewBox="0 0 194 195" fill="none" style={styles.bigStar}>
            <Path
              d="M193.967 97.1671C194.05 100.086 193.128 102.947 191.356 105.268C189.584 107.589 187.069 109.232 184.231 109.922C167.582 116.056 151.03 122.191 134.284 128.033C132.771 128.5 131.395 129.33 130.275 130.45C129.155 131.57 128.325 132.945 127.858 134.458C122.113 150.717 116.174 166.879 110.235 183.139C109.578 186.182 107.913 188.913 105.51 190.892C103.107 192.871 100.106 193.983 96.9939 194.044C93.8025 193.952 90.7321 192.8 88.265 190.773C85.7979 188.747 84.0735 185.959 83.363 182.846C77.5212 166.684 71.5822 150.522 65.7404 134.165C65.316 132.736 64.5417 131.437 63.4876 130.383C62.4335 129.329 61.133 128.554 59.704 128.13C42.9577 122.191 26.406 116.056 9.75708 109.922C6.85892 109.24 4.29446 107.559 2.51374 105.173C0.73302 102.787 -0.149966 99.8496 0.0208503 96.8771C-0.0708871 93.9332 0.844134 91.0449 2.61417 88.6907C4.3842 86.3366 6.90348 84.6566 9.75708 83.9272C26.2113 77.8908 42.6657 71.756 59.2173 65.9143C60.7302 65.4465 62.1064 64.6166 63.2261 63.4969C64.3459 62.3771 65.1752 61.0022 65.643 59.4893C71.3873 43.3272 77.327 27.0677 83.2661 10.8082C83.9263 7.77517 85.5945 5.05522 87.9993 3.09248C90.4041 1.12975 93.4034 0.0390538 96.5073 0C102.836 0 107.315 3.60373 110.041 11.1006C115.98 27.2627 121.918 43.5222 127.76 59.7816C128.162 61.2327 128.928 62.5568 129.984 63.63C131.04 64.7032 132.352 65.4891 133.797 65.9143C150.673 71.8209 167.452 77.9235 184.133 84.2196C187.032 84.8794 189.606 86.5369 191.404 88.9047C193.202 91.2724 194.11 94.1975 193.967 97.1671Z"
              fill="#659DF2"
            />
          </Svg>
          <Svg width="91" height="112" viewBox="0 0 111 112" fill="none" style={styles.smallStar}>
            <Path
              d="M110.129 55.5958C110.171 57.2594 109.657 58.8889 108.67 60.2286C107.683 61.5683 106.278 62.5421 104.677 62.9954L76.1501 73.4115C75.2756 73.6429 74.4753 74.0973 73.8271 74.7283C73.179 75.3594 72.7049 76.147 72.4502 77.015C69.1399 86.7512 65.7323 95.6099 62.714 104.957C62.3368 106.692 61.3782 108.246 59.9971 109.361C58.616 110.477 56.8948 111.088 55.1195 111.092C53.2932 111.087 51.5238 110.456 50.1064 109.304C48.6889 108.153 47.7092 106.548 47.3306 104.762C43.9229 95.0256 40.5152 86.1669 37.5944 76.9176C37.3434 76.0902 36.8925 75.3373 36.2811 74.726C35.6697 74.1146 34.9169 73.6625 34.0895 73.4115L5.46492 62.9954C3.8288 62.5701 2.39098 61.5887 1.39667 60.2215C0.402362 58.8543 -0.0868065 57.186 0.0126555 55.4984C-0.0223303 53.7967 0.515252 52.1324 1.53929 50.7729C2.56333 49.4134 4.01462 48.4374 5.65984 48.0013L33.992 37.7778C34.8614 37.5053 35.6523 37.0268 36.2965 36.3825C36.9408 35.7383 37.4193 34.9462 37.6918 34.0768C41.0021 24.3406 44.4098 15.482 47.4281 6.23262C47.7686 4.47141 48.7142 2.88508 50.101 1.74721C51.4878 0.609352 53.2282 -0.00980297 55.022 0.000117385C56.8483 0.00498416 58.6183 0.635961 60.0357 1.78762C61.4532 2.93929 62.4329 4.54344 62.8115 6.33008C66.2192 16.0663 69.6268 24.9249 72.5477 34.1743C72.7548 35.0236 73.1912 35.8001 73.8093 36.4182C74.4274 37.0363 75.2033 37.4733 76.0526 37.6804C85.7888 41.088 95.5251 44.6912 105.261 48.1962C106.762 48.7395 108.048 49.7531 108.925 51.0867C109.802 52.4202 110.225 54.0024 110.129 55.5958Z"
              fill="#659DF2"
            />
          </Svg>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={exitToPrevious} style={styles.menuButton}>
            <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <Path
                d="M3.33334 15C3.09723 15 2.89945 14.92 2.74 14.76C2.58056 14.6 2.50056 14.4022 2.5 14.1667C2.49945 13.9311 2.57945 13.7333 2.74 13.5733C2.90056 13.4133 3.09834 13.3333 3.33334 13.3333H16.6667C16.9028 13.3333 17.1008 13.4133 17.2608 13.5733C17.4208 13.7333 17.5006 13.9311 17.5 14.1667C17.4994 14.4022 17.4194 14.6003 17.26 14.7608C17.1006 14.9214 16.9028 15.0011 16.6667 15H3.33334ZM3.33334 10.8333C3.09723 10.8333 2.89945 10.7533 2.74 10.5933C2.58056 10.4333 2.50056 10.2356 2.5 10C2.49945 9.76444 2.57945 9.56667 2.74 9.40667C2.90056 9.24667 3.09834 9.16667 3.33334 9.16667H16.6667C16.9028 9.16667 17.1008 9.24667 17.2608 9.40667C17.4208 9.56667 17.5006 9.76444 17.5 10C17.4994 10.2356 17.4194 10.4336 17.26 10.5942C17.1006 10.7547 16.9028 10.8344 16.6667 10.8333H3.33334ZM3.33334 6.66667C3.09723 6.66667 2.89945 6.58667 2.74 6.42667C2.58056 6.26667 2.50056 6.06889 2.5 5.83333C2.49945 5.59778 2.57945 5.4 2.74 5.24C2.90056 5.08 3.09834 5 3.33334 5H16.6667C16.9028 5 17.1008 5.08 17.2608 5.24C17.4208 5.4 17.5006 5.59778 17.5 5.83333C17.4994 6.06889 17.4194 6.26694 17.26 6.4275C17.1006 6.58806 16.9028 6.66778 16.6667 6.66667H3.33334Z"
                fill="white"
              />
            </Svg>
          </Pressable>
          <ThemedText style={styles.headerTitle}>Plan Chat</ThemedText>
          <Pressable onPress={handleClose} style={styles.closeButton}>
            <Svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <G clipPath="url(#clip0_418_8934)">
                <Path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M1.82891 0.313458C1.62684 0.118289 1.35619 0.0102947 1.07527 0.0127358C0.794342 0.015177 0.525614 0.127858 0.326962 0.32651C0.128311 0.525161 0.0156299 0.793889 0.0131887 1.07481C0.0107476 1.35574 0.118742 1.62638 0.313911 1.82846L5.98498 7.49953L0.313911 13.1706C0.211579 13.2694 0.129955 13.3877 0.0738023 13.5184C0.0176498 13.6491 -0.0119069 13.7897 -0.0131431 13.932C-0.0143794 14.0742 0.0127296 14.2153 0.066602 14.347C0.120474 14.4787 0.200031 14.5983 0.300631 14.6989C0.40123 14.7995 0.520857 14.879 0.652532 14.9329C0.784206 14.9868 0.925291 15.0139 1.06756 15.0127C1.20982 15.0114 1.35041 14.9819 1.48113 14.9257C1.61185 14.8696 1.73008 14.7879 1.82891 14.6856L7.49998 9.01453L13.1711 14.6856C13.3731 14.8808 13.6438 14.9888 13.9247 14.9863C14.2056 14.9839 14.4743 14.8712 14.673 14.6726C14.8717 14.4739 14.9843 14.2052 14.9868 13.9242C14.9892 13.6433 14.8812 13.3727 14.6861 13.1706L9.01498 7.49953L14.6861 1.82846C14.8812 1.62638 14.9892 1.35574 14.9868 1.07481C14.9843 0.793889 14.8717 0.525161 14.673 0.32651C14.4743 0.127858 14.2056 0.015177 13.9247 0.0127358C13.6438 0.0102947 13.3731 0.118289 13.1711 0.313458L7.49998 5.98453L1.82891 0.313458Z"
                  fill="white"
                />
              </G>
              <Defs>
                <ClipPath id="clip0_418_8934">
                  <Rect width="15" height="15" fill="white" />
                </ClipPath>
              </Defs>
            </Svg>
          </Pressable>
        </View>

        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={styles.messages}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((msg, index) => (
            <React.Fragment key={msg.id}>
              <View style={styles.messageContainer}>
                {msg.role === 'assistant' ? (
                  <View style={styles.assistantMessageRow}>
                    <View style={styles.profileCircle}>
                      <Image
                        source={require('@/assets/images/face-3.png')}
                        style={styles.profileImage}
                        resizeMode="contain"
                      />
                    </View>
                    <View style={styles.assistantContentColumn}>
                      <ThemedText style={styles.nickname}>AI Docent</ThemedText>
                      <View style={styles.bubbleWithTime}>
                        <View style={styles.assistantBubble}>
                          <ThemedText style={styles.assistantBubbleText}>{msg.text}</ThemedText>
                        </View>
                        <ThemedText style={styles.timestamp}>
                          {formatTimestamp(msg.timestamp)}
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={styles.userBubbleContainer}>
                    <ThemedText style={styles.timestamp}>
                      {formatTimestamp(msg.timestamp)}
                    </ThemedText>
                    <View style={styles.userBubble}>
                      <ThemedText style={styles.userText}>{msg.text}</ThemedText>
                    </View>
                  </View>
                )}
              </View>

              {/* 첫 번째 AI Docent 메시지 뒤에 퀘스트 카트 표시 (퀘스트가 있을 때만) */}
              {index === 0 && msg.role === 'assistant' && selectedQuests.length > 0 && (
                <View style={styles.cartOuterContainer}>
                  <LinearGradient
                    colors={['#FF7F50', '#994C30']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.cartGradientContainer}
                  >
                    {[0, 1, 2, 3].map((slotIndex) => {
                      const quest = selectedQuests[slotIndex];
                      return (
                        <View key={slotIndex} style={styles.cartSlot}>
                          {quest ? (
                            <Image
                              source={{ uri: quest.place_image_url }}
                              style={styles.cartSlotImage}
                              resizeMode="cover"
                            />
                          ) : (
                            <Image
                              source={Images.group57}
                              style={styles.cartSlotImage}
                              resizeMode="cover"
                            />
                          )}
                        </View>
                      );
                    })}
                  </LinearGradient>
                </View>
              )}
            </React.Fragment>
          ))}

          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#659DF2" />
              <ThemedText style={styles.loadingText}>Creating recommended route...</ThemedText>
            </View>
          )}
        </ScrollView>

        {renderOptions()}

        {/* Continue 버튼 - 하단 고정 */}
        <View style={styles.fixedContinueContainer}>
          <Pressable
            disabled={!canContinue || isLoading}
            style={[
              styles.fixedContinueButton,
              (!canContinue || isLoading) && styles.fixedContinueButtonDisabled,
            ]}
            onPress={() => {
              if (pendingStepAnswer) {
                handleAnswer(pendingStepAnswer);
                setPendingStepAnswer(null);
                setCanContinue(false);
              } else if (questStep === 3 && selectedThemes.length > 0) {
                handleAnswer('Done');
                setCanContinue(false);
              } else if (questStep === 4) {
                if (selectedDistricts.includes('Anywhere')) {
                  handleAnswer('Anywhere');
                } else if (selectedDistricts.length > 0) {
                  handleAnswer('Done');
                }
                setCanContinue(false);
              }
            }}
          >
            <ThemedText style={styles.fixedContinueText}>Continue</ThemedText>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function OptionRow({
  options,
  selected,
  onSelect,
}: {
  options: string[];
  selected: string | null;
  onSelect: (s: string) => void;
}) {
  return (
    <View style={optionStyles.row}>
      {options.map((opt) => {
        const isSelected = selected === opt;
        return (
          <Pressable
            key={opt}
            style={[optionStyles.button, isSelected && { backgroundColor: '#FF7F50' }]}
            onPress={() => onSelect(opt)}
          >
            <ThemedText style={optionStyles.text}>{opt}</ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

function ThemeSelector({
  selectedThemes,
  onSelect,
}: {
  selectedThemes: string[];
  onSelect: (s: string) => void;
}) {
  const themes = [
    'History',
    'Nature',
    'Culture',
    'Events',
    'Shopping',
    'Food',
    'Extreme',
    'Activities',
  ];

  return (
    <View style={themeStyles.container}>
      <View style={themeStyles.grid}>
        {themes.map((theme) => {
          const isSelected = selectedThemes.includes(theme);
          return (
            <Pressable
              key={theme}
              style={[themeStyles.themeButton, isSelected && themeStyles.themeButtonSelected]}
              onPress={() => onSelect(theme)}
            >
              <ThemedText
                style={[themeStyles.themeText, isSelected && themeStyles.themeTextSelected]}
              >
                {theme}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function DistrictSelector({
  selectedDistricts,
  onSelect,
}: {
  selectedDistricts: string[];
  onSelect: (s: string) => void;
}) {
  const districts = [
    'Anywhere',
    'Gangnam-gu',
    'Gangdong-gu',
    'Gangbuk-gu',
    'Gangseo-gu',
    'Gwanak-gu',
    'Gwangjin-gu',
    'Guro-gu',
    'Geumcheon-gu',
    'Nowon-gu',
    'Dobong-gu',
    'Dongdaemun-gu',
    'Dongjak-gu',
    'Mapo-gu',
    'Seodaemun-gu',
    'Seocho-gu',
    'Seongdong-gu',
    'Seongbuk-gu',
    'Songpa-gu',
    'Yangcheon-gu',
    'Yeongdeungpo-gu',
    'Yongsan-gu',
    'Eunpyeong-gu',
    'Jongno-gu',
    'Jung-gu',
    'Jungnang-gu',
  ];

  return (
    <View style={districtStyles.container}>
      <View style={districtStyles.grid}>
        {districts.map((district) => {
          const isSelected = selectedDistricts.includes(district);
          return (
            <Pressable
              key={district}
              style={[
                districtStyles.districtButton,
                isSelected && districtStyles.districtButtonSelected,
              ]}
              onPress={() => onSelect(district)}
            >
              <ThemedText
                style={[
                  districtStyles.districtText,
                  isSelected && districtStyles.districtTextSelected,
                ]}
              >
                {district}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const optionStyles = StyleSheet.create({
  row: {
    position: 'absolute',
    bottom: 90,
    left: 0,
    right: 0,
    width: '100%',
    maxHeight: 267,
    padding: 10,
    paddingHorizontal: 20,
    paddingBottom: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 10,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: '#162028',
    zIndex: 100,
    elevation: 100,
  },
  button: {
    height: 40,
    paddingVertical: 7,
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 39,
    backgroundColor: '#34495E',
  },
  text: {
    color: '#FFF',
    textAlign: 'center',
    fontFamily: 'Pretendard',
    fontSize: 12,
    fontWeight: '400',
  },
});

const themeStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90,
    left: 0,
    right: 0,
    width: '100%',
    maxHeight: 267,
    padding: 10,
    paddingHorizontal: 20,
    paddingBottom: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 10,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: '#162028',
    zIndex: 100,
    elevation: 100,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  themeButton: {
    height: 40,
    paddingVertical: 7,
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 39,
    backgroundColor: '#34495E',
  },
  themeButtonSelected: {
    backgroundColor: '#FF7F50',
  },
  themeText: {
    color: '#FFF',
    textAlign: 'center',
    fontFamily: 'Pretendard',
    fontSize: 12,
    fontWeight: '400',
  },
  themeTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
});

const districtStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90,
    left: 0,
    right: 0,
    width: '100%',
    maxHeight: 267,
    padding: 10,
    paddingHorizontal: 20,
    paddingBottom: 10,
    gap: 12,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: '#162028',
    zIndex: 100,
    elevation: 100,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  districtButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  districtButtonSelected: {
    backgroundColor: '#FF7F50',
    borderColor: '#FF7F50',
  },
  districtText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '500',
  },
  districtTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#8FB6F1',
  },
  backgroundStars: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  bigStar: {
    position: 'absolute',
    top: 159,
    left: 136,
  },
  smallStar: {
    position: 'absolute',
    top: 288,
    right: -10,
  },
  header: {
    width: '100%',
    height: 112,
    backgroundColor: '#8FB6F1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  menuButton: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 16,
  },
  closeButton: {
    width: 15,
    height: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 장바구니 표시 창
  cartOuterContainer: {
    marginTop: -20,
    paddingVertical: 8,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  cartGradientContainer: {
    flexDirection: 'row',
    padding: 6,
    paddingLeft: 7.715,
    paddingRight: 7.409,
    paddingTop: 6,
    paddingBottom: 7,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4.82,
    borderRadius: 10,
  },
  cartSlot: {
    width: 58,
    height: 60,
    borderRadius: 10,
    overflow: 'hidden',
  },
  cartSlotImage: {
    width: 58,
    height: 60,
    borderRadius: 10,
  },
  messages: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    paddingBottom: 350,
    gap: 10,
  },
  messageContainer: {
    marginBottom: 10,
    width: '100%',
  },
  assistantMessageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF5E7',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileImage: {
    width: 32,
    height: 32,
  },
  assistantContentColumn: {
    flex: 1,
    gap: 4,
  },
  nickname: {
    color: '#FFF',
    fontFamily: 'Pretendard',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    letterSpacing: -0.12,
  },
  bubbleWithTime: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF',
    padding: 12,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    borderBottomLeftRadius: 10,
    maxWidth: '80%',
  },
  assistantBubbleText: {
    color: '#34495E',
    fontFamily: 'Pretendard',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    letterSpacing: -0.12,
  },
  userBubbleContainer: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#9DFFE0',
    padding: 12,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 10,
    borderBottomLeftRadius: 10,
    maxWidth: '80%',
  },
  userText: {
    color: '#34495E',
    fontFamily: 'Pretendard',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    letterSpacing: -0.12,
  },
  timestamp: {
    color: '#FFFFFF',
    fontFamily: 'Pretendard',
    fontSize: 10,
    fontWeight: '400',
    lineHeight: 12,
    marginBottom: 2,
  },
  loadingContainer: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    color: '#FFF',
  },
  // Continue 버튼 - 하단 고정
  fixedContinueContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    height: 90,
    paddingBottom: 20,
    backgroundColor: 'rgba(22,32,40,0.9)',
    zIndex: 1000,
    elevation: 1000,
  },
  fixedContinueButton: {
    width: '90%',
    height: 50,
    backgroundColor: '#FF7F50',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fixedContinueButtonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  fixedContinueText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

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

import { aiStationApi, mapApi } from '@shared/api';
import { useQuestStore } from '@entities/quest';
import { Images } from '@shared/config';
import { ThemedText, Spacing } from '@shared/ui';

import { RouteResultList } from '@widgets/route-result-list';

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
            pathname: '/(app)/(tabs)/map/quest-detail',
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
          router.push('/(app)/(tabs)/map');
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
        <Spacing size={12}></Spacing>
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

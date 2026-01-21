import QuestMiniModal from '@/components/quest-mini-modal';
import { Images } from '@/constants/images';
import { pointsApi, questApi, type Quest } from '@/services/api';
import { useQuestStore } from '@/store/useQuestStore';
import { ThemedText, ThemedView } from '@shared/ui';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';

import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, {
  Defs,
  G,
  Path,
  RadialGradient,
  Stop,
  LinearGradient as SvgLinearGradient,
} from 'react-native-svg';
import { WebView } from 'react-native-webview';

export default function MapScreen() {
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const { selectedQuests, removeQuest, startQuest, endQuest, reorderQuests } = useQuestStore();
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isQuestActive, setIsQuestActive] = useState(false);
  const [userMint, setUserMint] = useState<number>(0);
  const [showStartModal, setShowStartModal] = useState(false);
  const webViewRef = useRef<WebView>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const kakaoMapJsKey = Constants.expoConfig?.extra?.kakaoMapJsKey;
  const kakaoRestApiKey = Constants.expoConfig?.extra?.kakaoRestApiKey;

  // Handle filtered quests from filter screen
  useEffect(() => {
    if (params.filteredQuests) {
      try {
        const filtered = JSON.parse(params.filteredQuests as string) as Quest[];
        setQuests(filtered);

        // Update markers on map
        if (webViewRef.current && !loading) {
          webViewRef.current.injectJavaScript(`
            if (typeof updateMarkers === 'function') {
              updateMarkers(${JSON.stringify(filtered)});
            }
            true;
          `);
        }
      } catch (error) {
        // Ignore
      }
    }
  }, [params.filteredQuests, loading]);

  useEffect(() => {
    fetchQuests();
    startLocationTracking();
    fetchUserPoints();

    return () => {
      // Cleanup location tracking
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  // Refresh points when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchUserPoints();
    }, []),
  );

  const fetchUserPoints = async () => {
    try {
      const data = await pointsApi.getPoints();
      setUserMint(data.total_points);
    } catch (err) {
      // Ignore
    }
  };

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  };

  // Fetch walking route from Kakao Directions API
  const fetchWalkingRoute = async (
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number,
  ) => {
    try {
      const response = await fetch(
        `https://apis-navi.kakaomobility.com/v1/directions?origin=${startLng},${startLat}&destination=${endLng},${endLat}&priority=RECOMMEND&car_fuel=GASOLINE&car_hipass=false&alternatives=false&road_details=false`,
        {
          method: 'GET',
          headers: {
            Authorization: `KakaoAK ${kakaoRestApiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const sections = route.sections;

        // Extract all coordinates from the route
        const coordinates: { lat: number; lng: number }[] = [];

        sections.forEach((section: any) => {
          section.roads.forEach((road: any) => {
            road.vertexes.forEach((vertex: number, index: number) => {
              if (index % 2 === 0) {
                // vertexes는 [lng, lat, lng, lat, ...] 형태
                coordinates.push({
                  lng: vertex,
                  lat: road.vertexes[index + 1],
                });
              }
            });
          });
        });

        return coordinates;
      }

      return null;
    } catch (error) {
      return null;
    }
  };

  const openQuestModal = (quest: Quest) => {
    setSelectedQuest(quest);

    // 클릭한 마커를 주황색으로 변경
    if (webViewRef.current && !loading) {
      webViewRef.current.injectJavaScript(`
        if (typeof highlightMarker === 'function') {
          highlightMarker(${quest.id});
        }
        true;
      `);
    }
  };

  // 선택된 퀘스트가 변경될 때마다 WebView에 업데이트
  useEffect(() => {
    if (webViewRef.current && !loading) {
      const selectedIds = selectedQuests.map((q) => q.id);

      // 슬롯 번호 매핑 생성 (questId -> slotNumber)
      const slotNumbers: { [key: number]: number } = {};
      selectedQuests.forEach((quest, index) => {
        slotNumbers[quest.id] = index + 1;
      });

      // 퀘스트가 제거되어 장바구니가 비었고 네비게이션이 활성화되어 있으면 종료
      if (selectedQuests.length === 0 && isQuestActive) {
        setIsQuestActive(false);
        endQuest();

        // 모든 마커 다시 표시하고 경로 제거
        webViewRef.current.injectJavaScript(`
          if (typeof showAllMarkers === 'function') {
            showAllMarkers();
          }
          if (typeof clearRoute === 'function') {
            clearRoute();
          }
          true;
        `);
        return;
      }

      // 항상 선택된 퀘스트를 주황색 마커로 표시하고 숫자 추가
      webViewRef.current.injectJavaScript(`
        if (typeof updateSelectedQuests === 'function') {
          updateSelectedQuests(${JSON.stringify(selectedIds)});
        }
        if (typeof updateMarkerSlotNumbers === 'function') {
          updateMarkerSlotNumbers(${JSON.stringify(slotNumbers)});
        }
        true;
      `);

      // 네비게이션이 활성화되어 있고 퀘스트가 남아있으면 선택된 퀘스트만 표시
      if (isQuestActive && selectedQuests.length > 0) {
        const firstQuest = selectedQuests[0];

        // 선택된 퀘스트만 표시
        webViewRef.current.injectJavaScript(`
          if (typeof showSelectedQuestsOnly === 'function') {
            showSelectedQuestsOnly(${JSON.stringify(selectedIds)}, ${JSON.stringify(slotNumbers)});
          }
          true;
        `);

        // 첫 번째 퀘스트가 변경되었거나 제거되었으면 경로 다시 그리기
        if (userLocation && firstQuest) {
          const distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            firstQuest.latitude,
            firstQuest.longitude,
          );

          // 기존 경로 제거
          webViewRef.current.injectJavaScript(`
            if (typeof clearRoute === 'function') {
              clearRoute();
            }
            true;
          `);

          // 10km 이내이면 새로운 경로 그리기
          if (distance <= 10) {
            (async () => {
              const routeCoordinates = await fetchWalkingRoute(
                userLocation.latitude,
                userLocation.longitude,
                firstQuest.latitude,
                firstQuest.longitude,
              );

              if (routeCoordinates && routeCoordinates.length > 0) {
                const coordsJson = JSON.stringify(routeCoordinates);
                webViewRef.current?.injectJavaScript(`
                  if (typeof drawWalkingRouteWithPath === 'function') {
                    drawWalkingRouteWithPath(${coordsJson});
                  }
                  true;
                `);
              } else if (webViewRef.current) {
                webViewRef.current.injectJavaScript(`
                  if (typeof drawWalkingRoute === 'function') {
                    drawWalkingRoute(
                      ${userLocation.latitude},
                      ${userLocation.longitude},
                      ${firstQuest.latitude},
                      ${firstQuest.longitude}
                    );
                  }
                  true;
                `);
              }
            })();
          }
        }
      }
    }
  }, [selectedQuests, loading, isQuestActive, userLocation]);

  // 사용자 위치 마커 생성 - WebView 로드 완료 & userLocation 설정 완료 후
  useEffect(() => {
    if (webViewRef.current && !loading && userLocation) {
      webViewRef.current.injectJavaScript(`
        if (typeof map !== 'undefined') {
          var moveLatLon = new kakao.maps.LatLng(${userLocation.latitude}, ${userLocation.longitude});
          map.setCenter(moveLatLon);

          // 기존 마커가 있으면 제거
          if (typeof userMarker !== 'undefined' && userMarker !== null) {
            userMarker.setMap(null);
          }

          // 초기 내 위치 마커 생성 (SVG 아이콘 사용)
          var markerContent = document.createElement('div');
          markerContent.innerHTML = \`
            <svg width="40" height="40" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g filter="url(#filter0_d)">
                <path d="M24 40C35.0457 40 44 31.0457 44 20C44 8.95431 35.0457 0 24 0C12.9543 0 4 8.95431 4 20C4 31.0457 12.9543 40 24 40Z" fill="url(#paint0_radial)" shape-rendering="crispEdges"/>
                <path d="M24 0.5C34.7696 0.5 43.5 9.23045 43.5 20C43.5 30.7696 34.7696 39.5 24 39.5C13.2304 39.5 4.5 30.7696 4.5 20C4.5 9.23045 13.2304 0.5 24 0.5Z" stroke="white" shape-rendering="crispEdges"/>
              </g>
              <g filter="url(#filter1_i)">
                <path d="M23.998 5C24.5528 5.00015 25.0028 5.45084 25.0029 6.00684V9.42871C26.3034 9.54737 27.5803 9.89474 28.7715 10.4658C30.8319 11.4536 32.5349 13.0568 33.6455 15.0537C34.3273 16.2798 34.7642 17.6176 34.9434 18.9932H37.9932C38.5493 18.9932 39 19.4432 39 19.998C38.9998 20.5528 38.5492 21.0029 37.9932 21.0029H35.0195C35.0087 21.207 34.9939 21.4113 34.9717 21.6152C34.6966 24.1128 33.5784 26.4419 31.8018 28.2188C30.0249 29.9956 27.695 31.1145 25.1973 31.3896C25.1326 31.3967 25.0676 31.4003 25.0029 31.4062V33.9932C25.0029 34.5492 24.5528 34.9999 23.998 35C23.4432 35 22.9932 34.5493 22.9932 33.9932V31.4062C21.4712 31.2668 19.9864 30.814 18.6367 30.0635C16.6397 28.9529 15.0357 27.2499 14.0479 25.1895C13.4157 23.8709 13.0572 22.4472 12.9805 21.0029H10.0068C9.45085 21.0028 9.00016 20.5528 9 19.998C9 19.4432 9.45075 18.9933 10.0068 18.9932H13.0566C13.0755 18.8485 13.0965 18.7038 13.1211 18.5596C13.5058 16.3072 14.5806 14.23 16.1963 12.6143C17.812 10.9985 19.8893 9.92387 22.1416 9.53906C22.4245 9.49073 22.7088 9.45281 22.9932 9.42676V6.00684C22.9933 5.45075 23.4432 5 23.998 5ZM13.377 21.0029C13.3991 21.406 13.4443 21.8091 13.5127 22.21C13.8834 24.3812 14.919 26.3839 16.4766 27.9414C18.0341 29.4989 20.0367 30.5346 22.208 30.9053C22.469 30.9498 22.731 30.9839 22.9932 31.0088V27.4277C19.7483 26.9658 17.2135 24.3057 16.9434 21.0029H13.377ZM31.0566 21.0029C30.7863 24.3071 28.2497 26.9674 25.0029 27.4277V31.0078C26.2437 30.8901 27.4618 30.556 28.5986 30.0107C30.5847 29.0581 32.2258 27.5122 33.2959 25.5869C34.0821 24.1722 34.5302 22.604 34.6182 21.0029H31.0566ZM25.0029 13.4072C27.9698 13.8278 30.3457 16.0856 30.9395 18.9932H34.5371C34.2237 16.689 33.1664 14.5473 31.5186 12.8994C29.8067 11.1875 27.5617 10.1108 25.1553 9.8457C25.1045 9.84015 25.0537 9.83587 25.0029 9.83105V13.4072ZM22.9932 9.83008C21.5391 9.9681 20.1213 10.405 18.8311 11.1221C16.9057 12.1921 15.3598 13.8333 14.4072 15.8193C13.9239 16.8271 13.6061 17.8986 13.458 18.9932H17.0605C17.654 16.0869 20.0281 13.8293 22.9932 13.4072V9.83008Z" fill="#FF7F50"/>
              </g>
              <defs>
                <filter id="filter0_d" x="0" y="0" width="48" height="48" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                  <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                  <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                  <feOffset dy="4"/>
                  <feGaussianBlur stdDeviation="2"/>
                  <feComposite in2="hardAlpha" operator="out"/>
                  <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
                  <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/>
                  <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"/>
                </filter>
                <filter id="filter1_i" x="9" y="5" width="30" height="34" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                  <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                  <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
                  <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                  <feOffset dy="4"/>
                  <feGaussianBlur stdDeviation="2"/>
                  <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
                  <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
                  <feBlend mode="normal" in2="shape" result="effect1_innerShadow"/>
                </filter>
                <radialGradient id="paint0_radial" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(24 20) rotate(90) scale(20)">
                  <stop stop-color="white"/>
                  <stop offset="1" stop-color="white" stop-opacity="0.85"/>
                </radialGradient>
              </defs>
            </svg>
          \`;
          markerContent.style.cssText = 'width: 40px; height: 40px;';

          userMarker = new kakao.maps.CustomOverlay({
            position: moveLatLon,
            content: markerContent,
            zIndex: 999
          });
          userMarker.setMap(map);
        }
        true;
      `);
    }
  }, [loading, userLocation]);

  const startLocationTracking = async () => {
    try {
      // 위치 권한 요청
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied.');
        return;
      }

      // 현재 위치 가져오기
      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      // 실시간 위치 추적 시작
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000, // 1초마다 업데이트
          distanceInterval: 1, // 1m 이동시 업데이트
        },
        (newLocation) => {
          const newCoords = {
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
          };
          setUserLocation(newCoords);
          // WebView에 위치 업데이트
          if (webViewRef.current) {
            webViewRef.current.injectJavaScript(`
              if (typeof map !== 'undefined' && typeof userMarker !== 'undefined') {
                var newLatLon = new kakao.maps.LatLng(${newCoords.latitude}, ${newCoords.longitude});
                map.panTo(newLatLon);
                userMarker.setPosition(newLatLon);
              }
              true;
            `);
          }
        },
      );
    } catch (err) {
      setError('Failed to get location.');
    }
  };

  const fetchQuests = async () => {
    try {
      const questList = await questApi.getQuestList();
      setQuests(questList);
    } catch (err) {
      setError('Failed to load quest data.');
    }
  };

  useEffect(() => {
    if (quests.length > 0 && webViewRef.current && !loading) {
      // WebView가 로드된 후 마커 추가
      const questsJson = JSON.stringify(quests);
      // 약간의 지연을 두고 마커 추가 (지도 초기화 완료 후)
      setTimeout(() => {
        webViewRef.current?.injectJavaScript(`
          if (typeof addQuestMarkers === 'function') {
            addQuestMarkers(${questsJson});
          }
          true;
        `);
      }, 500);
    }
  }, [quests, loading]);

  const kakaoMapHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <title>Kakao Map</title>
      <script type="text/javascript" src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoMapJsKey}"></script>
      <style>
        * { margin: 0; padding: 0; }
        html, body { width: 100%; height: 100%; }
        #map { width: 100%; height: 100%; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map;
        var markers = [];
        var userMarker;
        var walkingPolyline = null;

        try {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'log', message: 'Starting map initialization' }));

          if (typeof kakao === 'undefined') {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: 'Kakao SDK not loaded' }));
          } else {
            var container = document.getElementById('map');
            var options = {
              center: new kakao.maps.LatLng(37.5665, 126.9780),
              level: 5
            };
            map = new kakao.maps.Map(container, options);
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'success', message: 'Map loaded successfully' }));
          }
        } catch (e) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: e.toString() }));
        }

        // 선택된 퀘스트 ID 목록 (전역)
        var selectedQuestIds = [];
        var highlightedQuestId = null; // 현재 하이라이트된 퀘스트
        var questDataMap = {}; // questId -> quest 데이터 매핑

        // 마커 SVG 생성 함수
        function createMarkerSVG(isSelected) {
          if (isSelected) {
            // 오렌지 버전
            return '<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">' +
              '<path d="M17.7979 2.04102C18.5471 -0.014178 21.4523 -0.0135671 22.2012 2.04199L26.3242 13.376L26.4043 13.5957L26.624 13.6758L37.958 17.7988V17.7979C40.0139 18.5467 40.0138 21.4522 37.958 22.2012L26.624 26.3242L26.4043 26.4043L26.3242 26.624L22.2012 37.958C21.4522 40.0138 18.5467 40.0139 17.7979 37.958H17.7988L13.6758 26.624L13.5957 26.4043L13.376 26.3242L2.04199 22.2012H2.04102C-0.0138994 21.4517 -0.0135677 18.5466 2.04199 17.7979V17.7988L13.376 13.6758L13.5957 13.5957L13.6758 13.376L17.7988 2.04199L17.7979 2.04102Z" fill="url(#paint0_linear_orange)" stroke="#FF7F50"/>' +
              '<defs>' +
              '<linearGradient id="paint0_linear_orange" x1="20" y1="0" x2="20" y2="40" gradientUnits="userSpaceOnUse">' +
              '<stop stop-color="#FF7F50"/>' +
              '<stop offset="1" stop-color="#FF7F50" stop-opacity="0.8"/>' +
              '</linearGradient>' +
              '</defs>' +
              '</svg>';
          } else {
            // 블루 버전
            return '<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">' +
              '<path d="M17.7979 2.04102C18.5471 -0.014178 21.4523 -0.0135671 22.2012 2.04199L26.3242 13.376L26.4043 13.5957L26.624 13.6758L37.958 17.7988V17.7979C40.0139 18.5467 40.0138 21.4522 37.958 22.2012L26.624 26.3242L26.4043 26.4043L26.3242 26.624L22.2012 37.958C21.4522 40.0138 18.5467 40.0139 17.7979 37.958H17.7988L13.6758 26.624L13.5957 26.4043L13.376 26.3242L2.04199 22.2012H2.04102C-0.0138994 21.4517 -0.0135677 18.5466 2.04199 17.7979V17.7988L13.376 13.6758L13.5957 13.5957L13.6758 13.376L17.7988 2.04199L17.7979 2.04102Z" fill="url(#paint0_linear_blue)" stroke="#659DF2"/>' +
              '<defs>' +
              '<linearGradient id="paint0_linear_blue" x1="20" y1="0" x2="20" y2="40" gradientUnits="userSpaceOnUse">' +
              '<stop stop-color="#659DF2"/>' +
              '<stop offset="1" stop-color="#659DF2" stop-opacity="0.8"/>' +
              '</linearGradient>' +
              '</defs>' +
              '</svg>';
          }
        }
        
        // 마커 컨테이너 생성 함수 (SVG + 숫자 배지)
        function createMarkerContent(isSelected, slotNumber) {
          var container = document.createElement('div');
          container.style.cssText = 'position: relative; display: flex; flex-direction: column; align-items: center;';
          
          var svgWrapper = document.createElement('div');
          svgWrapper.innerHTML = createMarkerSVG(isSelected);
          container.appendChild(svgWrapper);
          
          // 슬롯 번호가 있으면 숫자 배지 추가
          if (slotNumber !== null && slotNumber !== undefined) {
            var numberBadge = document.createElement('div');
            numberBadge.textContent = slotNumber;
            numberBadge.style.cssText = 'position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%); background-color: rgba(239, 106, 57, 0.9); border-radius: 8px; width: 16px; height: 16px; display: flex; justify-content: center; align-items: center; border: 1px solid #fff; font-size: 10px; font-weight: 700; color: #fff; line-height: 10px; z-index: 10;';
            container.appendChild(numberBadge);
          }
          
          return container;
        }

        // 특정 마커 하이라이트 함수 (모달 열 때)
        function highlightMarker(questId) {
          highlightedQuestId = questId;
          // 모든 마커 업데이트
          markers.forEach(function(marker) {
            var markerQuestId = parseInt(marker.getContent().getAttribute('data-quest-id'));
            var isSelected = selectedQuestIds.indexOf(markerQuestId) !== -1;
            var isHighlighted = markerQuestId === questId;
            // 하이라이트되었거나 이미 선택된 마커는 주황색
            marker.getContent().innerHTML = createMarkerSVG(isSelected || isHighlighted);
          });
        }

        // 선택된 퀘스트 업데이트 함수
        function updateSelectedQuests(selectedIds) {
          selectedQuestIds = selectedIds || [];
          // 모든 마커 업데이트 (선택된 퀘스트만 주황색)
          markers.forEach(function(marker) {
            var questId = parseInt(marker.getContent().getAttribute('data-quest-id'));
            var isSelected = selectedQuestIds.indexOf(questId) !== -1;
            var slotNumber = null;
            if (isSelected) {
              var slotIndex = selectedQuestIds.indexOf(questId);
              if (slotIndex !== -1) {
                slotNumber = slotIndex + 1;
              }
            }
            var newContent = createMarkerContent(isSelected, slotNumber);
            newContent.setAttribute('data-quest-id', questId);
            newContent.style.cssText = 'width: 40px; height: 40px; cursor: pointer; user-select: none; -webkit-user-select: none; position: relative; display: flex; flex-direction: column; align-items: center;';
            
            // 클릭 이벤트 추가 (questDataMap에서 quest 데이터 가져오기)
            var quest = questDataMap[questId];
            if (quest) {
              newContent.setAttribute('data-quest-data', JSON.stringify(quest));
              newContent.addEventListener('click', (function(questData) {
                return function(e) {
                  e.preventDefault();
                  e.stopPropagation();
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'questClick',
                    quest: questData
                  }));
                };
              })(quest));
            } else {
              // questDataMap에 없으면 기존 컨텐츠에서 가져오기
              var oldContent = marker.getContent();
              if (oldContent) {
                var questData = oldContent.getAttribute('data-quest-data');
                if (questData) {
                  try {
                    var quest = JSON.parse(questData);
                    questDataMap[questId] = quest;
                    newContent.setAttribute('data-quest-data', questData);
                    newContent.addEventListener('click', (function(questData) {
                      return function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                          type: 'questClick',
                          quest: questData
                        }));
                      };
                    })(quest));
                  } catch (e) {
                  }
                }
              }
            }
            
            marker.setContent(newContent);
          });
        }
        
        // 마커 슬롯 번호 업데이트 함수
        function updateMarkerSlotNumbers(slotNumbers) {
          slotNumbers = slotNumbers || {};
          markers.forEach(function(marker) {
            var questId = parseInt(marker.getContent().getAttribute('data-quest-id'));
            var slotNumber = slotNumbers[questId] || null;
            var isSelected = selectedQuestIds.indexOf(questId) !== -1;
            
            if (isSelected) {
              var newContent = createMarkerContent(true, slotNumber);
              newContent.setAttribute('data-quest-id', questId);
              newContent.style.cssText = 'width: 40px; height: 40px; cursor: pointer; user-select: none; -webkit-user-select: none; position: relative; display: flex; flex-direction: column; align-items: center;';
              
              // 클릭 이벤트 추가 (questDataMap에서 quest 데이터 가져오기)
              var quest = questDataMap[questId];
              if (quest) {
                newContent.setAttribute('data-quest-data', JSON.stringify(quest));
                newContent.addEventListener('click', (function(questData) {
                  return function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'questClick',
                      quest: questData
                    }));
                  };
                })(quest));
              } else {
                // questDataMap에 없으면 기존 컨텐츠에서 가져오기
                var oldContent = marker.getContent();
                if (oldContent) {
                  var questData = oldContent.getAttribute('data-quest-data');
                  if (questData) {
                    try {
                      var quest = JSON.parse(questData);
                      questDataMap[questId] = quest;
                      newContent.setAttribute('data-quest-data', questData);
                      newContent.addEventListener('click', (function(questData) {
                        return function(e) {
                          e.preventDefault();
                          e.stopPropagation();
                          window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'questClick',
                            quest: questData
                          }));
                        };
                      })(quest));
                    } catch (e) {
                    }
                  }
                }
              }
              
              marker.setContent(newContent);
            }
          });
        }

        // Show only selected quest markers and hide others
        function showSelectedQuestsOnly(selectedQuestIds, slotNumbers) {
          slotNumbers = slotNumbers || {};
          markers.forEach(function(marker) {
            var questId = parseInt(marker.getContent().getAttribute('data-quest-id'));
            var isSelected = selectedQuestIds.indexOf(questId) !== -1;
            var slotNumber = slotNumbers[questId] || null;
            
            if (isSelected) {
              // 선택된 퀘스트는 표시
              marker.setMap(map);
              // 첫 번째 퀘스트는 end icon으로, 나머지는 선택된 마커 스타일로
              if (questId === selectedQuestIds[0]) {
                var endIconContent = document.createElement('div');
                endIconContent.setAttribute('data-quest-id', questId);
                endIconContent.style.cssText = 'position: relative; display: flex; flex-direction: column; align-items: center;';
                endIconContent.innerHTML = '<svg width="48" height="58" viewBox="0 0 48 58" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                  '<g filter="url(#filter0_d_end)">' +
                  '<path d="M43.9997 16.8306C44.0138 18.7443 43.4292 20.613 42.3305 22.1672C41.2318 23.7214 39.6756 24.8806 37.8867 25.4775L15.9103 33.1616C15.3515 33.356 14.7745 33.4912 14.1884 33.5653V44.8221C14.1884 46.1954 13.6517 47.5123 12.6964 48.4833C11.741 49.4543 10.4453 50 9.09421 50C7.74314 50 6.44742 49.4543 5.49207 48.4833C4.53672 47.5123 4 46.1954 4 44.8221V24.9286C4 24.7836 4 24.6491 4 24.5145V9.14647C4 9.01185 4 8.87732 4 8.73234C4.0191 8.27306 4.07361 7.81594 4.16302 7.36532C4.41291 6.08447 4.92983 4.87293 5.67894 3.81211C6.42805 2.75129 7.392 1.86584 8.50594 1.21534C9.61988 0.564848 10.858 0.164441 12.1369 0.0409688C13.4158 -0.0825029 14.706 0.073894 15.9205 0.499594L37.8969 8.18346C39.6839 8.78216 41.2378 9.9422 42.3346 11.4962C43.4314 13.0503 44.0145 14.9181 43.9997 16.8306Z" fill="url(#paint0_radial_end)" shape-rendering="crispEdges"/>' +
                  '<path d="M12.1846 0.539062C13.3912 0.422574 14.6087 0.569948 15.7549 0.97168H15.7559L37.7314 8.65527L37.7383 8.65723C39.4233 9.22176 40.8898 10.3164 41.9258 11.7842C42.9619 13.2523 43.5139 15.0186 43.5 16.8271V16.834C43.5133 18.6437 42.9599 20.4107 41.9219 21.8789C40.884 23.3468 39.4153 24.4401 37.7285 25.0029L37.7217 25.0059L15.7451 32.6895C15.2196 32.8722 14.6771 32.9996 14.126 33.0693L13.6885 33.125V44.8223C13.6884 46.0655 13.2023 47.2562 12.3398 48.1328C11.4776 49.0091 10.3095 49.5 9.09375 49.5C7.87822 49.4999 6.71077 49.009 5.84863 48.1328C4.98615 47.2562 4.50003 46.0655 4.5 44.8223V8.75293C4.51803 8.3195 4.56896 7.8881 4.65332 7.46289V7.46094C4.88974 6.24918 5.37884 5.10337 6.08691 4.10059C6.79499 3.09788 7.7062 2.26163 8.75781 1.64746C9.80942 1.03337 10.9781 0.655602 12.1846 0.539062Z" stroke="#FF7F50" shape-rendering="crispEdges"/>' +
                  '</g>' +
                  '<defs>' +
                  '<filter id="filter0_d_end" x="0" y="0" width="48" height="58" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">' +
                  '<feFlood flood-opacity="0" result="BackgroundImageFix"/>' +
                  '<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>' +
                  '<feOffset dy="4"/>' +
                  '<feGaussianBlur stdDeviation="2"/>' +
                  '<feComposite in2="hardAlpha" operator="out"/>' +
                  '<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.5 0"/>' +
                  '<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_end"/>' +
                  '<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_end" result="shape"/>' +
                  '</filter>' +
                  '<radialGradient id="paint0_radial_end" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(24 25) rotate(90) scale(25 20)">' +
                  '<stop stop-color="#FF7F50"/>' +
                  '<stop offset="1" stop-color="#FF7F50" stop-opacity="0.8"/>' +
                  '</radialGradient>' +
                  '</defs>' +
                  '</svg>';
                if (slotNumber !== null && slotNumber !== undefined) {
                  var numberBadge = document.createElement('div');
                  numberBadge.textContent = slotNumber;
                  numberBadge.style.cssText = 'position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%); background-color: rgba(239, 106, 57, 0.9); border-radius: 8px; width: 16px; height: 16px; display: flex; justify-content: center; align-items: center; border: 1px solid #fff; font-size: 10px; font-weight: 700; color: #fff; line-height: 10px; z-index: 10;';
                  endIconContent.appendChild(numberBadge);
                }
                
                // 클릭 이벤트 추가 (questDataMap에서 quest 데이터 가져오기)
                var quest = questDataMap[questId];
                if (quest) {
                  endIconContent.setAttribute('data-quest-data', JSON.stringify(quest));
                  endIconContent.addEventListener('click', (function(questData) {
                    return function(e) {
                      e.preventDefault();
                      e.stopPropagation();
                      window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'questClick',
                        quest: questData
                      }));
                    };
                  })(quest));
                } else {
                  // questDataMap에 없으면 기존 컨텐츠에서 가져오기
                  var oldContent = marker.getContent();
                  if (oldContent) {
                    var questData = oldContent.getAttribute('data-quest-data');
                    if (questData) {
                      try {
                        var quest = JSON.parse(questData);
                        questDataMap[questId] = quest;
                        endIconContent.setAttribute('data-quest-data', questData);
                        endIconContent.addEventListener('click', (function(questData) {
                          return function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                              type: 'questClick',
                              quest: questData
                            }));
                          };
                        })(quest));
                      } catch (e) {
                      }
                    }
                  }
                }
                
                marker.setContent(endIconContent);
              } else {
                // 나머지 선택된 퀘스트는 주황색 마커로 표시
                var newContent = createMarkerContent(true, slotNumber);
                newContent.setAttribute('data-quest-id', questId);
                newContent.style.cssText = 'width: 40px; height: 40px; cursor: pointer; user-select: none; -webkit-user-select: none; position: relative; display: flex; flex-direction: column; align-items: center;';
                
                // 클릭 이벤트 추가 (questDataMap에서 quest 데이터 가져오기)
                var quest = questDataMap[questId];
                if (quest) {
                  newContent.setAttribute('data-quest-data', JSON.stringify(quest));
                  newContent.addEventListener('click', (function(questData) {
                    return function(e) {
                      e.preventDefault();
                      e.stopPropagation();
                      window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'questClick',
                        quest: questData
                      }));
                    };
                  })(quest));
                } else {
                  // questDataMap에 없으면 기존 컨텐츠에서 가져오기
                  var oldContent = marker.getContent();
                  if (oldContent) {
                    var questData = oldContent.getAttribute('data-quest-data');
                    if (questData) {
                      try {
                        var quest = JSON.parse(questData);
                        questDataMap[questId] = quest;
                        newContent.setAttribute('data-quest-data', questData);
                        newContent.addEventListener('click', (function(questData) {
                          return function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                              type: 'questClick',
                              quest: questData
                            }));
                          };
                        })(quest));
                      } catch (e) {
                      }
                    }
                  }
                }
                
                marker.setContent(newContent);
              }
            } else {
              // 선택되지 않은 퀘스트는 숨김
              marker.setMap(null);
            }
          });
        }

        // Hide all markers except the target quest and change target to end icon (기존 함수 유지 - 하위 호환성)
        function hideOtherMarkers(targetQuestId) {
          markers.forEach(function(marker) {
            var questId = parseInt(marker.getContent().getAttribute('data-quest-id'));
            if (questId !== targetQuestId) {
              marker.setMap(null);
            } else {
              // Change target marker to end icon
              marker.getContent().innerHTML = '<svg width="48" height="58" viewBox="0 0 48 58" fill="none" xmlns="http://www.w3.org/2000/svg">' +
                '<g filter="url(#filter0_d_end)">' +
                '<path d="M43.9997 16.8306C44.0138 18.7443 43.4292 20.613 42.3305 22.1672C41.2318 23.7214 39.6756 24.8806 37.8867 25.4775L15.9103 33.1616C15.3515 33.356 14.7745 33.4912 14.1884 33.5653V44.8221C14.1884 46.1954 13.6517 47.5123 12.6964 48.4833C11.741 49.4543 10.4453 50 9.09421 50C7.74314 50 6.44742 49.4543 5.49207 48.4833C4.53672 47.5123 4 46.1954 4 44.8221V24.9286C4 24.7836 4 24.6491 4 24.5145V9.14647C4 9.01185 4 8.87732 4 8.73234C4.0191 8.27306 4.07361 7.81594 4.16302 7.36532C4.41291 6.08447 4.92983 4.87293 5.67894 3.81211C6.42805 2.75129 7.392 1.86584 8.50594 1.21534C9.61988 0.564848 10.858 0.164441 12.1369 0.0409688C13.4158 -0.0825029 14.706 0.073894 15.9205 0.499594L37.8969 8.18346C39.6839 8.78216 41.2378 9.9422 42.3346 11.4962C43.4314 13.0503 44.0145 14.9181 43.9997 16.8306Z" fill="url(#paint0_radial_end)" shape-rendering="crispEdges"/>' +
                '<path d="M12.1846 0.539062C13.3912 0.422574 14.6087 0.569948 15.7549 0.97168H15.7559L37.7314 8.65527L37.7383 8.65723C39.4233 9.22176 40.8898 10.3164 41.9258 11.7842C42.9619 13.2523 43.5139 15.0186 43.5 16.8271V16.834C43.5133 18.6437 42.9599 20.4107 41.9219 21.8789C40.884 23.3468 39.4153 24.4401 37.7285 25.0029L37.7217 25.0059L15.7451 32.6895C15.2196 32.8722 14.6771 32.9996 14.126 33.0693L13.6885 33.125V44.8223C13.6884 46.0655 13.2023 47.2562 12.3398 48.1328C11.4776 49.0091 10.3095 49.5 9.09375 49.5C7.87822 49.4999 6.71077 49.009 5.84863 48.1328C4.98615 47.2562 4.50003 46.0655 4.5 44.8223V8.75293C4.51803 8.3195 4.56896 7.8881 4.65332 7.46289V7.46094C4.88974 6.24918 5.37884 5.10337 6.08691 4.10059C6.79499 3.09788 7.7062 2.26163 8.75781 1.64746C9.80942 1.03337 10.9781 0.655602 12.1846 0.539062Z" stroke="#FF7F50" shape-rendering="crispEdges"/>' +
                '</g>' +
                '<defs>' +
                '<filter id="filter0_d_end" x="0" y="0" width="48" height="58" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">' +
                '<feFlood flood-opacity="0" result="BackgroundImageFix"/>' +
                '<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>' +
                '<feOffset dy="4"/>' +
                '<feGaussianBlur stdDeviation="2"/>' +
                '<feComposite in2="hardAlpha" operator="out"/>' +
                '<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.5 0"/>' +
                '<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_end"/>' +
                '<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_end" result="shape"/>' +
                '</filter>' +
                '<radialGradient id="paint0_radial_end" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(24 25) rotate(90) scale(25 20)">' +
                '<stop stop-color="#FF7F50"/>' +
                '<stop offset="1" stop-color="#FF7F50" stop-opacity="0.8"/>' +
                '</radialGradient>' +
                '</defs>' +
                '</svg>';
            }
          });
        }

        // Show all markers again and restore original marker styles
        function showAllMarkers() {
          markers.forEach(function(marker) {
            marker.setMap(map);
            // Restore original marker style based on selection state
            var questId = parseInt(marker.getContent().getAttribute('data-quest-id'));
            var isSelected = selectedQuestIds.indexOf(questId) !== -1;
            marker.getContent().innerHTML = createMarkerSVG(isSelected);
          });
        }

        // Clear walking route
        function clearRoute() {
          if (walkingPolyline) {
            walkingPolyline.setMap(null);
            walkingPolyline = null;
          }
        }

        // Draw walking route using actual path from API
        function drawWalkingRouteWithPath(coordinates) {
          // Clear existing route
          clearRoute();

          // Convert coordinates to Kakao LatLng objects
          var linePath = coordinates.map(function(coord) {
            return new kakao.maps.LatLng(coord.lat, coord.lng);
          });

          walkingPolyline = new kakao.maps.Polyline({
            path: linePath,
            strokeWeight: 5,
            strokeColor: '#659DF2',
            strokeOpacity: 0.8,
            strokeStyle: 'solid'
          });

          walkingPolyline.setMap(map);

          // Adjust map bounds to show the entire route
          var bounds = new kakao.maps.LatLngBounds();
          coordinates.forEach(function(coord) {
            bounds.extend(new kakao.maps.LatLng(coord.lat, coord.lng));
          });
          map.setBounds(bounds);

          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'success',
            message: 'Walking route drawn with ' + coordinates.length + ' points'
          }));
        }

        // Draw walking route using simple straight line (fallback)
        function drawWalkingRoute(startLat, startLng, endLat, endLng) {
          // Clear existing route
          clearRoute();

          // Create a simple straight line
          var linePath = [
            new kakao.maps.LatLng(startLat, startLng),
            new kakao.maps.LatLng(endLat, endLng)
          ];

          walkingPolyline = new kakao.maps.Polyline({
            path: linePath,
            strokeWeight: 5,
            strokeColor: '#659DF2',
            strokeOpacity: 0.8,
            strokeStyle: 'solid'
          });

          walkingPolyline.setMap(map);

          // Adjust map bounds to show the entire route
          var bounds = new kakao.maps.LatLngBounds();
          bounds.extend(new kakao.maps.LatLng(startLat, startLng));
          bounds.extend(new kakao.maps.LatLng(endLat, endLng));
          map.setBounds(bounds);

          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'success',
            message: 'Walking route drawn (straight line fallback)'
          }));
        }

        // 퀘스트 마커 추가 함수
        function addQuestMarkers(quests) {
          try {
            // 기존 마커 제거
            markers.forEach(marker => marker.setMap(null));
            markers = [];

            quests.forEach((quest, index) => {
              var markerPosition = new kakao.maps.LatLng(quest.latitude, quest.longitude);

              // SVG 아이콘 마커 생성
              var isSelected = selectedQuestIds.indexOf(quest.id) !== -1;
              var slotNumber = null;
              if (isSelected) {
                var slotIndex = selectedQuestIds.indexOf(quest.id);
                if (slotIndex !== -1) {
                  slotNumber = slotIndex + 1;
                }
              }
              var markerContent = createMarkerContent(isSelected, slotNumber);
              markerContent.style.cssText =
                'width: 40px;' +
                'height: 40px;' +
                'cursor: pointer;' +
                'user-select: none;' +
                '-webkit-user-select: none;' +
                'position: relative;' +
                'display: flex;' +
                'flex-direction: column;' +
                'align-items: center;';
              markerContent.setAttribute('data-quest-id', quest.id);

              // 퀘스트 데이터를 전역 맵에 저장
              questDataMap[quest.id] = quest;
              
              // 퀘스트 데이터를 저장하여 나중에 이벤트 복사 시 사용
              markerContent.setAttribute('data-quest-data', JSON.stringify(quest));
              
              // 클릭 이벤트 추가 (클로저 문제 해결)
              markerContent.addEventListener('click', (function(questData) {
                return function(e) {
                  e.preventDefault();
                  e.stopPropagation();
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'questClick',
                    quest: questData
                  }));
                };
              })(quest));

              var customOverlay = new kakao.maps.CustomOverlay({
                position: markerPosition,
                content: markerContent,
                yAnchor: 1,
                clickable: true
              });

              customOverlay.setMap(map);
              markers.push(customOverlay);
            });

            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'success',
              message: 'Added ' + quests.length + ' markers'
            }));
          } catch (e) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'error',
              message: 'Failed to add markers: ' + e.toString()
            }));
          }
        }
      </script>
    </body>
    </html>
  `;

  if (!kakaoMapJsKey) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.errorContainer}>
          <ThemedText type="title">Error</ThemedText>
          <ThemedText style={styles.errorText}>Kakao Map API Key is not configured.</ThemedText>
          <ThemedText style={styles.errorText}>Please check your .env file.</ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* 🔵 헤더 전체 */}
      <View style={styles.fullHeader}>
        {/* 검색 + walk + mint */}
        <View style={styles.topRow}>
          <Pressable style={{ flex: 1 }} onPress={() => router.push('/(tabs)/map/search')}>
            <View style={styles.searchBox}>
              <Svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={styles.searchIcon}>
                <Path
                  d="M15.1753 4.32863C14.0003 3.15758 12.4092 2.5 10.7504 2.5C9.0916 2.5 7.50043 3.15758 6.32546 4.32863C5.41627 5.23994 4.80963 6.40903 4.58797 7.67716C4.3663 8.94528 4.54037 10.251 5.08648 11.4167L2.68227 13.8212C2.47232 14.015 2.30371 14.2492 2.18654 14.5098C2.06937 14.7704 2.00605 15.052 2.00041 15.3377C1.99478 15.6234 2.04692 15.9072 2.15373 16.1722C2.26053 16.4372 2.4198 16.6779 2.62195 16.8798C2.82409 17.0817 3.06493 17.2407 3.33004 17.3472C3.59516 17.4537 3.87908 17.5055 4.16471 17.4995C4.45035 17.4935 4.73181 17.4299 4.99223 17.3124C5.25265 17.1948 5.48665 17.0259 5.68016 16.8157L8.08438 14.4112C8.91749 14.8022 9.82643 15.0049 10.7467 15.005C11.5694 15.0046 12.3839 14.8415 13.1433 14.525C13.9027 14.2086 14.592 13.745 15.1716 13.1611C16.3425 11.986 17 10.3946 17 8.73562C17 7.07663 16.3425 5.48528 15.1716 4.31017L15.1753 4.32863ZM14.4157 10.2697C14.0402 11.1836 13.3381 11.9251 12.4462 12.3498C11.5543 12.7746 10.5362 12.8523 9.59014 12.5678C8.64407 12.2834 7.83768 11.6571 7.3278 10.8109C6.81793 9.96461 6.64105 8.95894 6.83163 7.98949C7.0222 7.02004 7.56657 6.15612 8.35882 5.5659C9.15107 4.97569 10.1345 4.70136 11.1179 4.79628C12.1012 4.89119 13.0141 5.34861 13.6788 6.07947C14.3436 6.81032 14.7127 7.76238 14.7144 8.75038C14.7151 9.27151 14.6136 9.78766 14.4157 10.2697Z"
                  fill="#34495E"
                  fillOpacity="0.55"
                />
              </Svg>
              <Text style={styles.searchText}>Search place name</Text>
            </View>
          </Pressable>

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

        {/* ⚙️ 새로고침 + 필터 + 카테고리 (3개) */}
        <View style={styles.filterCategoryRow}>
          {/* Refresh Icon */}
          <Pressable style={styles.refreshIcon}>
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 20C9.76667 20 7.875 19.225 6.325 17.675C4.775 16.125 4 14.2333 4 12C4 9.76667 4.775 7.875 6.325 6.325C7.875 4.775 9.76667 4 12 4C13.15 4 14.25 4.23734 15.3 4.712C16.35 5.18667 17.25 5.866 18 6.75V5C18 4.71667 18.096 4.47934 18.288 4.288C18.48 4.09667 18.7173 4.00067 19 4C19.2827 3.99934 19.5203 4.09534 19.713 4.288C19.9057 4.48067 20.0013 4.718 20 5V10C20 10.2833 19.904 10.521 19.712 10.713C19.52 10.905 19.2827 11.0007 19 11H14C13.7167 11 13.4793 10.904 13.288 10.712C13.0967 10.52 13.0007 10.2827 13 10C12.9993 9.71734 13.0953 9.48 13.288 9.288C13.4807 9.096 13.718 9 14 9H17.2C16.6667 8.06667 15.9377 7.33334 15.013 6.8C14.0883 6.26667 13.084 6 12 6C10.3333 6 8.91667 6.58334 7.75 7.75C6.58333 8.91667 6 10.3333 6 12C6 13.6667 6.58333 15.0833 7.75 16.25C8.91667 17.4167 10.3333 18 12 18C13.1333 18 14.171 17.7127 15.113 17.138C16.055 16.5633 16.784 15.7923 17.3 14.825C17.4333 14.5917 17.621 14.4293 17.863 14.338C18.105 14.2467 18.3507 14.2423 18.6 14.325C18.8667 14.4083 19.0583 14.5833 19.175 14.85C19.2917 15.1167 19.2833 15.3667 19.15 15.6C18.4667 16.9333 17.4917 18 16.225 18.8C14.9583 19.6 13.55 20 12 20Z"
                fill="white"
              />
            </Svg>
          </Pressable>

          {/* Filter Icon */}
          <Svg width="30" height="30" viewBox="0 0 30 30" fill="none" style={styles.filterIcon}>
            <Path
              d="M26.5625 15H11.1188M5.6675 15H3.4375M5.6675 15C5.6675 14.2773 5.9546 13.5842 6.46563 13.0731C6.97667 12.5621 7.66979 12.275 8.3925 12.275C9.11522 12.275 9.80833 12.5621 10.3194 13.0731C10.8304 13.5842 11.1175 14.2773 11.1175 15C11.1175 15.7227 10.8304 16.4158 10.3194 16.9269C9.80833 17.4379 9.11522 17.725 8.3925 17.725C7.66979 17.725 6.97667 17.4379 6.46563 16.9269C5.9546 16.4158 5.6675 15.7227 5.6675 15ZM26.5625 23.2587H19.3775M19.3775 23.2587C19.3775 23.9816 19.0897 24.6755 18.5786 25.1867C18.0674 25.6978 17.3741 25.985 16.6513 25.985C15.9285 25.985 15.2354 25.6966 14.7244 25.1856C14.2133 24.6746 13.9262 23.9815 13.9262 23.2587M19.3775 23.2587C19.3775 22.5359 19.0897 21.8432 18.5786 21.3321C18.0674 20.8209 17.3741 20.5337 16.6513 20.5337C15.9285 20.5337 15.2354 20.8208 14.7244 21.3319C14.2133 21.8429 13.9262 22.536 13.9262 23.2587M13.9262 23.2587H3.4375M26.5625 6.74124H22.6813M17.23 6.74124H3.4375M17.23 6.74124C17.23 6.01852 17.5171 5.32541 18.0281 4.81437C18.5392 4.30333 19.2323 4.01624 19.955 4.01624C20.3129 4.01624 20.6672 4.08672 20.9978 4.22366C21.3284 4.36061 21.6288 4.56133 21.8819 4.81437C22.1349 5.06741 22.3356 5.36781 22.4726 5.69842C22.6095 6.02904 22.68 6.38338 22.68 6.74124C22.68 7.09909 22.6095 7.45344 22.4726 7.78405C22.3356 8.11466 22.1349 8.41506 21.8819 8.6681C21.6288 8.92114 21.3284 9.12186 20.9978 9.25881C20.6672 9.39575 20.3129 9.46623 19.955 9.46623C19.2323 9.46623 18.5392 9.17914 18.0281 8.6681C17.5171 8.15706 17.23 7.46395 17.23 6.74124Z"
              stroke="white"
              strokeWidth="1.875"
              strokeMiterlimit="10"
              strokeLinecap="round"
            />
          </Svg>

          {/* All Themes */}
          <View style={styles.categoryChipPrimary}>
            <Text style={styles.categoryTextPrimary}>All Themes</Text>
          </View>

          {/* Nearest Trip with icon */}
          <View style={styles.categoryChipSecondary}>
            <Svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <Path
                d="M0.702404 4.91659L10.515 0.198826C11.8218 -0.304898 12.2965 0.157875 11.8177 1.48066L7.27664 11.2848C7.19557 11.5085 7.0441 11.6992 6.84541 11.8277C6.64672 11.9563 6.41175 12.0156 6.1765 11.9965C5.94125 11.9775 5.7187 11.8811 5.54286 11.7223C5.36702 11.5634 5.24762 11.3508 5.20293 11.1169C4.88639 9.47878 2.79239 7.36153 1.14478 7.05438L0.876926 7.00114C0.645723 6.95733 0.435121 6.8382 0.277417 6.66205C0.119713 6.4859 0.0236217 6.26241 0.00381896 6.02586C-0.0159837 5.7893 0.041604 5.55272 0.16779 5.35237C0.293975 5.15201 0.481761 4.99892 0.702404 4.91659Z"
                fill="#659DF2"
              />
            </Svg>
            <Text style={styles.categoryTextSecondary}>Nearest Trip</Text>
          </View>

          {/* All Districts */}
          <View style={styles.categoryChipTertiary}>
            <Text style={styles.categoryTextTertiary}>All Districts</Text>
          </View>
        </View>
      </View>

      <View style={[styles.questTooltip, isQuestActive && { borderBottomColor: '#FF7F50' }]}>
        {/* Explore Mode / Quest Mode 라벨 */}
        <View style={styles.exploreModeLabel}>
          <Text style={[styles.exploreModeLabelText, isQuestActive && { color: '#FF7F50' }]}>
            {isQuestActive ? 'Quest Mode' : 'Explore Mode'}
          </Text>
        </View>

        {/* 콘텐츠 영역: 호랑이(왼쪽) + 텍스트(오른쪽) */}
        <View style={styles.questContentRow}>
          {/* 호랑이 이미지 */}
          <Image source={Images.horangFace} style={styles.horangFaceImage} resizeMode="contain" />

          {/* 텍스트 컨텐츠 */}
          <View style={styles.questTextContent}>
            {isQuestActive && userLocation && selectedQuests.length > 0 ? (
              (() => {
                const firstQuest = selectedQuests[0];
                const distance = calculateDistance(
                  userLocation.latitude,
                  userLocation.longitude,
                  firstQuest.latitude,
                  firstQuest.longitude,
                );

                if (distance > 10) {
                  return (
                    <>
                      <Text style={styles.questTitle}>Oh No! I can&apos;t find you</Text>
                      <Text style={styles.questDesc}>Please move near to the marker</Text>
                    </>
                  );
                }

                if (distance <= 1) {
                  return (
                    <>
                      <Text style={styles.questTitle}>You&apos;re Almost There!</Text>
                      <Text style={styles.questDesc}>
                        You can now chat with Quest Mode AI Docent
                      </Text>
                    </>
                  );
                }

                return (
                  <>
                    <Text style={styles.questTitle}>You&apos;re now at my sight!</Text>
                    <Text style={styles.questDesc}>
                      Follow the route I show you. You&apos;re headed to your 1st Quest.
                    </Text>
                  </>
                );
              })()
            ) : (
              <>
                <Text style={styles.questTitle}>Add to your Quest List!</Text>
                <Text style={styles.questDesc}>
                  Touch the marker in the map{'\n'}I&apos;ll show you the detail
                </Text>
              </>
            )}
          </View>
        </View>
      </View>

      {/* AI Docent 버튼 - 1km 이내일 때만 표시 */}
      {isQuestActive &&
        userLocation &&
        selectedQuests.length > 0 &&
        (() => {
          const firstQuest = selectedQuests[0];
          const distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            firstQuest.latitude,
            firstQuest.longitude,
          );
          return distance <= 1;
        })() && (
          <Pressable
            style={styles.aiDocentButton}
            onPress={() => {
              // AI Docent 화면으로 이동
              router.push('/travel-plan');
            }}
          >
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <Path
                d="M11.7295 0C18.2076 0 23.4597 5.25143 23.46 11.7295C23.46 18.2078 18.2078 23.46 11.7295 23.46C5.25143 23.4597 0 18.2076 0 11.7295C0.000257688 5.25159 5.25159 0.000259755 11.7295 0ZM15.5693 11.9824C15.4725 11.982 15.3786 12.0158 15.3037 12.0771C15.2287 12.1387 15.1776 12.225 15.1592 12.3203C14.9959 12.8206 14.8109 13.2995 14.6318 13.8262C14.6171 13.8732 14.5915 13.9163 14.5566 13.9512C14.5218 13.986 14.4786 14.0116 14.4316 14.0264L12.8994 14.5801C12.8105 14.6036 12.7321 14.6561 12.6768 14.7295C12.6214 14.803 12.5919 14.8933 12.5938 14.9854C12.5884 15.0765 12.6153 15.1663 12.6689 15.2402C12.7227 15.3142 12.8002 15.3676 12.8887 15.3906L14.4375 15.9541C14.4822 15.9677 14.5226 15.9924 14.5557 16.0254C14.5887 16.0584 14.6134 16.0989 14.627 16.1436C14.785 16.6439 14.969 17.1237 15.1533 17.6504C15.1738 17.747 15.227 17.8342 15.3037 17.8965C15.3804 17.9587 15.4765 17.9929 15.5752 17.9932C15.6711 17.9929 15.7642 17.9596 15.8389 17.8994C15.9135 17.8392 15.9649 17.7548 15.9854 17.6611C16.1486 17.1555 16.3336 16.6761 16.5127 16.1494C16.5265 16.1025 16.5519 16.0595 16.5869 16.0254C16.622 15.9913 16.6656 15.9666 16.7129 15.9541L18.2559 15.3906C18.3424 15.3661 18.4183 15.3136 18.4717 15.2412C18.5251 15.1687 18.553 15.0802 18.5508 14.9902C18.5559 14.9041 18.5328 14.8182 18.4854 14.7461C18.4379 14.6742 18.3681 14.6192 18.2871 14.5898C17.7606 14.4003 17.2336 14.2058 16.707 14.0215C16.6612 14.0103 16.6193 13.9865 16.5859 13.9531C16.5526 13.9198 16.5288 13.8778 16.5176 13.832C16.3596 13.3317 16.1756 12.8519 15.9912 12.3252C15.9707 12.2285 15.9175 12.1414 15.8408 12.0791C15.7642 12.0169 15.668 11.9827 15.5693 11.9824ZM8.97559 5.00879C8.80767 5.0109 8.64474 5.07058 8.51465 5.17676C8.38476 5.28291 8.29447 5.42983 8.25879 5.59375C7.93749 6.47336 7.61643 7.35319 7.30566 8.22754C7.28035 8.30934 7.23535 8.38379 7.1748 8.44434C7.11425 8.50487 7.03981 8.5499 6.95801 8.5752C6.06259 8.89122 5.17238 9.22324 4.28223 9.5498C4.12787 9.58927 3.99126 9.68027 3.89551 9.80762C3.79996 9.93489 3.7509 10.0909 3.75586 10.25C3.74662 10.4108 3.79429 10.5701 3.89062 10.6992C3.98695 10.8281 4.12561 10.9192 4.28223 10.9561C5.18286 11.2879 6.07847 11.6192 6.98438 11.9404C7.06153 11.9634 7.13152 12.0056 7.18848 12.0625C7.2455 12.1195 7.28759 12.1903 7.31055 12.2676C7.62649 13.1522 7.94773 14.0263 8.26367 14.9004C8.30211 15.0688 8.39583 15.2204 8.5293 15.3301C8.66274 15.4396 8.82938 15.5018 9.00195 15.5068C9.17014 15.5034 9.33203 15.4428 9.46191 15.3359C9.59182 15.229 9.68217 15.0815 9.71777 14.917C10.039 14.0375 10.3602 13.1627 10.6709 12.2832C10.6962 12.2015 10.7413 12.1269 10.8018 12.0664C10.8623 12.0059 10.9368 11.9609 11.0186 11.9355C11.9244 11.6196 12.8201 11.2878 13.7207 10.9561C13.8742 10.9187 14.0106 10.8296 14.1064 10.7041C14.2023 10.5785 14.2525 10.4236 14.248 10.2656C14.2557 10.105 14.2066 9.94643 14.1094 9.81836C14.0121 9.69034 13.8726 9.60115 13.7158 9.56543C12.8134 9.22482 11.9052 8.89474 10.9922 8.5752C10.9141 8.55218 10.8432 8.50917 10.7861 8.45117C10.7291 8.39314 10.6877 8.32159 10.666 8.24316C10.35 7.36355 10.0283 6.48372 9.70703 5.60938C9.55959 5.20416 9.31768 5.00892 8.97559 5.00879Z"
                fill="white"
              />
            </Svg>
            <Text style={styles.aiDocentButtonText}>Start QuestMode AI Docent</Text>
            <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <Path
                d="M9.39415 16.9275C9.31897 17.007 9.26019 17.1006 9.22118 17.2029C9.18216 17.3052 9.16368 17.4141 9.16677 17.5235C9.16987 17.6329 9.19448 17.7407 9.23922 17.8406C9.28395 17.9405 9.34792 18.0306 9.42748 18.1058C9.50704 18.181 9.60063 18.2397 9.7029 18.2788C9.80518 18.3178 9.91413 18.3363 10.0236 18.3332C10.133 18.3301 10.2407 18.3055 10.3406 18.2607C10.4405 18.216 10.5306 18.152 10.6058 18.0725L17.6891 10.5725C17.8354 10.4177 17.9169 10.2129 17.9169 9.99996C17.9169 9.78703 17.8354 9.58218 17.6891 9.42746L10.6058 1.92662C10.5311 1.84532 10.441 1.77967 10.3408 1.73348C10.2405 1.6873 10.132 1.66149 10.0217 1.65757C9.91138 1.65366 9.80137 1.6717 9.69808 1.71065C9.59478 1.74961 9.50025 1.8087 9.41998 1.88449C9.33972 1.96029 9.27531 2.05128 9.2305 2.15217C9.1857 2.25307 9.16139 2.36187 9.15899 2.47224C9.15658 2.58261 9.17613 2.69236 9.2165 2.79511C9.25687 2.89787 9.31726 2.99157 9.39415 3.07079L15.9375 9.99996L9.39415 16.9275Z"
                fill="white"
              />
            </Svg>
          </Pressable>
        )}

      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: kakaoMapHTML }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onLoad={() => {
          setLoading(false);
          // WebView 로드 후 퀘스트가 있으면 마커 추가
          if (quests.length > 0) {
            const questsJson = JSON.stringify(quests);
            setTimeout(() => {
              webViewRef.current?.injectJavaScript(`
                if (typeof addQuestMarkers === 'function') {
                  addQuestMarkers(${questsJson});
                }
                true;
              `);
            }, 500);
          }
        }}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          setError(nativeEvent.description);
          setLoading(false);
        }}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'error') {
              setError(data.message);
            } else if (data.type === 'questClick') {
              openQuestModal(data.quest);
            }
          } catch (e) {
            // Ignore
          }
        }}
      />

      {selectedQuest && (
        <QuestMiniModal quest={selectedQuest} onClose={() => setSelectedQuest(null)} />
      )}

      {loading && (
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <ThemedText style={styles.loadingText}>Loading map...</ThemedText>
        </ThemedView>
      )}
      {error && (
        <ThemedView style={styles.errorOverlay}>
          <ThemedText type="subtitle">Error</ThemedText>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        </ThemedView>
      )}

      {/* Map Small Button */}
      <View style={styles.mapSmallButtonContainer} pointerEvents="box-none">
        <Pressable
          style={styles.mapSmallButton}
          onPress={() => {
            router.push('/(tabs)/find/quest-recommendation');
          }}
        >
          <Image source={Images.mapSmall} style={styles.mapSmallButtonImage} resizeMode="contain" />
        </Pressable>
      </View>

      {/* Current Location Button */}
      <View style={styles.locationButtonContainer} pointerEvents="box-none">
        <Pressable
          style={styles.locationButton}
          onPress={() => {
            if (userLocation && webViewRef.current) {
              webViewRef.current.injectJavaScript(`
                if (typeof map !== 'undefined') {
                  var moveLatLon = new kakao.maps.LatLng(${userLocation.latitude}, ${userLocation.longitude});
                  map.panTo(moveLatLon);
                }
                true;
              `);
            }
          }}
        >
          <Svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <Defs>
              <RadialGradient id="paint0_radial_72_5040" cx="0.5" cy="0.5" r="0.5">
                <Stop offset="0" stopColor="white" />
                <Stop offset="1" stopColor="white" stopOpacity="0.85" />
              </RadialGradient>
              <SvgLinearGradient id="paint1_linear_72_5040" x1="0.5" y1="0" x2="0.5" y2="1">
                <Stop offset="0" stopColor="#659DF2" />
                <Stop offset="1" stopColor="#659DF2" stopOpacity="0.85" />
              </SvgLinearGradient>
            </Defs>
            <G>
              <Path
                d="M24 40C35.0457 40 44 31.0457 44 20C44 8.95431 35.0457 0 24 0C12.9543 0 4 8.95431 4 20C4 31.0457 12.9543 40 24 40Z"
                fill="url(#paint0_radial_72_5040)"
              />
              <Path
                d="M24 0.5C34.7696 0.5 43.5 9.23045 43.5 20C43.5 30.7696 34.7696 39.5 24 39.5C13.2304 39.5 4.5 30.7696 4.5 20C4.5 9.23045 13.2304 0.5 24 0.5Z"
                stroke="white"
              />
            </G>
            <G>
              <Path
                d="M15.9951 17.9652L29.8963 11.2817C31.7475 10.5681 32.4201 11.2237 31.7417 13.0976L25.3086 26.9868C25.1937 27.3037 24.9791 27.5739 24.6977 27.756C24.4162 27.938 24.0833 28.022 23.75 27.9951C23.4168 27.9681 23.1015 27.8316 22.8524 27.6065C22.6033 27.3815 22.4341 27.0802 22.3708 26.749C21.9224 24.4283 18.9559 21.4288 16.6218 20.9937L16.2423 20.9183C15.9148 20.8562 15.6164 20.6875 15.393 20.4379C15.1696 20.1884 15.0335 19.8717 15.0054 19.5366C14.9774 19.2015 15.0589 18.8664 15.2377 18.5825C15.4165 18.2987 15.6825 18.0818 15.9951 17.9652Z"
                fill="url(#paint1_linear_72_5040)"
              />
            </G>
          </Svg>
        </Pressable>
      </View>

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
            onPress={() => {
              if (selectedQuests.length > 0) {
                if (isQuestActive) {
                  // QUIT logic - deactivate quest
                  endQuest();
                  setIsQuestActive(false);

                  // Show all markers again
                  if (webViewRef.current) {
                    webViewRef.current.injectJavaScript(`
                      if (typeof showAllMarkers === 'function') {
                        showAllMarkers();
                      }
                      if (typeof clearRoute === 'function') {
                        clearRoute();
                      }
                      true;
                    `);
                  }
                } else {
                  // Show confirmation modal before starting
                  setShowStartModal(true);
                }
              }
            }}
            disabled={selectedQuests.length === 0}
          >
            <Text
              style={[
                styles.startButtonText,
                selectedQuests.length > 0 && styles.startButtonTextActive,
              ]}
            >
              {isQuestActive ? 'QUIT?' : 'START'}
            </Text>
          </Pressable>
        </LinearGradient>
      </View>

      {/* START Confirmation Modal */}
      <Modal
        visible={showStartModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowStartModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowStartModal(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            {/* Tiger Icon */}
            <Image source={Images.main2} style={styles.modalTigerIcon} resizeMode="contain" />

            {/* Title */}
            <Text style={styles.modalTitle}>Start the Quest Mode?</Text>

            {/* Main Description */}
            <Text style={styles.modalSubtitle}>
              Do you agree to allow us to use your GPS location for the Quest Mode and to collect
              this data for the purpose of improving the tourism experience?
            </Text>

            {/* Privacy Details */}
            <View style={styles.modalPrivacyContainer}>
              <Text style={styles.modalPrivacyText}>
                <Text style={styles.modalPrivacyBold}>Purpose: </Text>
                <Text style={styles.modalPrivacyRegular}>
                  Your location will be used to guide you to nearby quest locations, provide
                  tailored recommendations, and analyze tourism behavior patterns to improve the
                  service.
                </Text>
              </Text>
              <Text style={styles.modalPrivacyText}>
                <Text style={styles.modalPrivacyBold}>Data Sharing: </Text>
                <Text style={styles.modalPrivacyRegular}>
                  In order to improve the overall experience, your location data may be shared with
                  trusted partners for analysis and research purposes (e.g., visitor behavior
                  analysis).
                </Text>
              </Text>
              <Text style={styles.modalPrivacyText}>
                <Text style={styles.modalPrivacyBold}>Privacy Policy: </Text>
                <Text style={styles.modalPrivacyRegular}>
                  For detailed information on how your data will be handled, please review our
                  [Privacy Policy].
                </Text>
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancelButton} onPress={() => setShowStartModal(false)}>
                <Svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <Path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M1.70708 0.292919C1.51848 0.110761 1.26588 0.00996641 1.00368 0.0122448C0.741483 0.0145233 0.490671 0.119692 0.305263 0.3051C0.119854 0.490508 0.0146856 0.741321 0.0124071 1.00352C0.0101287 1.26571 0.110923 1.51832 0.293081 1.70692L5.58608 6.99992L0.293081 12.2929C0.197571 12.3852 0.121389 12.4955 0.0689798 12.6175C0.0165708 12.7395 -0.0110155 12.8707 -0.0121693 13.0035C-0.0133231 13.1363 0.0119786 13.268 0.0622595 13.3909C0.11254 13.5138 0.186793 13.6254 0.280686 13.7193C0.374579 13.8132 0.486231 13.8875 0.609127 13.9377C0.732024 13.988 0.863703 14.0133 0.996482 14.0122C1.12926 14.011 1.26048 13.9834 1.38249 13.931C1.50449 13.8786 1.61483 13.8024 1.70708 13.7069L7.00008 8.41392L12.2931 13.7069C12.4817 13.8891 12.7343 13.9899 12.9965 13.9876C13.2587 13.9853 13.5095 13.8801 13.6949 13.6947C13.8803 13.5093 13.9855 13.2585 13.9878 12.9963C13.99 12.7341 13.8892 12.4815 13.7071 12.2929L8.41408 6.99992L13.7071 1.70692C13.8892 1.51832 13.99 1.26571 13.9878 1.00352C13.9855 0.741321 13.8803 0.490508 13.6949 0.3051C13.5095 0.119692 13.2587 0.0145233 12.9965 0.0122448C12.7343 0.00996641 12.4817 0.110761 12.2931 0.292919L7.00008 5.58592L1.70708 0.292919Z"
                    fill="white"
                  />
                </Svg>
              </Pressable>
              <Pressable
                style={styles.modalConfirmButton}
                onPress={() => {
                  setShowStartModal(false);
                  // START logic - check distance and activate quest
                  const firstQuest = selectedQuests[0];

                  startQuest(firstQuest);

                  if (userLocation) {
                    const distance = calculateDistance(
                      userLocation.latitude,
                      userLocation.longitude,
                      firstQuest.latitude,
                      firstQuest.longitude,
                    );

                    // 위치 정보 수집 (1km 이내일 때만)
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
                        .catch((err) => {
                          // Ignore
                        });
                    }

                    // 선택된 모든 퀘스트 표시 (거리와 관계없이)
                    if (webViewRef.current) {
                      const selectedIds = selectedQuests.map((q) => q.id);
                      const slotNumbers: { [key: number]: number } = {};
                      selectedQuests.forEach((quest, index) => {
                        slotNumbers[quest.id] = index + 1;
                      });
                      webViewRef.current.injectJavaScript(`
                        if (typeof showSelectedQuestsOnly === 'function') {
                          showSelectedQuestsOnly(${JSON.stringify(
                            selectedIds,
                          )}, ${JSON.stringify(slotNumbers)});
                        }
                        true;
                      `);
                    }

                    if (distance <= 10) {
                      // Fetch and draw walking route from API
                      if (webViewRef.current && userLocation) {
                        (async () => {
                          const routeCoordinates = await fetchWalkingRoute(
                            userLocation.latitude,
                            userLocation.longitude,
                            firstQuest.latitude,
                            firstQuest.longitude,
                          );

                          if (routeCoordinates && routeCoordinates.length > 0) {
                            // Draw route with actual path from API
                            const coordsJson = JSON.stringify(routeCoordinates);
                            webViewRef.current?.injectJavaScript(`
                              if (typeof drawWalkingRouteWithPath === 'function') {
                                drawWalkingRouteWithPath(${coordsJson});
                              }
                              true;
                            `);
                          } else {
                            webViewRef.current?.injectJavaScript(`
                              if (typeof drawWalkingRoute === 'function') {
                                drawWalkingRoute(
                                  ${userLocation.latitude},
                                  ${userLocation.longitude},
                                  ${firstQuest.latitude},
                                  ${firstQuest.longitude}
                                );
                              }
                              true;
                            `);
                          }
                        })();
                      }
                    }
                  }
                  setIsQuestActive(true);
                }}
              >
                <Text style={styles.modalConfirmTextBold}>Agree, </Text>
                <Text style={styles.modalConfirmTextRegular}>Start Quest Mode</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  loadingText: {
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    padding: 16,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.3)',
  },
  errorText: {
    marginTop: 8,
    textAlign: 'center',
  },
  // Map small button styles
  mapSmallButtonContainer: {
    position: 'absolute',
    bottom: 175, // 117px (location button bottom) + 48px (button height) + 10px (gap)
    right: 20,
    zIndex: 1001,
    elevation: 1001,
  },
  mapSmallButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapSmallButtonImage: {
    width: 48,
    height: 48,
  },
  // Current location button styles
  locationButtonContainer: {
    position: 'absolute',
    bottom: 117, // 73px (bar height) + 30px (bottom margin) + 14px (gap)
    right: 20,
    zIndex: 1001,
    elevation: 1001,
  },
  locationButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationButtonIcon: {
    width: 48,
    height: 48,
  },
  // New compact route bar styles
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
  questSlotFilled: {
    backgroundColor: '#EF6A39',
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
  },
  slotPlusImage: {
    width: 58,
    height: 60,
    borderRadius: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 1,
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
  /* -----------------------
   FULL HEADER
------------------------*/
  fullHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 168,
    backgroundColor: '#659DF2',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 10,
    zIndex: 999,
    elevation: 999,
  },

  /* -----------------------
   TOP ROW (search + walk + mint)
------------------------*/
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  searchBox: {
    display: 'flex',
    flex: 1,
    height: 47,
    padding: 10,
    alignItems: 'center',
    gap: 5,
    borderRadius: 10,
    backgroundColor: '#FFF',
    flexDirection: 'row',
  },
  searchIcon: {},
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

  /* -----------------------
   FILTER ROW
------------------------*/
  filterRow: {
    marginTop: 12,
    marginBottom: 8,
  },

  /* -----------------------
   CATEGORY SCROLL
------------------------*/
  /* 필터 + 카테고리 (3개) */
  filterCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 5,
  },

  refreshIcon: {
    marginRight: 10,
  },

  filterIcon: {
    marginRight: 15,
  },

  /* All Themes - Primary (Orange) */
  categoryChipPrimary: {
    display: 'flex',
    paddingVertical: 7,
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 42,
    backgroundColor: '#FF7F50',
  },

  categoryTextPrimary: {
    color: '#FFF',
    fontFamily: 'Pretendard',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
    letterSpacing: -0.12,
  },

  /* Nearest Trip - Secondary (White with blue text and icon) */
  categoryChipSecondary: {
    display: 'flex',
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    borderRadius: 42,
    backgroundColor: '#FFF',
  },

  categoryTextSecondary: {
    color: '#659DF2',
    fontFamily: 'Pretendard',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
    letterSpacing: -0.12,
  },

  /* All Districts - Tertiary (White with border and blue text) */
  categoryChipTertiary: {
    display: 'flex',
    paddingVertical: 7,
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 42,
    borderWidth: 1,
    borderColor: '#FFF',
    backgroundColor: '#FFF',
  },

  categoryTextTertiary: {
    color: '#659DF2',
    fontFamily: 'Pretendard',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
    letterSpacing: -0.12,
  },

  /* --------------------------
   QUEST TOOLTIP (Tiger Box)
---------------------------*/
  questTooltip: {
    position: 'absolute',
    top: 190,
    left: 20,
    right: 20,
    padding: 10,
    paddingBottom: 15,
    gap: 20,
    borderRadius: 10,
    borderBottomWidth: 4,
    borderBottomColor: '#659DF2',
    backgroundColor: 'rgba(254, 245, 231, 0.85)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 8,
    zIndex: 1000,
  },

  exploreModeLabel: {
    position: 'absolute',
    top: 10,
    left: 10,
    padding: 5,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 42,
    borderWidth: 1,
    borderColor: '#FFF',
    backgroundColor: '#FFF',
    zIndex: 1,
  },

  exploreModeLabelText: {
    color: '#659DF2',
    textAlign: 'right',
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    letterSpacing: -0.12,
  },

  questContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginTop: 34,
  },

  horangFaceImage: {
    width: 80,
    height: 69,
    aspectRatio: 80 / 69,
  },

  questTextContent: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 4,
  },

  questTitle: {
    color: '#4A90E2',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    letterSpacing: -0.18,
  },

  questDesc: {
    color: '#4A90E2',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: -0.16,
  },

  /* --------------------------
   AI DOCENT BUTTON
---------------------------*/
  aiDocentButton: {
    position: 'absolute',
    top: 330, // questTooltip 아래 80px
    left: 20,
    right: 20,
    height: 47,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    gap: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#659DF2',
    backgroundColor: 'rgba(101, 157, 242, 0.85)', // 85% opacity
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 8,
    zIndex: 999,
  },

  aiDocentButtonText: {
    flex: 1,
    color: '#FFF',
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 14,
    textAlign: 'left', // 왼쪽 정렬
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
    borderRadius: 10,
    backgroundColor: '#FEF5E7',
  },
  modalTigerIcon: {
    width: 152,
    height: 144,
    aspectRatio: 19 / 18,
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
  modalPrivacyContainer: {
    gap: 10,
    alignSelf: 'stretch',
  },
  modalPrivacyText: {
    color: '#34495E',
    fontFamily: 'Pretendard',
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: -0.16,
  },
  modalPrivacyBold: {
    color: '#34495E',
    fontFamily: 'Pretendard',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
    letterSpacing: -0.16,
  },
  modalPrivacyRegular: {
    color: '#34495E',
    fontFamily: 'Pretendard',
    fontSize: 11,
    fontWeight: '400',
    lineHeight: 14,
    letterSpacing: -0.16,
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'stretch',
  },
  modalCancelButton: {
    width: 50,
    height: 50,
    padding: 10,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 41,
    backgroundColor: '#659DF2',
  },
  modalConfirmButton: {
    flex: 1,
    height: 50,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    borderRadius: 35,
    backgroundColor: '#FF7F50',
    flexDirection: 'row',
  },
  modalConfirmTextBold: {
    color: '#FFF',
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
  },
  modalConfirmTextRegular: {
    color: '#FFF',
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '400',
  },
});

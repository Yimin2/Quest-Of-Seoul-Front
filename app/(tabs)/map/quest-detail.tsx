import { useQuestStore } from '@entities/quest';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import * as Location from 'expo-location';
import { mapApi } from '@/services/api';

interface Quest {
  id: number;
  place_id: string | null;
  name: string;
  title: string | null;
  description: string;
  category: string | null;
  latitude: number;
  longitude: number;
  reward_point: number;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  is_active: boolean;
  completion_count: number;
  created_at: string;
  district?: string;
  place_image_url?: string;
  distance_km?: number;
}

export default function QuestDetailScreen() {
  const params = useLocalSearchParams();
  const [calculatedDistance, setCalculatedDistance] = useState<number | null>(null);

  // Parse quest data from params
  let quest: Quest | null = null;

  if (params.quest && typeof params.quest === 'string') {
    try {
      quest = JSON.parse(params.quest);
    } catch (error) {
      quest = null;
    }
  }

  // Calculate distance if not provided
  useEffect(() => {
    if (!quest || quest.distance_km !== undefined) return;

    const calculateDistance = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const distance = mapApi.calculateDistance(
          location.coords.latitude,
          location.coords.longitude,
          quest.latitude,
          quest.longitude,
        );
        setCalculatedDistance(distance);
      } catch (error) {}
    };

    calculateDistance();
  }, [quest]);

  // If quest is missing or invalid, navigate back
  useEffect(() => {
    if (!quest) {
      router.back();
    }
  }, [quest]);

  // Zustand store
  const { addQuest, selectedQuests, removeQuest } = useQuestStore();

  // Use calculated distance or provided distance
  const displayDistance = quest?.distance_km ?? calculatedDistance;

  // Early return if quest is not available
  if (!quest) {
    return null;
  }

  const handleBack = () => {
    router.back();
  };

  const handleAddQuest = () => {
    addQuest(quest);
  };

  return (
    <View style={styles.container}>
      {/* Back button */}
      <Pressable style={styles.backButton} onPress={handleBack}>
        <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <Path d="M15.41 7.41L14 6L8 12L14 18L15.41 16.59L10.83 12L15.41 7.41Z" fill="#FFF" />
        </Svg>
      </Pressable>

      {/* Plus button */}
      <Pressable style={styles.plusButton} onPress={handleAddQuest}>
        <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <Path
            d="M14.8571 9.14286H9.14286V14.8571C9.14286 15.1602 9.02245 15.4509 8.80812 15.6653C8.59379 15.8796 8.30311 16 8 16C7.6969 16 7.40621 15.8796 7.19188 15.6653C6.97755 15.4509 6.85714 15.1602 6.85714 14.8571V9.14286H1.14286C0.839753 9.14286 0.549063 9.02245 0.334735 8.80812C0.120408 8.59379 0 8.30311 0 8C0 7.6969 0.120408 7.40621 0.334735 7.19188C0.549063 6.97755 0.839753 6.85714 1.14286 6.85714H6.85714V1.14286C6.85714 0.839753 6.97755 0.549062 7.19188 0.334735C7.40621 0.120407 7.6969 0 8 0C8.30311 0 8.59379 0.120407 8.80812 0.334735C9.02245 0.549062 9.14286 0.839753 9.14286 1.14286V6.85714H14.8571C15.1602 6.85714 15.4509 6.97755 15.6653 7.19188C15.8796 7.40621 16 7.6969 16 8C16 8.30311 15.8796 8.59379 15.6653 8.80812C15.4509 9.02245 15.1602 9.14286 14.8571 9.14286Z"
            fill="white"
          />
        </Svg>
      </Pressable>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Image
          source={{
            uri: quest.place_image_url || 'https://picsum.photos/300/300',
          }}
          style={styles.image}
        />
        <View style={styles.content}>
          {/* 제목과 버튼을 가로로 배치 */}
          <View style={styles.titleRow}>
            <Text style={styles.title}>{quest.category || 'Quest'}</Text>
            <Pressable style={styles.relatedBtn}>
              <Text style={styles.relatedBtnText}>See Related Places</Text>
            </Pressable>
          </View>
          <View style={styles.nameAddressGroup}>
            <Text style={styles.name}>{quest.name}</Text>
            <Text style={styles.address}>{quest.district || 'Seoul'}</Text>
          </View>
          <View style={styles.buttonRow}>
            <View style={styles.button}>
              <View style={styles.buttonDistanceBadge}>
                <Svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <Path
                    d="M9.49609 0.501953C9.4967 0.511802 9.50014 0.523321 9.5 0.537109C9.49887 0.64138 9.4678 0.808104 9.38184 1.04883L5.61035 9.19434L5.60156 9.21387L5.59375 9.2334C5.56315 9.31782 5.50604 9.38903 5.43262 9.43652C5.35932 9.48388 5.27333 9.50595 5.1875 9.49902C5.1016 9.49207 5.01943 9.45648 4.9541 9.39746C4.88881 9.33843 4.84406 9.25842 4.82715 9.16992V9.16895L4.79199 9.01465C4.59556 8.24175 4.04883 7.43937 3.41504 6.80273C2.7393 6.12398 1.87207 5.54092 1.04492 5.38672L0.828125 5.34375L0.824219 5.34277L0.761719 5.32617C0.701821 5.30413 0.647322 5.2667 0.603516 5.21777C0.545136 5.15242 0.508439 5.06864 0.500977 4.97949C0.493596 4.89034 0.515442 4.8013 0.5625 4.72656C0.609571 4.65182 0.679301 4.59552 0.759766 4.56543L0.78125 4.55762L0.801758 4.54785L8.95898 0.625C9.19511 0.535375 9.35976 0.503188 9.46289 0.5C9.47568 0.499607 9.48672 0.501617 9.49609 0.501953Z"
                    fill="#659DF2"
                    stroke="#F5F5F5"
                  />
                </Svg>
                <Text style={styles.buttonDistanceText}>
                  {displayDistance !== null && displayDistance !== undefined
                    ? `${displayDistance.toFixed(1)}km`
                    : 'Calculating...'}
                </Text>
              </View>
              <Text style={styles.buttonSubText}>
                {displayDistance !== null && displayDistance !== undefined
                  ? `${displayDistance.toFixed(1)}km far from your place`
                  : 'Getting your location...'}
              </Text>
            </View>
            <View style={styles.buttonRight}>
              <View style={styles.buttonMintBadge}>
                <Svg width="16" height="10" viewBox="0 0 16 10" fill="none">
                  <Path
                    d="M7.97656 0.5C8.66625 0.505346 9.34579 0.688996 9.95508 1.03613C10.5644 1.38334 11.0863 1.88423 11.4727 2.49707L11.8076 3.02832L12.25 2.58301C12.4078 2.42426 12.5942 2.30362 12.7959 2.22754L12.8047 2.22461L13.7578 1.84473C14.1608 1.68634 14.5665 1.6956 14.874 1.81055C15.1809 1.92526 15.3604 2.12924 15.4121 2.3584L15.4814 2.6709V2.67188C15.5433 2.94777 15.4221 3.28911 15.0869 3.56152L14.5449 4.00098L15.1367 4.37207C15.2406 4.43732 15.3299 4.53127 15.3945 4.64648C15.443 4.73304 15.476 4.82923 15.4912 4.92969L15.5 5.03125V5.33789C15.5 5.58665 15.3625 5.83372 15.0674 6.02734L14.4883 6.40723L15.0303 6.83789C15.4195 7.14688 15.5503 7.53718 15.4688 7.83594L15.3818 8.13477L15.3809 8.13965C15.3167 8.37087 15.1173 8.5688 14.7861 8.66113C14.4546 8.75345 14.0298 8.72287 13.6309 8.5166H13.6299L12.71 8.04199L12.707 8.04102C12.5122 7.94195 12.3377 7.79878 12.1973 7.61914L11.7764 7.0791L11.3906 7.64453C11.2577 7.8391 11.1098 8.02158 10.9482 8.18945L10.9453 8.19141C10.5132 8.64672 9.99469 8.9976 9.42578 9.2207C8.85712 9.44368 8.25031 9.53447 7.64648 9.48828C7.04246 9.44203 6.45323 9.25922 5.91992 8.95117C5.38666 8.64311 4.92044 8.21673 4.55469 7.69922L4.18359 7.17383L3.76562 7.66309C3.63164 7.82006 3.47111 7.9469 3.29395 8.03711L3.29199 8.03809L2.37207 8.51172H2.37109C1.97187 8.71816 1.54829 8.74853 1.21777 8.65625C0.888053 8.56416 0.686747 8.36684 0.620117 8.13281L0.619141 8.12988L0.533203 7.83398C0.454976 7.53756 0.584715 7.14438 0.974609 6.83008L1.50879 6.39941L0.93457 6.02344C0.640255 5.83044 0.502024 5.57912 0.501953 5.33398V5.03027C0.505997 4.89354 0.542223 4.76088 0.606445 4.64551C0.670593 4.53039 0.759897 4.43663 0.863281 4.37109L1.44727 4.00098L0.912109 3.5625C0.577499 3.28772 0.454259 2.9457 0.515625 2.67188V2.6709L0.584961 2.35645C0.63714 2.12824 0.817559 1.92506 1.12402 1.81055C1.43186 1.69559 1.83729 1.68655 2.23926 1.84473V1.8457L3.19434 2.22461L3.19824 2.22559C3.37976 2.29627 3.54914 2.40209 3.69727 2.53809L4.13184 2.9375L4.4541 2.44238C4.84885 1.83571 5.3772 1.34256 5.99121 1.00488C6.60505 0.667345 7.28698 0.494722 7.97656 0.5Z"
                    fill="#76C7AD"
                    stroke="white"
                  />
                </Svg>
                <Text style={styles.buttonMintText}>{quest.points}</Text>
              </View>
              <Text style={styles.buttonRightSubText}>{quest.points} is on this Quest</Text>
            </View>
          </View>
          <Pressable style={styles.navigationButton}>
            <Svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              style={styles.navigationIcon}
            >
              <Path
                d="M1.17067 8.19432L17.5251 0.331377C19.7029 -0.508163 20.4942 0.263125 19.6961 2.46777L12.1277 18.808C11.9926 19.1808 11.7402 19.4987 11.409 19.7129C11.0779 19.9271 10.6862 20.0259 10.2942 19.9942C9.90209 19.9624 9.53116 19.8019 9.2381 19.5371C8.94503 19.2723 8.74604 18.9179 8.67155 18.5282C8.14399 15.798 4.65398 12.2692 1.90796 11.7573L1.46154 11.6686C1.0762 11.5955 0.725202 11.397 0.462362 11.1034C0.199522 10.8098 0.0393695 10.4374 0.00636494 10.0431C-0.0266396 9.64883 0.06934 9.25454 0.279649 8.92061C0.489959 8.58669 0.802935 8.33154 1.17067 8.19432Z"
                fill="white"
              />
            </Svg>
            <Text style={styles.navigationText}>Do you need navigation?</Text>
            <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <Path
                d="M9.39421 16.9279C9.31903 17.0075 9.26025 17.1011 9.22124 17.2034C9.18223 17.3056 9.16374 17.4146 9.16683 17.524C9.16993 17.6334 9.19455 17.7412 9.23928 17.8411C9.28401 17.941 9.34798 18.0311 9.42754 18.1063C9.5071 18.1815 9.60069 18.2402 9.70296 18.2792C9.80524 18.3183 9.91419 18.3367 10.0236 18.3337C10.133 18.3306 10.2408 18.3059 10.3407 18.2612C10.4406 18.2165 10.5307 18.1525 10.6059 18.0729L17.6892 10.5729C17.8355 10.4182 17.917 10.2134 17.917 10.0004C17.917 9.78752 17.8355 9.58267 17.6892 9.42795L10.6059 1.92711C10.5312 1.84581 10.4411 1.78016 10.3408 1.73397C10.2405 1.68779 10.1321 1.66198 10.0218 1.65806C9.91144 1.65414 9.80143 1.67219 9.69814 1.71114C9.59484 1.75009 9.50031 1.80918 9.42004 1.88498C9.33978 1.96078 9.27537 2.05176 9.23057 2.15266C9.18576 2.25356 9.16145 2.36235 9.15905 2.47273C9.15664 2.5831 9.17619 2.69285 9.21656 2.7956C9.25693 2.89835 9.31732 2.99206 9.39421 3.07128L15.9375 10.0004L9.39421 16.9279Z"
                fill="white"
              />
            </Svg>
          </Pressable>
          <Text style={styles.overviewTitle}>OverView</Text>
          <Text style={styles.overviewDescription}>{quest.description}</Text>
          <View style={styles.spacer} />
        </View>
      </ScrollView>

      {/* Bottom Route Selection Bar */}
      <View style={styles.routeContainer} pointerEvents="box-none">
        <LinearGradient
          colors={['#FF7F50', '#994C30']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.routeBar}
        >
          <View style={styles.questSlotsContainer}>
            {[0, 1, 2, 3].map((index) => {
              const selectedQuest = selectedQuests[index];
              return (
                <Pressable
                  key={index}
                  style={styles.questSlot}
                  onPress={() => selectedQuest && removeQuest(selectedQuest.id)}
                >
                  {selectedQuest ? (
                    <Image
                      source={{
                        uri: selectedQuest.place_image_url || 'https://picsum.photos/58/60',
                      }}
                      style={styles.slotQuestImage}
                    />
                  ) : (
                    <Text style={styles.slotPlusIcon}>+</Text>
                  )}
                </Pressable>
              );
            })}
          </View>

          <Pressable
            style={[styles.startButton, selectedQuests.length > 0 && styles.startButtonActive]}
            onPress={() => {
              if (selectedQuests.length > 0) {
                // Navigate back to map to start quest
                router.back();
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
              START
            </Text>
          </Pressable>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#34495E',
  },

  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },

  plusButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 38,
    height: 38,
    padding: 11,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 127, 80, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },

  scrollView: {
    flex: 1,
  },

  image: {
    width: '100%',
    height: 268,
    flexShrink: 0,
  },

  content: {
    paddingTop: 29,
    paddingHorizontal: 29,
    paddingBottom: 20,
    gap: 33,
  },

  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },

  relatedBtn: {
    width: 154,
    height: 38,
    flexShrink: 0,
    borderRadius: 10,
    backgroundColor: '#4D647C',
    justifyContent: 'center',
    alignItems: 'center',
  },

  relatedBtnText: {
    color: '#FFF',
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '400',
  },

  title: {
    color: '#FFF',
    fontFamily: 'Inter',
    fontSize: 20,
    fontWeight: '700',
  },

  nameAddressGroup: {
    gap: 10,
  },

  name: {
    color: '#FFF',
    fontFamily: 'Inter',
    fontSize: 20,
    fontWeight: '700',
  },

  address: {
    color: '#FFF',
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '400',
  },

  buttonRow: {
    flexDirection: 'row',
    gap: 5,
    width: '100%',
  },

  button: {
    flex: 1,
    height: 60,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    backgroundColor: '#FFF',
  },

  buttonDistanceBadge: {
    height: 16,
    paddingHorizontal: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 0,
    borderRadius: 14,
    backgroundColor: 'rgba(52, 73, 94, 0.50)',
  },

  buttonDistanceText: {
    color: '#FFF',
    fontFamily: 'Pretendard',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    letterSpacing: -0.12,
  },

  buttonSubText: {
    color: '#34495E',
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    letterSpacing: 0,
    textAlign: 'center',
  },

  buttonRight: {
    flex: 1,
    height: 60,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#76C7AD',
    backgroundColor: '#76C7AD',
  },

  buttonMintBadge: {
    height: 16,
    paddingHorizontal: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 0,
    borderRadius: 14,
    backgroundColor: 'rgba(52, 73, 94, 0.50)',
  },

  buttonMintText: {
    color: '#FFF',
    fontFamily: 'Pretendard',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    letterSpacing: -0.12,
  },

  buttonRightSubText: {
    color: '#34495E',
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    letterSpacing: 0,
    textAlign: 'center',
  },

  navigationButton: {
    width: '100%',
    height: 47,
    marginTop: -23,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#659DF2',
    backgroundColor: '#659DF2',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },

  navigationIcon: {
    width: 20,
    height: 20,
  },

  navigationText: {
    color: '#FFF',
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '400',
    marginLeft: 8,
  },

  overviewTitle: {
    color: '#FFF',
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    marginTop: -5,
  },

  overviewDescription: {
    color: '#FFF',
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '400',
    marginTop: -15,
  },

  spacer: {
    height: 80,
  },

  /* Bottom Route Selection Bar */
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

  slotQuestImage: {
    width: 58,
    height: 60,
    borderRadius: 10,
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

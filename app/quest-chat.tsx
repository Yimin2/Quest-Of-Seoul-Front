import { Ionicons } from '@expo/vector-icons';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  useAudioPlayer,
  useAudioRecorder,
} from 'expo-audio';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  G,
  Mask,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import { aiStationApi } from '@shared/api';
import { useQuestStore } from '@entities/quest';
import { ThemedText } from '@shared/ui';

const API_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  (Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000');
const makeId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const formatTimestamp = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

type Message = {
  id: string;
  role: 'assistant' | 'user';
  text?: string;
  imageUrl?: string;
  timestamp: Date;
};

type VLMContext = {
  placeName: string;
  description: string;
  vlmAnalysis?: string;
};

export default function QuestChatScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const router = useRouter();
  const { activeQuest } = useQuestStore();
  const params = useLocalSearchParams();

  const questId = activeQuest?.quest_id;
  const placeId = activeQuest?.place_id;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: makeId(),
      role: 'assistant',
      text: "Hello! Ask me anything about Seoul tourism. 🏛️\n\nUpload a photo and I'll analyze the place for you! 📸",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);
  const [vlmContext, setVlmContext] = useState<VLMContext | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showVoiceMode, setShowVoiceMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Quest');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [voiceModeSessionId, setVoiceModeSessionId] = useState<string | null>(null);
  const [isCaptionOn, setIsCaptionOn] = useState(true);

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  useEffect(() => {
    if (params.imageBase64) {
      const imageBase64 = Array.isArray(params.imageBase64)
        ? params.imageBase64[0]
        : params.imageBase64;

      if (imageBase64) {
        handleImageSelected(imageBase64);
        router.setParams({ imageBase64: undefined });
      }
    }
  }, [params.imageBase64]);

  const addMessage = (msg: Message) => {
    setMessages((prev) => [...prev, msg]);
  };

  const handleImageSelected = async (base64img: string) => {
    setSelectedImage(base64img);
  };

  const pickImageFromLibrary = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setShowImageModal(false);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        base64: true,
        quality: 0.8,
        mediaTypes: ['images'],
        allowsEditing: false,
      });

      // ImagePicker가 닫힌 후 모달도 닫기
      setShowImageModal(false);

      if (!result.canceled && result.assets?.[0]?.base64) {
        await handleImageSelected(result.assets[0].base64);
      }
    } catch (error) {
      setShowImageModal(false);
    }
  };

  const takePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setShowImageModal(false);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        mediaTypes: ['images'],
        allowsEditing: false,
      });

      setShowImageModal(false);

      if (!result.canceled && result.assets?.[0]?.uri) {
        try {
          const base64 = await FileSystem.readAsStringAsync(result.assets[0].uri, {
            encoding: 'base64',
          });
          await handleImageSelected(base64);
        } catch (convertError) {
          // Ignore
        }
      }
    } catch (error) {
      setShowImageModal(false);
    }
  };

  const analyzeImage = async (base64img: string, userMessage?: string) => {
    addMessage({
      id: makeId(),
      role: 'assistant',
      text: 'Analyzing... 🔍',
      timestamp: new Date(),
    });
    try {
      if (questId) {
        const data = await aiStationApi.questVlmChat({
          image: base64img,
          user_message: userMessage || undefined,
          quest_id: questId,
          place_id: placeId ?? undefined,
          language: 'en',
          prefer_url: true,
          enable_tts: false,
        });

        if (data?.message) {
          // VLM 컨텍스트 저장
          setVlmContext({
            placeName: data.place?.name || 'Seoul',
            description: data.message,
          });

          addMessage({
            id: makeId(),
            role: 'assistant',
            text: data.message,
            timestamp: new Date(),
          });

          if (data.place) {
            addMessage({
              id: makeId(),
              role: 'assistant',
              text: `📍 ${data.place.name || 'Unknown place'}\n${data.place.address || ''}`,
              timestamp: new Date(),
            });
          }

          // 후속 질문 안내
          addMessage({
            id: makeId(),
            role: 'assistant',
            text: 'Feel free to ask more questions about this place! 💬',
            timestamp: new Date(),
          });
        } else {
          addMessage({
            id: makeId(),
            role: 'assistant',
            text: 'Could not load analysis results.',
            timestamp: new Date(),
          });
        }
      } else {
        const data = await aiStationApi.vlmAnalyze({
          image: base64img,
          language: 'en',
          prefer_url: true,
          enable_tts: false,
        });

        if (data?.description) {
          // VLM 컨텍스트 저장
          setVlmContext({
            placeName: data.place?.name || 'Seoul',
            description: data.description,
            vlmAnalysis: data.vlm_analysis,
          });

          addMessage({
            id: makeId(),
            role: 'assistant',
            text: data.description,
            timestamp: new Date(),
          });

          if (data.place) {
            addMessage({
              id: makeId(),
              role: 'assistant',
              text: `📍 ${data.place.name || 'Unknown place'}\n${data.place.address || ''}`,
              timestamp: new Date(),
            });
          }

          // 후속 질문 안내
          addMessage({
            id: makeId(),
            role: 'assistant',
            text: 'Feel free to ask more questions about this place! 💬',
            timestamp: new Date(),
          });
        } else {
          addMessage({
            id: makeId(),
            role: 'assistant',
            text: 'Could not load analysis results.',
            timestamp: new Date(),
          });
        }
      }
    } catch (error) {
      addMessage({
        id: makeId(),
        role: 'assistant',
        text: 'An error occurred while analyzing the image.',
        timestamp: new Date(),
      });
    }
  };

  const sendMessage = async () => {
    if (selectedImage) {
      const userText = input.trim();

      addMessage({
        id: makeId(),
        role: 'user',
        imageUrl: `data:image/jpeg;base64,${selectedImage}`,
        text: userText || undefined,
        timestamp: new Date(),
      });

      const imageToSend = selectedImage;
      const messageToSend = userText || undefined;

      setInput('');
      setSelectedImage(null);
      setIsLoading(true);

      await analyzeImage(imageToSend, messageToSend);
      setIsLoading(false);
      return;
    }

    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    addMessage({
      id: makeId(),
      role: 'user',
      text: userText,
      timestamp: new Date(),
    });
    setInput('');
    setIsLoading(true);

    try {
      if (!questId) {
        addMessage({
          id: makeId(),
          role: 'assistant',
          text: 'Quest ID is required. Please start a quest.',
          timestamp: new Date(),
        });
        return;
      }

      // VLM 컨텍스트가 있으면 컨텍스트 포함, 없으면 일반 대화
      let userMessage: string;

      if (vlmContext) {
        userMessage = `[Previous Image Analysis Result]
${vlmContext.description}

[User Question]
${userText}`;
      } else {
        userMessage = userText;
      }

      const data = await aiStationApi.questRAGChat({
        quest_id: questId,
        user_message: userMessage,
        language: 'en',
        prefer_url: true,
        enable_tts: false,
        chat_session_id: voiceModeSessionId || undefined, // 음성 모드 전용 세션 (없으면 새 세션 생성)
      });

      // 세션 ID 저장 (조회 전용)
      if (data.session_id) {
        setSessionId(data.session_id);
      }

      addMessage({
        id: makeId(),
        role: 'assistant',
        text: data.message || 'Failed to receive response.',
        timestamp: new Date(),
      });

      // landmark 정보가 있으면 추가 표시
      if (data.landmark) {
        addMessage({
          id: makeId(),
          role: 'assistant',
          text: `📍 ${data.landmark}`,
          timestamp: new Date(),
        });
      }
    } catch (error) {
      addMessage({
        id: makeId(),
        role: 'assistant',
        text: 'An error occurred while fetching the response.',
        timestamp: new Date(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exitToPrevious = () => {
    router.back();
  };

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const player = useAudioPlayer(null);

  const startRecording = async () => {
    try {
      const permissionResponse = await requestRecordingPermissionsAsync();
      if (!permissionResponse.granted) {
        Alert.alert(
          'Microphone permission required',
          'For voice input, microphone permission is required. Please allow permission in settings.',
        );
        return;
      }

      recorder.record();
      setIsRecording(true);
    } catch (err: any) {
      if (err?.message?.includes('permission') || err?.code === 'ERR_PERMISSION_DENIED') {
        Alert.alert(
          'Microphone permission denied',
          'Microphone permission is denied. Please allow permission in settings.',
        );
      } else {
        Alert.alert('Recording failed', 'Recording failed. Please try again.');
      }
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    try {
      if (!recorder.isRecording) return null;

      await recorder.stop();
      const uri = recorder.uri;
      setIsRecording(false);

      if (!uri) return null;

      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });

      return base64;
    } catch (err) {
      setIsRecording(false);
      return null;
    }
  };

  const playTTSAudio = async (audioBase64: string) => {
    try {
      const fileUri = `${FileSystem.cacheDirectory}tts_${Date.now()}.mp3`;
      await FileSystem.writeAsStringAsync(fileUri, audioBase64, {
        encoding: 'base64',
      });

      player.replace({ uri: fileUri });
      player.play();

      return player;
    } catch (ttsError: any) {
      throw ttsError;
    }
  };

  const runSTTandTTS = async () => {
    try {
      const base64Audio = await stopRecording();
      if (!base64Audio) {
        return;
      }

      const languageCode = 'en-US';

      const data = await aiStationApi.sttTts({
        audio: base64Audio,
        language_code: languageCode,
        prefer_url: false,
      });

      if (!data.transcribed_text || data.transcribed_text.trim().length === 0) {
        const errorMsg: Message = {
          id: makeId(),
          role: 'assistant',
          text: 'Voice recognition failed. Please try again.',
          timestamp: new Date(),
        };
        if (!showVoiceMode) {
          addMessage(errorMsg);
        }
        return;
      }

      const text = data.transcribed_text;

      if (showVoiceMode) {
        await sendMessageFromSTTForVoiceMode(text);
      } else {
        const userMsg: Message = {
          id: makeId(),
          role: 'user',
          text: text,
          timestamp: new Date(),
        };
        addMessage(userMsg);
        await sendMessageFromSTT(text);
      }
    } catch (e: any) {
      const errorMessage = e?.message || 'Voice recognition failed. Please try again.';
      const errorMsg: Message = {
        id: makeId(),
        role: 'assistant',
        text: errorMessage,
        timestamp: new Date(),
      };
      if (showVoiceMode) {
        Alert.alert('Voice Recognition Failed', errorMessage);
      } else {
        addMessage(errorMsg);
      }
    }
  };

  const sendMessageFromSTTForVoiceMode = async (text: string) => {
    setIsLoading(true);
    try {
      if (!questId) {
        return;
      }

      let userMessage: string;

      if (vlmContext) {
        userMessage = `[Previous Image Analysis Result]
${vlmContext.description}

[User Question]
${text}`;
      } else {
        userMessage = text;
      }

      const data = await aiStationApi.questRAGChat({
        quest_id: questId,
        user_message: userMessage,
        language: 'en',
        prefer_url: false,
        enable_tts: true,
        chat_session_id: voiceModeSessionId || undefined,
      });

      if (data.session_id) {
        setVoiceModeSessionId(data.session_id);
      }

      if (data.audio) {
        try {
          await playTTSAudio(data.audio);
        } catch (ttsError) {
          // Ignore
        }
      }
    } catch (err) {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessageFromSTT = async (text: string) => {
    setIsLoading(true);
    try {
      if (!questId) {
        addMessage({
          id: makeId(),
          role: 'assistant',
          text: 'Quest ID is required. Please start a quest.',
          timestamp: new Date(),
        });
        return;
      }

      // VLM 컨텍스트가 있으면 컨텍스트 포함, 없으면 일반 대화
      let userMessage: string;

      if (vlmContext) {
        userMessage = `[Previous Image Analysis Result]
${vlmContext.description}

[User Question]
${text}`;
      } else {
        userMessage = text;
      }

      const data = await aiStationApi.questRAGChat({
        quest_id: questId,
        user_message: userMessage,
        language: 'en',
        prefer_url: false,
        enable_tts: true,
        chat_session_id: sessionId || undefined,
      });

      if (data.session_id) {
        setSessionId(data.session_id);
      }

      addMessage({
        id: makeId(),
        role: 'assistant',
        text: data.message || 'Failed to receive response.',
        timestamp: new Date(),
      });

      // landmark 정보가 있으면 추가 표시
      if (data.landmark) {
        addMessage({
          id: makeId(),
          role: 'assistant',
          text: `📍 ${data.landmark}`,
          timestamp: new Date(),
        });
      }

      if (data.audio) {
        try {
          await playTTSAudio(data.audio);
        } catch (ttsError) {
          // Ignore
        }
      }
    } catch (err) {
      addMessage({
        id: makeId(),
        role: 'assistant',
        text: 'An error occurred while fetching the response.',
        timestamp: new Date(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const HamburgerIcon = () => (
    <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <Path
        d="M3.33334 15C3.09723 15 2.89945 14.92 2.74 14.76C2.58056 14.6 2.50056 14.4022 2.5 14.1667C2.49945 13.9311 2.57945 13.7333 2.74 13.5733C2.90056 13.4133 3.09834 13.3333 3.33334 13.3333H16.6667C16.9028 13.3333 17.1008 13.4133 17.2608 13.5733C17.4208 13.7333 17.5006 13.9311 17.5 14.1667C17.4994 14.4022 17.4194 14.6003 17.26 14.7608C17.1006 14.9214 16.9028 15.0011 16.6667 15H3.33334ZM3.33334 10.8333C3.09723 10.8333 2.89945 10.7533 2.74 10.5933C2.58056 10.4333 2.50056 10.2356 2.5 10C2.49945 9.76444 2.57945 9.56667 2.74 9.40667C2.90056 9.24667 3.09834 9.16667 3.33334 9.16667H16.6667C16.9028 9.16667 17.1008 9.24667 17.2608 9.40667C17.4208 9.56667 17.5006 9.76444 17.5 10C17.4994 10.2356 17.4194 10.4336 17.26 10.5942C17.1006 10.7547 16.9028 10.8344 16.6667 10.8333H3.33334ZM3.33334 6.66667C3.09723 6.66667 2.89945 6.58667 2.74 6.42667C2.58056 6.26667 2.50056 6.06889 2.5 5.83333C2.49945 5.59778 2.57945 5.4 2.74 5.24C2.90056 5.08 3.09834 5 3.33334 5H16.6667C16.9028 5 17.1008 5.08 17.2608 5.24C17.4208 5.4 17.5006 5.59778 17.5 5.83333C17.4994 6.06889 17.4194 6.26694 17.26 6.4275C17.1006 6.58806 16.9028 6.66778 16.6667 6.66667H3.33334Z"
        fill="white"
      />
    </Svg>
  );

  const CloseIcon = () => (
    <Svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <G clipPath="url(#clip0_417_8601)">
        <Path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M1.82891 0.313458C1.62684 0.118289 1.35619 0.0102947 1.07527 0.0127358C0.794342 0.015177 0.525614 0.127858 0.326962 0.32651C0.128311 0.525161 0.0156299 0.793889 0.0131887 1.07481C0.0107476 1.35574 0.118742 1.62638 0.313911 1.82846L5.98498 7.49953L0.313911 13.1706C0.211579 13.2694 0.129955 13.3877 0.0738023 13.5184C0.0176498 13.6491 -0.0119069 13.7897 -0.0131431 13.932C-0.0143794 14.0742 0.0127296 14.2153 0.066602 14.347C0.120474 14.4787 0.200031 14.5983 0.300631 14.6989C0.40123 14.7995 0.520857 14.879 0.652532 14.9329C0.784206 14.9868 0.925291 15.0139 1.06756 15.0127C1.20982 15.0114 1.35041 14.9819 1.48113 14.9257C1.61185 14.8696 1.73007 14.7879 1.82891 14.6856L7.49998 9.01453L13.1711 14.6856C13.3731 14.8808 13.6438 14.9888 13.9247 14.9863C14.2056 14.9839 14.4744 14.8712 14.673 14.6726C14.8717 14.4739 14.9843 14.2052 14.9868 13.9242C14.9892 13.6433 14.8812 13.3727 14.6861 13.1706L9.01498 7.49953L14.6861 1.82846C14.8812 1.62638 14.9892 1.35574 14.9868 1.07481C14.9843 0.793889 14.8717 0.525161 14.673 0.32651C14.4744 0.127858 14.2056 0.015177 13.9247 0.0127358C13.6438 0.0102947 13.3731 0.118289 13.1711 0.313458L7.49998 5.98453L1.82891 0.313458Z"
          fill="white"
        />
      </G>
      <Defs>
        <ClipPath id="clip0_417_8601">
          <Rect width="15" height="15" fill="white" />
        </ClipPath>
      </Defs>
    </Svg>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ImageBackground
        source={{ uri: activeQuest?.quest.place_image_url || undefined }}
        style={styles.backgroundImage}
        imageStyle={styles.backgroundImageStyle}
      >
        <LinearGradient
          colors={['rgba(101, 157, 242, 0.00)', '#659DF2']}
          style={styles.backgroundGradient}
        >
          <View style={styles.container}>
            <View style={styles.headerContainer}>
              <View style={styles.headerContent}>
                <Pressable onPress={() => router.push('/chat-history')} style={styles.headerButton}>
                  <HamburgerIcon />
                </Pressable>
                <ThemedText style={styles.headerTitle}>
                  {activeQuest?.quest.name || 'Gyeongbokgung Palace'}
                </ThemedText>
                <Pressable onPress={exitToPrevious} style={styles.headerButton}>
                  <CloseIcon />
                </Pressable>
              </View>
            </View>

            <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={styles.messages}>
              {messages.map((msg) => (
                <View key={msg.id} style={styles.messageContainer}>
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
                            {msg.text && (
                              <ThemedText style={styles.assistantBubbleText}>{msg.text}</ThemedText>
                            )}
                            {msg.imageUrl && (
                              <Image
                                source={{ uri: msg.imageUrl }}
                                style={{
                                  width: 180,
                                  height: 180,
                                  borderRadius: 12,
                                  marginTop: 6,
                                }}
                              />
                            )}
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
                        {msg.text && <ThemedText style={styles.userText}>{msg.text}</ThemedText>}
                        {msg.imageUrl && (
                          <Image
                            source={{ uri: msg.imageUrl }}
                            style={{
                              width: 180,
                              height: 180,
                              borderRadius: 12,
                              marginTop: 6,
                            }}
                          />
                        )}
                      </View>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>

            {selectedImage && (
              <View style={styles.imagePreviewContainer}>
                <Image
                  source={{ uri: `data:image/jpeg;base64,${selectedImage}` }}
                  style={styles.imagePreview}
                  resizeMode="cover"
                />
                <Pressable
                  style={styles.removeImageButton}
                  onPress={() => {
                    setSelectedImage(null);
                    setInput('');
                  }}
                >
                  <Ionicons name="close-circle" size={24} color="#fff" />
                </Pressable>
                <View style={styles.previewActions}>
                  <Pressable
                    style={styles.cancelPreviewButton}
                    onPress={() => {
                      setSelectedImage(null);
                      setInput('');
                    }}
                  >
                    <ThemedText style={styles.cancelPreviewText}>Cancel</ThemedText>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.sendPreviewButton,
                      isLoading && styles.sendPreviewButtonDisabled,
                    ]}
                    onPress={sendMessage}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                      <ThemedText style={styles.sendPreviewText}>Send</ThemedText>
                    )}
                  </Pressable>
                </View>
              </View>
            )}

            <View style={styles.bottomSection}>
              <View style={styles.categoryContainer}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoryScrollContent}
                >
                  <Pressable
                    style={[
                      styles.categoryTab,
                      selectedCategory === 'Quest' && styles.categoryTabActive,
                    ]}
                    onPress={() => setSelectedCategory('Quest')}
                  >
                    <Svg width="16" height="10" viewBox="0 0 16 10" fill="none">
                      <Path
                        d="M7.97656 0.5C8.66625 0.505346 9.34579 0.688996 9.95508 1.03613C10.5644 1.38334 11.0863 1.88423 11.4727 2.49707L11.8076 3.02832L12.25 2.58301C12.4078 2.42426 12.5942 2.30362 12.7959 2.22754L12.8047 2.22461L13.7578 1.84473C14.1608 1.68634 14.5665 1.6956 14.874 1.81055C15.1809 1.92526 15.3604 2.12924 15.4121 2.3584L15.4814 2.6709V2.67188C15.5433 2.94777 15.4221 3.28911 15.0869 3.56152L14.5449 4.00098L15.1367 4.37207C15.2406 4.43732 15.3299 4.53127 15.3945 4.64648C15.443 4.73304 15.476 4.82923 15.4912 4.92969L15.5 5.03125V5.33789C15.5 5.58665 15.3625 5.83372 15.0674 6.02734L14.4883 6.40723L15.0303 6.83789C15.4195 7.14688 15.5503 7.53718 15.4688 7.83594L15.3818 8.13477L15.3809 8.13965C15.3167 8.37087 15.1173 8.5688 14.7861 8.66113C14.4546 8.75345 14.0298 8.72287 13.6309 8.5166H13.6299L12.71 8.04199L12.707 8.04102C12.5122 7.94195 12.3377 7.79878 12.1973 7.61914L11.7764 7.0791L11.3906 7.64453C11.2577 7.8391 11.1098 8.02158 10.9482 8.18945L10.9453 8.19141C10.5132 8.64672 9.99469 8.9976 9.42578 9.2207C8.85712 9.44368 8.25031 9.53447 7.64648 9.48828C7.04246 9.44203 6.45323 9.25922 5.91992 8.95117C5.38666 8.64311 4.92044 8.21673 4.55469 7.69922L4.18359 7.17383L3.76562 7.66309C3.63164 7.82006 3.47111 7.9469 3.29395 8.03711L3.29199 8.03809L2.37207 8.51172H2.37109C1.97187 8.71816 1.54829 8.74853 1.21777 8.65625C0.888053 8.56416 0.686747 8.36684 0.620117 8.13281L0.619141 8.12988L0.533203 7.83398C0.454976 7.53756 0.584715 7.14438 0.974609 6.83008L1.50879 6.39941L0.93457 6.02344C0.640255 5.83044 0.502024 5.57912 0.501953 5.33398V5.03027C0.505997 4.89354 0.542223 4.76088 0.606445 4.64551C0.670593 4.53039 0.759897 4.43663 0.863281 4.37109L1.44727 4.00098L0.912109 3.5625C0.577499 3.28772 0.454259 2.9457 0.515625 2.67188V2.6709L0.584961 2.35645C0.63714 2.12824 0.817559 1.92506 1.12402 1.81055C1.43186 1.69559 1.83729 1.68655 2.23926 1.84473V1.8457L3.19434 2.22461L3.19824 2.22559C3.37976 2.29627 3.54914 2.40209 3.69727 2.53809L4.13184 2.9375L4.4541 2.44238C4.84885 1.83571 5.3772 1.34256 5.99121 1.00488C6.60505 0.667345 7.28698 0.494722 7.97656 0.5Z"
                        fill="#76C7AD"
                        stroke="white"
                      />
                    </Svg>
                    <ThemedText style={styles.categoryTabText}>Quest</ThemedText>
                  </Pressable>

                  {['Fun Facts', 'History', 'Tips!'].map((category) => (
                    <Pressable
                      key={category}
                      style={[
                        styles.categoryTab,
                        selectedCategory === category && styles.categoryTabActive,
                      ]}
                      onPress={() => setSelectedCategory(category)}
                    >
                      <ThemedText style={styles.categoryTabText}>{category}</ThemedText>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.bottomBar}>
                <Pressable
                  style={styles.imageButton}
                  onPress={() => {
                    setShowImageModal(true);
                  }}
                  disabled={isLoading}
                >
                  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M18 8C18 8.53043 17.7893 9.03914 17.4142 9.41421C17.0391 9.78929 16.5304 10 16 10C15.4696 10 14.9609 9.78929 14.5858 9.41421C14.2107 9.03914 14 8.53043 14 8C14 7.46957 14.2107 6.96086 14.5858 6.58579C14.9609 6.21071 15.4696 6 16 6C16.5304 6 17.0391 6.21071 17.4142 6.58579C17.7893 6.96086 18 7.46957 18 8Z"
                      fill="white"
                    />
                    <Path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M11.943 1.25002H12.057C14.366 1.25002 16.175 1.25002 17.587 1.44002C19.031 1.63402 20.171 2.04002 21.066 2.93402C21.961 3.82902 22.366 4.96902 22.56 6.41402C22.75 7.82502 22.75 9.63402 22.75 11.943V12.031C22.75 13.94 22.75 15.502 22.646 16.774C22.542 18.054 22.329 19.121 21.851 20.009C21.6417 20.3997 21.38 20.752 21.066 21.066C20.171 21.961 19.031 22.366 17.586 22.56C16.175 22.75 14.366 22.75 12.057 22.75H11.943C9.634 22.75 7.825 22.75 6.413 22.56C4.969 22.366 3.829 21.96 2.934 21.066C2.141 20.273 1.731 19.286 1.514 18.06C1.299 16.857 1.26 15.36 1.252 13.502C1.25067 13.0287 1.25 12.528 1.25 12V11.942C1.25 9.63302 1.25 7.82402 1.44 6.41202C1.634 4.96802 2.04 3.82802 2.934 2.93302C3.829 2.03802 4.969 1.63302 6.414 1.43902C7.825 1.24902 9.634 1.24902 11.943 1.24902M6.613 2.92502C5.335 3.09702 4.564 3.42502 3.995 3.99402C3.425 4.56402 3.098 5.33402 2.926 6.61302C2.752 7.91302 2.75 9.62102 2.75 11.999V12.843L3.751 11.967C4.19007 11.5827 4.75882 11.3796 5.34203 11.3989C5.92524 11.4182 6.47931 11.6585 6.892 12.071L11.182 16.361C11.5149 16.6939 11.9546 16.8986 12.4235 16.9392C12.8925 16.9798 13.3608 16.8537 13.746 16.583L14.044 16.373C14.5997 15.9826 15.2714 15.7922 15.9493 15.8331C16.6273 15.8739 17.2713 16.1436 17.776 16.598L20.606 19.145C20.892 18.547 21.061 17.761 21.151 16.652C21.249 15.447 21.25 13.945 21.25 11.999C21.25 9.62102 21.248 7.91302 21.074 6.61302C20.902 5.33402 20.574 4.56302 20.005 3.99302C19.435 3.42402 18.665 3.09702 17.386 2.92502C16.086 2.75102 14.378 2.74902 12 2.74902C9.622 2.74902 7.913 2.75102 6.613 2.92502Z"
                      fill="white"
                    />
                  </Svg>
                </Pressable>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter message"
                    placeholderTextColor="#94A3B8"
                    value={input}
                    onChangeText={setInput}
                    editable={!isLoading}
                    onSubmitEditing={sendMessage}
                  />
                  {input.trim() || selectedImage ? (
                    <Pressable
                      style={styles.actionButton}
                      onPress={sendMessage}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#FF7F50" size="small" />
                      ) : (
                        <Svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                          <G clipPath="url(#clip0_417_8458)">
                            <Path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M7.5 0.792969L11.854 5.14597L11.146 5.85397L8 2.70697V12H7V2.70697L3.854 5.85397L3.146 5.14597L7.5 0.792969ZM14 13V14H1V13H14Z"
                              fill="white"
                              stroke="white"
                            />
                          </G>
                          <Defs>
                            <ClipPath id="clip0_417_8458">
                              <Rect width="15" height="15" fill="white" />
                            </ClipPath>
                          </Defs>
                        </Svg>
                      )}
                    </Pressable>
                  ) : (
                    <Pressable style={styles.actionButton} onPress={() => setShowVoiceMode(true)}>
                      <Svg width="30" height="30" viewBox="0 0 30 30" fill="none">
                        <Defs>
                          <Mask
                            id="mask0_410_8325"
                            maskUnits="userSpaceOnUse"
                            x="1"
                            y="1"
                            width="28"
                            height="28"
                          >
                            <Path
                              d="M15 27.5C21.9037 27.5 27.5 21.9037 27.5 15C27.5 8.09625 21.9037 2.5 15 2.5C8.09625 2.5 2.5 8.09625 2.5 15C2.5 21.9037 8.09625 27.5 15 27.5Z"
                              fill="white"
                              stroke="white"
                              strokeWidth="2.5"
                            />
                            <Path
                              d="M18.75 11.25V18.75M22.5 13.75V16.25M11.25 11.25V18.75M7.5 13.75V16.25M15 8.75V21.25"
                              stroke="black"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                            />
                          </Mask>
                        </Defs>
                        <G mask="url(#mask0_410_8325)">
                          <Path d="M0 0H30V30H0V0Z" fill="white" />
                        </G>
                      </Svg>
                    </Pressable>
                  )}
                </View>
              </View>
            </View>

            <Modal
              visible={showImageModal}
              transparent
              animationType="slide"
              onRequestClose={() => setShowImageModal(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalBox}>
                  <Pressable style={styles.modalItem} onPress={takePhoto}>
                    <Ionicons name="camera" size={20} color="#111" />
                    <ThemedText style={styles.modalText}>Take a photo</ThemedText>
                  </Pressable>
                  <Pressable style={styles.modalItem} onPress={pickImageFromLibrary}>
                    <Ionicons name="image" size={20} color="#111" />
                    <ThemedText style={styles.modalText}>Select from album</ThemedText>
                  </Pressable>
                  <Pressable style={styles.modalCancel} onPress={() => setShowImageModal(false)}>
                    <ThemedText style={styles.modalCancelText}>Cancel</ThemedText>
                  </Pressable>
                </View>
              </View>
            </Modal>

            {showVoiceMode && (
              <VoiceModeOverlay
                onClose={async () => {
                  setIsLoading(false);

                  if (player.playing) {
                    player.pause();
                  }

                  if (recorder.isRecording) {
                    try {
                      await recorder.stop();
                    } catch (err) {
                      // Ignore
                    }
                    setIsRecording(false);
                  }

                  const savedSessionId = voiceModeSessionId;
                  setVoiceModeSessionId(null);
                  setShowVoiceMode(false);

                  if (savedSessionId) {
                    try {
                      const sessionData = await aiStationApi.getChatSession(savedSessionId);
                      if (sessionData.chats && sessionData.chats.length > 0) {
                        const messagesToAdd: Message[] = sessionData.chats.flatMap((chat) => {
                          const messages: Message[] = [];
                          if (chat.user_message) {
                            messages.push({
                              id: makeId(),
                              role: 'user',
                              text: chat.user_message,
                              timestamp: new Date(chat.created_at),
                            });
                          }
                          if (chat.ai_response) {
                            messages.push({
                              id: makeId(),
                              role: 'assistant',
                              text: chat.ai_response,
                              timestamp: new Date(chat.created_at),
                            });
                          }
                          return messages;
                        });
                        setMessages((prev) => [...prev, ...messagesToAdd]);
                      }
                    } catch (err) {
                      // Ignore
                    }
                  }
                }}
                isRecording={isRecording}
                onStartRecording={startRecording}
                onStopRecording={async () => {
                  await runSTTandTTS();
                }}
                isCaptionOn={isCaptionOn}
                onToggleCaption={() => setIsCaptionOn((prev) => !prev)}
              />
            )}
          </View>
        </LinearGradient>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}

type VoiceModeOverlayProps = {
  onClose: () => void;
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  isCaptionOn: boolean;
  onToggleCaption: () => void;
};

function VoiceModeOverlay({
  onClose,
  isRecording,
  onStartRecording,
  onStopRecording,
  isCaptionOn,
  onToggleCaption,
}: VoiceModeOverlayProps) {
  return (
    <View style={overlayStyles.overlay}>
      <Image
        source={
          isRecording ? require('@/assets/images/exist.png') : require('@/assets/images/zero.png')
        }
        style={overlayStyles.backgroundImage}
        resizeMode="cover"
      />
      <View style={overlayStyles.topHeader}>
        <Svg width="30" height="30" viewBox="0 0 30 30" fill="none">
          <Defs>
            <Mask
              id="mask0_voice_header"
              maskUnits="userSpaceOnUse"
              x="1"
              y="1"
              width="28"
              height="28"
            >
              <Path
                d="M15 27.5C21.9037 27.5 27.5 21.9037 27.5 15C27.5 8.09625 21.9037 2.5 15 2.5C8.09625 2.5 2.5 8.09625 2.5 15C2.5 21.9037 8.09625 27.5 15 27.5Z"
                fill="white"
                stroke="white"
                strokeWidth="2.5"
              />
              <Path
                d="M18.75 11.25V18.75M22.5 13.75V16.25M11.25 11.25V18.75M7.5 13.75V16.25M15 8.75V21.25"
                stroke="black"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </Mask>
          </Defs>
          <G mask="url(#mask0_voice_header)">
            <Path d="M0 0H30V30H0V0Z" fill="#FF7F50" />
          </G>
        </Svg>
        <ThemedText style={overlayStyles.voiceChatText}>Voice Chat</ThemedText>
      </View>
      <View style={overlayStyles.bottomMenu}>
        {/* 왼쪽 버튼 - CC ON/OFF */}
        <Pressable style={overlayStyles.circleButton} onPress={onToggleCaption}>
          <Svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <Defs>
              <RadialGradient
                id="paint0_left"
                cx="0"
                cy="0"
                r="1"
                gradientUnits="userSpaceOnUse"
                gradientTransform="translate(40 40) rotate(90) scale(40)"
              >
                <Stop stopColor="white" />
                <Stop offset="1" stopColor="white" stopOpacity="0.8" />
              </RadialGradient>
            </Defs>
            <Circle cx="40" cy="40" r="39.5" fill="url(#paint0_left)" stroke="white" />
          </Svg>
          <View style={overlayStyles.circleButtonIconContainer}>
            {isCaptionOn ? (
              <Svg width="35" height="35" viewBox="0 0 35 35" fill="none">
                <Rect
                  x="2"
                  y="7"
                  width="31"
                  height="21"
                  rx="3"
                  stroke="#34495E"
                  strokeWidth="2.5"
                />
                <Path
                  d="M13.5 14C13.5 13.1716 12.8284 12.5 12 12.5H9C8.17157 12.5 7.5 13.1716 7.5 14V21C7.5 21.8284 8.17157 22.5 9 22.5H12C12.8284 22.5 13.5 21.8284 13.5 21"
                  stroke="#34495E"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <Path
                  d="M27.5 14C27.5 13.1716 26.8284 12.5 26 12.5H23C22.1716 12.5 21.5 13.1716 21.5 14V21C21.5 21.8284 22.1716 22.5 23 22.5H26C26.8284 22.5 27.5 21.8284 27.5 21"
                  stroke="#34495E"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </Svg>
            ) : (
              <Svg width="35" height="35" viewBox="0 0 35 35" fill="none">
                <Rect
                  x="2"
                  y="7"
                  width="31"
                  height="21"
                  rx="3"
                  stroke="#FF7F50"
                  strokeWidth="2.5"
                />
                <Path
                  d="M13.5 14C13.5 13.1716 12.8284 12.5 12 12.5H9C8.17157 12.5 7.5 13.1716 7.5 14V21C7.5 21.8284 8.17157 22.5 9 22.5H12C12.8284 22.5 13.5 21.8284 13.5 21"
                  stroke="#FF7F50"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <Path
                  d="M27.5 14C27.5 13.1716 26.8284 12.5 26 12.5H23C22.1716 12.5 21.5 13.1716 21.5 14V21C21.5 21.8284 22.1716 22.5 23 22.5H26C26.8284 22.5 27.5 21.8284 27.5 21"
                  stroke="#FF7F50"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <Path d="M5 29L30 6" stroke="#FF7F50" strokeWidth="2.5" strokeLinecap="round" />
              </Svg>
            )}
          </View>
        </Pressable>

        {/* 중앙 버튼 - 녹음 버튼 */}
        <Pressable
          style={overlayStyles.recordButtonWrapper}
          onPress={isRecording ? onStopRecording : onStartRecording}
        >
          <View style={overlayStyles.recordButtonBorder}>
            <View style={overlayStyles.recordButtonInner}>
              {isRecording ? (
                <View style={overlayStyles.stopIcon} />
              ) : (
                <View style={overlayStyles.micIcon}>
                  <Svg width="30" height="30" viewBox="0 0 30 30" fill="none">
                    <Path
                      d="M15 18.75C17.0711 18.75 18.75 17.0711 18.75 15V8.75C18.75 6.67893 17.0711 5 15 5C12.9289 5 11.25 6.67893 11.25 8.75V15C11.25 17.0711 12.9289 18.75 15 18.75Z"
                      fill="white"
                    />
                    <Path
                      d="M23.75 15C23.75 19.8325 19.8325 23.75 15 23.75C10.1675 23.75 6.25 19.8325 6.25 15"
                      stroke="white"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <Path
                      d="M15 23.75V27.5M11.25 27.5H18.75"
                      stroke="white"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </Svg>
                </View>
              )}
            </View>
          </View>
        </Pressable>

        {/* 오른쪽 버튼 - 나가기 버튼 */}
        <Pressable style={overlayStyles.circleButton} onPress={onClose}>
          <Svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <Defs>
              <RadialGradient
                id="paint0_right"
                cx="0"
                cy="0"
                r="1"
                gradientUnits="userSpaceOnUse"
                gradientTransform="translate(40 40) rotate(90) scale(40)"
              >
                <Stop stopColor="white" />
                <Stop offset="1" stopColor="white" stopOpacity="0.8" />
              </RadialGradient>
            </Defs>
            <Circle cx="40" cy="40" r="39.5" fill="url(#paint0_right)" stroke="white" />
          </Svg>
          <View style={overlayStyles.circleButtonIconContainer}>
            <Svg width="30" height="30" viewBox="0 0 30 30" fill="none">
              <Path
                d="M22.5 7.5L7.5 22.5"
                stroke="#34495E"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <Path
                d="M7.5 7.5L22.5 22.5"
                stroke="#34495E"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </Svg>
          </View>
        </Pressable>
      </View>

      {/* 캡션 영역 */}
      {isCaptionOn && (
        <View style={overlayStyles.captionContainer}>
          <ThemedText style={overlayStyles.captionText} adjustsFontSizeToFit>
            {isRecording ? 'Listening...' : 'Tap the mic to speak'}
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const overlayStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  topHeader: {
    position: 'absolute',
    top: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  voiceChatText: {
    color: '#FF7F50',
    fontSize: 20,
    fontWeight: '600',
  },
  bottomMenu: {
    position: 'absolute',
    bottom: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  circleButton: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleButtonIconContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButtonWrapper: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20, // 살짝 위로
  },
  recordButtonBorder: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  recordButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FF7F50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF7F50',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  micIcon: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopIcon: {
    width: 24,
    height: 24,
    backgroundColor: 'white',
    borderRadius: 4,
  },
  captionContainer: {
    position: 'absolute',
    bottom: 160,
    paddingHorizontal: 20,
    alignItems: 'center',
    width: '100%',
  },
  captionText: {
    color: 'white',
    fontSize: 24,
    fontWeight: '500',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  backgroundImageStyle: {
    resizeMode: 'cover',
  },
  backgroundGradient: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  headerContainer: {
    marginBottom: 20,
    marginTop: -60,
    marginHorizontal: -20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
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
  header: {
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messages: {
    paddingVertical: 20,
    paddingBottom: 100,
    gap: 10,
  },
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
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
  bubbleWithTime: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
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
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  categoryContainer: {
    width: '100%',
    height: 70,
    maxHeight: 267,
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: '#162028',
  },
  categoryScrollContent: {
    flexDirection: 'row',
    gap: 5,
    paddingVertical: 5,
  },
  categoryTab: {
    height: 40,
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    borderRadius: 39,
    backgroundColor: '#34495E',
  },
  categoryTabActive: {
    backgroundColor: '#FF7F50',
  },
  categoryTabText: {
    color: '#FFF',
    textAlign: 'center',
    fontFamily: 'Pretendard',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 20,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 80,
    backgroundColor: '#34495E',
    paddingHorizontal: 20,
    gap: 10,
  },
  imageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#659DF2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 30,
    paddingHorizontal: 16,
    height: 40,
    gap: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#000',
  },
  actionButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FF7F50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  photoButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#64748B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#5B7DFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#64748B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#1E293B',
    borderRadius: 12,
  },
  imagePreview: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  },
  imagePreviewText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  cancelPreviewButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#64748B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelPreviewText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  sendPreviewButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#FF7F50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendPreviewButtonDisabled: {
    opacity: 0.6,
  },
  sendPreviewText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: 18,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalText: {
    marginLeft: 8,
  },
  modalCancel: {
    alignItems: 'center',
    marginTop: 8,
  },
  modalCancelText: {
    color: '#777',
  },
});

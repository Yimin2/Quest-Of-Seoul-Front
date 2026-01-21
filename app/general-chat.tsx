import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  useAudioPlayer,
  useAudioRecorder,
} from 'expo-audio';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
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

import { aiStationApi } from '@/services/api';
import { ThemedText } from '@shared/ui';

const API_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  (Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000');
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

export default function GeneralChatScreen() {
  const router = useRouter();
  const { init } = useLocalSearchParams();
  const scrollRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: makeId(),
      role: 'assistant',
      text: "Hello! Ask me anything about Seoul's attractions. 🏛️",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showVoiceMode, setShowVoiceMode] = useState(false);

  // Audio Hooks
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const player = useAudioPlayer(null);

  const [isRecording, setIsRecording] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [voiceModeSessionId, setVoiceModeSessionId] = useState<string | undefined>(undefined);
  const [isCaptionOn, setIsCaptionOn] = useState(true);

  // Monitor playback status to clean up temp files
  useEffect(() => {
    const listener = (status: any) => {
      // status.didJustFinish is true when playback ends
      if (status.isLoaded && status.didJustFinish) {
        // Optional: Perform any cleanup if we tracked the current file URI
      }
    };
    player.addListener('playbackStatusUpdate', listener);
    return () => {
      // removeListener is not always exposed on the object or might be named differently
      // shared object usually has removeAllListeners or similar, checking API types...
      // AudioPlayer extends SharedObject<AudioEvents>.
      // SharedObject has no removeListener? It usually returns a subscription.
      // Re-checking types: player.addListener returns void in the d.ts I saw?
      // Wait, SharedObject<T> usually implies EventEmitter style.
      // Let's assume for now we don't strictly need to remove it if the component unmounts involves cleaning up the player itself.
    };
  }, [player]);

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const addMessage = (msg: Message) => {
    setMessages((prev) => [...prev, msg]);
  };

  useEffect(() => {
    if (init) {
      const text = Array.isArray(init) ? init[0] : init;
      addMessage({ id: makeId(), role: 'user', text, timestamp: new Date() });
      sendMessageFromInit(text);
    }
  }, [init]);

  const sendMessageFromInit = async (text: string) => {
    setIsLoading(true);
    try {
      const data = await aiStationApi.exploreRAGChat({
        user_message: text,
        language: 'en',
        prefer_url: false,
        chat_session_id: sessionId,
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
    } catch (err) {
      addMessage({
        id: makeId(),
        role: 'assistant',
        text: 'An error occurred!',
        timestamp: new Date(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    const userMessage: Message = {
      id: makeId(),
      role: 'user',
      text: userText,
      timestamp: new Date(),
    };
    addMessage(userMessage);
    setInput('');
    setIsLoading(true);

    try {
      const data = await aiStationApi.exploreRAGChat({
        user_message: userText,
        language: 'en',
        prefer_url: true,
        chat_session_id: sessionId,
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
    } catch (error) {
      addMessage({
        id: makeId(),
        role: 'assistant',
        text: 'Sorry, an error occurred while fetching the response.',
        timestamp: new Date(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exitToPrevious = () => {
    router.back();
  };

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

      // With expo-audio hooks, we just call record().
      // The recorder is already prepared by the hook with presets.
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
      // Create a temp file
      const fileUri = `${FileSystem.cacheDirectory}tts_${Date.now()}.mp3`;
      await FileSystem.writeAsStringAsync(fileUri, audioBase64, {
        encoding: 'base64',
      });

      // Replace source and play
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
          text: 'Voice recognition failed. Please try speaking again.',
          timestamp: new Date(),
        };
        if (!showVoiceMode) {
          addMessage(errorMsg);
        }
        return;
      }

      if (data.transcribed_text.trim().length <= 2) {
        const errorMsg: Message = {
          id: makeId(),
          role: 'assistant',
          text: 'The voice input was too short. Please speak longer.',
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

      if (showVoiceMode) {
        Alert.alert('Voice Recognition Failed', errorMessage);
      } else {
        const errorMsg: Message = {
          id: makeId(),
          role: 'assistant',
          text: errorMessage,
          timestamp: new Date(),
        };
        addMessage(errorMsg);
      }
    }
  };

  const sendMessageFromSTTForVoiceMode = async (text: string) => {
    setIsLoading(true);
    try {
      const data = await aiStationApi.exploreRAGChat({
        user_message: text,
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
      const data = await aiStationApi.exploreRAGChat({
        user_message: text,
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: '#8FB6F1' }}
    >
      <View style={styles.container}>
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

        <View style={styles.header}>
          <Pressable onPress={exitToPrevious} style={styles.menuButton}>
            <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <Path
                d="M3.33334 15C3.09723 15 2.89945 14.92 2.74 14.76C2.58056 14.6 2.50056 14.4022 2.5 14.1667C2.49945 13.9311 2.57945 13.7333 2.74 13.5733C2.90056 13.4133 3.09834 13.3333 3.33334 13.3333H16.6667C16.9028 13.3333 17.1008 13.4133 17.2608 13.5733C17.4208 13.7333 17.5006 13.9311 17.5 14.1667C17.4994 14.4022 17.4194 14.6003 17.26 14.7608C17.1006 14.9214 16.9028 15.0011 16.6667 15H3.33334ZM3.33334 10.8333C3.09723 10.8333 2.89945 10.7533 2.74 10.5933C2.58056 10.4333 2.50056 10.2356 2.5 10C2.49945 9.76444 2.57945 9.56667 2.74 9.40667C2.90056 9.24667 3.09834 9.16667 3.33334 9.16667H16.6667C16.9028 9.16667 17.1008 9.24667 17.2608 9.40667C17.4208 9.56667 17.5006 9.76444 17.5 10C17.4994 10.2356 17.4194 10.4336 17.26 10.5942C17.1006 10.7547 16.9028 10.8344 16.6667 10.8333H3.33334ZM3.33334 6.66667C3.09723 6.66667 2.89945 6.58667 2.74 6.42667C2.58056 6.26667 2.50056 6.06889 2.5 5.83333C2.49945 5.59778 2.57945 5.4 2.74 5.24C2.90056 5.08 3.09834 5 3.33334 5H16.6667C16.9028 5 17.1008 5.08 17.2608 5.24C17.4208 5.4 17.5006 5.59778 17.5 5.83333C17.4994 6.06889 17.4194 6.26694 17.26 6.4275C17.1006 6.58806 16.9028 6.66778 16.6667 6.66667H3.33334Z"
                fill="white"
              />
            </Svg>
          </Pressable>
          <ThemedText style={styles.headerTitle}>AI Chat</ThemedText>
          <Pressable onPress={exitToPrevious} style={styles.closeButton}>
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
                  <ThemedText style={styles.timestamp}>{formatTimestamp(msg.timestamp)}</ThemedText>
                  <View style={styles.userBubble}>
                    <ThemedText style={styles.userText}>{msg.text}</ThemedText>
                  </View>
                </View>
              )}
            </View>
          ))}
        </ScrollView>

        <View style={styles.bottomSection}>
          <View style={styles.bottomBar}>
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
              {input.trim() ? (
                <Pressable style={styles.actionButton} onPress={sendMessage} disabled={isLoading}>
                  {isLoading ? (
                    <ActivityIndicator color="#FF7F50" size="small" />
                  ) : (
                    <Svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                      <G clipPath="url(#clip0_send)">
                        <Path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M7.5 0.792969L11.854 5.14597L11.146 5.85397L8 2.70697V12H7V2.70697L3.854 5.85397L3.146 5.14597L7.5 0.792969ZM14 13V14H1V13H14Z"
                          fill="white"
                          stroke="white"
                        />
                      </G>
                      <Defs>
                        <ClipPath id="clip0_send">
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
                        id="mask0_voice"
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
                    <G mask="url(#mask0_voice)">
                      <Path d="M0 0H30V30H0V0Z" fill="white" />
                    </G>
                  </Svg>
                </Pressable>
              )}
            </View>
          </View>
        </View>

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
              setVoiceModeSessionId(undefined);
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
              </Svg>
            )}
            <ThemedText
              style={[overlayStyles.buttonLabel, !isCaptionOn && overlayStyles.buttonLabelOff]}
            >
              {isCaptionOn ? 'ON' : 'OFF'}
            </ThemedText>
          </View>
        </Pressable>

        {/* 가운데 버튼 - 마이크 ON/OFF */}
        <Pressable
          style={overlayStyles.circleButton}
          onPress={async () => {
            if (!isRecording) {
              await onStartRecording();
            } else {
              await onStopRecording();
            }
          }}
        >
          <Svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <Defs>
              <RadialGradient
                id="paint0_center"
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
            <Circle cx="40" cy="40" r="39.5" fill="url(#paint0_center)" stroke="white" />
          </Svg>
          <View style={overlayStyles.circleButtonIconContainer}>
            {isRecording ? (
              <Svg width="30" height="31" viewBox="0 0 30 31" fill="none">
                <Path
                  d="M3.64575 13.8543C3.64575 19.8947 8.54284 24.7918 14.5833 24.7918M14.5833 24.7918C15.8615 24.7918 17.0887 24.5731 18.2291 24.1699M14.5833 24.7918V29.1668M25.5208 13.8543C25.5228 15.3599 25.2129 16.8495 24.6108 18.2293M27.7083 27.7085L1.45825 1.4585"
                  stroke="#FF7F50"
                  strokeWidth="2.91667"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            ) : (
              <Svg width="35" height="35" viewBox="0 0 35 35" fill="none">
                <Path
                  d="M22.6041 8.02067C22.6041 5.20172 20.3189 2.9165 17.4999 2.9165C14.681 2.9165 12.3958 5.20172 12.3958 8.02067V17.4998C12.3958 20.3188 14.681 22.604 17.4999 22.604C20.3189 22.604 22.6041 20.3188 22.6041 17.4998V8.02067Z"
                  stroke="#34495E"
                  strokeWidth="3"
                  strokeLinejoin="round"
                />
                <Path
                  d="M6.5625 16.7705C6.5625 22.8109 11.4596 27.708 17.5 27.708M17.5 27.708C23.5404 27.708 28.4375 22.8109 28.4375 16.7705M17.5 27.708V32.083"
                  stroke="#34495E"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            )}
            <ThemedText
              style={[overlayStyles.buttonLabel, isRecording && overlayStyles.buttonLabelOff]}
            >
              {isRecording ? 'OFF' : 'ON'}
            </ThemedText>
          </View>
        </Pressable>

        {/* 오른쪽 버튼 - 닫기 */}
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
            <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <Path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M2.43855 0.401017C2.16912 0.140791 1.80826 -0.00320088 1.43369 5.40037e-05C1.05912 0.00330889 0.700819 0.15355 0.43595 0.418419C0.171081 0.683288 0.0208399 1.04159 0.017585 1.41616C0.0143301 1.79072 0.158322 2.15159 0.418548 2.42102L7.97998 9.98245L0.418548 17.5439C0.282105 17.6757 0.173273 17.8333 0.098403 18.0076C0.023533 18.1819 -0.0158759 18.3693 -0.0175242 18.559C-0.0191725 18.7487 0.0169728 18.9368 0.0888026 19.1124C0.160632 19.2879 0.266708 19.4474 0.400841 19.5816C0.534973 19.7157 0.694476 19.8218 0.870042 19.8936C1.04561 19.9654 1.23372 20.0016 1.42341 19.9999C1.61309 19.9983 1.80055 19.9589 1.97484 19.884C2.14913 19.8092 2.30677 19.7003 2.43855 19.5639L9.99998 12.0024L17.5614 19.5639C17.8308 19.8241 18.1917 19.9681 18.5663 19.9648C18.9408 19.9616 19.2991 19.8113 19.564 19.5465C19.8289 19.2816 19.9791 18.9233 19.9824 18.5487C19.9856 18.1742 19.8416 17.8133 19.5814 17.5439L12.02 9.98245L19.5814 2.42102C19.8416 2.15159 19.9856 1.79072 19.9824 1.41616C19.9791 1.04159 19.8289 0.683288 19.564 0.418419C19.2991 0.15355 18.9408 0.00330889 18.5663 5.40037e-05C18.1917 -0.00320088 17.8308 0.140791 17.5614 0.401017L9.99998 7.96245L2.43855 0.401017Z"
                fill="#34495E"
              />
            </Svg>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const overlayStyles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  topHeader: {
    position: 'absolute',
    top: 80,
    alignItems: 'center',
  },
  voiceChatText: {
    color: '#FF7F50',
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
  bottomMenu: {
    position: 'absolute',
    bottom: 80,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 20,
  },
  circleButton: {
    alignItems: 'center',
  },
  circleButtonIconContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonLabel: {
    marginTop: 2,
    color: '#34495E',
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '700',
  },
  buttonLabelOff: {
    color: '#FF7F50',
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  messages: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    paddingBottom: 100,
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
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
    backgroundColor: '#34495E',
    paddingHorizontal: 20,
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
});

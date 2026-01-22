import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Images } from '@shared/config';
import { ThemedText, ThemedView } from '@shared/ui';

export default function ChatModeScreen() {
  const router = useRouter();

  const goBack = () => router.back();
  const goToQuiz = () => router.push('/(app)/(ai-flow)/quiz/mode');
  const goToChat = () => router.push('/(app)/(ai-flow)/chat/plan-chat');

  return (
    <ThemedView style={styles.container}>
      <Pressable style={styles.backButton} onPress={goBack}>
        <Ionicons name="chevron-back" size={28} color="#fff" />
      </Pressable>

      <Ionicons name="chatbubble-ellipses" size={42} color="#fff" style={styles.headerIcon} />
      <ThemedText type="title" style={styles.title}>
        Welcome to ChatMode
      </ThemedText>
      <ThemedText style={styles.subtitle}>What do you want?</ThemedText>

      <View style={styles.buttonWrapper}>
        <Pressable style={styles.modeButton} onPress={goToQuiz}>
          <ThemedText style={styles.buttonText}>Quiz</ThemedText>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </Pressable>
        <Pressable style={styles.modeButton} onPress={goToChat}>
          <ThemedText style={styles.buttonText}>Chat</ThemedText>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </Pressable>
      </View>

      <View style={styles.circleButtonRow}>
        <Pressable style={styles.circleButton} onPress={goToChat}>
          <Ionicons name="chatbubble-ellipses" size={28} color="#fff" />
        </Pressable>
      </View>

      <Image source={Images.docentTiger} style={styles.character} resizeMode="contain" />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  headerIcon: {
    marginTop: 20,
  },
  title: {
    marginTop: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: 32,
    textAlign: 'center',
    opacity: 0.8,
  },
  buttonWrapper: {
    width: '100%',
    gap: 12,
    marginBottom: 32,
  },
  modeButton: {
    backgroundColor: '#5B7DFF',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  circleButtonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  circleButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#76A7FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  character: {
    width: 240,
    height: 240,
    position: 'absolute',
    bottom: 30,
  },
});

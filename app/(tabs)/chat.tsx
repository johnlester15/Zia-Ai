import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, View, Text, TextInput, FlatList, TouchableOpacity, 
  KeyboardAvoidingView, Platform, useWindowDimensions, Animated, 
  SafeAreaView, Alert, Pressable 
} from 'react-native';
import { useRouter } from 'expo-router'; // Import the router for navigation
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function ChatScreen() {
  const { width } = useWindowDimensions();
  const router = useRouter(); // Initialize router
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  
  const typingOpacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (isTyping) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(typingOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(typingOpacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [isTyping]);

  const isLargeScreen = width > 768;
  const API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3000/chat' : 'http://localhost:3000/chat';

  const suggestions = [
    "Run diagnostics on Nexus Core",
    "Who is the lead architect?",
    "Explain neural synchronization",
  ];

  const sendMessage = async (textOverride?: string) => {
    const messageContent = textOverride || input;
    if (!messageContent.trim()) return;

    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const userMsg: Message = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: messageContent,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });

      if (!response.ok) throw new Error();

      const data = await response.json();
      
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      Alert.alert("Link Failure", "The Nexus link was severed. Is the server online?");
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#04080F', '#09121A']} style={StyleSheet.absoluteFill} />

      {/* --- ENHANCED HEADER WITH BACK BUTTON --- */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#00D2FF" />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>SECURE LINK ACTIVE</Text>
          </View>
          <Text style={styles.headerTitle}>NEXUS <Text style={{color: '#00D2FF'}}>CORE</Text></Text>
        </View>

        <TouchableOpacity style={styles.headerIcon}>
          <Ionicons name="options-outline" size={20} color="rgba(255,255,255,0.4)" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={[styles.chatWrapper, isLargeScreen && { maxWidth: 1000, alignSelf: 'center', width: '100%' }]}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.logoFrame}>
                <Ionicons name="pulse" size={30} color="#00D2FF" />
              </View>
              <Text style={styles.welcomeTitle}>System Initialized</Text>
              <Text style={styles.creatorTag}>Lead Architect: John Lester D. Defensor</Text>
              
              <View style={styles.suggestionGrid}>
                {suggestions.map((s, i) => (
                  <TouchableOpacity key={i} style={styles.chip} onPress={() => sendMessage(s)}>
                    <Text style={styles.chipText}>{'>'} {s}</Text>
                    <Ionicons name="arrow-forward" size={12} color="rgba(0, 210, 255, 0.4)" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.messageRow, item.role === 'user' ? styles.userRow : styles.botRow]}>
              <View style={[
                styles.bubble, 
                item.role === 'user' ? styles.userBubble : styles.botBubble
              ]}>
                <Text style={styles.messageText}>{item.content}</Text>
                <View style={styles.bubbleFooter}>
                  <Text style={styles.timestamp}>{item.timestamp}</Text>
                  {item.role === 'assistant' && <Ionicons name="checkmark-done" size={12} color="#00D2FF" style={{marginLeft: 5}} />}
                </View>
              </View>
            </View>
          )}
          ListFooterComponent={isTyping ? (
            <Animated.View style={[styles.typingContainer, { opacity: typingOpacity }]}>
              <Text style={styles.typingText}>NEXUS IS COMPUTING...</Text>
            </Animated.View>
          ) : <View style={{ height: 20 }} />}
        />

        {/* --- INPUT DOCK --- */}
        <View style={styles.inputDock}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Inject command..."
              placeholderTextColor="rgba(0, 210, 255, 0.2)"
              multiline
            />
            <TouchableOpacity 
              style={[styles.sendButton, !input.trim() && { opacity: 0.3 }]} 
              onPress={() => sendMessage()}
              disabled={!input.trim()}
            >
              <LinearGradient colors={['#00D2FF', '#0052D4']} style={styles.sendGradient}>
                <Ionicons name="flash" size={16} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView> 
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#04080F' },
  // Header Adjustments
  header: {
    height: 80, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(0, 210, 255, 0.1)',
    backgroundColor: 'rgba(4, 8, 15, 0.98)',
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitleContainer: { alignItems: 'center', flex: 1 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  statusDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#00FF41', marginRight: 6 },
  statusText: { color: 'rgba(255,255,255,0.4)', fontSize: 7, fontFamily: 'Montserrat_700Bold', letterSpacing: 1.5 },
  headerTitle: { fontFamily: 'Montserrat_700Bold', color: '#FFF', fontSize: 16, letterSpacing: 2 },
  headerIcon: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },

  chatWrapper: { flex: 1 },
  listContent: { padding: 20, paddingBottom: 30 },
  
  // Empty State
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  logoFrame: { 
    width: 60, height: 60, borderRadius: 18, backgroundColor: 'rgba(0, 210, 255, 0.05)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(0, 210, 255, 0.3)'
  },
  welcomeTitle: { fontFamily: 'Montserrat_700Bold', color: '#FFF', fontSize: 24 },
  creatorTag: { fontFamily: 'Montserrat_400Regular', color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 8, marginBottom: 40 },
  suggestionGrid: { width: '100%', gap: 12 },
  chip: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: 18, borderRadius: 16, 
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.06)' 
  },
  chipText: { color: '#E0E0E0', fontFamily: 'Montserrat_600SemiBold', fontSize: 13 },

  // Messages
  messageRow: { marginBottom: 20, flexDirection: 'row' },
  userRow: { justifyContent: 'flex-end' },
  botRow: { justifyContent: 'flex-start' },
  bubble: { padding: 16, borderRadius: 22, maxWidth: '85%' },
  userBubble: { backgroundColor: '#0052D4', borderBottomRightRadius: 4 },
  botBubble: { backgroundColor: 'rgba(255,255,255,0.05)', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: 'rgba(0, 210, 255, 0.1)' },
  messageText: { color: '#FFF', fontFamily: 'Montserrat_400Regular', fontSize: 15, lineHeight: 22 },
  bubbleFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 8 },
  timestamp: { color: 'rgba(255,255,255,0.3)', fontSize: 9 },
  
  // Typing
  typingContainer: { paddingLeft: 10, marginBottom: 20 },
  typingText: { color: '#00D2FF', fontFamily: 'Montserrat_700Bold', fontSize: 10, letterSpacing: 2 },

  // Input
  inputDock: { padding: 20, backgroundColor: 'transparent' },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#0D161F',
    borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10,
    borderWidth: 1, borderColor: 'rgba(0, 210, 255, 0.2)',
  },
  input: { flex: 1, color: '#FFF', fontFamily: 'Montserrat_400Regular', fontSize: 15, maxHeight: 100 },
  sendButton: { marginLeft: 10 },
  sendGradient: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
});
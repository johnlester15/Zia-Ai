import React, { useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Pressable, 
  useWindowDimensions, 
  ScrollView, 
  Platform, 
  SafeAreaView, 
  Linking, 
  Dimensions, 
  Animated, 
  Easing 
} from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  useFonts, 
  Montserrat_400Regular, 
  Montserrat_600SemiBold, 
  Montserrat_700Bold 
} from '@expo-google-fonts/montserrat';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// --- PARTICLE COMPONENT (High Speed + Magnetic) ---
const PARTICLE_COUNT = 20;
const FloatingParticle = ({ mousePos }: { mousePos: Animated.ValueXY }) => {
  const moveAnim = useRef(new Animated.Value(0)).current;
  const startX = Math.random() * SCREEN_WIDTH;
  const startY = Math.random() * SCREEN_HEIGHT;
  const driftX = (Math.random() - 0.5) * 100;
  const driftY = (Math.random() - 0.5) * 100;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(moveAnim, {
          toValue: 1,
          duration: 1200 + Math.random() * 1500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(moveAnim, {
          toValue: 0,
          duration: 1200 + Math.random() * 1500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const translateX = moveAnim.interpolate({ inputRange: [0, 1], outputRange: [0, driftX] });
  const translateY = moveAnim.interpolate({ inputRange: [0, 1], outputRange: [0, driftY] });
  const opacity = moveAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.1, 0.6, 0.1] });

  // Magnetic logic
  const magneticX = mousePos.x.interpolate({ inputRange: [0, SCREEN_WIDTH], outputRange: [-40, 40] });
  const magneticY = mousePos.y.interpolate({ inputRange: [0, SCREEN_HEIGHT], outputRange: [-40, 40] });

  return (
    <Animated.View 
      style={[
        styles.particle, 
        { 
          left: startX, top: startY, opacity, 
          transform: [{ translateX }, { translateY }, { translateX: magneticX }, { translateY: magneticY }] 
        }
      ]} 
    />
  );
};

export default function LandingScreen() {
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;
  const contentWidth = isLargeScreen ? 1000 : width * 0.92;

  // --- ANIMATION REFS ---
  const breathAnim = useRef(new Animated.Value(0)).current;
  const mousePos = useRef(new Animated.ValueXY({ x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 2 })).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathAnim, { toValue: 1, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(breathAnim, { toValue: 0, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handlePointerMove = (e: any) => {
    const { pageX, pageY } = Platform.OS === 'web' ? e.nativeEvent : e.nativeEvent.touches[0];
    Animated.spring(mousePos, { toValue: { x: pageX, y: pageY }, friction: 7, tension: 40, useNativeDriver: true }).start();
  };

  // Interpolations for background and 3D Tilt
  const orbScale = breathAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2] });
  const orbOpacity = breathAnim.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0.22] });
  const orbMoveX = mousePos.x.interpolate({ inputRange: [0, SCREEN_WIDTH], outputRange: [-40, 40] });
  const orbMoveY = mousePos.y.interpolate({ inputRange: [0, SCREEN_HEIGHT], outputRange: [-40, 40] });
  const rotateX = mousePos.y.interpolate({ inputRange: [0, SCREEN_HEIGHT], outputRange: ['8deg', '-8deg'] });
  const rotateY = mousePos.x.interpolate({ inputRange: [0, SCREEN_WIDTH], outputRange: ['-8deg', '8deg'] });

  let [fontsLoaded] = useFonts({ Montserrat_400Regular, Montserrat_600SemiBold, Montserrat_700Bold });
  if (!fontsLoaded) return null;

  const handleContactSupport = () => Linking.openURL('https://www.facebook.com/johnlester.defensor.56');

  return (
    <View 
      style={styles.container}
      {...(Platform.OS === 'web' ? { onPointerMove: handlePointerMove } : { onTouchMove: handlePointerMove })}
    >
      <LinearGradient colors={['#010405', '#050f14', '#081419']} style={StyleSheet.absoluteFill} />

      {/* AMBIENT ANIMATION LAYER */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Animated.View style={[styles.glowOrb, { 
          top: -100, right: -100, backgroundColor: '#00D2FF', width: 500, height: 500, borderRadius: 250,
          opacity: orbOpacity, transform: [{ scale: orbScale }, { translateX: orbMoveX }, { translateY: orbMoveY }] 
        }]} />
        <Animated.View style={[styles.glowOrb, { 
          bottom: -150, left: -150, backgroundColor: '#3a7bd5', width: 600, height: 600, borderRadius: 300,
          opacity: orbOpacity, transform: [{ scale: orbScale }, { translateX: orbMoveX }, { translateY: orbMoveY }] 
        }]} />
        {[...Array(PARTICLE_COUNT)].map((_, i) => <FloatingParticle key={i} mousePos={mousePos} />)}
      </View>

      <View style={styles.gridOverlay} pointerEvents="none" />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={[styles.headerInner, { maxWidth: 1100 }]}>
          <Text style={styles.logoText}>NEXUS<Text style={{color: '#00D2FF'}}>AI</Text></Text>
          {isLargeScreen && (
            <View style={styles.navLinks}>
              <Text style={styles.navLink}>System</Text>
              <Text style={styles.navLink}>Protocol</Text>
              <Pressable onPress={handleContactSupport}><Text style={styles.navLink}>Architect</Text></Pressable>
            </View>
          )}
        </View>
      </View>

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={[styles.innerWrapper, { maxWidth: 1200 }]}>
            
            {/* HERO SECTION */}
            <View style={[styles.heroContainer, isLargeScreen && styles.heroLarge]}>
              <View style={styles.badgeRow}>
                <View style={styles.badge}><Text style={styles.badgeText}>v1.0 ENGINE LIVE</Text></View>
                <View style={[styles.badge, styles.freeBadge]}><Text style={styles.freeBadgeText}>OPEN ACCESS</Text></View>
              </View>
              
              <Animated.View style={{ transform: [{ perspective: 1000 }, { rotateX }, { rotateY }] }}>
                <Text style={[styles.title, isLargeScreen && styles.titleLarge]}>
                  Human Intuition.{'\n'}
                  <Text style={{ color: '#00D2FF' }}>Machine Precision.</Text>
                </Text>
              </Animated.View>
              
              <Text style={[styles.tagline, isLargeScreen && styles.taglineLarge]}>
                The bridge between thought and execution. Architected by {' '}
                <Text style={styles.architectHighlight}>John Lester D. Defensor</Text>.
              </Text>

              <View style={[styles.ctaWrapper, isLargeScreen && styles.ctaWebRow]}>
                <Link href="/chat" asChild>
                  <Pressable style={styles.mainButton}>
                    <LinearGradient colors={['#00D2FF', '#3a7bd5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.buttonGradient}>
                      <Text style={styles.buttonText}>Launch Interface</Text>
                      <Ionicons name="flash" size={20} color="white" />
                    </LinearGradient>
                  </Pressable>
                </Link>
                <Text style={styles.freeSubtext}>Decentralized. Secure. Always Free.</Text>
              </View>
            </View>

            {/* QUICK STATS */}
            <View style={[styles.statsRow, { width: contentWidth }]}>
              <StatItem label="Latency" value="< 80ms" />
              <View style={styles.statDivider} />
              <StatItem label="Architecture" value="Neural 2.0" />
              <View style={styles.statDivider} />
              <StatItem label="Security" value="E2EE" />
            </View>

            {/* SYSTEM WORKFLOW (PRESERVED) */}
            <View style={[styles.section, { width: contentWidth }]}>
              <Text style={styles.sectionTitle}>System Workflow</Text>
              <View style={[styles.gridRow, !isLargeScreen && { flexDirection: 'column' }]}>
                <Step num="01" title="Natural Input" text="Processing human intent through advanced semantic logic." />
                <Step num="02" title="Core Analysis" text="Nexus identifies patterns and context in milliseconds." />
                <Step num="03" title="Neural Output" text="Generating high-precision, actionable intelligence." />
              </View>
            </View>

            {/* ROADMAP & FAQ (PRESERVED) */}
            <View style={[styles.dualSection, { width: contentWidth, flexDirection: isLargeScreen ? 'row' : 'column' }]}>
              <View style={[styles.flexOne, { marginRight: isLargeScreen ? 30 : 0 }]}>
                <Text style={styles.leftTitle}>Development Roadmap</Text>
                <View style={styles.roadmapCard}>
                  <RoadmapItem phase="P1" title="Core Engine" desc="Text logic & history sync." active />
                  <RoadmapItem phase="P2" title="Vision Link" desc="Image & document synthesis." />
                </View>
              </View>

              <View style={[styles.flexOne, !isLargeScreen && { marginTop: 40 }]}>
                <Text style={styles.leftTitle}>Technical FAQ</Text>
                <View style={styles.glassCard}>
                  <FAQItem q="Is it secure?" a="Your data is encrypted locally and never stored on central servers." />
                  <FAQItem q="API Access?" a="Public API endpoints are scheduled for the Phase 3 rollout." />
                </View>
              </View>
            </View>

            {/* CONTACT */}
            <Pressable onPress={handleContactSupport} style={styles.supportBtn}>
              <LinearGradient colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']} style={styles.supportGradient}>
                <Ionicons name="logo-facebook" size={18} color="#00D2FF" />
                <Text style={styles.supportBtnText}>Connect with the Architect</Text>
                <Ionicons name="chevron-forward" size={16} color="#00D2FF" />
              </LinearGradient>
            </Pressable>

            {/* FOOTER */}
            <View style={styles.footer}>
              <Text style={styles.footerBrand}>NEXUS_CORE v1.0.4</Text>
              <Text style={styles.footerCredits}>John Lester D. Defensor • 2026</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// Sub-components
const StatItem = ({ label, value }: any) => (
  <View style={styles.statItem}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);
const Step = ({ num, title, text }: any) => (
  <View style={styles.gridItem}>
    <Text style={styles.stepNum}>{num}</Text>
    <Text style={styles.stepTitle}>{title}</Text>
    <Text style={styles.stepText}>{text}</Text>
  </View>
);
const RoadmapItem = ({ phase, title, desc, active }: any) => (
  <View style={styles.roadmapItem}>
    <View style={[styles.roadmapDot, active && {backgroundColor: '#00D2FF', shadowColor: '#00D2FF', shadowRadius: 10, shadowOpacity: 0.5}]} />
    <View style={{flex: 1}}>
      <Text style={styles.roadmapPhase}>{phase} — {title}</Text>
      <Text style={styles.roadmapDesc}>{desc}</Text>
    </View>
  </View>
);
const FAQItem = ({ q, a }: any) => (
  <View style={styles.faqItem}>
    <Text style={styles.faqQ}>{q}</Text>
    <Text style={styles.faqA}>{a}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#010405' },
  glowOrb: { position: 'absolute', filter: Platform.OS === 'web' ? 'blur(110px)' : undefined },
  particle: { position: 'absolute', width: 4, height: 4, borderRadius: 2, backgroundColor: '#00D2FF', shadowColor: '#00D2FF', shadowRadius: 8, shadowOpacity: 1 },
  gridOverlay: { ...StyleSheet.absoluteFillObject, opacity: 0.03, ...(Platform.OS === 'web' ? { backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)`, backgroundSize: '40px 40px' } : {}) },
  header: { height: 80, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  headerInner: { width: '90%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logoText: { color: 'white', fontFamily: 'Montserrat_700Bold', fontSize: 20, letterSpacing: 4 },
  navLinks: { flexDirection: 'row', gap: 30 },
  navLink: { color: 'rgba(255,255,255,0.4)', fontFamily: 'Montserrat_600SemiBold', fontSize: 13, textTransform: 'uppercase' },
  scrollContent: { paddingVertical: 40, alignItems: 'center' },
  innerWrapper: { width: '100%', paddingHorizontal: 24, alignItems: 'center' },
  heroContainer: { alignItems: 'center', marginBottom: 60 },
  heroLarge: { marginBottom: 100, marginTop: 40 },
  badgeRow: { flexDirection: 'row', gap: 10, marginBottom: 25 },
  badge: { backgroundColor: 'rgba(0, 210, 255, 0.05)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(0,210,255,0.2)' },
  freeBadge: { borderColor: 'rgba(0, 255, 65, 0.3)', backgroundColor: 'rgba(0, 255, 65, 0.03)' },
  badgeText: { color: '#00D2FF', fontSize: 9, fontFamily: 'Montserrat_700Bold' },
  freeBadgeText: { color: '#00FF41', fontSize: 9, fontFamily: 'Montserrat_700Bold' },
  title: { fontFamily: 'Montserrat_700Bold', fontSize: 44, color: '#FFF', textAlign: 'center', lineHeight: 54 },
  titleLarge: { fontSize: 88, lineHeight: 96, letterSpacing: -3 },
  tagline: { fontFamily: 'Montserrat_400Regular', fontSize: 16, color: 'rgba(255,255,255,0.4)', marginTop: 25, textAlign: 'center', lineHeight: 28, maxWidth: 600 },
  taglineLarge: { fontSize: 22 },
  architectHighlight: { color: '#FFF', fontFamily: 'Montserrat_700Bold' },
  ctaWrapper: { marginTop: 40, alignItems: 'center' },
  ctaWebRow: { flexDirection: 'column', gap: 15 },
  mainButton: { width: '100%', minWidth: 280, maxWidth: 340 },
  buttonGradient: { flexDirection: 'row', height: 65, borderRadius: 12, justifyContent: 'center', alignItems: 'center', gap: 12 },
  buttonText: { fontFamily: 'Montserrat_700Bold', color: '#FFF', fontSize: 18 },
  freeSubtext: { color: 'rgba(255,255,255,0.2)', fontSize: 11, marginTop: 12, textTransform: 'uppercase', letterSpacing: 1 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 60, paddingVertical: 35, backgroundColor: 'rgba(255,255,255,0.01)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  statItem: { alignItems: 'center' },
  statValue: { color: '#FFF', fontFamily: 'Montserrat_700Bold', fontSize: 24 },
  statLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 10, textTransform: 'uppercase', marginTop: 8 },
  statDivider: { width: 1, height: '40%', backgroundColor: 'rgba(255,255,255,0.08)', alignSelf: 'center' },
  section: { marginBottom: 100 },
  sectionTitle: { fontFamily: 'Montserrat_700Bold', color: '#FFF', fontSize: 32, textAlign: 'center', marginBottom: 50 },
  gridRow: { flexDirection: 'row', gap: 20 },
  gridItem: { flex: 1, backgroundColor: 'rgba(255,255,255,0.02)', padding: 30, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  stepNum: { color: '#00D2FF', fontFamily: 'Montserrat_700Bold', fontSize: 12, marginBottom: 15 },
  stepTitle: { color: 'white', fontFamily: 'Montserrat_700Bold', fontSize: 20, marginBottom: 10 },
  stepText: { color: 'rgba(255,255,255,0.4)', fontSize: 14, lineHeight: 22 },
  dualSection: { marginBottom: 100 },
  flexOne: { flex: 1 },
  leftTitle: { fontFamily: 'Montserrat_700Bold', color: '#FFF', fontSize: 24, marginBottom: 30 },
  glassCard: { backgroundColor: 'rgba(255,255,255,0.015)', padding: 25, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  roadmapCard: { gap: 20 },
  roadmapItem: { flexDirection: 'row', gap: 15 },
  roadmapDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.1)', marginTop: 6 },
  roadmapPhase: { color: 'white', fontFamily: 'Montserrat_700Bold', fontSize: 15 },
  roadmapDesc: { color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 4 },
  faqItem: { marginBottom: 20 },
  faqQ: { color: 'white', fontFamily: 'Montserrat_600SemiBold', fontSize: 15, marginBottom: 5 },
  faqA: { color: 'rgba(255,255,255,0.4)', fontSize: 13, lineHeight: 20 },
  supportBtn: { width: '100%', maxWidth: 450, marginBottom: 80, borderRadius: 16, overflow: 'hidden' },
  supportGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 15, paddingVertical: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 16 },
  supportBtnText: { color: '#FFF', fontFamily: 'Montserrat_600SemiBold', fontSize: 15 },
  footer: { alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 50, width: '100%' },
  footerBrand: { color: 'rgba(255,255,255,0.5)', fontFamily: 'Montserrat_700Bold', fontSize: 13, letterSpacing: 4 },
  footerCredits: { color: 'rgba(255,255,255,0.2)', fontSize: 11, marginTop: 12, textTransform: 'uppercase' }
});
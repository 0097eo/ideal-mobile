import React, { useState, useEffect, useCallback } from "react";
import { Image, Text, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { useThemes, AppColors } from "@/hooks/themes";

// ─── Props & data ─────────────────────────────────────────────────────────────
interface AnimatedSplashScreenProps {
  hide: boolean;
  onAnimationFinish: () => void;
}

const loadingMessages = [
  "Loading assets...",
  "Securing your session...",
  "Polishing the furniture...",
  "Almost there...",
];

// ─── Component ────────────────────────────────────────────────────────────────
const AnimatedSplashScreen: React.FC<AnimatedSplashScreenProps> = ({ hide, onAnimationFinish }) => {
  const { colors, isDark } = useThemes();
  const styles = makeStyles(colors);

  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  const opacity    = useSharedValue(1);
  const scale      = useSharedValue(1);
  const translateY = useSharedValue(0);

  // Gradient: dark = deep black → warm dark brown; light = warm ivory → soft white
  const gradientColors: [string, string] = isDark
    ? ['#0F0C08', '#1A1208']
    : ['#FAF7F2', '#FDF9F4'];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex(prev => (prev + 1) % loadingMessages.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  const onAnimationFinishStable = useCallback(() => {
    onAnimationFinish();
  }, [onAnimationFinish]);

  useEffect(() => {
    if (hide) {
      opacity.value = withTiming(0, { duration: 400, easing: Easing.ease }, (finished) => {
        if (finished) runOnJS(onAnimationFinishStable)();
      });
      scale.value = withTiming(0.95, { duration: 400 });
    }
  }, [hide, onAnimationFinishStable, opacity, scale]);

  useEffect(() => {
    opacity.value    = withTiming(1, { duration: 500 });
    scale.value      = withTiming(1, { duration: 500 });
    translateY.value = withTiming(0, { duration: 500 });
  }, [opacity, scale, translateY]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <LinearGradient colors={gradientColors} style={styles.container}>
      {/* Ambient glow */}
      <View style={styles.ambientGlow} />

      <Animated.View style={[styles.contentContainer, animatedContainerStyle]}>

        {/* Logo ring treatment */}
        <View style={styles.logoRingOuter}>
          <View style={styles.logoRingMid}>
            <View style={styles.logoRingInner}>
              <Image
                source={require("@/assets/images/logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
          </View>
        </View>

        {/* Brand name */}
        <View style={styles.brandGroup}>
          <Text style={styles.brandEyebrow}>Premium Collection</Text>
          <Text style={styles.title}>Ideal Furniture</Text>
          <Text style={styles.tagline}>&amp; Decor</Text>
        </View>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <View style={styles.dividerDot} />
          <View style={styles.dividerLine} />
        </View>

        {/* Loading message */}
        <Animated.View style={[styles.messageContainer, animatedTextStyle]}>
          <Text style={styles.message}>
            {loadingMessages[currentMessageIndex]}
          </Text>
        </Animated.View>

      </Animated.View>
    </LinearGradient>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const makeStyles = (colors: AppColors) => StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ambientGlow: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: colors.primaryDim,
    top: '50%',
    left: '50%',
    marginTop: -160,
    marginLeft: -160,
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 0,
  },

  // Logo rings
  logoRingOuter: {
    width: 156,
    height: 156,
    borderRadius: 78,
    borderWidth: 1,
    borderColor: `${colors.primary}24`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  logoRingMid: {
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 1,
    borderColor: `${colors.primary}38`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoRingInner: {
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 1.5,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primaryDim,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },

  // Brand
  brandGroup: {
    alignItems: 'center',
    gap: 4,
    marginBottom: 24,
  },
  brandEyebrow: {
    fontSize: 10,
    letterSpacing: 4,
    textTransform: 'uppercase',
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 28,
  },
  dividerLine: {
    width: 48,
    height: 1,
    backgroundColor: colors.primaryBorder,
  },
  dividerDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.primary,
    opacity: 0.6,
  },

  // Loading message
  messageContainer: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
    color: colors.textTertiary,
    letterSpacing: 0.5,
  },
});

export default AnimatedSplashScreen;
import React, { useState, useEffect, useCallback } from "react";
import { Image, Text, StyleSheet } from "react-native";
import { useThemes } from "@/hooks/themes";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";

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

const AnimatedSplashScreen: React.FC<AnimatedSplashScreenProps> = ({ hide, onAnimationFinish }) => {
  const { colors } = useThemes();
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  useEffect(() => {
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prevIndex) => (prevIndex + 1) % loadingMessages.length);
    }, 1800);
    return () => clearInterval(messageInterval);
  }, []);

  const onAnimationFinishStable = useCallback(() => {
    onAnimationFinish();
  }, [onAnimationFinish]);

  useEffect(() => {
    if (hide) {
      opacity.value = withTiming(0, { duration: 400, easing: Easing.ease }, (finished) => {
        if (finished) {
          runOnJS(onAnimationFinishStable)();
        }
      });
      scale.value = withTiming(0.95, { duration: 400 });
    }
  }, [hide, onAnimationFinishStable, opacity, scale]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));
  
  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 500 });
    scale.value = withTiming(1, { duration: 500 });
    translateY.value = withTiming(0, { duration: 500 });
  }, [opacity, scale, translateY]);

  return (
    <LinearGradient colors={[colors.surface, colors.background]} style={styles.container}>
      <Animated.View style={[styles.contentContainer, animatedContainerStyle]}>
        <Image source={require("@/assets/images/logo.jpeg")} style={styles.logo} resizeMode="contain" />
        <Text style={[styles.title, { color: colors.primary }]}>Ideal Furniture & Decor</Text>
        <Animated.View style={[styles.messageContainer, animatedTextStyle]}>
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            {loadingMessages[currentMessageIndex]}
          </Text>
        </Animated.View>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  contentContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 20,
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  messageContainer: {
    height: 40,
    justifyContent: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    fontWeight: "500",
  },
});

export default AnimatedSplashScreen;
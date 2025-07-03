import { useAuth } from "@/context/AuthContext";
import { Stack, Redirect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { useThemes } from "@/hooks/themes";
import { useState, useCallback, useEffect } from "react"; 
import AnimatedSplashScreen from "@/components/AnimatedSplashScreen";

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const { colors, isDark } = useThemes();
  const [isSplashAnimationFinished, setIsSplashAnimationFinished] = useState(false);
  const [isMinimumTimeElapsed, setIsMinimumTimeElapsed] = useState(false);

  useEffect(() => {

    const timer = setTimeout(() => {
      setIsMinimumTimeElapsed(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleAnimationFinish = useCallback(() => {
    setIsSplashAnimationFinished(true);
  }, []);

  const shouldHideSplash = !isLoading && isMinimumTimeElapsed;

  if (!isSplashAnimationFinished) {
    return (
      <AnimatedSplashScreen
        hide={shouldHideSplash}
        onAnimationFinish={handleAnimationFinish}
      />
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack 
        screenOptions={{ 
          headerShown: false, 
          gestureEnabled: false,
          animation: 'fade',
        }}
      >
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="verify" />
        <Stack.Screen name="forgotPassword" />
        <Stack.Screen name="resetPassword" />
      </Stack>
    </View>
  );
}
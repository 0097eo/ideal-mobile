import { useAuth } from "@/context/AuthContext";
import { Stack, Redirect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, Image, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useThemes } from "@/hooks/themes";
import { useState, useEffect } from "react";

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const { colors } = useThemes();
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoader(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const shouldShowLoading = isLoading || showLoader;

  if (shouldShowLoading) {
    return (
      <View style={[styles.loaderContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.message, { color: colors.primary }]}>
          Ideal Furniture & Decor
        </Text>
        <Image
          source={require("@/assets/images/logo.jpeg")}
          style={styles.logo}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          Authenticating...
        </Text>
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false, gestureEnabled: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="verify" />
        <Stack.Screen name="forgotPassword" />
        <Stack.Screen name="resetPassword" />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
    borderRadius: 60,
  },
  message: {
    marginTop: 12,
    fontSize: 16,
    marginBottom: 12,
    textAlign: "center",
    fontWeight: "600",
  },
});
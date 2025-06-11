import { useAuth } from "@/context/AuthContext";
import { Stack, Redirect } from "expo-router";
import { FullScreenLoader } from "@/components/LoadingSpinner";
import { StatusBar } from "expo-status-bar";


export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <FullScreenLoader message="Authenticating..." color="#007AFF" />;
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
    </Stack>
    </>
  );
}
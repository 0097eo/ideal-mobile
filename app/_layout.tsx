import { Stack } from "expo-router";
import { AuthProvider } from "@/context/AuthContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { SafeAreaProvider } from "react-native-safe-area-context";


export default function RootLayout() {
  return (
  <AuthProvider>
    <WishlistProvider>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </SafeAreaProvider>
    </WishlistProvider>
  </AuthProvider>
  ) 
}


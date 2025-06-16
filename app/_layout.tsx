import { Stack } from "expo-router";
import { AuthProvider } from "@/context/AuthContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { CartProvider } from "@/context/CartContext";
import { SafeAreaProvider } from "react-native-safe-area-context";


export default function RootLayout() {
  return (
  <AuthProvider>
    <WishlistProvider>
      <CartProvider>
        <SafeAreaProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="checkout" options={{ headerShown: false }} />
          </Stack>
        </SafeAreaProvider>
      </CartProvider>
    </WishlistProvider>
  </AuthProvider>
  ) 
}


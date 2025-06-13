import { ProtectedRoute } from "@/context/ProtectedRoute"
import { Tabs } from "expo-router"
import { Home, ShoppingBag, ShoppingCart, Heart, User} from 'lucide-react-native'
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemes } from "@/hooks/themes";


export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { colors } = useThemes();

  return (
    <ProtectedRoute>
      <StatusBar style='auto' />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarLabelStyle: {
            fontSize: 13,
            fontWeight: "600",
          },
          tabBarStyle: {
            backgroundColor: colors.navigationBackground,
            borderTopColor: colors.border,
            paddingBottom: Math.max(insets.bottom, 5),
            height: 60 + insets.bottom,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            headerShown: false,
            title: "Home",
            tabBarIcon: ({ color }) => <Home size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="shop"
          options={{
            headerShown: false,
            title: "Shop",
            tabBarIcon: ({ color }) => <ShoppingBag size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="cart"
          options={{
            headerShown: false,
            title: "Cart",
            tabBarIcon: ({ color }) => <ShoppingCart size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="wishlist"
          options={{
            headerShown: false,
            title: "Wishlist",
            tabBarIcon: ({ color }) => <Heart size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="account"
          options={{
            headerShown: false,
            title: "Account",
            tabBarIcon: ({ color }) => <User size={24} color={color} />,
          }}
        />
      </Tabs>
    </ProtectedRoute>
  );
}
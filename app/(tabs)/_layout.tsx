import { ProtectedRoute } from "@/context/ProtectedRoute";
import { Tabs } from "expo-router";
import { Home, ShoppingBag, ShoppingCart, Heart, User, LucideProps } from 'lucide-react-native';
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemes } from "@/hooks/themes";
import { View, Text, StyleSheet } from "react-native";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { ComponentType } from "react";

interface TabBarIconWithBadgeProps {
  IconComponent: ComponentType<LucideProps>;
  count: number;
  color: string;
  size: number;
}

const TabBarIconWithBadge: React.FC<TabBarIconWithBadgeProps> = ({ IconComponent, count, color, size }) => {
  return (
    <View style={styles.container}>
      <IconComponent size={size} color={color} />
      {count > 0 && (
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>{count}</Text>
        </View>
      )}
    </View>
  );
};


export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { colors } = useThemes();
  const { getCartItemCount } = useCart();
  const { wishlistProducts } = useWishlist();
  const cartItemCount = getCartItemCount();
  const wishlistItemCount = wishlistProducts.length;

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
            tabBarIcon: ({ color }) => (
              <TabBarIconWithBadge 
                IconComponent={ShoppingCart} 
                count={cartItemCount} 
                color={color} 
                size={24} 
              />
            ),
          }}
        />
        <Tabs.Screen
          name="wishlist"
          options={{
            headerShown: false,
            title: "Wishlist",
            tabBarIcon: ({ color }) => (
              <TabBarIconWithBadge 
                IconComponent={Heart} 
                count={wishlistItemCount} 
                color={color} 
                size={24} 
              />
            ),
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

const styles = StyleSheet.create({
  container: {
    width: 24,
    height: 24,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeContainer: {
    position: 'absolute',
    right: -8,
    top: -4,
    backgroundColor: 'red',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
import { ProtectedRoute } from "@/context/ProtectedRoute";
import { Tabs } from "expo-router";
import { Home, ShoppingBag, ShoppingCart, Heart, User, LucideProps } from 'lucide-react-native';
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemes, AppColors } from "@/hooks/themes";
import { View, Text, StyleSheet } from "react-native";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { ComponentType } from "react";

// ─── Badge icon ───────────────────────────────────────────────────────────────
interface TabBarIconWithBadgeProps {
  IconComponent: ComponentType<LucideProps>;
  count: number;
  color: string;
  size: number;
  colors: AppColors;
}

const TabBarIconWithBadge: React.FC<TabBarIconWithBadgeProps> = ({ IconComponent, count, color, size, colors }) => {
  const styles = makeStyles(colors);
  return (
    <View style={styles.container}>
      <IconComponent size={size} color={color} />
      {count > 0 && (
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
        </View>
      )}
    </View>
  );
};

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useThemes();
  const { getCartItemCount } = useCart();
  const { wishlistProducts } = useWishlist();
  const cartItemCount = getCartItemCount();
  const wishlistItemCount = wishlistProducts.length;

  return (
    <ProtectedRoute>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textTertiary,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            letterSpacing: 0.5,
            marginTop: 2,
          },
          tabBarStyle: {
            backgroundColor: colors.background,
            borderTopWidth: 1,
            borderTopColor: `${colors.primary}2E`,
            paddingBottom: Math.max(insets.bottom, 6),
            paddingTop: 8,
            height: 62 + insets.bottom,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.08,
            shadowRadius: 12,
            elevation: 16,
          },
          tabBarItemStyle: {
            paddingVertical: 2,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            headerShown: false,
            title: "Home",
            tabBarIcon: ({ color }) => <Home size={22} color={color} />,
          }}
        />
        <Tabs.Screen
          name="shop"
          options={{
            headerShown: false,
            title: "Shop",
            tabBarIcon: ({ color }) => <ShoppingBag size={22} color={color} />,
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
                size={22}
                colors={colors}
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
                size={22}
                colors={colors}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="account"
          options={{
            headerShown: false,
            title: "Account",
            tabBarIcon: ({ color }) => <User size={22} color={color} />,
          }}
        />
      </Tabs>
    </ProtectedRoute>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const makeStyles = (colors: AppColors) => StyleSheet.create({
  container: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeContainer: {
    position: 'absolute',
    right: -9,
    top: -5,
    backgroundColor: colors.primary,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 3,
  },
  badgeText: {
    color: colors.primaryText,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
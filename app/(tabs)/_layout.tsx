import { ProtectedRoute } from "@/context/ProtectedRoute"
import { Tabs } from "expo-router"
import { Home, ShoppingBag, ShoppingCart, Heart, User} from 'lucide-react-native'
import { StatusBar } from "expo-status-bar";

export default function TabLayout() {
    return (
        <ProtectedRoute>
            <StatusBar style="auto" />
            <Tabs screenOptions={{
                tabBarActiveTintColor: '#f59e0b',
                tabBarInactiveTintColor: 'gray',
                tabBarStyle: {
                    paddingBottom: 5,
                    height: 60,
                },
                }}>
                <Tabs.Screen
                    name="index"
                    options={{
                        title: 'Home',
                        tabBarIcon: ({ color }) => <Home size={24} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="shop"
                    options={{
                        title: 'Shop',
                        tabBarIcon: ({ color }) => <ShoppingBag size={24} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="cart"
                    options={{
                        title: 'Cart',
                        tabBarIcon: ({ color }) => <ShoppingCart size={24} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="wishlist"
                    options={{
                        title: 'Wishlist',
                        tabBarIcon: ({ color }) => <Heart size={24} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="account"
                    options={{
                        title: 'Account',
                        tabBarIcon: ({ color }) => <User size={24} color={color} />,
                    }}
                />
            </Tabs>
        </ProtectedRoute>

    )

}
import { Stack } from "expo-router";

export default function ScreensLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="checkout" 
        options={{ 
          presentation: "modal",
          headerShown: false
        }} 
      />
      <Stack.Screen 
        name="orderConfirmation" 
        options={{ 
          headerShown: false
        }} 
      />
      <Stack.Screen 
        name="order-details/[orderId]" 
        options={{ 
          headerShown: false
        }} 
      />
      <Stack.Screen
        name="profile"
        options={{
          headerShown: false
        }}
      />
      <Stack.Screen
        name="orders"
        options={{
          headerShown: false
        }}
      />
      <Stack.Screen
        name="reviews"
        options={{
          headerShown: false
        }}
      />
      <Stack.Screen
        name="vouchers"
        options={{
          headerShown: false
        }}
      />
    </Stack>
  );
}
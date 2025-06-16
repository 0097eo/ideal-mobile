import { Stack } from "expo-router";

export default function ScreensLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="checkout" 
        options={{ 
          title: "Checkout",
          presentation: "modal"
        }} 
      />
      <Stack.Screen 
        name="orderConfirmation" 
        options={{ 
          title: "Order Confirmed",
          headerBackVisible: false
        }} 
      />
      <Stack.Screen 
        name="order-details/[orderId]" 
        options={{ title: "Order Details" }} 
      />
    </Stack>
  );
}
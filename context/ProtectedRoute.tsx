import React from "react";
import { Redirect } from "expo-router";
import { useAuth } from "./AuthContext";
import { ActivityIndicator, View } from "react-native";


const LoadingScreen: React.FC = () => (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0000ff" />
    </View>
);

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <LoadingScreen />;
    }

    if (!isAuthenticated) {
        return <Redirect href="/login" />;
    }

    return <>{children}</>;
};
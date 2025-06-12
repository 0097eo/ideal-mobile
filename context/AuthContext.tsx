import { createContext, useContext, useState, useEffect } from "react";
import { API_URL } from "@/constants/api";
import { User, AuthContextType } from "@/types/auth";
import * as SecureStore from 'expo-secure-store';

const AuthContext = createContext<AuthContextType>({
    user: null,
    token: null,
    login: async () => {},
    logout: async () => {},
    verifyEmail: async () => {},
    isAuthenticated: false,
    refreshToken: async () => false,
    isLoading: true,
})

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const loadStoredAuth = async () => {
            try {
                const storedToken = await SecureStore.getItemAsync("access_token");
                if (storedToken) {
                    setToken(storedToken);
                    const response = await fetch(`${API_URL}/accounts/profile/`, {
                        headers: {
                            Authorization: `Bearer ${storedToken}`,
                        },
                    });

                    if (!response.ok) {
                        throw new Error('Failed to fetch user profile');
                    }

                    const userData = await response.json();
                    const user: User = {
                        id: userData.id.toString(),
                        email: userData.email,
                        name: `${userData.first_name} ${userData.last_name}`.trim(),
                        first_name: userData.first_name,
                        last_name: userData.last_name,
                        phone_number: userData.phone_number,
                        user_type: userData.user_type,
                        is_admin: userData.is_admin,
                        is_verified: userData.is_verified,
                    };
                    setUser(user);
                }
            } catch (error) {
                // Clear invalid tokens
                await SecureStore.deleteItemAsync("access_token").catch(() => {});
                await SecureStore.deleteItemAsync("refresh_token").catch(() => {});
                setToken(null);
                setUser(null);
                throw error; // ← Throw instead of logging
            } finally {
                setIsLoading(false);
            }
        };

        loadStoredAuth();
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const response = await fetch(`${API_URL}/accounts/login/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Login failed");
            }

            const data = await response.json();

            const user: User = {
                id: data.user.id.toString(),
                email: data.user.email,
                name: `${data.user.first_name} ${data.user.last_name}`.trim(),
                first_name: data.user.first_name,
                last_name: data.user.last_name,
                phone_number: data.user.phone_number,
                user_type: data.user.user_type,
                is_admin: data.user.is_admin,
                is_verified: data.user.is_verified,
            };

            setUser(user);
            setToken(data.access);
            
            // Store tokens securely
            await SecureStore.setItemAsync("access_token", data.access);
            await SecureStore.setItemAsync("refresh_token", data.refresh);
        } catch (error) {
            throw error;
        }
    };

    const verifyEmail = async (email: string, verificationCode: string) => {
        try {
            const response = await fetch(`${API_URL}/accounts/verify-email/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ 
                    email, 
                    verification_code: verificationCode 
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || errorData.detail || "Verification failed");
            }

            const data = await response.json();

            // If tokens are returned, log the user in automatically
            if (data.access && data.refresh && data.user) {
                const user: User = {
                    id: data.user.id.toString(),
                    email: data.user.email,
                    name: `${data.user.first_name} ${data.user.last_name}`.trim(),
                    first_name: data.user.first_name,
                    last_name: data.user.last_name,
                    phone_number: data.user.phone_number,
                    user_type: data.user.user_type,
                    is_admin: data.user.is_admin,
                    is_verified: data.user.is_verified,
                };

                setUser(user);
                setToken(data.access);
                
                // Store tokens securely
                await SecureStore.setItemAsync("access_token", data.access);
                await SecureStore.setItemAsync("refresh_token", data.refresh);
            }

            return data;
        } catch (error) {
            throw error;
        }
    };

    const logout = async () => {
        try {
            setUser(null);
            setToken(null);
            // Remove tokens from secure storage
            await SecureStore.deleteItemAsync("access_token").catch(() => {});
            await SecureStore.deleteItemAsync("refresh_token").catch(() => {});
        } catch (error) {
            throw error; // ← Throw instead of logging
        }
    };

    const refreshToken = async () => {
        if (!token) return false;

        try {
            const response = await fetch(`${API_URL}/accounts/refresh/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ token }),
            });

            if (!response.ok) {
                throw new Error('Failed to refresh token');
            }

            const data = await response.json();
            setToken(data.access);
            await SecureStore.setItemAsync("access_token", data.access);
            return true;
        } catch (error) {
            throw error; // ← Throw instead of logging
        }
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            token, 
            login, 
            logout,
            verifyEmail,
            refreshToken,
            isAuthenticated: !!user && !!token, 
            isLoading 
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
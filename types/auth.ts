export interface User {
    id: string;
    email: string;
    name: string; // Computed from first_name + last_name
    first_name: string;
    last_name: string;
    phone_number?: string;
    user_type: 'ADMIN' | 'CUSTOMER';
    is_admin: boolean;
    is_verified: boolean;
}

export interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () =>  Promise<void>;
    refreshToken: () => Promise<boolean>;
    isAuthenticated: boolean;
    isLoading: boolean;
}
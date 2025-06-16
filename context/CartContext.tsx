import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '@/constants/api';
import { CartItem, Cart, CartState } from '@/types/cart';


export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CartContextType {
  // State
  cart: Cart;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchCart: () => Promise<void>;
  addToCart: (productId: number, quantity?: number) => Promise<ApiResponse<Cart>>;
  updateCartItem: (itemId: number, quantity: number) => Promise<ApiResponse<Cart>>;
  removeCartItem: (itemId: number) => Promise<ApiResponse<Cart>>;
  clearCart: () => Promise<ApiResponse<Cart>>;
  clearError: () => void;
  
  // Helpers
  getCartItemCount: () => number;
  getCartTotal: () => number;
  isItemInCart: (productId: number) => boolean;
  getCartItem: (productId: number) => CartItem | undefined;
}

interface CartProviderProps {
  children: ReactNode;
}

// Cart Context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Action Types
const CART_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_CART: 'SET_CART',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  ADD_ITEM_SUCCESS: 'ADD_ITEM_SUCCESS',
  UPDATE_ITEM_SUCCESS: 'UPDATE_ITEM_SUCCESS',
  REMOVE_ITEM_SUCCESS: 'REMOVE_ITEM_SUCCESS',
  CLEAR_CART_SUCCESS: 'CLEAR_CART_SUCCESS',
} as const;

type CartAction = 
  | { type: typeof CART_ACTIONS.SET_LOADING; payload: boolean }
  | { type: typeof CART_ACTIONS.SET_CART; payload: Cart }
  | { type: typeof CART_ACTIONS.SET_ERROR; payload: string }
  | { type: typeof CART_ACTIONS.CLEAR_ERROR }
  | { type: typeof CART_ACTIONS.ADD_ITEM_SUCCESS; payload: Cart }
  | { type: typeof CART_ACTIONS.UPDATE_ITEM_SUCCESS; payload: Cart }
  | { type: typeof CART_ACTIONS.REMOVE_ITEM_SUCCESS; payload: Cart }
  | { type: typeof CART_ACTIONS.CLEAR_CART_SUCCESS; payload: Cart };

// Initial State
const initialState: CartState = {
  cart: {
    id: null,
    items: [],
    total_price: '0.00',
    created_at: null,
    updated_at: null,
  },
  loading: false,
  error: null,
};

// Reducer
const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case CART_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
        error: null,
      };
    
    case CART_ACTIONS.SET_CART:
      return {
        ...state,
        cart: action.payload,
        loading: false,
        error: null,
      };
    
    case CART_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    
    case CART_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
    
    case CART_ACTIONS.ADD_ITEM_SUCCESS:
    case CART_ACTIONS.UPDATE_ITEM_SUCCESS:
    case CART_ACTIONS.REMOVE_ITEM_SUCCESS:
    case CART_ACTIONS.CLEAR_CART_SUCCESS:
      return {
        ...state,
        cart: action.payload,
        loading: false,
        error: null,
      };
    
    default:
      return state;
  }
};

// API Helper Functions
const getAuthHeaders = async (): Promise<Record<string, string>> => {
  try {
    const token = await SecureStore.getItemAsync('access_token');
    if (!token) {
      throw new Error('Authentication token not found');
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  } catch (error) {
    throw new Error('Authentication token not found');
  }
};

const handleApiError = (error: any): string => {
  if (error.response?.data?.error) {
    return error.response.data.error;
  } else if (error.response?.data?.detail) {
    return error.response.data.detail;
  } else if (error.message) {
    return error.message;
  } else {
    return 'An unexpected error occurred';
  }
};

// Cart Provider Component
export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // API Functions
  const fetchCart = async (): Promise<void> => {
    try {
      dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true });
      
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/cart/cart/`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: Cart = await response.json();
      dispatch({ type: CART_ACTIONS.SET_CART, payload: data });
    } catch (error) {
      dispatch({ type: CART_ACTIONS.SET_ERROR, payload: handleApiError(error) });
    }
  };

  const addToCart = async (productId: number, quantity: number = 1): Promise<ApiResponse<Cart>> => {
    try {
      dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true });
      
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/cart/cart/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          product_id: productId,
          quantity: quantity,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data: Cart = await response.json();
      dispatch({ type: CART_ACTIONS.ADD_ITEM_SUCCESS, payload: data });
      return { success: true, data };
    } catch (error) {
      const errorMessage = handleApiError(error);
      dispatch({ type: CART_ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const updateCartItem = async (itemId: number, quantity: number): Promise<ApiResponse<Cart>> => {
    try {
      dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true });
      
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/cart/cart/item/${itemId}/`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ quantity }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data: Cart = await response.json();
      dispatch({ type: CART_ACTIONS.UPDATE_ITEM_SUCCESS, payload: data });
      return { success: true, data };
    } catch (error) {
      const errorMessage = handleApiError(error);
      dispatch({ type: CART_ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const removeCartItem = async (itemId: number): Promise<ApiResponse<Cart>> => {
    try {
      dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true });
      
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/cart/cart/item/${itemId}/`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data: Cart = await response.json();
      dispatch({ type: CART_ACTIONS.REMOVE_ITEM_SUCCESS, payload: data });
      return { success: true, data };
    } catch (error) {
      const errorMessage = handleApiError(error);
      dispatch({ type: CART_ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const clearCart = async (): Promise<ApiResponse<Cart>> => {
    try {
      dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true });
      
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/cart/cart/`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data: Cart = await response.json();
      dispatch({ type: CART_ACTIONS.CLEAR_CART_SUCCESS, payload: data });
      return { success: true, data };
    } catch (error) {
      const errorMessage = handleApiError(error);
      dispatch({ type: CART_ACTIONS.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const clearError = (): void => {
    dispatch({ type: CART_ACTIONS.CLEAR_ERROR });
  };

  // Helper functions
  const getCartItemCount = (): number => {
    return state.cart.items.reduce((total, item) => total + item.quantity, 0);
  };

  const getCartTotal = (): number => {
    return parseFloat(state.cart.total_price || '0');
  };

  const isItemInCart = (productId: number): boolean => {
    return state.cart.items.some(item => item.product === productId);
  };

  const getCartItem = (productId: number): CartItem | undefined => {
    return state.cart.items.find(item => item.product === productId);
  };

  // Load cart on mount
  useEffect(() => {
    fetchCart();
  }, []);

  const contextValue: CartContextType = {
    // State
    cart: state.cart,
    loading: state.loading,
    error: state.error,
    
    // Actions
    fetchCart,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart,
    clearError,
    
    // Helpers
    getCartItemCount,
    getCartTotal,
    isItemInCart,
    getCartItem,
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

// Custom Hook
export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

// Export context for advanced usage
export { CartContext };
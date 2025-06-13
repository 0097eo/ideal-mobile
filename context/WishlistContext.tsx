import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import { Product } from '@/types/product';
import { API_URL } from '@/constants/api';
import * as SecureStore from 'expo-secure-store';

interface WishlistContextType {
  wishlistItems: Set<number>;
  wishlistProducts: Product[];
  loading: boolean;
  error: string | null;
  addToWishlist: (product: Product) => Promise<boolean>;
  removeFromWishlist: (productId: number) => Promise<boolean>;
  isInWishlist: (productId: number) => boolean;
  refreshWishlist: () => Promise<void>;
  clearError: () => void;
}

interface WishlistResponse {
  products: Product[];
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

interface WishlistProviderProps {
  children: ReactNode;
}

export const WishlistProvider: React.FC<WishlistProviderProps> = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState<Set<number>>(new Set());
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [bearer, setBearer] = useState<string | null>(null);

  useEffect(() => {
    const getBearer = async () => {
      const token = await SecureStore.getItemAsync("access_token");
      setBearer(token);
    };
    getBearer();
  }, []);

  const fetchWishlist = async (): Promise<void> => {
    if (!bearer) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/products/wishlist/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${bearer}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: WishlistResponse = await response.json();
      const products = data.products || [];

      setWishlistProducts(products);
      setWishlistItems(new Set(products.map(product => product.id)));
    } catch (err) {
      console.error('Error fetching wishlist:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch wishlist');
    } finally {
      setLoading(false);
    }
  };

  const addToWishlist = async (product: Product): Promise<boolean> => {
    if (!bearer) return false;

    try {
      setError(null);

      const response = await fetch(`${API_URL}/products/wishlist/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${bearer}`,
        },
        body: JSON.stringify({ product_id: product.id }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setWishlistItems(prev => new Set([...prev, product.id]));
      setWishlistProducts(prev => {
        if (prev.some(p => p.id === product.id)) {
          return prev;
        }
        return [...prev, product];
      });

      return true;
    } catch (err) {
      console.error('Error adding to wishlist:', err);
      setError(err instanceof Error ? err.message : 'Failed to add to wishlist');
      Alert.alert('Error', 'Failed to add item to wishlist. Please try again.');
      return false;
    }
  };

  const removeFromWishlist = async (productId: number): Promise<boolean> => {
    if (!bearer) return false;

    try {
      setError(null);

      const response = await fetch(`${API_URL}/products/wishlist/${productId}/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${bearer}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setWishlistItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });

      setWishlistProducts(prev => prev.filter(product => product.id !== productId));

      return true;
    } catch (err) {
      console.error('Error removing from wishlist:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove from wishlist');
      Alert.alert('Error', 'Failed to remove item from wishlist. Please try again.');
      return false;
    }
  };

  const isInWishlist = (productId: number): boolean => {
    return wishlistItems.has(productId);
  };

  const refreshWishlist = async (): Promise<void> => {
    await fetchWishlist();
  };

  const clearError = (): void => {
    setError(null);
  };

  useEffect(() => {
    if (bearer) {
      fetchWishlist();
    }
  }, [bearer]);

  const value: WishlistContextType = {
    wishlistItems,
    wishlistProducts,
    loading,
    error,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    refreshWishlist,
    clearError,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = (): WishlistContextType => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export default WishlistContext;

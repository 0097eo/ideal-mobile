import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import Wishlist from '@/app/(tabs)/wishlist';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { useThemes } from '@/hooks/themes';
import { router } from 'expo-router';

jest.mock('@/context/WishlistContext');
jest.mock('@/context/CartContext');
jest.mock('@/hooks/themes');
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    back: jest.fn(),
  },
}));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));
jest.mock('@/components/CustomAlert', () => {
    //eslint-disable-next-line @typescript-eslint/no-require-imports 
  const { View, Text } = require('react-native');
  const MockCustomAlert = ({ visible, title, message }: any) =>
    visible ? (
      <View testID="custom-alert">
        <Text>{title}</Text>
        <Text>{message}</Text>
      </View>
    ) : null;
  return MockCustomAlert;
});

jest.mock('@/components/LoadingSpinner', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Text } = require('react-native');
    const MockSpinner = ({ message }: { message: string }) => <Text>{message}</Text>;
    return {
        LoadingSpinner: MockSpinner,
        FullScreenLoader: MockSpinner
    };
});

const mockProduct = {
  id: 1,
  name: 'Test Product',
  price: '1000',
  image: '',
  additional_images: '',
  category_name: 'Living Room',
  stock: 5,
};

const mockWishlistProducts = [mockProduct];

beforeEach(() => {
  jest.clearAllMocks();
  (useThemes as jest.Mock).mockReturnValue({
    colors: {
      background: '#fff',
      text: '#000',
      primary: '#007AFF',
      surface: '#F2F2F2',
      border: '#CCCCCC',
      error: '#FF3B30',
      textSecondary: '#666666',
      textTertiary: '#999999',
      divider: '#E5E5E5',
      card: '#fff',
      shadow: '#000',
      primaryMuted: '#e6f0fa',
      success: '#10B981',
    },
  });
});

describe('Wishlist Tab', () => {
  it('shows loading state', () => {
    (useWishlist as jest.Mock).mockReturnValue({
      wishlistProducts: [],
      loading: true,
      error: '',
    });
    (useCart as jest.Mock).mockReturnValue({ loading: false });
    const { getByText } = render(<Wishlist />);
    expect(getByText('Loading your wishlist...')).toBeTruthy();
  });

  it('shows empty state', () => {
    (useWishlist as jest.Mock).mockReturnValue({
      wishlistProducts: [],
      loading: false,
      error: '',
    });
    (useCart as jest.Mock).mockReturnValue({ loading: false });
    const { getByText } = render(<Wishlist />);
    expect(getByText('Your Wishlist is Empty')).toBeTruthy();
    expect(getByText('Shop Now')).toBeTruthy();
  });

  it('renders wishlist items', () => {
    (useWishlist as jest.Mock).mockReturnValue({
      wishlistProducts: mockWishlistProducts,
      loading: false,
      error: '',
    });
    (useCart as jest.Mock).mockReturnValue({
      isItemInCart: () => false,
      loading: false,
    });
    const { getByText } = render(<Wishlist />);
    expect(getByText('Test Product')).toBeTruthy();
    expect(getByText('Add to Cart')).toBeTruthy();
    expect(getByText('LIVING ROOM')).toBeTruthy();
  });

  it('shows error and can clear error', () => {
    const mockClearError = jest.fn();
    (useWishlist as jest.Mock).mockReturnValue({
      wishlistProducts: [],
      loading: false,
      error: 'Failed to load wishlist',
      clearError: mockClearError,
    });
    (useCart as jest.Mock).mockReturnValue({ loading: false });
    const { getByText, getByTestId } = render(<Wishlist />);
    expect(getByText('Failed to load wishlist')).toBeTruthy();
    fireEvent.press(getByTestId('clear-error-button'));
    expect(mockClearError).toHaveBeenCalled();
  });

  it('removes item from wishlist and shows alert', async () => {
    const mockRemove = jest.fn().mockResolvedValue(true);
    (useWishlist as jest.Mock).mockReturnValue({
      wishlistProducts: mockWishlistProducts,
      loading: false,
      error: '',
      removeFromWishlist: mockRemove,
    });
    (useCart as jest.Mock).mockReturnValue({
      isItemInCart: () => false,
      loading: false,
    });
    const { getByText, findByTestId } = render(<Wishlist />);
    fireEvent.press(getByText('❤️'));
    const alert = await findByTestId('custom-alert');
    expect(alert).toBeTruthy();
    expect(getByText('Removed from Wishlist')).toBeTruthy();
  });

  it('adds item to cart and shows alert', async () => {
    const mockAddToCart = jest.fn().mockResolvedValue({ success: true });
    (useWishlist as jest.Mock).mockReturnValue({
      wishlistProducts: mockWishlistProducts,
      loading: false,
      error: '',
    });
    (useCart as jest.Mock).mockReturnValue({
      addToCart: mockAddToCart,
      isItemInCart: () => false,
      loading: false,
    });
    const { getByText, findByTestId } = render(<Wishlist />);
    await act(async () => {
        fireEvent.press(getByText('Add to Cart'));
    });
    const alert = await findByTestId('custom-alert');
    expect(alert).toBeTruthy();
    expect(getByText('Added to Cart')).toBeTruthy();
  });

  // FIX: The test now correctly asserts the button is disabled.
  it('shows "In Cart" state and disables the button', () => {
    (useWishlist as jest.Mock).mockReturnValue({
      wishlistProducts: mockWishlistProducts,
      loading: false,
      error: '',
    });
    (useCart as jest.Mock).mockReturnValue({
      addToCart: jest.fn(),
      isItemInCart: () => true, // Item is in cart
      loading: false,
    });
    const { getByText } = render(<Wishlist />);
    const inCartButton = getByText('In Cart');
    // Assert the button shows the correct text and is disabled.
    expect(inCartButton).toBeTruthy();
    expect(inCartButton).toBeDisabled();
  });

  it('shows out of stock and is disabled', () => {
    (useWishlist as jest.Mock).mockReturnValue({
      wishlistProducts: [{ ...mockProduct, stock: 0 }],
      loading: false,
      error: '',
    });
    (useCart as jest.Mock).mockReturnValue({
      isItemInCart: () => false,
      loading: false,
    });
    const { getByText } = render(<Wishlist />);
    const outOfStockButton = getByText('Out of Stock');
    expect(outOfStockButton).toBeDisabled();
  });

  it('navigates to shop when Shop Now is pressed', () => {
    (useWishlist as jest.Mock).mockReturnValue({
      wishlistProducts: [],
      loading: false,
      error: '',
    });
    (useCart as jest.Mock).mockReturnValue({ loading: false });
    const { getByText } = render(<Wishlist />);
    fireEvent.press(getByText('Shop Now'));
    expect(router.push).toHaveBeenCalledWith('/shop');
  });

  it('calls router.back when back button is pressed', () => {
    (useWishlist as jest.Mock).mockReturnValue({
      wishlistProducts: mockWishlistProducts,
      loading: false,
      error: '',
    });
    (useCart as jest.Mock).mockReturnValue({
      isItemInCart: () => false,
      loading: false,
    });
    const { getByRole } = render(<Wishlist />);
    fireEvent.press(getByRole('button'));
    expect(router.back).toHaveBeenCalled();
  });
});
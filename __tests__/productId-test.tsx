import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import ProductDetailsPage from '@/app/product/[id]';
import { useThemes } from '@/hooks/themes';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { useLocalSearchParams, useRouter } from 'expo-router';


jest.mock('@/hooks/themes');
jest.mock('@/context/WishlistContext');
jest.mock('@/context/CartContext');
jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
  useRouter: jest.fn(),
}));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

jest.mock('@/components/CustomAlert', () => {
    //eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View, Text, TouchableOpacity } = require('react-native');
  const MockCustomAlert = ({ visible, title, message, onConfirm, confirmText, showCancel, onClose, cancelText }: any) =>
    visible ? (
      <View testID="custom-alert">
        <Text>{title}</Text>
        <Text>{message}</Text>
        {onConfirm && <TouchableOpacity onPress={onConfirm}><Text>{confirmText || 'OK'}</Text></TouchableOpacity>}
        {showCancel && onClose && <TouchableOpacity onPress={onClose}><Text>{cancelText || 'Cancel'}</Text></TouchableOpacity>}
      </View>
    ) : null;
  return MockCustomAlert;
});

jest.mock('@/components/LoadingSpinner', () => {
    //eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Text } = require('react-native');
  const MockSpinner = ({ message }: { message: string }) => <Text>{message}</Text>;
  return {
    LoadingSpinner: MockSpinner,
    FullScreenLoader: MockSpinner,
  };
});

global.fetch = jest.fn();

const mockRouterBack = jest.fn();
const mockRouterPush = jest.fn();
const mockProduct = {
  id: 1, name: 'Test Product', price: '1000', image: 'https://example.com/image.jpg', additional_images: 'https://example.com/image2.jpg,https://example.com/image3.jpg', category_name: 'Living Room', stock: 5, is_available: true, condition: 'NEW', primary_material: 'WOOD', description: 'A great product', average_rating: 4.5, review_count: 2, reviews: [ { id: 1, user: 'Jane', rating: 5, comment: 'Excellent!', created_at: '2024-06-01T12:00:00Z' }, { id: 2, user: 'John', rating: 4, comment: 'Pretty good', created_at: '2024-06-02T12:00:00Z' } ],
};

beforeEach(() => {
  jest.clearAllMocks();
  (useThemes as jest.Mock).mockReturnValue({ colors: {}, createStyles: (fn: any) => fn({}) });
  (useLocalSearchParams as jest.Mock).mockReturnValue({ id: '1' });
  (useRouter as jest.Mock).mockReturnValue({ back: mockRouterBack, push: mockRouterPush });
  (useWishlist as jest.Mock).mockReturnValue({ addToWishlist: jest.fn(), removeFromWishlist: jest.fn(), isInWishlist: jest.fn(() => false) });
  (useCart as jest.Mock).mockReturnValue({ addToCart: jest.fn().mockResolvedValue({ success: true }), loading: false, error: null, clearError: jest.fn() });
});


describe('ProductDetailsPage', () => {
  it('shows loading state initially', () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));
    const { getByText } = render(<ProductDetailsPage />);
    expect(getByText('Loading product details...')).toBeTruthy();
  });

  it('shows error state if fetch fails', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Product not found'));
    const { findByText } = render(<ProductDetailsPage />);
    expect(await findByText('Product not found')).toBeTruthy();
  });

  it('renders product details after successful fetch', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => mockProduct });
    const { findByText, getByText } = render(<ProductDetailsPage />);
    expect(await findByText('Test Product')).toBeTruthy();
    expect(getByText('Living Room')).toBeTruthy();
  });

  it('calls router.back when back button is pressed', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => mockProduct });
    const { getByRole } = render(<ProductDetailsPage />);
    const backButton = await waitFor(() => getByRole('button'));
    fireEvent.press(backButton);
    expect(mockRouterBack).toHaveBeenCalled();
  });

  it('toggles wishlist and shows alert', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => mockProduct });
    const { findByText, getByText } = render(<ProductDetailsPage />);
    await findByText('Test Product');
    fireEvent.press(getByText('🤍'));
    expect(await findByText('Added to Wishlist')).toBeTruthy();
  });

  it('removes from wishlist and shows alert', async () => {
    (useWishlist as jest.Mock).mockReturnValue({ removeFromWishlist: jest.fn(), isInWishlist: jest.fn(() => true) });
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => mockProduct });
    const { findByText, getByText } = render(<ProductDetailsPage />);
    await findByText('Test Product');
    fireEvent.press(getByText('❤️'));
    expect(await findByText('Removed from Wishlist')).toBeTruthy();
  });

  it('adds to cart and shows alert', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => mockProduct });
    const { findByText, getByText } = render(<ProductDetailsPage />);
    await findByText('Test Product');
    await act(async () => {
        fireEvent.press(getByText('Add to Cart'));
    });
    expect(await findByText('Added to Cart')).toBeTruthy();
  });

  it('handles Buy Now and navigates to checkout', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => mockProduct });
    const { findByText, getAllByText } = render(<ProductDetailsPage />);
    await findByText('Test Product');
    
    await act(async () => {
        fireEvent.press(getAllByText('Buy Now')[0]);
    });
    
    const continueButton = await findByText('Continue');
    fireEvent.press(continueButton);
    
    expect(mockRouterPush).toHaveBeenCalledWith('/(screens)/checkout');
  });

  it('shows out of stock state', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ ...mockProduct, is_available: false }) });
    const { findByText } = render(<ProductDetailsPage />);
    expect(await findByText('Out of Stock')).toBeTruthy();
  });

  it('shows error alert if addToCart fails', async () => {
    (useCart as jest.Mock).mockReturnValue({ addToCart: jest.fn().mockResolvedValue({ success: false, error: 'Failed to add' }), loading: false, clearError: jest.fn() });
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => mockProduct });
    const { findByText, getByText } = render(<ProductDetailsPage />);
    await findByText('Test Product');
    await act(async () => {
        fireEvent.press(getByText('Add to Cart'));
    });
    expect(await findByText('Error')).toBeTruthy();
    expect(getByText('Failed to add')).toBeTruthy();
  });

  it('shows cart error alert and clears error', async () => {
    const mockClearError = jest.fn();
    (useCart as jest.Mock).mockReturnValue({
      addToCart: jest.fn(),
      loading: false,
      error: 'Cart error!',
      clearError: mockClearError,
    });
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => mockProduct });
    
    const { findByText, getByText } = render(<ProductDetailsPage />);
    
    await findByText('Cart Error');
    expect(getByText('Cart error!')).toBeTruthy();

    const okButton = getByText('OK');
    fireEvent.press(okButton);
    
    expect(mockClearError).toHaveBeenCalled();
  });

  it('changes quantity with + and - buttons', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => mockProduct });
    const { findByText, getByText } = render(<ProductDetailsPage />);
    await findByText('Test Product');
    const plus = getByText('+');
    const minus = getByText('-');
    fireEvent.press(plus);
    expect(getByText('2')).toBeTruthy();
    fireEvent.press(minus);
    expect(getByText('1')).toBeTruthy();
  });
});
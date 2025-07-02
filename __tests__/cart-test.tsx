import React from 'react';
import { render, fireEvent, waitFor, within } from '@testing-library/react-native';
import Cart from '@/app/(tabs)/cart';
import { useCart } from '@/context/CartContext';
import { useThemes } from '@/hooks/themes';
import { useRouter } from 'expo-router';

jest.mock('@/context/CartContext');
jest.mock('@/hooks/themes');
jest.mock('expo-router');
jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));


jest.mock('@/components/LoadingSpinner', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Text } = require('react-native');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  const LoadingSpinner = ({ message }: { message: string }) => <Text>{message}</Text>;
  LoadingSpinner.displayName = 'LoadingSpinner';
  const FullScreenLoader = ({ message }: { message: string }) => <Text>{message}</Text>;
  FullScreenLoader.displayName = 'FullScreenLoader';
  return { LoadingSpinner, FullScreenLoader };
});


jest.mock('@/components/CustomAlert', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View, Text, TouchableOpacity } = require('react-native');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  const MockCustomAlert = ({
    visible,
    title,
    message,
    onConfirm,
    onClose,
    showCancel,
    confirmText,
    cancelText,
  }: any) =>
    visible ? (
      <View testID="custom-alert">
        <Text>{title}</Text>
        <Text>{message}</Text>
        <TouchableOpacity onPress={onConfirm}>
          <Text>{confirmText || 'OK'}</Text>
        </TouchableOpacity>
        {showCancel && (
          <TouchableOpacity onPress={onClose}>
            <Text>{cancelText || 'Cancel'}</Text>
          </TouchableOpacity>
        )}
      </View>
    ) : null;
  MockCustomAlert.displayName = 'CustomAlert';
  return MockCustomAlert;
});

const mockRouterBack = jest.fn();
const mockRouterPush = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (useThemes as jest.Mock).mockReturnValue({
    colors: {
      background: '#fff', text: '#000', primary: '#007AFF', surface: '#F2F2F2',
      border: '#CCCCCC', error: '#FF3B30', textSecondary: '#666666',
      textTertiary: '#999999', card: '#fff', shadow: '#000',
    },
  });
  (useRouter as jest.Mock).mockReturnValue({
    back: mockRouterBack,
    push: mockRouterPush,
  });
});

const mockCartData = {
  items: [
    {
      id: 1,
      product_name: 'Test Product',
      product_price: '1000',
      product_image: 'https://example.com/image.png',
      quantity: 2,
    },
  ],
};

const mockEmptyCart = { items: [] };

describe('Cart Tab', () => {
  it('renders empty cart state', () => {
    (useCart as jest.Mock).mockReturnValue({ cart: mockEmptyCart, loading: false, error: null, getCartItemCount: () => 0, getCartTotal: () => 0 });
    const { getByText } = render(<Cart />);
    expect(getByText('Your cart is empty')).toBeTruthy();
  });

  it('renders loading state', () => {
    (useCart as jest.Mock).mockReturnValue({ cart: mockEmptyCart, loading: true, error: null, getCartItemCount: () => 0, getCartTotal: () => 0 });
    const { getByText } = render(<Cart />);
    expect(getByText('Loading cart...')).toBeTruthy();
  });

  it('renders error state and can retry', () => {
    const mockFetchCart = jest.fn();
    const mockClearError = jest.fn();
    (useCart as jest.Mock).mockReturnValue({ cart: mockEmptyCart, loading: false, error: 'Failed to fetch cart', fetchCart: mockFetchCart, clearError: mockClearError });
    const { getByText } = render(<Cart />);
    expect(getByText('Something went wrong')).toBeTruthy();
    fireEvent.press(getByText('Try Again'));
    expect(mockClearError).toHaveBeenCalled();
    expect(mockFetchCart).toHaveBeenCalled();
  });

  it('renders cart items and summary', () => {
    (useCart as jest.Mock).mockReturnValue({ cart: mockCartData, loading: false, error: null, getCartItemCount: () => 2, getCartTotal: () => 2000 });
    const { getByText } = render(<Cart />);
    expect(getByText('Test Product')).toBeTruthy();
    expect(getByText('Items (2)')).toBeTruthy();
    expect(getByText('KSh 2,000')).toBeTruthy();
  });

  it('calls router.push when Proceed to Checkout is pressed', () => {
    (useCart as jest.Mock).mockReturnValue({ cart: mockCartData, loading: false, error: null, getCartItemCount: () => 2, getCartTotal: () => 2000 });
    const { getByText } = render(<Cart />);
    fireEvent.press(getByText('Proceed to Checkout'));
    expect(mockRouterPush).toHaveBeenCalledWith('/(screens)/checkout');
  });

  it('calls router.back when back button is pressed', () => {
    (useCart as jest.Mock).mockReturnValue({ cart: mockCartData, loading: false, error: null, getCartItemCount: () => 2, getCartTotal: () => 2000 });
    const { getByTestId } = render(<Cart />);
    fireEvent.press(getByTestId('back-button'));
    expect(mockRouterBack).toHaveBeenCalled();
  });

  it('shows alert and removes item from cart', async () => {
    const mockRemoveCartItem = jest.fn();
    (useCart as jest.Mock).mockReturnValue({
      cart: mockCartData, loading: false, error: null, removeCartItem: mockRemoveCartItem,
      getCartItemCount: () => 2, getCartTotal: () => 2000,
    });
    const { getByLabelText, findByTestId } = render(<Cart />);
    
    fireEvent.press(getByLabelText('Remove Test Product'));
    
    const alert = await findByTestId('custom-alert');
    expect(within(alert).getByText('Remove Item')).toBeTruthy();
    
    const confirmButton = within(alert).getByText('OK');
    fireEvent.press(confirmButton);
    
    await waitFor(() => {
      // The component calls removeCartItem(1) when quantity becomes 0
      expect(mockRemoveCartItem).toHaveBeenCalledWith(1);
    });
  });

  it('shows alert and clears cart', async () => {
    const mockClearCart = jest.fn();
    (useCart as jest.Mock).mockReturnValue({
      cart: mockCartData, loading: false, error: null, clearCart: mockClearCart,
      getCartItemCount: () => 2, getCartTotal: () => 2000,
    });
    const { getByText, findByTestId } = render(<Cart />);
    
    fireEvent.press(getByText('Clear'));
    
    const alert = await findByTestId('custom-alert');
    expect(within(alert).getByText('Clear Cart')).toBeTruthy();
    
    const confirmButton = within(alert).getByText('OK');
    fireEvent.press(confirmButton);
    
    await waitFor(() => {
      expect(mockClearCart).toHaveBeenCalled();
    });
  });
});
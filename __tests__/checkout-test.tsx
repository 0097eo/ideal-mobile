import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import Checkout from '@/app/(screens)/checkout';
import { useCart } from '@/context/CartContext';
import { useThemes } from '@/hooks/themes';
import { useRouter } from 'expo-router';

jest.mock('@/context/CartContext');
jest.mock('@/hooks/themes');
jest.mock('expo-router');
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue('mock-token'),
}));
jest.mock('@/constants/api', () => ({ 
    API_URL: 'http://mock-api.com' 
}));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));


global.fetch = jest.fn();

const mockRouterReplace = jest.fn();
const mockRouterBack = jest.fn();

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
    },
  });
  (useRouter as jest.Mock).mockReturnValue({
    replace: mockRouterReplace,
    back: mockRouterBack,
  });
  (useCart as jest.Mock).mockReturnValue({
    cart: {
      items: [
        {
          id: 1,
          product_name: 'Test Product',
          product_price: '1000',
          product_image: '',
          quantity: 2,
        },
      ],
    },
    loading: false,
    error: '',
    fetchCart: jest.fn(),
    getCartItemCount: () => 2,
    getCartTotal: () => 2000,
    clearCart: jest.fn(),
    clearError: jest.fn(),
  });
});

describe('Checkout Screen', () => {
  it('renders correctly with cart items', () => {
    const { getByText, getByPlaceholderText } = render(<Checkout />);
    expect(getByText('Checkout')).toBeTruthy();
    expect(getByText('Order Summary')).toBeTruthy();
    expect(getByText('Test Product')).toBeTruthy();
    expect(getByPlaceholderText('Enter your complete shipping address...')).toBeTruthy();
    expect(getByText('Pay on Delivery')).toBeTruthy();
    expect(getByText('M-Pesa')).toBeTruthy();
  });

  it('shows validation errors if required fields are empty', async () => {
    const { getByText } = render(<Checkout />);
    const placeOrderBtn = getByText(/Place Order/i);
    fireEvent.press(placeOrderBtn);
    await waitFor(() => {
      expect(getByText('Shipping address is required')).toBeTruthy();
    });
  });

  it('shows M-Pesa phone input when M-Pesa is selected', () => {
    const { getByText, getByPlaceholderText } = render(<Checkout />);
    fireEvent.press(getByText('M-Pesa'));
    expect(getByPlaceholderText('e.g. 0712345678')).toBeTruthy();
  });

  it('shows error for invalid M-Pesa phone', async () => {
    const { getByText, getByPlaceholderText } = render(<Checkout />);
    fireEvent.press(getByText('M-Pesa'));
    const phoneInput = getByPlaceholderText('e.g. 0712345678');
    fireEvent.changeText(phoneInput, '123');
    fireEvent.press(getByText(/Pay with M-Pesa/i));
    await waitFor(() => {
      expect(getByText(/Please enter a valid Kenyan phone number/)).toBeTruthy();
    });
  });

  it('submits order and shows success alert for COD', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 123 }),
    });
    const { getByText, getByPlaceholderText, queryByText } = render(<Checkout />);
    fireEvent.changeText(getByPlaceholderText('Enter your complete shipping address...'), 'Nairobi');
    fireEvent.press(getByText(/Place Order/i));
    await waitFor(() => {
      expect(queryByText('Order Placed!')).toBeTruthy();
    });
  });

  it('submits order and initiates M-Pesa payment', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 456 }) }) // createOrder
      .mockResolvedValueOnce({ ok: true, json: async () => ({ status: 'pending' }) }); // mpesa
    const { getByText, getByPlaceholderText, queryByText } = render(<Checkout />);
    fireEvent.press(getByText('M-Pesa'));
    fireEvent.changeText(getByPlaceholderText('Enter your complete shipping address...'), 'Nairobi');
    fireEvent.changeText(getByPlaceholderText('e.g. 0712345678'), '0712345678');
    fireEvent.press(getByText(/Pay with M-Pesa/i));
    await waitFor(() => {
      expect(queryByText('Check Your Phone!')).toBeTruthy();
    });
  });

  it('shows error alert if order creation fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Failed to create order' }),
    });
    const { getByText, getByPlaceholderText, queryByText } = render(<Checkout />);
    fireEvent.changeText(getByPlaceholderText('Enter your complete shipping address...'), 'Nairobi');
    fireEvent.press(getByText(/Place Order/i));
    await waitFor(() => {
      expect(queryByText('Order Failed')).toBeTruthy();

      });
  });
});
import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import Index from '@/app/(tabs)/index';
import { useThemes } from '@/hooks/themes';
import { router } from 'expo-router';

jest.mock('@/hooks/themes');
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
  },
}));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

jest.mock('@/components/ProductCard', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View, Text } = require('react-native');
  const MockProductCard = ({ product }: any) => (
    <View>
      <Text>{product.product_name}</Text>
    </View>
  );
  return MockProductCard;
});

jest.mock('@/components/CustomAlert', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
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
  const MockLoadingSpinner = ({ message }: { message: string }) => <Text>{message}</Text>;
  return {
    FullScreenLoader: MockLoadingSpinner,
  };
});

global.fetch = jest.fn();

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
    createStyles: (fn: any) => fn({
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
    }),
  });
});

const mockProducts = {
  count: 1,
  next: null,
  previous: null,
  results: [
    {
      id: 1,
      product_name: 'Test Sofa',
      product_price: '10000',
      product_image: '',
      is_available: true,
      created_at: '2024-06-26T10:00:00Z',
    },
  ],
};

describe('Index Tab', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders hero, categories, features, testimonials, and newsletter', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockProducts,
    });
    const { findByText, getByText } = render(<Index />);
    expect(getByText('Ideal Furniture')).toBeTruthy();
    expect(getByText('"Comfort in style"')).toBeTruthy();
    expect(getByText('Shop by Category')).toBeTruthy();
    expect(getByText('Why Choose Us?')).toBeTruthy();
    expect(getByText('Happy Customers')).toBeTruthy();
    expect(getByText('Stay Updated')).toBeTruthy();
    expect(getByText('Subscribe')).toBeTruthy();
    expect(await findByText('Test Sofa')).toBeTruthy();
  });

  it('shows loading state for trending products', () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));
    const { getByText } = render(<Index />);
    expect(getByText('Loading trending products...')).toBeTruthy();
  });

  it('shows error state for trending products', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce('Simulated network error');
    
    const { findByText } = render(<Index />);
    
    expect(await findByText('Failed to fetch trending products')).toBeTruthy();
    expect(await findByText('Retry')).toBeTruthy();
  });

  it('navigates to shop when View All Products is pressed', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockProducts,
    });
    const { findByText } = render(<Index />);
    const btn = await findByText('View All Products');
    fireEvent.press(btn);
    expect(router.push).toHaveBeenCalledWith('/shop');
  });

  it('shows alert and handles newsletter signup', async () => {
    jest.useFakeTimers();

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockProducts,
    });

    const { getByPlaceholderText, getByText, findByTestId } = render(<Index />);
    const input = getByPlaceholderText('Enter your email');
    fireEvent.changeText(input, 'test@example.com');
    fireEvent.press(getByText('Subscribe'));

    act(() => {
      jest.runAllTimers();
    });

    const alert = await findByTestId('custom-alert');
    expect(alert).toBeTruthy();
  });
});
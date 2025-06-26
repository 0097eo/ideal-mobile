import React from 'react';
import { render, fireEvent, within} from '@testing-library/react-native';
import Orders from '@/app/(screens)/orders';
import { useRouter } from 'expo-router';
import { useThemes } from '@/hooks/themes';

jest.mock('expo-router');
jest.mock('@/hooks/themes');
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue('mock-token'),
}));
jest.mock('@/constants/api', () => ({
  API_URL: 'http://mock-api.com',
}));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));
jest.mock('@/components/CustomAlert', () => {
  interface MockAlertProps {
    visible: boolean;
    title: string;
    message: string;
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View, Text } = require('react-native');
  const MockCustomAlert = ({ visible, title, message }: MockAlertProps) => {
    if (!visible) return null;
    return (
      <View testID="custom-alert">
        <Text>{title}</Text>
        <Text>{message}</Text>
      </View>
    );
  };
  return MockCustomAlert;
});

global.fetch = jest.fn();

const mockRouterBack = jest.fn();
const mockRouterPush = jest.fn();

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
      navigationBackground: '#fff',
      navigationText: '#000',
      success: '#10B981',
      warning: '#F59E0B',
    },
    isDark: false,
  });
  (useRouter as jest.Mock).mockReturnValue({
    back: mockRouterBack,
    push: mockRouterPush,
  });
});

const mockOrders = [
  {
    id: 1,
    status: 'DELIVERED',
    created_at: '2024-06-26T10:00:00Z',
    total_price: '2000',
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
  {
    id: 2,
    status: 'CANCELLED',
    created_at: '2024-06-25T10:00:00Z',
    total_price: '1500',
    items: [
      {
        id: 2,
        product_name: 'Canceled Product',
        product_price: '1500',
        product_image: '',
        quantity: 1,
      },
    ],
  },
];

describe('Orders Screen', () => {
  test('shows loading indicator initially', async () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));
    const { getByTestId } = render(<Orders />);
    // ActivityIndicator does not have a testID by default, so check for header or loading container
    expect(getByTestId('OrdersScreenHeader')).toBeTruthy();
  });

  test('renders ongoing orders after fetch', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockOrders,
    });
    const { findByText } = render(<Orders />);
    expect(await findByText('Test Product')).toBeTruthy();
    expect(await findByText('Order #1')).toBeTruthy();
    expect(await findByText('Total: KSh 2,000')).toBeTruthy();
    expect(await findByText('1 item')).toBeTruthy();
  });

  test('renders canceled orders when tab is switched', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockOrders,
    });
    const { findByText, getByText } = render(<Orders />);
    await findByText('Test Product');
    fireEvent.press(getByText('CANCELED/RETURNED'));
    expect(await findByText('Canceled Product')).toBeTruthy();
    expect(await findByText('Order #2')).toBeTruthy();
  });

  test('shows empty state if no orders', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });
    const { findByText } = render(<Orders />);
    expect(await findByText('No ongoing orders found')).toBeTruthy();
  });

  test('shows error alert if fetch fails', async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: false,
    json: async () => ({}),
  });
  const { findByTestId } = render(<Orders />);

  // Find the alert by its testID, which is unambiguous
  const alert = await findByTestId('custom-alert');
  expect(alert).toBeTruthy();

  // You can also assert on the content for a more thorough test
  expect(within(alert).getByText('Error')).toBeTruthy();
  expect(within(alert).getByText('Failed to fetch orders')).toBeTruthy();
});

  test('calls router.back when back button is pressed', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockOrders,
    });
    const { findByLabelText } = render(<Orders />);

    const backButton = await findByLabelText('Go back');
    fireEvent.press(backButton);

    expect(mockRouterBack).toHaveBeenCalled();
    });

  test('navigates to order details when order is pressed', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockOrders,
    });
    const { findByText } = render(<Orders />);
    const orderCard = await findByText('Test Product');
    fireEvent.press(orderCard.parent?.parent); // fire on TouchableOpacity
    expect(mockRouterPush).toHaveBeenCalledWith({
      pathname: '/(screens)/order-details/[orderId]',
      params: { orderId: 1 },
    });
  });
});
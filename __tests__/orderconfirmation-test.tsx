import React from 'react';
import { render, fireEvent, within } from '@testing-library/react-native';
import OrderConfirmation from '@/app/(screens)/orderConfirmation';
import { useThemes } from '@/hooks/themes';
import { useRouter, useLocalSearchParams } from 'expo-router';

jest.mock('@/hooks/themes');
jest.mock('expo-router');

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue('mock-token'),
}));

jest.mock('@expo/vector-icons', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require('react-native');
  return {
    Ionicons: (props: any) => <View testID={`icon-${props.name}`} />,
  };
});

jest.mock('@/components/LoadingSpinner', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Text } = require('react-native');
  return {
    FullScreenLoader: ({ message }: { message: string }) => <Text>{message}</Text>,
  };
});

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
jest.mock('@/constants/api', () => ({ API_URL: 'http://mock-api.com' }));
const mockRouterBack = jest.fn();
const mockRouterReplace = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (useThemes as jest.Mock).mockReturnValue({ colors: {  } });
  (useRouter as jest.Mock).mockReturnValue({ back: mockRouterBack, replace: mockRouterReplace });
  (useLocalSearchParams as jest.Mock).mockReturnValue({ orderId: 1 });
});

const mockOrder = {
  id: 1, status: 'confirmed', shipping_address: 'Nairobi, Kenya',
  billing_address: 'Nairobi, Kenya', total_price: '2000',
  created_at: '2024-06-26T10:00:00Z', updated_at: '2024-06-26T10:00:00Z',
  items: [{ id: 1, product_name: 'Test Product', product_price: '1000', product_image: '', quantity: 2 }],
};

describe('OrderConfirmation Screen', () => {
  test('shows loading state initially', () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));
    const { getByText } = render(<OrderConfirmation />);
    expect(getByText('Loading order details...')).toBeTruthy();
  });

  test('renders order details after successful fetch', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => mockOrder });
    const { findByText, findByTestId } = render(<OrderConfirmation />);
    
    expect(await findByText('Order Confirmed!')).toBeTruthy();
    expect(await findByText('Test Product')).toBeTruthy();
    
    const orderTotal = await findByTestId('order-total-price');
    expect(orderTotal).toHaveTextContent('KSh 2,000');
    
    expect(await findByText('Delivery Information')).toBeTruthy();
  });

  test('shows error state if fetch fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({ error: 'Order not found' }) });
    const { findByText } = render(<OrderConfirmation />);
    expect(await findByText('Something went wrong')).toBeTruthy();
    expect(await findByText('Order not found')).toBeTruthy();
  });

  test('calls router.back when error header back button is pressed', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 404 });
    const { findByLabelText } = render(<OrderConfirmation />);
    const backBtn = await findByLabelText('Back');
    fireEvent.press(backBtn);
    expect(mockRouterBack).toHaveBeenCalled();
  });

    test('shows the custom alert when track order is pressed', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockOrder,
    });
    const { findByText, findByTestId } = render(<OrderConfirmation />);

    const trackOrderButton = await findByText('Track Order');
    fireEvent.press(trackOrderButton);

    const alert = await findByTestId('custom-alert');

    expect(alert).toBeTruthy();

    expect(within(alert).getByText('Track Order')).toBeTruthy();
    expect(within(alert).getByText('Order tracking functionality will be available soon.')).toBeTruthy();
    });
});
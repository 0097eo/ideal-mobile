import React from 'react';
import { render, fireEvent, waitFor, act, within } from '@testing-library/react-native';
import OrderDetails from '@/app/(screens)/order-details/[orderId]';
import * as SecureStore from 'expo-secure-store';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useThemes } from '@/hooks/themes';

jest.mock('expo-router', () => ({
    useRouter: jest.fn(),
    useLocalSearchParams: jest.fn(),
}));
jest.mock('expo-secure-store');
jest.mock('@/hooks/themes', () => ({
    useThemes: jest.fn(),
}));

jest.mock('@/components/CustomAlert', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Modal, Text, TouchableOpacity, View } = require('react-native');

    interface MockAlertProps {
        visible: boolean;
        title: string;
        message: string;
        onClose: () => void;
        onConfirm: () => void;
        confirmText?: string;
        cancelText?: string;
        showCancel?: boolean;
    }

    const MockCustomAlert = ({
        visible,
        title,
        message,
        onClose,
        onConfirm,
        confirmText,
        cancelText,
        showCancel,
    }: MockAlertProps) => {
        if (!visible) {
            return null;
        }
        return (
            <Modal visible={visible} transparent={true} testID="custom-alert">
                <View>
                    <Text>{title}</Text>
                    <Text>{message}</Text>
                    {showCancel && (
                        <TouchableOpacity onPress={onClose}>
                            <Text>{cancelText}</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={onConfirm}>
                        <Text>{confirmText}</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        );
    };

    MockCustomAlert.displayName = 'CustomAlert';
    return MockCustomAlert;
});


jest.mock('@/components/LoadingSpinner', () => ({
    LoadingSpinner: () => null,
    FullScreenLoader: () => null,
}));
jest.mock('@expo/vector-icons', () => ({
    Ionicons: 'Ionicons',
}));

const mockOrder = {
    id: 123,
    created_at: '2024-06-01T12:34:56Z',
    status: 'PENDING',
    user_email: 'test@example.com',
    shipping_address: '123 Test St',
    billing_address: '456 Bill Ave',
    items: [
        {
            id: 1,
            product_name: 'Product 1',
            product_price: 1000,
            product_image: '',
            quantity: 2,
            subtotal: 2000,
        },
        {
            id: 2,
            product_name: 'Product 2',
            product_price: 500,
            product_image: '',
            quantity: 1,
            subtotal: 500,
        },
    ],
    total_price: 2500,
};

const mockColors = {
    background: '#fff',
    card: '#f8f8f8',
    surface: '#f0f0f0',
    border: '#ccc',
    shadow: '#000',
    text: '#222',
    textSecondary: '#666',
    textTertiary: '#aaa',
    navigationBackground: '#fff',
    navigationText: '#222',
    primary: '#007bff',
    error: '#d32f2f',
    warning: '#ffa000',
    success: '#388e3c',
};

describe('OrderDetails', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (useRouter as jest.Mock).mockReturnValue({ back: jest.fn() });
        (useLocalSearchParams as jest.Mock).mockReturnValue({ orderId: '123' });
        (useThemes as jest.Mock).mockReturnValue({ colors: mockColors, isDark: false });
        (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('mock-token');
        global.fetch = jest.fn();
    });

    it('renders loading state initially', async () => {
        (fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));
        const { getByText } = render(<OrderDetails />);
        expect(getByText('Order Details')).toBeTruthy();
    });

    it('renders "Order not found" if order fetch fails', async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            json: async () => ({}),
        });
        const { getByText } = render(<OrderDetails />);
        await waitFor(() => {
            expect(getByText('Order not found')).toBeTruthy();
        });
    });

    it('renders order details after successful fetch', async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockOrder,
        });
        const { getByText } = render(<OrderDetails />);
        await waitFor(() => {
            expect(getByText('Order #123')).toBeTruthy();
            expect(getByText('Product 1')).toBeTruthy();
        });
    });


    it('shows address modal when pencil icon is pressed', async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockOrder,
        });
        const { getByTestId, getByText, queryByText } = render(<OrderDetails />);
        await waitFor(() => expect(getByText('Addresses')).toBeTruthy());
        
        const pencilButton = getByTestId('edit-address-button');
        fireEvent.press(pencilButton);
        
        await waitFor(() => {
            expect(queryByText('Update Order Addresses')).toBeTruthy();
        });
    });

    it('shows cancel confirmation alert when Cancel Order is pressed', async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockOrder,
        });
        const { getByTestId } = render(<OrderDetails />);

        const cancelButton = await waitFor(() => getByTestId('cancel-order-button'));
        fireEvent.press(cancelButton);
        
        await waitFor(() => {
            const alert = getByTestId('custom-alert');
            // Then assert that the text is *within* the alert
            expect(within(alert).getByText('Cancel Order')).toBeTruthy();
            expect(within(alert).getByText('Are you sure you want to cancel this order? This action cannot be undone.')).toBeTruthy();
        });
    });

    it('calls cancelOrder and shows success alert on successful cancel', async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce({ ok: true, json: async () => mockOrder }) // fetchOrderDetails
            .mockResolvedValueOnce({ ok: true, json: async () => ({ message: 'Order cancelled' }) }); // cancelOrder

        const { getByText } = render(<OrderDetails />);
        await waitFor(() => expect(getByText('Cancel Order')).toBeTruthy());
        
        fireEvent.press(getByText('Cancel Order'));
        await waitFor(() => expect(getByText('Yes, Cancel')).toBeTruthy());
        
        await act(async () => {
            fireEvent.press(getByText('Yes, Cancel'));
        });

        await waitFor(() => {
            expect(getByText('Order Cancelled')).toBeTruthy();
            expect(getByText('Order cancelled')).toBeTruthy();
        });
    });

    it('shows error alert if cancelOrder fails', async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce({ ok: true, json: async () => mockOrder }) // fetchOrderDetails
            .mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Failed to cancel order' }) }); // cancelOrder

        const { getByText } = render(<OrderDetails />);
        await waitFor(() => expect(getByText('Cancel Order')).toBeTruthy());
        
        fireEvent.press(getByText('Cancel Order'));
        await waitFor(() => expect(getByText('Yes, Cancel')).toBeTruthy());
        
        await act(async () => {
            fireEvent.press(getByText('Yes, Cancel'));
        });

        await waitFor(() => {
            expect(getByText('Error')).toBeTruthy();
            expect(getByText('Failed to cancel order')).toBeTruthy();
        });
    });

    it('shows info alert if no address changes are made', async () => {
        (fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockOrder,
        });
        const { getByText, getByTestId } = render(<OrderDetails />);
        await waitFor(() => expect(getByText('Addresses')).toBeTruthy());
        
        fireEvent.press(getByTestId('edit-address-button'));
        
        await waitFor(() => expect(getByText('Update Order Addresses')).toBeTruthy());
        fireEvent.press(getByText('Update'));
        
        await waitFor(() => {
            expect(getByText('No Changes')).toBeTruthy();
            expect(getByText('No address changes were made.')).toBeTruthy();
        });
    });

    it('updates addresses and shows success alert', async () => {
        (fetch as jest.Mock)
            .mockResolvedValueOnce({ ok: true, json: async () => mockOrder }) // fetchOrderDetails
            .mockResolvedValueOnce({ ok: true, json: async () => ({ ...mockOrder, shipping_address: 'New Address' }) }); // updateOrderAddress

        const { getByText, getByPlaceholderText, getByTestId } = render(<OrderDetails />);
        await waitFor(() => expect(getByText('Addresses')).toBeTruthy());
        
        fireEvent.press(getByTestId('edit-address-button'));
        
        await waitFor(() => expect(getByText('Update Order Addresses')).toBeTruthy());
        fireEvent.changeText(getByPlaceholderText('Enter shipping address'), 'New Address');
        fireEvent.press(getByText('Update'));

        await waitFor(() => {
            expect(getByText('Success')).toBeTruthy();
            expect(getByText('Order addresses updated successfully')).toBeTruthy();
        });
    });
});
import React from 'react';
import { render, fireEvent, waitFor, act, within } from '@testing-library/react-native';
import Reviews from '@/app/(screens)/reviews';


jest.mock('@react-navigation/native', () => ({
    useNavigation: () => ({
        goBack: jest.fn(),
    }),
}));
jest.mock('@/hooks/themes', () => ({
    useThemes: () => ({
        colors: { /* ... A minimal color object ... */ },
        // Add a dummy useStyles function that returns an empty object
        useStyles: (fn: any) => fn({ /* ... colors ... */ }),
    }),
}));
jest.mock('expo-secure-store', () => ({
    getItemAsync: jest.fn(() => Promise.resolve('mock-token')),
}));
jest.mock('@/constants/api', () => ({
    API_URL: 'http://mock.api',
}));

jest.mock('@/components/CustomAlert', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { View, Text, TouchableOpacity } = require('react-native');
    const MockCustomAlert = ({ visible, title, message, onConfirm, confirmText, showCancel, onClose }: any) => {
        if (!visible) return null;

        const handleConfirm = () => {
            if (onConfirm) onConfirm();
            else if (onClose) onClose();
        };

        return (
            <View testID="custom-alert">
                <Text>{title}</Text>
                <Text>{message}</Text>
                {showCancel && (
                    <TouchableOpacity onPress={onClose} testID="alert-cancel-button">
                       <Text>Cancel</Text>
                    </TouchableOpacity>
                )}
                 <TouchableOpacity onPress={handleConfirm} testID="alert-confirm-button">
                    <Text>{confirmText || 'OK'}</Text>
                </TouchableOpacity>
            </View>
        );
    };
    MockCustomAlert.displayName = 'CustomAlert';
    return MockCustomAlert;
});
jest.mock('@expo/vector-icons', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { TouchableOpacity } = require('react-native');
    return {
        Ionicons: ({ testID, onPress }: any) => (
            <TouchableOpacity testID={testID} onPress={onPress} />
        ),
    };
});

jest.mock('@/components/LoadingSpinner', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { View, Text } = require('react-native');
    const MockLoader = ({ message }: { message?: string }) => (
        <View>
            <Text>{message}</Text>
        </View>
    );
    MockLoader.displayName = 'MockLoader';
    return {
        FullScreenLoader: MockLoader,
        LoadingSpinner: MockLoader,
    };
});

global.fetch = jest.fn();

const mockDeliveredOrders = [
    { id: 1, status: 'DELIVERED', items: [{ product: 101, product_name: 'Product 1', product_price: '1000', product_image: 'http://img/1.png' }] },
];
const mockProduct101 = { id: 101, name: 'Product 1', price: '1000', image: 'http://img/1.png', category_name: 'Category A', stock: 10, primary_material: 'WOOD' as const, condition: 'NEW' as const, is_available: true, created_at: '2024-01-01T00:00:00Z' };
const mockUserReviews = [{ id: 10, rating: 4, comment: 'Great product!', product: mockProduct101, created_at: '2024-01-01T00:00:00Z' }];

describe('Reviews Screen', () => {
    beforeEach(() => {
        (fetch as jest.Mock).mockClear();
    });

    it('renders loading state initially', async () => {
        (fetch as jest.Mock).mockReturnValue(new Promise(() => {}));
        const { findByText } = render(<Reviews />);
        expect(await findByText('Loading reviews...')).toBeTruthy();
    });

    const mockInitialFetch = (orders: any[], reviews: any[]) => {
        (fetch as jest.Mock)
            .mockImplementationOnce(() => Promise.resolve({ ok: true, json: () => Promise.resolve(orders) }))
            .mockImplementationOnce(() => Promise.resolve({ ok: true, json: () => Promise.resolve(reviews) }));
    };

    it('renders pending reviews tab with empty state', async () => {
        mockInitialFetch([], []);
        const { getByText, findByText } = render(<Reviews />);
        await findByText('Pending Reviews (0)');
        expect(getByText('No products to review')).toBeTruthy();
    });

    it('renders a review in completed tab', async () => {
        mockInitialFetch(mockDeliveredOrders, mockUserReviews);
        const { getByText, findByText } = render(<Reviews />);
        await findByText('My Reviews (1)');
        fireEvent.press(getByText('My Reviews (1)'));
        expect(getByText('Product 1')).toBeTruthy();
        expect(getByText('Great product!')).toBeTruthy();
    });

    it('renders a product awaiting review in pending tab', async () => {
        mockInitialFetch(mockDeliveredOrders, []);
        const { getByText, findByText } = render(<Reviews />);
        await findByText('Pending Reviews (1)');
        expect(getByText('Product 1')).toBeTruthy();
        expect(getByText('Write Review')).toBeTruthy();
    });

    it('opens and closes the review modal', async () => {
        mockInitialFetch(mockDeliveredOrders, []);
        const { findByTestId, queryByText, getByText } = render(<Reviews />);
        const writeReviewButton = await findByTestId('write-review-button-101');
        fireEvent.press(writeReviewButton);

        expect(getByText('Submit')).toBeTruthy();

        fireEvent.press(getByText('Cancel'));
        await waitFor(() => {
            expect(queryByText('Submit')).toBeNull();
        });
    });

    it('submits a new review successfully', async () => {
        mockInitialFetch(mockDeliveredOrders, []);
        (fetch as jest.Mock)
            .mockImplementationOnce(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) })) // POST review
            .mockImplementationOnce(() => Promise.resolve({ ok: true, json: () => Promise.resolve(mockUserReviews) })); // Refresh reviews

        const { getByTestId, getByText, findByTestId, getByPlaceholderText, findByText } = render(<Reviews />);
        
        const writeReviewButton = await findByTestId('write-review-button-101');
        fireEvent.press(writeReviewButton);

        fireEvent.press(getByTestId('star-rating-5'));
        fireEvent.changeText(getByPlaceholderText('Share your experience with this product...'), 'Awesome!');
        
        await act(async () => {
          fireEvent.press(getByText('Submit'));
        });

        await findByText('Review submitted successfully!');
    });

    it('deletes a review successfully', async () => {
        mockInitialFetch(mockDeliveredOrders, mockUserReviews);
        (fetch as jest.Mock)
          .mockImplementationOnce(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }))
          .mockImplementationOnce(() => Promise.resolve({ ok: true, json: () => Promise.resolve([]) }));

        const { getByText, findByText, getByTestId } = render(<Reviews />);
        await findByText('My Reviews (1)');
        fireEvent.press(getByText('My Reviews (1)'));

        fireEvent.press(getByTestId('delete-review-button-10'));

        const alert = await getByTestId('custom-alert');
        expect(within(alert).getByText('Delete Review')).toBeTruthy();

        const confirmButton = within(alert).getByTestId('alert-confirm-button');
        
        await act(async () => {
            fireEvent.press(confirmButton);
        });

        await findByText('Review deleted successfully');

        expect(await findByText('My Reviews (0)')).toBeTruthy();
    });
});
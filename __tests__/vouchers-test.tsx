import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Vouchers from '@/app/(screens)/vouchers';

// Mock hooks and modules
jest.mock('@/hooks/themes', () => ({
    useThemes: () => ({
        colors: {
            background: '#fff',
            navigationBackground: '#f8f8f8',
            border: '#eee',
            navigationText: '#111',
            primary: '#123456',
            shadow: '#000',
            text: '#222',
            textSecondary: '#444',
            textTertiary: '#666',
            surface: '#fafafa',
        },
        isDark: false,
    }),
}));

const mockBack = jest.fn();
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
    router: {
        back: () => mockBack(),
        push: (route: string) => mockPush(route),
    },
}));

jest.mock('@expo/vector-icons', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Text } = require('react-native');
    return {
        Ionicons: (props: any) => <Text {...props}>{props.name}</Text>,
    };
});

describe('Vouchers Screen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders header and main texts', () => {
        const { getByText } = render(<Vouchers />);
        expect(getByText('Vouchers')).toBeTruthy();
        expect(getByText('No Vouchers Yet!')).toBeTruthy();
        expect(getByText(/exciting deals are coming/i)).toBeTruthy();
        expect(getByText(/amazing vouchers and exclusive discounts/i)).toBeTruthy();
    });

    it('renders Browse Products and Notify Me buttons', () => {
        const { getByText } = render(<Vouchers />);
        expect(getByText('Browse Products')).toBeTruthy();
        expect(getByText('Notify Me')).toBeTruthy();
    });

    it('navigates back when back button is pressed', () => {
        const { getByTestId } = render(<Vouchers />);
 
        const backButtonIcon = getByTestId('arrow-back-button');
   
        fireEvent.press(backButtonIcon);
        expect(mockBack).toHaveBeenCalledTimes(1);
    });

    it('navigates to /tabs when Browse Products is pressed', () => {
        const { getByText } = render(<Vouchers />);
        fireEvent.press(getByText('Browse Products'));
        expect(mockPush).toHaveBeenCalledWith('/(tabs)');
    });

    it('calls console.log when Notify Me is pressed', () => {
        const logSpy = jest.spyOn(console, 'log').mockImplementation();
        const { getByText } = render(<Vouchers />);
        fireEvent.press(getByText('Notify Me'));
        expect(logSpy).toHaveBeenCalledWith('User wants to be notified about new vouchers');
        logSpy.mockRestore();
    });

    it('renders features section', () => {
        const { getByText } = render(<Vouchers />);
        expect(getByText("What's Coming Soon")).toBeTruthy();
        expect(getByText(/Exclusive discount vouchers up to 70% off/i)).toBeTruthy();
        expect(getByText(/Flash sale vouchers for limited-time offers/i)).toBeTruthy();
        expect(getByText(/Free shipping vouchers for all orders/i)).toBeTruthy();
        expect(getByText(/VIP member exclusive vouchers and early access/i)).toBeTruthy();
    });
});
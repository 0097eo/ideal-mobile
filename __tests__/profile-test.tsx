import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import Profile from '@/app/(screens)/profile';

// Mocks
const mockBack = jest.fn();
const mockUser = {
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    phone_number: '+1234567890',
    user_type: 'customer',
    is_verified: true,
};

jest.mock('@/context/AuthContext', () => ({
    useAuth: () => ({
        user: mockUser,
        token: 'mock-token',
        updateUser: jest.fn(), // Mock the updateUser function if it's called
    }),
}));

jest.mock('@/hooks/themes', () => ({
    useThemes: () => ({
        colors: {},
        createStyles: (fn: any) => fn({}),
    }),
}));

jest.mock('@/constants/api', () => ({
    API_URL: 'https://mock.api',
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

jest.mock('expo-router', () => ({
    useRouter: () => ({
        back: mockBack, // Use the mock function defined at the top
    }),
}));

jest.mock('@expo/vector-icons', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Text } = require('react-native');
    return {
        Ionicons: (props: {name: string}) => <Text>{props.name}</Text>,
    };
});

describe('Profile Screen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        global.fetch = jest.fn();
    });

    it('renders profile form with initial user data', () => {
        const { getByDisplayValue, getByText } = render(<Profile />);
        expect(getByDisplayValue('John')).toBeTruthy();
        expect(getByDisplayValue('Doe')).toBeTruthy();
        expect(getByDisplayValue('john@example.com')).toBeTruthy();
        expect(getByDisplayValue('+1234567890')).toBeTruthy();
        expect(getByText('customer')).toBeTruthy();
        expect(getByText('Verified')).toBeTruthy();
    });

    it('shows validation errors for empty required fields', async () => {
        const { getByText, getByPlaceholderText } = render(<Profile />);
        fireEvent.changeText(getByPlaceholderText('Enter your first name'), '');
        fireEvent.changeText(getByPlaceholderText('Enter your last name'), '');
        fireEvent.changeText(getByPlaceholderText('Enter your email address'), '');
        fireEvent.press(getByText('Save Changes'));
        await waitFor(() => {
            expect(getByText('First name is required')).toBeTruthy();
            expect(getByText('Last name is required')).toBeTruthy();
            expect(getByText('Email is required')).toBeTruthy();
        });
    });

    it('shows validation error for invalid email', async () => {
        const { getByText, getByPlaceholderText } = render(<Profile />);
        fireEvent.changeText(getByPlaceholderText('Enter your email address'), 'invalid-email');
        fireEvent.press(getByText('Save Changes'));
        await waitFor(() => {
            expect(getByText('Please enter a valid email address')).toBeTruthy();
        });
    });

    it('shows validation error for invalid phone number', async () => {
        const { getByText, getByPlaceholderText } = render(<Profile />);
        fireEvent.changeText(getByPlaceholderText('Enter your phone number'), 'abc');
        fireEvent.press(getByText('Save Changes'));
        await waitFor(() => {
            expect(getByText('Please enter a valid phone number')).toBeTruthy();
        });
    });

    it('calls API and shows success alert on valid save', async () => {
        (fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({ ...mockUser, first_name: 'Johnny' }),
        });

        const { getByText, queryByText } = render(<Profile />);
        fireEvent.press(getByText('Save Changes'));
        
        await waitFor(() => {
            expect(getByText('Success')).toBeTruthy();
            expect(getByText('Profile updated successfully!')).toBeTruthy();
        });

        expect(global.fetch).toHaveBeenCalledWith(
            'https://mock.api/accounts/profile/',
            expect.objectContaining({
                method: 'PUT',
                headers: expect.objectContaining({
                    'Authorization': 'Bearer mock-token',
                }),
            })
        );

        expect(queryByText('Success')).not.toBeNull();
    });

    it('shows backend validation errors from API', async () => {
        (fetch as jest.Mock).mockResolvedValue({
            ok: false,
            status: 400,
            json: async () => ({
                first_name: ['First name error'],
                email: ['Email error'],
            }),
        });

        const { getByText } = render(<Profile />);
        fireEvent.press(getByText('Save Changes'));
        await waitFor(() => {
            expect(getByText('First name error')).toBeTruthy();
            expect(getByText('Email error')).toBeTruthy();
        });
    });

    it('shows general error alert on API failure', async () => {
        (fetch as jest.Mock).mockResolvedValue({
            ok: false,
            status: 500,
            json: async () => ({ detail: 'Server error' }),
        });

        const { getByText } = render(<Profile />);
        fireEvent.press(getByText('Save Changes'));
        await waitFor(() => {
            expect(getByText('Error')).toBeTruthy();
            expect(getByText('Server error')).toBeTruthy();
        });
    });

    it('shows loading indicator while saving', async () => {
        // Mock a fetch that never resolves to keep the component in its loading state.
        global.fetch = jest.fn(() => new Promise(() => {}));

        const { getByText, findByTestId, queryByText } = render(<Profile />);

        fireEvent.press(getByText('Save Changes'));

        const loadingIndicator = await findByTestId('loading-indicator');
        expect(loadingIndicator).toBeTruthy();

        expect(queryByText('Save Changes')).toBeNull();
    });

    it('calls router.back when back button is pressed', () => {
        const { getByTestId } = render(<Profile />);
        fireEvent.press(getByTestId('profile-back-button'));
        expect(mockBack).toHaveBeenCalledTimes(1);
    });
});
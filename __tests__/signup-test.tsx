import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import SignupPage from '@/app/(auth)/signup';

jest.mock('@/hooks/themes', () => ({
  useThemes: () => ({
    colors: {
      background: '#FFFFFF',
      text: '#000000',
      primary: '#007AFF',
      surface: '#F2F2F2',
      border: '#CCCCCC',
      error: '#FF3B30',
      textSecondary: '#666666',
      textTertiary: '#999999',
      divider: '#E5E5E5',
    },
  }),
}));

const mockRouterPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Icon',
}));

jest.mock('@/components/LoadingSpinner', () => ({
  LoadingSpinner: 'LoadingSpinner',
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

jest.mock('@/constants/api', () => ({
  API_URL: 'http://mock-api.com',
}));
global.fetch = jest.fn();

const mockFetch = global.fetch as jest.Mock;

describe('SignupPage Component', () => {

  beforeEach(() => {
    mockRouterPush.mockClear();
    mockFetch.mockClear();
    jest.useRealTimers(); // Ensure we use real timers unless specified
  });

  const fillOutForm = (overrides = {}) => {
    const defaultData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    };
    const data = { ...defaultData, ...overrides };

    fireEvent.changeText(screen.getByPlaceholderText('John'), data.firstName);
    fireEvent.changeText(screen.getByPlaceholderText('Doe'), data.lastName);
    fireEvent.changeText(screen.getByPlaceholderText('john.doe@example.com'), data.email);
    fireEvent.changeText(screen.getByPlaceholderText('Enter your password'), data.password);
    fireEvent.changeText(screen.getByPlaceholderText('Confirm your password'), data.confirmPassword);
  };

  test('renders the initial signup form correctly', () => {
    render(<SignupPage />);
    expect(screen.getByText('Create Account')).toBeOnTheScreen();
    expect(screen.getByPlaceholderText('John')).toBeOnTheScreen();
    expect(screen.getByPlaceholderText('Doe')).toBeOnTheScreen();
    expect(screen.getByPlaceholderText('john.doe@example.com')).toBeOnTheScreen();
    expect(screen.getByPlaceholderText('Enter your password')).toBeOnTheScreen();
    expect(screen.getByPlaceholderText('Confirm your password')).toBeOnTheScreen();
    expect(screen.getByText('Sign Up')).toBeOnTheScreen();
  });

  test('shows validation errors for all empty fields on submit', async () => {
    render(<SignupPage />);
    const signupButton = screen.getByText('Sign Up');
    fireEvent.press(signupButton);

    expect(await screen.findByText('First name is required')).toBeOnTheScreen();
    expect(screen.getByText('Last name is required')).toBeOnTheScreen();
    expect(screen.getByText('Email is required')).toBeOnTheScreen();
    expect(screen.getByText('Password is required')).toBeOnTheScreen();
    expect(screen.getByText('Please confirm your password')).toBeOnTheScreen();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  test('shows validation error for invalid email format', async () => {
    render(<SignupPage />);
    fillOutForm({ email: 'invalid-email' });
    
    const signupButton = screen.getByText('Sign Up');
    fireEvent.press(signupButton);

    expect(await screen.findByText('Please enter a valid email address')).toBeOnTheScreen();
    expect(mockFetch).not.toHaveBeenCalled();
  });
  
  test('shows validation error for short password', async () => {
    render(<SignupPage />);
    fillOutForm({ password: '123', confirmPassword: '123' });

    fireEvent.press(screen.getByText('Sign Up'));
    
    expect(await screen.findByText('Password must be at least 6 characters')).toBeOnTheScreen();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  test('shows validation error when passwords do not match', async () => {
    render(<SignupPage />);
    fillOutForm({ confirmPassword: 'differentpassword' });

    fireEvent.press(screen.getByText('Sign Up'));

    expect(await screen.findByText('Passwords do not match')).toBeOnTheScreen();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  test('handles successful signup and navigation', async () => {
    jest.useFakeTimers();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'Registration successful!' }),
    });

    render(<SignupPage />);
    fillOutForm();

    const signupButton = screen.getByText('Sign Up');
    fireEvent.press(signupButton);

    expect(screen.getByText('Creating Account...')).toBeOnTheScreen();

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('http://mock-api.com/accounts/signup/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: 'John',
          last_name: 'Doe',
          email: 'john.doe@example.com',
          password: 'password123',
        }),
      });
    });

    expect(await screen.findByTestId('custom-alert')).toBeOnTheScreen();
    expect(screen.getByText('Account Created!')).toBeOnTheScreen();
    expect(screen.getByText('Registration successful!')).toBeOnTheScreen();

    // Fast-forward time to trigger navigation
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith('/(auth)/verify?email=john.doe%40example.com');
    });
  });

  test('handles failed signup due to existing email', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ message: 'user with this email already exists.' }),
    });

    render(<SignupPage />);
    fillOutForm();

    fireEvent.press(screen.getByText('Sign Up'));

    await waitFor(() => {
      expect(screen.getByText('Signup Failed')).toBeOnTheScreen();
      expect(screen.getByText(/An account with this email already exists/)).toBeOnTheScreen();
    });
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  test('navigates to login page when "Sign In" is pressed', () => {
    render(<SignupPage />);
    const loginLink = screen.getByText('Sign In');
    fireEvent.press(loginLink);
    expect(mockRouterPush).toHaveBeenCalledWith('/login');
  });
  
  test('displays password strength indicator correctly', () => {
    render(<SignupPage />);
    const passwordInput = screen.getByPlaceholderText('Enter your password');

    fireEvent.changeText(passwordInput, '123');
    expect(screen.getByText('Password Strength: Weak')).toBeOnTheScreen();

    fireEvent.changeText(passwordInput, '123456');
    expect(screen.getByText('Password Strength: Medium')).toBeOnTheScreen();

    fireEvent.changeText(passwordInput, '12345678');
    expect(screen.getByText('Password Strength: Strong')).toBeOnTheScreen();
  });
});
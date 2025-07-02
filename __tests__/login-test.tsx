import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import LoginPage from '@/app/(auth)/login';

const mockLogin = jest.fn();
jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    isLoading: false,
  }),
}));

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
    if (!visible) {
      return null;
    }
    return (
      <View testID="custom-alert">
        <Text>{title}</Text>
        <Text>{message}</Text>
      </View>
    );
  };
  return MockCustomAlert;
});


describe('LoginPage Component', () => {

  beforeEach(() => {
    mockLogin.mockClear();
    mockRouterPush.mockClear();
  });

  test('renders the initial login form correctly', () => {
    render(<LoginPage />);

    expect(screen.getByText('Welcome Back')).toBeOnTheScreen();
    expect(screen.getByPlaceholderText('Enter your email')).toBeOnTheScreen();
    expect(screen.getByPlaceholderText('Enter your password')).toBeOnTheScreen();
    expect(screen.getByText('Sign In')).toBeOnTheScreen();
  });

  test('shows validation errors for empty fields on submit', async () => {
    render(<LoginPage />);

    const loginButton = screen.getByText('Sign In');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeOnTheScreen();
      expect(screen.getByText('Password is required')).toBeOnTheScreen();
    });

    expect(mockLogin).not.toHaveBeenCalled();
  });

  test('shows validation error for invalid email format', async () => {
    render(<LoginPage />);

    const emailInput = screen.getByPlaceholderText('Enter your email');
    fireEvent.changeText(emailInput, 'invalid-email');

    const loginButton = screen.getByText('Sign In');
    fireEvent.press(loginButton);

    expect(await screen.findByText('Please enter a valid email address')).toBeOnTheScreen();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  test('shows validation error for short password', async () => {
    render(<LoginPage />);

    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Enter your password');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, '123');

    const loginButton = screen.getByText('Sign In');
    fireEvent.press(loginButton);
    
    expect(await screen.findByText('Password must be at least 6 characters')).toBeOnTheScreen();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  test('handles successful login', async () => {
    mockLogin.mockResolvedValueOnce({ success: true });

    render(<LoginPage />);

    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const loginButton = screen.getByText('Sign In');

    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(loginButton);

    expect(screen.getByText('Signing In...')).toBeOnTheScreen();

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    expect(await screen.findByTestId('custom-alert')).toBeOnTheScreen();
    expect(screen.getByText('Welcome Back!')).toBeOnTheScreen();
    expect(screen.getByText('You have successfully logged in.')).toBeOnTheScreen();
  });
  
  test('handles failed login with "Invalid credentials" error', async () => {
    const error = new Error('Invalid credentials');
    mockLogin.mockRejectedValueOnce(error);

    render(<LoginPage />);

    fireEvent.changeText(screen.getByPlaceholderText('Enter your email'), 'test@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('Enter your password'), 'wrongpassword');
    fireEvent.press(screen.getByText('Sign In'));

    await waitFor(() => {
      expect(screen.getByText('Login Failed')).toBeOnTheScreen();
      expect(screen.getByText(/Invalid email or password/)).toBeOnTheScreen();
    });
  });

  test('navigates to signup page when "Sign Up" is pressed', () => {
    render(<LoginPage />);
    
    const signupLink = screen.getByText('Sign Up');
    fireEvent.press(signupLink);
    
    expect(mockRouterPush).toHaveBeenCalledWith('/signup');
  });

  test('calls onNavigateToForgotPassword when "Forgot Password?" is pressed', () => {
    render(<LoginPage />);
    
    const forgotLink = screen.getByText('Forgot Password?');
    fireEvent.press(forgotLink);
    
    expect(mockRouterPush).toHaveBeenCalledWith('/forgotPassword');
  });
  
  test('toggles password visibility', () => {
    render(<LoginPage />);
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const toggleButton = screen.getByTestId('password-toggle-button');

    expect(passwordInput.props.secureTextEntry).toBe(true);

    fireEvent.press(toggleButton);

    expect(passwordInput.props.secureTextEntry).toBe(false);

    fireEvent.press(toggleButton);
    expect(passwordInput.props.secureTextEntry).toBe(true);
  });
});
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import VerifyPage from '@/app/(auth)/verify';

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
  useLocalSearchParams: () => ({
    email: 'test@example.com',
  }),
}));

const mockVerifyEmail = jest.fn();
jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    verifyEmail: mockVerifyEmail,
  }),
}));

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Icon' }));
jest.mock('@/components/LoadingSpinner', () => ({ LoadingSpinner: 'LoadingSpinner' }));
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

jest.mock('@/constants/api', () => ({ API_URL: 'http://mock-api.com' }));
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.Mock;


describe('Verify Page Component', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });

  const fillOutCode = async (code = '123456') => {
    const codeInputs = [
      screen.getByTestId('code-input-0'),
      screen.getByTestId('code-input-1'),
      screen.getByTestId('code-input-2'),
      screen.getByTestId('code-input-3'),
      screen.getByTestId('code-input-4'),
      screen.getByTestId('code-input-5'),
    ];
    
    for (let i = 0; i < code.length; i++) {
      act(() => {
        fireEvent.changeText(codeInputs[i], code[i]);
      });
    }

    await waitFor(() => {
      codeInputs.forEach((input, index) => {
        expect(input.props.value).toBe(code[index]);
      });
    });
  };

  test('renders the initial state correctly', () => {
    render(<VerifyPage />);
    act(() => { jest.runAllTimers(); });

    expect(screen.getByText('Verify Your Email')).toBeOnTheScreen();
    expect(screen.getByText('te***@example.com')).toBeOnTheScreen();    
    const verifyButton = screen.getByText('Verify & Sign In');
    expect(verifyButton).toBeOnTheScreen();
    expect(verifyButton).toBeDisabled();
    
    expect(screen.getByText('Resend Code')).toBeOnTheScreen();
    expect(screen.getByText('Go Back')).toBeOnTheScreen();
  });

  test('enables the "Verify & Sign In" button only when the code is complete', async () => {
    render(<VerifyPage />);
    act(() => { jest.runAllTimers(); });
    
    const verifyButton = await screen.findByText('Verify & Sign In');
    expect(verifyButton).toBeDisabled();

    await fillOutCode('123456');

    expect(verifyButton).not.toBeDisabled();
  });

  test('handles successful verification and navigates to tabs', async () => {
    mockVerifyEmail.mockResolvedValueOnce(undefined);

    render(<VerifyPage />);
    act(() => { jest.runAllTimers(); });

    await fillOutCode('123456');
    
    fireEvent.press(screen.getByText('Verify & Sign In'));

    await screen.findByText('Verifying...');
    
    await waitFor(() => {
      expect(mockVerifyEmail).toHaveBeenCalledWith('test@example.com', '123456');
    });

    await screen.findByTestId('custom-alert');
    expect(screen.getByText('Email Verified!')).toBeOnTheScreen();

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith('/(tabs)');
    });
  });

  test('handles failed verification and shows an error message', async () => {
    mockVerifyEmail.mockRejectedValueOnce(new Error('Invalid or expired verification code.'));

    render(<VerifyPage />);
    act(() => { jest.runAllTimers(); });

    await fillOutCode('654321');

    fireEvent.press(screen.getByText('Verify & Sign In'));
    
    await waitFor(() => {
      expect(screen.getByText('Invalid or expired verification code. Please check your code or request a new one.')).toBeOnTheScreen();
    });

    const codeInputs = screen.getAllByTestId(/code-input-\d/);
    codeInputs.forEach(input => {
      expect(input.props.value).toBe('');
    });
    
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  test('handles successful code resend and starts cooldown timer', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'New code sent!' }),
    });

    render(<VerifyPage />);
    
    act(() => { jest.runAllTimers(); });

    const resendButton = screen.getByText('Resend Code');
    fireEvent.press(resendButton);

    await screen.findByText('Sending...');
    
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('http://mock-api.com/accounts/resend-verification/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' }),
      });
    });

    await screen.findByText('Code Sent!');
    expect(screen.getByText('New code sent!')).toBeOnTheScreen();
    
    await screen.findByText(/Resend available in 60s/);
    expect(screen.getByText('Resend Code')).toBeDisabled();

    act(() => {
      jest.advanceTimersByTime(10000);
    });
    await screen.findByText(/Resend available in 50s/);
    
    act(() => {
      jest.advanceTimersByTime(50000);
    });
    expect(screen.queryByText(/Resend available in/)).toBeNull();
    expect(screen.getByText('Resend Code')).not.toBeDisabled();
  });

  test('handles failed code resend', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ message: 'rate limit' }),
    });

    render(<VerifyPage />);
    act(() => { jest.runAllTimers(); });

    fireEvent.press(screen.getByText('Resend Code'));

    await waitFor(() => {
      expect(screen.getByText('Resend Failed')).toBeOnTheScreen();
      expect(screen.getByText('Too many requests. Please wait a moment before requesting another code.')).toBeOnTheScreen();
    });

    expect(screen.queryByText(/Resend available in/)).toBeNull();
    expect(screen.getByText('Resend Code')).not.toBeDisabled();
  });

  test('navigates back to signup when "Go Back" is pressed', () => {
    render(<VerifyPage />);
    // FIX: Run timers to complete the fade-in animation for robustness.
    act(() => { jest.runAllTimers(); });

    fireEvent.press(screen.getByText('Go Back'));
    expect(mockRouterPush).toHaveBeenCalledWith('/signup');
  });
});
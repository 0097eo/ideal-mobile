import React from 'react';
import { render, fireEvent, within, waitFor } from '@testing-library/react-native';
import Account from '@/app/(tabs)/account';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useThemes } from '@/hooks/themes';

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
  },
}));
jest.mock('@/context/AuthContext');
jest.mock('@/hooks/themes');
jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

jest.mock('@/components/CustomAlert', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View, Text, TouchableOpacity } = require('react-native');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');

  const MockCustomAlert = ({
    visible,
    title,
    message,
    onConfirm,
    onClose,
    confirmText,
    cancelText,
    showCancel,
  }: any) =>
    visible ? (
      <View testID="custom-alert">
        <Text>{title}</Text>
        <Text>{message}</Text>
        <TouchableOpacity onPress={onConfirm}>
          <Text>{confirmText}</Text>
        </TouchableOpacity>
        {showCancel && (
          <TouchableOpacity onPress={onClose}>
            <Text>{cancelText}</Text>
          </TouchableOpacity>
        )}
      </View>
    ) : null;

  MockCustomAlert.displayName = 'CustomAlert';

  return MockCustomAlert;
});


const mockLogout = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (useAuth as jest.Mock).mockReturnValue({
    user: {
      first_name: 'Jane',
      email: 'jane@example.com',
    },
    logout: mockLogout,
  });
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
});

describe('Account Tab', () => {
  it('renders user info and menu items', () => {
    const { getByText } = render(<Account />);
    expect(getByText('Account')).toBeTruthy();
    expect(getByText('Welcome Jane!')).toBeTruthy();
    expect(getByText('jane@example.com')).toBeTruthy();
    expect(getByText('Orders')).toBeTruthy();
    expect(getByText('Ratings & Reviews')).toBeTruthy();
    expect(getByText('Vouchers')).toBeTruthy();
    expect(getByText('Wishlist')).toBeTruthy();
    expect(getByText('Logout')).toBeTruthy();
  });

  it('navigates to orders, reviews, vouchers, wishlist, and profile', () => {
    const { getByText } = render(<Account />);
    fireEvent.press(getByText('Orders'));
    expect(router.push).toHaveBeenCalledWith('/orders');
    fireEvent.press(getByText('Ratings & Reviews'));
    expect(router.push).toHaveBeenCalledWith('/reviews');
    fireEvent.press(getByText('Vouchers'));
    expect(router.push).toHaveBeenCalledWith('/vouchers');
    fireEvent.press(getByText('Wishlist'));
    expect(router.push).toHaveBeenCalledWith('/wishlist');
    fireEvent.press(getByText('Manage Profile'));
    expect(router.push).toHaveBeenCalledWith('/(screens)/profile');
  });

  it('navigates to live chat', () => {
    const { getByText } = render(<Account />);
    fireEvent.press(getByText('Start Live Chat'));
    expect(router.push).toHaveBeenCalledWith('/(tabs)');
  });


  it('shows and handles logout confirmation', async () => {
    const { getByText, findByTestId } = render(<Account />);

    fireEvent.press(getByText('Logout'));
    
    const alert = await findByTestId('custom-alert');
    expect(alert).toBeTruthy();
    expect(within(alert).getByText('Confirm Logout')).toBeTruthy();
    expect(within(alert).getByText("Are you sure you want to logout? You'll need to sign in again to access your account.")).toBeTruthy();

    const alertLogoutButton = within(alert).getByText('Logout');
    fireEvent.press(alertLogoutButton);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    expect(router.replace).toHaveBeenCalledWith('/(auth)/login');
  });

  it('cancels logout confirmation', async () => {
    const { getByText, findByTestId, queryByTestId } = render(<Account />);
    
    fireEvent.press(getByText('Logout'));
    
    const alert = await findByTestId('custom-alert');
    expect(alert).toBeTruthy();

    const cancelButton = within(alert).getByText('Cancel');
    fireEvent.press(cancelButton);

    await waitFor(() => {
      expect(queryByTestId('custom-alert')).toBeNull();
    });
  });
});
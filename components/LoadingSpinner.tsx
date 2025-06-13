import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useThemes } from '@/hooks/themes';


interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'large';
  color?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading...',
  size = 'large',
  color,
}) => {
  const { colors } = useThemes();

  return (
    <View style={[styles.container, { backgroundColor: colors.modalOverlay }]}>
      <View style={[styles.spinnerContainer, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
        <ActivityIndicator size={size} color={color || colors.primary} />
        {message && <Text style={[styles.message, { color: colors.text }]}>{message}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  spinnerContainer: {
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  message: {
    marginTop: 15,
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export const FullScreenLoader: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading...',
  size = 'large',
  color,
}) => {
  const { colors } = useThemes();

  return (
    <View style={[fullScreenStyles.fullScreenContainer, { backgroundColor: colors.background }]}>
      <ActivityIndicator size={size} color={color || colors.primary} />
      {message && <Text style={[fullScreenStyles.fullScreenMessage, { color: colors.textSecondary }]}>{message}</Text>}
    </View>
  );
};

const fullScreenStyles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenMessage: {
    marginTop: 20,
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '600',
  },
});

import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useThemes, AppColors } from '@/hooks/themes';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'large';
  color?: string;
}

// ─── Overlay spinner ──────────────────────────────────────────────────────────
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading...',
  size = 'large',
  color,
}) => {
  const { colors } = useThemes();
  const styles = makeStyles(colors);

  return (
    <View style={styles.overlay}>
      <View style={styles.spinnerCard}>
        <View style={styles.cardAccent} />
        <View style={styles.spinnerCardInner}>
          <View style={styles.spinnerRing}>
            <ActivityIndicator size={size} color={color ?? colors.primary} />
          </View>
          {message && <Text style={styles.message}>{message}</Text>}
        </View>
      </View>
    </View>
  );
};

// ─── Full-screen loader ───────────────────────────────────────────────────────
export const FullScreenLoader: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading...',
  size = 'large',
  color,
}) => {
  const { colors } = useThemes();
  const styles = makeFullStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.ringOuter}>
        <View style={styles.ringInner}>
          <ActivityIndicator size={size} color={color ?? colors.primary} />
        </View>
      </View>
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const makeStyles = (colors: AppColors) => StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: colors.modalOverlay,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  spinnerCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.40,
    shadowRadius: 16,
    elevation: 12,
    minWidth: 140,
  },
  cardAccent: {
    height: 2,
    backgroundColor: colors.primary,
    opacity: 0.6,
  },
  spinnerCardInner: {
    padding: 28,
    alignItems: 'center',
    gap: 16,
  },
  spinnerRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});

const makeFullStyles = (colors: AppColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  ringOuter: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    borderColor: colors.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});
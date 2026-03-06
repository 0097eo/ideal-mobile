import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemes } from '@/hooks/themes';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// ─── Coming soon features ──────────────────────────────────────────────────
const FEATURES = [
  { icon: 'pricetag' as const,  text: 'Exclusive discount vouchers up to 70% off' },
  { icon: 'flash' as const,     text: 'Flash sale vouchers for limited-time offers' },
  { icon: 'card' as const,      text: 'Free shipping vouchers for all orders' },
  { icon: 'star' as const,      text: 'VIP member exclusive vouchers and early access' },
];

// ─── Component ───────────────────────────────────────────────────────────────
const Vouchers = () => {
  const { colors, isDark } = useThemes();

  const handleGoBack = () => router.back();
  const handleBrowseProducts = () => router.push('/(tabs)');
  const handleNotifyMe = () => {
    console.log('User wants to be notified about new vouchers');
  };

  const styles = makeStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={colors.text} testID='arrow-back-button' />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerEyebrow}>IDEAL FURNITURE</Text>
          <Text style={styles.headerTitle}>Vouchers</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
        alwaysBounceVertical={false}
      >
        <View style={styles.contentContainer}>

          {/* ── Illustration ── */}
          <View style={styles.illustrationWrapper}>
            <View style={styles.illustrationRingOuter} />
            <View style={styles.illustrationRingMid} />
            <View style={styles.illustrationContainer}>
              {/* Sparkles */}
              <View style={[styles.sparkle, styles.sparkle1]}>
                <Ionicons name="sparkles" size={14} color={`${colors.primary}B3`} />
              </View>
              <View style={[styles.sparkle, styles.sparkle2]}>
                <Ionicons name="sparkles" size={10} color={`${colors.primary}80`} />
              </View>
              <View style={[styles.sparkle, styles.sparkle3]}>
                <Ionicons name="sparkles" size={12} color={`${colors.primary}99`} />
              </View>
              <Ionicons name="gift" size={44} color={colors.primaryText} style={styles.illustrationIcon} />
            </View>
          </View>

          {/* ── Copy ── */}
          <Text style={styles.eyebrow}>Coming Soon</Text>
          <Text style={styles.title}>No Vouchers Yet!</Text>
          <Text style={styles.subtitle}>Don't worry, exciting deals are coming your way! 🎉</Text>
          <Text style={styles.description}>
            We're preparing amazing vouchers and exclusive discounts just for you.{' '}
            Keep checking back or browse our products to discover great deals.
          </Text>

          {/* ── CTA Buttons ── */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.primaryButton} onPress={handleBrowseProducts} activeOpacity={0.82}>
              <Ionicons name="storefront" size={18} color={colors.primaryText} />
              <Text style={styles.primaryButtonText}>Browse Products</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={handleNotifyMe} activeOpacity={0.75}>
              <Ionicons name="notifications" size={18} color={colors.primary} />
              <Text style={styles.secondaryButtonText}>Notify Me</Text>
            </TouchableOpacity>
          </View>

          {/* ── Features ── */}
          <View style={styles.featuresContainer}>
            <View style={styles.featuresHeaderRow}>
              <View style={styles.featuresHeaderLine} />
              <Text style={styles.featuresEyebrow}>What's Coming Soon</Text>
              <View style={styles.featuresHeaderLine} />
            </View>

            <View style={styles.featuresList}>
              {FEATURES.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <View style={styles.featureIconBadge}>
                    <Ionicons name={feature.icon} size={16} color={colors.primary} />
                  </View>
                  <Text style={styles.featureText}>{feature.text}</Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
                </View>
              ))}
            </View>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Dynamic Styles ──────────────────────────────────────────────────────────
const makeStyles = (colors: ReturnType<typeof import('@/hooks/themes').useThemes>['colors']) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    // ── Header ─────────────────────────────────────────────────────────────
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 14,
      backgroundColor: colors.stickyBackground,
      borderBottomWidth: 1,
      borderBottomColor: colors.primaryBorder,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerCenter: {
      flex: 1,
      alignItems: 'center',
    },
    headerEyebrow: {
      fontSize: 9,
      letterSpacing: 3,
      textTransform: 'uppercase',
      color: colors.primary,
      fontWeight: '600',
      marginBottom: 2,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      letterSpacing: 0.3,
    },
    headerSpacer: { width: 40 },

    // ── Scroll ─────────────────────────────────────────────────────────────
    scrollView: { flex: 1 },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: 50,
    },
    contentContainer: {
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 40,
      minHeight: screenHeight * 0.75,
    },

    // ── Illustration ────────────────────────────────────────────────────────
    illustrationWrapper: {
      width: 140,
      height: 140,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 28,
    },
    illustrationRingOuter: {
      position: 'absolute',
      width: 140,
      height: 140,
      borderRadius: 70,
      borderWidth: 1,
      borderColor: colors.primaryDim,
    },
    illustrationRingMid: {
      position: 'absolute',
      width: 110,
      height: 110,
      borderRadius: 55,
      borderWidth: 1,
      borderColor: colors.primaryBorder,
    },
    illustrationContainer: {
      width: 84,
      height: 84,
      borderRadius: 42,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 20,
      elevation: 12,
    },
    illustrationIcon: {
      marginBottom: 2,
    },
    sparkle: {
      position: 'absolute',
      zIndex: 10,
    },
    sparkle1: { top: 4, right: 4 },
    sparkle2: { bottom: 10, left: 4 },
    sparkle3: { top: 18, left: 2 },

    // ── Copy ───────────────────────────────────────────────────────────────
    eyebrow: {
      fontSize: 11,
      letterSpacing: 3,
      textTransform: 'uppercase',
      color: colors.primary,
      fontWeight: '600',
      marginBottom: 10,
    },
    title: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 12,
      letterSpacing: 0.3,
    },
    subtitle: {
      fontSize: 17,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 10,
      lineHeight: 26,
    },
    description: {
      fontSize: 15,
      color: colors.textTertiary,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 36,
      paddingHorizontal: 8,
    },

    // ── Buttons ─────────────────────────────────────────────────────────────
    buttonContainer: {
      width: '100%',
      gap: 12,
      marginBottom: 36,
    },
    primaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.primary,
      paddingVertical: 16,
      paddingHorizontal: 30,
      borderRadius: 12,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.30,
      shadowRadius: 12,
      elevation: 8,
    },
    primaryButtonText: {
      color: colors.primaryText,
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    secondaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: colors.primaryBorder,
      paddingVertical: 15,
      paddingHorizontal: 30,
      borderRadius: 12,
    },
    secondaryButtonText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: '600',
      letterSpacing: 0.3,
    },

    // ── Features ────────────────────────────────────────────────────────────
    featuresContainer: {
      width: '100%',
    },
    featuresHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 18,
    },
    featuresHeaderLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    featuresEyebrow: {
      fontSize: 11,
      letterSpacing: 2.5,
      textTransform: 'uppercase',
      color: colors.primary,
      fontWeight: '600',
    },
    featuresList: {
      gap: 10,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderLeftWidth: 2,
      borderLeftColor: colors.primaryBorder,
      padding: 14,
      borderRadius: 12,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 6,
      elevation: 2,
    },
    featureIconBadge: {
      width: 34,
      height: 34,
      borderRadius: 9,
      backgroundColor: colors.primaryDim,
      borderWidth: 1,
      borderColor: colors.primaryBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    featureText: {
      flex: 1,
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 21,
    },
  });

export default Vouchers;
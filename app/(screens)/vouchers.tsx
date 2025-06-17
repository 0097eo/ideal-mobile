import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemes } from '@/hooks/themes';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const Vouchers = () => {
  const { colors, isDark } = useThemes();

  const handleGoBack = () => {
    router.back();
  };

  const handleBrowseProducts = () => {
    router.push('/(tabs)');
  };

  const handleNotifyMe = () => {
    // This could open a notification preferences screen or show a success message
    console.log('User wants to be notified about new vouchers');
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: 50,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 15,
      backgroundColor: colors.navigationBackground,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginTop: 30
    },
    backButton: {
      padding: 8,
      marginRight: 10,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.navigationText,
      flex: 1,
    },
    contentContainer: {
      alignItems: 'center',
      paddingHorizontal: 30,
      paddingVertical: 40,
      minHeight: screenHeight * 0.8,
    },
    illustrationContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 30,
      shadowColor: colors.shadow,
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    },
    illustrationIcon: {
      marginBottom: 5,
    },
    sparkleContainer: {
      position: 'absolute',
      width: 140,
      height: 140,
    },
    sparkle: {
      position: 'absolute',
    },
    sparkle1: {
      top: 10,
      right: 15,
    },
    sparkle2: {
      bottom: 15,
      left: 10,
    },
    sparkle3: {
      top: 20,
      left: 5,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 15,
    },
    subtitle: {
      fontSize: 18,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 10,
      lineHeight: 26,
    },
    description: {
      fontSize: 16,
      color: colors.textTertiary,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 40,
    },
    buttonContainer: {
      width: '100%',
      gap: 15,
      marginBottom: 30,
    },
    primaryButton: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      paddingHorizontal: 30,
      borderRadius: 12,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      shadowColor: colors.shadow,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 6,
    },
    primaryButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    secondaryButton: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 16,
      paddingHorizontal: 30,
      borderRadius: 12,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
    },
    secondaryButtonText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '500',
      marginLeft: 8,
    },
    featuresContainer: {
      width: '100%',
      marginTop: 20,
    },
    featuresTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 20,
    },
    featuresList: {
      gap: 15,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 12,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
    },
    featureIcon: {
      marginRight: 15,
    },
    featureText: {
      fontSize: 14,
      color: colors.textSecondary,
      flex: 1,
      lineHeight: 20,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle={isDark ? "light-content" : "dark-content"} 
        backgroundColor={colors.navigationBackground} 
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleGoBack}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="arrow-back" 
            size={24} 
            color={colors.navigationText} 
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vouchers</Text>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
        alwaysBounceVertical={false}
      >
        <View style={styles.contentContainer}>
          {/* Illustration */}
          <View style={styles.illustrationContainer}>
            <View style={styles.sparkleContainer}>
              <View style={[styles.sparkle, styles.sparkle1]}>
                <Ionicons name="sparkles" size={16} color="rgba(255,255,255,0.8)" />
              </View>
              <View style={[styles.sparkle, styles.sparkle2]}>
                <Ionicons name="sparkles" size={12} color="rgba(255,255,255,0.6)" />
              </View>
              <View style={[styles.sparkle, styles.sparkle3]}>
                <Ionicons name="sparkles" size={14} color="rgba(255,255,255,0.7)" />
              </View>
            </View>
            <Ionicons 
              name="gift" 
              size={50} 
              color="#ffffff" 
              style={styles.illustrationIcon}
            />
          </View>

          {/* Main Content */}
          <Text style={styles.title}>No Vouchers Yet!</Text>
          <Text style={styles.subtitle}>
            Don't worry, exciting deals are coming your way! 🎉
          </Text>
          <Text style={styles.description}>
            We're preparing amazing vouchers and exclusive discounts just for you. 
            Keep checking back or browse our products to discover great deals.
          </Text>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={handleBrowseProducts}
              activeOpacity={0.8}
            >
              <Ionicons name="storefront" size={20} color="#ffffff" />
              <Text style={styles.primaryButtonText}>Browse Products</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={handleNotifyMe}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications" size={20} color={colors.text} />
              <Text style={styles.secondaryButtonText}>Notify Me</Text>
            </TouchableOpacity>
          </View>

          {/* Features Section */}
          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>What's Coming Soon</Text>
            
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Ionicons 
                  name="pricetag" 
                  size={20} 
                  color={colors.primary} 
                  style={styles.featureIcon}
                />
                <Text style={styles.featureText}>
                  Exclusive discount vouchers up to 70% off
                </Text>
              </View>

              <View style={styles.featureItem}>
                <Ionicons 
                  name="flash" 
                  size={20} 
                  color={colors.primary} 
                  style={styles.featureIcon}
                />
                <Text style={styles.featureText}>
                  Flash sale vouchers for limited-time offers
                </Text>
              </View>

              <View style={styles.featureItem}>
                <Ionicons 
                  name="card" 
                  size={20} 
                  color={colors.primary} 
                  style={styles.featureIcon}
                />
                <Text style={styles.featureText}>
                  Free shipping vouchers for all orders
                </Text>
              </View>

              <View style={styles.featureItem}>
                <Ionicons 
                  name="star" 
                  size={20} 
                  color={colors.primary} 
                  style={styles.featureIcon}
                />
                <Text style={styles.featureText}>
                  VIP member exclusive vouchers and early access
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Vouchers;
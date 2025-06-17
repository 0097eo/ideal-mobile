import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useThemes } from '@/hooks/themes';
import CustomAlert from '@/components/CustomAlert'; 

const Account = () => {
  const { user, logout } = useAuth();
  const { colors, isDark } = useThemes();
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);

  const menuItems = [
    {
      id: 'orders',
      title: 'Orders',
      icon: 'bag-outline' as keyof typeof Ionicons.glyphMap,
      onPress: () => router.push('/orders'),
    },
    {
      id: 'ratings',
      title: 'Ratings & Reviews',
      icon: 'star-outline' as keyof typeof Ionicons.glyphMap,
      onPress: () => router.push('/reviews'),
    },
    {
      id: 'vouchers',
      title: 'Vouchers',
      icon: 'gift-outline' as keyof typeof Ionicons.glyphMap,
      onPress: () => router.push('/vouchers'),
    },
    {
      id: 'wishlist',
      title: 'Wishlist',
      icon: 'heart-outline' as keyof typeof Ionicons.glyphMap,
      onPress: () => router.push('/wishlist'),
    },
  ];

  const handleLogoutPress = () => {
    setShowLogoutAlert(true);
  };

  const handleConfirmLogout = async () => {
    try {
      setShowLogoutAlert(false);
      await logout();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleCancelLogout = () => {
    setShowLogoutAlert(false);
  };

  const renderMenuItem = (item: typeof menuItems[0]) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.menuItem, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
      onPress={item.onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemLeft}>
        <View style={styles.iconContainer}>
          <Ionicons 
            name={item.icon} 
            size={20} 
            color={colors.textSecondary} 
          />
        </View>
        <Text style={[styles.menuItemText, { color: colors.text }]}>{item.title}</Text>
      </View>
      <Ionicons 
        name="chevron-forward" 
        size={16} 
        color={colors.textTertiary} 
      />
    </TouchableOpacity>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 15,
      backgroundColor: colors.navigationBackground,
      marginTop: 30,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.navigationText,
    },
    welcomeSection: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      backgroundColor: colors.navigationBackground,
    },
    welcomeText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.primary,
      marginBottom: 5,
    },
    emailText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    liveChatButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      marginHorizontal: 20,
      marginVertical: 15,
      paddingVertical: 15,
      borderRadius: 8,
      shadowColor: colors.shadow,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    liveChatText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ffffff',
      marginLeft: 10,
    },
    sectionContainer: {
      backgroundColor: colors.surface,
      marginTop: 10,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textSecondary,
      paddingHorizontal: 20,
      paddingVertical: 15,
      backgroundColor: colors.background,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 15,
      borderBottomWidth: 1,
    },
    menuItemLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    iconContainer: {
      width: 30,
      alignItems: 'center',
      marginRight: 15,
    },
    menuItemText: {
      fontSize: 16,
      flex: 1,
    },
    logoutButton: {
      backgroundColor: colors.error,
      marginHorizontal: 20,
      marginVertical: 20,
      paddingVertical: 15,
      borderRadius: 8,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      shadowColor: colors.shadow,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    logoutIcon: {
      marginRight: 8,
    },
    logoutText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#ffffff',
    },
    bottomSpacing: {
      height: 50,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle={isDark ? "light-content" : "dark-content"} 
        backgroundColor={colors.navigationBackground} 
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Account</Text>
        </View>

        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>
            Welcome {user?.first_name || 'User'}!
          </Text>
          <Text style={styles.emailText}>{user?.email}</Text>
        </View>

        {/* Start Live Chat Button */}
        <TouchableOpacity 
          style={styles.liveChatButton}
          onPress={() => router.push('/(tabs)')}
          activeOpacity={0.8}
        >
          <Ionicons name="chatbubbles" size={20} color="#ffffff" />
          <Text style={styles.liveChatText}>Start Live Chat</Text>
        </TouchableOpacity>

        {/* Need Assistance Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Need Assistance?</Text>
          
          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
            onPress={() => router.push('/(screens)/profile')}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <View style={styles.iconContainer}>
                <Ionicons 
                  name="settings" 
                  size={20} 
                  color={colors.textSecondary} 
                />
              </View>
              <Text style={[styles.menuItemText, { color: colors.text }]}>Manage Profile</Text>
            </View>
            <Ionicons 
              name="chevron-forward" 
              size={16} 
              color={colors.textTertiary} 
            />
          </TouchableOpacity>
        </View>

        {/* My Account Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>My Account</Text>
          
          {menuItems.map(renderMenuItem)}
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogoutPress}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="log-out-outline" 
            size={20} 
            color="#ffffff" 
            style={styles.logoutIcon}
          />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Logout Confirmation Alert */}
      <CustomAlert
        visible={showLogoutAlert}
        type="warning"
        title="Confirm Logout"
        message="Are you sure you want to logout? You'll need to sign in again to access your account."
        onClose={handleCancelLogout}
        onConfirm={handleConfirmLogout}
        confirmText="Logout"
        cancelText="Cancel"
        showCancel={true}
      />
    </SafeAreaView>
  );
};

export default Account;
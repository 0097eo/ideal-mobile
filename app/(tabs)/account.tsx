import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useThemes, AppColors } from '@/hooks/themes';
import CustomAlert from '@/components/CustomAlert';

// ─── Menu item type ─────────────────────────────────────────────────────────
type MenuItem = {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

// ─── Component ───────────────────────────────────────────────────────────────
const Account = () => {
  const { user, logout } = useAuth();
  const { colors, isDark } = useThemes();
  const styles = makeStyles(colors);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);

  const menuItems: MenuItem[] = [
    { id: 'orders',   title: 'Orders',            icon: 'bag-outline',   onPress: () => router.push('/orders') },
    { id: 'ratings',  title: 'Ratings & Reviews', icon: 'star-outline',  onPress: () => router.push('/reviews') },
    { id: 'vouchers', title: 'Vouchers',           icon: 'gift-outline',  onPress: () => router.push('/vouchers') },
    { id: 'wishlist', title: 'Wishlist',           icon: 'heart-outline', onPress: () => router.push('/wishlist') },
  ];

  const handleLogoutPress = () => setShowLogoutAlert(true);

  const handleConfirmLogout = async () => {
    try {
      setShowLogoutAlert(false);
      await logout();
      router.replace('/(auth)/login');
    } catch (error) {
      throw error;
    }
  };

  const handleCancelLogout = () => setShowLogoutAlert(false);

  const initials = [user?.first_name?.[0], user?.last_name?.[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase() || 'U';

  const renderMenuItem = (item: MenuItem, isLast: boolean) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.menuItem, !isLast && styles.menuItemBorder]}
      onPress={item.onPress}
      activeOpacity={0.75}
    >
      <View style={styles.menuItemLeft}>
        <View style={styles.iconBadge}>
          <Ionicons name={item.icon} size={18} color={colors.primary} />
        </View>
        <Text style={styles.menuItemText}>{item.title}</Text>
      </View>
      <View style={styles.chevronBadge}>
        <Ionicons name="chevron-forward" size={14} color={colors.primary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerEyebrow}>IDEAL FURNITURE</Text>
            <Text style={styles.headerTitle}>Account</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => router.push('/(screens)/profile')}
            activeOpacity={0.75}
          >
            <Ionicons name="settings-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* ── Profile hero card ── */}
        <View style={styles.heroCard}>
          <View style={styles.heroAccentLine} />
          <View style={styles.heroInner}>
            <View style={styles.avatarWrapper}>
              <View style={styles.avatarRing} />
              <View style={styles.avatar}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            </View>

            <View style={styles.heroInfo}>
              <Text style={styles.welcomeEyebrow}>Welcome back</Text>
              <Text style={styles.welcomeText}>
                {`Welcome ${user?.first_name || 'User'}!`}
              </Text>
              <Text style={styles.emailText}>{user?.email}</Text>
            </View>

            <TouchableOpacity
              style={styles.editProfileBtn}
              onPress={() => router.push('/(screens)/profile')}
              activeOpacity={0.8}
            >
              <Ionicons name="pencil-outline" size={14} color={colors.primaryText} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Live Chat ── */}
        <TouchableOpacity
          style={styles.liveChatButton}
          onPress={() => router.push('/(tabs)')}
          activeOpacity={0.82}
        >
          <View style={styles.liveChatIconBadge}>
            <Ionicons name="chatbubbles" size={18} color={colors.primaryText} />
          </View>
          <Text style={styles.liveChatText}>Start Live Chat</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.primaryText} />
        </TouchableOpacity>

        {/* ── Manage Profile ── */}
        <View style={styles.sectionWrapper}>
          <View style={styles.sectionLabelRow}>
            <Ionicons name="shield-outline" size={12} color={colors.primary} />
            <Text style={styles.sectionLabel}>Need Assistance?</Text>
          </View>

          <View style={styles.menuCard}>
            <View style={styles.menuCardAccentLine} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/(screens)/profile')}
              activeOpacity={0.75}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.iconBadge}>
                  <Ionicons name="settings-outline" size={18} color={colors.primary} />
                </View>
                <Text style={styles.menuItemText}>Manage Profile</Text>
              </View>
              <View style={styles.chevronBadge}>
                <Ionicons name="chevron-forward" size={14} color={colors.primary} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── My Account ── */}
        <View style={styles.sectionWrapper}>
          <View style={styles.sectionLabelRow}>
            <Ionicons name="person-outline" size={12} color={colors.primary} />
            <Text style={styles.sectionLabel}>My Account</Text>
          </View>

          <View style={styles.menuCard}>
            <View style={styles.menuCardAccentLine} />
            {menuItems.map((item, index) => renderMenuItem(item, index === menuItems.length - 1))}
          </View>
        </View>

        {/* ── Logout ── */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogoutPress}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={18} color={colors.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacing} />
      </ScrollView>

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

// ─── Styles ──────────────────────────────────────────────────────────────────
const makeStyles = (colors: AppColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },

  // ── Header ───────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: colors.stickyBackground,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.primary}33`,
  },
  headerEyebrow: {
    fontSize: 9,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 3,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 0.3,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Profile hero ──────────────────────────────────────────────────────────
  heroCard: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  heroAccentLine: {
    height: 2,
    backgroundColor: colors.primary,
    opacity: 0.6,
  },
  heroInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 14,
  },
  avatarWrapper: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRing: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: colors.primaryBorder,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 1,
  },
  heroInfo: {
    flex: 1,
    gap: 3,
  },
  welcomeEyebrow: {
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.textTertiary,
    fontWeight: '600',
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.2,
  },
  emailText: {
    fontSize: 13,
    color: colors.textSecondary,
    letterSpacing: 0.2,
  },
  editProfileBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },

  // ── Live Chat ─────────────────────────────────────────────────────────────
  liveChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.primary,
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 15,
    paddingHorizontal: 18,
    borderRadius: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 8,
  },
  liveChatIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveChatText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryText,
    letterSpacing: 0.3,
  },

  // ── Section wrapper ───────────────────────────────────────────────────────
  sectionWrapper: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    paddingLeft: 2,
  },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: colors.primary,
    fontWeight: '600',
  },

  // ── Menu card ─────────────────────────────────────────────────────────────
  menuCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  menuCardAccentLine: {
    height: 2,
    backgroundColor: colors.primary,
    opacity: 0.45,
  },

  // ── Menu rows ─────────────────────────────────────────────────────────────
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 14,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primaryDim,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
    letterSpacing: 0.1,
    flex: 1,
  },
  chevronBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primaryDim,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Logout ────────────────────────────────────────────────────────────────
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: `${colors.error}14`,
    borderWidth: 1.5,
    borderColor: `${colors.error}47`,
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 15,
    borderRadius: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.error,
    letterSpacing: 0.4,
  },

  bottomSpacing: {
    height: 50,
  },
});

export default Account;
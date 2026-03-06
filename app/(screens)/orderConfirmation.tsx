import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemes, AppColors } from '@/hooks/themes';
import { FullScreenLoader } from '@/components/LoadingSpinner';
import CustomAlert from '@/components/CustomAlert';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '@/constants/api';
import { Order } from '@/types/order';

// ─── Status helpers (semantic colors, not theme tokens) ───────────────────────
const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending':   return '#FCD34D';
    case 'confirmed': return '#60A5FA';
    case 'shipped':   return '#A78BFA';
    case 'delivered': return '#4ADE80';
    case 'cancelled': return '#FF6B6B';
    default:          return 'rgba(255,255,255,0.45)';
  }
};

const getStatusBg = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending':   return 'rgba(252,211,77,0.10)';
    case 'confirmed': return 'rgba(96,165,250,0.10)';
    case 'shipped':   return 'rgba(167,139,250,0.10)';
    case 'delivered': return 'rgba(74,222,128,0.08)';
    case 'cancelled': return 'rgba(255,107,107,0.06)';
    default:          return 'rgba(255,255,255,0.07)';
  }
};

const getStatusIcon = (status: string): any => {
  switch (status.toLowerCase()) {
    case 'pending':   return 'time-outline';
    case 'confirmed': return 'checkmark-circle-outline';
    case 'shipped':   return 'car-outline';
    case 'delivered': return 'checkmark-done-circle-outline';
    case 'cancelled': return 'close-circle-outline';
    default:          return 'help-circle-outline';
  }
};

// ─── Component ────────────────────────────────────────────────────────────────
const OrderConfirmation: React.FC = () => {
  const { colors, isDark } = useThemes();
  const router = useRouter();
  const { orderId } = useLocalSearchParams();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
    title: '',
    message: '',
    onConfirm: () => {},
    showCancel: false,
  });

  const styles = React.useMemo(() => makeStyles(colors), [colors]);

  const showAlert = useCallback((config: typeof alertConfig) => {
    setAlertConfig(config);
    setAlertVisible(true);
  }, []);

  const hideAlert = useCallback(() => setAlertVisible(false), []);

  const fetchOrderDetails = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);
      setError(null);

      const storedToken = await SecureStore.getItemAsync('access_token');
      if (!storedToken) throw new Error('Authentication token not found');

      const response = await fetch(`${API_URL}/orders/orders/${orderId}/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${storedToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) throw new Error('Order not found');
        else if (response.status === 401) throw new Error('Authentication failed');
        else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch order details');
        }
      }

      setOrder(await response.json());
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch order details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (orderId) fetchOrderDetails();
  }, [orderId, fetchOrderDetails]);

  const formatDate = useCallback((dateString: string) =>
    new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }), []);

  const calculateItemTotal = useCallback((price: string, quantity: number) =>
    Math.floor(parseFloat(price) * quantity).toLocaleString(), []);

  const handleBackPress    = useCallback(() => router.back(), [router]);
  const handleReplaceHome  = useCallback(() => router.replace('/(tabs)'), [router]);
  const handleRefresh      = useCallback(() => fetchOrderDetails(true), [fetchOrderDetails]);
  const handleRetry        = useCallback(() => fetchOrderDetails(), [fetchOrderDetails]);
  const handleAlertConfirm = useCallback(() => { alertConfig.onConfirm(); hideAlert(); }, [alertConfig, hideAlert]);

  const handleSharePress = useCallback(() => {
    showAlert({ type: 'info', title: 'Share Order', message: 'Share functionality will be implemented soon.', onConfirm: () => {}, showCancel: false });
  }, [showAlert]);

  const handleTrackOrderPress = useCallback(() => {
    showAlert({ type: 'info', title: 'Track Order', message: 'Order tracking functionality will be available soon.', onConfirm: () => {}, showCancel: false });
  }, [showAlert]);

  // ── Render helpers ──────────────────────────────────────────────────────────
  const renderOrderHeader = useCallback(() => {
    if (!order) return null;
    const statusColor = getStatusColor(order.status);
    const statusBg    = getStatusBg(order.status);

    return (
      <View style={styles.section}>
        <View style={styles.sectionAccentLine} />
        <View style={styles.orderHeaderContainer}>
          <View style={styles.successIconWrapper}>
            <View style={styles.successIconRingOuter} />
            <View style={styles.successIconRingInner} />
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={40} color="#4ADE80" />
            </View>
          </View>
          <Text style={styles.eyebrow}>Order Confirmed</Text>
          <Text style={styles.successTitle}>Order Confirmed!</Text>
          <Text style={styles.successMessage}>
            Thank you for your order. We'll send you a shipping confirmation email when your items are on the way.
          </Text>
          <View style={styles.orderNumberContainer}>
            <Text style={styles.orderNumberLabel}>Order Number</Text>
            <Text style={styles.orderNumber}>#{order.id}</Text>
          </View>
          <View style={[styles.statusContainer, { backgroundColor: statusBg, borderColor: `${statusColor}40` }]}>
            <Ionicons name={getStatusIcon(order.status)} size={15} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1).toLowerCase()}
            </Text>
          </View>
        </View>
      </View>
    );
  }, [order, styles]);

  const renderOrderItems = useCallback(() => {
    if (!order) return null;
    return (
      <View style={styles.section}>
        <View style={styles.sectionAccentLine} />
        <View style={styles.sectionHeader}>
          <Ionicons name="cube-outline" size={16} color={colors.primary} />
          <Text style={styles.sectionTitle}>Order Items</Text>
        </View>
        {order.items.map((item, index) => (
          <View key={item.id}>
            <View style={styles.orderItem}>
              <View style={styles.itemImageWrapper}>
                <Image
                  source={{ uri: item.product_image || 'https://via.placeholder.com/60x60?text=No+Image' }}
                  style={styles.itemImage}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.itemDetails}>
                <Text style={styles.itemName} numberOfLines={2}>{item.product_name}</Text>
                <Text style={styles.itemPrice}>
                  KSh {Math.floor(parseFloat(item.product_price)).toLocaleString()} × {item.quantity}
                </Text>
              </View>
              <Text style={styles.itemTotal}>
                KSh {calculateItemTotal(item.product_price, item.quantity)}
              </Text>
            </View>
            {index < order.items.length - 1 && <View style={styles.itemDivider} />}
          </View>
        ))}
        <View style={styles.divider} />
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue} testID="order-total-price">
            KSh {Math.floor(parseFloat(order.total_price)).toLocaleString()}
          </Text>
        </View>
      </View>
    );
  }, [order, styles, colors.primary, calculateItemTotal]);

  const renderAddressInfo = useCallback(() => {
    if (!order) return null;
    return (
      <View style={styles.section}>
        <View style={styles.sectionAccentLine} />
        <View style={styles.sectionHeader}>
          <Ionicons name="location-outline" size={16} color={colors.primary} />
          <Text style={styles.sectionTitle}>Delivery Information</Text>
        </View>
        <View style={styles.addressContainer}>
          <View style={styles.addressRow}>
            <View style={styles.addressIconBadge}>
              <Ionicons name="location-outline" size={16} color={colors.primary} />
            </View>
            <Text style={styles.addressLabel}>Shipping Address</Text>
          </View>
          <Text style={styles.addressText}>{order.shipping_address}</Text>
        </View>
        {order.billing_address !== order.shipping_address && (
          <View style={[styles.addressContainer, { marginTop: 12 }]}>
            <View style={styles.addressRow}>
              <View style={styles.addressIconBadge}>
                <Ionicons name="card-outline" size={16} color={colors.primary} />
              </View>
              <Text style={styles.addressLabel}>Billing Address</Text>
            </View>
            <Text style={styles.addressText}>{order.billing_address}</Text>
          </View>
        )}
      </View>
    );
  }, [order, styles, colors.primary]);

  const renderOrderTimeline = useCallback(() => {
    if (!order) return null;
    return (
      <View style={styles.section}>
        <View style={styles.sectionAccentLine} />
        <View style={styles.sectionHeader}>
          <Ionicons name="time-outline" size={16} color={colors.primary} />
          <Text style={styles.sectionTitle}>Order Timeline</Text>
        </View>
        <View style={styles.timelineContainer}>
          <View style={styles.timelineItem}>
            <View style={styles.timelineDot}>
              <Ionicons name="receipt-outline" size={14} color={colors.primary} />
            </View>
            <View style={styles.timelineConnector} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Order Placed</Text>
              <Text style={styles.timelineDate}>{formatDate(order.created_at)}</Text>
            </View>
          </View>
          {order.updated_at !== order.created_at && (
            <View style={[styles.timelineItem, { marginTop: 12 }]}>
              <View style={[styles.timelineDot, styles.timelineDotAlt]}>
                <Ionicons name="refresh-outline" size={14} color={colors.textSecondary} />
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Last Updated</Text>
                <Text style={styles.timelineDate}>{formatDate(order.updated_at)}</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  }, [order, styles, colors.primary, colors.textSecondary, formatDate]);

  const renderError = useCallback(() => (
    <View style={styles.errorContainer}>
      <View style={styles.errorIconWrapper}>
        <Ionicons name="alert-circle-outline" size={40} color={colors.error} />
      </View>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorMessage}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  ), [styles, colors.error, error, handleRetry]);

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) return <FullScreenLoader message="Loading order details..." />;

  // ── Error ───────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress} accessibilityLabel="Back">
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Confirmation</Text>
          <View style={styles.headerSpacer} />
        </View>
        {renderError()}
      </SafeAreaView>
    );
  }

  // ── Main ────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <View style={styles.bgOverlay} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleReplaceHome}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerEyebrow}>IDEAL FURNITURE</Text>
          <Text style={styles.headerTitle}>Order Confirmation</Text>
        </View>
        <TouchableOpacity style={styles.shareButton} onPress={handleSharePress}>
          <Ionicons name="share-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {renderOrderHeader()}
        {renderOrderItems()}
        {renderAddressInfo()}
        {renderOrderTimeline()}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomContainer}>
        <View style={styles.bottomSeparator} />
        <View style={styles.bottomButtons}>
          <TouchableOpacity style={styles.continueShoppingButton} onPress={handleReplaceHome}>
            <Text style={styles.continueShoppingButtonText}>Continue Shopping</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.trackOrderButton} onPress={handleTrackOrderPress}>
            <Ionicons name="location-outline" size={18} color={colors.primaryText} style={styles.buttonIcon} />
            <Text style={styles.trackOrderButtonText}>Track Order</Text>
          </TouchableOpacity>
        </View>
      </View>

      <CustomAlert
        visible={alertVisible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={hideAlert}
        onConfirm={handleAlertConfirm}
        showCancel={alertConfig.showCancel}
        confirmText="OK"
        cancelText="Cancel"
      />
    </SafeAreaView>
  );
};

// ─── Dynamic Styles ───────────────────────────────────────────────────────────
const makeStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    bgOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: `${colors.primary}04`,
      pointerEvents: 'none',
    },

    // ── Header ───────────────────────────────────────────────────────────────
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
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
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerCenter: {
      alignItems: 'center',
      flex: 1,
      paddingHorizontal: 8,
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
      fontSize: 17,
      fontWeight: '700',
      color: colors.text,
      letterSpacing: 0.3,
    },
    headerSpacer: { width: 40 },
    shareButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // ── Scroll ────────────────────────────────────────────────────────────────
    scrollView: { flex: 1 },

    // ── Section card ──────────────────────────────────────────────────────────
    section: {
      backgroundColor: colors.surface,
      marginHorizontal: 16,
      marginTop: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      paddingHorizontal: 20,
      paddingBottom: 20,
      paddingTop: 0,
    },
    sectionAccentLine: {
      height: 2,
      backgroundColor: colors.primary,
      marginBottom: 20,
      opacity: 0.7,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 18,
    },
    eyebrow: {
      fontSize: 11,
      letterSpacing: 3,
      textTransform: 'uppercase',
      color: colors.primary,
      fontWeight: '600',
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      letterSpacing: 0.2,
    },

    // ── Order Header ──────────────────────────────────────────────────────────
    orderHeaderContainer: {
      alignItems: 'center',
    },
    successIconWrapper: {
      width: 88,
      height: 88,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },
    successIconRingOuter: {
      position: 'absolute',
      width: 88,
      height: 88,
      borderRadius: 44,
      borderWidth: 1,
      borderColor: 'rgba(74,222,128,0.15)',
    },
    successIconRingInner: {
      position: 'absolute',
      width: 66,
      height: 66,
      borderRadius: 33,
      borderWidth: 1,
      borderColor: 'rgba(74,222,128,0.30)',
      backgroundColor: 'rgba(74,222,128,0.06)',
    },
    successIconContainer: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: 'rgba(74,222,128,0.10)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    successTitle: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 10,
      textAlign: 'center',
      letterSpacing: 0.3,
    },
    successMessage: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 22,
      paddingHorizontal: 8,
    },
    orderNumberContainer: {
      backgroundColor: colors.primaryDim,
      paddingHorizontal: 24,
      paddingVertical: 14,
      borderRadius: 12,
      marginBottom: 16,
      minWidth: 200,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.primaryBorder,
    },
    orderNumberLabel: {
      fontSize: 11,
      letterSpacing: 2.5,
      textTransform: 'uppercase',
      color: colors.primary,
      marginBottom: 6,
      fontWeight: '600',
    },
    orderNumber: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.primary,
      letterSpacing: 1,
    },
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      gap: 6,
    },
    statusText: {
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.5,
    },

    // ── Order Items ───────────────────────────────────────────────────────────
    orderItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
    },
    itemImageWrapper: {
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.primaryBorder,
      overflow: 'hidden',
    },
    itemImage: {
      width: 60,
      height: 60,
      backgroundColor: colors.card,
    },
    itemDetails: {
      flex: 1,
      marginLeft: 14,
    },
    itemName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 6,
      letterSpacing: 0.1,
    },
    itemPrice: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    itemTotal: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.primary,
    },
    itemDivider: {
      height: 1,
      backgroundColor: colors.border,
    },
    divider: {
      height: 1,
      backgroundColor: colors.primaryBorder,
      marginVertical: 18,
      opacity: 0.6,
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    totalLabel: {
      fontSize: 11,
      letterSpacing: 2.5,
      textTransform: 'uppercase',
      color: colors.textSecondary,
      fontWeight: '600',
    },
    totalValue: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.primary,
      letterSpacing: 0.5,
    },

    // ── Address ───────────────────────────────────────────────────────────────
    addressContainer: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    addressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
      gap: 10,
    },
    addressIconBadge: {
      width: 30,
      height: 30,
      borderRadius: 8,
      backgroundColor: colors.primaryDim,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addressLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      letterSpacing: 0.2,
    },
    addressText: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 22,
      paddingLeft: 40,
    },

    // ── Timeline ──────────────────────────────────────────────────────────────
    timelineContainer: { paddingLeft: 4 },
    timelineItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    timelineDot: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: colors.primaryDim,
      borderWidth: 1,
      borderColor: colors.primaryBorder,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
      marginTop: 2,
    },
    timelineDotAlt: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    timelineConnector: {},
    timelineContent: {
      flex: 1,
      paddingBottom: 4,
    },
    timelineTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
      letterSpacing: 0.1,
    },
    timelineDate: {
      fontSize: 12,
      color: colors.textSecondary,
      letterSpacing: 0.2,
    },

    // ── Spacing ───────────────────────────────────────────────────────────────
    bottomSpacing: { height: 24 },

    // ── Bottom actions ────────────────────────────────────────────────────────
    bottomContainer: {
      backgroundColor: colors.stickyBackground,
      paddingHorizontal: 16,
      paddingBottom: 32,
      paddingTop: 0,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    bottomSeparator: {
      height: 1,
      backgroundColor: colors.primary,
      opacity: 0.25,
      marginBottom: 16,
    },
    bottomButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    continueShoppingButton: {
      flex: 1,
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: colors.primaryBorder,
      paddingVertical: 15,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    continueShoppingButtonText: {
      color: colors.primary,
      fontSize: 15,
      fontWeight: '600',
      letterSpacing: 0.3,
    },
    trackOrderButton: {
      flex: 1,
      backgroundColor: colors.primary,
      paddingVertical: 15,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
      elevation: 8,
    },
    trackOrderButtonText: {
      color: colors.primaryText,
      fontSize: 15,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    buttonIcon: { marginRight: 6 },

    // ── Error state ───────────────────────────────────────────────────────────
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
      backgroundColor: colors.background,
    },
    errorIconWrapper: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: `${colors.error}12`,
      borderWidth: 1,
      borderColor: `${colors.error}40`,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },
    errorTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 10,
      letterSpacing: 0.3,
    },
    errorMessage: {
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 28,
      lineHeight: 22,
    },
    retryButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 32,
      paddingVertical: 14,
      borderRadius: 12,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.30,
      shadowRadius: 10,
      elevation: 6,
    },
    retryButtonText: {
      color: colors.primaryText,
      fontSize: 15,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
  });

export default OrderConfirmation;
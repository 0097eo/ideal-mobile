import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '@/constants/api';
import * as SecureStore from 'expo-secure-store';
import { useThemes, AppColors } from '@/hooks/themes';
import { Order } from '@/types/order';
import CustomAlert from '@/components/CustomAlert';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getStatusPalette = (status: Order['status']) => {
  switch (status) {
    case 'DELIVERED':  return { fg: '#4ADE80', bg: 'rgba(74,222,128,0.12)' };
    case 'SHIPPED':    return { fg: '#60A5FA', bg: 'rgba(96,165,250,0.12)' };
    case 'PROCESSING': return { fg: '#FCD34D', bg: 'rgba(252,211,77,0.12)' };
    case 'PENDING':    return { fg: 'rgba(255,255,255,0.45)', bg: 'rgba(255,255,255,0.07)' };
    case 'CANCELLED':  return { fg: '#FF6B6B', bg: 'rgba(255,107,107,0.10)' };
    default:           return { fg: 'rgba(255,255,255,0.45)', bg: 'rgba(255,255,255,0.04)' };
  }
};

const getStatusIcon = (status: Order['status']): any => {
  switch (status) {
    case 'DELIVERED':  return 'checkmark-done-circle-outline';
    case 'SHIPPED':    return 'car-outline';
    case 'PROCESSING': return 'reload-outline';
    case 'PENDING':    return 'time-outline';
    case 'CANCELLED':  return 'close-circle-outline';
    default:           return 'help-circle-outline';
  }
};

// ─── Component ────────────────────────────────────────────────────────────────
const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'ongoing' | 'canceled'>('ongoing');
  const router = useRouter();
  const { colors, isDark } = useThemes();
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertProps, setAlertProps] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
  }>({ type: 'error', title: '', message: '' });

  const styles = makeStyles(colors);

  const showAlert = useCallback((
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string
  ) => {
    setAlertProps({ type, title, message });
    setAlertVisible(true);
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      const response = await fetch(`${API_URL}/orders/orders/`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      } else {
        showAlert('error', 'Error', 'Failed to fetch orders');
      }
    } catch (error) {
      showAlert('error', 'Error', 'Network error occurred');
      if (error instanceof Error) throw error;
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showAlert]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, [fetchOrders]);

  const getStatusText = (status: Order['status']) =>
    status.charAt(0) + status.slice(1).toLowerCase();

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });

  const filteredOrders = orders.filter(order =>
    activeTab === 'ongoing'
      ? ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status)
      : ['CANCELLED'].includes(order.status)
  );

  const handleBack = () => router.back();

  const renderOrderItem = ({ item }: { item: Order }) => {
    const mainItem = item.items[0];
    const additionalItemsCount = item.items.length - 1;
    const { fg: statusFg, bg: statusBg } = getStatusPalette(item.status);

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => router.push({
          pathname: '/(screens)/order-details/[orderId]',
          params: { orderId: item.id },
        })}
        activeOpacity={0.82}
      >
        <View style={styles.cardAccentLine} />

        <View style={styles.orderHeader}>
          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: mainItem.product_image || 'https://via.placeholder.com/60x60' }}
              style={styles.productImage}
              defaultSource={{ uri: 'https://via.placeholder.com/60x60' }}
            />
            <View style={styles.imageShine} />
          </View>

          <View style={styles.orderInfo}>
            <Text style={styles.productName} numberOfLines={2}>
              {mainItem.product_name}
              {additionalItemsCount > 0 && (
                <Text style={styles.moreItems}>{` +${additionalItemsCount} more`}</Text>
              )}
            </Text>
            <Text style={styles.orderId}>Order #{item.id}</Text>
            <View style={styles.statusContainer}>
              <View style={[styles.statusBadge, { backgroundColor: statusBg, borderColor: `${statusFg}40` }]}>
                <Ionicons name={getStatusIcon(item.status)} size={11} color={statusFg} />
                <Text style={[styles.statusText, { color: statusFg }]}>
                  {getStatusText(item.status)}
                </Text>
              </View>
            </View>
            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={12} color={colors.textTertiary} />
              <Text style={styles.orderDate}>On {formatDate(item.created_at)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.orderFooter}>
          <View style={styles.footerLeft}>
            <Text style={styles.totalPrice}>
              {'Total: '}
              <Text style={styles.totalPriceValue}>
                KSh {Number(item.total_price).toLocaleString(undefined, { minimumFractionDigits: 0 })}
              </Text>
            </Text>
          </View>
          <View style={styles.footerRight}>
            <View style={styles.itemCountBadge}>
              <Ionicons name="cube-outline" size={12} color={colors.primary} />
              <Text style={styles.itemCount}>
                {item.items.length} item{item.items.length > 1 ? 's' : ''}
              </Text>
            </View>
            <View style={styles.chevronBadge}>
              <Ionicons name="chevron-forward" size={14} color={colors.primary} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const headerBlock = (
    <View style={styles.header} testID='OrdersScreenHeader'>
      <TouchableOpacity
        style={styles.backButton}
        onPress={handleBack}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Ionicons name="arrow-back" size={22} color={colors.text} />
      </TouchableOpacity>
      <View style={styles.headerCenter}>
        <Text style={styles.headerEyebrow}>IDEAL FURNITURE</Text>
        <Text style={styles.headerTitle}>Orders</Text>
      </View>
      <View style={styles.headerSpacer} />
    </View>
  );

  // ─── Loading State ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={colors.background}
        />
        {headerBlock}
        <View style={styles.loadingContainer}>
          <View style={styles.loadingIconRing}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
          <Text style={styles.loadingText}>Loading your orders…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Main Render ──────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      {headerBlock}

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'ongoing' && styles.activeTab]}
          onPress={() => setActiveTab('ongoing')}
        >
          {activeTab === 'ongoing' && <View style={styles.tabActivePill} />}
          <Text style={[styles.tabText, activeTab === 'ongoing' && styles.activeTabText]}>
            ONGOING/DELIVERED
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'canceled' && styles.activeTab]}
          onPress={() => setActiveTab('canceled')}
        >
          {activeTab === 'canceled' && <View style={styles.tabActivePill} />}
          <Text style={[styles.tabText, activeTab === 'canceled' && styles.activeTabText]}>
            CANCELED/RETURNED
          </Text>
        </TouchableOpacity>
      </View>

      {/* List header */}
      <View style={styles.listHeader}>
        <View style={styles.listEyebrowRow}>
          <Ionicons name="receipt-outline" size={13} color={colors.primary} />
          <Text style={styles.listEyebrow}>
            {activeTab === 'ongoing' ? 'Active Orders' : 'Cancelled Orders'}
          </Text>
        </View>
        <Text style={styles.listCount}>
          {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconRing}>
              <View style={styles.emptyIconInner}>
                <Ionicons
                  name={activeTab === 'ongoing' ? 'bag-outline' : 'close-circle-outline'}
                  size={32}
                  color={colors.primary}
                />
              </View>
            </View>
            <Text style={styles.emptyEyebrow}>
              {activeTab === 'ongoing' ? 'ONGOING ORDERS' : 'CANCELLED ORDERS'}
            </Text>
            <Text style={styles.emptyText}>
              No {activeTab === 'ongoing' ? 'ongoing' : 'canceled'} orders found
            </Text>
            <Text style={styles.emptySubtext}>
              {activeTab === 'ongoing'
                ? 'Your active and delivered orders will appear here.'
                : 'Any cancelled or returned orders will appear here.'}
            </Text>
          </View>
        }
      />

      <CustomAlert
        visible={alertVisible}
        type={alertProps.type}
        title={alertProps.title}
        message={alertProps.message}
        onClose={() => setAlertVisible(false)}
        confirmText="OK"
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

    // ── Header ────────────────────────────────────────────────────────────
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: Platform.OS === 'ios' ? 0 : 10,
      paddingBottom: 14,
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

    // ── Loading ───────────────────────────────────────────────────────────
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 20,
    },
    loadingIconRing: {
      width: 80,
      height: 80,
      borderRadius: 40,
      borderWidth: 1,
      borderColor: colors.primaryBorder,
      backgroundColor: colors.primaryDim,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 14,
      color: colors.textSecondary,
      letterSpacing: 0.5,
    },

    // ── Tabs ──────────────────────────────────────────────────────────────
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: colors.stickyBackground,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tab: {
      flex: 1,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      gap: 4,
    },
    activeTab: {},
    tabActivePill: {
      position: 'absolute',
      bottom: 0,
      left: '15%',
      right: '15%',
      height: 2,
      backgroundColor: colors.primary,
      borderRadius: 2,
    },
    tabText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textTertiary,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
    },
    activeTabText: {
      color: colors.primary,
    },

    // ── List header ───────────────────────────────────────────────────────
    listHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 10,
    },
    listEyebrowRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    listEyebrow: {
      fontSize: 11,
      letterSpacing: 2.5,
      textTransform: 'uppercase',
      color: colors.primary,
      fontWeight: '600',
    },
    listCount: {
      fontSize: 12,
      color: colors.textSecondary,
      letterSpacing: 0.5,
    },

    // ── List ──────────────────────────────────────────────────────────────
    listContainer: {
      paddingHorizontal: 16,
      paddingBottom: 32,
      gap: 12,
    },

    // ── Order Card ────────────────────────────────────────────────────────
    orderCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 5,
    },
    cardAccentLine: {
      height: 2,
      backgroundColor: colors.primary,
      opacity: 0.55,
    },
    orderHeader: {
      flexDirection: 'row',
      padding: 16,
      paddingBottom: 14,
    },

    // Image
    imageWrapper: {
      position: 'relative',
      borderRadius: 12,
      overflow: 'hidden',
      marginRight: 14,
      borderWidth: 1,
      borderColor: colors.primaryBorder,
    },
    productImage: {
      width: 72,
      height: 72,
      backgroundColor: colors.card,
    },
    imageShine: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: 30,
      height: 30,
      backgroundColor: 'rgba(255,255,255,0.06)',
      borderRadius: 4,
      transform: [{ rotate: '45deg' }, { translateX: -10 }, { translateY: -10 }],
    },

    // Order info
    orderInfo: {
      flex: 1,
      gap: 5,
    },
    productName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      lineHeight: 21,
      letterSpacing: 0.1,
    },
    moreItems: {
      fontSize: 13,
      color: colors.primary,
      fontWeight: '500',
    },
    orderId: {
      fontSize: 12,
      color: colors.textSecondary,
      letterSpacing: 0.3,
    },

    // Status
    statusContainer: {
      marginTop: 2,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 6,
      borderWidth: 1,
      alignSelf: 'flex-start',
    },
    statusText: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },

    // Date
    dateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginTop: 2,
    },
    orderDate: {
      fontSize: 12,
      color: colors.textTertiary,
      letterSpacing: 0.2,
    },

    // Footer
    orderFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.card,
    },
    footerLeft: {
      gap: 2,
    },
    footerLabel: {
      fontSize: 10,
      letterSpacing: 2,
      textTransform: 'uppercase',
      color: colors.textTertiary,
      fontWeight: '600',
    },
    totalPrice: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textSecondary,
      letterSpacing: 0.2,
    },
    totalPriceValue: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.primary,
      letterSpacing: 0.3,
    },
    footerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    itemCountBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: colors.primaryDim,
      borderWidth: 1,
      borderColor: colors.primaryBorder,
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 6,
    },
    itemCount: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: '600',
      letterSpacing: 0.3,
    },
    chevronBadge: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.primaryDim,
      borderWidth: 1,
      borderColor: colors.primaryBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // ── Empty State ───────────────────────────────────────────────────────
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 64,
      paddingHorizontal: 32,
      gap: 12,
    },
    emptyIconRing: {
      width: 100,
      height: 100,
      borderRadius: 50,
      borderWidth: 1,
      borderColor: colors.primaryDim,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    emptyIconInner: {
      width: 72,
      height: 72,
      borderRadius: 36,
      borderWidth: 1,
      borderColor: colors.primaryBorder,
      backgroundColor: colors.primaryDim,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyEyebrow: {
      fontSize: 11,
      letterSpacing: 3,
      textTransform: 'uppercase',
      color: colors.primary,
      fontWeight: '600',
    },
    emptyText: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      letterSpacing: 0.2,
    },
    emptySubtext: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginTop: 4,
    },
  });

export default Orders;
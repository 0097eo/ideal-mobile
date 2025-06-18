import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemes } from '@/hooks/themes';
import { FullScreenLoader } from '@/components/LoadingSpinner';
import CustomAlert from '@/components/CustomAlert'; 
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '@/constants/api';
import { Order } from '@/types/order';


const OrderConfirmation: React.FC = () => {
  const { colors } = useThemes();
  const router = useRouter();
  const { orderId } = useLocalSearchParams();

  // State management
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Alert states
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
    title: '',
    message: '',
    onConfirm: () => {},
    showCancel: false,
  });

  const showAlert = useCallback((config: typeof alertConfig) => {
    setAlertConfig(config);
    setAlertVisible(true);
  }, []);

  const hideAlert = useCallback(() => {
    setAlertVisible(false);
  }, []);

  // Memoize the fetch function to prevent unnecessary re-renders
  const fetchOrderDetails = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const storedToken = await SecureStore.getItemAsync('access_token');
      if (!storedToken) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`${API_URL}/orders/orders/${orderId}/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${storedToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Order not found');
        } else if (response.status === 401) {
          throw new Error('Authentication failed');
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch order details');
        }
      }

      const orderData = await response.json();
      setOrder(orderData);
    } catch (error) {
      console.error('Failed to fetch order:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch order details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orderId]); // Only depend on orderId

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId, fetchOrderDetails]);

  // Memoize utility functions
  const getStatusColor = useCallback((status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return '#F59E0B'; // amber
      case 'confirmed':
        return '#3B82F6'; // blue
      case 'shipped':
        return '#8B5CF6'; // purple
      case 'delivered':
        return '#10B981'; // green
      case 'cancelled':
        return '#EF4444'; // red
      default:
        return colors.textSecondary;
    }
  }, [colors.textSecondary]);

  const getStatusIcon = useCallback((status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'time-outline';
      case 'confirmed':
        return 'checkmark-circle-outline';
      case 'shipped':
        return 'car-outline';
      case 'delivered':
        return 'checkmark-done-circle-outline';
      case 'cancelled':
        return 'close-circle-outline';
      default:
        return 'help-circle-outline';
    }
  }, []);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const calculateItemTotal = useCallback((price: string, quantity: number) => {
    return Math.floor(parseFloat(price) * quantity).toLocaleString();
  }, []);

  // Memoize styles to prevent recreation on every render
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  // Memoize navigation handlers
  const handleBackPress = useCallback(() => {
    router.back();
  }, [router]);

  const handleReplaceHome = useCallback(() => {
    router.replace('/(tabs)');
  }, [router]);

  const handleSharePress = useCallback(() => {
    showAlert({
      type: 'info',
      title: 'Share Order',
      message: 'Share functionality will be implemented soon.',
      onConfirm: () => {},
      showCancel: false,
    });
  }, [showAlert]);

  const handleTrackOrderPress = useCallback(() => {
    showAlert({
      type: 'info',
      title: 'Track Order',
      message: 'Order tracking functionality will be available soon.',
      onConfirm: () => {},
      showCancel: false,
    });
  }, [showAlert]);

  const handleRefresh = useCallback(() => {
    fetchOrderDetails(true);
  }, [fetchOrderDetails]);

  const handleRetry = useCallback(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  const handleAlertConfirm = useCallback(() => {
    alertConfig.onConfirm();
    hideAlert();
  }, [alertConfig, hideAlert]);

  const renderOrderHeader = useCallback(() => {
    if (!order) return null;
    
    return (
      <View style={styles.section}>
        <View style={styles.orderHeaderContainer}>
          <View style={styles.successIconContainer}>
            <Ionicons name="checkmark-circle" size={48} color="#10B981" />
          </View>
          
          <Text style={styles.successTitle}>Order Confirmed!</Text>
          <Text style={styles.successMessage}>
            Thank you for your order. We'll send you a shipping confirmation email when your items are on the way.
          </Text>
          
          <View style={styles.orderNumberContainer}>
            <Text style={styles.orderNumberLabel}>Order Number</Text>
            <Text style={styles.orderNumber}>#{order.id}</Text>
          </View>
          
          <View style={styles.statusContainer}>
            <Ionicons 
              name={getStatusIcon(order.status) as any} 
              size={20} 
              color={getStatusColor(order.status)} 
            />
            <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1).toLowerCase()}
            </Text>
          </View>
        </View>
      </View>
    );
  }, [order, styles, getStatusIcon, getStatusColor]);

  const renderOrderItems = useCallback(() => {
    if (!order) return null;
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Items</Text>
        
        {order.items.map((item) => (
          <View key={item.id} style={styles.orderItem}>
            <Image
              source={{
                uri: item.product_image || 'https://via.placeholder.com/60x60?text=No+Image'
              }}
              style={styles.itemImage}
              resizeMode="cover"
            />
            
            <View style={styles.itemDetails}>
              <Text style={styles.itemName} numberOfLines={2}>
                {item.product_name}
              </Text>
              <Text style={styles.itemPrice}>
                KSh {Math.floor(parseFloat(item.product_price)).toLocaleString()} × {item.quantity}
              </Text>
            </View>
            
            <Text style={styles.itemTotal}>
              KSh {calculateItemTotal(item.product_price, item.quantity)}
            </Text>
          </View>
        ))}
        
        <View style={styles.divider} />
        
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>
            KSh {Math.floor(parseFloat(order.total_price)).toLocaleString()}
          </Text>
        </View>
      </View>
    );
  }, [order, styles, calculateItemTotal]);

  const renderAddressInfo = useCallback(() => {
    if (!order) return null;
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Delivery Information</Text>
        
        <View style={styles.addressContainer}>
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={20} color={colors.primary} />
            <Text style={styles.addressLabel}>Shipping Address</Text>
          </View>
          <Text style={styles.addressText}>{order.shipping_address}</Text>
        </View>
        
        {order.billing_address !== order.shipping_address && (
          <View style={styles.addressContainer}>
            <View style={styles.addressRow}>
              <Ionicons name="card-outline" size={20} color={colors.primary} />
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
        <Text style={styles.sectionTitle}>Order Timeline</Text>
        
        <View style={styles.timelineContainer}>
          <View style={styles.timelineItem}>
            <Ionicons name="receipt-outline" size={16} color={colors.primary} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Order Placed</Text>
              <Text style={styles.timelineDate}>{formatDate(order.created_at)}</Text>
            </View>
          </View>
          
          {order.updated_at !== order.created_at && (
            <View style={styles.timelineItem}>
              <Ionicons name="refresh-outline" size={16} color={colors.primary} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Last Updated</Text>
                <Text style={styles.timelineDate}>{formatDate(order.updated_at)}</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  }, [order, styles, colors.primary, formatDate]);

  const renderError = useCallback(() => {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }, [styles, colors.error, error, handleRetry]);

  if (loading) {
    return <FullScreenLoader message="Loading order details..." />;
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Confirmation</Text>
          <View style={styles.headerSpacer} />
        </View>
        {renderError()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleReplaceHome}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Confirmation</Text>
        <TouchableOpacity style={styles.shareButton} onPress={handleSharePress}>
          <Ionicons name="share-outline" size={24} color={colors.text} />
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
          />
        }
      >
        {renderOrderHeader()}
        {renderOrderItems()}
        {renderAddressInfo()}
        {renderOrderTimeline()}
        
        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.continueShoppingButton}
          onPress={handleReplaceHome}
        >
          <Text style={styles.continueShoppingButtonText}>Continue Shopping</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.trackOrderButton}
          onPress={handleTrackOrderPress}
        >
          <Ionicons name="location-outline" size={20} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.trackOrderButtonText}>Track Order</Text>
        </TouchableOpacity>
      </View>

      {/* Custom Alert */}
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

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  headerSpacer: {
    width: 40,
  },
  shareButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  orderHeaderContainer: {
    alignItems: 'center',
  },
  successIconContainer: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  orderNumberContainer: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
    minWidth: 200,
    alignItems: 'center',
  },
  orderNumberLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: colors.border,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  addressContainer: {
    marginBottom: 16,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  addressText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  timelineContainer: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  timelineContent: {
    marginLeft: 12,
    flex: 1,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  timelineDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  bottomSpacing: {
    height: 20,
  },
  bottomContainer: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    gap: 12,
  },
  continueShoppingButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueShoppingButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  trackOrderButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  trackOrderButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 6,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: colors.background,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OrderConfirmation;
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  Platform,
  TextInput,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '@/constants/api';
import * as SecureStore from 'expo-secure-store';
import { useThemes } from '@/hooks/themes';
import { OrderItem, Order } from '@/types/order';
import CustomAlert from '@/components/CustomAlert';
import { LoadingSpinner, FullScreenLoader } from '@/components/LoadingSpinner';

const OrderDetails = () => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [shippingAddress, setShippingAddress] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [updatingAddress, setUpdatingAddress] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState(false);
  
  // Custom Alert states
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: 'OK',
    cancelText: 'Cancel',
    showCancel: false,
  });

  const router = useRouter();
  const { orderId } = useLocalSearchParams();
  const { colors, isDark } = useThemes();

  // Helper function to show custom alert
  const showAlert = (config: {
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    onConfirm?: () => void;
    confirmText?: string;
    cancelText?: string;
    showCancel?: boolean;
  }) => {
    setAlertConfig({
      type: config.type,
      title: config.title,
      message: config.message,
      onConfirm: config.onConfirm || (() => setAlertVisible(false)),
      confirmText: config.confirmText || 'OK',
      cancelText: config.cancelText || 'Cancel',
      showCancel: config.showCancel || false,
    });
    setAlertVisible(true);
  };

  const fetchOrderDetails = async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      
      const response = await fetch(`${API_URL}/orders/orders/${orderId}/`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrder(data);
        setShippingAddress(data.shipping_address || '');
        setBillingAddress(data.billing_address || '');
      } else {
        showAlert({
          type: 'error',
          title: 'Error',
          message: 'Failed to fetch order details'
        });
      }
    } catch (error) {
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'Network error occurred'
      });
      throw error
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async () => {
    if (!order) return;

    setCancellingOrder(true);
    try {
      const token = await SecureStore.getItemAsync('access_token');
      
      const response = await fetch(`${API_URL}/orders/orders/${order.id}/delete/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        showAlert({
          type: 'success',
          title: 'Order Cancelled',
          message: data.message || 'Your order has been cancelled successfully.',
          onConfirm: () => {
            setAlertVisible(false);
            router.back();
          }
        });
      } else {
        const errorData = await response.json();
        showAlert({
          type: 'error',
          title: 'Error',
          message: errorData.error || 'Failed to cancel order'
        });
      }
    } catch (error) {
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'Network error occurred while cancelling order'
      });
      throw error
    } finally {
      setCancellingOrder(false);
    }
  };

  const updateOrderAddress = async () => {
    if (!order) return;

    setUpdatingAddress(true);
    try {
      const token = await SecureStore.getItemAsync('access_token');
      
      const updateData: any = {};
      if (shippingAddress.trim() !== order.shipping_address) {
        updateData.shipping_address = shippingAddress.trim();
      }
      if (billingAddress.trim() !== order.billing_address) {
        updateData.billing_address = billingAddress.trim();
      }

      if (Object.keys(updateData).length === 0) {
        showAlert({
          type: 'info',
          title: 'No Changes',
          message: 'No address changes were made.',
          onConfirm: () => {
            setAlertVisible(false);
            setAddressModalVisible(false);
          }
        });
        setUpdatingAddress(false);
        return;
      }
      
      const response = await fetch(`${API_URL}/orders/orders/${order.id}/address/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const updatedOrder = await response.json();
        setOrder(updatedOrder);
        setAddressModalVisible(false);
        showAlert({
          type: 'success',
          title: 'Success',
          message: 'Order addresses updated successfully'
        });
      } else {
        const errorData = await response.json();
        showAlert({
          type: 'error',
          title: 'Error',
          message: errorData.error || 'Failed to update order addresses'
        });
      }
    } catch (error) {
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'Network error occurred while updating addresses'
      });
      throw error
    } finally {
      setUpdatingAddress(false);
    }
  };

  const handleCancelOrder = () => {
    showAlert({
      type: 'warning',
      title: 'Cancel Order',
      message: 'Are you sure you want to cancel this order? This action cannot be undone.',
      showCancel: true,
      confirmText: 'Yes, Cancel',
      cancelText: 'No',
      onConfirm: () => {
        setAlertVisible(false);
        cancelOrder();
      }
    });
  };

  const openAddressModal = () => {
    if (order) {
      setShippingAddress(order.shipping_address || '');
      setBillingAddress(order.billing_address || '');
      setAddressModalVisible(true);
    }
  };

  const closeAddressModal = () => {
    setAddressModalVisible(false);
    if (order) {
      setShippingAddress(order.shipping_address || '');
      setBillingAddress(order.billing_address || '');
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'DELIVERED':
        return colors.success;
      case 'SHIPPED':
        return '#2196F3';
      case 'PROCESSING':
        return colors.warning;
      case 'PENDING':
        return colors.textTertiary;
      case 'CANCELLED':
        return colors.error;
      default:
        return colors.textTertiary;
    }
  };

  const getStatusText = (status: Order['status']) => {
    return status.charAt(0) + status.slice(1).toLowerCase();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleBack = () => {
    router.back();
  };

  const renderOrderItem = (item: OrderItem, index: number) => (
    <View key={item.id} style={[styles.itemCard, { backgroundColor: colors.card }]}>
      <Image
        source={{ 
          uri: item.product_image || 'https://via.placeholder.com/80x80'
        }}
        style={[styles.itemImage, { backgroundColor: colors.border }]}
        defaultSource={{ uri: 'https://via.placeholder.com/80x80' }}
      />
      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={2}>
          {item.product_name}
        </Text>
        <Text style={[styles.itemPrice, { color: colors.textSecondary }]}>
          KSh {Number(item.product_price).toLocaleString(undefined, { minimumFractionDigits: 0 })}
        </Text>
        <Text style={[styles.itemQuantity, { color: colors.textSecondary }]}>
          Quantity: {item.quantity}
        </Text>
      </View>
      <View style={styles.itemSubtotal}>
        <Text style={[styles.subtotalText, { color: colors.text }]}>
          KSh {Number(item.subtotal).toLocaleString(undefined, { minimumFractionDigits: 0 })}
        </Text>
      </View>
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: Platform.OS === 'ios' ? 50 : 20,
      paddingBottom: 16,
      backgroundColor: colors.navigationBackground,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginTop: 20,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.navigationText,
    },
    scrollContainer: {
      padding: 16,
    },
    orderCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 20,
      marginBottom: 16,
      elevation: 2,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    orderHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    orderIdContainer: {
      flex: 1,
    },
    orderIdText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    orderDateText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    statusContainer: {
      alignItems: 'flex-end',
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      marginBottom: 4,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#FFFFFF',
      textTransform: 'uppercase',
    },
    orderTimeText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
      marginTop: 8,
    },
    itemCard: {
      flexDirection: 'row',
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
      elevation: 1,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 1,
    },
    itemImage: {
      width: 80,
      height: 80,
      borderRadius: 8,
      marginRight: 12,
    },
    itemInfo: {
      flex: 1,
      justifyContent: 'space-between',
    },
    itemName: {
      fontSize: 16,
      fontWeight: '500',
      lineHeight: 20,
      marginBottom: 4,
    },
    itemPrice: {
      fontSize: 14,
      marginBottom: 4,
    },
    itemQuantity: {
      fontSize: 14,
    },
    itemSubtotal: {
      justifyContent: 'center',
      alignItems: 'flex-end',
    },
    subtotalText: {
      fontSize: 16,
      fontWeight: '600',
    },
    addressCard: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 16,
      marginBottom: 12,
    },
    addressTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    addressText: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    summaryCard: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 16,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
    },
    summaryLabel: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    summaryValue: {
      fontSize: 14,
      color: colors.text,
    },
    totalRow: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      marginTop: 8,
      paddingTop: 12,
    },
    totalText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    customerInfo: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 16,
    },
    customerEmail: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    actionButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 24,
      alignItems: 'center',
      marginTop: 16,
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: 20
    },
    actionButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
      marginLeft: 8,
    },
    cancelButton: {
      backgroundColor: colors.error,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 12,
    },
    flexButton: {
      flex: 1,
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContainer: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 20,
      width: '100%',
      maxHeight: '80%',
      position: 'relative',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 20,
      textAlign: 'center',
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 8,
      marginTop: 16,
    },
    textInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 14,
      color: colors.text,
      backgroundColor: colors.surface,
      minHeight: 80,
      textAlignVertical: 'top',
    },
    modalButtonRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 24,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    modalCancelButton: {
      backgroundColor: colors.textTertiary,
    },
    modalSaveButton: {
      backgroundColor: colors.primary,
    },
    modalButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar 
          barStyle={isDark ? 'light-content' : 'dark-content'} 
          backgroundColor={colors.navigationBackground} 
        />
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
        </View>
        
        <FullScreenLoader message="Loading order details..." />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.container}>
        <StatusBar 
          barStyle={isDark ? 'light-content' : 'dark-content'} 
          backgroundColor={colors.navigationBackground} 
        />
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
        </View>
        
        <View style={styles.loadingContainer}>
          <Text style={{ color: colors.textSecondary }}>Order not found</Text>
        </View>
      </View>
    );
  }

  const subtotal = order.items.reduce((sum, item) => sum + Number(item.subtotal), 0);

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        backgroundColor={colors.navigationBackground} 
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
      </View>
      
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Order Overview */}
        <View style={styles.orderCard}>
          <View style={styles.orderHeader}>
            <View style={styles.orderIdContainer}>
              <Text style={styles.orderIdText}>Order #{order.id}</Text>
              <Text style={styles.orderDateText}>{formatDate(order.created_at)}</Text>
            </View>
            <View style={styles.statusContainer}>
              <View 
                style={[
                  styles.statusBadge, 
                  { backgroundColor: getStatusColor(order.status) }
                ]}
              >
                <Text style={styles.statusText}>
                  {getStatusText(order.status)}
                </Text>
              </View>
              <Text style={styles.orderTimeText}>{formatTime(order.created_at)}</Text>
            </View>
          </View>

          {/* Customer Information */}
          <Text style={styles.sectionTitle}>Customer</Text>
          <View style={styles.customerInfo}>
            <Text style={styles.customerEmail}>{order.user_email}</Text>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.orderCard}>
          <Text style={styles.sectionTitle}>Items ({order.items.length})</Text>
          {order.items.map((item, index) => renderOrderItem(item, index))}
        </View>

        {/* Addresses */}
        <View style={styles.orderCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.sectionTitle}>Addresses</Text>
            {order.status === 'PENDING' && (
              <TouchableOpacity onPress={openAddressModal}>
                <Ionicons name="pencil" size={20} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.addressCard}>
            <Text style={styles.addressTitle}>Shipping Address</Text>
            <Text style={styles.addressText}>{order.shipping_address}</Text>
          </View>

          <View style={styles.addressCard}>
            <Text style={styles.addressTitle}>Billing Address</Text>
            <Text style={styles.addressText}>{order.billing_address}</Text>
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.orderCard}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>
                KSh {subtotal.toLocaleString(undefined, { minimumFractionDigits: 0 })}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Items</Text>
              <Text style={styles.summaryValue}>{order.items.length}</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalText}>Total</Text>
              <Text style={styles.totalText}>
                KSh {Number(order.total_price).toLocaleString(undefined, { minimumFractionDigits: 0 })}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        {order.status === 'PENDING' && (
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.cancelButton, styles.flexButton]}
              onPress={handleCancelOrder}
              disabled={cancellingOrder}
            >
              {!cancellingOrder && <Ionicons name="close-circle" size={16} color="#FFFFFF" />}
              <Text style={styles.actionButtonText}>
                {cancellingOrder ? 'Cancelling...' : 'Cancel Order'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {order.status === 'DELIVERED' && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
              // Handle reorder
              console.log('Reorder:', order.id);
            }}
          >
            <Ionicons name="refresh" size={16} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Reorder</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Address Update Modal */}
      <Modal
        visible={addressModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeAddressModal}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Update Order Addresses</Text>
              
              <Text style={[styles.inputLabel, { marginTop: 0 }]}>Shipping Address</Text>
              <TextInput
                style={styles.textInput}
                value={shippingAddress}
                onChangeText={setShippingAddress}
                placeholder="Enter shipping address"
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={3}
                editable={!updatingAddress}
              />
              
              <Text style={styles.inputLabel}>Billing Address</Text>
              <TextInput
                style={styles.textInput}
                value={billingAddress}
                onChangeText={setBillingAddress}
                placeholder="Enter billing address"
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={3}
                editable={!updatingAddress}
              />
              
              <View style={styles.modalButtonRow}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalCancelButton]}
                  onPress={closeAddressModal}
                  disabled={updatingAddress}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalSaveButton]}
                  onPress={updateOrderAddress}
                  disabled={updatingAddress}
                >
                  <Text style={styles.modalButtonText}>
                    {updatingAddress ? 'Updating...' : 'Update'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Loading Spinner inside modal */}
              {updatingAddress && (
                <View style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: 12,
                }}>
                  <LoadingSpinner message="Updating addresses..." />
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Custom Alert */}
      <CustomAlert
        visible={alertVisible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertVisible(false)}
        onConfirm={alertConfig.onConfirm}
        confirmText={alertConfig.confirmText}
        cancelText={alertConfig.cancelText}
        showCancel={alertConfig.showCancel}
      />

      {cancellingOrder && (
        <LoadingSpinner message="Cancelling order..." />
      )}
    </View>
  );
};

export default OrderDetails;
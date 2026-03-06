import React, { useState, useEffect, useCallback } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '@/constants/api';
import * as SecureStore from 'expo-secure-store';
import { useThemes, AppColors } from '@/hooks/themes';
import { OrderItem, Order } from '@/types/order';
import CustomAlert from '@/components/CustomAlert';
import { LoadingSpinner, FullScreenLoader } from '@/components/LoadingSpinner';

// ── Status colors (semantic, not theme tokens) ─────────────────
const STATUS_COLORS: Record<string, string> = {
  DELIVERED:  '#10B981',
  SHIPPED:    '#3B82F6',
  PROCESSING: '#F59E0B',
  PENDING:    'rgba(255,255,255,0.35)',
  CANCELLED:  '#FF6B6B',
};

const OrderDetails = () => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [shippingAddress, setShippingAddress] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [updatingAddress, setUpdatingAddress] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState(false);

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

  const styles = makeStyles(colors);

  const showAlert = useCallback((config: {
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
  }, []);

  const cancelOrder = async () => {
    if (!order) return;
    setCancellingOrder(true);
    try {
      const token = await SecureStore.getItemAsync('access_token');
      const response = await fetch(`${API_URL}/orders/orders/${order.id}/delete/`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        showAlert({ type: 'success', title: 'Order Cancelled', message: data.message || 'Your order has been cancelled successfully.', onConfirm: () => { setAlertVisible(false); router.back(); } });
      } else {
        const errorData = await response.json();
        showAlert({ type: 'error', title: 'Error', message: errorData.error || 'Failed to cancel order' });
      }
    } catch (err) {
      showAlert({ type: 'error', title: 'Error', message: 'Network error occurred while cancelling order' });
      throw err;
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
      if (shippingAddress.trim() !== order.shipping_address) updateData.shipping_address = shippingAddress.trim();
      if (billingAddress.trim() !== order.billing_address) updateData.billing_address = billingAddress.trim();
      if (Object.keys(updateData).length === 0) {
        showAlert({ type: 'info', title: 'No Changes', message: 'No address changes were made.', onConfirm: () => { setAlertVisible(false); setAddressModalVisible(false); } });
        setUpdatingAddress(false);
        return;
      }
      const response = await fetch(`${API_URL}/orders/orders/${order.id}/address/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(updateData),
      });
      if (response.ok) {
        const updatedOrder = await response.json();
        setOrder(updatedOrder);
        setAddressModalVisible(false);
        showAlert({ type: 'success', title: 'Success', message: 'Order addresses updated successfully' });
      } else {
        const errorData = await response.json();
        showAlert({ type: 'error', title: 'Error', message: errorData.error || 'Failed to update order addresses' });
      }
    } catch (err) {
      showAlert({ type: 'error', title: 'Error', message: 'Network error occurred while updating addresses' });
      throw err;
    } finally {
      setUpdatingAddress(false);
    }
  };

  const handleCancelOrder = () => {
    showAlert({ type: 'warning', title: 'Cancel Order', message: 'Are you sure you want to cancel this order? This action cannot be undone.', showCancel: true, confirmText: 'Yes, Cancel', cancelText: 'No', onConfirm: () => { setAlertVisible(false); cancelOrder(); } });
  };

  const openAddressModal = () => {
    if (order) { setShippingAddress(order.shipping_address || ''); setBillingAddress(order.billing_address || ''); setAddressModalVisible(true); }
  };

  const closeAddressModal = () => {
    setAddressModalVisible(false);
    if (order) { setShippingAddress(order.shipping_address || ''); setBillingAddress(order.billing_address || ''); }
  };

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const token = await SecureStore.getItemAsync('access_token');
        const response = await fetch(`${API_URL}/orders/orders/${orderId}/`, {
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setOrder(data);
          setShippingAddress(data.shipping_address || '');
          setBillingAddress(data.billing_address || '');
        } else {
          showAlert({ type: 'error', title: 'Error', message: 'Failed to fetch order details' });
        }
      } catch (err) {
        showAlert({ type: 'error', title: 'Error', message: 'Network error occurred' });
        throw err;
      } finally {
        setLoading(false);
      }
    };
    if (orderId) fetchOrderDetails();
  }, [orderId, showAlert]);

  const getStatusColor = (status: Order['status']) => STATUS_COLORS[status] ?? colors.textTertiary;
  const getStatusText  = (status: Order['status']) => status.charAt(0) + status.slice(1).toLowerCase();

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  const handleBack = () => router.back();

  // ── Render item ────────────────────────────────────────────────
  const renderOrderItem = (item: OrderItem) => (
    <View key={item.id} style={styles.itemCard}>
      <Image
        source={{ uri: item.product_image || 'https://via.placeholder.com/80x80' }}
        style={styles.itemImage}
        defaultSource={{ uri: 'https://via.placeholder.com/80x80' }}
      />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={2}>{item.product_name}</Text>
        <Text style={styles.itemMeta}>KSh {Number(item.product_price).toLocaleString(undefined, { minimumFractionDigits: 0 })}</Text>
        <Text style={styles.itemMeta}>Qty: {item.quantity}</Text>
      </View>
      <View style={styles.itemSubtotal}>
        <Text style={styles.subtotalText}>
          KSh {Number(item.subtotal).toLocaleString(undefined, { minimumFractionDigits: 0 })}
        </Text>
      </View>
    </View>
  );

  // ── Shared header ──────────────────────────────────────────────
  const headerBlock = (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Ionicons name="arrow-back" size={20} color={colors.primary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Order Details</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
        {headerBlock}
        <FullScreenLoader message="Loading order details..." />
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
        {headerBlock}
        <View style={styles.centeredContainer}>
          <Text style={styles.emptyText}>Order not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const subtotal = order.items.reduce((sum, item) => sum + Number(item.subtotal), 0);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      {headerBlock}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Order Overview ── */}
        <View style={styles.card}>
          <View style={styles.orderHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.orderIdText}>Order #{order.id}</Text>
              <Text style={styles.orderDateText}>{formatDate(order.created_at)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
              </View>
              <Text style={styles.orderTimeText}>{formatTime(order.created_at)}</Text>
            </View>
          </View>
          <Text style={styles.sectionLabel}>Customer</Text>
          <Text style={styles.customerEmail}>{order.user_email}</Text>
        </View>

        {/* ── Items ── */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Items ({order.items.length})</Text>
          {order.items.map((item) => renderOrderItem(item))}
        </View>

        {/* ── Addresses ── */}
        <View style={styles.card}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionLabel}>Addresses</Text>
            {order.status === 'PENDING' && (
              <TouchableOpacity style={styles.editBtn} onPress={openAddressModal} testID="edit-address-button">
                <Ionicons name="pencil" size={13} color={colors.primary} />
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.addressBlock}>
            <Text style={styles.addressTitle}>Shipping</Text>
            <Text style={styles.addressText}>{order.shipping_address}</Text>
          </View>
          <View style={styles.addressBlock}>
            <Text style={styles.addressTitle}>Billing</Text>
            <Text style={styles.addressText}>{order.billing_address}</Text>
          </View>
        </View>

        {/* ── Order Summary ── */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>KSh {subtotal.toLocaleString(undefined, { minimumFractionDigits: 0 })}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Items</Text>
            <Text style={styles.summaryValue}>{order.items.length}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>KSh {Number(order.total_price).toLocaleString(undefined, { minimumFractionDigits: 0 })}</Text>
          </View>
        </View>

        {/* ── Actions ── */}
        {order.status === 'PENDING' && (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelBtn]}
              onPress={handleCancelOrder}
              disabled={cancellingOrder}
              testID="cancel-order-button"
            >
              {!cancellingOrder && <Ionicons name="close-circle" size={16} color={colors.error} />}
              <Text style={styles.cancelBtnText}>{cancellingOrder ? 'Cancelling...' : 'Cancel Order'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {order.status === 'DELIVERED' && (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.reorderBtn]}
              onPress={() => console.log('Reorder:', order.id)}
            >
              <Ionicons name="refresh" size={16} color={colors.primaryText} />
              <Text style={styles.reorderBtnText}>Reorder</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* ── Address Modal ── */}
      <Modal visible={addressModalVisible} transparent animationType="fade" onRequestClose={closeAddressModal}>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Update Order Addresses</Text>
              <Text style={styles.modalSubtitle}>Order #{order.id}</Text>

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
                <TouchableOpacity style={[styles.modalBtn, styles.modalCancelBtn]} onPress={closeAddressModal} disabled={updatingAddress}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, styles.modalSaveBtn]} onPress={updateOrderAddress} disabled={updatingAddress}>
                  <Text style={styles.modalSaveText}>{updatingAddress ? 'Updating...' : 'Update'}</Text>
                </TouchableOpacity>
              </View>

              {updatingAddress && (
                <View style={styles.modalLoadingOverlay}>
                  <LoadingSpinner message="Updating addresses..." />
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>

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

      {cancellingOrder && <LoadingSpinner message="Cancelling order..." />}
    </SafeAreaView>
  );
};

// ── Dynamic Styles ────────────────────────────────────────────
const makeStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },

    // ── Header ──────────────────────────────────────────────
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: Platform.OS === 'ios' ? 0 : 10,
      paddingBottom: 16,
      backgroundColor: colors.stickyBackground,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      width: 38, height: 38, borderRadius: 12,
      backgroundColor: colors.primaryDim,
      borderWidth: 1, borderColor: colors.primaryBorder,
      justifyContent: 'center', alignItems: 'center',
      marginRight: 14,
    },
    headerTitle: { fontSize: 17, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },

    // ── Scroll ───────────────────────────────────────────────
    scrollContainer: { padding: 16, paddingBottom: 32 },

    // ── Section card ─────────────────────────────────────────
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },

    // ── Order overview ───────────────────────────────────────
    orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
    orderIdText: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 4, letterSpacing: -0.3 },
    orderDateText: { fontSize: 13, color: colors.textSecondary },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 4 },
    statusText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: 0.8 },
    orderTimeText: { fontSize: 11, color: colors.textTertiary, textAlign: 'right' },

    // ── Section label ────────────────────────────────────────
    sectionLabel: {
      fontSize: 11, fontWeight: '700', color: colors.primary,
      letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12,
    },
    sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },

    // ── Customer ─────────────────────────────────────────────
    customerEmail: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },

    // ── Items ────────────────────────────────────────────────
    itemCard: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    itemImage: { width: 72, height: 72, borderRadius: 10, marginRight: 12, backgroundColor: colors.surface },
    itemInfo: { flex: 1, justifyContent: 'space-between' },
    itemName: { fontSize: 14, fontWeight: '600', color: colors.text, lineHeight: 20, marginBottom: 4 },
    itemMeta: { fontSize: 13, color: colors.textSecondary, marginBottom: 2 },
    itemSubtotal: { justifyContent: 'center', alignItems: 'flex-end' },
    subtotalText: { fontSize: 15, fontWeight: '700', color: colors.primary },

    // ── Address ──────────────────────────────────────────────
    addressBlock: {
      backgroundColor: colors.card,
      borderRadius: 10,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    addressTitle: { fontSize: 11, fontWeight: '700', color: colors.primary, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 },
    addressText: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
    editBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: colors.primaryDim, borderWidth: 1, borderColor: colors.primaryBorder,
      borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
    },
    editBtnText: { fontSize: 12, fontWeight: '600', color: colors.primary },

    // ── Summary ──────────────────────────────────────────────
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
    summaryLabel: { fontSize: 14, color: colors.textSecondary },
    summaryValue: { fontSize: 14, color: colors.text },
    divider: { height: 1, backgroundColor: colors.border, marginVertical: 8 },
    totalLabel: { fontSize: 17, fontWeight: '800', color: colors.text },
    totalValue: { fontSize: 17, fontWeight: '800', color: colors.primary },

    // ── Actions ──────────────────────────────────────────────
    buttonRow: { flexDirection: 'row', gap: 12, marginTop: 4, marginBottom: 24 },
    actionButton: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 8, borderRadius: 12, paddingVertical: 14,
    },
    cancelBtn: { backgroundColor: `${colors.error}1F`, borderWidth: 1, borderColor: `${colors.error}4D` },
    cancelBtnText: { fontSize: 15, fontWeight: '700', color: colors.error },
    reorderBtn: {
      backgroundColor: colors.primary,
      shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
    },
    reorderBtnText: { fontSize: 15, fontWeight: '700', color: colors.primaryText },

    // ── Loading / empty ───────────────────────────────────────
    centeredContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { fontSize: 15, color: colors.textSecondary },

    // ── Modal ────────────────────────────────────────────────
    modalOverlay: { flex: 1, backgroundColor: colors.modalOverlay, justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContainer: {
      backgroundColor: colors.background, borderRadius: 18,
      padding: 24, width: '100%',
      borderWidth: 1, borderColor: colors.border,
      maxHeight: '85%', position: 'relative',
    },
    modalTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 6, textAlign: 'center', letterSpacing: -0.3 },
    modalSubtitle: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginBottom: 20 },
    inputLabel: { fontSize: 11, fontWeight: '700', color: colors.primary, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8, marginTop: 14 },
    textInput: {
      borderWidth: 1, borderColor: colors.border, borderRadius: 12,
      padding: 14, fontSize: 14, color: colors.text,
      backgroundColor: colors.surface,
      minHeight: 80, textAlignVertical: 'top',
    },
    modalButtonRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
    modalBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
    modalCancelBtn: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    modalSaveBtn: { backgroundColor: colors.primary },
    modalCancelText: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
    modalSaveText: { fontSize: 15, fontWeight: '700', color: colors.primaryText },
    modalLoadingOverlay: {
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: colors.modalOverlay,
      justifyContent: 'center', alignItems: 'center', borderRadius: 18,
    },
  });

export default OrderDetails;
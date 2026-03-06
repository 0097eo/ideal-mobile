import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '@/context/CartContext';
import { useThemes, AppColors } from '@/hooks/themes';
import { FullScreenLoader, LoadingSpinner } from '@/components/LoadingSpinner';
import CustomAlert from '@/components/CustomAlert';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '@/constants/api';

interface CheckoutData {
  shipping_address: string;
  billing_address: string;
}

type PaymentMethod = 'stripe' | 'mpesa' | 'cod';

const Checkout: React.FC = () => {
  const { cart, loading, error, fetchCart, getCartItemCount, getCartTotal, clearCart, clearError } = useCart();
  const { colors, isDark } = useThemes();
  const router = useRouter();

  const [shippingAddress, setShippingAddress] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [mpesaPhone, setMpesaPhone] = useState('');

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
    title: '',
    message: '',
    onConfirm: () => {},
    showCancel: false,
  });

  const [errors, setErrors] = useState({ shipping_address: '', billing_address: '', mpesa_phone: '' });

  const styles = makeStyles(colors);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const showAlert = useCallback((config: typeof alertConfig) => {
    setAlertConfig(config);
    setAlertVisible(true);
  }, []);

  useEffect(() => {
    if (!loading && cart.items.length === 0) {
      showAlert({ type: 'warning', title: 'Cart Empty', message: 'Your cart is empty. Add some items before checkout.', onConfirm: () => router.back(), showCancel: false });
    }
  }, [cart.items.length, loading, router, showAlert]);

  const hideAlert = () => setAlertVisible(false);

  const validateForm = (): boolean => {
    const newErrors = { shipping_address: '', billing_address: '', mpesa_phone: '' };
    if (!shippingAddress.trim()) newErrors.shipping_address = 'Shipping address is required';
    if (!sameAsShipping && !billingAddress.trim()) newErrors.billing_address = 'Billing address is required';
    if (paymentMethod === 'mpesa') {
      if (!mpesaPhone.trim()) newErrors.mpesa_phone = 'M-Pesa phone number is required';
      else if (!/^(254|0)\d{9}$/.test(mpesaPhone.trim())) newErrors.mpesa_phone = 'Please enter a valid Kenyan phone number (e.g., 0712345678)';
    }
    setErrors(newErrors);
    return !newErrors.shipping_address && !newErrors.billing_address && !newErrors.mpesa_phone;
  };

  const createOrder = async (): Promise<any> => {
    const orderData: CheckoutData = {
      shipping_address: shippingAddress.trim(),
      billing_address: sameAsShipping ? shippingAddress.trim() : billingAddress.trim(),
    };
    const storedToken = await SecureStore.getItemAsync('access_token');
    const response = await fetch(`${API_URL}/orders/orders/create/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${storedToken}` },
      body: JSON.stringify(orderData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create order');
    }
    return await response.json();
  };

  const initiateMpesaPayment = async (orderId: number) => {
    const storedToken = await SecureStore.getItemAsync('access_token');
    const formattedPhone = mpesaPhone.startsWith('0') ? `254${mpesaPhone.substring(1)}` : mpesaPhone;
    const response = await fetch(`${API_URL}/payments/mpesa/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${storedToken}` },
      body: JSON.stringify({ order_id: orderId, phone: formattedPhone }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to initiate M-Pesa payment');
    }
    return await response.json();
  };

  const handleProceedToPayment = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const order = await createOrder();
      if (paymentMethod === 'mpesa') {
        await initiateMpesaPayment(order.id);
        showAlert({ type: 'success', title: 'Check Your Phone!', message: 'An M-Pesa STK push has been sent. Please enter your PIN to complete the payment.', onConfirm: () => { clearCart(); router.replace(`/(screens)/orderConfirmation?orderId=${order.id}`); }, showCancel: false });
      } else if (paymentMethod === 'cod') {
        showAlert({ type: 'success', title: 'Order Placed!', message: 'Your order has been placed successfully. You can pay with cash or M-Pesa upon delivery.', onConfirm: () => { clearCart(); router.replace(`/(screens)/orderConfirmation?orderId=${order.id}`); }, showCancel: false });
      } else if (paymentMethod === 'stripe') {
        showAlert({ type: 'info', title: 'Stripe Payment', message: 'Stripe payment is not yet implemented in the app.', onConfirm: () => {}, showCancel: false });
      }
    } catch (err) {
      showAlert({ type: 'error', title: 'Order Failed', message: err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.', onConfirm: () => {}, showCancel: false });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getButtonText = () => {
    switch (paymentMethod) {
      case 'mpesa':  return 'Pay with M-Pesa';
      case 'cod':    return 'Place Order';
      case 'stripe': return 'Pay with Card';
      default:       return 'Proceed to Payment';
    }
  };

  const getLoadingMessage = () => {
    switch (paymentMethod) {
      case 'mpesa': return 'Sending STK push...';
      case 'cod':   return 'Placing your order...';
      default:      return 'Processing...';
    }
  };

  if (loading && cart.items.length === 0) return <FullScreenLoader message="Loading checkout..." />;

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
        <Header onBack={() => router.back()} colors={colors} />
        <View style={styles.errorContainer}>
          <View style={styles.errorIconWrapper}>
            <Ionicons name="alert-circle-outline" size={32} color={colors.error} />
          </View>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => { clearError(); fetchCart(); }}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <Header onBack={() => router.back()} colors={colors} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>

          {/* ── Order Summary ── */}
          <View style={styles.card}>
            <SectionLabel text="Order Summary" colors={colors} />
            {cart.items.map((item) => (
              <View key={item.id} style={styles.orderItem}>
                <Image
                  source={{ uri: item.product_image || 'https://via.placeholder.com/50x50?text=No+Image' }}
                  style={styles.orderItemImage}
                  resizeMode="cover"
                />
                <View style={styles.orderItemDetails}>
                  <Text style={styles.orderItemName} numberOfLines={1}>{item.product_name}</Text>
                  <Text style={styles.orderItemMeta}>
                    KSh {Math.floor(parseFloat(item.product_price)).toLocaleString()} × {item.quantity}
                  </Text>
                </View>
                <Text style={styles.orderItemTotal}>
                  KSh {Math.floor(parseFloat(item.product_price) * item.quantity).toLocaleString()}
                </Text>
              </View>
            ))}
            <View style={styles.divider} />
            <View style={styles.summaryTotalRow}>
              <Text style={styles.summaryTotalLabel}>Total ({getCartItemCount()} items)</Text>
              <Text style={styles.summaryTotalValue}>KSh {Math.floor(getCartTotal()).toLocaleString()}</Text>
            </View>
          </View>

          {/* ── Shipping ── */}
          <View style={styles.card}>
            <SectionLabel text="Shipping Information" colors={colors} />

            <Text style={styles.inputLabel}>Shipping Address *</Text>
            <TextInput
              style={[styles.textInput, styles.multilineInput, errors.shipping_address ? styles.inputError : null]}
              value={shippingAddress}
              onChangeText={setShippingAddress}
              placeholder="Enter your complete shipping address..."
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            {errors.shipping_address ? <Text style={styles.errorText}>{errors.shipping_address}</Text> : null}

            <TouchableOpacity style={styles.checkboxRow} onPress={() => setSameAsShipping(!sameAsShipping)}>
              <View style={[styles.checkbox, sameAsShipping && styles.checkboxChecked]}>
                {sameAsShipping && <Ionicons name="checkmark" size={13} color={colors.primaryText} />}
              </View>
              <Text style={styles.checkboxLabel}>Billing address same as shipping</Text>
            </TouchableOpacity>

            {!sameAsShipping && (
              <>
                <Text style={styles.inputLabel}>Billing Address *</Text>
                <TextInput
                  style={[styles.textInput, styles.multilineInput, errors.billing_address ? styles.inputError : null]}
                  value={billingAddress}
                  onChangeText={setBillingAddress}
                  placeholder="Enter your billing address..."
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                {errors.billing_address ? <Text style={styles.errorText}>{errors.billing_address}</Text> : null}
              </>
            )}
          </View>

          {/* ── Payment Method ── */}
          <View style={styles.card}>
            <SectionLabel text="Payment Method" colors={colors} />

            <View style={styles.paymentRow}>
              <PaymentOption
                label="Pay on Delivery"
                icon={<Ionicons name="cash-outline" size={26} color={paymentMethod === 'cod' ? colors.primary : colors.textSecondary} />}
                selected={paymentMethod === 'cod'}
                onPress={() => setPaymentMethod('cod')}
                colors={colors}
              />
              <PaymentOption
                label="M-Pesa"
                icon={<Image source={require('@/assets/images/mpesa.png')} style={styles.mpesaIcon} />}
                selected={paymentMethod === 'mpesa'}
                onPress={() => setPaymentMethod('mpesa')}
                colors={colors}
              />
            </View>

            {paymentMethod === 'mpesa' && (
              <View style={{ marginTop: 18 }}>
                <Text style={styles.inputLabel}>M-Pesa Phone Number *</Text>
                <TextInput
                  style={[styles.textInput, errors.mpesa_phone ? styles.inputError : null]}
                  value={mpesaPhone}
                  onChangeText={setMpesaPhone}
                  placeholder="e.g. 0712345678"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="phone-pad"
                />
                {errors.mpesa_phone ? <Text style={styles.errorText}>{errors.mpesa_phone}</Text> : null}
              </View>
            )}
          </View>

        </ScrollView>

        {/* ── Sticky Bottom ── */}
        <View style={styles.bottomBar}>
          <View style={styles.bottomTotalRow}>
            <Text style={styles.bottomTotalLabel}>Total</Text>
            <Text style={styles.bottomTotalValue}>KSh {Math.floor(getCartTotal()).toLocaleString()}</Text>
          </View>
          <TouchableOpacity
            style={[styles.ctaButton, (isSubmitting || cart.items.length === 0) && styles.ctaDisabled]}
            onPress={handleProceedToPayment}
            disabled={isSubmitting || cart.items.length === 0}
          >
            <Text style={styles.ctaText}>{getButtonText()}</Text>
          </TouchableOpacity>
        </View>

        {isSubmitting && <LoadingSpinner message={getLoadingMessage()} />}
      </KeyboardAvoidingView>

      <CustomAlert
        visible={alertVisible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={hideAlert}
        onConfirm={() => { alertConfig.onConfirm(); hideAlert(); }}
        showCancel={alertConfig.showCancel}
        confirmText="OK"
        cancelText="Cancel"
      />
    </SafeAreaView>
  );
};

// ── Sub-components ────────────────────────────────────────────

const Header = ({ onBack, colors }: { onBack: () => void; colors: AppColors }) => {
  const styles = makeStyles(colors);
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Ionicons name="arrow-back" size={20} color={colors.primary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Checkout</Text>
      <View style={{ width: 38 }} />
    </View>
  );
};

const SectionLabel = ({ text, colors }: { text: string; colors: AppColors }) => {
  const styles = makeStyles(colors);
  return <Text style={styles.sectionLabel}>{text}</Text>;
};

const PaymentOption = ({ label, icon, selected, onPress, colors }: {
  label: string; icon: React.ReactNode; selected: boolean; onPress: () => void; colors: AppColors;
}) => {
  const styles = makeStyles(colors);
  return (
    <TouchableOpacity
      style={[styles.paymentOption, selected && styles.paymentOptionSelected]}
      onPress={onPress}
    >
      {icon}
      <Text style={[styles.paymentLabel, selected && { color: colors.primary }]}>{label}</Text>
      {selected && <View style={styles.paymentCheckDot} />}
    </TouchableOpacity>
  );
};

// ── Dynamic Styles ────────────────────────────────────────────

const makeStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },

    // ── Header ────────────────────────────────────────────────
    header: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 20, paddingVertical: 14,
      backgroundColor: colors.stickyBackground,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    backButton: {
      width: 38, height: 38, borderRadius: 12,
      backgroundColor: colors.primaryDim,
      borderWidth: 1, borderColor: colors.primaryBorder,
      justifyContent: 'center', alignItems: 'center',
    },
    headerTitle: {
      flex: 1, textAlign: 'center',
      fontSize: 17, fontWeight: '700',
      color: colors.text, letterSpacing: -0.2,
    },

    // ── Card ──────────────────────────────────────────────────
    card: {
      backgroundColor: colors.surface,
      marginHorizontal: 16, marginTop: 14,
      padding: 20, borderRadius: 16,
      borderWidth: 1, borderColor: colors.border,
    },
    sectionLabel: {
      fontSize: 11, fontWeight: '700', color: colors.primary,
      letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 16,
    },

    // ── Order items ───────────────────────────────────────────
    orderItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
    orderItemImage: { width: 52, height: 52, borderRadius: 10, backgroundColor: colors.card },
    orderItemDetails: { flex: 1, marginLeft: 12 },
    orderItemName: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 3 },
    orderItemMeta: { fontSize: 13, color: colors.textSecondary },
    orderItemTotal: { fontSize: 14, fontWeight: '700', color: colors.primary },
    divider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
    summaryTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    summaryTotalLabel: { fontSize: 14, color: colors.textSecondary },
    summaryTotalValue: { fontSize: 17, fontWeight: '800', color: colors.primary },

    // ── Inputs ────────────────────────────────────────────────
    inputLabel: {
      fontSize: 11, fontWeight: '700', color: colors.primary,
      letterSpacing: 1.5, textTransform: 'uppercase',
      marginBottom: 8, marginTop: 4,
    },
    textInput: {
      borderWidth: 1, borderColor: colors.border, borderRadius: 12,
      paddingHorizontal: 14, paddingVertical: 13,
      fontSize: 14, color: colors.text,
      backgroundColor: colors.card,
      marginBottom: 14,
    },
    multilineInput: { height: 90, textAlignVertical: 'top' },
    inputError: { borderColor: `${colors.error}40`, backgroundColor: `${colors.error}12` },
    errorText: { fontSize: 12, color: colors.error, marginTop: -10, marginBottom: 10, marginLeft: 2 },

    // ── Checkbox ──────────────────────────────────────────────
    checkboxRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, marginTop: 2 },
    checkbox: {
      width: 20, height: 20, borderRadius: 6,
      borderWidth: 1.5, borderColor: colors.border,
      justifyContent: 'center', alignItems: 'center', marginRight: 10,
    },
    checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
    checkboxLabel: { fontSize: 13, color: colors.textSecondary, flex: 1 },

    // ── Payment ───────────────────────────────────────────────
    paymentRow: { flexDirection: 'row', gap: 12 },
    paymentOption: {
      flex: 1, borderWidth: 1, borderColor: colors.border,
      borderRadius: 14, paddingVertical: 16,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: colors.card, position: 'relative',
      minHeight: 90,
    },
    paymentOptionSelected: { borderColor: colors.primaryBorder, backgroundColor: colors.primaryDim },
    paymentLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginTop: 8, textAlign: 'center' },
    paymentCheckDot: {
      position: 'absolute', top: 8, right: 8,
      width: 8, height: 8, borderRadius: 4,
      backgroundColor: colors.primary,
    },
    mpesaIcon: { width: 40, height: 24, resizeMode: 'contain' },

    // ── Bottom bar ────────────────────────────────────────────
    bottomBar: {
      backgroundColor: colors.stickyBackground,
      paddingHorizontal: 20, paddingTop: 16, paddingBottom: 28,
      borderTopWidth: 1, borderTopColor: colors.border,
    },
    bottomTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    bottomTotalLabel: { fontSize: 14, color: colors.textSecondary },
    bottomTotalValue: { fontSize: 22, fontWeight: '800', color: colors.primary },
    ctaButton: {
      backgroundColor: colors.primary, borderRadius: 13,
      paddingVertical: 16, alignItems: 'center',
      shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
    },
    ctaDisabled: { opacity: 0.4, shadowOpacity: 0 },
    ctaText: { color: colors.primaryText, fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },

    // ── Error state ───────────────────────────────────────────
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
    errorIconWrapper: {
      width: 68, height: 68, borderRadius: 18,
      backgroundColor: `${colors.error}12`,
      borderWidth: 1, borderColor: `${colors.error}40`,
      justifyContent: 'center', alignItems: 'center', marginBottom: 16,
    },
    errorTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 8, letterSpacing: -0.2 },
    errorMessage: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
    retryButton: {
      backgroundColor: colors.primary, paddingHorizontal: 28,
      paddingVertical: 13, borderRadius: 10,
    },
    retryButtonText: { color: colors.primaryText, fontSize: 15, fontWeight: '700' },
  });

export default Checkout;
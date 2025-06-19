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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '@/context/CartContext';
import { useThemes } from '@/hooks/themes';
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
  const {
    cart,
    loading,
    error,
    fetchCart,
    getCartItemCount,
    getCartTotal,
    clearCart,
    clearError,
  } = useCart();

  const { colors } = useThemes();
  const router = useRouter();

  // Form states
  const [shippingAddress, setShippingAddress] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [mpesaPhone, setMpesaPhone] = useState('');

  // Alert states
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
    title: '',
    message: '',
    onConfirm: () => {},
    showCancel: false,
  });

  // Form validation states
  const [errors, setErrors] = useState({
    shipping_address: '',
    billing_address: '',
    mpesa_phone: '',
  });

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const showAlert = useCallback((config: typeof alertConfig) => {
    setAlertConfig(config);
    setAlertVisible(true);
  }, []);

  useEffect(() => {
    if (!loading && cart.items.length === 0) {
      showAlert({
        type: 'warning',
        title: 'Cart Empty',
        message: 'Your cart is empty. Add some items before checkout.',
        onConfirm: () => router.back(),
        showCancel: false,
      });
    }
  }, [cart.items.length, loading, router, showAlert]);


  const hideAlert = () => {
    setAlertVisible(false);
  };

  const validateForm = (): boolean => {
    const newErrors = {
      shipping_address: '',
      billing_address: '',
      mpesa_phone: '',
    };

    if (!shippingAddress.trim()) {
      newErrors.shipping_address = 'Shipping address is required';
    }

    if (!sameAsShipping && !billingAddress.trim()) {
      newErrors.billing_address = 'Billing address is required';
    }

    // Validate M-Pesa phone number only if that method is selected
    if (paymentMethod === 'mpesa') {
        if (!mpesaPhone.trim()) {
            newErrors.mpesa_phone = 'M-Pesa phone number is required';
        } else if (!/^(254|0)\d{9}$/.test(mpesaPhone.trim())) {
            newErrors.mpesa_phone = 'Please enter a valid Kenyan phone number (e.g., 0712345678)';
        }
    }

    setErrors(newErrors);
    return !newErrors.shipping_address && !newErrors.billing_address && !newErrors.mpesa_phone;
  };

  const createOrder = async (): Promise<any> => {
    try {
      const orderData: CheckoutData = {
        shipping_address: shippingAddress.trim(),
        billing_address: sameAsShipping ? shippingAddress.trim() : billingAddress.trim(),
      };

      const storedToken = await SecureStore.getItemAsync('access_token');

      const response = await fetch(`${API_URL}/orders/orders/create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storedToken}`,
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create order');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  };
  
  const initiateMpesaPayment = async (orderId: number) => {
    const storedToken = await SecureStore.getItemAsync('access_token');
    
    // Normalize phone number to 254 format
    const formattedPhone = mpesaPhone.startsWith('0') ? `254${mpesaPhone.substring(1)}` : mpesaPhone;

    const response = await fetch(`${API_URL}/payments/mpesa/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${storedToken}`,
        },
        body: JSON.stringify({
            order_id: orderId,
            phone: formattedPhone,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to initiate M-Pesa payment');
    }

    return await response.json();
  };

  const handleProceedToPayment = async () => {
    if (!validateForm()) {
        return;
    }

    setIsSubmitting(true);

    try {
        const order = await createOrder();

        if (paymentMethod === 'mpesa') {
            await initiateMpesaPayment(order.id);
            
            showAlert({
                type: 'success',
                title: 'Check Your Phone!',
                message: 'An M-Pesa STK push has been sent. Please enter your PIN to complete the payment.',
                onConfirm: () => {
                    clearCart();
                    router.replace(`/(screens)/orderConfirmation?orderId=${order.id}`);
                },
                showCancel: false,
            });
        } else if (paymentMethod === 'cod') {
            showAlert({
                type: 'success',
                title: 'Order Placed!',
                message: 'Your order has been placed successfully. You can pay with cash or M-Pesa upon delivery.',
                onConfirm: () => {
                    clearCart();
                    router.replace(`/(screens)/orderConfirmation?orderId=${order.id}`);
                },
                showCancel: false,
            });
        } else if (paymentMethod === 'stripe') {
            // Placeholder for Stripe
            showAlert({
                type: 'info',
                title: 'Stripe Payment',
                message: 'Stripe payment is not yet implemented in the app.',
                onConfirm: () => {},
                showCancel: false,
            });
        }
    } catch (error) {
        showAlert({
            type: 'error',
            title: 'Order Failed',
            message: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.',
            onConfirm: () => {},
            showCancel: false,
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  const renderOrderSummary = () => {
    const styles = createStyles(colors);
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        {cart.items.map((item) => (
          <View key={item.id} style={styles.orderItem}>
            <Image source={{ uri: item.product_image || 'https://via.placeholder.com/50x50?text=No+Image' }} style={styles.orderItemImage} resizeMode="cover" />
            <View style={styles.orderItemDetails}>
              <Text style={styles.orderItemName} numberOfLines={1}>{item.product_name}</Text>
              <Text style={styles.orderItemPrice}>KSh {Math.floor(parseFloat(item.product_price)).toLocaleString()} × {item.quantity}</Text>
            </View>
            <Text style={styles.orderItemTotal}>KSh {Math.floor(parseFloat(item.product_price) * item.quantity).toLocaleString()}</Text>
          </View>
        ))}
        <View style={styles.divider} />
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total ({getCartItemCount()} items)</Text>
          <Text style={styles.totalValue}>KSh {Math.floor(getCartTotal()).toLocaleString()}</Text>
        </View>
      </View>
    );
  };
  const renderAddressForm = () => {
    const styles = createStyles(colors);
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Shipping Information</Text>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Shipping Address *</Text>
          <TextInput style={[styles.textInput, styles.multilineInput, errors.shipping_address ? styles.inputError : null]} value={shippingAddress} onChangeText={setShippingAddress} placeholder="Enter your complete shipping address..." placeholderTextColor={colors.textTertiary} multiline numberOfLines={4} textAlignVertical="top" />
          {errors.shipping_address ? <Text style={styles.errorText}>{errors.shipping_address}</Text> : null}
        </View>
        <TouchableOpacity style={styles.checkboxContainer} onPress={() => setSameAsShipping(!sameAsShipping)}>
          <View style={[styles.checkbox, sameAsShipping && styles.checkboxChecked]}>
            {sameAsShipping && <Ionicons name="checkmark" size={16} color="#fff" />}
          </View>
          <Text style={styles.checkboxLabel}>Billing address same as shipping address</Text>
        </TouchableOpacity>
        {!sameAsShipping && (
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Billing Address *</Text>
            <TextInput style={[styles.textInput, styles.multilineInput, errors.billing_address ? styles.inputError : null]} value={billingAddress} onChangeText={setBillingAddress} placeholder="Enter your billing address..." placeholderTextColor={colors.textTertiary} multiline numberOfLines={4} textAlignVertical="top" />
            {errors.billing_address ? <Text style={styles.errorText}>{errors.billing_address}</Text> : null}
          </View>
        )}
      </View>
    );
  };
  
  const renderPaymentMethod = () => {
    const styles = createStyles(colors);
    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            
            <View style={styles.paymentOptionsContainer}>
                {/* Pay on Delivery Option */}
                <TouchableOpacity 
                    style={[styles.paymentOption, paymentMethod === 'cod' && styles.paymentOptionSelected]}
                    onPress={() => setPaymentMethod('cod')}
                >
                    <Ionicons name="cash-outline" size={30} color={paymentMethod === 'cod' ? colors.primary : colors.textSecondary} />
                    <Text style={styles.paymentLabel}>Pay on Delivery</Text>
                </TouchableOpacity>

                {/* M-Pesa Option */}
                <TouchableOpacity 
                    style={[styles.paymentOption, paymentMethod === 'mpesa' && styles.paymentOptionSelected]}
                    onPress={() => setPaymentMethod('mpesa')}
                >
                    <Image source={require('@/assets/images/mpesa.png')} style={styles.paymentIcon} />
                    <Text style={styles.paymentLabel}>M-Pesa</Text>
                </TouchableOpacity>

            </View>

            {paymentMethod === 'mpesa' && (
                <View style={[styles.inputContainer, { marginTop: 20 }]}>
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
    );
  };

  const renderError = () => {
    const styles = createStyles(colors);
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => { clearError(); fetchCart(); }}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const getButtonText = () => {
    switch(paymentMethod) {
        case 'mpesa': return 'Pay with M-Pesa';
        case 'cod': return 'Place Order';
        case 'stripe': return 'Pay with Card';
        default: return 'Proceed to Payment';
    }
  };

  const getLoadingMessage = () => {
    switch(paymentMethod) {
        case 'mpesa': return 'Sending STK push...';
        case 'cod': return 'Placing your order...';
        case 'stripe': return 'Processing...';
        default: return 'Processing...';
    }
  }

  const styles = createStyles(colors);

  if (loading && cart.items.length === 0) {
    return <FullScreenLoader message="Loading checkout..." />;
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.text} /></TouchableOpacity>
            <Text style={styles.headerTitle}>Checkout</Text>
            <View style={{ width: 40 }} />
        </View>
        {renderError()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.text} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView style={styles.keyboardAvoid} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {renderOrderSummary()}
          {renderAddressForm()}
          {renderPaymentMethod()}
          
          <View style={styles.bottomSpacing} />
        </ScrollView>

        <View style={styles.bottomContainer}>
          <View style={styles.totalSummary}>
            <Text style={styles.finalTotalLabel}>Total</Text>
            <Text style={styles.finalTotalValue}>KSh {Math.floor(getCartTotal()).toLocaleString()}</Text>
          </View>

          <TouchableOpacity
            style={[styles.placeOrderButton, (isSubmitting || cart.items.length === 0) && styles.disabledButton]}
            onPress={handleProceedToPayment}
            disabled={isSubmitting || cart.items.length === 0}
          >
            <Text style={styles.placeOrderButtonText}>{getButtonText()}</Text>
          </TouchableOpacity>
        </View>
        {isSubmitting && <LoadingSpinner message={getLoadingMessage()} />}
      </KeyboardAvoidingView>

      <CustomAlert
        visible={alertVisible} type={alertConfig.type} title={alertConfig.title}
        message={alertConfig.message} onClose={hideAlert}
        onConfirm={() => { alertConfig.onConfirm(); hideAlert(); }}
        showCancel={alertConfig.showCancel} confirmText="OK" cancelText="Cancel"
      />
    </SafeAreaView>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: colors.background 
  },
  header: { 
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border 
  },
  backButton: {
    padding: 8,
    marginRight: 16
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
    textAlign: 'center'
  },
  headerSpacer: {
    width: 40,
  },
  keyboardAvoid: {
    flex: 1,
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
    shadowOpacity: 0.1, shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  orderItemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: colors.border,
  },
  orderItemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  orderItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  orderItemPrice: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  orderItemTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxLabel: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
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
  },
  totalSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  finalTotalLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  finalTotalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  placeOrderButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  disabledButton: {
    opacity: 0.6,
  },
  placeOrderButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
    fontWeight: '600' 
  },
  paymentOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  paymentOption: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minHeight: 90,
  },
  paymentOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  paymentIcon: {
    width: 40,
    height: 24,
    resizeMode: 'contain',
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginTop: 8,
    textAlign: 'center'
  },
});

export default Checkout;
import React, { useState, useEffect, useCallback} from 'react';
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
    };

    if (!shippingAddress.trim()) {
      newErrors.shipping_address = 'Shipping address is required';
    }

    if (!sameAsShipping && !billingAddress.trim()) {
      newErrors.billing_address = 'Billing address is required';
    }

    setErrors(newErrors);
    return !newErrors.shipping_address && !newErrors.billing_address;
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

    const order = await response.json();
    return order;
  } catch (error) {
    throw error;
  }
};

  const handlePlaceOrder = async () => {
  if (!validateForm()) {
    return;
  }

  setIsSubmitting(true);

  try {
    const order = await createOrder();
    
    showAlert({
      type: 'success',
      title: 'Order Placed!',
      message: 'Your order has been placed successfully. You will receive a confirmation email shortly.',
      onConfirm: () => {
        clearCart();
        router.replace(`/(screens)/orderConfirmation?orderId=${order.id}`);
      },
      showCancel: false,
    });
  } catch (error) {
    showAlert({
      type: 'error',
      title: 'Order Failed',
      message: error instanceof Error ? error.message : 'Failed to place order. Please try again.',
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
            <Image
              source={{
                uri: item.product_image || 'https://via.placeholder.com/50x50?text=No+Image'
              }}
              style={styles.orderItemImage}
              resizeMode="cover"
            />
            
            <View style={styles.orderItemDetails}>
              <Text style={styles.orderItemName} numberOfLines={1}>
                {item.product_name}
              </Text>
              <Text style={styles.orderItemPrice}>
                KSh {Math.floor(parseFloat(item.product_price)).toLocaleString()} × {item.quantity}
              </Text>
            </View>
            
            <Text style={styles.orderItemTotal}>
              KSh {Math.floor(parseFloat(item.product_price) * item.quantity).toLocaleString()}
            </Text>
          </View>
        ))}
        
        <View style={styles.divider} />
        
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>
            Total ({getCartItemCount()} items)
          </Text>
          <Text style={styles.totalValue}>
            KSh {Math.floor(getCartTotal()).toLocaleString()}
          </Text>
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
          <TextInput
            style={[
              styles.textInput,
              styles.multilineInput,
              errors.shipping_address ? styles.inputError : null,
            ]}
            value={shippingAddress}
            onChangeText={setShippingAddress}
            placeholder="Enter your complete shipping address..."
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          {errors.shipping_address ? (
            <Text style={styles.errorText}>{errors.shipping_address}</Text>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setSameAsShipping(!sameAsShipping)}
        >
          <View style={[styles.checkbox, sameAsShipping && styles.checkboxChecked]}>
            {sameAsShipping && (
              <Ionicons name="checkmark" size={16} color="#fff" />
            )}
          </View>
          <Text style={styles.checkboxLabel}>
            Billing address same as shipping address
          </Text>
        </TouchableOpacity>

        {!sameAsShipping && (
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Billing Address *</Text>
            <TextInput
              style={[
                styles.textInput,
                styles.multilineInput,
                errors.billing_address ? styles.inputError : null,
              ]}
              value={billingAddress}
              onChangeText={setBillingAddress}
              placeholder="Enter your billing address..."
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            {errors.billing_address ? (
              <Text style={styles.errorText}>{errors.billing_address}</Text>
            ) : null}
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
        <TouchableOpacity style={styles.retryButton} onPress={() => {
          clearError();
          fetchCart();
        }}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const styles = createStyles(colors);

  if (loading && cart.items.length === 0) {
    return <FullScreenLoader message="Loading checkout..." />;
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.leftGroup}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Checkout</Text>
          </View>
        </View>

        {renderError()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {renderOrderSummary()}
          {renderAddressForm()}
          
          {/* Bottom spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* Place Order Button */}
        <View style={styles.bottomContainer}>
          <View style={styles.totalSummary}>
            <Text style={styles.finalTotalLabel}>Total</Text>
            <Text style={styles.finalTotalValue}>
              KSh {Math.floor(getCartTotal()).toLocaleString()}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.placeOrderButton,
              (isSubmitting || cart.items.length === 0) && styles.disabledButton
            ]}
            onPress={handlePlaceOrder}
            disabled={isSubmitting || cart.items.length === 0}
          >
            <Text style={styles.placeOrderButtonText}>Place Order</Text>
          </TouchableOpacity>
        </View>
        {isSubmitting && <LoadingSpinner message="Creating Order..." />}
      </KeyboardAvoidingView>

      {/* Custom Alert */}
      <CustomAlert
        visible={alertVisible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={hideAlert}
        onConfirm={() => {
          alertConfig.onConfirm();
          hideAlert();
        }}
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
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
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    fontWeight: '600',
  },
});

export default Checkout;
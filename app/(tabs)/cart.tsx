import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '@/context/CartContext';
import { CartItem } from '@/types/cart';
import { useThemes } from '@/hooks/themes';
import { LoadingSpinner, FullScreenLoader } from '@/components/LoadingSpinner';
import CustomAlert from '@/components/CustomAlert';
import { useRouter } from 'expo-router';


const Cart: React.FC = () => {
  const {
    cart,
    loading,
    error,
    fetchCart,
    updateCartItem,
    removeCartItem,
    clearCart,
    clearError,
    getCartItemCount,
    getCartTotal,
  } = useCart();

  const { colors } = useThemes();
  const [refreshing, setRefreshing] = useState(false);
  const [updatingItems, setUpdatingItems] = useState<Set<number>>(new Set());
  const router = useRouter();
  
  // Alert states
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
    title: '',
    message: '',
    onConfirm: () => {},
    showCancel: false,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCart();
    setRefreshing(false);
  };

  const showAlert = (config: typeof alertConfig) => {
    setAlertConfig(config);
    setAlertVisible(true);
  };

  const hideAlert = () => {
    setAlertVisible(false);
  };

  const handleQuantityUpdate = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 0) return;

    setUpdatingItems(prev => new Set(prev).add(itemId));
    
    try {
      if (newQuantity === 0) {
        await removeCartItem(itemId);
      } else {
        await updateCartItem(itemId, newQuantity);
      }
    } catch (error) {
      // Error is handled by context
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const handleRemoveItem = (item: CartItem) => {
    showAlert({
      type: 'warning',
      title: 'Remove Item',
      message: `Remove ${item.product_name} from cart?`,
      onConfirm: () => handleQuantityUpdate(item.id, 0),
      showCancel: true,
    });
  };

  const handleClearCart = () => {
    showAlert({
      type: 'warning',
      title: 'Clear Cart',
      message: 'Are you sure you want to remove all items from your cart?',
      onConfirm: async () => {
        clearCart();
      },
      showCancel: true,
    });
  };

  const renderCartItem = (item: CartItem) => {
  const isUpdating = updatingItems.has(item.id);
  const styles = createStyles(colors);
       
  return (
    <View key={item.id} style={styles.cartItem}>
      <View style={styles.itemHeader}>
        <Image
          source={{
            uri: item.product_image || 'https://via.placeholder.com/80x80?text=No+Image'
          }}
          style={styles.productImage}
          resizeMode="cover"
        />
        
        <View style={styles.itemDetails}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.product_name}
          </Text>
          <Text style={styles.productPrice}>
            KES {Math.floor(parseFloat(item.product_price)).toLocaleString()}
          </Text>
          <Text style={styles.quantityText}>
            Quantity: {item.quantity}
          </Text>
          <Text style={styles.subtotal}>
            Subtotal: KES {Math.floor(parseFloat(item.product_price) * item.quantity).toLocaleString()}
          </Text>
        </View>
      </View>

      <View style={styles.itemActions}>
        <View style={styles.quantityControls}>
          <TouchableOpacity
            style={[styles.quantityButton, isUpdating && styles.disabledButton]}
            onPress={() => handleQuantityUpdate(item.id, item.quantity - 1)}
            disabled={isUpdating}
          >
            <Ionicons name="remove" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
                   
          <View style={styles.quantityDisplay}>
            {isUpdating ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={styles.quantityText}>{item.quantity}</Text>
            )}
          </View>
                   
          <TouchableOpacity
            style={[styles.quantityButton, isUpdating && styles.disabledButton]}
            onPress={() => handleQuantityUpdate(item.id, item.quantity + 1)}
            disabled={isUpdating}
          >
            <Ionicons name="add" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveItem(item)}
          disabled={isUpdating}
        >
          <Ionicons name="trash-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

  const renderEmptyCart = () => {
    const styles = createStyles(colors);
    return (
      <View style={styles.emptyCart}>
        <Ionicons name="bag-outline" size={80} color={colors.textTertiary} />
        <Text style={styles.emptyCartTitle}>Your cart is empty</Text>
        <Text style={styles.emptyCartSubtitle}>
          Add some items to get started
        </Text>
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                  <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cart</Text>
        {cart.items.length > 0 && (
          <TouchableOpacity onPress={handleClearCart} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {error ? (
        renderError()
      ) : loading && cart.items.length === 0 ? (
        <FullScreenLoader message="Loading cart..." />
      ) : cart.items.length === 0 ? (
        renderEmptyCart()
      ) : (
        <>
          <ScrollView
            style={styles.cartList}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
          >
            {cart.items.map(renderCartItem)}
          </ScrollView>

          {/* Cart Summary */}
          <View style={styles.cartSummary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Items ({getCartItemCount()})
              </Text>
              <Text style={styles.summaryValue}>
                KES {Math.floor(getCartTotal()).toLocaleString()}
              </Text>
            </View>
            
            <TouchableOpacity style={styles.checkoutButton}>
              <Text style={styles.checkoutButtonText} onPress={() => router.push('/checkout')}>
                Proceed to Checkout
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Loading Overlay */}
      {loading && cart.items.length > 0 && (
        <LoadingSpinner message="Updating cart..." />
      )}

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
    color: colors.text,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearButtonText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: '600',
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
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: colors.background,
  },
  emptyCartTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 24,
    marginBottom: 8,
  },
  emptyCartSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  cartList: {
    flex: 1,
    backgroundColor: colors.background,
  },
  cartItem: {
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 16,
    borderRadius: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: colors.border,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
    marginBottom: 4,
  },
  subtotal: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  disabledButton: {
    opacity: 0.5,
  },
  quantityDisplay: {
    minWidth: 40,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  removeButton: {
    padding: 8,
  },
  cartSummary: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  checkoutButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default Cart;
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
import { useThemes, AppColors } from '@/hooks/themes';
import { LoadingSpinner, FullScreenLoader } from '@/components/LoadingSpinner';
import CustomAlert from '@/components/CustomAlert';
import { useRouter } from 'expo-router';

// ─── Component ────────────────────────────────────────────────────────────────
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
  const styles = makeStyles(colors);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingItems, setUpdatingItems] = useState<Set<number>>(new Set());
  const router = useRouter();

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
    title: '',
    message: '',
    onConfirm: () => {},
    showCancel: false,
    confirmText: 'OK',
    cancelText: 'Cancel',
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCart();
    setRefreshing(false);
  };

  const showAlert = (config: Partial<typeof alertConfig>) => {
    setAlertConfig(prev => ({ ...prev, ...config }));
    setAlertVisible(true);
  };

  const hideAlert = () => setAlertVisible(false);

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
      // Error handled by context
      
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
      onConfirm: async () => { await clearCart(); },
      showCancel: true,
    });
  };

  // ── Cart Item ──────────────────────────────────────────────────────────────
  const renderCartItem = (item: CartItem) => {
    const isUpdating = updatingItems.has(item.id);
    return (
      <View key={item.id} style={styles.cartItem}>
        <View style={styles.cardAccentLine} />
        <View style={styles.itemHeader}>
          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: item.product_image || 'https://via.placeholder.com/80x80?text=No+Image' }}
              style={styles.productImage}
              resizeMode="cover"
            />
          </View>
          <View style={styles.itemDetails}>
            <Text style={styles.productName} numberOfLines={2}>{item.product_name}</Text>
            <Text style={styles.productPrice}>KSh {Math.floor(parseFloat(item.product_price)).toLocaleString()}</Text>
            <Text style={styles.quantityText}>Quantity: {item.quantity}</Text>
            <Text style={styles.subtotal}>Subtotal: KSh {Math.floor(parseFloat(item.product_price) * item.quantity).toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.itemFooter}>
          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={[styles.quantityButton, isUpdating && styles.disabledButton]}
              onPress={() => handleQuantityUpdate(item.id, item.quantity - 1)}
              disabled={isUpdating}
            >
              <Ionicons name="remove" size={18} color={colors.primary} />
            </TouchableOpacity>

            <View style={styles.quantityDisplay}>
              {isUpdating ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={styles.quantityCount}>{item.quantity}</Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.quantityButton, isUpdating && styles.disabledButton]}
              onPress={() => handleQuantityUpdate(item.id, item.quantity + 1)}
              disabled={isUpdating}
            >
              <Ionicons name="add" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveItem(item)}
            disabled={isUpdating}
            accessibilityLabel={`Remove ${item.product_name}`}
          >
            <Ionicons name="trash-outline" size={17} color={colors.error} />
            <Text style={styles.removeButtonText}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ── Empty state ────────────────────────────────────────────────────────────
  const renderEmptyCart = () => (
    <View style={styles.emptyCart}>
      <View style={styles.emptyIconRing}>
        <View style={styles.emptyIconInner}>
          <Ionicons name="cart-outline" size={34} color={colors.primary} />
        </View>
      </View>
      <Text style={styles.emptyEyebrow}>Your Cart</Text>
      <Text style={styles.emptyCartTitle}>Your cart is empty</Text>
      <Text style={styles.emptyCartSubtitle}>Add some items to get started</Text>
    </View>
  );

  // ── Error state ────────────────────────────────────────────────────────────
  const renderError = () => (
    <View style={styles.errorContainer}>
      <View style={styles.errorIconRing}>
        <Ionicons name="alert-circle-outline" size={36} color={colors.error} />
      </View>
      <Text style={styles.errorEyebrow}>Connection Error</Text>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorMessage}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={() => { clearError(); fetchCart(); }}>
        <Ionicons name="reload-outline" size={16} color={colors.primaryText} />
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} testID="back-button">
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerEyebrow}>IDEAL FURNITURE</Text>
          <Text style={styles.headerTitle}>Cart</Text>
        </View>

        {cart.items.length > 0 ? (
          <TouchableOpacity onPress={handleClearCart} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      {/* ── Content ── */}
      {error ? (
        renderError()
      ) : loading && cart.items.length === 0 ? (
        <FullScreenLoader message="Loading cart..." />
      ) : cart.items.length === 0 ? (
        renderEmptyCart()
      ) : (
        <>
          <View style={styles.listHeader}>
            <View style={styles.listEyebrowRow}>
              <Ionicons name="cube-outline" size={13} color={colors.primary} />
              <Text style={styles.listEyebrow}>Your Items</Text>
            </View>
            <Text style={styles.listCount}>{getCartItemCount()} item{getCartItemCount() !== 1 ? 's' : ''}</Text>
          </View>

          <ScrollView
            style={styles.cartList}
            showsVerticalScrollIndicator={false}
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
            <View style={styles.listBottomSpacing} />
          </ScrollView>

          {/* ── Cart summary ── */}
          <View style={styles.cartSummary}>
            <View style={styles.summarySeparator} />
            <View style={styles.summaryRow}>
              <View>
                <Text style={styles.summaryEyebrow}>Order Total</Text>
                <Text style={styles.summaryLabel}>Items ({getCartItemCount()})</Text>
              </View>
              <Text style={styles.summaryValue}>
                KSh {Math.floor(getCartTotal()).toLocaleString()}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={() => router.push('/(screens)/checkout')}
            >
              <Ionicons name="card-outline" size={18} color={colors.primaryText} />
              <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.primaryText} />
            </TouchableOpacity>
          </View>
        </>
      )}

      {loading && cart.items.length > 0 && (
        <LoadingSpinner message="Updating cart..." />
      )}

      <CustomAlert
        visible={alertVisible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={hideAlert}
        onConfirm={() => { alertConfig.onConfirm(); hideAlert(); }}
        showCancel={alertConfig.showCancel}
        confirmText={alertConfig.confirmText}
        cancelText={alertConfig.cancelText}
      />
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const makeStyles = (colors: AppColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    borderBottomColor: `${colors.primary}38`,
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
    zIndex: 1,
  },
  headerCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
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
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: `${colors.error}40`,
    borderRadius: 8,
    backgroundColor: `${colors.error}12`,
    zIndex: 1,
  },
  clearButtonText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  headerSpacer: { width: 40 },

  // ── List eyebrow ──────────────────────────────────────────────────────────
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 8,
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
    letterSpacing: 0.3,
  },

  // ── Cart list ─────────────────────────────────────────────────────────────
  cartList: { flex: 1 },
  listBottomSpacing: { height: 16 },

  // ── Cart item card ────────────────────────────────────────────────────────
  cartItem: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginBottom: 12,
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
  cardAccentLine: {
    height: 2,
    backgroundColor: colors.primary,
    opacity: 0.55,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 12,
  },
  imageWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  productImage: {
    width: 82,
    height: 82,
    backgroundColor: colors.card,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 14,
    gap: 4,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 21,
    letterSpacing: 0.1,
  },
  productPrice: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  quantityText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  subtotal: {
    fontSize: 13,
    color: colors.textSecondary,
  },

  // ── Item footer ───────────────────────────────────────────────────────────
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quantityButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.primaryDim,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: { opacity: 0.4 },
  quantityDisplay: {
    minWidth: 40,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
  },
  quantityCount: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${colors.error}40`,
    backgroundColor: `${colors.error}12`,
  },
  removeButtonText: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '600',
  },

  // ── Cart summary ──────────────────────────────────────────────────────────
  cartSummary: {
    backgroundColor: colors.stickyBackground,
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  summarySeparator: {
    height: 1,
    backgroundColor: colors.primary,
    opacity: 0.25,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryEyebrow: {
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.textTertiary,
    fontWeight: '600',
    marginBottom: 3,
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 12,
    elevation: 8,
  },
  checkoutButtonText: {
    color: colors.primaryText,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // ── Empty state ───────────────────────────────────────────────────────────
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  emptyCartTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  emptyCartSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  // ── Error state ───────────────────────────────────────────────────────────
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  errorIconRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.error}12`,
    borderWidth: 1,
    borderColor: `${colors.error}40`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  errorEyebrow: {
    fontSize: 11,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: colors.error,
    fontWeight: '600',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  errorMessage: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 12,
    marginTop: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 6,
  },
  retryButtonText: {
    color: colors.primaryText,
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.4,
  },
});

export default Cart;
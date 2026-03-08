import {
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import CustomAlert from '@/components/CustomAlert';
import { FullScreenLoader, LoadingSpinner } from '@/components/LoadingSpinner';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useThemes, AppColors } from '@/hooks/themes';
import { Product } from '@/types/product';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';

const { width: screenWidth } = Dimensions.get('window');
const ITEM_WIDTH = (screenWidth - 52) / 2;

// ─── Interfaces ───────────────────────────────────────────────────────────────
interface WishlistItemProps {
  product: Product;
  onRemove: (productId: number) => void;
  onAddToCart: (product: Product) => void;
  colors: AppColors;
  isItemInCart: boolean;
}

// ─── WishlistItem ─────────────────────────────────────────────────────────────
const WishlistItem: React.FC<WishlistItemProps> = ({
  product, onRemove, onAddToCart, colors, isItemInCart,
}) => {
  const styles = makeStyles(colors);
  const [imageError, setImageError] = useState(false);

  const isOutOfStock = product.stock === 0;
  const isDisabled   = isOutOfStock || isItemInCart;

  const getButtonText = () => {
    if (isOutOfStock) return 'Out of Stock';
    if (isItemInCart) return 'In Cart';
    return 'Add to Cart';
  };

  const getButtonIcon = (): keyof typeof Ionicons.glyphMap =>
    isItemInCart ? 'checkmark-circle-outline' : 'cart-outline';

  const buttonBg = isOutOfStock
    ? colors.card
    : isItemInCart
    ? `${colors.success}14`
    : colors.primary;

  const buttonBorder = isOutOfStock
    ? colors.border
    : isItemInCart
    ? `${colors.success}47`
    : 'transparent';

  const buttonTextColor = isOutOfStock
    ? colors.textTertiary
    : isItemInCart
    ? colors.success
    : colors.primaryText;

  return (
    <View style={styles.itemContainer}>
      <View style={styles.cardAccentLine} />

      <View style={styles.imageContainer}>
        {imageError ? (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={36} color={colors.textTertiary} />
          </View>
        ) : (
          <Image
            source={{ uri: product.image || product.additional_images?.split(',')[0] }}
            style={styles.productImage}
            onError={() => setImageError(true)}
            resizeMode="cover"
          />
        )}

        <TouchableOpacity style={styles.removeButton} onPress={() => onRemove(product.id)} activeOpacity={0.8}>
          <Text style={styles.heartEmoji}>❤️</Text>
        </TouchableOpacity>

        {isOutOfStock && <View style={styles.outOfStockOverlay} />}
      </View>

      <View style={styles.productInfo}>
        <Text style={styles.productCategory} numberOfLines={1}>
          {(product.category_name || 'Uncategorized').toUpperCase()}
        </Text>

        <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>

        <Text style={styles.currentPrice}>
          Ksh {Math.floor(parseFloat(product.price)).toLocaleString()}
        </Text>

        <View style={styles.stockContainer}>
          <View style={[styles.stockDot, { backgroundColor: product.stock > 0 ? colors.success : colors.error }]} />
          <Text style={[styles.stockText, { color: product.stock > 0 ? colors.success : colors.error }]}>
            {product.stock > 0 ? `${product.stock} in stock` : 'Unavailable'}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.addToCartButton,
            {
              backgroundColor: buttonBg,
              borderColor: buttonBorder,
              borderWidth: isItemInCart || isOutOfStock ? 1 : 0,
              opacity: isOutOfStock ? 0.55 : 1,
              shadowColor: isItemInCart || isOutOfStock ? 'transparent' : colors.primary,
            },
          ]}
          onPress={() => onAddToCart(product)}
          disabled={isDisabled}
          activeOpacity={0.8}
        >
          <Ionicons name={getButtonIcon()} size={14} color={buttonTextColor} />
          <Text style={[styles.addToCartText, { color: buttonTextColor }]}>{getButtonText()}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Wishlist ─────────────────────────────────────────────────────────────────
const Wishlist: React.FC = () => {
  const { colors } = useThemes();
  const styles = makeStyles(colors);
  const { wishlistProducts, loading, error, removeFromWishlist, refreshWishlist, clearError } = useWishlist();
  const { addToCart, loading: cartLoading, isItemInCart } = useCart();

  const [refreshing, setRefreshing]     = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig]   = useState({
    type: 'success' as 'success' | 'error' | 'warning' | 'info',
    title: '', message: '',
  });

  const showAlert = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    setAlertConfig({ type, title, message });
    setAlertVisible(true);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshWishlist();
      clearError();
    } catch (err) {
      showAlert('error', 'Refresh Failed', 'Failed to refresh wishlist. Please try again.');
      throw err;
    } finally {
      setRefreshing(false);
    }
  }, [refreshWishlist, clearError]);

  const handleRemoveFromWishlist = async (productId: number) => {
    const product = wishlistProducts.find(p => p.id === productId);
    const productName = product?.name || 'this item';
    try {
      const success = await removeFromWishlist(productId);
      if (success) {
        showAlert('success', 'Removed from Wishlist', `${productName} has been removed from your wishlist.`);
      } else {
        showAlert('error', 'Failed to Remove', `Could not remove ${productName}. Please try again.`);
      }
    } catch (err) {
      showAlert('error', 'Error', 'An unexpected error occurred. Please try again.');
      throw err;
    }
  };

  const handleAddToCart = async (product: Product) => {
    if (product.stock === 0) {
      showAlert('warning', 'Out of Stock', 'This item is currently out of stock and cannot be added to cart.');
      return;
    }
    if (isItemInCart && isItemInCart(product.id)) {
      showAlert('info', 'Already in Cart', `${product.name} is already in your cart.`);
      return;
    }
    try {
      const result = await addToCart(product.id, 1);
      if (result.success) {
        showAlert('success', 'Added to Cart', `${product.name} has been added to your cart!`);
      } else {
        showAlert('error', 'Failed to Add', result.error || 'Failed to add item to cart. Please try again.');
      }
    } catch (err) {
      showAlert('error', 'Error', 'An unexpected error occurred. Please try again.');
      throw err;
    }
  };

  const renderWishlistItem = ({ item }: { item: Product }) => (
    <WishlistItem
      product={item}
      onRemove={handleRemoveFromWishlist}
      onAddToCart={handleAddToCart}
      colors={colors}
      isItemInCart={isItemInCart ? isItemInCart(item.id) : false}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconRing}>
        <View style={styles.emptyIconInner}>
          <Ionicons name="heart-outline" size={34} color={colors.primary} />
        </View>
      </View>
      <Text style={styles.emptyEyebrow}>Your Wishlist</Text>
      <Text style={styles.emptyTitle}>Your Wishlist is Empty</Text>
      <Text style={styles.emptyMessage}>Add items you love to your wishlist so you can easily find them later!</Text>
      <TouchableOpacity
        style={styles.shopNowButton}
        onPress={() => { router.push('/shop'); showAlert('info', 'Shop Now', 'Navigate to products to start adding items to your wishlist!'); }}
        activeOpacity={0.82}
      >
        <Ionicons name="storefront-outline" size={16} color={colors.primaryText} />
        <Text style={styles.shopNowText}>Shop Now</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && wishlistProducts.length === 0) {
    return <FullScreenLoader message="Loading your wishlist..." color={colors.primary} />;
  }

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7} accessibilityRole="button">
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerEyebrow}>IDEAL FURNITURE</Text>
          <Text style={styles.headerTitle}>My Wishlist</Text>
        </View>

        <View style={styles.countBadge}>
          <Text style={styles.countBadgeNumber}>{wishlistProducts.length}</Text>
          <Text style={styles.countBadgeLabel}>{wishlistProducts.length === 1 ? 'item' : 'items'}</Text>
        </View>
      </View>

      {/* ── Error banner ── */}
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={16} color={colors.error} />
          <Text style={styles.errorBannerText}>{error}</Text>
          <TouchableOpacity onPress={clearError} testID="clear-error-button">
            <Ionicons name="close" size={18} color={colors.error} />
          </TouchableOpacity>
        </View>
      )}

      {/* ── List eyebrow ── */}
      {wishlistProducts.length > 0 && (
        <View style={styles.listHeader}>
          <View style={styles.listEyebrowRow}>
            <Ionicons name="heart-outline" size={13} color={colors.primary} />
            <Text style={styles.listEyebrow}>Saved Items</Text>
          </View>
          <Text style={styles.listCount}>{wishlistProducts.length} saved</Text>
        </View>
      )}

      <FlatList
        data={wishlistProducts}
        renderItem={renderWishlistItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />
        }
        ListEmptyComponent={renderEmptyState}
      />

      {cartLoading && <LoadingSpinner message="Adding to cart..." color={colors.primary} />}

      <CustomAlert
        visible={alertVisible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setAlertVisible(false)}
      />
    </View>
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 14,
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
  countBadge: {
    alignItems: 'center',
    backgroundColor: colors.primaryDim,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    minWidth: 40,
  },
  countBadgeNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
    lineHeight: 20,
  },
  countBadgeLabel: {
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.textSecondary,
    fontWeight: '600',
  },

  // ── Error banner ──────────────────────────────────────────────────────────
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: `${colors.error}12`,
    borderWidth: 1,
    borderColor: `${colors.error}40`,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 10,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: colors.error,
    fontWeight: '500',
  },

  // ── List header ───────────────────────────────────────────────────────────
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 6,
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

  // ── List layout ───────────────────────────────────────────────────────────
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-between',
  },

  // ── Item card ─────────────────────────────────────────────────────────────
  itemContainer: {
    width: ITEM_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 16,
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
    opacity: 0.5,
  },
  imageContainer: {
    position: 'relative',
    height: ITEM_WIDTH * 0.82,
    backgroundColor: colors.card,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.card,
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.modalOverlay,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartEmoji: {
    fontSize: 14,
  },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,12,8,0.45)',
  },

  // Product info
  productInfo: {
    padding: 12,
    gap: 5,
  },
  productCategory: {
    fontSize: 9,
    letterSpacing: 1.5,
    color: colors.primary,
    fontWeight: '600',
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 18,
  },
  currentPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stockText: {
    fontSize: 11,
    fontWeight: '500',
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: 8,
    marginTop: 2,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 3,
  },
  addToCartText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // ── Empty state ───────────────────────────────────────────────────────────
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 80,
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
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  emptyMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  shopNowButton: {
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
  shopNowText: {
    color: colors.primaryText,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default Wishlist;
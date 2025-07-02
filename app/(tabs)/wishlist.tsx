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
import { useThemes } from '@/hooks/themes';
import { Product } from '@/types/product';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';

const { width: screenWidth } = Dimensions.get('window');
const ITEM_WIDTH = (screenWidth - 60) / 2;

interface WishlistItemProps {
  product: Product;
  onRemove: (productId: number) => void;
  onAddToCart: (product: Product) => void;
  colors: any;
  isItemInCart: boolean;
}

const WishlistItem: React.FC<WishlistItemProps> = ({ 
  product, 
  onRemove, 
  onAddToCart, 
  colors,
  isItemInCart
}) => {
  const [imageError, setImageError] = useState(false);

  const isOutOfStock = product.stock === 0;
  const isDisabled = isOutOfStock || isItemInCart;

  const getButtonText = () => {
    if (isOutOfStock) return 'Out of Stock';
    if (isItemInCart) return 'In Cart';
    return 'Add to Cart';
  };

  const getButtonIcon = () => {
    if (isItemInCart) return 'checkmark-circle-outline';
    return 'cart-outline';
  };
  

  return (
    <View style={[styles.itemContainer, { backgroundColor: colors.card }]}>
      {/* Product Image */}
      <View style={[styles.imageContainer, { backgroundColor: colors.surface }]}>
        {imageError ? (
          <View style={[styles.imagePlaceholder, { backgroundColor: colors.background }]}>
            <Ionicons name="image-outline" size={40} color={colors.textTertiary} />
          </View>
        ) : (
          <Image
            source={{ uri: product.image || product.additional_images?.split(',')[0] }}
            style={styles.productImage}
            onError={() => setImageError(true)}
            resizeMode="cover"
          />
        )}
        
        {/* Remove from Wishlist Button */}
        <TouchableOpacity
          style={[styles.removeButton, { backgroundColor: colors.background }]}
          onPress={() => onRemove(product.id)}
          activeOpacity={0.8}
        >
          <Text style={styles.heartEmoji}>❤️</Text>
        </TouchableOpacity>

      </View>

      {/* Product Info */}
      <View style={styles.productInfo}>
        <Text 
          style={[styles.productName, { color: colors.text }]} 
          numberOfLines={2}
        >
          {product.name}
        </Text>
        
        <Text 
          style={[styles.productCategory, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {(product.category_name || 'Uncategorized').toUpperCase()}
        </Text>

        {/* Price Section */}
        <View style={styles.priceContainer}>
          <Text style={[styles.currentPrice, { color: colors.primary }]}>
            Ksh {Math.floor(parseFloat(product.price)).toLocaleString()}
          </Text>
        </View>

        {/* Stock Status */}
        <View style={styles.stockContainer}>
          <View style={[
            styles.stockDot, 
            { backgroundColor: product.stock > 0 ? colors.success : colors.error }
          ]} />
          <Text style={[
            styles.stockText, 
            { color: product.stock > 0 ? colors.success : colors.error }
          ]}>
            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
          </Text>
        </View>

        {/* Add to Cart Button */}
        <TouchableOpacity
          style={[
            styles.addToCartButton,
            { 
              backgroundColor: isDisabled 
                ? colors.textTertiary 
                : isItemInCart 
                  ? colors.success 
                  : colors.primary,
              opacity: isDisabled ? 0.6 : 1
            }
          ]}
          onPress={() => onAddToCart(product)}
          disabled={isDisabled}
          activeOpacity={0.8}
        >
          <Ionicons 
            name={getButtonIcon()} 
            size={16} 
            color="white" 
            style={styles.cartIcon} 
          />
          <Text style={styles.addToCartText}>
            {getButtonText()}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const Wishlist: React.FC = () => {
  const { colors } = useThemes();
  const { 
    wishlistProducts, 
    loading, 
    error, 
    removeFromWishlist, 
    refreshWishlist, 
    clearError 
  } = useWishlist();
  const { 
    addToCart, 
    loading: cartLoading, 
    isItemInCart
  } = useCart();

  const [refreshing, setRefreshing] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    type: 'success' as 'success' | 'error' | 'warning' | 'info',
    title: '',
    message: '',
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
      throw err
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
      throw err
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
      throw err
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
      <View style={[styles.emptyIconContainer, { backgroundColor: colors.surface }]}>
        <Ionicons name="heart-outline" size={64} color={colors.textTertiary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        Your Wishlist is Empty
      </Text>
      <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
        Add items you love to your wishlist so you can easily find them later!
      </Text>
      <TouchableOpacity
        style={[styles.shopNowButton, { backgroundColor: colors.primary }]}
        onPress={() => {
          router.push('/shop');
          showAlert('info', 'Shop Now', 'Navigate to products to start adding items to your wishlist!');
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.shopNowText}>Shop Now</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && wishlistProducts.length === 0) {
    return (
      <FullScreenLoader 
        message="Loading your wishlist..." 
        color={colors.primary}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
       <View style={[styles.header, { backgroundColor: colors.surface }]}>
    <View style={styles.headerContent}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
        activeOpacity={0.7}
        accessibilityRole="button"
      >
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>
      
      <View style={styles.headerTextContainer}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          My Wishlist
        </Text>
        <Text style={[styles.itemCount, { color: colors.textSecondary }]}>
          {wishlistProducts.length} {wishlistProducts.length === 1 ? 'item' : 'items'}
        </Text>
      </View>
    </View>
  </View>

      {/* Error Display */}
      {error && (
        <View style={[styles.errorContainer, { backgroundColor: colors.error + '20' }]}>
          <Ionicons name="alert-circle" size={20} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <TouchableOpacity onPress={clearError} testID="clear-error-button">
            <Ionicons name="close" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      )}

      {/* Wishlist Content */}
      <FlatList
        data={wishlistProducts}
        renderItem={renderWishlistItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
      />

      {/* Loading Overlay for Cart Operations */}
      {cartLoading && (
        <LoadingSpinner 
          message="Adding to cart..." 
          color={colors.primary}
        />
      )}

      {/* Custom Alert */}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginTop: 30,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerTextContainer: {
    flex: 1,
  },
  itemCount: {
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 8,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-between',
  },
  itemContainer: {
    width: ITEM_WIDTH,
    borderRadius: 12,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  heartEmoji: {
    fontSize: 16,
  },
  imageContainer: {
    position: 'relative',
    height: ITEM_WIDTH * 0.8,
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
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  discountText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 18,
  },
  productCategory: {
    fontSize: 12,
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  currentPrice: {
    fontSize: 16,
    fontWeight: '700',
  },
  originalPrice: {
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 4,
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
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  cartIcon: {
    marginRight: 2,
  },
  addToCartText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  shopNowButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopNowText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Wishlist;
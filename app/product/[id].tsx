import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Product, ProductReview } from "@/types/product";
import { useThemes, AppColors } from "@/hooks/themes";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { API_URL } from "@/constants/api";
import { Ionicons } from '@expo/vector-icons';
import CustomAlert from '@/components/CustomAlert';
import { LoadingSpinner, FullScreenLoader } from '@/components/LoadingSpinner';

const { width: screenWidth } = Dimensions.get("window");

// ─── Component ────────────────────────────────────────────────────────────────
const ProductDetailsPage: React.FC = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useThemes();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { addToCart, loading: cartLoading, error: cartError, clearError } = useCart();

  const styles = makeStyles(colors);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    type: 'success' as 'success' | 'error' | 'warning' | 'info',
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: 'OK',
    cancelText: 'Cancel',
    showCancel: false,
  });

  const scrollViewRef = useRef<ScrollView>(null);

  const showAlert = useCallback((config: Partial<typeof alertConfig>) => {
    setAlertConfig(prev => ({ ...prev, ...config }));
    setAlertVisible(true);
  }, []);

  const hideAlert = useCallback(() => setAlertVisible(false), []);

  // ── Fetch product ────────────────────────────────────────────────────────────
  const doFetch = useCallback(async () => {
    if (!id) { setError("Product ID is required"); setLoading(false); return; }
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_URL}/products/products/${id}/`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        if (response.status === 404) throw new Error('Product not found');
        else if (response.status >= 500) throw new Error('Server error. Please try again later.');
        else throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      setProduct(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load product');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    doFetch();
  }, [doFetch]);

  useEffect(() => {
    if (cartError) {
      showAlert({ type: 'error', title: 'Cart Error', message: cartError, onConfirm: () => { clearError(); hideAlert(); } });
    }
  }, [cartError, clearError, showAlert, hideAlert]);

  const handleRetry = () => { if (id) doFetch(); };

  const images = product?.additional_images
    ? [product.image, ...product.additional_images.split(',')]
    : product ? [product.image] : [];

  const handleWishlistToggle = () => {
    if (!product) return;
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
      showAlert({ type: 'info', title: 'Removed from Wishlist', message: `${product.name} has been removed from your wishlist.`, confirmText: 'OK', onConfirm: hideAlert });
    } else {
      addToWishlist(product);
      showAlert({ type: 'success', title: 'Added to Wishlist', message: `${product.name} has been added to your wishlist.`, confirmText: 'OK', onConfirm: hideAlert });
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    setAddingToCart(true);
    clearError();
    try {
      const result = await addToCart(product.id, quantity);
      if (result.success) {
        showAlert({ type: 'success', title: 'Added to Cart', message: `${product.name} (Qty: ${quantity}) has been added to your cart.`, confirmText: 'View Cart', cancelText: 'Continue Shopping', showCancel: true, onConfirm: () => { hideAlert(); router.push("/cart"); } });
        setQuantity(1);
      } else {
        showAlert({ type: 'error', title: 'Error', message: result.error || "Failed to add item to cart. Please try again.", onConfirm: hideAlert });
      }
    } catch (error) {
      showAlert({ type: 'error', title: 'Error', message: "An unexpected error occurred. Please try again.", onConfirm: hideAlert });
      throw error;
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    setAddingToCart(true);
    clearError();
    try {
      const result = await addToCart(product.id, quantity);
      if (result.success) {
        showAlert({ type: 'info', title: 'Buy Now', message: `Proceeding to checkout for ${product.name} (Qty: ${quantity})`, confirmText: 'Continue', cancelText: 'Cancel', showCancel: true, onConfirm: () => { hideAlert(); router.push("/(screens)/checkout"); } });
      } else {
        showAlert({ type: 'error', title: 'Error', message: result.error || "Failed to add item to cart. Please try again.", onConfirm: hideAlert });
      }
    } catch (error) {
      showAlert({ type: 'error', title: 'Error', message: "An unexpected error occurred. Please try again.", onConfirm: hideAlert });
      throw error;
    } finally {
      setAddingToCart(false);
    }
  };

  const formatPrice = (price: string) => `KSh ${parseFloat(price).toLocaleString()}`;
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const renderStars = (rating: number) => {
    const rounded = Math.round(rating);
    return Array.from({ length: 5 }, (_, i) => (
      <Ionicons key={i} name={i < rounded ? "star" : "star-outline"} size={14} color={i < rounded ? colors.primary : colors.textTertiary} style={{ marginRight: 2 }} />
    ));
  };

  const getConditionPalette = (condition: string) => {
    switch (condition) {
      case "NEW":         return { fg: colors.success, bg: `${colors.success}14`, border: `${colors.success}47` };
      case "USED":        return { fg: colors.warning, bg: `${colors.warning}14`, border: `${colors.warning}47` };
      case "REFURBISHED": return { fg: colors.primary, bg: colors.primaryDim,    border: colors.primaryBorder };
      default:            return { fg: colors.textSecondary, bg: colors.surface,  border: colors.border };
    }
  };

  const getMaterialIcon = (material: string) => {
    switch (material) {
      case "WOOD": return "🪵"; case "METAL": return "⚙️"; case "FABRIC": return "🧵";
      case "LEATHER": return "🟤"; case "GLASS": return "🔍"; case "PLASTIC": return "🔧";
      default: return "📦";
    }
  };

  const renderReview = ({ item }: { item: ProductReview }) => (
    <View style={styles.reviewItem}>
      <View style={styles.reviewCardAccent} />
      <View style={styles.reviewInner}>
        <View style={styles.reviewHeader}>
          <View style={styles.reviewAvatarBadge}>
            <Text style={styles.reviewAvatarText}>{item.user?.[0]?.toUpperCase() || '?'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.reviewUser}>{item.user}</Text>
            <Text style={styles.reviewDate}>{formatDate(item.created_at)}</Text>
          </View>
        </View>
        <View style={styles.reviewRating}>{renderStars(item.rating)}</View>
        <Text style={styles.reviewComment}>{item.comment}</Text>
      </View>
    </View>
  );

  const isLoading = cartLoading || addingToCart;

  // ── Mini header for loading/error states ──────────────────────────────────
  const MiniHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={22} color={colors.text} />
      </TouchableOpacity>
      <View style={styles.headerCenter}>
        <Text style={styles.headerEyebrow}>IDEAL FURNITURE</Text>
        <Text style={styles.headerTitle}>Details</Text>
      </View>
      <View style={styles.headerSpacer} />
    </View>
  );

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <MiniHeader />
        <FullScreenLoader message="Loading product details..." />
      </SafeAreaView>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <MiniHeader />
        <View style={styles.errorContainer}>
          <View style={styles.errorIconRing}>
            <Ionicons name="alert-circle-outline" size={32} color={colors.error} />
          </View>
          <Text style={styles.errorEyebrow}>Something went wrong</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Ionicons name="reload-outline" size={15} color={colors.primaryText} />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Not found ──────────────────────────────────────────────────────────────
  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <MiniHeader />
        <View style={styles.errorContainer}>
          <View style={styles.errorIconRing}>
            <Ionicons name="cube-outline" size={32} color={colors.textTertiary} />
          </View>
          <Text style={styles.errorEyebrow}>Not Found</Text>
          <Text style={styles.errorText}>Product not found</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={15} color={colors.primaryText} />
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const conditionPalette = getConditionPalette(product.condition);
  const inWishlist = isInWishlist(product.id);

  return (
    <SafeAreaView style={styles.container}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} accessibilityRole="button">
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerEyebrow}>IDEAL FURNITURE</Text>
          <Text style={styles.headerTitle}>Details</Text>
        </View>

        <TouchableOpacity style={[styles.wishlistButton, inWishlist && styles.wishlistButtonActive]} onPress={handleWishlistToggle}>
          <Text style={{ fontSize: 20 }}>{inWishlist ? "❤️" : "🤍"}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false}>

        {/* ── Image gallery ── */}
        <View style={styles.imageContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
              setSelectedImageIndex(index);
            }}
            scrollEventThrottle={16}
          >
            {images.map((image, index) => (
              <Image key={index} source={{ uri: image }} style={styles.mainImage} />
            ))}
          </ScrollView>

          {images.length > 1 && (
            <View style={styles.imageIndicatorsOverlay}>
              {images.map((_, index) => (
                <View key={index} style={[styles.indicator, selectedImageIndex === index && styles.activeIndicator]} />
              ))}
            </View>
          )}
        </View>

        {/* Thumbnails */}
        {images.length > 1 && (
          <View style={styles.thumbnailContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {images.map((image, index) => (
                <TouchableOpacity key={index} onPress={() => setSelectedImageIndex(index)}>
                  <Image source={{ uri: image }} style={[styles.thumbnail, selectedImageIndex === index && styles.activeThumbnail]} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Product details ── */}
        <View style={styles.content}>

          {product.category_name && (
            <Text style={styles.categoryText}>{product.category_name.toUpperCase()}</Text>
          )}

          <Text style={styles.productName}>{product.name}</Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(product.price)}</Text>
            {product.average_rating && (
              <View style={styles.ratingPill}>
                {renderStars(product.average_rating)}
                <Text style={styles.ratingText}>{product.average_rating.toFixed(1)}</Text>
                <Text style={styles.reviewCount}>({product.review_count})</Text>
              </View>
            )}
          </View>

          <View style={styles.badgesRow}>
            <View style={[styles.badge, { backgroundColor: conditionPalette.bg, borderColor: conditionPalette.border }]}>
              <View style={[styles.badgeDot, { backgroundColor: conditionPalette.fg }]} />
              <Text style={[styles.badgeText, { color: conditionPalette.fg }]}>{product.condition}</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.materialEmoji}>{getMaterialIcon(product.primary_material)}</Text>
              <Text style={styles.badgeText}>{product.primary_material}</Text>
            </View>
          </View>

          <View style={styles.stockRow}>
            <View style={styles.stockIconBadge}>
              <Ionicons name="cube-outline" size={14} color={colors.primary} />
            </View>
            <Text style={styles.stockLabel}>In Stock:</Text>
            <Text style={styles.stockCount}>{product.stock} available</Text>
          </View>

          {product.is_available && (
            <View style={styles.quantityCard}>
              <View style={styles.quantityCardAccent} />
              <View style={styles.quantityInner}>
                <Text style={styles.quantityLabel}>Quantity</Text>
                <View style={styles.quantityControls}>
                  <TouchableOpacity
                    style={[styles.quantityButton, isLoading && styles.disabledButton]}
                    onPress={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={isLoading}
                  >
                    <Text style={styles.quantityButtonText}>-</Text>
                  </TouchableOpacity>
                  <View style={styles.quantityDisplay}>
                    <Text style={styles.quantityText}>{quantity}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.quantityButton, isLoading && styles.disabledButton]}
                    onPress={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={isLoading}
                  >
                    <Text style={styles.quantityButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {product.description && (
            <View style={styles.descriptionSection}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="document-text-outline" size={13} color={colors.primary} />
                <Text style={styles.sectionEyebrow}>About this product</Text>
              </View>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{product.description}</Text>
            </View>
          )}

          {product.reviews && product.reviews.length > 0 && (
            <View style={styles.reviewsSection}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="chatbubble-outline" size={13} color={colors.primary} />
                <Text style={styles.sectionEyebrow}>Customer feedback</Text>
              </View>
              <Text style={styles.sectionTitle}>Reviews</Text>
              <FlatList
                data={product.reviews}
                renderItem={renderReview}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
              />
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── Action buttons ── */}
      <View style={styles.buttonContainer}>
        {product.is_available ? (
          <>
            <TouchableOpacity
              style={[styles.addToCartButton, isLoading && styles.disabledButton]}
              onPress={handleAddToCart}
              disabled={isLoading}
            >
              <Ionicons name="cart-outline" size={18} color={colors.primary} />
              <Text style={styles.addToCartText}>
                {addingToCart ? "Adding..." : "Add to Cart"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.buyNowButton, isLoading && styles.disabledButton]}
              onPress={handleBuyNow}
              disabled={isLoading}
            >
              <Ionicons name="flash-outline" size={18} color={colors.primaryText} />
              <Text style={styles.buyNowText}>
                {addingToCart ? "Processing..." : "Buy Now"}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.unavailableButton} disabled>
            <Ionicons name="close-circle-outline" size={18} color={colors.textTertiary} />
            <Text style={styles.unavailableText}>Out of Stock</Text>
          </TouchableOpacity>
        )}
      </View>

      {addingToCart && <LoadingSpinner message="Adding to cart..." size="large" />}

      <CustomAlert
        visible={alertVisible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={hideAlert}
        onConfirm={alertConfig.onConfirm}
        confirmText={alertConfig.confirmText}
        cancelText={alertConfig.cancelText}
        showCancel={alertConfig.showCancel}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
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
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.3,
  },
  headerSpacer: { width: 40 },
  wishlistButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wishlistButtonActive: {
    backgroundColor: `${colors.error}1A`,
    borderColor: `${colors.error}4D`,
  },

  // ── Image gallery ─────────────────────────────────────────────────────────
  imageContainer: {
    height: 300,
    backgroundColor: colors.card,
    position: 'relative',
  },
  mainImage: {
    width: screenWidth,
    height: 300,
    resizeMode: 'cover',
  },
  imageIndicatorsOverlay: {
    position: 'absolute',
    bottom: 14,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
    backgroundColor: 'rgba(255,255,255,0.30)',
  },
  activeIndicator: {
    backgroundColor: colors.primary,
    width: 18,
    borderRadius: 3,
  },
  thumbnailContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 10,
    marginRight: 10,
    resizeMode: 'cover',
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeThumbnail: {
    borderWidth: 2,
    borderColor: colors.primary,
  },

  // ── Content ───────────────────────────────────────────────────────────────
  content: {
    padding: 20,
    paddingBottom: 24,
  },
  categoryText: {
    fontSize: 10,
    letterSpacing: 2.5,
    color: colors.primary,
    textTransform: 'uppercase',
    fontWeight: '700',
    marginBottom: 8,
  },
  productName: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 14,
    lineHeight: 32,
    letterSpacing: 0.2,
  },

  // Price + rating
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  price: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryDim,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 3,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  // Badges
  badgesRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },
  materialEmoji: {
    fontSize: 14,
  },

  // Stock
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  stockIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.primaryDim,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  stockCount: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '700',
  },

  // Quantity card
  quantityCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: 24,
  },
  quantityCardAccent: {
    height: 2,
    backgroundColor: colors.primary,
    opacity: 0.45,
  },
  quantityInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  quantityLabel: {
    fontSize: 13,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.textSecondary,
    fontWeight: '600',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primaryDim,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    lineHeight: 22,
  },
  quantityDisplay: {
    width: 44,
    height: 36,
    backgroundColor: colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },

  // Description
  descriptionSection: {
    marginBottom: 28,
  },
  reviewsSection: {
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  sectionEyebrow: {
    fontSize: 10,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: colors.primary,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 14,
    letterSpacing: 0.2,
  },
  description: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 26,
  },

  // Review cards
  reviewItem: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    overflow: 'hidden',
  },
  reviewCardAccent: {
    height: 2,
    backgroundColor: colors.primary,
    opacity: 0.4,
  },
  reviewInner: {
    padding: 14,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  reviewAvatarBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primaryDim,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  reviewUser: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  reviewDate: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 2,
  },
  reviewRating: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  reviewComment: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
  },

  // ── Action buttons ────────────────────────────────────────────────────────
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingBottom: 28,
    backgroundColor: colors.stickyBackground,
    borderTopWidth: 1,
    borderTopColor: `${colors.primary}2E`,
  },
  addToCartButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primaryDim,
    borderWidth: 1.5,
    borderColor: colors.primaryBorder,
    paddingVertical: 15,
    borderRadius: 12,
  },
  addToCartText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.3,
  },
  buyNowButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 6,
  },
  buyNowText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryText,
    letterSpacing: 0.3,
  },
  unavailableButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 15,
    borderRadius: 12,
  },
  unavailableText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  disabledButton: {
    opacity: 0.5,
  },

  // ── Error / Not found ─────────────────────────────────────────────────────
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
  errorText: {
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

export default ProductDetailsPage;
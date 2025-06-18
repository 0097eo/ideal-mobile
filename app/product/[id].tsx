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
  SafeAreaView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Product, ProductReview } from "@/types/product";
import { useThemes } from "@/hooks/themes";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { API_URL } from "@/constants/api";
import { Ionicons } from '@expo/vector-icons';
import CustomAlert from '@/components/CustomAlert';
import { LoadingSpinner, FullScreenLoader } from '@/components/LoadingSpinner';

const { width: screenWidth } = Dimensions.get("window");

const ProductDetailsPage: React.FC = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors, createStyles } = useThemes();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { addToCart, loading: cartLoading, error: cartError, clearError } = useCart();
  
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);
  
  // Alert states
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

  // Helper function to show alerts
  const showAlert = useCallback((config: Partial<typeof alertConfig>) => {
    setAlertConfig(prev => ({ ...prev, ...config }));
    setAlertVisible(true);
  }, []);

  const hideAlert = useCallback(() => {
    setAlertVisible(false);
  }, []);

  // Fetch product data from API
  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) {
        setError("Product ID is required");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_URL}/products/products/${id}/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Product not found');
          } else if (response.status >= 500) {
            throw new Error('Server error. Please try again later.');
          } else {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
          }
        }

        const productData: Product = await response.json();
        setProduct(productData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Clear cart errors when component mounts or when cart error changes
  useEffect(() => {
    if (cartError) {
      showAlert({
        type: 'error',
        title: 'Cart Error',
        message: cartError,
        onConfirm: () => {
          clearError();
          hideAlert();
        },
      });
    }
  }, [cartError, clearError, showAlert, hideAlert]);

  // Retry function for failed requests
  const handleRetry = () => {
    if (id) {
      setError(null);
      const fetchProduct = async () => {
        try {
          setLoading(true);
          setError(null);

          const response = await fetch(`${API_URL}/products/products/${id}/`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            if (response.status === 404) {
              throw new Error('Product not found');
            } else if (response.status >= 500) {
              throw new Error('Server error. Please try again later.');
            } else {
              throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
          }

          const productData: Product = await response.json();
          setProduct(productData);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load product');
        } finally {
          setLoading(false);
        }
      };

      fetchProduct();
    }
  };

  const images = product?.additional_images 
    ? [product.image, ...product.additional_images.split(',')]
    : product ? [product.image] : [];

  const handleWishlistToggle = () => {
    if (!product) return;
    
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
      showAlert({
        type: 'info',
        title: 'Removed from Wishlist',
        message: `${product.name} has been removed from your wishlist.`,
        confirmText: 'OK',
        onConfirm: hideAlert,
      });
    } else {
      addToWishlist(product);
      showAlert({
        type: 'success',
        title: 'Added to Wishlist',
        message: `${product.name} has been added to your wishlist.`,
        confirmText: 'OK',
        onConfirm: hideAlert,
      });
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    
    setAddingToCart(true);
    clearError();
    
    try {
      const result = await addToCart(product.id, quantity);
      
      if (result.success) {
        showAlert({
          type: 'success',
          title: 'Added to Cart',
          message: `${product.name} (Qty: ${quantity}) has been added to your cart.`,
          confirmText: 'View Cart',
          cancelText: 'Continue Shopping',
          showCancel: true,
          onConfirm: () => {
            hideAlert();
            router.push("/cart");
          },
        });
        // Reset quantity to 1 after successful add
        setQuantity(1);
      } else {
        showAlert({
          type: 'error',
          title: 'Error',
          message: result.error || "Failed to add item to cart. Please try again.",
          onConfirm: hideAlert,
        });
      }
    } catch (error) {
      showAlert({
        type: 'error',
        title: 'Error',
        message: "An unexpected error occurred. Please try again.",
        onConfirm: hideAlert,
      });
      throw error
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    
    // First add to cart, then navigate to checkout
    setAddingToCart(true);
    clearError();
    
    try {
      const result = await addToCart(product.id, quantity);
      
      if (result.success) {
        showAlert({
          type: 'info',
          title: 'Buy Now',
          message: `Proceeding to checkout for ${product.name} (Qty: ${quantity})`,
          confirmText: 'Continue',
          cancelText: 'Cancel',
          showCancel: true,
          onConfirm: () => {
            hideAlert();
            router.push("/(screens)/checkout");
          },
        });
      } else {
        showAlert({
          type: 'error',
          title: 'Error',
          message: result.error || "Failed to add item to cart. Please try again.",
          onConfirm: hideAlert,
        });
      }
    } catch (error) {
      showAlert({
        type: 'error',
        title: 'Error',
        message: "An unexpected error occurred. Please try again.",
        onConfirm: hideAlert,
      });
      throw error
    } finally {
      setAddingToCart(false);
    }
  };

  const formatPrice = (price: string) => `KSh ${parseFloat(price).toLocaleString()}`;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const roundedRating = Math.round(rating);
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= roundedRating ? "star" : "star-outline"}
          size={16}
          color={i <= roundedRating ? colors.warning : colors.textTertiary}
          style={{ marginRight: 2 }}
        />
      );
    }
    return stars;
  };

  const renderReview = ({ item }: { item: ProductReview }) => (
    <View style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        <Text style={styles.reviewUser}>{item.user}</Text>
        <Text style={styles.reviewDate}>{formatDate(item.created_at)}</Text>
      </View>
      <View style={styles.reviewRating}>
        {renderStars(item.rating)}
      </View>
      <Text style={styles.reviewComment}>{item.comment}</Text>
    </View>
  );

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "NEW":
        return colors.success;
      case "USED":
        return colors.warning;
      case "REFURBISHED":
        return colors.primary;
      default:
        return colors.textSecondary;
    }
  };

  const getMaterialIcon = (material: string) => {
    switch (material) {
      case "WOOD": return "🪵";
      case "METAL": return "⚙️";
      case "FABRIC": return "🧵";
      case "LEATHER": return "🟤";
      case "GLASS": return "🔍";
      case "PLASTIC": return "🔧";
      default: return "📦";
    }
  };

  const styles = createStyles((colors) =>
    StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: colors.background,
      },
      errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: colors.background,
      },
      errorText: {
        fontSize: 16,
        color: colors.error,
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 24,
      },
      retryButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
      },
      retryButtonText: {
        color: colors.surface,
        fontSize: 16,
        fontWeight: '600',
      },
      header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 16,
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      },
      backButton: {
        padding: 8,
        color: colors.text,
      },
      wishlistButton: {
        padding: 8,
      },
      imageContainer: {
        height: 300,
        backgroundColor: colors.surface,
      },
      mainImage: {
        width: screenWidth,
        height: 300,
        resizeMode: "cover",
      },
      imageIndicators: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 16,
        backgroundColor: colors.surface,
      },
      indicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
        backgroundColor: colors.textTertiary,
      },
      activeIndicator: {
        backgroundColor: colors.primary,
      },
      thumbnailContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: colors.surface,
      },
      thumbnail: {
        width: 60,
        height: 60,
        borderRadius: 8,
        marginRight: 12,
        resizeMode: "cover",
      },
      activeThumbnail: {
        borderWidth: 2,
        borderColor: colors.primary,
      },
      content: {
        flex: 1,
        padding: 16,
      },
      categoryText: {
        fontSize: 14,
        color: colors.textSecondary,
        fontWeight: "500",
        textTransform: "uppercase",
        marginBottom: 8,
      },
      productName: {
        fontSize: 24,
        fontWeight: "800",
        color: colors.text,
        marginBottom: 12,
        lineHeight: 30,
      },
      priceContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
      },
      price: {
        fontSize: 28,
        fontWeight: "900",
        color: colors.primary,
      },
      ratingContainer: {
        flexDirection: "row",
        alignItems: "center",
      },
      rating: {
        fontSize: 16,
        fontWeight: "600",
        color: colors.text,
        marginLeft: 8,
      },
      reviewCount: {
        fontSize: 14,
        color: colors.textSecondary,
        marginLeft: 4,
      },
      badgesContainer: {
        flexDirection: "row",
        marginBottom: 20,
      },
      badge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.surface,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginRight: 12,
      },
      badgeText: {
        fontSize: 12,
        fontWeight: "600",
        marginLeft: 4,
      },
      stockContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
      },
      stockText: {
        fontSize: 16,
        color: colors.text,
        fontWeight: "500",
      },
      stockCount: {
        fontSize: 16,
        color: colors.success,
        fontWeight: "700",
        marginLeft: 8,
      },
      quantityContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 24,
      },
      quantityLabel: {
        fontSize: 16,
        color: colors.text,
        fontWeight: "500",
        marginRight: 16,
      },
      quantityControls: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.surface,
        borderRadius: 8,
      },
      quantityButton: {
        padding: 12,
        paddingHorizontal: 16,
      },
      quantityButtonText: {
        fontSize: 18,
        fontWeight: "700",
        color: colors.primary,
      },
      quantityText: {
        fontSize: 16,
        fontWeight: "600",
        color: colors.text,
        paddingHorizontal: 16,
      },
      description: {
        fontSize: 16,
        color: colors.text,
        lineHeight: 24,
        marginBottom: 24,
      },
      sectionTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: colors.text,
        marginBottom: 16,
      },
      reviewsHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
      },
      reviewItem: {
        backgroundColor: colors.surface,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
      },
      reviewHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
      },
      reviewUser: {
        flex: 1,
        fontSize: 16,
        fontWeight: "600",
        color: colors.text,
        marginRight: 8,
      },
      reviewDate: {
        fontSize: 12,
        color: colors.textSecondary,
        flexShrink: 0,
      },
      reviewRating: {
        flexDirection: "row",
        marginBottom: 8,
      },
      reviewComment: {
        fontSize: 14,
        color: colors.text,
        lineHeight: 20,
      },
      buttonContainer: {
        flexDirection: "row",
        padding: 16,
        paddingBottom: 32,
        backgroundColor: colors.background,
        borderTopWidth: 1,
        borderTopColor: colors.border,
      },
      addToCartButton: {
        flex: 1,
        backgroundColor: colors.surface,
        borderWidth: 2,
        borderColor: colors.primary,
        paddingVertical: 16,
        borderRadius: 12,
        marginRight: 8,
        alignItems: "center",
        flexDirection: 'row',
        justifyContent: 'center',
      },
      addToCartText: {
        fontSize: 16,
        fontWeight: "700",
        color: colors.primary,
        marginLeft: 8,
      },
      buyNowButton: {
        flex: 1,
        backgroundColor: colors.primary,
        paddingVertical: 16,
        borderRadius: 12,
        marginLeft: 8,
        alignItems: "center",
        flexDirection: 'row',
        justifyContent: 'center',
      },
      buyNowText: {
        fontSize: 16,
        fontWeight: "700",
        color: colors.surface,
        marginLeft: 8,
      },
      unavailableButton: {
        flex: 1,
        backgroundColor: colors.textTertiary,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
      },
      unavailableText: {
        fontSize: 16,
        fontWeight: "700",
        color: colors.surface,
      },
      disabledButton: {
        opacity: 0.6,
      },
    })
  );

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24}/>
          </TouchableOpacity>
          <View style={styles.wishlistButton} />
        </View>
        <FullScreenLoader message="Loading product details..." />
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text}/>
          </TouchableOpacity>
          <View style={styles.wishlistButton} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Product not found
  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text}/>
          </TouchableOpacity>
          <View style={styles.wishlistButton} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Product not found</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isLoading = cartLoading || addingToCart;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold'}}>Details</Text>
        <TouchableOpacity style={styles.wishlistButton} onPress={handleWishlistToggle}>
          <Text style={{ fontSize: 24, color: isInWishlist(product.id) ? colors.error : colors.textSecondary }}>
            {isInWishlist(product.id) ? "❤️" : "🤍"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
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
        </View>

        {/* Image Indicators */}
        {images.length > 1 && (
          <View style={styles.imageIndicators}>
            {images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  selectedImageIndex === index && styles.activeIndicator,
                ]}
              />
            ))}
          </View>
        )}

        {/* Thumbnails */}
        {images.length > 1 && (
          <View style={styles.thumbnailContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {images.map((image, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setSelectedImageIndex(index)}
                >
                  <Image
                    source={{ uri: image }}
                    style={[
                      styles.thumbnail,
                      selectedImageIndex === index && styles.activeThumbnail,
                    ]}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Product Details */}
        <View style={styles.content}>
          {product.category_name && (
            <Text style={styles.categoryText}>{product.category_name}</Text>
          )}

          <Text style={styles.productName}>{product.name}</Text>

          <View style={styles.priceContainer}>
            <Text style={styles.price}>{formatPrice(product.price)}</Text>
            {product.average_rating && (
              <View style={styles.ratingContainer}>
                {renderStars(product.average_rating)}
                <Text style={styles.rating}>{product.average_rating.toFixed(1)}</Text>
                <Text style={styles.reviewCount}>({product.review_count})</Text>
              </View>
            )}
          </View>

          {/* Badges */}
          <View style={styles.badgesContainer}>
            <View style={styles.badge}>
              <Text style={{ color: getConditionColor(product.condition) }}>●</Text>
              <Text style={[styles.badgeText, { color: getConditionColor(product.condition) }]}>
                {product.condition}
              </Text>
            </View>
            <View style={styles.badge}>
              <Text>{getMaterialIcon(product.primary_material)}</Text>
              <Text style={[styles.badgeText, { color: colors.text }]}>
                {product.primary_material}
              </Text>
            </View>
          </View>

          {/* Stock */}
          <View style={styles.stockContainer}>
            <Text style={styles.stockText}>In Stock:</Text>
            <Text style={styles.stockCount}>{product.stock} available</Text>
          </View>

          {/* Quantity Selector */}
          {product.is_available && (
            <View style={styles.quantityContainer}>
              <Text style={styles.quantityLabel}>Quantity:</Text>
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={isLoading}
                >
                  <Text style={styles.quantityButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.quantityText}>{quantity}</Text>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={isLoading}
                >
                  <Text style={styles.quantityButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Description */}
          {product.description && (
            <>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{product.description}</Text>
            </>
          )}

          {/* Reviews */}
          {product.reviews && product.reviews.length > 0 && (
            <>
              <View style={styles.reviewsHeader}>
                <Text style={styles.sectionTitle}>Reviews</Text>
              </View>
              <FlatList
                data={product.reviews}
                renderItem={renderReview}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
              />
            </>
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        {product.is_available ? (
          <>
            <TouchableOpacity 
              style={[styles.addToCartButton, isLoading && styles.disabledButton]} 
              onPress={handleAddToCart}
              disabled={isLoading}
            >
              <Ionicons name="cart-outline" size={20} color={colors.primary} />
              <Text style={styles.addToCartText}>
                {addingToCart ? "Adding..." : "Add to Cart"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.buyNowButton, isLoading && styles.disabledButton]} 
              onPress={handleBuyNow}
              disabled={isLoading}
            >
              <Ionicons name="flash-outline" size={20} color={colors.surface} />
              <Text style={styles.buyNowText}>
                {addingToCart ? "Processing..." : "Buy Now"}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.unavailableButton} disabled>
            <Text style={styles.unavailableText}>Out of Stock</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Loading Spinner Overlay */}
      {addingToCart && (
        <LoadingSpinner 
          message={addingToCart ? "Adding to cart..." : "Processing..."} 
          size="large" 
        />
      )}

      {/* Custom Alert */}
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

export default ProductDetailsPage;
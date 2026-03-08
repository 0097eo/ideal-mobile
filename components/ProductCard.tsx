import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Link } from "expo-router";
import { Product } from "@/types/product";
import { useWishlist } from "@/context/WishlistContext";
import { useThemes, AppColors } from "@/hooks/themes";

const { width: screenWidth } = Dimensions.get("window");

interface ProductCardProps {
  product: Product;
  onPress?: (product: Product) => void;
  showFullWidth?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  showFullWidth = false,
}) => {
  const { colors } = useThemes();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [imageError, setImageError] = useState(false);

  const styles = makeStyles(colors);

  const handleWishlistToggle = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const formatPrice = (price: string) =>
    `KSh ${Math.floor(parseFloat(price)).toLocaleString()}`;

  const getConditionPalette = (condition: string) => {
    switch (condition) {
      case 'NEW':         return { fg: colors.success,       bg: `${colors.success}1F`,       border: `${colors.success}4D` };
      case 'USED':        return { fg: colors.warning,       bg: `${colors.warning}1F`,       border: `${colors.warning}4D` };
      case 'REFURBISHED': return { fg: colors.primary,       bg: colors.primaryDim,           border: colors.primaryBorder };
      default:            return { fg: colors.textSecondary, bg: colors.surface,              border: colors.border };
    }
  };

  const conditionPalette = getConditionPalette(product.condition);
  const inWishlist = isInWishlist(product.id);
  const cardWidth = showFullWidth
    ? screenWidth - 32
    : Math.floor((screenWidth - 48) / 2);

  return (
    <Link href={`/product/${product.id}`} asChild>
      <TouchableOpacity
        style={[styles.container, { width: cardWidth }]}
        onPress={() => onPress?.(product)}
        activeOpacity={0.82}
      >
        {/* Gold top accent */}
        <View style={styles.cardAccentLine} />

        {/* Image */}
        <View style={styles.imageContainer}>
          {imageError ? (
            <View style={styles.imageFallback}>
              <Text style={styles.imageFallbackIcon}>🛋</Text>
            </View>
          ) : (
            <Image
              source={{ uri: product.image }}
              style={styles.productImage}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
          )}

          {/* Sold out overlay */}
          {!product.is_available && (
            <View style={styles.soldOutOverlay}>
              <Text style={styles.soldOutText}>SOLD OUT</Text>
            </View>
          )}

          {/* Condition badge */}
          {product.is_available && (
            <View style={[
              styles.conditionBadge,
              { backgroundColor: conditionPalette.bg, borderColor: conditionPalette.border }
            ]}>
              <View style={[styles.conditionDot, { backgroundColor: conditionPalette.fg }]} />
              <Text style={[styles.conditionText, { color: conditionPalette.fg }]}>
                {product.condition}
              </Text>
            </View>
          )}

          {/* Wishlist button */}
          <TouchableOpacity
            style={[styles.wishlistButton, inWishlist && styles.wishlistButtonActive]}
            onPress={handleWishlistToggle}
            activeOpacity={0.7}
          >
            <Text style={styles.wishlistEmoji}>{inWishlist ? "❤️" : "🤍"}</Text>
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={styles.content}>
          {product.category_name && (
            <Text style={styles.categoryText} numberOfLines={1}>
              {product.category_name}
            </Text>
          )}

          <Text style={styles.productName} numberOfLines={1}>
            {product.name}
          </Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(product.price)}</Text>
            {product.stock === 0 && (
              <View style={styles.outOfStockPill}>
                <Text style={styles.outOfStockText}>Sold</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Link>
  );
};

const makeStyles = (colors: AppColors) => StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    margin: 6,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 4,
  },
  cardAccentLine: {
    height: 2,
    backgroundColor: colors.primary,
    opacity: 0.45,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 170,
    backgroundColor: colors.card,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  imageFallbackIcon: {
    fontSize: 40,
    opacity: 0.4,
  },
  soldOutOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.modalOverlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldOutText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 3,
  },
  conditionBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  conditionDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  conditionText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  wishlistButton: {
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
    zIndex: 10,
  },
  wishlistButtonActive: {
    backgroundColor: `${colors.error}26`,
    borderColor: `${colors.error}47`,
  },
  wishlistEmoji: {
    fontSize: 14,
  },
  content: {
    paddingHorizontal: 12,
    paddingBottom: 14,
    paddingTop: 10,
    gap: 4,
  },
  categoryText: {
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.primary,
    fontWeight: '600',
  },
  productName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    height: 18,
    letterSpacing: 0.1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  price: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.3,
  },
  outOfStockPill: {
    backgroundColor: `${colors.error}1A`,
    borderWidth: 1,
    borderColor: `${colors.error}40`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  outOfStockText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.error,
    letterSpacing: 0.5,
  },
});

export default ProductCard;
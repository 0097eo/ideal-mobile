import React from "react";
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
import { useThemes } from "@/hooks/themes";
import { useWishlist } from "@/context/WishlistContext";

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
  const { colors, createStyles } = useThemes();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const handleWishlistToggle = (e: any) => {
    e.preventDefault(); // Prevent the link navigation when wishlist button is pressed
    e.stopPropagation();
    
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const formatPrice = (price: string) => {
    const wholeNumber = Math.floor(parseFloat(price));
    return `KES ${wholeNumber.toLocaleString()}`;
  };

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

  const styles = createStyles((colors) =>
    StyleSheet.create({
      container: {
        backgroundColor: colors.card,
        borderRadius: 16,
        margin: 8,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        width: showFullWidth ? screenWidth - 32 : (screenWidth - 48) / 2,
        overflow: "hidden",
      },
      imageContainer: {
        position: "relative",
        height: 200,
        backgroundColor: colors.surface,
        marginBottom: 0,
      },
      productImage: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
      },
      wishlistButton: {
        position: "absolute",
        top: 12,
        right: 12,
        backgroundColor: colors.background,
        borderRadius: 20,
        width: 36,
        height: 36,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
        zIndex: 10,
      },
      conditionBadge: {
        position: "absolute",
        top: 12,
        left: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: colors.background,
      },
      conditionText: {
        fontSize: 10,
        fontWeight: "600",
        textTransform: "uppercase",
      },
      unavailableBadge: {
        position: "absolute",
        top: 12,
        left: 12,
        backgroundColor: colors.error,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
      },
      unavailableText: {
        color: colors.surface,
        fontSize: 10,
        fontWeight: "600",
        textTransform: "uppercase",
      },
      content: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        flex: 1,
        marginTop: 0,
        paddingTop: 0,
      },
      categoryText: {
        fontSize: 12,
        color: colors.textTertiary,
        fontWeight: "500",
        marginBottom: 4,
        marginTop: 12,
        textTransform: "uppercase",
      },
      productName: {
        fontSize: 14,
        fontWeight: "700",
        color: colors.text,
        marginBottom: 8,
        lineHeight: 20,
      },
      priceRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
      },
      price: {
        fontSize: 14,
        fontWeight: "800",
        color: colors.primary,
      },
      overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0, 0, 0, 0.3)",
        justifyContent: "center",
        alignItems: "center",
      },
      overlayText: {
        color: colors.surface,
        fontSize: 16,
        fontWeight: "700",
      },
      linkContainer: {
        flex: 1,
      },
    })
  );

  return (
    <Link href={`/product/${product.id}`} asChild>
      <TouchableOpacity
        style={styles.container}
        onPress={() => onPress?.(product)}
        activeOpacity={0.8}
      >
        <View style={styles.imageContainer}>
          <Image source={{ uri: product.image }} style={styles.productImage} />

          {!product.is_available && (
            <>
              <View style={styles.overlay}>
                <Text style={styles.overlayText}>SOLD OUT</Text>
              </View>
              <View style={styles.unavailableBadge}>
                <Text style={styles.unavailableText}>Unavailable</Text>
              </View>
            </>
          )}

          {product.is_available && (
            <View style={styles.conditionBadge}>
              <Text
                style={[
                  styles.conditionText,
                  { color: getConditionColor(product.condition) },
                ]}
              >
                {product.condition}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.wishlistButton}
            onPress={handleWishlistToggle}
            activeOpacity={0.7}
          >
            <Text
              style={{
                fontSize: 18,
                color: isInWishlist(product.id)
                  ? colors.error
                  : colors.textSecondary,
              }}
            >
              {isInWishlist(product.id) ? "❤️" : "🤍"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {product.category_name && (
            <Text style={styles.categoryText}>{product.category_name}</Text>
          )}

          <Text style={styles.productName} numberOfLines={2}>
            {product.name}
          </Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(product.price)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Link>
  );
};

export default ProductCard;
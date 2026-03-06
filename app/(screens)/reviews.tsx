import {
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { API_URL } from '@/constants/api';
import { useThemes, AppColors } from '@/hooks/themes';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import React, { useCallback, useEffect, useState } from 'react';
import { Order } from '@/types/order';
import { Product } from '@/types/product';
import CustomAlert from '@/components/CustomAlert';
import { FullScreenLoader, LoadingSpinner } from '@/components/LoadingSpinner';

// ─── Interfaces ─────────────────────────────────────────────────────────────
interface Review {
  id: number;
  rating: number;
  comment: string;
  product: Product;
  created_at: string;
}

interface ReviewModalData {
  visible: boolean;
  product: Product | null;
  existingReview: Review | null;
}

interface ProductAwaitingReview {
  id: number;
  name: string;
  price: string;
  image: string;
  category_name?: string;
}

interface AlertState {
  visible: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  onConfirm?: () => void;
  confirmText?: string;
  showCancel?: boolean;
}

interface HeaderProps {
  title: string;
  onBackPress: () => void;
  colors: AppColors;
}

// ─── Header ──────────────────────────────────────────────────────────────────
const Header: React.FC<HeaderProps> = ({ title, onBackPress, colors }) => {
  const styles = makeStyles(colors);
  return (
    <View style={styles.headerContainer}>
      <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
        <Ionicons name="arrow-back" size={22} color={colors.text} />
      </TouchableOpacity>
      <View style={styles.headerCenter}>
        <Text style={styles.headerEyebrow}>IDEAL FURNITURE</Text>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
      <View style={styles.headerSpacer} />
    </View>
  );
};

// ─── Component ───────────────────────────────────────────────────────────────
const Reviews: React.FC = () => {
  const { colors } = useThemes();
  const navigation = useNavigation();

  const [deliveredOrders, setDeliveredOrders] = useState<Order[]>([]);
  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reviewModal, setReviewModal] = useState<ReviewModalData>({
    visible: false,
    product: null,
    existingReview: null,
  });
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [alert, setAlert] = useState<AlertState>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const styles = makeStyles(colors);

  const showAlert = useCallback((
    type: AlertState['type'],
    title: string,
    message: string,
    onConfirm?: () => void,
    confirmText?: string,
    showCancel?: boolean
  ) => {
    setAlert({ visible: true, type, title, message, onConfirm, confirmText, showCancel });
  }, []);

  const hideAlert = () => setAlert(prev => ({ ...prev, visible: false }));

  const getAuthToken = async (): Promise<string | null> => {
    try { return await SecureStore.getItemAsync('access_token'); }
    catch { return null; }
  };

  const fetchDeliveredOrders = useCallback(async () => {
    try {
      const token = await getAuthToken();
      if (!token) { showAlert('error', 'Error', 'Authentication token not found'); return; }
      const response = await fetch(`${API_URL}/orders/orders/`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const orders = await response.json();
        setDeliveredOrders(orders.filter((order: Order) => order.status === 'DELIVERED'));
      } else throw new Error('Failed to fetch orders');
    } catch (error) {
      showAlert('error', 'Error', 'Failed to load delivered orders');
      if (error instanceof Error) throw error;
    }
  }, [showAlert]);

  const fetchUserReviews = useCallback(async () => {
    try {
      const token = await getAuthToken();
      if (!token) return;
      const response = await fetch(`${API_URL}/products/products/user-reviews/`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (response.ok) setUserReviews(await response.json());
    } catch (error) {
      if (error instanceof Error) throw error;
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchDeliveredOrders(), fetchUserReviews()]);
    setLoading(false);
  }, [fetchDeliveredOrders, fetchUserReviews]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  useEffect(() => { loadData(); }, [loadData]);

  const getProductsAwaitingReview = (): ProductAwaitingReview[] => {
    const reviewedProductIds = userReviews.map(review => review.product.id);
    const products: ProductAwaitingReview[] = [];
    deliveredOrders.forEach(order => {
      order.items.forEach(item => {
        if (!reviewedProductIds.includes(item.product)) {
          const exists = products.find(p => p.id === item.product);
          if (!exists) products.push({ id: item.product, name: item.product_name, price: item.product_price, image: item.product_image, category_name: undefined });
        }
      });
    });
    return products;
  };

  const openReviewModal = (product: Product | ProductAwaitingReview, existingReview: Review | null = null) => {
    const productForModal: Product = 'primary_material' in product ? product as Product : {
      id: product.id, name: product.name, price: product.price, image: product.image,
      category_name: product.category_name, stock: 0, primary_material: 'WOOD' as const,
      condition: 'NEW' as const, is_available: true, created_at: new Date().toISOString(),
    };
    setReviewModal({ visible: true, product: productForModal, existingReview });
    if (existingReview) { setRating(existingReview.rating); setComment(existingReview.comment); }
    else { setRating(0); setComment(''); }
  };

  const closeReviewModal = () => {
    setReviewModal({ visible: false, product: null, existingReview: null });
    setRating(0);
    setComment('');
  };

  const submitReview = async () => {
    if (!reviewModal.product || rating === 0) { showAlert('error', 'Error', 'Please provide a rating'); return; }
    if (comment.trim().length === 0) { showAlert('error', 'Error', 'Please provide a comment'); return; }
    setSubmitting(true);
    try {
      const token = await getAuthToken();
      if (!token) { showAlert('error', 'Error', 'Authentication token not found'); setSubmitting(false); return; }
      const isUpdate = reviewModal.existingReview !== null;
      const url = isUpdate
        ? `${API_URL}/products/products/${reviewModal.product.id}/reviews/${reviewModal.existingReview?.id}/`
        : `${API_URL}/products/products/${reviewModal.product.id}/reviews/`;
      const response = await fetch(url, {
        method: isUpdate ? 'PUT' : 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment: comment.trim() }),
      });
      if (response.ok) {
        showAlert('success', 'Success', isUpdate ? 'Review updated successfully!' : 'Review submitted successfully!');
        closeReviewModal();
        await fetchUserReviews();
      } else {
        const errorData = await response.json();
        showAlert('error', 'Error', errorData.message || 'Failed to submit review');
      }
    } catch (error) {
      showAlert('error', 'Error', 'Failed to submit review');
      if (error instanceof Error) throw error;
    } finally {
      setSubmitting(false);
    }
  };

  const deleteReview = async (reviewId: number) => {
    showAlert('warning', 'Delete Review', 'Are you sure you want to delete this review?',
      async () => {
        try {
          const token = await getAuthToken();
          if (!token) return;
          const review = userReviews.find(r => r.id === reviewId);
          if (!review) return;
          const response = await fetch(`${API_URL}/products/products/${review.product.id}/reviews/${reviewId}/`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (response.ok) { showAlert('success', 'Success', 'Review deleted successfully'); await fetchUserReviews(); }
          else showAlert('error', 'Error', 'Failed to delete review');
        } catch (error) {
          showAlert('error', 'Error', 'Failed to delete review');
          if (error instanceof Error) throw error;
        }
      }, 'Delete', true
    );
  };

  const renderStars = (currentRating: number, onPress?: (rating: number) => void) => (
    <View style={styles.starsContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => onPress && onPress(star)} disabled={!onPress} testID={`star-rating-${star}`}>
          <Ionicons
            name={star <= currentRating ? 'star' : 'star-outline'}
            size={onPress ? 28 : 18}
            color={star <= currentRating ? colors.primary : colors.textTertiary}
            style={styles.star}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderProductCard = (product: ProductAwaitingReview, onReviewPress: () => void) => (
    <View key={product.id} style={styles.productCard}>
      <View style={styles.cardAccentLine} />
      <View style={styles.productCardInner}>
        <View style={styles.productImageWrapper}>
          <Image source={{ uri: product.image }} style={styles.productImage} />
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
          {product.category_name && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{product.category_name}</Text>
            </View>
          )}
          <Text style={styles.productPrice}>
            {`KSh ${(Math.round(parseFloat(product.price)) || 0).toLocaleString()}`}
          </Text>
          <TouchableOpacity style={styles.reviewButton} onPress={onReviewPress} testID={`write-review-button-${product.id}`}>
            <Ionicons name="create-outline" size={14} color={colors.primaryText} />
            <Text style={styles.reviewButtonText}>Write Review</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderReviewCard = (review: Review) => (
    <View key={review.id} style={styles.reviewCard}>
      <View style={styles.cardAccentLine} />
      <View style={styles.reviewHeader}>
        <View style={styles.reviewImageWrapper}>
          <Image source={{ uri: review.product.image }} style={styles.reviewProductImage} />
        </View>
        <View style={styles.reviewProductInfo}>
          <Text style={styles.reviewProductName} numberOfLines={2}>{review.product.name}</Text>
          <View style={styles.reviewDateRow}>
            <Ionicons name="calendar-outline" size={11} color={colors.textTertiary} />
            <Text style={styles.reviewDate}>{new Date(review.created_at).toLocaleDateString()}</Text>
          </View>
        </View>
      </View>
      {renderStars(review.rating)}
      <Text style={styles.reviewComment}>{review.comment}</Text>
      <View style={styles.reviewDivider} />
      <View style={styles.reviewActions}>
        <TouchableOpacity style={styles.editButton} onPress={() => openReviewModal(review.product, review)}>
          <Ionicons name="pencil" size={14} color={colors.primary} />
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={() => deleteReview(review.id)} testID={`delete-review-button-${review.id}`}>
          <Ionicons name="trash" size={14} color={colors.error} />
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) return <FullScreenLoader message="Loading reviews..." />;

  const productsAwaitingReview = getProductsAwaitingReview();

  return (
    <View style={styles.container}>
      <Header title="Reviews & Ratings" onBackPress={() => navigation.goBack()} colors={colors} />

      {/* ── Tabs ── */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
          onPress={() => setActiveTab('pending')}
        >
          {activeTab === 'pending' && <View style={styles.tabActivePill} />}
          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
            Pending Reviews ({productsAwaitingReview.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
          onPress={() => setActiveTab('completed')}
        >
          {activeTab === 'completed' && <View style={styles.tabActivePill} />}
          <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
            My Reviews ({userReviews.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {activeTab === 'pending' ? (
          <View style={styles.content}>
            {productsAwaitingReview.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconRing}>
                  <View style={styles.emptyIconInner}>
                    <Ionicons name="star-outline" size={30} color={colors.primary} />
                  </View>
                </View>
                <Text style={styles.emptyEyebrow}>Pending Reviews</Text>
                <Text style={styles.emptyStateText}>No products to review</Text>
                <Text style={styles.emptyStateSubtext}>Products from delivered orders will appear here</Text>
              </View>
            ) : (
              productsAwaitingReview.map((product) => renderProductCard(product, () => openReviewModal(product)))
            )}
          </View>
        ) : (
          <View style={styles.content}>
            {userReviews.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconRing}>
                  <View style={styles.emptyIconInner}>
                    <Ionicons name="chatbubble-outline" size={30} color={colors.primary} />
                  </View>
                </View>
                <Text style={styles.emptyEyebrow}>My Reviews</Text>
                <Text style={styles.emptyStateText}>No reviews yet</Text>
                <Text style={styles.emptyStateSubtext}>Your product reviews will appear here</Text>
              </View>
            ) : (
              userReviews.map(renderReviewCard)
            )}
          </View>
        )}
      </ScrollView>

      {/* ── Review Modal ── */}
      <Modal
        visible={reviewModal.visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeReviewModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalAccentLine} />
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeReviewModal} style={styles.modalCancelBtn}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <View style={styles.modalTitleGroup}>
              <Text style={styles.modalEyebrow}>
                {reviewModal.existingReview ? 'Update' : 'New Review'}
              </Text>
              <Text style={styles.modalTitle}>
                {reviewModal.existingReview ? 'Edit Review' : 'Write Review'}
              </Text>
            </View>
            <TouchableOpacity onPress={submitReview} disabled={submitting} style={styles.modalSubmitBtn}>
              <Text style={[styles.submitButton, submitting && styles.disabledButton]}>
                {submitting ? 'Saving...' : 'Submit'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {reviewModal.product && (
              <View style={styles.modalProductInfo}>
                <View style={styles.modalProductImageWrapper}>
                  <Image source={{ uri: reviewModal.product.image }} style={styles.modalProductImage} />
                </View>
                <Text style={styles.modalProductName}>{reviewModal.product.name}</Text>
              </View>
            )}

            <View style={styles.ratingSection}>
              <Text style={styles.ratingLabel}>Rating *</Text>
              {renderStars(rating, setRating)}
              {rating > 0 && (
                <Text style={styles.ratingHint}>
                  {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
                </Text>
              )}
            </View>

            <View style={styles.commentSection}>
              <Text style={styles.commentLabel}>Comment *</Text>
              <TextInput
                style={styles.commentInput}
                multiline
                numberOfLines={6}
                placeholder="Share your experience with this product..."
                placeholderTextColor={colors.textTertiary}
                value={comment}
                onChangeText={setComment}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>
        </View>
      </Modal>

      {submitting && <LoadingSpinner message="Submitting review..." />}

      <CustomAlert
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onClose={hideAlert}
        onConfirm={alert.onConfirm}
        confirmText={alert.confirmText}
        showCancel={alert.showCancel}
      />
    </View>
  );
};

// ─── Dynamic Styles ──────────────────────────────────────────────────────────
const makeStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    // ── Header ─────────────────────────────────────────────────────────────
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 50,
      paddingBottom: 14,
      backgroundColor: colors.stickyBackground,
      borderBottomWidth: 1,
      borderBottomColor: colors.primaryBorder,
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
      fontSize: 17,
      fontWeight: '700',
      color: colors.text,
      letterSpacing: 0.3,
    },
    headerSpacer: { width: 40 },

    // ── Tabs ───────────────────────────────────────────────────────────────
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: colors.stickyBackground,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tab: {
      flex: 1,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    activeTab: {},
    tabActivePill: {
      position: 'absolute',
      bottom: 0,
      left: '10%',
      right: '10%',
      height: 2,
      backgroundColor: colors.primary,
      borderRadius: 2,
    },
    tabText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textTertiary,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    activeTabText: {
      color: colors.primary,
    },

    // ── Scroll ─────────────────────────────────────────────────────────────
    scrollView: { flex: 1 },
    content: { padding: 16, gap: 12 },

    // ── Empty state ─────────────────────────────────────────────────────────
    emptyState: {
      alignItems: 'center',
      paddingVertical: 56,
      gap: 10,
    },
    emptyIconRing: {
      width: 96,
      height: 96,
      borderRadius: 48,
      borderWidth: 1,
      borderColor: colors.primaryDim,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    emptyIconInner: {
      width: 70,
      height: 70,
      borderRadius: 35,
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
    emptyStateText: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.text,
    },
    emptyStateSubtext: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },

    // ── Card shared ─────────────────────────────────────────────────────────
    cardAccentLine: {
      height: 2,
      backgroundColor: colors.primary,
      opacity: 0.55,
    },

    // ── Product card ────────────────────────────────────────────────────────
    productCard: {
      backgroundColor: colors.surface,
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
    productCardInner: {
      flexDirection: 'row',
      padding: 16,
    },
    productImageWrapper: {
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
    productInfo: {
      flex: 1,
      marginLeft: 14,
      gap: 6,
    },
    productName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      lineHeight: 21,
    },
    categoryBadge: {
      alignSelf: 'flex-start',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    categoryBadgeText: {
      fontSize: 11,
      color: colors.textSecondary,
      letterSpacing: 0.3,
    },
    productPrice: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primary,
    },
    reviewButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      backgroundColor: colors.primary,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 8,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 4,
    },
    reviewButtonText: {
      color: colors.primaryText,
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 0.3,
    },

    // ── Review card ─────────────────────────────────────────────────────────
    reviewCard: {
      backgroundColor: colors.surface,
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
    reviewHeader: {
      flexDirection: 'row',
      padding: 16,
      paddingBottom: 12,
    },
    reviewImageWrapper: {
      borderRadius: 10,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.primaryBorder,
    },
    reviewProductImage: {
      width: 60,
      height: 60,
      backgroundColor: colors.card,
    },
    reviewProductInfo: {
      flex: 1,
      marginLeft: 12,
      justifyContent: 'center',
      gap: 5,
    },
    reviewProductName: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    reviewDateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    reviewDate: {
      fontSize: 12,
      color: colors.textTertiary,
    },
    starsContainer: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingBottom: 10,
    },
    star: { marginRight: 2 },
    reviewComment: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 22,
      paddingHorizontal: 16,
      paddingBottom: 14,
    },
    reviewDivider: {
      height: 1,
      backgroundColor: colors.divider,
      marginHorizontal: 16,
    },
    reviewActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      paddingHorizontal: 12,
      paddingVertical: 10,
      gap: 4,
    },
    editButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.primaryBorder,
      backgroundColor: colors.primaryDim,
    },
    editButtonText: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: '600',
    },
    deleteButton: {
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
    deleteButtonText: {
      color: colors.error,
      fontSize: 13,
      fontWeight: '600',
    },

    // ── Modal ───────────────────────────────────────────────────────────────
    modalContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    modalAccentLine: {
      height: 2,
      backgroundColor: colors.primary,
      opacity: 0.6,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 16,
      paddingTop: 50,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalCancelBtn: {
      paddingHorizontal: 4,
      paddingVertical: 4,
    },
    cancelButton: {
      color: colors.textSecondary,
      fontSize: 15,
    },
    modalTitleGroup: {
      alignItems: 'center',
    },
    modalEyebrow: {
      fontSize: 9,
      letterSpacing: 2.5,
      textTransform: 'uppercase',
      color: colors.primary,
      fontWeight: '600',
      marginBottom: 2,
    },
    modalTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.text,
    },
    modalSubmitBtn: {
      paddingHorizontal: 4,
      paddingVertical: 4,
    },
    submitButton: {
      color: colors.primary,
      fontSize: 15,
      fontWeight: '700',
    },
    disabledButton: {
      color: colors.textTertiary,
    },
    modalContent: {
      flex: 1,
      padding: 20,
    },
    modalProductInfo: {
      alignItems: 'center',
      marginBottom: 28,
      paddingBottom: 24,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalProductImageWrapper: {
      borderRadius: 14,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.primaryBorder,
      marginBottom: 14,
    },
    modalProductImage: {
      width: 100,
      height: 100,
      backgroundColor: colors.card,
    },
    modalProductName: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
    },
    ratingSection: {
      marginBottom: 24,
    },
    ratingLabel: {
      fontSize: 11,
      letterSpacing: 2,
      textTransform: 'uppercase',
      color: colors.textSecondary,
      fontWeight: '600',
      marginBottom: 12,
    },
    ratingHint: {
      fontSize: 13,
      color: colors.primary,
      marginTop: 8,
      fontWeight: '600',
      letterSpacing: 0.5,
    },
    commentSection: {
      marginBottom: 24,
    },
    commentLabel: {
      fontSize: 11,
      letterSpacing: 2,
      textTransform: 'uppercase',
      color: colors.textSecondary,
      fontWeight: '600',
      marginBottom: 12,
    },
    commentInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 14,
      fontSize: 15,
      minHeight: 130,
      color: colors.text,
      backgroundColor: colors.card,
      lineHeight: 22,
    },
  });

export default Reviews;
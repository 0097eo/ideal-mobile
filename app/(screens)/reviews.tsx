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
import { useThemes } from '@/hooks/themes';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import React, { useCallback, useEffect, useState } from 'react';
import { Order } from '@/types/order';
import { Product } from '@/types/product';
import CustomAlert from '@/components/CustomAlert';
import { FullScreenLoader, LoadingSpinner } from '@/components/LoadingSpinner';

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
}

const Header: React.FC<HeaderProps> = ({ title, onBackPress }) => {
  const { colors } = useThemes();
  const styles = useStyles(colors);

  return (
    <View style={[styles.headerContainer, { backgroundColor: colors.navigationBackground }]}>
      <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={colors.navigationText} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: colors.navigationText }]}>{title}</Text>
      <View style={styles.headerPlaceholder} />
    </View>
  );
};

const Reviews: React.FC = () => {
  const { colors } = useThemes();
  const styles = useStyles(colors);
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

  const showAlert = useCallback(
    (
      type: AlertState['type'],
      title: string,
      message: string,
      onConfirm?: () => void,
      confirmText?: string,
      showCancel?: boolean
    ) => {
      setAlert({
        visible: true,
        type,
        title,
        message,
        onConfirm,
        confirmText,
        showCancel,
      });
    },
    []
  );

  const hideAlert = () => {
    setAlert(prev => ({ ...prev, visible: false }));
  };

  const getAuthToken = async (): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync('access_token');
    } catch {
      return null;
    }
  };

  const fetchDeliveredOrders = useCallback(async () => {
    try {
      const token = await getAuthToken();
      if (!token) {
        showAlert('error', 'Error', 'Authentication token not found');
        return;
      }

      const response = await fetch(`${API_URL}/orders/orders/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const orders = await response.json();
        const delivered = orders.filter((order: Order) => order.status === 'DELIVERED');
        setDeliveredOrders(delivered);
      } else {
        throw new Error('Failed to fetch orders');
      }
    } catch (error) {
      showAlert('error', 'Error', 'Failed to load delivered orders');
      throw error
    }
  }, [showAlert]);

  const fetchUserReviews = useCallback(async () => {
    try {
      const token = await getAuthToken();
      if (!token) return;

      const response = await fetch(`${API_URL}/products/products/user-reviews/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const reviews = await response.json();
        setUserReviews(reviews);
      }
    } catch (error) {
      throw error
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

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getProductsAwaitingReview = (): ProductAwaitingReview[] => {
    const reviewedProductIds = userReviews.map(review => review.product.id);
    const products: ProductAwaitingReview[] = [];
    
    deliveredOrders.forEach(order => {
      order.items.forEach(item => {
        if (!reviewedProductIds.includes(item.product)) {
          const exists = products.find(p => p.id === item.product);
          if (!exists) {
            products.push({
              id: item.product,
              name: item.product_name,
              price: item.product_price,
              image: item.product_image,
              category_name: undefined, 
            });
          }
        }
      });
    });
    
    return products;
  };

  const openReviewModal = (product: Product | ProductAwaitingReview, existingReview: Review | null = null) => {
    const productForModal: Product = 'primary_material' in product ? product as Product : {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      category_name: product.category_name,
      stock: 0,
      primary_material: 'WOOD' as const,
      condition: 'NEW' as const,
      is_available: true,
      created_at: new Date().toISOString(),
    };

    setReviewModal({
      visible: true,
      product: productForModal,
      existingReview,
    });
    
    if (existingReview) {
      setRating(existingReview.rating);
      setComment(existingReview.comment);
    } else {
      setRating(0);
      setComment('');
    }
  };

  const closeReviewModal = () => {
    setReviewModal({
      visible: false,
      product: null,
      existingReview: null,
    });
    setRating(0);
    setComment('');
  };

  const submitReview = async () => {
    if (!reviewModal.product || rating === 0) {
      showAlert('error', 'Error', 'Please provide a rating');
      return;
    }

    if (comment.trim().length === 0) {
      showAlert('error', 'Error', 'Please provide a comment');
      return;
    }

    setSubmitting(true);

    try {
      const token = await getAuthToken();
      if (!token) {
        showAlert('error', 'Error', 'Authentication token not found');
        return;
      }

      const isUpdate = reviewModal.existingReview !== null;
      const url = isUpdate 
        ? `${API_URL}/products/products/${reviewModal.product.id}/reviews/${reviewModal.existingReview?.id}/`
        : `${API_URL}/products/products/${reviewModal.product.id}/reviews/`;
      
      const method = isUpdate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating,
          comment: comment.trim(),
        }),
      });

      if (response.ok) {
        showAlert(
          'success',
          'Success',
          isUpdate ? 'Review updated successfully!' : 'Review submitted successfully!'
        );
        closeReviewModal();
        await fetchUserReviews(); 
      } else {
        const errorData = await response.json();
        showAlert('error', 'Error', errorData.message || 'Failed to submit review');
      }
    } catch (error) {
      showAlert('error', 'Error', 'Failed to submit review');
      throw error
    } finally {
      setSubmitting(false);
    }
  };

  const deleteReview = async (reviewId: number) => {
    showAlert(
      'warning',
      'Delete Review',
      'Are you sure you want to delete this review?',
      async () => {
        try {
          const token = await getAuthToken();
          if (!token) return;

          const review = userReviews.find(r => r.id === reviewId);
          if (!review) return;

          const response = await fetch(
            `${API_URL}/products/products/${review.product.id}/reviews/${reviewId}/`,
            {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            }
          );

          if (response.ok) {
            showAlert('success', 'Success', 'Review deleted successfully');
            await fetchUserReviews();
          } else {
            showAlert('error', 'Error', 'Failed to delete review');
          }
        } catch (error) {
          showAlert('error', 'Error', 'Failed to delete review');
          throw error
        }
      },
      'Delete',
      true
    );
  };

  const renderStars = (currentRating: number, onPress?: (rating: number) => void) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onPress && onPress(star)}
            disabled={!onPress}
          >
            <Ionicons
              name={star <= currentRating ? 'star' : 'star-outline'}
              size={24}
              color={star <= currentRating ? colors.primary : colors.divider}
              style={styles.star}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderProductCard = (product: ProductAwaitingReview, onReviewPress: () => void) => (
    <View key={product.id} style={styles.productCard}>
      <Image
        source={{ uri: product.image }}
        style={styles.productImage}
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>
        {product.category_name && (
          <Text style={styles.productCategory}>{product.category_name}</Text>
        )}
        <Text style={styles.productPrice}>
          {`KSh ${(Math.round(parseFloat(product.price)) || 0).toLocaleString()}`}
        </Text>
        <TouchableOpacity style={styles.reviewButton} onPress={onReviewPress}>
          <Text style={styles.reviewButtonText}>Write Review</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderReviewCard = (review: Review) => (
    <View key={review.id} style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Image
          source={{ uri: review.product.image }}
          style={styles.reviewProductImage}
        />
        <View style={styles.reviewProductInfo}>
          <Text style={styles.reviewProductName} numberOfLines={2}>
            {review.product.name}
          </Text>
          <Text style={styles.reviewDate}>
            {new Date(review.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
      
      {renderStars(review.rating)}
      
      <Text style={styles.reviewComment}>{review.comment}</Text>
      
      <View style={styles.reviewActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => openReviewModal(review.product, review)}
        >
          <Ionicons name="pencil" size={16} color={colors.primary} />
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteReview(review.id)}
        >
          <Ionicons name="trash" size={16} color={colors.error} />
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return <FullScreenLoader message="Loading reviews..." />;
  }

  const productsAwaitingReview = getProductsAwaitingReview();

  return (
    <View style={styles.container}>
      <Header title="Reviews & Ratings" onBackPress={() => navigation.goBack()} />

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
            Pending Reviews ({productsAwaitingReview.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
          onPress={() => setActiveTab('completed')}
        >
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
                <Ionicons name="star-outline" size={64} color={colors.textTertiary} />
                <Text style={styles.emptyStateText}>No products to review</Text>
                <Text style={styles.emptyStateSubtext}>
                  Products from delivered orders will appear here
                </Text>
              </View>
            ) : (
              productsAwaitingReview.map((product) =>
                renderProductCard(product, () => openReviewModal(product))
              )
            )}
          </View>
        ) : (
          <View style={styles.content}>
            {userReviews.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="chatbubble-outline" size={64} color={colors.textTertiary} />
                <Text style={styles.emptyStateText}>No reviews yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Your product reviews will appear here
                </Text>
              </View>
            ) : (
              userReviews.map(renderReviewCard)
            )}
          </View>
        )}
      </ScrollView>

      {/* Review Modal */}
      <Modal
        visible={reviewModal.visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeReviewModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeReviewModal}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {reviewModal.existingReview ? 'Edit Review' : 'Write Review'}
            </Text>
            <TouchableOpacity onPress={submitReview} disabled={submitting}>
              <Text style={[styles.submitButton, submitting && styles.disabledButton]}>
                {submitting ? 'Saving...' : 'Submit'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {reviewModal.product && (
              <View style={styles.modalProductInfo}>
                <Image
                  source={{ uri: reviewModal.product.image }}
                  style={styles.modalProductImage}
                />
                <Text style={styles.modalProductName}>
                  {reviewModal.product.name}
                </Text>
              </View>
            )}

            <Text style={styles.ratingLabel}>Rating *</Text>
            {renderStars(rating, setRating)}

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
          </ScrollView>
        </View>
      </Modal>

      {/* Loading Spinner */}
      {submitting && <LoadingSpinner message="Submitting review..." />}

      {/* Custom Alert */}
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

const useStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  headerPlaceholder: {
    width: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: colors.border,
  },
  productInfo: {
    flex: 1,
    marginLeft: 16,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 12,
  },
  reviewButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  reviewButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  reviewCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reviewHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  reviewProductImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: colors.border,
  },
  reviewProductInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  reviewProductName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  reviewDate: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  starsContainer: {
    flexDirection: 'row',
    marginVertical: 8,
  },
  star: {
    marginRight: 4,
  },
  reviewComment: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 16,
  },
  reviewActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 12,
  },
  editButtonText: {
    color: colors.primary,
    fontSize: 14,
    marginLeft: 4,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  deleteButtonText: {
    color: colors.error,
    fontSize: 14,
    marginLeft: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  cancelButton: {
    color: colors.primary,
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  submitButton: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    color: colors.textTertiary,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalProductInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalProductImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: colors.border,
    marginBottom: 12,
  },
  modalProductName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  commentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 24,
    marginBottom: 8,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
    color: colors.text,
    backgroundColor: colors.background,
  },
});

export default Reviews;
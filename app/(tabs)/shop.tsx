import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Modal,
  ScrollView,
} from 'react-native';
import React, {useState, useEffect, useCallback} from 'react'
import { useThemes } from '@/hooks/themes'
import ProductCard from '@/components/ProductCard'
import { Product, Category } from '@/types/product'
import { API_URL } from '@/constants/api'
import CustomAlert from '@/components/CustomAlert';
import { FullScreenLoader } from '@/components/LoadingSpinner';


interface ProductResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Product[];
}

interface FilterState {
  search: string;
  category: string;
  material: string;
  condition: string;
  minPrice: string;
  maxPrice: string;
  available: boolean | null;
  ordering: string;
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

const Shop = () => {
  const { colors, createStyles } = useThemes();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [categoriesLoading, setCategoriesLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [debouncedMinPrice, setDebouncedMinPrice] = useState('');
  const [debouncedMaxPrice, setDebouncedMaxPrice] = useState('');
  const [debouncedMaterial, setDebouncedMaterial] = useState('');
  const [debouncedCondition, setDebouncedCondition] = useState('');
  const [debouncedCategory, setDebouncedCategory] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState<boolean>(false);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('All Categories');
  
  // Alert state
  const [alert, setAlert] = useState<AlertState>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });
  
  // Filter states
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: '',
    material: '',
    condition: '',
    minPrice: '',
    maxPrice: '',
    available: null,
    ordering: '-created_at'
  });
  const [showFilters, setShowFilters] = useState<boolean>(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 500);

    return () => clearTimeout(handler);
  }, [filters.search]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedMinPrice(filters.minPrice);
    }, 500);

    return () => clearTimeout(handler);
  }, [filters.minPrice]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedMaxPrice(filters.maxPrice);
    }, 500);

    return () => clearTimeout(handler);
  }, [filters.maxPrice]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedMaterial(filters.material?.toUpperCase() || '');
    }, 500);
    return () => clearTimeout(handler);
  }, [filters.material]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedCondition(filters.condition?.toUpperCase() || '');
    }, 500);
    return () => clearTimeout(handler);
  }, [filters.condition]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedCategory(filters.category || '');
    }, 500);
    return () => clearTimeout(handler);
  }, [filters.category]);

  

  // Show alert helper function
  const showAlert = useCallback((
    type: 'success' | 'error' | 'warning' | 'info',
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
  }, [setAlert]);

  // Hide alert
  const hideAlert = () => {
    setAlert(prev => ({ ...prev, visible: false }));
  };

  // Fetch categories from API
  const fetchCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true);
      const response = await fetch(`${API_URL}/products/categories/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.status}`);
      }

      const data: Category[] = await response.json();
      setCategories(data);
    } catch (err) {
      showAlert(
        'error',
        'Error',
        'Failed to load categories. Some filters may not be available.',
        undefined,
        'OK',
        false
      );
      throw err
    } finally {
      setCategoriesLoading(false);
    }
  }, [showAlert]);

  // Handle category selection
  const handleCategorySelect = (category: Category | null) => {
    if (category) {
      setFilters(prev => ({ ...prev, category: category.id.toString() }));
      setSelectedCategoryName(category.name);
    } else {
      setFilters(prev => ({ ...prev, category: '' }));
      setSelectedCategoryName('All Categories');
    }
    setShowCategoryDropdown(false);
  };

  // Build query parameters from filters
  const buildQueryParams = useCallback((additionalParams: Record<string, any> = {}) => {
    const params = new URLSearchParams();

    if (debouncedSearch) params.append('search', debouncedSearch);
    if (debouncedCategory) params.append('category', debouncedCategory);
    if (debouncedMaterial) params.append('material', debouncedMaterial);
    if (debouncedCondition) params.append('condition', debouncedCondition);
    if (debouncedMinPrice) params.append('min_price', debouncedMinPrice);
    if (debouncedMaxPrice) params.append('max_price', debouncedMaxPrice);
    if (filters.available !== null) params.append('available', filters.available.toString());
    if (filters.ordering) params.append('ordering', filters.ordering);

    Object.entries(additionalParams).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        params.append(key, value.toString());
      }
    });

    return params.toString();
  }, [
    debouncedSearch,
    debouncedCategory,
    debouncedMaterial,
    debouncedCondition,
    debouncedMinPrice,
    debouncedMaxPrice,
    filters.available,
    filters.ordering
  ]);

  // Fetch products from API
  const fetchProducts = useCallback(async (isLoadMore: boolean = false, customUrl?: string) => {
    try {
      if (!isLoadMore) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      let url = customUrl;
      if (!url) {
        const queryParams = buildQueryParams();
        url = `${API_URL}/products/products/${queryParams ? `?${queryParams}` : ''}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ProductResponse = await response.json();
      
      if (isLoadMore) {
        setProducts(prevProducts => [...prevProducts, ...data.results]);
      } else {
        setProducts(data.results);
      }
      
      setHasNextPage(!!data.next);
      setNextPageUrl(data.next);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch products';
      setError(errorMessage);
      
      // Show custom alert for error
      showAlert(
        'error',
        'Network Error',
        'Failed to load products. Please check your internet connection and try again.',
        () => fetchProducts(), // Retry function
        'Retry',
        true // Show cancel button
      );
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [buildQueryParams, showAlert]);

  // Handle search
  const handleSearch = useCallback(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Handle load more
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !loadingMore && nextPageUrl) {
      fetchProducts(true, nextPageUrl);
    }
  }, [hasNextPage, loadingMore, nextPageUrl, fetchProducts]);

  // Handle refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProducts();
  }, [fetchProducts]);

  // Reset filters
  const resetFilters = () => {
    showAlert(
      'warning',
      'Reset Filters',
      'Are you sure you want to reset all filters?',
      () => {
        setFilters({
          search: '',
          category: '',
          material: '',
          condition: '',
          minPrice: '',
          maxPrice: '',
          available: null,
          ordering: '-created_at'
        });
        setSelectedCategoryName('All Categories');
        showAlert('success', 'Filters Reset', 'All filters have been cleared successfully.');
      },
      'Reset',
      true
    );
  };

  // Initial load
  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [fetchCategories, fetchProducts]);

  // Search when filters change
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const styles = createStyles((colors) => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      padding: 30,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 16,
      backgroundColor: colors.card,
      borderRadius: 12,
      paddingHorizontal: 12,
    },
    searchInput: {
      flex: 1,
      height: 48,
      fontSize: 16,
      color: colors.text,
    },
    filterButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      marginLeft: 8,
    },
    filterButtonText: {
      color: colors.surface,
      fontWeight: '600',
    },
    filtersContainer: {
      padding: 16,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    filterRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    filterInput: {
      flex: 1,
      height: 40,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      marginHorizontal: 4,
      color: colors.text,
      backgroundColor: colors.background,
    },
    categoryDropdown: {
      flex: 1,
      height: 40,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      marginHorizontal: 4,
      backgroundColor: colors.background,
      justifyContent: 'center',
    },
    categoryDropdownText: {
      color: colors.text,
      fontSize: 16,
    },
    categoryDropdownPlaceholder: {
      color: colors.textSecondary,
      fontSize: 16,
    },
    resetButton: {
      backgroundColor: colors.error,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      alignSelf: 'flex-end',
    },
    resetButtonText: {
      color: colors.surface,
      fontWeight: '600',
    },
    productsList: {
      flex: 1,
    },
    productsContainer: {
      padding: 8,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    errorText: {
      fontSize: 16,
      color: colors.error,
      textAlign: 'center',
      marginBottom: 16,
    },
    retryButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
    },
    retryButtonText: {
      color: colors.surface,
      fontWeight: '600',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    emptyText: {
      fontSize: 18,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    loadMoreContainer: {
      padding: 16,
      alignItems: 'center',
    },
    loadMoreText: {
      color: colors.textSecondary,
      fontSize: 14,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.surface,
      margin: 20,
      borderRadius: 12,
      padding: 20,
      maxHeight: '70%',
      width: '80%',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 16,
      textAlign: 'center',
    },
    categoryOption: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    categoryOptionText: {
      fontSize: 16,
      color: colors.text,
    },
    selectedCategoryOption: {
      backgroundColor: colors.primary + '20',
    },
    selectedCategoryOptionText: {
      color: colors.primary,
      fontWeight: '600',
    },
    modalCloseButton: {
      marginTop: 16,
      backgroundColor: colors.textSecondary,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
    },
    modalCloseButtonText: {
      color: colors.surface,
      fontWeight: '600',
    },
  }));

  // Render product item
  const renderProductItem = ({ item }: { item: Product }) => (
    <ProductCard
      product={item}
      showFullWidth={false}
    />
  );

  // Render footer for load more
  const renderFooter = () => {
    if (!hasNextPage) return null;
    
    return (
      <View style={styles.loadMoreContainer}>
        {loadingMore ? (
          <Text style={styles.loadMoreText}>Loading more products...</Text>
        ) : (
          <Text style={styles.loadMoreText}>Pull up to load more</Text>
        )}
      </View>
    );
  };

  const renderCategoryModal = () => (
    <Modal
      visible={showCategoryDropdown}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowCategoryDropdown(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Category</Text>
          <ScrollView>
            {/* All Categories option */}
            <TouchableOpacity
              style={[
                styles.categoryOption,
                !filters.category && styles.selectedCategoryOption
              ]}
              onPress={() => handleCategorySelect(null)}
            >
              <Text style={[
                styles.categoryOptionText,
                !filters.category && styles.selectedCategoryOptionText
              ]}>
                All Categories
              </Text>
            </TouchableOpacity>
            
            {/* Category options */}
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryOption,
                  filters.category === category.id.toString() && styles.selectedCategoryOption
                ]}
                onPress={() => handleCategorySelect(category)}
              >
                <Text style={[
                  styles.categoryOptionText,
                  filters.category === category.id.toString() && styles.selectedCategoryOptionText
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowCategoryDropdown(false)}
          >
            <Text style={styles.modalCloseButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Show full screen loader when initially loading
  if (loading && products.length === 0) {
    return (
      <View style={styles.container}>
        <FullScreenLoader 
          message="Loading products..." 
          color={colors.primary}
        />
      </View>
    );
  }

  // Show error state with custom alert instead of inline error
  if (error && products.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => fetchProducts()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor={colors.textSecondary}
            value={filters.search}
            onChangeText={(text) => setFilters(prev => ({ ...prev, search: text }))}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Text style={styles.filterButtonText}>Filters</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.filterRow}>
            <TextInput
              style={styles.filterInput}
              placeholder="Min Price"
              placeholderTextColor={colors.textSecondary}
              value={filters.minPrice}
              onChangeText={(text) => setFilters(prev => ({ ...prev, minPrice: text }))}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.filterInput}
              placeholder="Max Price"
              placeholderTextColor={colors.textSecondary}
              value={filters.maxPrice}
              onChangeText={(text) => setFilters(prev => ({ ...prev, maxPrice: text }))}
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.filterRow}>
            <TextInput
              style={styles.filterInput}
              placeholder="Material"
              placeholderTextColor={colors.textSecondary}
              value={filters.material}
              onChangeText={(text) => setFilters(prev => ({ ...prev, material: text }))}
            />
            <TextInput
              style={styles.filterInput}
              placeholder="Condition"
              placeholderTextColor={colors.textSecondary}
              value={filters.condition}
              onChangeText={(text) => setFilters(prev => ({ ...prev, condition: text }))}
            />
          </View>

          <View style={styles.filterRow}>
            {/* Category Dropdown */}
            <TouchableOpacity
              style={styles.categoryDropdown}
              onPress={() => setShowCategoryDropdown(true)}
              disabled={categoriesLoading}
            >
              <Text style={[
                styles.categoryDropdownText,
                !filters.category && styles.categoryDropdownPlaceholder
              ]}>
                {categoriesLoading ? 'Loading...' : selectedCategoryName}
              </Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
            <Text style={styles.resetButtonText}>Reset Filters</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Products List */}
      {products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No products found.{'\n'}Try adjusting your search or filters.
          </Text>
        </View>
      ) : (
        <FlatList
          style={styles.productsList}
          contentContainerStyle={styles.productsContainer}
          data={products}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Category Dropdown Modal */}
      {renderCategoryModal()}

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

export default Shop;
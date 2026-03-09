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
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useCallback } from 'react';
import { useThemes, AppColors } from '@/hooks/themes';
import ProductCard from '@/components/ProductCard';
import { Product, Category } from '@/types/product';
import { API_URL } from '@/constants/api';
import CustomAlert from '@/components/CustomAlert';
import { FullScreenLoader } from '@/components/LoadingSpinner';
import { Ionicons } from '@expo/vector-icons';

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
  const { colors } = useThemes();
  const styles = makeStyles(colors);

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

  const [alert, setAlert] = useState<AlertState>({
    visible: false, type: 'info', title: '', message: '',
  });

  const [filters, setFilters] = useState<FilterState>({
    search: '', category: '', material: '', condition: '',
    minPrice: '', maxPrice: '', available: null, ordering: '-created_at',
  });
  const [showFilters, setShowFilters] = useState<boolean>(false);

  useEffect(() => { const h = setTimeout(() => setDebouncedSearch(filters.search), 500);         return () => clearTimeout(h); }, [filters.search]);
  useEffect(() => { const h = setTimeout(() => setDebouncedMinPrice(filters.minPrice), 500);     return () => clearTimeout(h); }, [filters.minPrice]);
  useEffect(() => { const h = setTimeout(() => setDebouncedMaxPrice(filters.maxPrice), 500);     return () => clearTimeout(h); }, [filters.maxPrice]);
  useEffect(() => { const h = setTimeout(() => setDebouncedMaterial(filters.material?.toUpperCase() || ''), 500);   return () => clearTimeout(h); }, [filters.material]);
  useEffect(() => { const h = setTimeout(() => setDebouncedCondition(filters.condition?.toUpperCase() || ''), 500); return () => clearTimeout(h); }, [filters.condition]);
  useEffect(() => { const h = setTimeout(() => setDebouncedCategory(filters.category || ''), 500); return () => clearTimeout(h); }, [filters.category]);

  const showAlert = useCallback((
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string,
    onConfirm?: () => void,
    confirmText?: string,
    showCancel?: boolean
  ) => {
    setAlert({ visible: true, type, title, message, onConfirm, confirmText, showCancel });
  }, []);

  const hideAlert = () => setAlert(prev => ({ ...prev, visible: false }));

  const fetchCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true);
      const response = await fetch(`${API_URL}/products/categories/`, {
        method: 'GET', headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`Failed to fetch categories: ${response.status}`);
      setCategories(await response.json());
    } catch (err) {
      showAlert('error', 'Error', 'Failed to load categories. Some filters may not be available.', undefined, 'OK', false);
      throw err;
    } finally {
      setCategoriesLoading(false);
    }
  }, [showAlert]);

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

  const buildQueryParams = useCallback((additionalParams: Record<string, any> = {}) => {
    const params = new URLSearchParams();
    if (debouncedSearch)    params.append('search',    debouncedSearch);
    if (debouncedCategory)  params.append('category',  debouncedCategory);
    if (debouncedMaterial)  params.append('material',  debouncedMaterial);
    if (debouncedCondition) params.append('condition', debouncedCondition);
    if (debouncedMinPrice)  params.append('min_price', debouncedMinPrice);
    if (debouncedMaxPrice)  params.append('max_price', debouncedMaxPrice);
    if (filters.available !== null) params.append('available', filters.available.toString());
    if (filters.ordering)   params.append('ordering',  filters.ordering);
    Object.entries(additionalParams).forEach(([k, v]) => {
      if (v !== null && v !== undefined) params.append(k, v.toString());
    });
    return params.toString();
  }, [debouncedSearch, debouncedCategory, debouncedMaterial, debouncedCondition, debouncedMinPrice, debouncedMaxPrice, filters.available, filters.ordering]);

  const fetchProducts = useCallback(async (isLoadMore: boolean = false, customUrl?: string) => {
    try {
      if (!isLoadMore) { setLoading(true); setError(null); }
      else { setLoadingMore(true); }
      let url = customUrl;
      if (!url) {
        const queryParams = buildQueryParams();
        url = `${API_URL}/products/products/${queryParams ? `?${queryParams}` : ''}`;
      }
      const response = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data: ProductResponse = await response.json();
      if (isLoadMore) {
        setProducts(prev => [...prev, ...data.results]);
      } else {
        setProducts(data.results);
      }
      setHasNextPage(!!data.next);
      setNextPageUrl(data.next);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch products';
      setError(errorMessage);
      showAlert('error', 'Network Error', 'Failed to load products. Please check your internet connection and try again.', () => fetchProducts(), 'Retry', true);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [buildQueryParams, showAlert]);

  const handleSearch   = useCallback(() => { fetchProducts(); }, [fetchProducts]);
  const handleLoadMore = useCallback(() => { if (hasNextPage && !loadingMore && nextPageUrl) fetchProducts(true, nextPageUrl); }, [hasNextPage, loadingMore, nextPageUrl, fetchProducts]);
  const onRefresh      = useCallback(() => { setRefreshing(true); fetchProducts(); }, [fetchProducts]);

  const resetFilters = () => {
    showAlert('warning', 'Reset Filters', 'Are you sure you want to reset all filters?', () => {
      setFilters({ search: '', category: '', material: '', condition: '', minPrice: '', maxPrice: '', available: null, ordering: '-created_at' });
      setSelectedCategoryName('All Categories');
      showAlert('success', 'Filters Reset', 'All filters have been cleared successfully.');
    }, 'Reset', true);
  };

  useEffect(() => { fetchCategories(); fetchProducts(); }, [fetchCategories, fetchProducts]);
  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const activeFilterCount = [filters.category, filters.material, filters.condition, filters.minPrice, filters.maxPrice].filter(Boolean).length;

  // Pad to even number so last row always has 2 equal-width cards
  const paddedProducts = products.length % 2 !== 0
    ? [...products, null]
    : products;

  const renderProductItem = ({ item }: { item: Product | null }) => {
    if (!item) return <View style={styles.emptyCard} />;
    return <ProductCard product={item} showFullWidth={false} />;
  };

  const renderFooter = () => {
    if (!hasNextPage) return null;
    return (
      <View style={styles.loadMoreContainer}>
        <View style={styles.loadMoreInner}>
          <Ionicons
            name={loadingMore ? 'reload-outline' : 'chevron-down-outline'}
            size={14}
            color={loadingMore ? colors.primary : colors.textTertiary}
          />
          <Text style={styles.loadMoreText}>
            {loadingMore ? 'Loading more products…' : 'Pull up to load more'}
          </Text>
        </View>
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
          <View style={styles.modalAccentLine} />
          <View style={styles.modalHeader}>
            <View style={styles.modalEyebrowRow}>
              <Ionicons name="grid-outline" size={13} color={colors.primary} />
              <Text style={styles.modalEyebrow}>Browse By</Text>
            </View>
            <Text style={styles.modalTitle}>Select Category</Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.categoryOption, !filters.category && styles.selectedCategoryOption]}
              onPress={() => handleCategorySelect(null)}
            >
              {!filters.category && <View style={styles.categoryCheckDot} />}
              <Text style={[styles.categoryOptionText, !filters.category && styles.selectedCategoryOptionText]}>
                All Categories
              </Text>
            </TouchableOpacity>

            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[styles.categoryOption, filters.category === category.id.toString() && styles.selectedCategoryOption]}
                onPress={() => handleCategorySelect(category)}
              >
                {filters.category === category.id.toString() && <View style={styles.categoryCheckDot} />}
                <Text style={[styles.categoryOptionText, filters.category === category.id.toString() && styles.selectedCategoryOptionText]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowCategoryDropdown(false)}>
            <Text style={styles.modalCloseButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (loading && products.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <FullScreenLoader message="Loading products..." color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (error && products.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <View style={styles.errorIconRing}>
            <Ionicons name="wifi-outline" size={32} color={colors.error} />
          </View>
          <Text style={styles.errorEyebrow}>Connection Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchProducts()}>
            <Ionicons name="reload-outline" size={16} color={colors.primaryText} />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerEyebrow}>IDEAL FURNITURE</Text>
            <Text style={styles.title}>Shop</Text>
          </View>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{products.length}</Text>
            <Text style={styles.headerBadgeLabel}>items</Text>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={18} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor={colors.textTertiary}
            value={filters.search}
            onChangeText={(text) => setFilters(prev => ({ ...prev, search: text }))}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity
            style={[styles.filterButton, showFilters && styles.filterButtonActive]}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons name="options-outline" size={16} color={showFilters ? colors.primaryText : colors.primary} />
            <Text style={[styles.filterButtonText, showFilters && styles.filterButtonTextActive]}>Filters</Text>
            {activeFilterCount > 0 && (
              <View style={styles.filterCountBadge}>
                <Text style={styles.filterCountText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.filtersAccentLine} />
          <View style={styles.filtersEyebrowRow}>
            <Ionicons name="funnel-outline" size={12} color={colors.primary} />
            <Text style={styles.filtersEyebrow}>Refine Results</Text>
          </View>

          <View style={styles.filterRow}>
            <View style={styles.filterInputWrapper}>
              <Ionicons name="pricetag-outline" size={14} color={colors.textTertiary} style={styles.filterInputIcon} />
              <TextInput style={styles.filterInput} placeholder="Min Price" placeholderTextColor={colors.textTertiary} value={filters.minPrice} onChangeText={(text) => setFilters(prev => ({ ...prev, minPrice: text }))} keyboardType="numeric" />
            </View>
            <View style={styles.filterInputWrapper}>
              <Ionicons name="pricetag-outline" size={14} color={colors.textTertiary} style={styles.filterInputIcon} />
              <TextInput style={styles.filterInput} placeholder="Max Price" placeholderTextColor={colors.textTertiary} value={filters.maxPrice} onChangeText={(text) => setFilters(prev => ({ ...prev, maxPrice: text }))} keyboardType="numeric" />
            </View>
          </View>

          <View style={styles.filterRow}>
            <View style={styles.filterInputWrapper}>
              <Ionicons name="layers-outline" size={14} color={colors.textTertiary} style={styles.filterInputIcon} />
              <TextInput style={styles.filterInput} placeholder="Material" placeholderTextColor={colors.textTertiary} value={filters.material} onChangeText={(text) => setFilters(prev => ({ ...prev, material: text }))} />
            </View>
            <View style={styles.filterInputWrapper}>
              <Ionicons name="star-outline" size={14} color={colors.textTertiary} style={styles.filterInputIcon} />
              <TextInput style={styles.filterInput} placeholder="Condition" placeholderTextColor={colors.textTertiary} value={filters.condition} onChangeText={(text) => setFilters(prev => ({ ...prev, condition: text }))} />
            </View>
          </View>

          <View style={styles.filterRow}>
            <TouchableOpacity style={styles.categoryDropdown} onPress={() => setShowCategoryDropdown(true)} disabled={categoriesLoading}>
              <Ionicons name="grid-outline" size={14} color={colors.textTertiary} />
              <Text style={[styles.categoryDropdownText, !filters.category && styles.categoryDropdownPlaceholder]}>
                {categoriesLoading ? 'Loading…' : selectedCategoryName}
              </Text>
              <Ionicons name="chevron-down-outline" size={14} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
            <Ionicons name="refresh-outline" size={15} color={colors.error} />
            <Text style={styles.resetButtonText}>Reset Filters</Text>
          </TouchableOpacity>
        </View>
      )}

      {products.length > 0 && (
        <View style={styles.listHeader}>
          <View style={styles.listEyebrowRow}>
            <Ionicons name="cube-outline" size={13} color={colors.primary} />
            <Text style={styles.listEyebrow}>
              {filters.search || activeFilterCount > 0 ? 'Search Results' : 'All Products'}
            </Text>
          </View>
          <Text style={styles.listCount}>{products.length} found</Text>
        </View>
      )}

      {products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconRing}>
            <View style={styles.emptyIconInner}>
              <Ionicons name="search-outline" size={30} color={colors.primary} />
            </View>
          </View>
          <Text style={styles.emptyEyebrow}>No Results</Text>
          <Text style={styles.emptyText}>No products found.{'\n'}Try adjusting your search or filters.</Text>
        </View>
      ) : (
        <FlatList
          style={styles.productsList}
          contentContainerStyle={styles.productsContainer}
          data={paddedProducts}
          renderItem={renderProductItem}
          keyExtractor={(item, index) => item ? item.id.toString() : `empty-${index}`}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {renderCategoryModal()}

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
    </SafeAreaView>
  );
};

const makeStyles = (colors: AppColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: colors.stickyBackground,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.primary}33`,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  headerEyebrow: {
    fontSize: 9,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 0.3,
  },
  headerBadge: {
    alignItems: 'center',
    backgroundColor: colors.primaryDim,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },
  headerBadgeText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
    lineHeight: 22,
  },
  headerBadgeLabel: {
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.textSecondary,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 15,
    color: colors.text,
    letterSpacing: 0.2,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryDim,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    marginLeft: 8,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
    letterSpacing: 0.3,
  },
  filterButtonTextActive: {
    color: colors.primaryText,
  },
  filterCountBadge: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primaryText,
  },
  filtersContainer: {
    backgroundColor: colors.stickyBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 16,
    paddingBottom: 16,
    overflow: 'hidden',
  },
  filtersAccentLine: {
    height: 1,
    backgroundColor: colors.primary,
    opacity: 0.35,
    marginBottom: 14,
  },
  filtersEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  filtersEyebrow: {
    fontSize: 11,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: colors.primary,
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  filterInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 42,
  },
  filterInputIcon: { marginRight: 7 },
  filterInput: {
    flex: 1,
    height: 42,
    fontSize: 14,
    color: colors.text,
  },
  categoryDropdown: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
  },
  categoryDropdownText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  categoryDropdownPlaceholder: {
    color: colors.textTertiary,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    alignSelf: 'flex-end',
    backgroundColor: `${colors.error}14`,
    borderWidth: 1,
    borderColor: `${colors.error}40`,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  resetButtonText: {
    color: colors.error,
    fontWeight: '600',
    fontSize: 13,
    letterSpacing: 0.3,
  },
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
  productsList: { flex: 1 },
  productsContainer: {
    paddingTop: 8,
    paddingBottom: 32,
  },
  columnWrapper: {
    paddingHorizontal: 8,
  },
  emptyCard: {
    flex: 1,
    maxWidth: '50%',
    margin: 6,
  },
  loadMoreContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadMoreInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  loadMoreText: {
    color: colors.textSecondary,
    fontSize: 13,
    letterSpacing: 0.3,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
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
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  errorIconRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.error}14`,
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
    shadowOpacity: 0.30,
    shadowRadius: 10,
    elevation: 6,
  },
  retryButtonText: {
    color: colors.primaryText,
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.modalOverlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.surface,
    margin: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    overflow: 'hidden',
    maxHeight: '70%',
    width: '82%',
  },
  modalAccentLine: {
    height: 2,
    backgroundColor: colors.primary,
    opacity: 0.65,
  },
  modalHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  modalEyebrow: {
    fontSize: 11,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: colors.primary,
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.2,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 10,
  },
  selectedCategoryOption: {
    backgroundColor: colors.primaryDim,
  },
  categoryCheckDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  categoryOptionText: {
    fontSize: 15,
    color: colors.textSecondary,
    letterSpacing: 0.2,
  },
  selectedCategoryOptionText: {
    color: colors.primary,
    fontWeight: '600',
  },
  modalCloseButton: {
    margin: 16,
    borderWidth: 1.5,
    borderColor: colors.primaryBorder,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
    letterSpacing: 0.5,
  },
});

export default Shop;
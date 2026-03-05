import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  TextInput,
  FlatList,
} from 'react-native';
import { useThemes } from '@/hooks/themes';
import { Product, Category } from '@/types/product';
import ProductCard from '@/components/ProductCard';
import { API_URL } from '@/constants/api';
import CustomAlert from '@/components/CustomAlert';
import { FullScreenLoader } from '@/components/LoadingSpinner';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const { width: screenWidth } = Dimensions.get('window');

// Types
interface ProductResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Product[];
}

interface Feature {
  id: number;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

interface Testimonial {
  id: number;
  name: string;
  role: string;
  image: string;
  rating: number;
  comment: string;
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

const Index = () => {
  const { colors, createStyles } = useThemes();
  const scrollY = useRef(new Animated.Value(0)).current;

  // Product states
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState<boolean>(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  // Other states
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<AlertState>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  // Animation values
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  });

  const heroScale = scrollY.interpolate({
    inputRange: [-100, 0, 200],
    outputRange: [1.08, 1, 0.96],
    extrapolate: 'clamp',
  });

  // Mock data for furniture store
  const features: Feature[] = [
    {
      id: 1,
      icon: 'car-outline',
      title: 'Free Delivery',
      description: 'Free delivery on orders over KSh 50,000. Fast and reliable shipping nationwide.',
    },
    {
      id: 2,
      icon: 'construct-outline',
      title: 'Assembly Service',
      description: 'Professional assembly service available for all furniture pieces.',
    },
    {
      id: 3,
      icon: 'return-down-back-outline',
      title: '30-Day Returns',
      description: 'Not satisfied? Return within 30 days for a full refund, no questions asked.',
    },
    {
      id: 4,
      icon: 'ribbon-outline',
      title: 'Quality Guarantee',
      description: 'Premium materials and craftsmanship with lifetime warranty on selected items.',
    },
  ];

  const testimonials: Testimonial[] = [
    {
      id: 1,
      name: 'Joan Mdivo',
      role: 'Interior Designer',
      image: 'https://images.unsplash.com/photo-1563581410561-7debcf2b09c8?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8c3BhbmlzaCUyMHdvbWFufGVufDB8fDB8fHww',
      rating: 5,
      comment: 'Exceptional quality furniture with amazing customer service. The dining set I ordered exceeded my expectations!',
    },
    {
      id: 2,
      name: 'David Ngethe',
      role: 'Homeowner',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      rating: 5,
      comment: 'Fast delivery and easy assembly. The sofa is incredibly comfortable and looks perfect in our living room.',
    },
    {
      id: 3,
      name: 'Sarah Wanyonyi',
      role: 'Property Manager',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      rating: 4,
      comment: 'Great selection of modern furniture at competitive prices. Perfect for our rental properties.',
    },
  ];

  const categories: Category[] = [
    {
      id: 1,
      name: 'Living Room',
      image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
      desription: 'Sofas, coffee tables, and entertainment centers',
    },
    {
      id: 2,
      name: 'Bedroom',
      image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&h=300&fit=crop',
      desription: 'Beds, dressers, and nightstands',
    },
    {
      id: 3,
      name: 'Dining Room',
      image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop',
      desription: 'Dining sets, chairs, and storage solutions',
    },
    {
      id: 4,
      name: 'Office',
      image: 'https://images.unsplash.com/photo-1541558869434-2840d308329a?w=400&h=300&fit=crop',
      desription: 'Desks, office chairs, and storage units',
    },
  ];

  // Fetch trending products
  const fetchTrendingProducts = useCallback(async () => {
    try {
      setProductsLoading(true);
      setProductsError(null);
      const params = new URLSearchParams({
        ordering: '-created_at',
        limit: '8',
        is_available: 'true',
      });

      const url = `${API_URL}/products/products/?${params.toString()}`;

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
      setTrendingProducts(data.results);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch trending products';
      setProductsError(errorMessage);

      showAlert(
        'error',
        'Failed to Load Products',
        'Unable to load trending products. Please check your connection and try again.',
        () => fetchTrendingProducts(),
        'Retry',
        true
      );
    } finally {
      setProductsLoading(false);
    }
  }, []);

  // Alert functions
  const showAlert = (
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
      showCancel
    });
  };

  const hideAlert = () => {
    setAlert(prev => ({ ...prev, visible: false }));
  };

  const handleNewsletterSignup = async () => {
    if (!email.trim()) {
      showAlert('warning', 'Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setEmail('');
      showAlert('success', 'Success!', 'Thank you for subscribing! You&apos;ll receive our latest furniture deals and design tips.');
    }, 1500);
  };

  // Initial load
  useEffect(() => {
    fetchTrendingProducts();
  }, [fetchTrendingProducts]);

  const styles = createStyles((colors) => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },

    // ── Hero Section ──────────────────────────────────────────────
    headerSection: {
      height: 340,
      overflow: 'hidden',
    },
    heroImageBg: {
      ...StyleSheet.absoluteFillObject,
      width: '100%',
      height: '100%',
    },
    heroOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(20, 15, 10, 0.52)',
    },
    heroContent: {
      flex: 1,
      justifyContent: 'flex-end',
      paddingHorizontal: 28,
      paddingBottom: 36,
      paddingTop: 60,
    },
    heroEyebrow: {
      fontSize: 11,
      letterSpacing: 3.5,
      color: '#D4A96A',
      textTransform: 'uppercase',
      marginBottom: 10,
      fontWeight: '600',
    },
    heroTitle: {
      fontSize: 38,
      fontWeight: '800',
      color: '#FFFFFF',
      marginBottom: 10,
      letterSpacing: -0.5,
      lineHeight: 44,
    },
    heroSubtitle: {
      fontSize: 16,
      color: 'rgba(255,255,255,0.82)',
      marginBottom: 28,
      lineHeight: 24,
      fontStyle: 'italic',
    },
    heroCtaRow: {
      flexDirection: 'row',
      gap: 12,
    },
    heroCta: {
      backgroundColor: '#D4A96A',
      paddingHorizontal: 22,
      paddingVertical: 13,
      borderRadius: 8,
    },
    heroCtaText: {
      color: '#1A1208',
      fontWeight: '700',
      fontSize: 14,
      letterSpacing: 0.3,
    },
    heroCtaSecondary: {
      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.6)',
      paddingHorizontal: 22,
      paddingVertical: 13,
      borderRadius: 8,
    },
    heroCtaSecondaryText: {
      color: '#FFFFFF',
      fontWeight: '600',
      fontSize: 14,
    },

    // ── Section shared ────────────────────────────────────────────
    sectionHeader: {
      marginBottom: 24,
    },
    sectionEyebrow: {
      fontSize: 10,
      letterSpacing: 3,
      color: '#D4A96A',
      textTransform: 'uppercase',
      fontWeight: '700',
      marginBottom: 6,
      textAlign: 'center',
    },
    sectionTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.text,
      textAlign: 'center',
      letterSpacing: -0.3,
    },
    sectionSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 6,
      lineHeight: 22,
    },

    // ── Trending Products ─────────────────────────────────────────
    trendingSection: {
      paddingVertical: 32,
      paddingHorizontal: 20,
      backgroundColor: colors.background,
    },
    productsList: {
      paddingHorizontal: 4,
    },

    // ── Categories ────────────────────────────────────────────────
    categoriesSection: {
      paddingVertical: 32,
      paddingHorizontal: 20,
      backgroundColor: colors.surface,
    },
    categoriesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 14,
    },
    categoryCard: {
      width: (screenWidth - 54) / 2,
      borderRadius: 14,
      overflow: 'hidden',
      height: 140,
      backgroundColor: colors.card,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 5,
    },
    categoryImage: {
      ...StyleSheet.absoluteFillObject,
      width: '100%',
      height: '100%',
    },
    categoryGradient: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(10, 8, 5, 0.48)',
    },
    categoryInfo: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: 12,
    },
    categoryName: {
      fontSize: 15,
      fontWeight: '700',
      color: '#FFFFFF',
      marginBottom: 2,
    },
    categoryDescription: {
      fontSize: 11,
      color: 'rgba(255,255,255,0.75)',
      lineHeight: 14,
    },

    // ── Features ──────────────────────────────────────────────────
    featuresSection: {
      paddingVertical: 32,
      paddingHorizontal: 20,
      backgroundColor: colors.background,
    },
    featuresGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 14,
    },
    featureCard: {
      width: (screenWidth - 54) / 2,
      backgroundColor: colors.surface,
      padding: 20,
      borderRadius: 14,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.07,
      shadowRadius: 6,
      elevation: 3,
    },
    featureIconWrapper: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: 'rgba(212, 169, 106, 0.12)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
    },
    featureIcon: {
      fontSize: 32,
    },
    featureTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 6,
      lineHeight: 18,
    },
    featureDescription: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 18,
    },

    // ── Testimonials ──────────────────────────────────────────────
    testimonialsSection: {
      paddingVertical: 32,
      backgroundColor: colors.surface,
    },
    testimonialsHeader: {
      paddingHorizontal: 20,
      marginBottom: 24,
    },
    testimonialCard: {
      backgroundColor: colors.background,
      padding: 22,
      borderRadius: 16,
      marginRight: 16,
      width: screenWidth - 80,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 10,
      elevation: 4,
      borderWidth: 1,
      borderColor: colors.divider ?? 'rgba(0,0,0,0.05)',
    },
    quoteMark: {
      fontSize: 52,
      lineHeight: 44,
      color: '#D4A96A',
      fontWeight: '900',
      marginBottom: 8,
      opacity: 0.7,
    },
    testimonialComment: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 22,
      fontStyle: 'italic',
      marginBottom: 18,
    },
    testimonialDivider: {
      height: 1,
      backgroundColor: colors.divider ?? 'rgba(0,0,0,0.06)',
      marginBottom: 16,
    },
    testimonialHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    testimonialImage: {
      width: 42,
      height: 42,
      borderRadius: 21,
      marginRight: 12,
      borderWidth: 2,
      borderColor: '#D4A96A',
    },
    testimonialName: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 1,
    },
    testimonialRole: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    starsContainer: {
      flexDirection: 'row',
      marginTop: 4,
    },
    star: {
      fontSize: 12,
      color: '#D4A96A',
      marginRight: 1,
    },

    // ── Newsletter ────────────────────────────────────────────────
    newsletterSection: {
      paddingVertical: 40,
      paddingHorizontal: 24,
      backgroundColor: '#1A1208',
      alignItems: 'center',
    },
    newsletterBadge: {
      backgroundColor: 'rgba(212, 169, 106, 0.15)',
      borderWidth: 1,
      borderColor: 'rgba(212, 169, 106, 0.3)',
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 5,
      marginBottom: 16,
    },
    newsletterBadgeText: {
      fontSize: 11,
      color: '#D4A96A',
      letterSpacing: 2,
      textTransform: 'uppercase',
      fontWeight: '600',
    },
    newsletterTitle: {
      fontSize: 26,
      fontWeight: '800',
      color: '#FFFFFF',
      textAlign: 'center',
      marginBottom: 8,
      letterSpacing: -0.3,
    },
    newsletterSubtitle: {
      fontSize: 14,
      color: 'rgba(255,255,255,0.6)',
      textAlign: 'center',
      marginBottom: 28,
      lineHeight: 22,
    },
    emailInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderRadius: 12,
      paddingHorizontal: 16,
      marginBottom: 12,
      width: '100%',
      maxWidth: 360,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
    },
    emailInput: {
      flex: 1,
      height: 52,
      fontSize: 15,
      color: '#FFFFFF',
    },
    subscribeButton: {
      backgroundColor: '#D4A96A',
      paddingHorizontal: 20,
      paddingVertical: 11,
      borderRadius: 9,
      marginLeft: 8,
    },
    subscribeButtonText: {
      color: '#1A1208',
      fontWeight: '700',
      fontSize: 13,
    },

    // ── Loading / Error ───────────────────────────────────────────
    loadingContainer: {
      padding: 48,
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 16,
    },
    errorContainer: {
      padding: 24,
      alignItems: 'center',
    },
    errorText: {
      fontSize: 14,
      color: colors.error,
      textAlign: 'center',
      marginBottom: 16,
      lineHeight: 22,
    },
    retryButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    retryButtonText: {
      color: colors.surface,
      fontWeight: '600',
      fontSize: 14,
    },
    viewAllButton: {
      borderWidth: 1.5,
      borderColor: colors.primary,
      paddingHorizontal: 28,
      paddingVertical: 13,
      borderRadius: 10,
      alignSelf: 'center',
      marginTop: 20,
    },
    viewAllButtonText: {
      color: colors.primary,
      fontWeight: '700',
      fontSize: 14,
      letterSpacing: 0.2,
    },
  }));

  // Render functions
  const renderTrendingProduct = ({ item }: { item: Product }) => (
    <View style={{ marginHorizontal: 8 }}>
      <ProductCard product={item} />
    </View>
  );

  const renderTestimonial = ({ item }: { item: Testimonial }) => (
    <View style={styles.testimonialCard}>
      <Text style={styles.quoteMark}>"</Text>
      <Text style={styles.testimonialComment}>{item.comment}</Text>
      <View style={styles.testimonialDivider} />
      <View style={styles.testimonialHeader}>
        <Image source={{ uri: item.image }} style={styles.testimonialImage} />
        <View style={{ flex: 1 }}>
          <Text style={styles.testimonialName}>{item.name}</Text>
          <Text style={styles.testimonialRole}>{item.role}</Text>
          <View style={styles.starsContainer}>
            {Array.from({ length: 5 }, (_, i) => (
              <Text key={`star-${item.id}-${i}`} style={styles.star}>
                {i < item.rating ? '★' : '☆'}
              </Text>
            ))}
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        style={styles.scrollView}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <Animated.View
          style={[
            styles.headerSection,
            { opacity: headerOpacity, transform: [{ scale: heroScale }] },
          ]}
        >
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=600&fit=crop' }}
            style={styles.heroImageBg}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <Text style={styles.heroEyebrow}>Premium Furniture</Text>
            <Text style={styles.heroTitle}>Ideal Furniture</Text>
            <Text style={styles.heroSubtitle}>&quot;Comfort in style&quot;</Text>
            <View style={styles.heroCtaRow}>
              <TouchableOpacity style={styles.heroCta} onPress={() => router.push('/shop')}>
                <Text style={styles.heroCtaText}>Shop Now</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.heroCtaSecondary} onPress={() => router.push('/shop')}>
                <Text style={styles.heroCtaSecondaryText}>Explore</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Trending Products Section */}
        <View style={styles.trendingSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionEyebrow}>Curated for You</Text>
            <Text style={styles.sectionTitle}>Trending Products</Text>
          </View>

          {productsLoading ? (
            <View style={styles.loadingContainer}>
              <FullScreenLoader
                message="Loading trending products..."
                color={colors.primary}
              />
            </View>
          ) : productsError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{productsError}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={fetchTrendingProducts}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <FlatList
                data={trendingProducts}
                renderItem={renderTrendingProduct}
                keyExtractor={(item) => item.id.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.productsList}
              />
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => router.push('/shop')}
              >
                <Text style={styles.viewAllButtonText}>View All Products</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Categories Section */}
        <View style={styles.categoriesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionEyebrow}>Browse</Text>
            <Text style={styles.sectionTitle}>Shop by Category</Text>
          </View>
          <View style={styles.categoriesGrid}>
            {categories.map((category) => (
              <TouchableOpacity key={category.id} style={styles.categoryCard}>
                <Image
                  source={{ uri: category.image }}
                  style={styles.categoryImage}
                  resizeMode="cover"
                />
                <View style={styles.categoryGradient} />
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text style={styles.categoryDescription}>{category.desription}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionEyebrow}>Our Promise</Text>
            <Text style={styles.sectionTitle}>Why Choose Us?</Text>
            <Text style={styles.sectionSubtitle}>
              We make furniture shopping easy with these exclusive benefits
            </Text>
          </View>
          <View style={styles.featuresGrid}>
            {features.map((feature) => (
              <View key={feature.id} style={styles.featureCard}>
                <View style={styles.featureIconWrapper}>
                  <Ionicons name={feature.icon} size={24} color="#D4A96A" />
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Testimonials Section */}
        <View style={styles.testimonialsSection}>
          <View style={[styles.sectionHeader, styles.testimonialsHeader]}>
            <Text style={styles.sectionEyebrow}>Reviews</Text>
            <Text style={styles.sectionTitle}>Happy Customers</Text>
            <Text style={styles.sectionSubtitle}>
              See what our customers say about their furniture experience
            </Text>
          </View>
          <FlatList
            data={testimonials}
            renderItem={renderTestimonial}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
          />
        </View>

        {/* Newsletter Section */}
        <View style={styles.newsletterSection}>
          <View style={styles.newsletterBadge}>
            <Text style={styles.newsletterBadgeText}>Exclusive Offers</Text>
          </View>
          <Text style={styles.newsletterTitle}>Stay Updated</Text>
          <Text style={styles.newsletterSubtitle}>
            Get exclusive deals, new arrivals, and design tips delivered to your inbox
          </Text>
          <View style={styles.emailInputContainer}>
            <TextInput
              style={styles.emailInput}
              placeholder="Enter your email"
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.subscribeButton}
              onPress={handleNewsletterSignup}
              disabled={loading}
            >
              <Text style={styles.subscribeButtonText}>
                {loading ? 'Subscribing...' : 'Subscribe'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.ScrollView>

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

export default Index;
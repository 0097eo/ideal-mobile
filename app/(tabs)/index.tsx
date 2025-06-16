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
        ordering: '-created_at', // Most recent first
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
      
      // Show error alert
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
    
    // Simulate API call
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
    
    // Header Section
    headerSection: {
      paddingTop: 60,
      paddingHorizontal: 20,
      paddingBottom: 0,
      backgroundColor: colors.primary,
      alignItems: 'center',
    },
    heroTitle: {
      fontSize: 32,
      fontWeight: 'bold',
      color: colors.surface,
      textAlign: 'center',
      marginBottom: 16,
    },
    heroSubtitle: {
      fontSize: 18,
      color: colors.surface,
      textAlign: 'center',
      marginBottom: 32,
      opacity: 0.9,
      lineHeight: 26,
    },
  

    // Trending Products Section
    trendingSection: {
      padding: 20,
      backgroundColor: colors.surface,
    },
    sectionTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 12,
    },
    sectionSubtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 24,
    },
    
    // Categories Section
    categoriesSection: {
      padding: 20,
      backgroundColor: colors.background,
    },
    categoriesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    categoryCard: {
      width: (screenWidth - 60) / 2,
      backgroundColor: colors.surface,
      borderRadius: 12,
      marginBottom: 16,
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      overflow: 'hidden',
    },
    categoryImage: {
      width: '100%',
      height: 100,
    },
    categoryInfo: {
      padding: 12,
      margin: 4
    },
    categoryName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    categoryDescription: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 16,
    },
    
    // Features Section
    featuresSection: {
      padding: 20,
      backgroundColor: colors.surface,
    },
    featuresGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    featureCard: {
      width: (screenWidth - 60) / 2,
      backgroundColor: colors.card,
      padding: 20,
      borderRadius: 12,
      marginBottom: 16,
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      alignItems: 'center',
    },
    featureIcon: {
      fontSize: 32,
      marginBottom: 12,
    },
    featureTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    featureDescription: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 18,
      textAlign: 'center',
    },
    
    // Testimonials Section
    testimonialsSection: {
      padding: 20,
      backgroundColor: colors.background,
    },
    testimonialCard: {
      backgroundColor: colors.surface,
      padding: 20,
      borderRadius: 12,
      marginRight: 16,
      width: screenWidth - 80,
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    testimonialHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    testimonialImage: {
      width: 50,
      height: 50,
      borderRadius: 25,
      marginRight: 12,
    },
    testimonialName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    testimonialRole: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    starsContainer: {
      flexDirection: 'row',
      marginBottom: 12,
    },
    star: {
      fontSize: 16,
      color: '#FFD700',
      marginRight: 2,
    },
    testimonialComment: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
      fontStyle: 'italic',
    },
    
    // Newsletter Section
    newsletterSection: {
      padding: 20,
      backgroundColor: colors.primary,
      alignItems: 'center',
    },
    newsletterTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.surface,
      textAlign: 'center',
      marginBottom: 8,
    },
    newsletterSubtitle: {
      fontSize: 16,
      color: colors.surface,
      textAlign: 'center',
      marginBottom: 24,
      opacity: 0.9,
    },
    emailInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 25,
      paddingHorizontal: 16,
      marginBottom: 16,
      width: '100%',
      maxWidth: 350,
    },
    emailInput: {
      flex: 1,
      height: 50,
      fontSize: 16,
      color: colors.text,
    },
    subscribeButton: {
      backgroundColor:colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 20,
      marginLeft: 8,
    },
    subscribeButtonText: {
      color: colors.surface,
      fontWeight: '600',
    },

    // Loading and Error States
    loadingContainer: {
      padding: 40,
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 16,
    },
    errorContainer: {
      padding: 20,
      alignItems: 'center',
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
    viewAllButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      alignSelf: 'center',
      marginTop: 16,
    },
    viewAllButtonText: {
      color: colors.surface,
      fontWeight: '600',
      fontSize: 16,
    },
    productsList: {
      paddingHorizontal: 10,
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
      <View style={styles.testimonialHeader}>
        <Image source={{ uri: item.image }} style={styles.testimonialImage} />
        <View>
          <Text style={styles.testimonialName}>{item.name}</Text>
          <Text style={styles.testimonialRole}>{item.role}</Text>
        </View>
      </View>
      <View style={styles.starsContainer}>
        {Array.from({ length: 5 }, (_, i) => (
          <Text key={`star-${item.id}-${i}`} style={styles.star}>
            {i < item.rating ? '★' : '☆'}
          </Text>
        ))}
      </View>
      <Text style={styles.testimonialComment}>&quot;{item.comment}&quot;</Text>
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
            { opacity: headerOpacity },
          ]}
        >
          <Text style={styles.heroTitle}>
            Ideal Furniture
          </Text>
          <Text style={styles.heroSubtitle}>
            &quot;Comfort in style&quot;
          </Text>
        </Animated.View>

        {/* Trending Products Section */}
        <View style={styles.trendingSection}>
          <Text style={styles.sectionTitle}>Trending Products</Text>
          
          
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
          <Text style={styles.sectionTitle}>Shop by Category</Text>
          <View style={styles.categoriesGrid}>
            {categories.map((category) => (
              <TouchableOpacity key={category.id} style={styles.categoryCard}>
                <Image 
                  source={{ uri: category.image }} 
                  style={{ width: '100%', height: 80, borderRadius: 12, marginBottom: 8 }}
                />
                <Text style={styles.categoryName}>{category.name}</Text>
                <Text style={styles.categoryDescription}>{category.desription}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Why Choose Us?</Text>
          <Text style={styles.sectionSubtitle}>
            We make furniture shopping easy with these exclusive benefits
          </Text>
          <View style={styles.featuresGrid}>
            {features.map((feature) => (
              <View key={feature.id} style={styles.featureCard}>
                <Ionicons name={feature.icon} size={32} color="#FFA000" style={styles.featureIcon} />
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Testimonials Section */}
        <View style={styles.testimonialsSection}>
          <Text style={styles.sectionTitle}>Happy Customers</Text>
          <Text style={styles.sectionSubtitle}>
            See what our customers say about their furniture experience
          </Text>
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
          <Text style={styles.newsletterTitle}>Stay Updated</Text>
          <Text style={styles.newsletterSubtitle}>
            Get exclusive deals, new arrivals, and design tips delivered to your inbox
          </Text>
          <View style={styles.emailInputContainer}>
            <TextInput
              style={styles.emailInput}
              placeholder="Enter your email"
              placeholderTextColor={colors.textSecondary}
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
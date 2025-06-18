import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '@/constants/api';
import * as SecureStore from 'expo-secure-store';
import { useThemes } from '@/hooks/themes';
import { Order } from '@/types/order';
import CustomAlert from '@/components/CustomAlert';

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'ongoing' | 'canceled'>('ongoing');
  const router = useRouter();
  const { colors, isDark } = useThemes();
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertProps, setAlertProps] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
  }>({ type: 'error', title: '', message: '' });

  const showAlert = useCallback((
  type: 'success' | 'error' | 'warning' | 'info',
  title: string,
  message: string
) => {
  setAlertProps({ type, title, message });
  setAlertVisible(true);
}, [setAlertProps, setAlertVisible]);

  const fetchOrders = useCallback(async () => {
  try {
    const token = await SecureStore.getItemAsync('access_token');

    const response = await fetch(`${API_URL}/orders/orders/`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      setOrders(data);
    } else {
      showAlert('error', 'Error', 'Failed to fetch orders');
    }
  } catch (error) {
    showAlert('error', 'Error', 'Network error occurred');
    throw error
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
}, [setOrders, showAlert, setLoading, setRefreshing]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, [fetchOrders]);

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'DELIVERED':
        return colors.success;
      case 'SHIPPED':
        return '#2196F3';
      case 'PROCESSING':
        return colors.warning;
      case 'PENDING':
        return colors.textTertiary;
      case 'CANCELLED':
        return colors.error;
      default:
        return colors.textTertiary;
    }
  };

  const getStatusText = (status: Order['status']) => {
    return status.charAt(0) + status.slice(1).toLowerCase();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
    });
  };

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'ongoing') {
      return ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status);
    } else {
      return ['CANCELLED'].includes(order.status);
    }
  });

  const handleBack = () => {
    router.back();
  };

  const renderOrderItem = ({ item }: { item: Order }) => {
    const mainItem = item.items[0]; // Display first item as main
    const additionalItemsCount = item.items.length - 1;

    return (
      <TouchableOpacity 
        style={[styles.orderCard, { backgroundColor: colors.card }]}
        onPress={() => {
          router.push({
            pathname: '/(screens)/order-details/[orderId]',
            params: { orderId: item.id }
          });
        }}
      >
        <View style={styles.orderHeader}>
          <Image
            source={{ 
              uri: mainItem.product_image || 'https://via.placeholder.com/60x60'
            }}
            style={[styles.productImage, { backgroundColor: colors.border }]}
            defaultSource={{ uri: 'https://via.placeholder.com/60x60' }}
          />
          <View style={styles.orderInfo}>
            <Text style={[styles.productName, { color: colors.text }]} numberOfLines={2}>
              {mainItem.product_name}
              {additionalItemsCount > 0 && ` +${additionalItemsCount} more`}
            </Text>
            <Text style={[styles.orderId, { color: colors.textSecondary }]}>Order #{item.id}</Text>
            <View style={styles.statusContainer}>
              <View 
                style={[
                  styles.statusBadge, 
                  { backgroundColor: getStatusColor(item.status) }
                ]}
              >
                <Text style={styles.statusText}>
                  {getStatusText(item.status)}
                </Text>
              </View>
            </View>
            <Text style={[styles.orderDate, { color: colors.textSecondary }]}>
              On {formatDate(item.created_at)}
            </Text>
          </View>
        </View>
        
        <View style={[styles.orderFooter, { borderTopColor: colors.border }]}>
          <Text style={[styles.totalPrice, { color: colors.text }]}>
            Total: KSh {Number(item.total_price).toLocaleString(undefined, { minimumFractionDigits: 0 })}
          </Text>
          <Text style={[styles.itemCount, { color: colors.textSecondary }]}>
            {item.items.length} item{item.items.length > 1 ? 's' : ''}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Create themed styles
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: Platform.OS === 'ios' ? 50 : 20,
      paddingBottom: 16,
      backgroundColor: colors.navigationBackground,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginTop: 30
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      height: 56,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    headerTitleContainer: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.navigationText,
    },
    searchButton: {
      padding: 8,
      marginRight: -8,
    },
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      elevation: 2,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
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
      fontWeight: '600',
      color: colors.textTertiary,
    },
    activeTabText: {
      color: colors.primary,
    },
    listContainer: {
      padding: 16,
    },
    orderCard: {
      borderRadius: 8,
      padding: 16,
      marginBottom: 12,
      elevation: 2,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    orderHeader: {
      flexDirection: 'row',
      marginBottom: 12,
    },
    productImage: {
      width: 60,
      height: 60,
      borderRadius: 8,
      marginRight: 12,
    },
    orderInfo: {
      flex: 1,
    },
    productName: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
      lineHeight: 20,
    },
    orderId: {
      fontSize: 14,
      marginBottom: 8,
    },
    statusContainer: {
      marginBottom: 8,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      alignSelf: 'flex-start',
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#FFFFFF',
      textTransform: 'uppercase',
    },
    orderDate: {
      fontSize: 14,
    },
    orderFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 12,
      borderTopWidth: 1,
    },
    totalPrice: {
      fontSize: 16,
      fontWeight: '600',
    },
    itemCount: {
      fontSize: 14,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyText: {
      fontSize: 16,
      color: colors.textTertiary,
      textAlign: 'center',
    },
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar 
          barStyle={isDark ? 'light-content' : 'dark-content'} 
          backgroundColor={colors.navigationBackground} 
        />
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Orders</Text>
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        backgroundColor={colors.navigationBackground} 
      />
      
      {/*Header*/}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Orders</Text>
      </View>
      
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'ongoing' && styles.activeTab
          ]}
          onPress={() => setActiveTab('ongoing')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'ongoing' && styles.activeTabText
          ]}>
            ONGOING/DELIVERED
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'canceled' && styles.activeTab
          ]}
          onPress={() => setActiveTab('canceled')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'canceled' && styles.activeTabText
          ]}>
            CANCELED/RETURNED
          </Text>
        </TouchableOpacity>
      </View>

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No {activeTab === 'ongoing' ? 'ongoing' : 'canceled'} orders found
            </Text>
          </View>
        }
      />
      <CustomAlert
        visible={alertVisible}
        type={alertProps.type}
        title={alertProps.title}
        message={alertProps.message}
        onClose={() => setAlertVisible(false)}
        confirmText="OK"
      />
    </View>
  );
};

export default Orders;
export interface OrderItem {
  id: number;
  product: number;
  product_name: string;
  product_price: string;
  product_image: string;
  quantity: number;
  subtotal: string;
}

export interface Order {
  id: number;
  user_email: string;
  items: OrderItem[];
  total_price: string;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  shipping_address: string;
  billing_address: string;
  created_at: string;
  updated_at: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
}
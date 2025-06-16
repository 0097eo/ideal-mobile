export interface CartItem {
  id: number;
  product: number;
  product_name: string;
  product_image: string | null;
  product_price: string;
  quantity: number;
  subtotal: string;
}

export interface Cart {
  id: number | null;
  items: CartItem[];
  total_price: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface CartState {
  cart: Cart;
  loading: boolean;
  error: string | null;
}
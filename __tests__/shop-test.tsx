import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import Shop from '@/app/(tabs)/shop';
import { useThemes } from '@/hooks/themes';

jest.mock('@/hooks/themes');
jest.mock('@/components/ProductCard', () => {
    //eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View, Text } = require('react-native');
  const MockProductCard = ({ product }: any) => (
    <View>
      <Text>{product.product_name}</Text>
    </View>
  );
  return MockProductCard;
});
jest.mock('@/components/CustomAlert', () => {
    //eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View, Text } = require('react-native');
  const MockCustomAlert = ({ visible, title, message }: any) =>
    visible ? (
      <View testID="custom-alert">
        <Text>{title}</Text>
        <Text>{message}</Text>
      </View>
    ) : null;
  return MockCustomAlert;
});

jest.mock('@/components/LoadingSpinner', () => {
    //eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Text } = require('react-native');
    const MockFullScreenLoader = ({ message }: { message: string }) => <Text>{message}</Text>
    return {
        FullScreenLoader: MockFullScreenLoader
    }
});

global.fetch = jest.fn();


const mockCategories = [
  { id: 1, name: 'Living Room' },
  { id: 2, name: 'Bedroom' },
];

const mockProductsResponse = {
  count: 1,
  next: null,
  previous: null,
  results: [
    {
      id: 1,
      product_name: 'Test Sofa',
      product_price: '10000',
      product_image: '',
      is_available: true,
      created_at: '2024-06-26T10:00:00Z',
    },
  ],
};

beforeEach(() => {
  jest.clearAllMocks();
  (useThemes as jest.Mock).mockReturnValue({
    colors: {
      background: '#fff',
      text: '#000',
      primary: '#007AFF',
      surface: '#F2F2F2',
      border: '#CCCCCC',
      error: '#FF3B30',
      textSecondary: '#666666',
      textTertiary: '#999999',
      divider: '#E5E5E5',
      card: '#fff',
      shadow: '#000',
      primaryMuted: '#e6f0fa',
    },
    createStyles: (fn: any) => fn({
      background: '#fff',
      text: '#000',
      primary: '#007AFF',
      surface: '#F2F2F2',
      border: '#CCCCCC',
      error: '#FF3B30',
      textSecondary: '#666666',
      textTertiary: '#999999',
      divider: '#E5E5E5',
      card: '#fff',
      shadow: '#000',
      primaryMuted: '#e6f0fa',
    }),
  });
});

// --- TESTS ---

describe('Shop Tab', () => {
  it('shows loading state initially', () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));
    const { getByText } = render(<Shop />);
    expect(getByText('Loading products...')).toBeTruthy();
  });

  it('renders products after successful fetch', async () => {
    (global.fetch as jest.Mock).mockImplementation(async (url: string) => {
      if (url.includes('/categories')) {
        return { ok: true, json: async () => mockCategories };
      }
      if (url.includes('/products')) {
        return { ok: true, json: async () => mockProductsResponse };
      }
      return { ok: false, status: 404, json: async () => ({}) };
    });

    const { findByText } = render(<Shop />);
    expect(await findByText('Test Sofa')).toBeTruthy();
  });

  it('shows error state if fetch products fails', async () => {
    (global.fetch as jest.Mock).mockImplementation(async (url: string) => {
      if (url.includes('/categories')) {
        return { ok: true, json: async () => mockCategories };
      }
      if (url.includes('/products')) {
        return { ok: false, status: 500, json: async () => ({ detail: 'Server Error' }) };
      }
      return { ok: false, status: 404, json: async () => ({}) };
    });
  
    const { findByText } = render(<Shop />);
    // The alert is a secondary effect.
    expect(await findByText(/HTTP error! status: 500/i)).toBeTruthy();
    expect(await findByText('Retry')).toBeTruthy();
  });
  

  it('shows empty state if no products are returned', async () => {
    (global.fetch as jest.Mock).mockImplementation(async (url: string) => {
      if (url.includes('/categories')) {
        return { ok: true, json: async () => mockCategories };
      }
      if (url.includes('/products')) {
        // Return success but with an empty results array
        return { ok: true, json: async () => ({ ...mockProductsResponse, count: 0, results: [] }) };
      }
      return { ok: false, status: 404, json: async () => ({}) };
    });
    
    const { findByText } = render(<Shop />);
    expect(await findByText(/No products found/)).toBeTruthy();
  });

  it('can search for products', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => mockCategories })
      .mockResolvedValue({ ok: true, json: async () => mockProductsResponse });
      
    const { getByPlaceholderText, getByDisplayValue } = render(<Shop />);
    
    const searchInput = await waitFor(() => getByPlaceholderText('Search products...'));
    
    await act(async () => {
      fireEvent.changeText(searchInput, 'Sofa');
      fireEvent(searchInput, 'submitEditing');
    });

    expect(getByDisplayValue('Sofa')).toBeTruthy();
  });

  it('shows and closes category modal', async () => {
    (global.fetch as jest.Mock).mockImplementation(async (url: string) => {
      if (url.includes('/categories')) {
        return { ok: true, json: async () => mockCategories };
      }
      return { ok: true, json: async () => mockProductsResponse };
    });
  
    const { getByText, findByText, queryByText } = render(<Shop />);
    
    await findByText('Test Sofa');
    fireEvent.press(getByText('Filters'));
    
    const categoryButton = await findByText('All Categories');
    fireEvent.press(categoryButton);

    expect(await findByText('Select Category')).toBeTruthy();
  
    fireEvent.press(getByText('Close'));
  
    await waitFor(() => {
      expect(queryByText('Select Category')).toBeNull();
    });
  });

  it('shows alert on reset filters', async () => {
    (global.fetch as jest.Mock).mockImplementation(async (url: string) => {
      if (url.includes('/categories')) {
        return { ok: true, json: async () => mockCategories };
      }
      return { ok: true, json: async () => mockProductsResponse };
    });
  
    const { getByText, findByText } = render(<Shop />);
    
    await findByText('Test Sofa');
    fireEvent.press(getByText('Filters'));
    
    const resetButton = await findByText('Reset Filters');
    fireEvent.press(resetButton);
  
    expect(await findByText('Are you sure you want to reset all filters?')).toBeTruthy();
  });
});
export interface Category {
    id: number;
    name: string;
    desription: string;
}

export interface ProductReview {
    id: number;
    rating: number;
    comment: string;
    user: string;
    created_at: string;
}

export interface Product {
    id: number;
    category?: number;
    category_name?: string;
    name: string;
    description?: string;
    price: string; // DecimalField comes as string from API
    stock: number;
    primary_material: 'WOOD' | 'METAL' | 'FABRIC' | 'LEATHER' | 'GLASS' | 'PLASTIC';
    condition: 'NEW' | 'USED' | 'REFURBISHED';
    image: string; // Cloudinary URL
    additional_images?: string;
    is_available: boolean;
    average_rating?: number | null;
    review_count?: number;
    reviews?: ProductReview[];
    created_at: string;
}
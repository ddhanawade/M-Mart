export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: 'fruits' | 'vegetables' | 'organic' | 'groceries';
  subcategory?: string;
  image: string;
  images?: string[];
  inStock: boolean;
  quantity: number;
  unit: string; // kg, pieces, liter, etc.
  rating: number;
  reviewCount: number;
  organic: boolean;
  fresh: boolean;
  discount?: number;
  nutritionalInfo?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    vitamins: string[];
  };
}

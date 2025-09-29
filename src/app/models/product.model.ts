export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string; // backend may send many categories; normalize to lowercase in services
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
  discount?: number; // could be absolute or percent; compute when missing
  featured?: boolean;
  sku?: string;
  barcode?: string;
  weightKg?: number;
  shelfLifeDays?: number;
  storageInstructions?: string;
  originCountry?: string;
  supplierName?: string;
  brand?: string;
  farmerName?: string;
  season?: string;
  createdAt?: string;
  nutritionalInfo?: {
    calories?: number; // map from caloriesPer100g
    protein?: number;  // map from proteinG
    carbs?: number;    // map from carbsG
    fat?: number;      // map from fatG
    fiber?: number;    // map from fiberG
    vitamins?: string[];
  };
}

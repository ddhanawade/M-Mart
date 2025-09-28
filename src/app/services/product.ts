import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, tap, catchError, of } from 'rxjs';
import { Product } from '../models/product.model';
import { ApiService, PageResponse } from './api.service';

export interface ProductSearchFilters {
  query?: string;
  category?: string;
  subcategory?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStock?: boolean;
  organic?: boolean;
  fresh?: boolean;
  featured?: boolean;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: string;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  category: string; // backend expects lowercase enum name
  subcategory?: string;
  image: string;
  images?: string[];
  inStock?: boolean;
  quantity?: number;
  unit?: string;
  rating?: number;
  reviewCount?: number;
  organic?: boolean;
  fresh?: boolean;
  discount?: number;
  featured?: boolean;
  sku?: string;
  barcode?: string;
  weightKg?: number;
  shelfLifeDays?: number;
  storageInstructions?: string;
  originCountry?: string;
  supplierName?: string;
  nutritionalInfo?: {
    caloriesPer100g?: number;
    proteinG?: number;
    carbsG?: number;
    fatG?: number;
    fiberG?: number;
    vitamins?: string[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private productsSubject = new BehaviorSubject<Product[]>([]);
  private filteredProductsSubject = new BehaviorSubject<PageResponse<Product> | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private categoriesSubject = new BehaviorSubject<string[]>([]);

  public products$ = this.productsSubject.asObservable();
  public filteredProducts$ = this.filteredProductsSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public categories$ = this.categoriesSubject.asObservable();

  constructor(private apiService: ApiService) {
    this.loadCategories();
  }

  private setLoading(loading: boolean) {
    this.loadingSubject.next(loading);
  }

  private loadCategories() {
    this.apiService.get<any[]>('productService', '/api/products/category-counts')
      .subscribe({
        next: (categoryCounts) => {
          const categories = categoryCounts.map(count => count[0]);
          this.categoriesSubject.next(categories);
        },
        error: (error) => {
          console.error('Error loading categories:', error);
        }
      });
  }

  getAllProducts(page: number = 0, size: number = 20, sortBy: string = 'name', sortDirection: string = 'asc'): Observable<PageResponse<Product>> {
    this.setLoading(true);
    
    const params = { page, size, sortBy, sortDirection };
    
    return this.apiService.get<PageResponse<Product>>('productService', '/api/products', params).pipe(
      tap(response => {
        this.productsSubject.next(response.content);
        this.filteredProductsSubject.next(response);
        this.setLoading(false);
      }),
      catchError(error => {
        console.error('Error loading products:', error);
        this.setLoading(false);
        return of({ content: [], totalElements: 0, totalPages: 0, size, number: page, first: true, last: true });
      })
    );
  }

  getProductById(id: string): Observable<Product> {
    return this.apiService.get<Product>('productService', `/api/products/${id}`);
  }

  getProductBySku(sku: string): Observable<Product> {
    return this.apiService.get<Product>('productService', `/api/products/sku/${sku}`);
  }

  searchProducts(filters: ProductSearchFilters): Observable<PageResponse<Product>> {
    this.setLoading(true);
    
    const params: any = {
      page: filters.page || 0,
      size: filters.size || 20,
      sortBy: filters.sortBy || 'name',
      sortDirection: filters.sortDirection || 'asc'
    };

    // Add filter parameters
    if (filters.query) params.query = filters.query;
    if (filters.category) params.category = filters.category;
    if (filters.subcategory) params.subcategory = filters.subcategory;
    if (filters.minPrice !== undefined) params.minPrice = filters.minPrice;
    if (filters.maxPrice !== undefined) params.maxPrice = filters.maxPrice;
    if (filters.minRating !== undefined) params.minRating = filters.minRating;
    if (filters.inStock !== undefined) params.inStock = filters.inStock;
    if (filters.organic !== undefined) params.organic = filters.organic;
    if (filters.fresh !== undefined) params.fresh = filters.fresh;
    if (filters.featured !== undefined) params.featured = filters.featured;

    return this.apiService.get<PageResponse<Product>>('productService', '/api/products/search', params).pipe(
      tap(response => {
        this.filteredProductsSubject.next(response);
        this.setLoading(false);
      }),
      catchError(error => {
        console.error('Error searching products:', error);
        this.setLoading(false);
        const emptyResponse = { 
          content: [], 
          totalElements: 0, 
          totalPages: 0, 
          size: params.size, 
          number: params.page, 
          first: true, 
          last: true 
        };
        this.filteredProductsSubject.next(emptyResponse);
        return of(emptyResponse);
      })
    );
  }

  getProductsByCategory(category: string, page: number = 0, size: number = 20): Observable<PageResponse<Product>> {
    this.setLoading(true);
    
    const params = { page, size, sortBy: 'name', sortDirection: 'asc' };
    
    return this.apiService.get<PageResponse<Product>>('productService', `/api/products/category/${category}`, params).pipe(
      tap(response => {
        this.filteredProductsSubject.next(response);
        this.setLoading(false);
      }),
      catchError(error => {
        console.error('Error loading products by category:', error);
        this.setLoading(false);
        return of({ content: [], totalElements: 0, totalPages: 0, size, number: page, first: true, last: true });
      })
    );
  }

  getFeaturedProducts(page: number = 0, size: number = 20): Observable<PageResponse<Product>> {
    this.setLoading(true);
    
    const params = { page, size };
    
    return this.apiService.get<PageResponse<Product>>('productService', '/api/products/featured', params).pipe(
      tap(response => {
        this.setLoading(false);
      }),
      catchError(error => {
        console.error('Error loading featured products:', error);
        this.setLoading(false);
        return of({ content: [], totalElements: 0, totalPages: 0, size, number: page, first: true, last: true });
      })
    );
  }

  getOrganicProducts(page: number = 0, size: number = 20): Observable<PageResponse<Product>> {
    this.setLoading(true);
    
    const params = { page, size };
    
    return this.apiService.get<PageResponse<Product>>('productService', '/api/products/organic', params).pipe(
      tap(response => {
        this.setLoading(false);
      }),
      catchError(error => {
        console.error('Error loading organic products:', error);
        this.setLoading(false);
        return of({ content: [], totalElements: 0, totalPages: 0, size, number: page, first: true, last: true });
      })
    );
  }

  getProductsOnSale(page: number = 0, size: number = 20): Observable<PageResponse<Product>> {
    this.setLoading(true);
    
    const params = { page, size };
    
    return this.apiService.get<PageResponse<Product>>('productService', '/api/products/sale', params).pipe(
      tap(response => {
        this.setLoading(false);
      }),
      catchError(error => {
        console.error('Error loading products on sale:', error);
        this.setLoading(false);
        return of({ content: [], totalElements: 0, totalPages: 0, size, number: page, first: true, last: true });
      })
    );
  }

  getTopRatedProducts(page: number = 0, size: number = 20): Observable<PageResponse<Product>> {
    this.setLoading(true);
    
    const params = { page, size };
    
    return this.apiService.get<PageResponse<Product>>('productService', '/api/products/top-rated', params).pipe(
      tap(response => {
        this.setLoading(false);
      }),
      catchError(error => {
        console.error('Error loading top-rated products:', error);
        this.setLoading(false);
        return of({ content: [], totalElements: 0, totalPages: 0, size, number: page, first: true, last: true });
      })
    );
  }

  getRelatedProducts(productId: string, page: number = 0, size: number = 8): Observable<PageResponse<Product>> {
    const params = { page, size };
    
    return this.apiService.get<PageResponse<Product>>('productService', `/api/products/${productId}/related`, params);
  }

  getLowStockProducts(): Observable<Product[]> {
    return this.apiService.get<Product[]>('productService', '/api/products/low-stock');
  }

  getProductCountByCategory(): Observable<any[]> {
    return this.apiService.get<any[]>('productService', '/api/products/category-counts');
  }

  createProduct(payload: CreateProductRequest): Observable<Product> {
    return this.apiService.post<Product>('productService', '/api/products', payload);
  }

  updateProduct(id: string, payload: Partial<CreateProductRequest>): Observable<Product> {
    return this.apiService.put<Product>('productService', `/api/products/${id}`, payload);
  }

  deleteProduct(id: string): Observable<string> {
    return this.apiService.delete<string>('productService', `/api/products/${id}`);
  }

  // Helper methods for backward compatibility with existing frontend code
  getDiscountedProducts(): Observable<Product[]> {
    return this.getProductsOnSale(0, 50).pipe(
      map(response => response.content)
    );
  }

  // Filter products locally (for quick filtering of already loaded products)
  filterProducts(filters: {
    category?: string;
    organic?: boolean;
    priceRange?: { min: number; max: number };
    inStock?: boolean;
  }): Observable<Product[]> {
    const currentProducts = this.productsSubject.value;
    
    let filtered = currentProducts;

    if (filters.category) {
      filtered = filtered.filter(product => product.category === filters.category);
    }

    if (filters.organic !== undefined) {
      filtered = filtered.filter(product => product.organic === filters.organic);
    }

    if (filters.priceRange) {
      filtered = filtered.filter(product => 
        product.price >= filters.priceRange!.min && 
        product.price <= filters.priceRange!.max
      );
    }

    if (filters.inStock !== undefined) {
      filtered = filtered.filter(product => product.inStock === filters.inStock);
    }

    return of(filtered);
  }

  // Quick search in loaded products
  quickSearch(query: string): Observable<Product[]> {
    const searchTerm = query.toLowerCase();
    const currentProducts = this.productsSubject.value;
    
    const filtered = currentProducts.filter(product =>
      product.name.toLowerCase().includes(searchTerm) ||
      product.description.toLowerCase().includes(searchTerm) ||
      product.category.toLowerCase().includes(searchTerm)
    );

    return of(filtered);
  }

  // Get current loaded products
  getCurrentProducts(): Product[] {
    return this.productsSubject.value;
  }

  // Get current filtered results
  getCurrentFilteredResults(): PageResponse<Product> | null {
    return this.filteredProductsSubject.value;
  }

  // Clear current results
  clearResults(): void {
    this.filteredProductsSubject.next(null);
    this.productsSubject.next([]);
  }
}

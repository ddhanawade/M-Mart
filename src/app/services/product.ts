import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, tap, catchError, of } from 'rxjs';
import { Product } from '../models/product.model';
import { ApiService, PageResponse } from './api.service';

export interface ProductSearchFilters {
  query?: string;
  category?: string;
  subcategory?: string;
  brand?: string;
  farmer?: string;
  season?: string;
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

  private normalizeProduct(dto: any): Product {
    const category = (dto.category || '').toString().toLowerCase();
    const originalPrice = dto.originalPrice != null ? Number(dto.originalPrice) : undefined;
    const price = Number(dto.price);
    const discountFromPrices = originalPrice && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : 0;
    const normalized: Product = {
      id: String(dto.id),
      name: String(dto.name),
      description: String(dto.description || ''),
      price,
      originalPrice,
      category,
      subcategory: dto.subcategory || undefined,
      image: dto.image || '',
      images: Array.isArray(dto.images) ? dto.images : undefined,
      inStock: Boolean(dto.inStock),
      quantity: Number(dto.quantity ?? 0),
      unit: String(dto.unit || ''),
      rating: Number(dto.rating ?? 0),
      reviewCount: Number(dto.reviewCount ?? 0),
      organic: Boolean(dto.organic),
      fresh: Boolean(dto.fresh),
      discount: dto.discount != null ? Number(dto.discount) : discountFromPrices,
      featured: Boolean(dto.featured),
      sku: dto.sku || undefined,
      barcode: dto.barcode || undefined,
      weightKg: dto.weightKg != null ? Number(dto.weightKg) : undefined,
      shelfLifeDays: dto.shelfLifeDays != null ? Number(dto.shelfLifeDays) : undefined,
      storageInstructions: dto.storageInstructions || undefined,
      originCountry: dto.originCountry || undefined,
      supplierName: dto.supplierName || undefined,
      createdAt: dto.createdAt || undefined,
      nutritionalInfo: dto.nutritionalInfo ? {
        calories: dto.nutritionalInfo.caloriesPer100g != null ? Number(dto.nutritionalInfo.caloriesPer100g) : undefined,
        protein: dto.nutritionalInfo.proteinG != null ? Number(dto.nutritionalInfo.proteinG) : undefined,
        carbs: dto.nutritionalInfo.carbsG != null ? Number(dto.nutritionalInfo.carbsG) : undefined,
        fat: dto.nutritionalInfo.fatG != null ? Number(dto.nutritionalInfo.fatG) : undefined,
        fiber: dto.nutritionalInfo.fiberG != null ? Number(dto.nutritionalInfo.fiberG) : undefined,
        vitamins: Array.isArray(dto.nutritionalInfo.vitamins) ? dto.nutritionalInfo.vitamins : undefined,
      } : undefined,
    };
    return normalized;
  }

  private mapPage<T>(page: PageResponse<T>, mapper: (x: any) => T): PageResponse<T> {
    return {
      ...page,
      content: Array.isArray((page as any).content) ? (page as any).content.map(mapper) : [],
    } as PageResponse<T>;
  }

  getAllProducts(page: number = 0, size: number = 20, sortBy: string = 'name', sortDirection: string = 'asc'): Observable<PageResponse<Product>> {
    this.setLoading(true);
    
    const params = { page, size, sortBy, sortDirection };
    
    return this.apiService.get<PageResponse<any>>('productService', '/api/products', params).pipe(
      map(res => this.mapPage<any>(res, (dto) => this.normalizeProduct(dto)) as unknown as PageResponse<Product>),
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
    return this.apiService.get<any>('productService', `/api/products/${id}`).pipe(map(dto => this.normalizeProduct(dto)));
  }

  getProductBySku(sku: string): Observable<Product> {
    return this.apiService.get<any>('productService', `/api/products/sku/${sku}`).pipe(map(dto => this.normalizeProduct(dto)));
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
    if (filters.brand) params.brand = filters.brand;
    if (filters.farmer) params.farmer = filters.farmer;
    if (filters.season) params.season = filters.season;
    if (filters.minPrice !== undefined) params.minPrice = filters.minPrice;
    if (filters.maxPrice !== undefined) params.maxPrice = filters.maxPrice;
    if (filters.minRating !== undefined) params.minRating = filters.minRating;
    if (filters.inStock !== undefined) params.inStock = filters.inStock;
    if (filters.organic !== undefined) params.organic = filters.organic;
    if (filters.fresh !== undefined) params.fresh = filters.fresh;
    if (filters.featured !== undefined) params.featured = filters.featured;

    return this.apiService.get<PageResponse<any>>('productService', '/api/products/search', params).pipe(
      map(res => this.mapPage<any>(res, (dto) => this.normalizeProduct(dto)) as unknown as PageResponse<Product>),
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
    
    return this.apiService.get<PageResponse<any>>('productService', `/api/products/category/${category}`, params).pipe(
      map(res => this.mapPage<any>(res, (dto) => this.normalizeProduct(dto)) as unknown as PageResponse<Product>),
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
    
    return this.apiService.get<PageResponse<any>>('productService', '/api/products/featured', params).pipe(
      map(res => this.mapPage<any>(res, (dto) => this.normalizeProduct(dto)) as unknown as PageResponse<Product>),
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
    
    return this.apiService.get<PageResponse<any>>('productService', '/api/products/organic', params).pipe(
      map(res => this.mapPage<any>(res, (dto) => this.normalizeProduct(dto)) as unknown as PageResponse<Product>),
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
    
    return this.apiService.get<PageResponse<any>>('productService', '/api/products/sale', params).pipe(
      map(res => this.mapPage<any>(res, (dto) => this.normalizeProduct(dto)) as unknown as PageResponse<Product>),
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
    
    return this.apiService.get<PageResponse<any>>('productService', '/api/products/top-rated', params).pipe(
      map(res => this.mapPage<any>(res, (dto) => this.normalizeProduct(dto)) as unknown as PageResponse<Product>),
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
    
    return this.apiService.get<PageResponse<any>>('productService', `/api/products/${productId}/related`, params).pipe(
      map(res => this.mapPage<any>(res, (dto) => this.normalizeProduct(dto)) as unknown as PageResponse<Product>)
    );
  }

  getLowStockProducts(): Observable<Product[]> {
    return this.apiService.get<any[]>('productService', '/api/products/low-stock').pipe(
      map(list => Array.isArray(list) ? list.map(dto => this.normalizeProduct(dto)) : [])
    );
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

  // Reviews
  getProductReviews(productId: string, page: number = 0, size: number = 10): Observable<any[]> {
    return this.apiService.get<any[]>('productService', `/api/products/${productId}/reviews`, { page, size });
  }

  addProductReview(productId: string, review: { userId: string; userName: string; rating: number; title?: string; comment?: string; }): Observable<any> {
    return this.apiService.post<any>('productService', `/api/products/${productId}/reviews`, review);
  }

  getProductsByIds(ids: string[]): Observable<Product[]> {
    return this.apiService.post<any[]>('productService', `/api/products/by-ids`, ids).pipe(
      map(list => Array.isArray(list) ? list.map(dto => this.normalizeProduct(dto)) : [])
    );
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

import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ProductService, ProductSearchFilters } from '../../services/product';
import { Product } from '../../models/product.model';
import { ProductCard } from '../../components/product-card/product-card';
import { PageResponse } from '../../services/api.service';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ProductCard],
  templateUrl: './products.html',
  styleUrl: './products.scss'
})
export class Products implements OnInit, OnDestroy {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  featuredProducts: Product[] = [];
  categories: string[] = [];
  
  selectedCategory: string = '';
  searchQuery: string = '';
  sortBy: string = 'name';
  
  showOnlyOrganic: boolean = false;
  showOnlyDiscounted: boolean = false;
  showOnlyInStock: boolean = false;
  
  isLoading: boolean = true;
  totalProducts: number = 0;
  categoriesCount: number = 5;
  hasMoreProducts: boolean = false;
  
  // Mobile filter drawer state
  isMobileFiltersOpen: boolean = false;
  
  // Pagination
  currentPage: number = 0;
  pageSize: number = 20;
  totalPages: number = 0;
  
  private productService = inject(ProductService);
  public route = inject(ActivatedRoute);
  public router = inject(Router);
  
  private subscriptions: Subscription[] = [];

  ngOnInit() {
    // Get category from route params
    const routeSubscription = this.route.params.subscribe(params => {
      this.selectedCategory = params['category'] || '';
      this.loadProducts();
    });
    this.subscriptions.push(routeSubscription);

    // Read search query from query params (e.g., from Farmers/Brands/Seasonal pages)
    const querySub = this.route.queryParams.subscribe(qp => {
      const q = (qp['q'] || qp['query'] || '').toString();
      const brand = (qp['brand'] || '').toString();
      const farmer = (qp['farmer'] || '').toString();
      const season = (qp['season'] || '').toString();
      if (brand || farmer || season || q) {
        this.searchQuery = q;
        this.isLoading = true;
        const filters: ProductSearchFilters = {
          query: q || undefined,
          brand: brand || undefined,
          farmer: farmer || undefined,
          season: season || undefined,
          page: 0,
          size: this.pageSize,
          sortBy: this.sortBy,
          sortDirection: 'asc'
        };
        this.productService.searchProducts(filters).subscribe({
          next: (response) => this.handleProductResponse(response),
          error: () => { this.isLoading = false; }
        });
      }
    });
    this.subscriptions.push(querySub);
    
    // Load featured products
    this.loadFeaturedProducts();

    // Keep dynamic categories count updated from backend
    const categoriesSub = this.productService.categories$.subscribe(list => {
      if (Array.isArray(list)) {
        this.categoriesCount = list.length;
        this.categories = list
          .map(c => (c || '').toString().toLowerCase())
          .filter(Boolean)
          .filter((v, i, a) => a.indexOf(v) === i)
          .sort();
      }
    });
    this.subscriptions.push(categoriesSub);
  }

  // Mobile filters drawer controls
  openMobileFilters() {
    this.isMobileFiltersOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeMobileFilters() {
    this.isMobileFiltersOpen = false;
    document.body.style.overflow = '';
  }

  toggleMobileFilters() {
    this.isMobileFiltersOpen ? this.closeMobileFilters() : this.openMobileFilters();
  }

  getActiveFiltersCount(): number {
    let count = 0;
    if (this.selectedCategory) count++;
    if (this.searchQuery) count++;
    if (this.showOnlyOrganic) count++;
    if (this.showOnlyDiscounted) count++;
    if (this.showOnlyInStock) count++;
    return count;
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadProducts() {
    this.isLoading = true;
    
    if (this.selectedCategory) {
      // Load products by category
      const categorySubscription = this.productService.getProductsByCategory(
        this.selectedCategory, 
        this.currentPage, 
        this.pageSize
      ).subscribe({
        next: (response) => {
          this.handleProductResponse(response);
        },
        error: (error) => {
          console.error('Error loading products by category:', error);
          this.isLoading = false;
        }
      });
      this.subscriptions.push(categorySubscription);
    } else {
      // Load all products
      const allProductsSubscription = this.productService.getAllProducts(
        this.currentPage, 
        this.pageSize, 
        this.sortBy, 
        'asc'
      ).subscribe({
        next: (response) => {
          this.handleProductResponse(response);
        },
        error: (error) => {
          console.error('Error loading products:', error);
          this.isLoading = false;
        }
      });
      this.subscriptions.push(allProductsSubscription);
    }
  }

  loadFeaturedProducts() {
    const featuredSubscription = this.productService.getFeaturedProducts(0, 8).subscribe({
      next: (response) => {
        this.featuredProducts = response.content;
      },
      error: (error) => {
        console.error('Error loading featured products:', error);
        this.featuredProducts = [];
      }
    });
    this.subscriptions.push(featuredSubscription);
  }

  private handleProductResponse(response: PageResponse<Product>) {
    this.products = response.content;
    this.filteredProducts = response.content;
    this.totalProducts = response.totalElements;
    this.totalPages = response.totalPages;
    this.hasMoreProducts = !response.last;
    this.isLoading = false;
    
    // Apply client-side filters if any
    this.applyFilters();
  }

  getCategoryDisplayName(): string {
    const categoryNames: { [key: string]: string } = {
      'fruits': 'Fresh Fruits',
      'vegetables': 'Fresh Vegetables', 
      'organic': 'Organic Products',
      'groceries': 'Groceries & Essentials'
    };
    if (!this.selectedCategory) return 'All Products';
    return categoryNames[this.selectedCategory] || this.toTitleCase(this.selectedCategory);
  }

  getCategoryDescription(): string {
    const descriptions: { [key: string]: string } = {
      'fruits': 'Sweet, juicy, and fresh fruits directly from local farms',
      'vegetables': 'Farm-fresh vegetables for healthy and nutritious meals',
      'organic': 'Chemical-free, naturally grown organic products',
      'groceries': 'Daily essentials and pantry staples for your kitchen',
      '': 'Discover our wide range of fresh, organic, and quality products'
    };
    return descriptions[this.selectedCategory] || `Explore our best ${this.toTitleCase(this.selectedCategory)} selections`;
  }

  private toTitleCase(value: string): string {
    return (value || '')
      .split(/[-_\s]+/)
      .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
      .join(' ');
  }

  filterByCategory(category: string) {
    this.selectedCategory = category;
    this.currentPage = 0; // Reset to first page
    this.loadProducts();
  }

  toggleOrganicFilter() {
    this.showOnlyOrganic = !this.showOnlyOrganic;
    this.onFilterChange();
  }

  toggleDiscountFilter() {
    this.showOnlyDiscounted = !this.showOnlyDiscounted;
    this.onFilterChange();
  }

  toggleStockFilter() {
    this.showOnlyInStock = !this.showOnlyInStock;
    this.onFilterChange();
  }

  onSearch() {
    this.currentPage = 0; // Reset to first page
    this.searchProducts();
  }

  clearAllFilters() {
    this.selectedCategory = '';
    this.searchQuery = '';
    this.showOnlyOrganic = false;
    this.showOnlyDiscounted = false;
    this.showOnlyInStock = false;
    this.sortBy = 'name';
    this.currentPage = 0;
    this.loadProducts();
  }

  hasActiveFilters(): boolean {
    return this.selectedCategory !== '' || 
           this.searchQuery !== '' || 
           this.showOnlyOrganic || 
           this.showOnlyDiscounted || 
           this.showOnlyInStock;
  }


  trackByProductId(index: number, product: Product): string {
    return product.id;
  }

  searchProducts() {
    if (this.searchQuery.trim()) {
      this.isLoading = true;
      
      const searchFilters: ProductSearchFilters = {
        query: this.searchQuery,
        category: this.selectedCategory || undefined,
        page: 0,
        size: this.pageSize,
        sortBy: this.sortBy,
        sortDirection: 'asc',
        organic: this.showOnlyOrganic || undefined,
        inStock: this.showOnlyInStock || undefined
      };

      const searchSubscription = this.productService.searchProducts(searchFilters).subscribe({
        next: (response) => {
          this.handleProductResponse(response);
        },
        error: (error) => {
          console.error('Error searching products:', error);
          this.isLoading = false;
        }
      });
      this.subscriptions.push(searchSubscription);
    } else {
      this.loadProducts();
    }
  }

  applyFilters() {
    let filtered = [...this.products];

    if (this.showOnlyOrganic) {
      filtered = filtered.filter(product => product.organic);
    }

    if (this.showOnlyDiscounted) {
      filtered = filtered.filter(product => product.discount && product.discount > 0);
    }

    if (this.showOnlyInStock) {
      filtered = filtered.filter(product => product.inStock);
    }

    // Sort products
    this.sortProducts(filtered);
    this.filteredProducts = filtered;
  }

  sortProducts(products: Product[]) {
    products.sort((a, b) => {
      switch (this.sortBy) {
        case 'price_low':
        case 'price-low':
          return a.price - b.price;
        case 'price_high':
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return b.rating - a.rating;
        case 'discount': {
          const discA = (a.discount ?? (a.originalPrice ? Math.round(((a.originalPrice - a.price) / a.originalPrice) * 100) : 0)) || 0;
          const discB = (b.discount ?? (b.originalPrice ? Math.round(((b.originalPrice - b.price) / b.originalPrice) * 100) : 0)) || 0;
          return discB - discA;
        }
        case 'newest': {
          const timeA = (a as any)?.createdAt ? new Date((a as any).createdAt).getTime() : 0;
          const timeB = (b as any)?.createdAt ? new Date((b as any).createdAt).getTime() : 0;
          return timeB - timeA;
        }
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }

  onSortChange() {
    this.applyFilters();
  }

  onFilterChange() {
    this.applyFilters();
  }

  nextPage() {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadProducts();
    }
  }

  prevPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadProducts();
    }
  }

  goToPage(page: number) {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadProducts();
    }
  }

  clearSearch() {
    this.searchQuery = '';
    this.onSearch();
  }

  loadMore() {
    this.currentPage++;
    this.loadProducts();
  }
}

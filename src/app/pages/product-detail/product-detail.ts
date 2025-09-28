import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ProductService } from '../../services/product';
import { WishlistService } from '../../services/wishlist';
import { CartService } from '../../services/cart';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, RouterModule, FormsModule],
  templateUrl: './product-detail.html',
  styleUrls: ['./product-detail.scss']
})
export class ProductDetail implements OnInit, OnDestroy {
  product: Product | null = null;
  relatedProducts: Product[] = [];
  selectedImage: string = '';
  quantity: number = 1;
  isLoading: boolean = true;
  isAddingToCart: boolean = false;
  isLightboxOpen: boolean = false;
  isDeleting: boolean = false;
  reviews: any[] = [];
  reviewForm = {
    rating: 5,
    title: '',
    comment: ''
  };
  isSubmittingReview: boolean = false;
  isInWishlist: boolean = false;
  hoveredRating: number | null = null;
  
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private wishlist = inject(WishlistService);
  
  private subscriptions: Subscription[] = [];

  ngOnInit() {
    const routeSubscription = this.route.params.subscribe(params => {
      const productId = params['id'];
      if (productId) {
        this.loadProduct(productId);
      }
    });
    this.subscriptions.push(routeSubscription);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadProduct(productId: string) {
    this.isLoading = true;
    
    // Get product by ID
    const productSubscription = this.productService.getProductById(productId).subscribe({
      next: (product) => {
        this.product = product;
        if (product) {
          this.selectedImage = product.image;
          this.loadRelatedProducts(product.category, product.id);
          this.loadReviews(product.id);
          this.isInWishlist = this.wishlist.has(product.id);
        } else {
          console.error('Product not found');
          this.router.navigate(['/products']);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading product:', error);
        this.isLoading = false;
        this.router.navigate(['/products']);
      }
    });
    this.subscriptions.push(productSubscription);
  }

  loadReviews(productId: string) {
    const sub = this.productService.getProductReviews(productId, 0, 10).subscribe({
      next: (list) => this.reviews = list,
      error: () => this.reviews = []
    });
    this.subscriptions.push(sub);
  }

  loadRelatedProducts(category: string, currentProductId: string) {
    // Get products by category and filter out current product
    const relatedSubscription = this.productService.getProductsByCategory(category, 0, 8).subscribe({
      next: (response) => {
        this.relatedProducts = response.content
          .filter(p => p.id !== currentProductId)
          .slice(0, 4);
      },
      error: (error) => {
        console.error('Error loading related products:', error);
        this.relatedProducts = [];
      }
    });
    this.subscriptions.push(relatedSubscription);
  }

  selectImage(image: string) {
    this.selectedImage = image;
  }

  increaseQuantity() {
    if (this.product && this.quantity < this.product.quantity) {
      this.quantity++;
    }
  }

  decreaseQuantity() {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  addToCart() {
    if (!this.product) return;
    
    this.isAddingToCart = true;
    
    const addToCartSubscription = this.cartService.addToCart(this.product, this.quantity).subscribe({
      next: () => {
        console.log('Added to cart successfully');
        this.isAddingToCart = false;
        // You might want to show a success message here
      },
      error: (error) => {
        console.error('Error adding to cart:', error);
        this.isAddingToCart = false;
        // You might want to show an error message here
      }
    });
    this.subscriptions.push(addToCartSubscription);
  }

  buyNow() {
    if (!this.product) return;
    
    this.isAddingToCart = true;
    
    const addToCartSubscription = this.cartService.addToCart(this.product, this.quantity).subscribe({
      next: () => {
        console.log('Added to cart successfully');
        this.isAddingToCart = false;
        this.router.navigate(['/cart']);
      },
      error: (error) => {
        console.error('Error adding to cart:', error);
        this.isAddingToCart = false;
      }
    });
    this.subscriptions.push(addToCartSubscription);
  }

  editProduct() {
    if (!this.product) return;
    this.router.navigate(['/create-product'], { queryParams: { id: this.product.id } });
  }

  deleteProduct() {
    if (!this.product || this.isDeleting) return;
    const confirmed = confirm('Are you sure you want to delete this product?');
    if (!confirmed) return;
    this.isDeleting = true;
    this.productService.deleteProduct(this.product.id).subscribe({
      next: () => {
        this.isDeleting = false;
        this.router.navigate(['/products']);
      },
      error: (e) => {
        console.error('Failed to delete product', e);
        this.isDeleting = false;
      }
    });
  }

  submitReview() {
    if (!this.product || this.isSubmittingReview) return;
    this.isSubmittingReview = true;
    const payload = {
      userId: 'guest',
      userName: 'Guest',
      rating: Number(this.reviewForm.rating),
      title: this.reviewForm.title || undefined,
      comment: this.reviewForm.comment || undefined
    };
    const sub = this.productService.addProductReview(this.product.id, payload).subscribe({
      next: () => {
        this.isSubmittingReview = false;
        this.reviewForm = { rating: 5, title: '', comment: '' };
        this.loadReviews(this.product!.id);
      },
      error: () => {
        this.isSubmittingReview = false;
      }
    });
    this.subscriptions.push(sub);
  }

  goBack() {
    window.history.back();
  }

  getStars(): boolean[] {
    const rating = this.product?.rating || 0;
    return Array(5).fill(false).map((_, i) => i < Math.floor(rating));
  }

  getCategoryDisplayName(): string {
    if (!this.product) return '';
    
    const categoryMap: { [key: string]: string } = {
      'fruits': 'Fresh Fruits',
      'vegetables': 'Vegetables', 
      'organic': 'Organic Products',
      'groceries': 'Groceries'
    };
    
    return categoryMap[this.product.category] || this.product.category;
  }

  getCategoryIcon(): string {
    if (!this.product) return 'assets/images/icons/package.svg';
    
    const iconMap: { [key: string]: string } = {
      'fruits': 'assets/images/icons/apple.svg',
      'vegetables': 'assets/images/icons/vegetables.svg',
      'organic': 'assets/images/icons/organic.svg',
      'groceries': 'assets/images/icons/groceries.svg'
    };
    
    return iconMap[this.product.category] || 'assets/images/icons/package.svg';
  }

  getDiscountPercentage(): number {
    if (!this.product?.originalPrice) return 0;
    return Math.round(((this.product.originalPrice - this.product.price) / this.product.originalPrice) * 100);
  }

  navigateToProduct(productId: string) {
    this.router.navigate(['/product', productId]);
  }

  openLightbox() {
    this.isLightboxOpen = true;
  }

  closeLightbox(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.isLightboxOpen = false;
  }

  toggleWishlist() {
    if (!this.product) return;
    this.wishlist.toggle(this.product.id);
    this.isInWishlist = this.wishlist.has(this.product.id);
  }

  getShareUrl(): string {
    const name = this.product?.name || '';
    const img = this.product?.image || '';
    const text = `${name} - ${img}`;
    return 'https://wa.me/?text=' + encodeURIComponent(text);
  }

  // Review star rating interactions
  getActiveRating(): number {
    return this.hoveredRating != null ? this.hoveredRating : this.reviewForm.rating;
  }

  setRating(value: number) {
    this.reviewForm.rating = value;
  }

  onStarEnter(value: number) {
    this.hoveredRating = value;
  }

  onStarLeave() {
    this.hoveredRating = null;
  }

  getSupplierName(): string {
    return ((this.product as any)?.supplierName) || 'Mahabaleshwer Mart Sellers';
  }

  getOriginCountry(): string {
    return ((this.product as any)?.originCountry) || 'India';
  }

  getEstimatedDelivery(): string {
    // Simple ETA: 2-4 days
    const today = new Date();
    const min = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);
    const max = new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000);
    const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return `${fmt(min)} - ${fmt(max)}`;
  }

  getSpecs(): Array<{ label: string; value: string }> {
    const p: any = this.product || {};
    const specs: Array<{ label: string; value: string }> = [];
    if (p.sku) specs.push({ label: 'SKU', value: String(p.sku) });
    if (p.unit) specs.push({ label: 'Unit', value: String(p.unit) });
    if (p.weightKg) specs.push({ label: 'Weight', value: `${p.weightKg} kg` });
    if (p.shelfLifeDays) specs.push({ label: 'Shelf Life', value: `${p.shelfLifeDays} days` });
    if (p.storageInstructions) specs.push({ label: 'Storage', value: String(p.storageInstructions) });
    return specs;
  }
} 
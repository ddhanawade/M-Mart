import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ProductService } from '../../services/product';
import { CartService } from '../../services/cart';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.scss'
})
export class ProductDetail implements OnInit, OnDestroy {
  product: Product | null = null;
  relatedProducts: Product[] = [];
  selectedImage: string = '';
  quantity: number = 1;
  isLoading: boolean = true;
  isAddingToCart: boolean = false;
  isLightboxOpen: boolean = false;
  
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  
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
} 
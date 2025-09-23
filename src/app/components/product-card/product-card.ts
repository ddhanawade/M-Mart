import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Product } from '../../models/product.model';
import { CartService } from '../../services/cart';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss'
})
export class ProductCard {
  @Input() product!: Product;
  
  quantity: number = 1;
  isAddingToCart: boolean = false;
  
  private cartService = inject(CartService);
  private router = inject(Router);

  increaseQuantity() {
    if (this.quantity < this.product.quantity) {
      this.quantity++;
    }
  }

  decreaseQuantity() {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  addToCart() {
    if (this.isAddingToCart) return; // Prevent multiple clicks
    
    this.isAddingToCart = true;
    
    this.cartService.addToCart(this.product, this.quantity).subscribe({
      next: (cartItem) => {
        console.log('Added to cart successfully:', cartItem);
        this.isAddingToCart = false;
        // Reset quantity after successful add
        this.quantity = 1;
      },
      error: (error) => {
        console.error('Error adding to cart:', error);
        this.isAddingToCart = false;
        // You might want to show an error message to the user here
      }
    });
  }

  onCardClick(event: Event) {
    // Prevent navigation if clicking on interactive elements
    const target = event.target as HTMLElement;
    const isInteractive = target.closest('button, .quantity-selector, .add-to-cart-btn, .quick-btn');
    
    if (!isInteractive) {
      this.navigateToProductDetail();
    }
  }

  navigateToProductDetail() {
    this.router.navigate(['/product', this.product.id]);
  }

  getStars(): boolean[] {
    const rating = this.product.rating || 0;
    return Array(5).fill(false).map((_, i) => i < Math.floor(rating));
  }

  getDiscountPercentage(): number {
    if (!this.product.originalPrice) return 0;
    return Math.round(((this.product.originalPrice - this.product.price) / this.product.originalPrice) * 100);
  }

  toggleWishlist() {
    // You could implement wishlist functionality here
    console.log('Toggle wishlist for', this.product.name);
  }

  quickView() {
    // You could open a modal or navigate to product details
    this.navigateToProductDetail();
  }

  isUrl(value: string | undefined | null): boolean {
    if (!value) return false;
    return /^(https?:)?\/\//i.test(value);
  }
}

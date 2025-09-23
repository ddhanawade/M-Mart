import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CartService, CartSummary } from '../../services/cart';
import { AuthService } from '../../services/auth';
import { CartItem } from '../../models/cart-item.model';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cart.html',
  styleUrl: './cart.scss'
})
export class Cart implements OnInit, OnDestroy {
  cartItems: CartItem[] = [];
  cartSummary: CartSummary | null = null;
  totalAmount: number = 0;
  totalItems: number = 0;
  isLoggedIn: boolean = false;
  isLoading: boolean = false;
  
  // Make Math available in template
  Math = Math;
  
  private cartService = inject(CartService);
  private authService = inject(AuthService);
  private router = inject(Router);
  
  private subscriptions: Subscription[] = [];

  ngOnInit() {
    // Subscribe to cart summary changes
    const cartSummarySubscription = this.cartService.cartSummary$.subscribe(summary => {
      this.cartSummary = summary;
      this.cartItems = summary.items;
      this.totalAmount = summary.total;
      this.totalItems = summary.totalItems;
    });
    this.subscriptions.push(cartSummarySubscription);

    // Subscribe to loading state
    const loadingSubscription = this.cartService.loading$.subscribe(loading => {
      this.isLoading = loading;
    });
    this.subscriptions.push(loadingSubscription);

    // Check authentication status
    const authSubscription = this.authService.isLoggedIn$.subscribe(isLoggedIn => {
      this.isLoggedIn = isLoggedIn;
    });
    this.subscriptions.push(authSubscription);

    // Load cart data on page entry only (not at app start)
    this.cartService.loadCart().subscribe();
  }

  ngOnDestroy() {
    // Clean up subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  updateQuantity(itemId: string, newQuantity: number) {
    if (newQuantity > 0) {
      this.cartService.updateQuantity(itemId, newQuantity).subscribe({
        next: () => {
          console.log('Quantity updated successfully');
        },
        error: (error) => {
          console.error('Error updating quantity:', error);
        }
      });
    } else {
      this.removeItem(itemId);
    }
  }

  removeItem(itemId: string) {
    this.cartService.removeFromCart(itemId).subscribe({
      next: () => {
        console.log('Item removed successfully');
      },
      error: (error) => {
        console.error('Error removing item:', error);
      }
    });
  }

  clearCart() {
    if (confirm('Are you sure you want to remove all items from your cart?')) {
      this.cartService.clearCart().subscribe({
        next: () => {
          console.log('Cart cleared successfully');
        },
        error: (error) => {
          console.error('Error clearing cart:', error);
        }
      });
    }
  }

  increaseQuantity(itemId: string) {
    const item = this.cartItems.find(item => item.id === itemId);
    if (item && item.selectedQuantity < item.product.quantity) {
      this.updateQuantity(itemId, item.selectedQuantity + 1);
    }
  }

  decreaseQuantity(itemId: string) {
    const item = this.cartItems.find(item => item.id === itemId);
    if (item && item.selectedQuantity > 1) {
      this.updateQuantity(itemId, item.selectedQuantity - 1);
    }
  }

  getDeliveryCharge(): number {
    if (this.cartSummary && typeof this.cartSummary.deliveryCharge === 'number') {
      return this.cartSummary.deliveryCharge;
    }
    // Fallback to local calculation if summary missing
    return this.totalAmount >= 500 ? 0 : 50;
  }

  getTotalWithDelivery(): number {
    if (this.cartSummary && typeof this.cartSummary.total === 'number') {
      return this.cartSummary.total;
    }
    return this.totalAmount + this.getDeliveryCharge();
  }

  getSavingsAmount(): number {
    return this.cartItems.reduce((total, item) => {
      const originalPrice = item.product.originalPrice || item.product.price;
      const savings = (originalPrice - item.product.price) * item.selectedQuantity;
      return total + savings;
    }, 0);
  }

  trackByItemId(index: number, item: CartItem): string {
    return item.id;
  }

  onCheckoutClick() {
    if (!this.isLoggedIn) {
      // Redirect to login with return URL
      this.router.navigate(['/auth'], { 
        queryParams: { returnUrl: '/checkout' } 
      });
      return;
    }
    // Navigation will be handled by routerLink when logged in
  }

  getDiscountPercentage(item: CartItem): number {
    if (!item.product.originalPrice) return 0;
    return Math.round(((item.product.originalPrice - item.product.price) / item.product.originalPrice) * 100);
  }
}

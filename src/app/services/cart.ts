import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap, catchError, of, map } from 'rxjs';
import { CartItem } from '../models/cart-item.model';
import { Product } from '../models/product.model';
import { ApiService } from './api.service';
import { AuthService } from './auth';

export interface CartSummary {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  total: number;
  isValid: boolean;
  validationMessages: string[];
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItemsSubject = new BehaviorSubject<CartItem[]>([]);
  private cartSummarySubject = new BehaviorSubject<CartSummary>({
    items: [],
    totalItems: 0,
    subtotal: 0,
    deliveryCharge: 0,
    discount: 0,
    total: 0,
    isValid: true,
    validationMessages: []
  });
  private loadingSubject = new BehaviorSubject<boolean>(false);

  public cartItems$ = this.cartItemsSubject.asObservable();
  public cartSummary$ = this.cartSummarySubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  // Keep backward compatibility
  public totalAmount$ = this.cartSummary$.pipe(
    tap(summary => summary.total)
  );

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {
    // Load cart when service initializes
    this.loadCart();
    
    // Listen to auth changes to transfer guest cart to user
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.transferGuestCartToUser();
      }
    });
  }

  private setLoading(loading: boolean) {
    this.loadingSubject.next(loading);
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('guestCartSession');
    if (!sessionId) {
      sessionId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('guestCartSession', sessionId);
    }
    return sessionId;
  }

  private updateCartSummary(cartSummary: any) {
    // Map backend DTO shape to frontend model if needed
    const rawItems: any[] = Array.isArray(cartSummary?.items) ? cartSummary.items : [];
    const mappedItems: CartItem[] = rawItems.map((it: any) => {
      if (it && it.productName !== undefined) {
        // Backend CartItemDto → Frontend CartItem
        const product: Product = {
          id: it.productId,
          name: it.productName,
          description: '',
          price: Number(it.productPrice ?? 0),
          originalPrice: it.originalPrice != null ? Number(it.originalPrice) : undefined,
          category: (it.productCategory ?? 'groceries') as any,
          subcategory: undefined,
          image: it.productImage,
          images: undefined,
          inStock: Boolean(it.available ?? true),
          quantity: Number(it.quantity ?? 0),
          unit: it.productUnit ?? '',
          rating: 0,
          reviewCount: 0,
          organic: Boolean(it.organic ?? false),
          fresh: Boolean(it.fresh ?? false),
          discount: undefined
        };

        const mapped: CartItem = {
          id: it.id,
          product,
          quantity: Number(it.quantity ?? 0),
          selectedQuantity: Number(it.selectedQuantity ?? it.quantity ?? 0),
          totalPrice: Number(it.totalPrice ?? (product.price * (it.selectedQuantity ?? it.quantity ?? 0))),
          addedAt: it.addedAt ? new Date(it.addedAt) : new Date()
        };
        return mapped;
      }
      // Assume it's already in frontend shape
      return it as CartItem;
    });

    const normalized: CartSummary = {
      items: mappedItems,
      // Prefer backend totals if provided
      totalItems: Number(cartSummary?.totalItems ?? (Array.isArray(mappedItems) ? mappedItems.length : 0)),
      subtotal: Number(cartSummary?.subtotal ?? 0),
      deliveryCharge: Number(cartSummary?.deliveryCharge ?? 0),
      // Map backend totalSavings → discount
      discount: Number(cartSummary?.totalSavings ?? cartSummary?.discount ?? 0),
      // Map backend totalAmount → total
      total: Number(cartSummary?.totalAmount ?? cartSummary?.total ?? 0),
      isValid: cartSummary?.isValid ?? true,
      validationMessages: Array.isArray(cartSummary?.validationMessages) ? cartSummary.validationMessages : []
    };

    this.cartItemsSubject.next(normalized.items);
    this.cartSummarySubject.next(normalized);
  }

  loadCart(): Observable<CartSummary> {
    this.setLoading(true);
    // Always hit unified endpoint which handles both user and guest via session/auth
    return this.apiService.get<CartSummary>('cartService', '/api/cart').pipe(
      tap(cartSummary => {
        this.updateCartSummary(cartSummary);
        this.setLoading(false);
      }),
      catchError(error => {
        console.error('Error loading cart:', error);
        this.setLoading(false);
        const emptyCart: CartSummary = {
          items: [],
          totalItems: 0,
          subtotal: 0,
          deliveryCharge: 0,
          discount: 0,
          total: 0,
          isValid: true,
          validationMessages: []
        };
        this.updateCartSummary(emptyCart);
        return of(emptyCart);
      })
    );
  }

  private getUserCart(): Observable<CartSummary> {
    return this.apiService.get<CartSummary>('cartService', '/api/cart').pipe(
      tap(cartSummary => {
        this.updateCartSummary(cartSummary);
        this.setLoading(false);
      }),
      catchError(error => {
        console.error('Error loading user cart:', error);
        this.setLoading(false);
        const emptyCart: CartSummary = {
          items: [],
          totalItems: 0,
          subtotal: 0,
          deliveryCharge: 0,
          discount: 0,
          total: 0,
          isValid: true,
          validationMessages: []
        };
        this.updateCartSummary(emptyCart);
        return of(emptyCart);
      })
    );
  }

  private getGuestCart(): Observable<CartSummary> {
    return this.apiService.get<CartSummary>('cartService', '/api/cart/guest', {
      sessionId: this.getSessionId()
    }).pipe(
      tap(cartSummary => {
        this.updateCartSummary(cartSummary);
        this.setLoading(false);
      }),
      catchError(error => {
        console.error('Error loading guest cart:', error);
        this.setLoading(false);
        const emptyCart: CartSummary = {
          items: [],
          totalItems: 0,
          subtotal: 0,
          deliveryCharge: 0,
          discount: 0,
          total: 0,
          isValid: true,
          validationMessages: []
        };
        this.updateCartSummary(emptyCart);
        return of(emptyCart);
      })
    );
  }

  addToCart(product: Product, quantity: number = 1): Observable<CartItem> {
    this.setLoading(true);
    
    const request = {
      productId: product.id,
      quantity: quantity,
      sessionId: this.authService.isAuthenticated() ? undefined : this.getSessionId()
    };

    return this.apiService.post<CartItem>('cartService', '/api/cart/add', request).pipe(
      tap(() => {
        // Reload cart to get updated summary
        this.loadCart().subscribe();
        this.setLoading(false);
      }),
      catchError(error => {
        console.error('Error adding to cart:', error);
        this.setLoading(false);
        throw error;
      })
    );
  }

  updateQuantity(itemId: string, newQuantity: number): Observable<CartItem> {
    if (newQuantity <= 0) {
      return this.removeFromCart(itemId).pipe(
        map(() => ({} as CartItem))
      );
    }

    this.setLoading(true);

    return this.apiService.put<CartItem>('cartService', `/api/cart/items/${itemId}/quantity`, {
      quantity: newQuantity
    }).pipe(
      tap(() => {
        // Reload cart to get updated summary
        this.loadCart().subscribe();
        this.setLoading(false);
      }),
      catchError(error => {
        console.error('Error updating cart item quantity:', error);
        this.setLoading(false);
        throw error;
      })
    );
  }

  removeFromCart(itemId: string): Observable<void> {
    this.setLoading(true);

    return this.apiService.delete<void>('cartService', `/api/cart/items/${itemId}`).pipe(
      tap(() => {
        // Reload cart to get updated summary
        this.loadCart().subscribe();
        this.setLoading(false);
      }),
      catchError(error => {
        console.error('Error removing from cart:', error);
        this.setLoading(false);
        throw error;
      })
    );
  }

  clearCart(): Observable<void> {
    this.setLoading(true);

    return this.apiService.delete<void>('cartService', '/api/cart/clear').pipe(
      tap(() => {
        const emptyCart: CartSummary = {
          items: [],
          totalItems: 0,
          subtotal: 0,
          deliveryCharge: 0,
          discount: 0,
          total: 0,
          isValid: true,
          validationMessages: []
        };
        this.updateCartSummary(emptyCart);
        this.setLoading(false);
      }),
      catchError(error => {
        console.error('Error clearing cart:', error);
        this.setLoading(false);
        throw error;
      })
    );
  }

  getCartItemCount(): Observable<number> {
    return this.apiService.get<number>('cartService', '/api/cart/count').pipe(
      catchError(error => {
        console.error('Error getting cart item count:', error);
        return of(0);
      })
    );
  }

  validateCart(): Observable<CartSummary> {
    this.setLoading(true);

    return this.apiService.post<CartSummary>('cartService', '/api/cart/validate', {}).pipe(
      tap(cartSummary => {
        this.updateCartSummary(cartSummary);
        this.setLoading(false);
      }),
      catchError(error => {
        console.error('Error validating cart:', error);
        this.setLoading(false);
        throw error;
      })
    );
  }

  private transferGuestCartToUser(): Observable<CartSummary> {
    const sessionId = sessionStorage.getItem('guestCartSession');
    
    if (!sessionId) {
      return of(this.cartSummarySubject.value);
    }

    return this.apiService.post<CartSummary>('cartService', '/api/cart/transfer', {
      sessionId: sessionId,
      userId: this.authService.getCurrentUser()?.id,
      mergeWithExisting: true
    }).pipe(
      tap(cartSummary => {
        this.updateCartSummary(cartSummary);
        // Clear guest session after successful transfer
        sessionStorage.removeItem('guestCartSession');
      }),
      catchError(error => {
        console.error('Error transferring guest cart:', error);
        return of(this.cartSummarySubject.value);
      })
    );
  }

  // Backward compatibility methods
  getCartItems(): CartItem[] {
    return this.cartItemsSubject.value;
  }

  getTotalAmount(): number {
    return this.cartSummarySubject.value.total;
  }

  isInCart(productId: string): boolean {
    return this.cartItemsSubject.value.some(item => item.product.id === productId);
  }

  // Get current cart summary
  getCurrentCartSummary(): CartSummary {
    return this.cartSummarySubject.value;
  }

  // Get cart item by product ID
  getCartItemByProductId(productId: string): CartItem | undefined {
    return this.cartItemsSubject.value.find(item => item.product.id === productId);
  }

  // Apply coupon/discount
  applyCoupon(couponCode: string): Observable<CartSummary> {
    return this.apiService.post<CartSummary>('cartService', '/api/cart/apply-coupon', {
      couponCode: couponCode
    }).pipe(
      tap(cartSummary => {
        this.updateCartSummary(cartSummary);
      }),
      catchError(error => {
        console.error('Error applying coupon:', error);
        throw error;
      })
    );
  }

  // Remove coupon/discount
  removeCoupon(): Observable<CartSummary> {
    return this.apiService.post<CartSummary>('cartService', '/api/cart/remove-coupon', {}).pipe(
      tap(cartSummary => {
        this.updateCartSummary(cartSummary);
      }),
      catchError(error => {
        console.error('Error removing coupon:', error);
        throw error;
      })
    );
  }
}

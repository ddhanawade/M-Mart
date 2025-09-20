import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, tap, map, catchError, of } from 'rxjs';
import { Order, OrderItem, OrderSummary, OrderTimeline } from '../models/order.model';
import { CartItem } from '../models/cart-item.model';
import { User, Address } from '../models/user.model';
import { AuthService } from './auth';
import { ApiService, PageResponse } from './api.service';

export interface CreateOrderRequest {
  deliveryAddress: CreateOrderAddressRequest;
  payment: CreateOrderPaymentRequest;
  specialInstructions?: string;
}

export interface CreateOrderAddressRequest {
  addressType: string;
  addressName: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  contactName?: string;
  contactPhone?: string;
  deliveryInstructions?: string;
}

export interface CreateOrderPaymentRequest {
  paymentMethod: string;
  paymentGateway?: string;
  cardToken?: string;
  upiId?: string;
  bankCode?: string;
}

export interface OrderStatistics {
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private ordersSubject = new BehaviorSubject<Order[]>([]);
  private orderSummarySubject = new BehaviorSubject<OrderSummary>({
    totalOrders: 0,
    activeOrders: 0,
    completedOrders: 0,
    totalSpent: 0
  });
  private loadingSubject = new BehaviorSubject<boolean>(false);

  public orders$ = this.ordersSubject.asObservable();
  public orderSummary$ = this.orderSummarySubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  private authService = inject(AuthService);

  constructor(private apiService: ApiService) {
    // Listen to auth changes to load user orders
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.loadUserOrders();
      } else {
        // Clear orders when user logs out
        this.ordersSubject.next([]);
        this.orderSummarySubject.next({
          totalOrders: 0,
          activeOrders: 0,
          completedOrders: 0,
          totalSpent: 0
        });
      }
    });
  }

  private setLoading(loading: boolean) {
    this.loadingSubject.next(loading);
  }

  private updateOrderSummary(orders: Order[]) {
    const summary: OrderSummary = {
      totalOrders: orders.length,
      activeOrders: orders.filter(o => ['pending', 'confirmed', 'processing', 'shipped'].includes(o.status)).length,
      completedOrders: orders.filter(o => o.status === 'delivered').length,
      totalSpent: orders.filter(o => o.paymentStatus === 'paid').reduce((sum, o) => sum + o.total, 0)
    };
    
    this.orderSummarySubject.next(summary);
  }

  createOrder(orderRequest: CreateOrderRequest): Observable<Order> {
    this.setLoading(true);
    
    return this.apiService.post<Order>('orderService', '/api/orders', orderRequest).pipe(
      tap(order => {
        // Add new order to local state
        const currentOrders = this.ordersSubject.value;
        this.ordersSubject.next([order, ...currentOrders]);
        this.updateOrderSummary([order, ...currentOrders]);
        this.setLoading(false);
      }),
      catchError(error => {
        console.error('Error creating order:', error);
        this.setLoading(false);
        throw error;
      })
    );
  }

  getOrderById(orderId: string): Observable<Order> {
    return this.apiService.get<Order>('orderService', `/api/orders/${orderId}`);
  }

  getOrderByNumber(orderNumber: string): Observable<Order> {
    return this.apiService.get<Order>('orderService', `/api/orders/number/${orderNumber}`);
  }

  trackOrder(orderNumber: string): Observable<Order> {
    return this.apiService.get<Order>('orderService', `/api/orders/track/${orderNumber}`);
  }

  loadUserOrders(page: number = 0, size: number = 10): Observable<PageResponse<Order>> {
    this.setLoading(true);
    
    const params = { page, size, sortDirection: 'desc' };
    
    return this.apiService.get<PageResponse<Order>>('orderService', '/api/orders/my-orders', params).pipe(
      tap(response => {
        this.ordersSubject.next(response.content);
        this.updateOrderSummary(response.content);
        this.setLoading(false);
      }),
      catchError(error => {
        console.error('Error loading user orders:', error);
        this.setLoading(false);
        return of({ content: [], totalElements: 0, totalPages: 0, size, number: page, first: true, last: true });
      })
    );
  }

  getUserOrders(userId?: string): Observable<Order[]> {
    return this.loadUserOrders().pipe(
      map(response => response.content)
    );
  }

  cancelOrder(orderId: string, reason: string): Observable<Order> {
    this.setLoading(true);
    
    return this.apiService.post<Order>('orderService', `/api/orders/${orderId}/cancel`, {
      reason: reason
    }).pipe(
      tap(updatedOrder => {
        // Update order in local state
        const currentOrders = this.ordersSubject.value;
        const orderIndex = currentOrders.findIndex(o => o.id === orderId);
        if (orderIndex > -1) {
          currentOrders[orderIndex] = updatedOrder;
          this.ordersSubject.next([...currentOrders]);
          this.updateOrderSummary(currentOrders);
        }
        this.setLoading(false);
      }),
      catchError(error => {
        console.error('Error cancelling order:', error);
        this.setLoading(false);
        throw error;
      })
    );
  }

  // Admin methods (if user has admin role)
  updateOrderStatus(orderId: string, newStatus: Order['status'], notes?: string): Observable<Order> {
    this.setLoading(true);
    
    return this.apiService.put<Order>('orderService', `/api/orders/${orderId}/status`, {
      orderStatus: newStatus,
      notes: notes
    }).pipe(
      tap(updatedOrder => {
        // Update order in local state if it exists
        const currentOrders = this.ordersSubject.value;
        const orderIndex = currentOrders.findIndex(o => o.id === orderId);
        if (orderIndex > -1) {
          currentOrders[orderIndex] = updatedOrder;
          this.ordersSubject.next([...currentOrders]);
          this.updateOrderSummary(currentOrders);
        }
        this.setLoading(false);
      }),
      catchError(error => {
        console.error('Error updating order status:', error);
        this.setLoading(false);
        throw error;
      })
    );
  }

  getOrdersByStatus(status: Order['status'], page: number = 0, size: number = 20): Observable<PageResponse<Order>> {
    const params = { page, size };
    
    return this.apiService.get<PageResponse<Order>>('orderService', `/api/orders/status/${status}`, params);
  }

  searchOrders(query: string, page: number = 0, size: number = 20): Observable<PageResponse<Order>> {
    const params = { q: query, page, size };
    
    return this.apiService.get<PageResponse<Order>>('orderService', '/api/orders/search', params);
  }

  getOrderStatistics(days: number = 30): Observable<OrderStatistics> {
    const params = { days };
    
    return this.apiService.get<OrderStatistics>('orderService', '/api/orders/statistics', params);
  }

  // Re-order items from a previous order
  reorderItems(orderId: string): Observable<OrderItem[]> {
    const order = this.ordersSubject.value.find(o => o.id === orderId);
    
    if (order) {
      return of(order.items);
    }
    
    // If order not in local state, fetch from API
    return this.getOrderById(orderId).pipe(
      map(order => order.items)
    );
  }

  // Get current loaded orders
  getCurrentOrders(): Order[] {
    return this.ordersSubject.value;
  }

  // Get current order summary
  getCurrentOrderSummary(): OrderSummary {
    return this.orderSummarySubject.value;
  }

  // Check if order can be cancelled
  canCancelOrder(order: Order): boolean {
    return ['pending', 'confirmed'].includes(order.status);
  }

  // Check if order can be returned
  canReturnOrder(order: Order): boolean {
    if (order.status !== 'delivered') return false;
    
    const deliveryDate = order.actualDelivery || order.orderDate;
    const daysSinceDelivery = Math.floor((Date.now() - new Date(deliveryDate).getTime()) / (1000 * 60 * 60 * 24));
    
    return daysSinceDelivery <= 7; // 7 days return policy
  }

  // Format order number for display
  formatOrderNumber(orderNumber: string): string {
    return orderNumber.toUpperCase();
  }

  // Get order status display text
  getOrderStatusText(status: Order['status']): string {
    const statusTexts = {
      pending: 'Order Pending',
      confirmed: 'Order Confirmed',
      processing: 'Being Processed',
      shipped: 'Shipped',
      delivered: 'Delivered',
      cancelled: 'Cancelled'
    };
    return statusTexts[status] || status;
  }

  // Get order status color
  getOrderStatusColor(status: Order['status']): string {
    const statusColors = {
      pending: '#ffa500',      // orange
      confirmed: '#0080ff',    // blue
      processing: '#ff8c00',   // dark orange
      shipped: '#32cd32',      // lime green
      delivered: '#008000',    // green
      cancelled: '#dc3545'     // red
    };
    return statusColors[status] || '#6c757d';
  }

  // Validate delivery address
  validateDeliveryAddress(address: CreateOrderAddressRequest): boolean {
    return !!(
      address.addressName?.trim() &&
      address.street?.trim() &&
      address.city?.trim() &&
      address.state?.trim() &&
      address.pincode?.trim() &&
      /^\d{6}$/.test(address.pincode) // 6-digit pincode validation
    );
  }

  // Clear orders (on logout)
  clearOrders(): void {
    this.ordersSubject.next([]);
    this.orderSummarySubject.next({
      totalOrders: 0,
      activeOrders: 0,
      completedOrders: 0,
      totalSpent: 0
    });
  }
} 
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../services/order';
import { AuthService } from '../../services/auth';
import { CartService } from '../../services/cart';
import { Order, OrderSummary, OrderItem } from '../../models/order.model';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-orders',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './orders.html',
  styleUrl: './orders.scss'
})
export class Orders implements OnInit {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  orderSummary: OrderSummary = {
    totalOrders: 0,
    activeOrders: 0,
    completedOrders: 0,
    totalSpent: 0
  };
  user: User | null = null;
  
  // Filters
  selectedStatus: string = 'all';
  selectedTimeRange: string = 'all';
  searchQuery: string = '';
  
  // UI State
  isLoading: boolean = true;
  selectedOrder: Order | null = null;
  showOrderDetails: boolean = false;
  showCancelDialog: boolean = false;
  cancelReason: string = '';

  private orderService = inject(OrderService);
  private authService = inject(AuthService);
  private cartService = inject(CartService);
  private router = inject(Router);

  ngOnInit() {
    // Check authentication
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
      if (!user) {
        this.router.navigate(['/auth'], { 
          queryParams: { returnUrl: '/orders' } 
        });
        return;
      }
      this.loadOrders();
    });

    // Subscribe to order updates
    this.orderService.orders$.subscribe(orders => {
      this.orders = orders;
      this.applyFilters();
      this.isLoading = false;
    });

    // Subscribe to order summary
    this.orderService.orderSummary$.subscribe(summary => {
      this.orderSummary = summary;
    });
  }

  loadOrders() {
    this.isLoading = true;
    this.orderService.getUserOrders().subscribe();
  }

  applyFilters() {
    let filtered = [...this.orders];

    // Filter by status
    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(order => order.status === this.selectedStatus);
    }

    // Filter by time range
    if (this.selectedTimeRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (this.selectedTimeRange) {
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          filterDate.setMonth(now.getMonth() - 3);
          break;
      }
      
      filtered = filtered.filter(order => new Date(order.orderDate) >= filterDate);
    }

    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(query) ||
        order.items.some(item => item.productName.toLowerCase().includes(query)) ||
        order.deliveryAddress.street.toLowerCase().includes(query)
      );
    }

    this.filteredOrders = filtered;
  }

  onStatusFilterChange() {
    this.applyFilters();
  }

  onTimeRangeChange() {
    this.applyFilters();
  }

  onSearchChange() {
    this.applyFilters();
  }

  clearFilters() {
    this.selectedStatus = 'all';
    this.selectedTimeRange = 'all';
    this.searchQuery = '';
    this.applyFilters();
  }

  viewOrderDetails(order: Order) {
    this.selectedOrder = order;
    this.showOrderDetails = true;
  }

  closeOrderDetails() {
    this.selectedOrder = null;
    this.showOrderDetails = false;
  }

  initiateCancel(order: Order) {
    this.selectedOrder = order;
    this.showCancelDialog = true;
    this.cancelReason = '';
  }

  cancelOrder() {
    if (!this.selectedOrder) return;

    this.orderService.cancelOrder(this.selectedOrder.id, this.cancelReason).subscribe(
      success => {
        if (success) {
          this.showCancelDialog = false;
          this.selectedOrder = null;
          this.cancelReason = '';
          // Refresh orders
          this.loadOrders();
        }
      }
    );
  }

  closeCancelDialog() {
    this.showCancelDialog = false;
    this.selectedOrder = null;
    this.cancelReason = '';
  }

  reorder(order: Order) {
    this.orderService.reorderItems(order.id).subscribe(items => {
      // Add items to cart one by one with proper subscription
      let addedCount = 0;
      const totalItems = items.length;
      
      items.forEach(item => {
        // Convert OrderItem back to Product-like structure for cart
        const product = {
          id: item.productId,
          name: item.productName,
          image: item.productImage,
          price: item.price,
          originalPrice: item.originalPrice,
          category: item.category as 'fruits' | 'vegetables' | 'organic' | 'groceries',
          // Add minimal required fields
          description: '',
          unit: 'piece',
          inStock: true,
          quantity: 100,
          stock: 100,
          rating: 4.5,
          reviewCount: 50,
          isOrganic: false,
          organic: false,
          isFresh: true,
          fresh: true,
          discount: 0,
          tags: []
        };
        
        // Subscribe to addToCart observable
        this.cartService.addToCart(product, item.quantity).subscribe({
          next: () => {
            addedCount++;
            console.log(`Added ${item.productName} to cart`);
            
            // Navigate to cart after all items are added
            if (addedCount === totalItems) {
              this.router.navigate(['/cart']);
            }
          },
          error: (error) => {
            console.error(`Error adding ${item.productName} to cart:`, error);
            addedCount++;
            
            // Still navigate even if some items failed
            if (addedCount === totalItems) {
              this.router.navigate(['/cart']);
            }
          }
        });
      });
    });
  }

  trackOrder(order: Order) {
    // This would typically navigate to a tracking page
    // For now, just show order details
    this.viewOrderDetails(order);
  }

  downloadInvoice(order: Order) {
    // Mock invoice download
    const invoiceData = this.generateInvoiceData(order);
    const blob = new Blob([invoiceData], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice-${order.orderNumber}.txt`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  getStatusClass(status: string): string {
    const statusClasses = {
      'pending': 'status-pending',
      'confirmed': 'status-confirmed',
      'processing': 'status-processing',
      'shipped': 'status-shipped',
      'delivered': 'status-delivered',
      'cancelled': 'status-cancelled'
    };
    return statusClasses[status as keyof typeof statusClasses] || '';
  }

  getStatusIcon(status: string): string {
    const statusIcons = {
      'pending': '⏳',
      'confirmed': '✅',
      'processing': '⚙️',
      'shipped': '🚚',
      'delivered': '📦',
      'cancelled': '❌'
    };
    return statusIcons[status as keyof typeof statusIcons] || '📋';
  }

  getPaymentStatusIcon(status: string): string {
    const paymentIcons = {
      'pending': '⏳',
      'paid': '✅',
      'failed': '❌',
      'refunded': '↩️'
    };
    return paymentIcons[status as keyof typeof paymentIcons] || '💳';
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  formatDateTime(date: Date): string {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  canCancelOrder(order: Order): boolean {
    return ['pending', 'confirmed'].includes(order.status);
  }

  canTrackOrder(order: Order): boolean {
    return ['shipped', 'delivered'].includes(order.status) && !!order.trackingNumber;
  }

  trackByOrderId(index: number, order: Order): string {
    return order.id;
  }

  private generateInvoiceData(order: Order): string {
    return `
MAHABALESHWER MART - INVOICE
=============================

Order Number: ${order.orderNumber}
Order Date: ${this.formatDateTime(order.orderDate)}
Customer: ${this.user?.name}
Email: ${this.user?.email}

DELIVERY ADDRESS:
${order.deliveryAddress.name}
${order.deliveryAddress.street}
${order.deliveryAddress.city}, ${order.deliveryAddress.state} - ${order.deliveryAddress.pincode}

ITEMS:
------
${order.items.map(item => 
  `${item.productName} x ${item.quantity} = ₹${item.total}`
).join('\n')}

SUMMARY:
--------
Subtotal: ₹${order.subtotal}
Delivery: ₹${order.deliveryCharge}
Discount: -₹${order.discount}
Total: ₹${order.total}

Payment Method: ${order.payment.method.toUpperCase()}
Payment Status: ${order.payment.status.toUpperCase()}
Transaction ID: ${order.payment.transactionId}

Thank you for shopping with Mahabaleshwer Mart!
    `.trim();
  }
} 
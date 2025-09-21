import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { CartService, CartSummary } from '../../services/cart';
import { AuthService } from '../../services/auth';
import { OrderService, CreateOrderRequest } from '../../services/order';
import { CartItem } from '../../models/cart-item.model';
import { User, Address } from '../../models/user.model';
import { ErrorHandlerService } from '../../services/error-handler.service';
import { NotificationService } from '../../services/notification';
import { AppEventsService } from '../../services/app-events';

interface PaymentOption {
  id: string;
  name: string;
  icon: string;
  type: 'card' | 'upi' | 'wallet' | 'cod';
  description: string;
}

interface TransactionResult {
  success: boolean;
  transactionId?: string;
  errorMessage?: string;
  errorCode?: string;
}

@Component({
  selector: 'app-checkout',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss'
})
export class Checkout implements OnInit, OnDestroy {
  cartItems: CartItem[] = [];
  cartSummary: CartSummary | null = null;
  totalAmount: number = 0;
  user: User | null = null;
  isLoading: boolean = false;
  
  // Transaction states
  isProcessing: boolean = false;
  transactionResult: TransactionResult | null = null;
  
  // Checkout steps
  currentStep: 'address' | 'payment' | 'processing' | 'success' | 'failed' = 'address';
  
  // Address selection
  selectedAddressId: string = '';
  
  // Payment options
  selectedPaymentMethod: string = '';
  paymentOptions: PaymentOption[] = [
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: '💳',
      type: 'card',
      description: 'Secure payment with Visa, MasterCard, or RuPay'
    },
    {
      id: 'upi',
      name: 'UPI Payment',
      icon: '📱',
      type: 'upi',
      description: 'Pay using Google Pay, PhonePe, Paytm, or any UPI app'
    },
    {
      id: 'wallet',
      name: 'Digital Wallet',
      icon: '💰',
      type: 'wallet', 
      description: 'Quick payment with Paytm, PhonePe, or Amazon Pay'
    },
    {
      id: 'cod',
      name: 'Cash on Delivery',
      icon: '💵',
      type: 'cod',
      description: 'Pay when your order is delivered to your doorstep'
    }
  ];

  // Payment form data
  cardDetails = {
    number: '',
    expiry: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    name: '',
    holderName: ''
  };
  
  upiId: string = '';
  
  private cartService = inject(CartService);
  private authService = inject(AuthService);
  private orderService = inject(OrderService);
  private router = inject(Router);
  private errorHandler = inject(ErrorHandlerService);
  private notificationService = inject(NotificationService);
  private appEvents = inject(AppEventsService);
  
  private subscriptions: Subscription[] = [];

  ngOnInit() {
    // Check if user is logged in
    const authSubscription = this.authService.currentUser$.subscribe(user => {
      this.user = user;
      if (!user) {
        this.router.navigate(['/auth'], { queryParams: { returnUrl: '/checkout' } });
        return;
      }
      
      // Set default address if available
      if (user.addresses && user.addresses.length > 0) {
        const defaultAddress = user.addresses.find(addr => addr.isDefault) || user.addresses[0];
        this.selectedAddressId = defaultAddress.id;
      }
    });
    this.subscriptions.push(authSubscription);

    // Subscribe to cart summary
    const cartSubscription = this.cartService.cartSummary$.subscribe(summary => {
      this.cartSummary = summary;
      this.cartItems = summary.items;
      this.totalAmount = summary.total;
      
      if (summary.items.length === 0) {
        this.router.navigate(['/cart']);
      }
    });
    this.subscriptions.push(cartSubscription);

    // Subscribe to loading state
    const loadingSubscription = this.cartService.loading$.subscribe(loading => {
      this.isLoading = loading;
    });
    this.subscriptions.push(loadingSubscription);

    // Load cart data on checkout entry
    this.cartService.loadCart().subscribe();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  getDeliveryCharge(): number {
    return this.totalAmount >= 500 ? 0 : 50;
  }

  getTotalWithDelivery(): number {
    return this.totalAmount + this.getDeliveryCharge();
  }

  proceedToPayment() {
    if (!this.selectedAddressId) {
      alert('Please select a delivery address');
      return;
    }
    this.currentStep = 'payment';
  }

  backToAddress() {
    this.currentStep = 'address';
  }

  backToCart() {
    this.router.navigate(['/cart']);
  }

  selectPaymentMethod(methodId: string) {
    this.selectedPaymentMethod = methodId;
  }

  async processPayment() {
    if (!this.selectedPaymentMethod) {
      alert('Please select a payment method');
      return;
    }

    this.currentStep = 'processing';
    this.isProcessing = true;

    // Simulate payment processing
    await this.simulatePayment();
  }

  private async simulatePayment(): Promise<void> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate random transaction outcomes
    const outcomes = ['success', 'success', 'success', 'failed']; // 75% success rate for demo
    const randomOutcome = outcomes[Math.floor(Math.random() * outcomes.length)];

    if (randomOutcome === 'success') {
      const transactionId = this.generateTransactionId();
      this.transactionResult = {
        success: true,
        transactionId: transactionId
      };
      
      // Create order on successful payment
      await this.createOrder(transactionId);
      
      this.currentStep = 'success';
    } else {
      this.transactionResult = {
        success: false,
        errorMessage: this.getRandomErrorMessage(),
        errorCode: 'ERR_' + Math.floor(Math.random() * 9999).toString().padStart(4, '0')
      };
      this.currentStep = 'failed';
    }

    this.isProcessing = false;
  }

  private async createOrder(transactionId: string): Promise<void> {
    try {
      const selectedAddress = this.getSelectedAddress();
      if (!selectedAddress) {
        console.error('No address selected for order');
        return;
      }

      const deliveryCharge = this.getDeliveryCharge();
      const discount = 0; // Could be calculated based on coupon codes

      const paymentDetails = {
        method: this.selectedPaymentMethod,
        transactionId: transactionId,
        status: 'success' as const,
        cardLast4: this.isCardPayment() ? this.cardDetails.number.slice(-4) : undefined,
        upiId: this.isUpiPayment() ? this.upiId : undefined
      };

      const orderRequest: CreateOrderRequest = {
        deliveryAddress: {
          addressType: selectedAddress.type,
          addressName: selectedAddress.name,
          street: selectedAddress.street,
          city: selectedAddress.city,
          state: selectedAddress.state,
          pincode: selectedAddress.pincode,
          landmark: selectedAddress.landmark,
          contactName: this.user?.name,
          contactPhone: this.user?.phone
        },
        payment: {
          paymentMethod: this.selectedPaymentMethod,
          cardToken: this.isCardPayment() ? this.generateCardToken() : undefined,
          upiId: this.isUpiPayment() ? this.upiId : undefined
        },
        specialInstructions: ''
      };

      this.orderService.createOrder(orderRequest).subscribe({
        next: (order) => {
          console.log('Order created successfully:', order);
          this.errorHandler.showSuccess('Order placed successfully');
          this.notificationService.showSuccess('Order Success', 'Your order has been placed');
          // After successful order creation, load latest orders and navigate
          this.orderService.loadUserOrders().subscribe({
            next: () => this.router.navigate(['/orders']),
            error: () => this.router.navigate(['/orders'])
          });
          // Clear cart after success
          setTimeout(() => this.appEvents.requestCartRefresh(), 0);
        },
        error: (error) => {
          console.error('Failed to create order:', error);
          const message = error?.error?.message || 'Failed to place order. Please try again.';
          this.notificationService.showError('Order Failed', message, true);
          this.errorHandler.handleHttpError(error);
        }
      });
    } catch (error) {
      console.error('Error creating order:', error);
    }
  }

  private generateCardToken(): string {
    // In real implementation, this would be handled by payment gateway
    return 'card_token_' + Date.now();
  }

  private generateTransactionId(): string {
    return 'TXN' + Date.now().toString() + Math.floor(Math.random() * 1000);
  }

  private getRandomErrorMessage(): string {
    const errorMessages = [
      'Payment declined by bank. Please try again.',
      'Insufficient funds in your account.',
      'Payment gateway timeout. Please retry.',
      'Invalid card details. Please check and retry.',
      'Transaction limit exceeded for today.',
      'Bank server is temporarily unavailable.'
    ];
    return errorMessages[Math.floor(Math.random() * errorMessages.length)];
  }

  retryPayment() {
    this.currentStep = 'payment';
    this.transactionResult = null;
  }

  cancelTransaction() {
    this.currentStep = 'payment';
    this.transactionResult = null;
  }

  goToOrders() {
    this.router.navigate(['/orders']);
  }

  continueShopping() {
    this.router.navigate(['/products']);
  }

  getSelectedAddress() {
    if (!this.user || !this.selectedAddressId) return null;
    return this.user.addresses.find(addr => addr.id === this.selectedAddressId);
  }

  getSelectedPaymentOption() {
    return this.paymentOptions.find(option => option.id === this.selectedPaymentMethod);
  }

  isCardPayment(): boolean {
    return this.selectedPaymentMethod === 'card';
  }

  isUpiPayment(): boolean {
    return this.selectedPaymentMethod === 'upi';
  }

  isCodPayment(): boolean {
    return this.selectedPaymentMethod === 'cod';
  }

  isWalletPayment(): boolean {
    return this.selectedPaymentMethod === 'wallet';
  }

  isFormValid(): boolean {
    if (this.selectedPaymentMethod === 'card') {
      return this.cardDetails.number.length >= 16 &&
             this.cardDetails.expiryMonth !== '' &&
             this.cardDetails.expiryYear !== '' &&
             this.cardDetails.cvv.length >= 3 &&
             this.cardDetails.holderName.trim() !== '';
    } else if (this.selectedPaymentMethod === 'upi') {
      return this.upiId.includes('@') && this.upiId.length > 5;
    }
    return true; // For COD and wallet, no additional validation needed
  }

  getUserAddresses() {
    return this.user?.addresses || [];
  }

  hasAddresses(): boolean {
    return this.getUserAddresses().length > 0;
  }
}

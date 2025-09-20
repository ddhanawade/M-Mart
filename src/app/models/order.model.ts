export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  originalPrice: number;
  quantity: number;
  total: number;
  category: string;
}

export interface OrderAddress {
  id: string;
  type: 'home' | 'work' | 'other';
  name: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
}

export interface OrderPayment {
  method: 'card' | 'upi' | 'cod';
  transactionId: string;
  status: 'success' | 'failed' | 'pending';
  amount: number;
  cardLast4?: string;
  upiId?: string;
}

export interface Order {
  id: string;
  userId: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  total: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  deliveryAddress: OrderAddress;
  payment: OrderPayment;
  orderDate: Date;
  estimatedDelivery: Date;
  actualDelivery?: Date;
  trackingNumber?: string;
  notes?: string;
  timeline: OrderTimeline[];
}

export interface OrderTimeline {
  id: string;
  status: string;
  message: string;
  timestamp: Date;
  location?: string;
}

export interface OrderSummary {
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  totalSpent: number;
} 
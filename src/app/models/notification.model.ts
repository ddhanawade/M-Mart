export interface NotificationHealth {
  status: 'UP' | 'DOWN' | 'UNKNOWN';
  lastChecked: Date;
  responseTime?: number;
}

export interface SystemNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  autoClose?: boolean;
  duration?: number;
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  orderUpdates: boolean;
  promotionalOffers: boolean;
  systemAlerts: boolean;
}

export interface ServiceHealthStatus {
  userService: NotificationHealth;
  productService: NotificationHealth;
  cartService: NotificationHealth;
  orderService: NotificationHealth;
  notificationService: NotificationHealth;
}

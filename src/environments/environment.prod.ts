export const environment = {
  production: true,
  api: {
    userService: 'https://api.mahabaleshwermart.com/user-service',
    productService: 'https://api.mahabaleshwermart.com/product-service',
    cartService: 'https://api.mahabaleshwermart.com/cart-service',
    orderService: 'https://api.mahabaleshwermart.com/order-service',
    notificationService: 'https://api.mahabaleshwermart.com/notification-service'
  },
  auth: {
    tokenKey: 'mahabaleshwer_mart_token',
    refreshTokenKey: 'mahabaleshwer_mart_refresh_token',
    userKey: 'mahabaleshwer_mart_user'
  },
  app: {
    name: 'Mahabaleshwer Mart',
    version: '1.0.0'
  }
}; 
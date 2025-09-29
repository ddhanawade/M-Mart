export const environment = {
  production: false,
  api: {
    userService: '/user-service',
    productService: '/product-service', 
    cartService: '/cart-service',
    orderService: '/order-service',
    notificationService: '/notification-service'
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
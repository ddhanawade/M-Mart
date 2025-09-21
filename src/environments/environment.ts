export const environment = {
  production: false,
  api: {
    userService: 'http://localhost:8080/user-service',
    productService: 'http://localhost:8080/product-service', 
    cartService: 'http://localhost:8080/cart-service',
    orderService: 'http://localhost:8080/order-service',
    notificationService: 'http://localhost:8080/notification-service'
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
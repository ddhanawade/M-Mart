export const environment = {
  production: false,
  api: {
    userService: 'http://localhost:8081',
    productService: 'http://localhost:8082', 
    cartService: 'http://localhost:8083',
    orderService: 'http://localhost:8084',
    notificationService: 'http://localhost:8085'
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
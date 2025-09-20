# Frontend-Backend Integration Summary

This document provides a comprehensive overview of the integration between the Angular frontend and Spring Boot microservices backend for Mahabaleshwer Mart.

## Integration Overview

The integration replaces mock data and localStorage-based operations with real API calls to backend microservices. The frontend now communicates with five separate backend services through HTTP APIs.

## Backend Services

| Service | Port | Purpose | API Base Path |
|---------|------|---------|---------------|
| User Service | 8081 | Authentication, user management | `/api/auth`, `/api/users` |
| Product Service | 8082 | Product catalog, search | `/api/products` |
| Cart Service | 8083 | Shopping cart management | `/api/cart` |
| Order Service | 8084 | Order processing, tracking | `/api/orders` |
| Notification Service | 8085 | Email/SMS notifications | `/api/notifications` |

## Frontend Integration Components

### 1. Environment Configuration

**Files Updated:**
- `src/environments/environment.ts`
- `src/environments/environment.prod.ts`

**Features:**
- API base URLs for all services
- Authentication token keys
- Environment-specific configurations

### 2. HTTP Client Setup

**Files Created/Updated:**
- `src/app/app.config.ts` - HTTP client provider with interceptors
- `src/app/services/api.service.ts` - Base API service with common HTTP methods
- `src/app/interceptors/auth.interceptor.ts` - JWT token attachment
- `src/app/interceptors/error.interceptor.ts` - Global error handling

**Features:**
- Automatic JWT token attachment
- Global error handling and user notifications
- Type-safe API response handling
- Request/response logging

### 3. Service Integration

#### AuthService Integration
**File:** `src/app/services/auth.ts`

**Changes Made:**
- Replaced mock authentication with real API calls
- Integrated with User Service endpoints
- Added token refresh functionality
- Implemented email verification
- Added password reset functionality

**API Endpoints Used:**
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Token refresh
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/verify-email` - Verify email

#### ProductService Integration
**File:** `src/app/services/product.ts`

**Changes Made:**
- Replaced sample product data with API calls
- Added pagination support
- Implemented advanced search and filtering
- Added loading states and error handling

**API Endpoints Used:**
- `GET /api/products` - Get all products with pagination
- `GET /api/products/{id}` - Get product by ID
- `GET /api/products/search` - Search products with filters
- `GET /api/products/category/{category}` - Get products by category
- `GET /api/products/featured` - Get featured products
- `GET /api/products/organic` - Get organic products
- `GET /api/products/sale` - Get products on sale
- `GET /api/products/top-rated` - Get top-rated products

#### CartService Integration
**File:** `src/app/services/cart.ts`

**Changes Made:**
- Replaced localStorage with API-based cart management
- Added guest cart functionality with session management
- Implemented cart transfer on user login
- Added cart validation and coupon support

**API Endpoints Used:**
- `GET /api/cart` - Get user cart
- `GET /api/cart/guest` - Get guest cart
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/items/{itemId}/quantity` - Update item quantity
- `DELETE /api/cart/items/{itemId}` - Remove item from cart
- `DELETE /api/cart/clear` - Clear entire cart
- `POST /api/cart/transfer` - Transfer guest cart to user
- `POST /api/cart/validate` - Validate cart items

#### OrderService Integration
**File:** `src/app/services/order.ts`

**Changes Made:**
- Replaced mock order data with real API calls
- Added order creation from cart
- Implemented order tracking and status updates
- Added order statistics and search functionality

**API Endpoints Used:**
- `POST /api/orders` - Create new order
- `GET /api/orders/{orderId}` - Get order by ID
- `GET /api/orders/number/{orderNumber}` - Get order by number
- `GET /api/orders/my-orders` - Get user orders
- `GET /api/orders/track/{orderNumber}` - Track order
- `POST /api/orders/{orderId}/cancel` - Cancel order
- `GET /api/orders/statistics` - Get order statistics

### 4. Error Handling and Loading States

**Files Created:**
- `src/app/services/error-handler.service.ts` - Centralized error management
- `src/app/services/loading.service.ts` - Loading state management

**Features:**
- Global error notification system
- HTTP error code specific handling
- Loading state management for different operations
- User-friendly error messages
- Auto-dismissible success/info messages

## Data Flow

### Authentication Flow
1. User submits login credentials
2. Frontend sends request to User Service `/api/auth/login`
3. Backend validates credentials and returns JWT tokens
4. Frontend stores tokens and user data
5. Auth interceptor automatically adds JWT to subsequent requests
6. Token refresh handled automatically on expiration

### Product Browsing Flow
1. Frontend requests products from Product Service
2. Service returns paginated product data
3. Frontend displays products with pagination controls
4. Search/filter requests update product list
5. Product details fetched individually as needed

### Cart Management Flow
1. Add to cart triggers API call to Cart Service
2. Guest users get session-based cart management
3. Logged-in users get persistent cart storage
4. Cart transfer happens automatically on login
5. Cart validation ensures product availability and pricing

### Order Processing Flow
1. User proceeds to checkout
2. Cart items converted to order request
3. Order Service creates order and processes payment
4. Notification Service sends confirmation emails
5. Order status updates tracked in real-time

## Security Implementation

### Authentication
- JWT-based authentication with access and refresh tokens
- Automatic token refresh on expiration
- Secure token storage with configurable keys
- Login state persistence across browser sessions

### Authorization
- Role-based access control for admin functions
- Protected routes requiring authentication
- API endpoint protection with Spring Security
- CORS configuration for cross-origin requests

### Data Validation
- Client-side validation for user inputs
- Server-side validation with proper error responses
- Type-safe data transfer objects
- Input sanitization and security checks

## Performance Optimizations

### Frontend
- Lazy loading for heavy components
- HTTP request caching where appropriate
- Pagination for large data sets
- Loading states to improve user experience
- Error boundaries for graceful error handling

### Backend Integration
- Connection pooling for database connections
- Redis caching for frequently accessed data
- Pagination to limit data transfer
- Gzip compression for API responses
- CDN integration for static assets

## Development Workflow

### Starting the Application

1. **Backend Services:**
   ```bash
   # Start each service in separate terminals
   cd mahabaleshwer-mart-backend/user-service && mvn spring-boot:run
   cd mahabaleshwer-mart-backend/product-service && mvn spring-boot:run
   cd mahabaleshwer-mart-backend/cart-service && mvn spring-boot:run
   cd mahabaleshwer-mart-backend/order-service && mvn spring-boot:run
   cd mahabaleshwer-mart-backend/notification-service && mvn spring-boot:run
   ```

2. **Frontend:**
   ```bash
   cd mahabaleshwer-mart
   npm install
   ng serve
   ```

3. **Access Points:**
   - Frontend: http://localhost:4200
   - User Service: http://localhost:8081
   - Product Service: http://localhost:8082
   - Cart Service: http://localhost:8083
   - Order Service: http://localhost:8084
   - Notification Service: http://localhost:8085

### Testing the Integration

1. **User Registration/Login:**
   - Register new user through frontend
   - Verify JWT token storage
   - Test protected routes

2. **Product Browsing:**
   - Load product catalog
   - Test search and filtering
   - Verify pagination

3. **Cart Operations:**
   - Add products to cart as guest
   - Login and verify cart transfer
   - Test cart persistence

4. **Order Processing:**
   - Create order from cart
   - Verify order storage
   - Test order tracking

## Troubleshooting

### Common Issues

1. **CORS Errors:**
   - Ensure CORS configuration is properly set up on backend services
   - Check allowed origins include `http://localhost:4200`

2. **Authentication Issues:**
   - Verify JWT token format and expiration
   - Check auth interceptor is properly configured
   - Ensure backend authentication endpoints are working

3. **API Connection Issues:**
   - Verify all backend services are running on correct ports
   - Check environment configuration for correct API URLs
   - Verify network connectivity between frontend and backend

4. **Data Loading Issues:**
   - Check browser developer tools for API errors
   - Verify API response format matches frontend expectations
   - Check for proper error handling in services

### Debugging Tools

1. **Browser Developer Tools:**
   - Network tab for API request/response inspection
   - Console for JavaScript errors
   - Application tab for localStorage/sessionStorage

2. **Backend Logs:**
   - Check application logs for each service
   - Monitor database connection logs
   - Review security filter logs

## Next Steps

1. **Performance Monitoring:**
   - Add API response time monitoring
   - Implement client-side performance tracking
   - Set up error rate monitoring

2. **Additional Features:**
   - Real-time notifications using WebSockets
   - Advanced caching strategies
   - Offline support with service workers

3. **Security Enhancements:**
   - Implement rate limiting
   - Add API request logging
   - Set up security scanning

4. **Testing:**
   - Add integration tests
   - Implement e2e testing
   - Set up automated testing pipeline

## Documentation References

- [CORS Configuration](../mahabaleshwer-mart-backend/CORS_CONFIGURATION.md)
- [API Documentation](../mahabaleshwer-mart-backend/README.md)
- [Frontend Setup Guide](./README.md) 
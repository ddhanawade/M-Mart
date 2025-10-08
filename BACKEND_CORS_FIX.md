# Backend CORS Configuration Fix

## Problem
The API Gateway is receiving CORS requests but not responding with proper CORS headers, causing 403 Forbidden errors from the frontend.

## Solution
Add CORS configuration to the API Gateway service.

---

## Step 1: Create CORS Configuration Class

**File**: `mahabaleshwer-mart-backend/api-gateway/src/main/java/com/mahabaleshwer/apigateway/config/CorsConfig.java`

```java
package com.mahabaleshwer.apigateway.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
public class CorsConfig {

    @Value("${cors.allowed.origins:https://mahabaleshwar-mart.store,https://www.mahabaleshwar-mart.store,http://localhost:4200}")
    private String allowedOrigins;

    @Bean
    public CorsWebFilter corsWebFilter() {
        CorsConfiguration corsConfig = new CorsConfiguration();
        
        // Parse allowed origins from environment variable or use defaults
        List<String> origins = Arrays.asList(allowedOrigins.split(","));
        corsConfig.setAllowedOrigins(origins);
        
        // Allow all standard HTTP methods
        corsConfig.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        
        // Allow all headers
        corsConfig.setAllowedHeaders(List.of("*"));
        
        // Allow credentials (cookies, authorization headers)
        corsConfig.setAllowCredentials(true);
        
        // Cache preflight response for 1 hour
        corsConfig.setMaxAge(3600L);
        
        // Expose headers that frontend can read
        corsConfig.setExposedHeaders(Arrays.asList(
            "Authorization",
            "Content-Type",
            "X-Total-Count",
            "X-Correlation-Id"
        ));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", corsConfig);

        return new CorsWebFilter(source);
    }
}
```

---

## Step 2: Alternative - Add CORS to application.yml

If you prefer configuration over code, add this to:

**File**: `mahabaleshwer-mart-backend/api-gateway/src/main/resources/application.yml`

```yaml
spring:
  cloud:
    gateway:
      globalcors:
        add-to-simple-url-handler-mapping: true
        corsConfigurations:
          '[/**]':
            allowedOrigins:
              - "https://mahabaleshwar-mart.store"
              - "https://www.mahabaleshwar-mart.store"
              - "http://localhost:4200"
            allowedMethods:
              - GET
              - POST
              - PUT
              - DELETE
              - OPTIONS
              - PATCH
            allowedHeaders: "*"
            allowCredentials: true
            maxAge: 3600
            exposedHeaders:
              - Authorization
              - Content-Type
              - X-Total-Count
              - X-Correlation-Id

# Allow reading CORS origins from environment variable
cors:
  allowed:
    origins: ${CORS_ALLOWED_ORIGINS:https://mahabaleshwar-mart.store,https://www.mahabaleshwar-mart.store,http://localhost:4200}
```

---

## Step 3: Deploy the Changes

### On Local Machine:

```bash
# Navigate to backend directory
cd ~/Desktop/Personal-Workspace/mahabaleshwer-mart-backend

# Add the changes
git add .

# Commit
git commit -m "Add CORS configuration to API Gateway"

# Push to repository
git push origin main
```

### On EC2 Instance:

```bash
# Navigate to backend directory
cd ~/apps/mahabaleshwer-mart-backend

# Pull latest changes
git pull origin main

# Navigate to frontend directory
cd ~/apps/mahabaleshwer-mart

# Rebuild and restart API Gateway
docker compose -f docker-compose.prod.yml up -d --build api-gateway

# Wait for it to start (30-60 seconds)
sleep 60

# Check logs
docker compose -f docker-compose.prod.yml logs api-gateway | tail -50

# Test CORS
curl -H "Origin: https://mahabaleshwar-mart.store" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://mahabaleshwar-mart.store/user-service/api/auth/register -v
```

---

## Step 4: Verify CORS is Working

### Test from Browser Console:

```javascript
fetch('https://mahabaleshwar-mart.store/user-service/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: "test",
    email: "test@example.com",
    password: "Test123!",
    firstName: "Test",
    lastName: "User"
  })
})
.then(r => r.json())
.then(data => console.log('Success:', data))
.catch(error => console.error('Error:', error));
```

### Expected Response Headers:

You should see these headers in the response:
- `Access-Control-Allow-Origin: https://mahabaleshwar-mart.store`
- `Access-Control-Allow-Credentials: true`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH`
- `Access-Control-Allow-Headers: *`

---

## Troubleshooting

### If CORS still doesn't work:

1. **Check API Gateway logs for CORS errors:**
   ```bash
   docker compose -f docker-compose.prod.yml logs api-gateway | grep -i "cors\|origin"
   ```

2. **Verify the configuration is loaded:**
   ```bash
   docker compose -f docker-compose.prod.yml logs api-gateway | grep -i "CorsConfig\|CorsWebFilter"
   ```

3. **Test with curl to see response headers:**
   ```bash
   curl -H "Origin: https://mahabaleshwar-mart.store" \
        https://mahabaleshwar-mart.store/user-service/api/auth/register -v
   ```

4. **Check browser network tab:**
   - Look for `Access-Control-Allow-Origin` header in response
   - Check if OPTIONS preflight request succeeds

---

## Quick Test Without Code Changes

If you want to test immediately without modifying backend code, you can temporarily disable CORS in browser (NOT RECOMMENDED FOR PRODUCTION):

### Chrome:
```bash
# Close all Chrome instances first, then:
# Mac:
open -na "Google Chrome" --args --disable-web-security --user-data-dir="/tmp/chrome_dev"

# Linux:
google-chrome --disable-web-security --user-data-dir="/tmp/chrome_dev"
```

This is **only for testing** to confirm CORS is the issue. You still need to fix it properly in the backend.

---

## Summary

The 403 error is caused by missing CORS configuration in the API Gateway. You need to:

1. ✅ Add CORS configuration class OR update application.yml
2. ✅ Commit and push changes
3. ✅ Pull changes on EC2
4. ✅ Rebuild API Gateway container
5. ✅ Test from frontend

**Estimated time**: 10-15 minutes

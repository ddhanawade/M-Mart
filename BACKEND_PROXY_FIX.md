# Backend Proxy Headers Fix for Production 403 Error

## Problem
The backend is returning 403 Forbidden in production but works locally. This is because Spring Security doesn't trust the forwarded headers from Nginx reverse proxy.

## Solution
Configure Spring to trust proxy headers and allow requests from your domain.

---

## Fix 1: Update application.yml in API Gateway

**File**: `mahabaleshwer-mart-backend/api-gateway/src/main/resources/application.yml`

Add this configuration:

```yaml
server:
  forward-headers-strategy: framework
  # Or use: forward-headers-strategy: native

spring:
  cloud:
    gateway:
      # Enable forwarded headers
      forwarded:
        enabled: true
      # Trust X-Forwarded-* headers
      x-forwarded:
        enabled: true
        for-enabled: true
        proto-enabled: true
        host-enabled: true
        port-enabled: true
        prefix-enabled: true
```

---

## Fix 2: Add ForwardedHeaderFilter Configuration

**File**: `mahabaleshwer-mart-backend/api-gateway/src/main/java/com/mahabaleshwer/apigateway/config/WebConfig.java`

```java
package com.mahabaleshwer.apigateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.filter.ForwardedHeaderFilter;

@Configuration
public class WebConfig {

    @Bean
    public ForwardedHeaderFilter forwardedHeaderFilter() {
        return new ForwardedHeaderFilter();
    }
}
```

---

## Fix 3: Update Security Configuration (If Exists)

If you have a SecurityConfig in API Gateway, ensure it allows auth endpoints:

**File**: `mahabaleshwer-mart-backend/api-gateway/src/main/java/com/mahabaleshwer/apigateway/config/SecurityConfig.java`

```java
package com.mahabaleshwer.apigateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        return http
            .csrf().disable()
            .authorizeExchange()
                // Allow authentication endpoints
                .pathMatchers("/user-service/api/auth/**").permitAll()
                .pathMatchers("/*/api/auth/**").permitAll()
                // Allow actuator endpoints
                .pathMatchers("/actuator/**").permitAll()
                // Require authentication for everything else
                .anyExchange().authenticated()
            .and()
            .build();
    }
}
```

---

## Fix 4: Update User Service Security Configuration

**File**: `mahabaleshwer-mart-backend/user-service/src/main/resources/application.yml`

```yaml
server:
  forward-headers-strategy: framework
```

**File**: `mahabaleshwer-mart-backend/user-service/src/main/java/com/mahabaleshwer/userservice/config/SecurityConfig.java`

Ensure auth endpoints are public:

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf().disable()
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()  // Allow auth endpoints
                .requestMatchers("/actuator/**").permitAll()  // Allow health checks
                .anyRequest().authenticated()
            );
        
        return http.build();
    }
}
```

---

## Quick Test Commands

### On EC2:

```bash
# Test through Nginx (HTTPS)
curl -X POST https://mahabaleshwar-mart.store/user-service/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!"}' -v

# Test direct to API Gateway (HTTP)
curl -X POST http://localhost:8080/user-service/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!"}' -v

# Check API Gateway logs
docker compose -f docker-compose.prod.yml logs api-gateway | grep "403\|Forbidden\|SecurityWebFilterChain" | tail -20

# Check User Service logs
docker compose -f docker-compose.prod.yml logs user-service | grep "403\|Forbidden\|SecurityFilterChain" | tail -20
```

---

## Deployment Steps

### 1. On Local Machine:

```bash
cd ~/Desktop/Personal-Workspace/mahabaleshwer-mart-backend

# Make the changes to application.yml and/or create the config classes

# Commit and push
git add .
git commit -m "Fix proxy headers and security configuration for production"
git push origin main
```

### 2. On EC2:

```bash
# Pull latest changes
cd ~/apps/mahabaleshwer-mart-backend
git pull origin main

# Rebuild affected services
cd ~/apps/mahabaleshwer-mart
docker compose -f docker-compose.prod.yml up -d --build api-gateway user-service

# Wait for services to start
sleep 90

# Test
curl -X POST https://mahabaleshwar-mart.store/user-service/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!"}' -v
```

---

## Expected Result

After applying these fixes, you should see:
- ✅ Status 200 or 401 (authentication failed) instead of 403
- ✅ Proper error messages from the backend
- ✅ Frontend can successfully call auth endpoints

---

## If Still Getting 403

Check these:

1. **API Gateway logs for security filters:**
   ```bash
   docker compose -f docker-compose.prod.yml logs api-gateway | grep -i "security\|filter\|403"
   ```

2. **User Service logs:**
   ```bash
   docker compose -f docker-compose.prod.yml logs user-service | grep -i "security\|filter\|403"
   ```

3. **Test if endpoint is reachable:**
   ```bash
   curl http://localhost:8081/api/auth/login -v
   ```

4. **Check if service is registered with Eureka:**
   ```bash
   curl http://localhost:8761/eureka/apps/USER-SERVICE
   ```

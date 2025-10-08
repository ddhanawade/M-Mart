# Full Stack Deployment Guide - Mahabaleshwer Mart

This guide explains how to deploy the complete Mahabaleshwer Mart application (Frontend + All Backend Microservices) using Docker.

## 🏗️ Architecture Overview

The full stack includes:

### Frontend
- **Angular Application** (Port 4200) - Modern e-commerce UI

### Backend Microservices
- **API Gateway** (Port 8080) - Main entry point for all API requests
- **Service Discovery** (Port 8761) - Eureka server for service registration
- **Config Server** (Port 8888) - Centralized configuration management
- **User Service** (Port 8081) - User authentication and management
- **Product Service** (Port 8082) - Product catalog management
- **Cart Service** (Port 8083) - Shopping cart operations
- **Order Service** (Port 8084) - Order processing and management
- **Payment Service** (Port 8086) - Payment processing
- **Notification Service** (Port 8085) - Email and notification handling

### Infrastructure
- **MySQL** (Port 3306) - Primary database
- **Redis** (Port 6379) - Caching and session management
- **Kafka** (Port 9092) - Message queue for async communication
- **Zookeeper** (Port 2181) - Kafka coordination

## 🚀 Quick Start - Full Stack Deployment

### Prerequisites
- Docker Desktop installed and running
- At least 8GB RAM available for Docker
- 20GB free disk space

### Deploy Everything

```bash
# Navigate to frontend directory
cd /Users/ddhanawade/Desktop/Personal-Workspace/mahabaleshwer-mart

# Start all services
docker-compose -f docker-compose-full-stack.yml up -d
```

This single command will:
1. Build the frontend Angular application
2. Build all backend microservices
3. Start MySQL, Redis, Kafka, and Zookeeper
4. Start all microservices with proper dependencies
5. Start the frontend application

### Access Points

Once all services are running:

- **Frontend Application**: http://localhost:4200
- **API Gateway**: http://localhost:8080
- **Eureka Dashboard**: http://localhost:8761
- **MySQL Database**: localhost:3306
- **Redis**: localhost:6379

## 📊 Monitoring Deployment

### Check all services status
```bash
docker-compose -f docker-compose-full-stack.yml ps
```

### View logs for all services
```bash
docker-compose -f docker-compose-full-stack.yml logs -f
```

### View logs for specific service
```bash
docker-compose -f docker-compose-full-stack.yml logs -f frontend
docker-compose -f docker-compose-full-stack.yml logs -f api-gateway
docker-compose -f docker-compose-full-stack.yml logs -f user-service
```

### Check service health
```bash
# API Gateway health
curl http://localhost:8080/actuator/health

# User Service health
curl http://localhost:8081/actuator/health

# Product Service health
curl http://localhost:8082/actuator/health
```

## 🔄 Service Startup Order

The services start in the following order (managed automatically by Docker Compose):

1. **Infrastructure Layer**
   - MySQL
   - Redis
   - Zookeeper
   - Kafka

2. **Configuration Layer**
   - Config Server
   - Service Discovery (Eureka)

3. **Microservices Layer**
   - User Service
   - Product Service
   - Cart Service
   - Order Service
   - Payment Service
   - Notification Service

4. **Gateway Layer**
   - API Gateway

5. **Frontend Layer**
   - Angular Application

**Note**: Full startup takes approximately 3-5 minutes depending on your system.

## 🛠️ Management Commands

### Stop all services
```bash
docker-compose -f docker-compose-full-stack.yml down
```

### Stop and remove volumes (clean slate)
```bash
docker-compose -f docker-compose-full-stack.yml down -v
```

### Restart specific service
```bash
docker-compose -f docker-compose-full-stack.yml restart frontend
docker-compose -f docker-compose-full-stack.yml restart api-gateway
```

### Rebuild and restart
```bash
docker-compose -f docker-compose-full-stack.yml up -d --build
```

### Scale services (if needed)
```bash
docker-compose -f docker-compose-full-stack.yml up -d --scale product-service=2
```

## 🔍 Troubleshooting

### Services not starting
1. **Check Docker resources**: Ensure Docker has enough memory (8GB recommended)
2. **Check logs**: `docker-compose -f docker-compose-full-stack.yml logs`
3. **Verify ports**: Ensure ports 3306, 4200, 6379, 8080-8086, 8761, 8888, 9092 are not in use

### Frontend can't connect to backend
1. **Verify API Gateway is healthy**: `curl http://localhost:8080/actuator/health`
2. **Check network**: All services should be on `mahabaleshwer-network`
3. **Check frontend logs**: `docker logs mahabaleshwer-frontend`

### Database connection issues
1. **Wait for MySQL to be ready**: Takes 30-60 seconds on first start
2. **Check MySQL logs**: `docker logs mahabaleshwer-mysql`
3. **Verify databases created**: `docker exec -it mahabaleshwer-mysql mysql -uroot -proot -e "SHOW DATABASES;"`

### Service discovery issues
1. **Check Eureka dashboard**: http://localhost:8761
2. **Verify all services registered**: Should see all microservices listed
3. **Check service logs**: Look for "Registered with Eureka" messages

## 🎯 Deployment Options

### Option 1: Full Stack (Recommended for Development)
```bash
docker-compose -f docker-compose-full-stack.yml up -d
```
Deploys everything together.

### Option 2: Frontend Only (Backend running separately)
```bash
docker-compose up -d
```
Uses the simple `docker-compose.yml` for frontend only.

### Option 3: Backend Only
```bash
cd ../mahabaleshwer-mart-backend
docker-compose up -d
```
Runs only backend services.

## 🔐 Environment Variables

Key environment variables (already configured):

- **JWT_SECRET**: Token signing secret
- **MYSQL_ROOT_PASSWORD**: root
- **REDIS_HOST**: redis
- **KAFKA_BOOTSTRAP_SERVERS**: kafka:29092
- **PAYMENT_GATEWAY_ENABLED**: false (test mode)

To modify, edit `docker-compose-full-stack.yml`.

## 📦 Data Persistence

Data is persisted in Docker volumes:
- `mysql_data`: All database data
- `redis_data`: Redis cache data
- `kafka_data`: Kafka message data

To backup:
```bash
docker run --rm -v mysql_data:/data -v $(pwd):/backup alpine tar czf /backup/mysql-backup.tar.gz /data
```

## 🚀 Production Deployment

For production:

1. **Update environment variables** (remove test credentials)
2. **Enable HTTPS** (add SSL certificates to nginx.conf)
3. **Configure external databases** (don't use Docker MySQL in production)
4. **Set up monitoring** (Prometheus, Grafana)
5. **Configure log aggregation** (ELK stack)
6. **Enable payment gateways** (set real API keys)

## 📈 Performance Optimization

- **Increase Docker resources**: 8GB+ RAM, 4+ CPUs
- **Use production builds**: Already configured
- **Enable caching**: Redis is configured
- **Monitor with Eureka**: http://localhost:8761

## 🧪 Testing the Deployment

### 1. Check all services are running
```bash
docker-compose -f docker-compose-full-stack.yml ps
```

### 2. Access frontend
Open http://localhost:4200 in your browser

### 3. Test API Gateway
```bash
curl http://localhost:8080/actuator/health
```

### 4. Check Eureka Dashboard
Open http://localhost:8761 - should see all services registered

### 5. Test product listing
```bash
curl http://localhost:8080/api/products
```

## 🆘 Support

### View all container status
```bash
docker ps -a
```

### Check resource usage
```bash
docker stats
```

### Clean up everything
```bash
docker-compose -f docker-compose-full-stack.yml down -v --rmi all
```

---

## 📝 Quick Reference

| Service | Port | URL |
|---------|------|-----|
| Frontend | 4200 | http://localhost:4200 |
| API Gateway | 8080 | http://localhost:8080 |
| User Service | 8081 | http://localhost:8081 |
| Product Service | 8082 | http://localhost:8082 |
| Cart Service | 8083 | http://localhost:8083 |
| Order Service | 8084 | http://localhost:8084 |
| Notification Service | 8085 | http://localhost:8085 |
| Payment Service | 8086 | http://localhost:8086 |
| Eureka Dashboard | 8761 | http://localhost:8761 |
| Config Server | 8888 | http://localhost:8888 |
| MySQL | 3306 | localhost:3306 |
| Redis | 6379 | localhost:6379 |
| Kafka | 9092 | localhost:9092 |

---

**Happy Deploying! 🎉**

# AWS EC2 Deployment - Files Summary
## Mahabaleshwer Mart Full Stack Application

---

## 📁 Deployment Files Overview

All necessary files for deploying your Mahabaleshwer Mart application to AWS EC2 Ubuntu with HTTPS and custom domain have been created.

---

## 📄 Created Files

### 1. **AWS_EC2_DEPLOYMENT_GUIDE.md**
**Purpose**: Comprehensive deployment guide with detailed instructions

**Contents**:
- Prerequisites and requirements
- Step-by-step EC2 instance setup
- Domain configuration instructions
- Server preparation (Docker, Nginx, Certbot)
- Application deployment process
- SSL/HTTPS setup with Let's Encrypt
- Monitoring and maintenance procedures
- Troubleshooting guide
- Post-deployment checklist

**When to use**: Primary reference document for complete deployment process

---

### 2. **QUICK_START_DEPLOYMENT.md**
**Purpose**: Fast-track deployment guide for quick setup

**Contents**:
- 8-step quick deployment process
- Essential commands only
- Common management commands
- Quick troubleshooting tips
- Estimated time: ~45 minutes

**When to use**: When you need to deploy quickly and already understand the basics

---

### 3. **docker-compose.prod.yml**
**Purpose**: Production Docker Compose configuration

**Contents**:
- All 13 services configured for production
- Health checks for all services
- Restart policies set to "always"
- Production-ready environment variables
- Volume persistence for data
- Network configuration

**Key Features**:
- Frontend (Angular + Nginx)
- Backend microservices (User, Product, Cart, Order, Payment, Notification)
- Infrastructure (Config Server, Eureka, API Gateway)
- Databases (MySQL, Redis)
- Message Queue (Kafka + Zookeeper)

**When to use**: This is your main deployment file - use instead of `docker-compose-full-stack.yml`

---

### 4. **nginx-production.conf**
**Purpose**: Nginx configuration for HTTP (before SSL setup)

**Contents**:
- HTTP server configuration
- Reverse proxy to frontend and API
- Rate limiting zones
- Security headers
- Let's Encrypt verification location

**When to use**: Initial Nginx setup before obtaining SSL certificate

---

### 5. **nginx-production-ssl.conf**
**Purpose**: Nginx configuration for HTTPS (after SSL setup)

**Contents**:
- HTTPS server configuration with SSL/TLS
- HTTP to HTTPS redirect
- SSL security settings (TLS 1.2/1.3)
- Separate configuration for main domain and API subdomain
- CORS headers for API
- Security headers (HSTS, CSP, etc.)
- Gzip compression

**When to use**: After obtaining SSL certificate from Let's Encrypt

---

### 6. **deploy.sh**
**Purpose**: Automated deployment script

**Contents**:
- Automated deployment workflow
- Service management commands
- Health checks
- Log viewing
- Cleanup utilities

**Commands**:
```bash
./deploy.sh           # Full deployment
./deploy.sh start     # Start services
./deploy.sh stop      # Stop services
./deploy.sh restart   # Restart services
./deploy.sh logs      # View logs
./deploy.sh status    # Check status
./deploy.sh cleanup   # Clean Docker resources
```

**When to use**: For automated deployment and service management

---

### 7. **.env.production.example**
**Purpose**: Template for production environment variables

**Contents**:
- All required environment variables
- Placeholders for sensitive data
- Configuration for all services
- Payment gateway settings
- Email configuration

**When to use**: Copy to `.env.production` and fill in your actual values

---

### 8. **DEPLOYMENT_CHECKLIST.md**
**Purpose**: Comprehensive deployment checklist

**Contents**:
- Pre-deployment checklist
- EC2 instance setup checklist
- DNS configuration checklist
- Server preparation checklist
- Application deployment checklist
- SSL/HTTPS setup checklist
- Functionality testing checklist
- Security hardening checklist
- Post-deployment tasks
- Maintenance schedule

**When to use**: Track your deployment progress and ensure nothing is missed

---

## 🚀 Deployment Workflow

### Phase 1: Preparation (15 minutes)
1. Read `AWS_EC2_DEPLOYMENT_GUIDE.md` - Sections 1-2
2. Launch EC2 instance
3. Configure DNS records
4. Use `DEPLOYMENT_CHECKLIST.md` to track progress

### Phase 2: Server Setup (15 minutes)
1. Follow `QUICK_START_DEPLOYMENT.md` - Steps 3-4
2. Install Docker and Docker Compose
3. Clone repositories
4. Check off items in `DEPLOYMENT_CHECKLIST.md`

### Phase 3: Application Deployment (20 minutes)
1. Copy `.env.production.example` to `.env.production`
2. Update all configuration files with your domain
3. Run `./deploy.sh` or follow manual steps
4. Verify all services are running

### Phase 4: Nginx & SSL Setup (15 minutes)
1. Install Nginx
2. Copy `nginx-production.conf` and configure
3. Obtain SSL certificate with Certbot
4. Update to `nginx-production-ssl.conf`
5. Verify HTTPS is working

### Phase 5: Testing & Verification (10 minutes)
1. Use `DEPLOYMENT_CHECKLIST.md` - Functionality Testing section
2. Test all features end-to-end
3. Verify SSL certificate
4. Check logs for errors

**Total Time**: ~75 minutes (first deployment)

---

## 📝 Configuration Steps Required

### Before Deployment - Update These Files:

#### 1. `.env.production` (create from `.env.production.example`)
```bash
# Update these values:
DOMAIN=yourdomain.com
API_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
JWT_SECRET=generate-a-secure-32-character-secret
```

#### 2. `nginx-production.conf`
```nginx
# Line 14: Update domain name
server_name yourdomain.com www.yourdomain.com api.yourdomain.com;
```

#### 3. `nginx-production-ssl.conf`
```nginx
# Lines 23, 61, 152: Update domain names
server_name yourdomain.com www.yourdomain.com;
server_name api.yourdomain.com;

# Lines 28-30, 156-158: Update certificate paths
ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
ssl_trusted_certificate /etc/letsencrypt/live/yourdomain.com/chain.pem;
```

#### 4. DNS Records (at your domain registrar)
```
A    @      YOUR_EC2_PUBLIC_IP
A    www    YOUR_EC2_PUBLIC_IP
A    api    YOUR_EC2_PUBLIC_IP
```

---

## 🔑 Key Differences from Development

### docker-compose.prod.yml vs docker-compose-full-stack.yml

| Feature | Development | Production |
|---------|-------------|------------|
| Restart Policy | `unless-stopped` | `always` |
| Health Checks | Basic | Enhanced with retries |
| Logging | Debug enabled | Debug disabled |
| Ports Exposed | All ports | Only necessary ports |
| Network | External reference | Bridge network |
| Volumes | Local | Persistent volumes |
| Environment | Development | Production |

### Why Use docker-compose.prod.yml?

✅ **Production-ready configurations**
- Automatic restart on failure
- Enhanced health checks
- Optimized resource limits
- Production logging levels

✅ **Better reliability**
- Retry logic for health checks
- Proper dependency management
- Graceful shutdown handling

✅ **Security improvements**
- Minimal port exposure
- Production environment variables
- Secure network configuration

---

## 🛠️ Common Tasks

### Initial Deployment
```bash
# 1. Connect to EC2
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# 2. Clone repositories
mkdir -p ~/apps && cd ~/apps
git clone <backend-repo> mahabaleshwer-mart-backend
git clone <frontend-repo> mahabaleshwer-mart

# 3. Configure environment
cd mahabaleshwer-mart
cp .env.production.example .env.production
nano .env.production  # Update values

# 4. Deploy
chmod +x deploy.sh
./deploy.sh
```

### Update Application
```bash
cd ~/apps/mahabaleshwer-mart
git pull origin main
./deploy.sh
```

### View Logs
```bash
cd ~/apps/mahabaleshwer-mart
docker compose -f docker-compose.prod.yml logs -f [service-name]
```

### Restart Services
```bash
cd ~/apps/mahabaleshwer-mart
./deploy.sh restart
```

### Backup Database
```bash
docker exec mahabaleshwer-mysql mysqldump -u root -proot --all-databases > backup-$(date +%Y%m%d).sql
```

---

## 📊 Service Architecture

```
Internet
    ↓
[Nginx - Port 80/443]
    ↓
    ├─→ [Frontend - Port 4200] → Angular Application
    │
    └─→ [API Gateway - Port 8080]
            ↓
            ├─→ [Service Discovery - Port 8761] → Eureka
            │
            ├─→ [Config Server - Port 8888]
            │
            ├─→ [User Service - Port 8081] ─→ [MySQL]
            │
            ├─→ [Product Service - Port 8082] ─→ [MySQL]
            │
            ├─→ [Cart Service - Port 8083] ─→ [MySQL] + [Redis]
            │
            ├─→ [Order Service - Port 8084] ─→ [MySQL] + [Kafka]
            │
            ├─→ [Payment Service - Port 8086] ─→ [MySQL]
            │
            └─→ [Notification Service - Port 8085] ─→ [Kafka]
```

---

## 🔒 Security Considerations

### Implemented Security Features

✅ **SSL/TLS Encryption**
- HTTPS for all traffic
- TLS 1.2/1.3 only
- Strong cipher suites
- HSTS enabled

✅ **Security Headers**
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Content-Security-Policy
- Referrer-Policy

✅ **Rate Limiting**
- API rate limiting (10 req/s)
- General rate limiting (30 req/s)
- Burst protection

✅ **Network Security**
- AWS Security Groups
- Internal Docker network
- Minimal port exposure

### Additional Security Steps (Recommended)

1. **Change Default Passwords**
   - MySQL root password
   - Redis password (if needed)
   - Application admin password

2. **Enable Firewall**
   ```bash
   sudo ufw allow 22
   sudo ufw allow 80
   sudo ufw allow 443
   sudo ufw enable
   ```

3. **Setup Fail2Ban**
   ```bash
   sudo apt install fail2ban
   sudo systemctl enable fail2ban
   ```

4. **Regular Updates**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

---

## 📈 Monitoring & Maintenance

### What to Monitor

1. **Server Resources**
   - CPU usage
   - Memory usage
   - Disk space
   - Network traffic

2. **Application Health**
   - Service uptime
   - Response times
   - Error rates
   - Request rates

3. **Database**
   - Connection pool
   - Query performance
   - Storage usage

4. **SSL Certificate**
   - Expiry date (auto-renews)
   - Renewal status

### Monitoring Commands

```bash
# System resources
htop
df -h
free -h

# Docker stats
docker stats
docker ps

# Service health
curl http://localhost:8080/actuator/health
curl http://localhost:8761

# Logs
docker compose -f docker-compose.prod.yml logs -f
sudo tail -f /var/log/nginx/mahabaleshwer-access.log
```

---

## 🐛 Troubleshooting Quick Reference

### Services Won't Start
```bash
# Check logs
docker compose -f docker-compose.prod.yml logs [service-name]

# Restart service
docker compose -f docker-compose.prod.yml restart [service-name]

# Rebuild service
docker compose -f docker-compose.prod.yml up -d --build [service-name]
```

### Can't Access Website
```bash
# Check Nginx
sudo systemctl status nginx
sudo nginx -t

# Check ports
sudo netstat -tulpn | grep -E '80|443'

# Check security group in AWS
```

### SSL Issues
```bash
# Check certificate
sudo certbot certificates

# Renew certificate
sudo certbot renew --force-renewal
sudo systemctl reload nginx
```

### Database Issues
```bash
# Access MySQL
docker exec -it mahabaleshwer-mysql mysql -u root -proot

# Check databases
SHOW DATABASES;

# Restart MySQL
docker compose -f docker-compose.prod.yml restart mysql
```

---

## 📞 Support Resources

### Documentation
- Full Guide: `AWS_EC2_DEPLOYMENT_GUIDE.md`
- Quick Start: `QUICK_START_DEPLOYMENT.md`
- Checklist: `DEPLOYMENT_CHECKLIST.md`

### External Resources
- Docker Documentation: https://docs.docker.com/
- Nginx Documentation: https://nginx.org/en/docs/
- Let's Encrypt: https://letsencrypt.org/docs/
- AWS EC2: https://docs.aws.amazon.com/ec2/

---

## ✅ Success Criteria

Your deployment is successful when:

- [ ] All 13 Docker containers are running
- [ ] Frontend accessible at `https://yourdomain.com`
- [ ] API accessible at `https://api.yourdomain.com`
- [ ] SSL certificate valid (green lock)
- [ ] HTTP redirects to HTTPS
- [ ] User registration/login works
- [ ] Products display correctly
- [ ] Cart functionality works
- [ ] Orders can be placed
- [ ] Email notifications sent
- [ ] No errors in logs

---

## 🎉 Next Steps After Deployment

1. **Test Thoroughly**
   - Use `DEPLOYMENT_CHECKLIST.md` functionality testing section
   - Test on multiple devices and browsers

2. **Setup Monitoring**
   - Configure CloudWatch (optional)
   - Setup uptime monitoring
   - Configure alerts

3. **Backup Strategy**
   - Schedule automated backups
   - Test restore procedures
   - Store backups securely

4. **Documentation**
   - Document any custom configurations
   - Create runbook for common tasks
   - Document emergency procedures

5. **Performance Optimization**
   - Monitor performance metrics
   - Optimize slow queries
   - Configure CDN (optional)

6. **Business Setup**
   - Add initial products
   - Configure payment gateways
   - Customize email templates
   - Update legal pages

---

**Deployment Package Version**: 1.0
**Last Updated**: 2025-10-08
**Compatibility**: Ubuntu 22.04 LTS, Docker 24+, Docker Compose 2+

---

**Ready to Deploy?** Start with `QUICK_START_DEPLOYMENT.md` for a fast deployment or `AWS_EC2_DEPLOYMENT_GUIDE.md` for detailed instructions.

# 🚀 AWS EC2 Deployment Package
## Mahabaleshwer Mart - Production Deployment

---

## 📦 What's Included

This deployment package contains everything you need to deploy your full-stack Mahabaleshwer Mart application to AWS EC2 Ubuntu with HTTPS and a custom domain.

### ✅ Complete Deployment Solution
- **Production-ready Docker Compose configuration**
- **Nginx configurations for HTTP and HTTPS**
- **Automated deployment script**
- **Comprehensive deployment guides**
- **Step-by-step checklists**
- **Environment variable templates**

---

## 🎯 Quick Start (45 Minutes)

### Option 1: Fast Track Deployment

**Follow this order:**

1. **Read First**: `QUICK_START_DEPLOYMENT.md`
2. **Use**: `docker-compose.prod.yml`
3. **Configure**: `.env.production` (from `.env.production.example`)
4. **Deploy**: Run `./deploy.sh`
5. **Track**: Use `DEPLOYMENT_CHECKLIST.md`

### Option 2: Detailed Deployment

**Follow this order:**

1. **Read First**: `AWS_EC2_DEPLOYMENT_GUIDE.md`
2. **Reference**: `AWS_DEPLOYMENT_FILES_SUMMARY.md`
3. **Use**: All configuration files
4. **Track**: `DEPLOYMENT_CHECKLIST.md`

---

## 📚 File Guide

### 📖 Documentation Files

| File | Purpose | Read Time |
|------|---------|-----------|
| `AWS_EC2_DEPLOYMENT_GUIDE.md` | Complete deployment guide | 20 min |
| `QUICK_START_DEPLOYMENT.md` | Fast-track deployment | 5 min |
| `AWS_DEPLOYMENT_FILES_SUMMARY.md` | Overview of all files | 10 min |
| `DEPLOYMENT_CHECKLIST.md` | Track deployment progress | Reference |
| `DEPLOYMENT_README.md` | This file | 5 min |

### ⚙️ Configuration Files

| File | Purpose | Action Required |
|------|---------|-----------------|
| `docker-compose.prod.yml` | Production Docker config | ✅ Use as-is |
| `nginx-production.conf` | HTTP Nginx config | ⚠️ Update domain |
| `nginx-production-ssl.conf` | HTTPS Nginx config | ⚠️ Update domain |
| `.env.production.example` | Environment template | ⚠️ Copy & configure |
| `deploy.sh` | Deployment script | ✅ Make executable |

---

## 🔧 Pre-Deployment Setup

### 1. Update Configuration Files

#### A. Create `.env.production`
```bash
cp .env.production.example .env.production
nano .env.production
```

**Update these values:**
```env
DOMAIN=yourdomain.com
API_URL=https://api.yourdomain.com
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
JWT_SECRET=your-secure-32-character-secret
```

#### B. Update `nginx-production.conf`
```bash
nano nginx-production.conf
```

**Find and replace:**
- `yourdomain.com` → your actual domain

#### C. Update `nginx-production-ssl.conf`
```bash
nano nginx-production-ssl.conf
```

**Find and replace:**
- `yourdomain.com` → your actual domain (in multiple places)

### 2. Configure DNS Records

At your domain registrar, add:
```
Type    Name    Value
A       @       YOUR_EC2_PUBLIC_IP
A       www     YOUR_EC2_PUBLIC_IP
A       api     YOUR_EC2_PUBLIC_IP
```

---

## 🖥️ EC2 Instance Requirements

### Minimum Specifications
- **Instance Type**: t3.xlarge (4 vCPU, 16 GB RAM)
- **Storage**: 50 GB SSD (gp3)
- **OS**: Ubuntu 22.04 LTS
- **Network**: Public IP with open ports 22, 80, 443

### Why These Specs?
- **4 vCPU**: Required for 13 Docker containers
- **16 GB RAM**: Handles all microservices + databases
- **50 GB Storage**: Application + logs + databases
- **Ubuntu 22.04**: Long-term support, stable

---

## 📋 Deployment Steps Overview

### Phase 1: AWS Setup (10 min)
1. Launch EC2 instance (t3.xlarge, Ubuntu 22.04)
2. Configure security group (ports 22, 80, 443)
3. Connect via SSH
4. Note public IP address

### Phase 2: DNS Setup (5 min)
1. Add A records for @, www, api
2. Wait for DNS propagation (5-10 min)
3. Verify with `nslookup`

### Phase 3: Server Preparation (15 min)
1. Update system: `sudo apt update && sudo apt upgrade -y`
2. Install Docker & Docker Compose
3. Install Nginx
4. Install Certbot

### Phase 4: Application Deployment (20 min)
1. Clone repositories
2. Configure environment files
3. Create Docker network
4. Run deployment: `./deploy.sh`
5. Verify all services running

### Phase 5: SSL Setup (10 min)
1. Configure Nginx (HTTP)
2. Obtain SSL certificate
3. Update Nginx (HTTPS)
4. Verify HTTPS working

### Phase 6: Testing (10 min)
1. Test all functionality
2. Verify SSL certificate
3. Check logs for errors
4. Complete checklist

**Total Time**: ~70 minutes

---

## 🚀 Deployment Commands

### Using the Deployment Script (Recommended)

```bash
# Make script executable
chmod +x deploy.sh

# Full deployment
./deploy.sh

# Start services
./deploy.sh start

# Stop services
./deploy.sh stop

# Restart services
./deploy.sh restart

# View logs
./deploy.sh logs

# Check status
./deploy.sh status

# Cleanup
./deploy.sh cleanup
```

### Manual Deployment

```bash
# Create network
docker network create mahabaleshwer-mart-backend_mahabaleshwer-network

# Build and start
docker compose -f docker-compose.prod.yml up -d --build

# Check status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

---

## ✅ Verification Steps

### 1. Check Docker Containers
```bash
docker ps
# Should show 13 containers running
```

### 2. Test Services
```bash
# Frontend
curl http://localhost:4200

# API Gateway
curl http://localhost:8080/actuator/health

# Eureka Dashboard
curl http://localhost:8761
```

### 3. Test HTTPS
```bash
# Main domain
curl https://yourdomain.com

# API domain
curl https://api.yourdomain.com/actuator/health
```

### 4. Browser Testing
- Visit `https://yourdomain.com`
- Check for green lock icon
- Test user registration
- Test product browsing
- Test cart and checkout

---

## 🔍 Troubleshooting

### Services Not Starting?

**Check logs:**
```bash
docker compose -f docker-compose.prod.yml logs [service-name]
```

**Common issues:**
- Network not created: Run `docker network create mahabaleshwer-mart-backend_mahabaleshwer-network`
- Port conflicts: Check with `sudo netstat -tulpn | grep :PORT`
- Memory issues: Verify instance has 16GB RAM

### Can't Access Website?

**Check Nginx:**
```bash
sudo systemctl status nginx
sudo nginx -t
```

**Check DNS:**
```bash
nslookup yourdomain.com
```

**Check Security Group:**
- Verify ports 80 and 443 are open in AWS console

### SSL Certificate Issues?

**Check certificate:**
```bash
sudo certbot certificates
```

**Renew certificate:**
```bash
sudo certbot renew --force-renewal
sudo systemctl reload nginx
```

---

## 📊 What Gets Deployed

### Frontend
- Angular application
- Nginx web server
- Static assets

### Backend Microservices
- User Service (Authentication, User Management)
- Product Service (Product Catalog)
- Cart Service (Shopping Cart)
- Order Service (Order Management)
- Payment Service (Payment Processing)
- Notification Service (Email Notifications)

### Infrastructure
- Config Server (Centralized Configuration)
- Service Discovery (Eureka)
- API Gateway (Routing, Load Balancing)

### Databases & Cache
- MySQL (Relational Database)
- Redis (Caching)
- Kafka + Zookeeper (Message Queue)

### Total: 13 Docker Containers

---

## 🔒 Security Features

### Implemented
✅ SSL/TLS encryption (HTTPS)
✅ Security headers (HSTS, CSP, etc.)
✅ Rate limiting
✅ CORS configuration
✅ Network isolation
✅ Minimal port exposure

### Recommended
- Change default passwords
- Enable firewall (UFW)
- Install Fail2Ban
- Regular security updates
- Use strong JWT secret

---

## 📈 Monitoring

### Service Health
```bash
# Check all services
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Check specific service
docker compose -f docker-compose.prod.yml logs frontend
```

### System Resources
```bash
# Disk usage
df -h

# Memory usage
free -h

# Docker stats
docker stats

# System monitoring
htop
```

### Application Logs
```bash
# Nginx access logs
sudo tail -f /var/log/nginx/mahabaleshwer-access.log

# Nginx error logs
sudo tail -f /var/log/nginx/mahabaleshwer-error.log
```

---

## 🔄 Updates & Maintenance

### Update Application
```bash
cd ~/apps/mahabaleshwer-mart
git pull origin main
./deploy.sh
```

### Backup Database
```bash
# Create backup
docker exec mahabaleshwer-mysql mysqldump -u root -proot --all-databases > backup-$(date +%Y%m%d).sql

# Restore backup
docker exec -i mahabaleshwer-mysql mysql -u root -proot < backup-YYYYMMDD.sql
```

### Clean Up Docker
```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Full cleanup
docker system prune -a --volumes
```

---

## 📞 Getting Help

### Documentation Order
1. **Quick issue?** → Check troubleshooting section above
2. **Deployment issue?** → `QUICK_START_DEPLOYMENT.md`
3. **Detailed help?** → `AWS_EC2_DEPLOYMENT_GUIDE.md`
4. **Track progress?** → `DEPLOYMENT_CHECKLIST.md`
5. **File overview?** → `AWS_DEPLOYMENT_FILES_SUMMARY.md`

### Common Questions

**Q: Which Docker Compose file should I use?**
A: Use `docker-compose.prod.yml` for production deployment.

**Q: Do I need to modify docker-compose-full-stack.yml?**
A: No, use `docker-compose.prod.yml` instead. It's optimized for production.

**Q: How long does deployment take?**
A: First deployment: ~70 minutes. Subsequent deployments: ~15 minutes.

**Q: What if DNS hasn't propagated?**
A: You can still deploy and test using the EC2 IP. Add DNS later.

**Q: Can I use a smaller EC2 instance?**
A: Not recommended. t3.xlarge is minimum for all 13 services.

**Q: How do I get SSL certificate?**
A: Follow Step 7 in `QUICK_START_DEPLOYMENT.md` - uses Let's Encrypt (free).

---

## 🎯 Success Criteria

Your deployment is successful when:

✅ All 13 containers running (`docker ps`)
✅ Frontend loads at `https://yourdomain.com`
✅ API responds at `https://api.yourdomain.com`
✅ Green lock icon in browser (valid SSL)
✅ HTTP redirects to HTTPS
✅ User registration works
✅ Products display correctly
✅ Cart and checkout work
✅ Orders can be placed
✅ Email notifications sent

---

## 🎉 Ready to Deploy?

### Choose Your Path:

**🚀 Fast Track (45 min)**
→ Start with `QUICK_START_DEPLOYMENT.md`

**📚 Detailed Guide (70 min)**
→ Start with `AWS_EC2_DEPLOYMENT_GUIDE.md`

**📋 Organized Approach**
→ Use `DEPLOYMENT_CHECKLIST.md` to track progress

---

## 📝 Important Notes

### Before You Start
1. Have your domain name ready
2. Have AWS account with EC2 access
3. Have SSH key pair for EC2
4. Have email credentials for notifications
5. Backend repository should be at `../mahabaleshwer-mart-backend`

### During Deployment
1. Follow the guides step by step
2. Don't skip verification steps
3. Check logs if something fails
4. Use the checklist to track progress

### After Deployment
1. Test all functionality thoroughly
2. Set up monitoring
3. Configure automated backups
4. Document any custom changes
5. Set up maintenance schedule

---

## 🔐 Security Reminder

**Before going live:**
- [ ] Change all default passwords
- [ ] Use strong JWT secret (32+ characters)
- [ ] Configure firewall
- [ ] Enable automatic security updates
- [ ] Review security group rules
- [ ] Test backup and restore

---

## 📊 Cost Estimate (AWS)

**Monthly costs (approximate):**
- EC2 t3.xlarge: ~$120/month
- 50 GB Storage: ~$5/month
- Data Transfer: ~$10-50/month (varies)
- **Total**: ~$135-175/month

**Cost optimization:**
- Use Reserved Instances (save 30-70%)
- Use Spot Instances for dev/test
- Monitor and optimize resource usage

---

## 🌟 Features After Deployment

### For Users
- Fast, responsive website
- Secure HTTPS connection
- Product browsing and search
- Shopping cart
- Secure checkout
- Order tracking
- Email notifications

### For Admins
- Eureka dashboard for service monitoring
- Centralized logging
- Health check endpoints
- Automated service recovery
- Easy scaling options

---

## 📅 Maintenance Schedule

### Daily
- Monitor service health
- Check error logs

### Weekly
- Review disk usage
- Check SSL certificate status

### Monthly
- System updates
- Database optimization
- Backup verification

### Quarterly
- Security audit
- Performance review
- Cost optimization

---

**Deployment Package Version**: 1.0
**Created**: 2025-10-08
**Compatibility**: Ubuntu 22.04 LTS, Docker 24+

---

**Questions?** Refer to the comprehensive guides included in this package.

**Ready?** Let's deploy! 🚀

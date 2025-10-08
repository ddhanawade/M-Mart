# Quick Start Deployment Guide - AWS EC2
## Mahabaleshwer Mart Full Stack Application

---

## 🚀 Quick Deployment Steps

### 1. Launch EC2 Instance (5 minutes)

**Instance Configuration:**
- **AMI**: Ubuntu Server 22.04 LTS
- **Instance Type**: t3.xlarge (4 vCPU, 16 GB RAM)
- **Storage**: 50 GB gp3 SSD
- **Security Group**: Open ports 22, 80, 443, 8080, 8761

**Launch Command:**
```bash
# Connect to your EC2 instance
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
```

---

### 2. Configure DNS (5 minutes)

Add these DNS records at your domain registrar:

```
Type    Name    Value               TTL
A       @       YOUR_EC2_PUBLIC_IP  3600
A       www     YOUR_EC2_PUBLIC_IP  3600
A       api     YOUR_EC2_PUBLIC_IP  3600
```

**Verify DNS:**
```bash
nslookup yourdomain.com
```

---

### 3. Install Docker (5 minutes)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Verify
docker --version
docker compose version
```

---

### 4. Clone Repositories (2 minutes)

```bash
# Create app directory
mkdir -p ~/apps && cd ~/apps

# Clone repositories (replace with your repo URLs)
git clone YOUR_BACKEND_REPO_URL mahabaleshwer-mart-backend
git clone YOUR_FRONTEND_REPO_URL mahabaleshwer-mart

# Verify
ls -la
```

---

### 5. Deploy Application (15 minutes)

```bash
# Navigate to frontend directory
cd ~/apps/mahabaleshwer-mart

# Make deploy script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh

# Or manually:
docker network create mahabaleshwer-mart-backend_mahabaleshwer-network
docker compose -f docker-compose.prod.yml up -d --build
```

**Monitor deployment:**
```bash
# Watch logs
docker compose -f docker-compose.prod.yml logs -f

# Check status
docker compose -f docker-compose.prod.yml ps
```

---

### 6. Setup Nginx (5 minutes)

```bash
# Install Nginx
sudo apt install -y nginx

# Copy configuration (HTTP only first)
sudo cp nginx-production.conf /etc/nginx/sites-available/mahabaleshwer-mart

# Update domain name in config
sudo nano /etc/nginx/sites-available/mahabaleshwer-mart
# Replace 'yourdomain.com' with your actual domain

# Enable site
sudo ln -s /etc/nginx/sites-available/mahabaleshwer-mart /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

---

### 7. Setup SSL/HTTPS (10 minutes)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Stop Nginx temporarily
sudo systemctl stop nginx

# Obtain SSL certificate (replace with your domain and email)
sudo certbot certonly --standalone \
  -d yourdomain.com \
  -d www.yourdomain.com \
  -d api.yourdomain.com \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email

# Copy SSL configuration
sudo cp nginx-production-ssl.conf /etc/nginx/sites-available/mahabaleshwer-mart

# Update domain name in SSL config
sudo nano /etc/nginx/sites-available/mahabaleshwer-mart
# Replace 'yourdomain.com' with your actual domain

# Test and start Nginx
sudo nginx -t
sudo systemctl start nginx

# Verify SSL
curl https://yourdomain.com
```

---

### 8. Verify Deployment (2 minutes)

```bash
# Check all services are running
docker ps

# Test endpoints
curl http://localhost:8080/actuator/health
curl http://localhost:4200
curl https://yourdomain.com
curl https://api.yourdomain.com/actuator/health

# Check logs
docker compose -f docker-compose.prod.yml logs --tail=50
```

---

## ✅ Post-Deployment Checklist

- [ ] All Docker containers running (`docker ps` shows 11+ containers)
- [ ] Frontend accessible at `https://yourdomain.com`
- [ ] API accessible at `https://api.yourdomain.com`
- [ ] SSL certificate valid (green lock in browser)
- [ ] HTTP redirects to HTTPS
- [ ] User registration works
- [ ] Product browsing works
- [ ] Cart functionality works
- [ ] Order placement works
- [ ] Email notifications work

---

## 🔧 Common Commands

### Service Management
```bash
# Start all services
cd ~/apps/mahabaleshwer-mart
docker compose -f docker-compose.prod.yml up -d

# Stop all services
docker compose -f docker-compose.prod.yml down

# Restart specific service
docker compose -f docker-compose.prod.yml restart frontend

# View logs
docker compose -f docker-compose.prod.yml logs -f [service-name]

# Check status
docker compose -f docker-compose.prod.yml ps
```

### Using Deploy Script
```bash
cd ~/apps/mahabaleshwer-mart

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

# Cleanup unused resources
./deploy.sh cleanup
```

### Nginx Management
```bash
# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx

# View logs
sudo tail -f /var/log/nginx/mahabaleshwer-access.log
sudo tail -f /var/log/nginx/mahabaleshwer-error.log
```

### SSL Certificate Management
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate manually
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run

# After renewal, reload Nginx
sudo systemctl reload nginx
```

### Database Management
```bash
# Access MySQL
docker exec -it mahabaleshwer-mysql mysql -u root -proot

# Backup database
docker exec mahabaleshwer-mysql mysqldump -u root -proot --all-databases > backup.sql

# Restore database
docker exec -i mahabaleshwer-mysql mysql -u root -proot < backup.sql
```

### Monitoring
```bash
# Check disk usage
df -h

# Check memory
free -h

# Check Docker disk usage
docker system df

# View container stats
docker stats

# Clean up Docker
docker system prune -a --volumes
```

---

## 🐛 Troubleshooting

### Services not starting?
```bash
# Check logs
docker compose -f docker-compose.prod.yml logs [service-name]

# Restart service
docker compose -f docker-compose.prod.yml restart [service-name]

# Rebuild service
docker compose -f docker-compose.prod.yml up -d --build [service-name]
```

### Can't access website?
```bash
# Check Nginx status
sudo systemctl status nginx

# Check Nginx configuration
sudo nginx -t

# Check if ports are open
sudo netstat -tulpn | grep -E '80|443'

# Check security group in AWS console
```

### SSL certificate issues?
```bash
# Check certificate
sudo certbot certificates

# Renew certificate
sudo certbot renew --force-renewal

# Reload Nginx
sudo systemctl reload nginx
```

### Database connection issues?
```bash
# Check MySQL container
docker exec -it mahabaleshwer-mysql mysql -u root -proot

# Check network
docker network inspect mahabaleshwer-mart-backend_mahabaleshwer-network

# Restart MySQL
docker compose -f docker-compose.prod.yml restart mysql
```

---

## 📊 Monitoring URLs

After deployment, access these URLs:

- **Frontend**: https://yourdomain.com
- **API Gateway**: https://api.yourdomain.com
- **Eureka Dashboard**: http://YOUR_EC2_IP:8761
- **API Health**: https://api.yourdomain.com/actuator/health

---

## 🔄 Update Application

```bash
cd ~/apps/mahabaleshwer-mart

# Pull latest code
git pull origin main

# Rebuild and restart
docker compose -f docker-compose.prod.yml up -d --build

# Or use deploy script
./deploy.sh
```

---

## 📝 Important Notes

1. **Replace placeholders** in all configuration files:
   - `yourdomain.com` → your actual domain
   - `your-email@example.com` → your email
   - `YOUR_EC2_IP` → your EC2 public IP

2. **Security**:
   - Change default passwords in production
   - Use environment variables for secrets
   - Enable AWS security groups properly
   - Keep SSL certificates updated

3. **Backup**:
   - Schedule regular database backups
   - Keep backups in S3 or separate storage
   - Test restore procedures

4. **Monitoring**:
   - Set up CloudWatch for EC2 monitoring
   - Monitor disk space regularly
   - Check logs for errors

---

## 🎉 Success!

Your Mahabaleshwer Mart application is now deployed on AWS EC2 with HTTPS!

**Total Deployment Time**: ~45 minutes

**Next Steps**:
1. Test all functionality
2. Set up monitoring and alerts
3. Configure automated backups
4. Set up CI/CD pipeline (optional)

---

**Need Help?** Check the full deployment guide: `AWS_EC2_DEPLOYMENT_GUIDE.md`

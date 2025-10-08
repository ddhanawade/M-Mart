# AWS EC2 Ubuntu Deployment Guide - Mahabaleshwer Mart
## Full Stack Application with HTTPS & Custom Domain

---

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [EC2 Instance Setup](#ec2-instance-setup)
3. [Domain Configuration](#domain-configuration)
4. [Server Preparation](#server-preparation)
5. [Application Deployment](#application-deployment)
6. [SSL/HTTPS Setup with Let's Encrypt](#ssl-https-setup)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Prerequisites

### Required Items
- ✅ AWS Account with EC2 access
- ✅ Domain name (e.g., mahabaleshwarmart.com)
- ✅ SSH key pair for EC2 access
- ✅ Backend repository at `../mahabaleshwer-mart-backend`
- ✅ Frontend repository (current directory)

### Recommended EC2 Instance Specifications
- **Instance Type**: `t3.xlarge` or higher (4 vCPU, 16 GB RAM minimum)
- **Storage**: 50 GB SSD (General Purpose SSD - gp3)
- **OS**: Ubuntu 22.04 LTS
- **Region**: Choose closest to your target audience

---

## 🖥️ EC2 Instance Setup

### Step 1: Launch EC2 Instance

1. **Login to AWS Console** → Navigate to EC2 Dashboard

2. **Launch Instance**:
   ```
   Name: mahabaleshwer-mart-production
   AMI: Ubuntu Server 22.04 LTS (HVM), SSD Volume Type
   Instance Type: t3.xlarge
   Key Pair: Create new or select existing
   ```

3. **Configure Security Group**:
   Create a new security group with the following inbound rules:

   | Type          | Protocol | Port Range | Source          | Description                    |
   |---------------|----------|------------|-----------------|--------------------------------|
   | SSH           | TCP      | 22         | Your IP/0.0.0.0/0 | SSH access                   |
   | HTTP          | TCP      | 80         | 0.0.0.0/0       | HTTP traffic                   |
   | HTTPS         | TCP      | 443        | 0.0.0.0/0       | HTTPS traffic                  |
   | Custom TCP    | TCP      | 8080       | 0.0.0.0/0       | API Gateway (optional)         |
   | Custom TCP    | TCP      | 8761       | 0.0.0.0/0       | Eureka Dashboard (optional)    |

4. **Configure Storage**:
   - Root volume: 50 GB gp3
   - Enable encryption (recommended)

5. **Launch Instance** and wait for it to be in "running" state

### Step 2: Connect to EC2 Instance

```bash
# Set correct permissions for your key
chmod 400 your-key-pair.pem

# Connect to instance
ssh -i your-key-pair.pem ubuntu@your-ec2-public-ip

# Example:
# ssh -i mahabaleshwer-key.pem ubuntu@54.123.45.67
```

---

## 🌐 Domain Configuration

### Step 1: Configure DNS Records

Login to your domain registrar (GoDaddy, Namecheap, Route53, etc.) and add these DNS records:

```
Type    Name                Value                       TTL
----    ----                -----                       ---
A       @                   YOUR_EC2_PUBLIC_IP          3600
A       www                 YOUR_EC2_PUBLIC_IP          3600
A       api                 YOUR_EC2_PUBLIC_IP          3600
```

**Example**:
```
A       @                   54.123.45.67                3600
A       www                 54.123.45.67                3600
A       api                 54.123.45.67                3600
```

### Step 2: Verify DNS Propagation

Wait 5-10 minutes, then verify:

```bash
# Check DNS propagation
nslookup yourdomain.com
nslookup www.yourdomain.com
nslookup api.yourdomain.com

# Or use online tools:
# https://www.whatsmydns.net/
```

---

## 🔧 Server Preparation

### Step 1: Update System

```bash
# Update package list
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git vim net-tools htop
```

### Step 2: Install Docker

```bash
# Remove old versions
sudo apt remove docker docker-engine docker.io containerd runc

# Install dependencies
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Verify installation
docker --version
docker compose version

# Add user to docker group (no sudo needed)
sudo usermod -aG docker $USER
newgrp docker

# Test Docker
docker run hello-world
```

### Step 3: Install Nginx (for SSL termination)

```bash
# Install Nginx
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

### Step 4: Install Certbot (for SSL certificates)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Verify installation
certbot --version
```

---

## 🚀 Application Deployment

### Step 1: Clone Repositories

```bash
# Create application directory
mkdir -p ~/apps
cd ~/apps

# Clone backend repository
git clone <your-backend-repo-url> mahabaleshwer-mart-backend

# Clone frontend repository
git clone <your-frontend-repo-url> mahabaleshwer-mart

# Verify structure
ls -la
# Should show:
# mahabaleshwer-mart/
# mahabaleshwer-mart-backend/
```

### Step 2: Configure Environment Variables

```bash
# Navigate to frontend directory
cd ~/apps/mahabaleshwer-mart

# Create production environment file
nano .env.production
```

Add the following content (replace with your domain):

```env
# Production Environment Variables
NODE_ENV=production
API_URL=https://mahabaleshwar-mart.store
DOMAIN=mahabaleshwar-mart.store
```

### Step 3: Update Docker Compose for Production

The deployment will use the provided `docker-compose-full-stack.yml` with modifications for production.

Create a production-specific compose file:

```bash
cd ~/apps/mahabaleshwer-mart
nano docker-compose.prod.yml
```

This file is provided separately (see `docker-compose.prod.yml` in deployment files).

### Step 4: Create Docker Network

```bash
# Create the required network
docker network create mahabaleshwer-mart-backend_mahabaleshwer-network

# Verify network creation
docker network ls | grep mahabaleshwer
```

### Step 5: Build and Start Services

```bash
cd ~/apps/mahabaleshwer-mart

# Build and start all services
docker compose -f docker-compose.prod.yml up -d --build

# This will take 10-15 minutes for first build
# Monitor progress:
docker compose -f docker-compose.prod.yml logs -f
```

### Step 6: Verify Services

```bash
# Check running containers
docker ps

# Check service health
docker compose -f docker-compose.prod.yml ps

# Check specific service logs
docker compose -f docker-compose.prod.yml logs frontend
docker compose -f docker-compose.prod.yml logs api-gateway
docker compose -f docker-compose.prod.yml logs mysql

# Test API Gateway
curl http://localhost:8080/actuator/health

# Test Frontend
curl http://localhost:4200
```

---

## 🔒 SSL/HTTPS Setup with Let's Encrypt

### Step 1: Configure Nginx as Reverse Proxy

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/mahabaleshwer-mart
```

Add the configuration (see `nginx-production.conf` in deployment files).

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/mahabaleshwer-mart /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Step 2: Obtain SSL Certificate

```bash
# Stop Nginx temporarily
sudo systemctl stop nginx

# Obtain certificate (replace with your domain and email)
sudo certbot certonly --standalone -d mahabaleshwar-mart.store -d www.mahabaleshwar-mart.store  --email mahabaleshwarmart@gmail.com --agree-tos --no-eff-email

# Start Nginx
sudo systemctl start nginx

# Verify certificate
sudo certbot certificates
```

### Step 3: Update Nginx for HTTPS

```bash
# Edit Nginx configuration
sudo nano /etc/nginx/sites-available/mahabaleshwer-mart
```

Update with SSL configuration (see `nginx-production-ssl.conf` in deployment files).

```bash
# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Step 4: Setup Auto-Renewal

```bash
# Test renewal process
sudo certbot renew --dry-run

# Certbot automatically sets up a systemd timer
# Verify it's active
sudo systemctl status certbot.timer

# Manual renewal (if needed)
sudo certbot renew
sudo systemctl reload nginx
```

### Step 5: Verify HTTPS

```bash
# Test HTTPS connection
curl https://mahabaleshwar-mart.store
curl https://mahabaleshwar-mart.store/actuator/health

# Check SSL certificate
openssl s_client -connect mahabaleshwar-mart.store:443 -servername mahabaleshwar-mart.store
```

---

## 📊 Monitoring & Maintenance

### Docker Container Management

```bash
# View all containers
docker ps -a

# View logs
docker compose -f docker-compose.prod.yml logs -f [service-name]

# Restart specific service
docker compose -f docker-compose.prod.yml restart [service-name]

# Stop all services
docker compose -f docker-compose.prod.yml down

# Start all services
docker compose -f docker-compose.prod.yml up -d

# Remove all containers and volumes (CAUTION!)
docker compose -f docker-compose.prod.yml down -v
```

### System Monitoring

```bash
# Check disk usage
df -h

# Check memory usage
free -h

# Check CPU usage
htop

# Check Docker disk usage
docker system df

# Clean up unused Docker resources
docker system prune -a --volumes
```

### Database Backup

```bash
# Create backup directory
mkdir -p ~/backups

# Backup MySQL database
docker exec mahabaleshwer-mysql mysqldump -u root -proot --all-databases > ~/backups/mysql-backup-$(date +%Y%m%d-%H%M%S).sql

# Restore from backup
docker exec -i mahabaleshwer-mysql mysql -u root -proot < ~/backups/mysql-backup-YYYYMMDD-HHMMSS.sql
```

### Application Updates

```bash
cd ~/apps/mahabaleshwer-mart

# Pull latest code
git pull origin main

# Rebuild and restart
docker compose -f docker-compose.prod.yml up -d --build

# Or rebuild specific service
docker compose -f docker-compose.prod.yml up -d --build frontend
```

### Log Management

```bash
# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# View Docker logs
docker compose -f docker-compose.prod.yml logs -f --tail=100

# Clear Docker logs
sudo sh -c "truncate -s 0 /var/lib/docker/containers/*/*-json.log"
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Services Not Starting

```bash
# Check service status
docker compose -f docker-compose.prod.yml ps

# Check logs for errors
docker compose -f docker-compose.prod.yml logs [service-name]

# Restart service
docker compose -f docker-compose.prod.yml restart [service-name]

# Rebuild service
docker compose -f docker-compose.prod.yml up -d --build [service-name]
```

#### 2. Database Connection Issues

```bash
# Check MySQL container
docker exec -it mahabaleshwer-mysql mysql -u root -proot

# Verify databases
SHOW DATABASES;

# Check network connectivity
docker exec mahabaleshwer-user-service ping mysql
```

#### 3. SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew certificate manually
sudo certbot renew --force-renewal

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

#### 4. Port Conflicts

```bash
# Check what's using a port
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443

# Kill process using port
sudo kill -9 <PID>
```

#### 5. Out of Memory

```bash
# Check memory usage
free -h
docker stats

# Restart services to free memory
docker compose -f docker-compose.prod.yml restart

# Increase swap space (if needed)
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

#### 6. Disk Space Issues

```bash
# Check disk usage
df -h

# Clean Docker resources
docker system prune -a --volumes

# Remove old logs
sudo find /var/log -type f -name "*.log" -mtime +30 -delete
```

### Health Check Commands

```bash
# Check all services health
curl http://localhost:8080/actuator/health
curl http://localhost:8081/actuator/health  # User Service
curl http://localhost:8082/actuator/health  # Product Service
curl http://localhost:8083/actuator/health  # Cart Service
curl http://localhost:8084/actuator/health  # Order Service
curl http://localhost:8086/api/payments/health  # Payment Service
curl http://localhost:8085/actuator/health  # Notification Service

# Check Eureka Dashboard
curl http://localhost:8761

# Check frontend
curl http://localhost:4200
```

---

## 📝 Post-Deployment Checklist

- [ ] EC2 instance running and accessible
- [ ] DNS records configured and propagated
- [ ] Docker and Docker Compose installed
- [ ] All services running (`docker ps` shows all containers)
- [ ] Database initialized with data
- [ ] SSL certificate obtained and installed
- [ ] HTTPS working on all domains
- [ ] HTTP redirects to HTTPS
- [ ] API endpoints accessible via HTTPS
- [ ] Frontend loads correctly
- [ ] User registration/login working
- [ ] Product browsing working
- [ ] Cart functionality working
- [ ] Order placement working
- [ ] Email notifications working
- [ ] Backup strategy in place
- [ ] Monitoring setup
- [ ] Auto-renewal for SSL configured

---

## 🎉 Success Verification

After deployment, verify everything is working:

1. **Visit your website**: `https://yourdomain.com`
2. **Check API**: `https://api.yourdomain.com/actuator/health`
3. **Test user registration**: Create a new account
4. **Test product browsing**: Browse products
5. **Test cart**: Add items to cart
6. **Test checkout**: Place a test order
7. **Check email**: Verify email notifications

---

## 📞 Support & Resources

- **Docker Documentation**: https://docs.docker.com/
- **Nginx Documentation**: https://nginx.org/en/docs/
- **Let's Encrypt**: https://letsencrypt.org/docs/
- **AWS EC2 Documentation**: https://docs.aws.amazon.com/ec2/

---

## 🔄 Maintenance Schedule

### Daily
- Monitor application logs
- Check service health

### Weekly
- Review disk usage
- Check SSL certificate expiry
- Review security group rules

### Monthly
- Update system packages
- Backup database
- Review and optimize Docker images
- Check for application updates

---

**Deployment Date**: _____________
**Deployed By**: _____________
**Domain**: _____________
**EC2 Instance ID**: _____________
**SSL Certificate Expiry**: _____________

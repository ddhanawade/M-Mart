# AWS EC2 Deployment Checklist
## Mahabaleshwer Mart - Production Deployment

---

## 📋 Pre-Deployment Checklist

### AWS Account Setup
- [ ] AWS account created and verified
- [ ] IAM user created with EC2 access
- [ ] SSH key pair generated and downloaded
- [ ] Key pair file permissions set (`chmod 400 your-key.pem`)

### Domain Setup
- [ ] Domain name purchased and verified
- [ ] Domain registrar access available
- [ ] DNS management access confirmed

### Code Repositories
- [ ] Backend repository accessible
- [ ] Frontend repository accessible
- [ ] All code committed and pushed
- [ ] Production branch created (if applicable)

### Configuration Files
- [ ] `.env.production` file created with actual values
- [ ] Email credentials configured
- [ ] JWT secret generated (32+ characters)
- [ ] Database passwords changed from defaults

---

## 🖥️ EC2 Instance Setup

### Launch Instance
- [ ] EC2 instance launched (t3.xlarge or higher)
- [ ] Ubuntu 22.04 LTS selected
- [ ] 50 GB storage allocated
- [ ] Instance in "running" state
- [ ] Public IP address noted: `_________________`
- [ ] Elastic IP allocated (optional but recommended)

### Security Group Configuration
- [ ] Security group created: `mahabaleshwer-mart-sg`
- [ ] SSH (22) - Your IP or 0.0.0.0/0
- [ ] HTTP (80) - 0.0.0.0/0
- [ ] HTTPS (443) - 0.0.0.0/0
- [ ] Custom TCP (8080) - 0.0.0.0/0 (API Gateway - optional)
- [ ] Custom TCP (8761) - 0.0.0.0/0 (Eureka - optional)

### SSH Access
- [ ] Can connect via SSH: `ssh -i key.pem ubuntu@EC2_IP`
- [ ] User has sudo privileges
- [ ] SSH connection stable

---

## 🌐 DNS Configuration

### DNS Records Created
- [ ] A record: `@` → `EC2_PUBLIC_IP`
- [ ] A record: `www` → `EC2_PUBLIC_IP`
- [ ] A record: `api` → `EC2_PUBLIC_IP`
- [ ] TTL set to 3600 or lower

### DNS Verification
- [ ] `nslookup yourdomain.com` returns EC2 IP
- [ ] `nslookup www.yourdomain.com` returns EC2 IP
- [ ] `nslookup api.yourdomain.com` returns EC2 IP
- [ ] DNS propagation complete (check whatsmydns.net)

---

## 🔧 Server Preparation

### System Updates
- [ ] System updated: `sudo apt update && sudo apt upgrade -y`
- [ ] Essential tools installed: `curl, wget, git, vim, htop`
- [ ] Timezone configured: `sudo timedatectl set-timezone Asia/Kolkata`

### Docker Installation
- [ ] Docker installed and verified: `docker --version`
- [ ] Docker Compose installed: `docker compose version`
- [ ] User added to docker group: `sudo usermod -aG docker $USER`
- [ ] Docker working without sudo: `docker ps`
- [ ] Docker service enabled: `sudo systemctl enable docker`

### Nginx Installation
- [ ] Nginx installed: `sudo apt install nginx`
- [ ] Nginx running: `sudo systemctl status nginx`
- [ ] Nginx enabled on boot: `sudo systemctl enable nginx`
- [ ] Default site removed: `sudo rm /etc/nginx/sites-enabled/default`

### Certbot Installation
- [ ] Certbot installed: `sudo apt install certbot python3-certbot-nginx`
- [ ] Certbot version verified: `certbot --version`

---

## 📦 Application Deployment

### Repository Setup
- [ ] App directory created: `mkdir -p ~/apps`
- [ ] Backend cloned to: `~/apps/mahabaleshwer-mart-backend`
- [ ] Frontend cloned to: `~/apps/mahabaleshwer-mart`
- [ ] Correct branches checked out
- [ ] `.env.production` file created and configured

### Docker Network
- [ ] Network created: `docker network create mahabaleshwer-mart-backend_mahabaleshwer-network`
- [ ] Network verified: `docker network ls | grep mahabaleshwer`

### Configuration Files Updated
- [ ] `docker-compose.prod.yml` - domain names updated
- [ ] `nginx-production.conf` - domain names updated
- [ ] `nginx-production-ssl.conf` - domain names updated
- [ ] `.env.production` - all values configured
- [ ] Email credentials verified

### Build and Deploy
- [ ] Deploy script executable: `chmod +x deploy.sh`
- [ ] Services built: `docker compose -f docker-compose.prod.yml build`
- [ ] Services started: `docker compose -f docker-compose.prod.yml up -d`
- [ ] All containers running: `docker ps` (11+ containers)

### Service Health Checks
- [ ] Config Server healthy (port 8888)
- [ ] Service Discovery healthy (port 8761)
- [ ] API Gateway healthy (port 8080)
- [ ] MySQL healthy (port 3306)
- [ ] Redis healthy (port 6379)
- [ ] Kafka healthy (port 9092)
- [ ] User Service healthy (port 8081)
- [ ] Product Service healthy (port 8082)
- [ ] Cart Service healthy (port 8083)
- [ ] Order Service healthy (port 8084)
- [ ] Payment Service healthy (port 8086)
- [ ] Notification Service healthy (port 8085)
- [ ] Frontend healthy (port 4200)

---

## 🔒 SSL/HTTPS Setup

### Nginx Configuration (HTTP)
- [ ] Nginx config copied: `/etc/nginx/sites-available/mahabaleshwer-mart`
- [ ] Domain names updated in config
- [ ] Site enabled: `sudo ln -s /etc/nginx/sites-available/mahabaleshwer-mart /etc/nginx/sites-enabled/`
- [ ] Config tested: `sudo nginx -t`
- [ ] Nginx reloaded: `sudo systemctl reload nginx`
- [ ] HTTP access working: `http://yourdomain.com`

### SSL Certificate
- [ ] Nginx stopped: `sudo systemctl stop nginx`
- [ ] Certificate obtained for all domains:
  - [ ] `yourdomain.com`
  - [ ] `www.yourdomain.com`
  - [ ] `api.yourdomain.com`
- [ ] Certificate files exist in `/etc/letsencrypt/live/yourdomain.com/`
- [ ] Certificate verified: `sudo certbot certificates`

### Nginx Configuration (HTTPS)
- [ ] SSL config copied and updated
- [ ] Domain names updated in SSL config
- [ ] Certificate paths verified in config
- [ ] Config tested: `sudo nginx -t`
- [ ] Nginx started: `sudo systemctl start nginx`

### SSL Verification
- [ ] HTTPS working: `https://yourdomain.com`
- [ ] HTTPS working: `https://www.yourdomain.com`
- [ ] HTTPS working: `https://api.yourdomain.com`
- [ ] HTTP redirects to HTTPS
- [ ] Green lock icon in browser
- [ ] SSL certificate valid (check in browser)
- [ ] No mixed content warnings

### Auto-Renewal
- [ ] Auto-renewal tested: `sudo certbot renew --dry-run`
- [ ] Certbot timer active: `sudo systemctl status certbot.timer`

---

## ✅ Functionality Testing

### Frontend Testing
- [ ] Homepage loads: `https://yourdomain.com`
- [ ] All pages accessible (products, cart, checkout, etc.)
- [ ] Images loading correctly
- [ ] No console errors in browser
- [ ] Mobile responsive design working

### API Testing
- [ ] API health check: `https://api.yourdomain.com/actuator/health`
- [ ] API Gateway accessible
- [ ] CORS working correctly
- [ ] No 502/504 errors

### User Authentication
- [ ] User registration working
- [ ] Email verification sent
- [ ] User login working
- [ ] JWT tokens generated
- [ ] Protected routes working
- [ ] Logout working

### Product Management
- [ ] Product listing working
- [ ] Product details loading
- [ ] Product search working
- [ ] Product filtering working
- [ ] Product images displaying

### Shopping Cart
- [ ] Add to cart working
- [ ] Update quantity working
- [ ] Remove from cart working
- [ ] Cart persists after login
- [ ] Cart total calculated correctly

### Checkout & Orders
- [ ] Checkout process working
- [ ] Address management working
- [ ] Order placement successful
- [ ] Order confirmation received
- [ ] Order history accessible
- [ ] Order details displaying

### Notifications
- [ ] Welcome email received
- [ ] Order confirmation email received
- [ ] Email templates rendering correctly
- [ ] Email delivery working

### Payment (if enabled)
- [ ] Payment gateway initialized
- [ ] Payment processing working
- [ ] Payment confirmation received
- [ ] Payment status updated

---

## 📊 Monitoring & Maintenance

### Logging Setup
- [ ] Application logs accessible
- [ ] Nginx access logs: `/var/log/nginx/mahabaleshwer-access.log`
- [ ] Nginx error logs: `/var/log/nginx/mahabaleshwer-error.log`
- [ ] Docker logs accessible: `docker compose logs`
- [ ] Log rotation configured

### Monitoring
- [ ] CloudWatch agent installed (optional)
- [ ] Disk space monitoring setup
- [ ] Memory monitoring setup
- [ ] CPU monitoring setup
- [ ] Service health monitoring

### Backup Strategy
- [ ] Database backup script created
- [ ] Backup schedule configured
- [ ] Backup storage location defined
- [ ] Restore procedure tested
- [ ] Backup retention policy defined

### Documentation
- [ ] Server credentials documented securely
- [ ] Deployment process documented
- [ ] Troubleshooting guide available
- [ ] Emergency contacts listed
- [ ] Runbook created

---

## 🔐 Security Hardening

### Server Security
- [ ] SSH key-based authentication only
- [ ] Root login disabled
- [ ] Firewall configured (UFW)
- [ ] Fail2ban installed (optional)
- [ ] Automatic security updates enabled

### Application Security
- [ ] Default passwords changed
- [ ] Environment variables secured
- [ ] API rate limiting configured
- [ ] CORS properly configured
- [ ] Security headers configured in Nginx

### Database Security
- [ ] MySQL root password changed
- [ ] Database users with limited privileges
- [ ] Remote access restricted
- [ ] Regular backups scheduled

---

## 📝 Post-Deployment Tasks

### Performance Optimization
- [ ] Gzip compression enabled
- [ ] Static assets cached
- [ ] Database queries optimized
- [ ] Redis caching working
- [ ] CDN configured (optional)

### SEO & Analytics
- [ ] Google Analytics added (optional)
- [ ] Sitemap generated
- [ ] Robots.txt configured
- [ ] Meta tags optimized

### Business Setup
- [ ] Admin account created
- [ ] Initial products added
- [ ] Payment gateway configured
- [ ] Email templates customized
- [ ] Terms & conditions updated
- [ ] Privacy policy updated

---

## 🎉 Go-Live Checklist

### Final Verification
- [ ] All functionality tested end-to-end
- [ ] Performance acceptable (page load < 3s)
- [ ] No critical errors in logs
- [ ] SSL certificate valid
- [ ] Backups working
- [ ] Monitoring active

### Communication
- [ ] Stakeholders notified
- [ ] Support team briefed
- [ ] Documentation shared
- [ ] Emergency contacts confirmed

### Launch
- [ ] DNS TTL reduced (if needed)
- [ ] Final smoke test completed
- [ ] Application live and accessible
- [ ] Monitoring dashboard active

---

## 📞 Important Information

**Deployment Date**: _______________

**Deployed By**: _______________

**Server Details**:
- EC2 Instance ID: _______________
- Public IP: _______________
- Elastic IP: _______________
- Region: _______________

**Domain Details**:
- Domain: _______________
- Registrar: _______________
- DNS Provider: _______________

**SSL Certificate**:
- Issued Date: _______________
- Expiry Date: _______________
- Auto-renewal: ☐ Yes ☐ No

**Access Credentials** (Store Securely):
- SSH Key Location: _______________
- Database Password: _______________
- Email Password: _______________
- Admin Email: _______________

**Emergency Contacts**:
- Technical Lead: _______________
- DevOps: _______________
- Support: _______________

---

## 🔄 Regular Maintenance Schedule

### Daily
- [ ] Check application health
- [ ] Monitor error logs
- [ ] Verify backups completed

### Weekly
- [ ] Review disk usage
- [ ] Check SSL certificate expiry
- [ ] Review security logs
- [ ] Update application (if needed)

### Monthly
- [ ] System updates: `sudo apt update && sudo apt upgrade`
- [ ] Database optimization
- [ ] Clean up Docker resources
- [ ] Review and rotate logs
- [ ] Test backup restore

### Quarterly
- [ ] Security audit
- [ ] Performance review
- [ ] Cost optimization review
- [ ] Documentation update

---

**Deployment Status**: ☐ In Progress ☐ Completed ☐ Verified

**Sign-off**: _______________  **Date**: _______________

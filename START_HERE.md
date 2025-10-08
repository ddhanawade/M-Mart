# 🎯 START HERE - AWS EC2 Deployment
## Mahabaleshwer Mart Full Stack Application

---

## 👋 Welcome!

You now have a **complete deployment package** for deploying your Mahabaleshwer Mart application (Frontend + Backend) to AWS EC2 Ubuntu with HTTPS and your custom domain.

---

## 📦 What You Have

✅ **8 deployment files** ready to use
✅ **Production-ready Docker configuration**
✅ **SSL/HTTPS setup guides**
✅ **Automated deployment script**
✅ **Comprehensive documentation**
✅ **Step-by-step checklists**

---

## 🚀 Quick Decision Guide

### Choose Your Path:

#### 🏃 **I want to deploy FAST** (45 minutes)
→ **Read**: `QUICK_START_DEPLOYMENT.md`
→ **Use**: `docker-compose.prod.yml`
→ **Run**: `./deploy.sh`

#### 📚 **I want detailed instructions** (70 minutes)
→ **Read**: `AWS_EC2_DEPLOYMENT_GUIDE.md`
→ **Reference**: `AWS_DEPLOYMENT_FILES_SUMMARY.md`
→ **Track**: `DEPLOYMENT_CHECKLIST.md`

#### 🔍 **I want to understand the files first**
→ **Read**: `DEPLOYMENT_README.md`
→ **Then**: Choose fast or detailed path above

---

## 📁 Your Deployment Files

### 📖 **Documentation** (Read These)
1. **DEPLOYMENT_README.md** - Overview of all files (START HERE)
2. **QUICK_START_DEPLOYMENT.md** - Fast deployment guide
3. **AWS_EC2_DEPLOYMENT_GUIDE.md** - Complete detailed guide
4. **AWS_DEPLOYMENT_FILES_SUMMARY.md** - File descriptions
5. **DEPLOYMENT_CHECKLIST.md** - Track your progress

### ⚙️ **Configuration** (Use These)
6. **docker-compose.prod.yml** - Production Docker config
7. **nginx-production.conf** - HTTP Nginx config
8. **nginx-production-ssl.conf** - HTTPS Nginx config
9. **.env.production.example** - Environment template
10. **deploy.sh** - Automated deployment script

---

## ⚡ Super Quick Start (TL;DR)

```bash
# 1. Launch EC2 (t3.xlarge, Ubuntu 22.04)
# 2. Configure DNS (A records for @, www, api)
# 3. Connect to EC2
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# 4. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker

# 5. Clone repos
mkdir -p ~/apps && cd ~/apps
git clone <backend-repo> mahabaleshwer-mart-backend
git clone <frontend-repo> mahabaleshwer-mart

# 6. Configure
cd mahabaleshwer-mart
cp .env.production.example .env.production
nano .env.production  # Update values
nano nginx-production.conf  # Update domain
nano nginx-production-ssl.conf  # Update domain

# 7. Deploy
chmod +x deploy.sh
./deploy.sh

# 8. Setup Nginx + SSL
sudo apt install nginx certbot python3-certbot-nginx
sudo cp nginx-production.conf /etc/nginx/sites-available/mahabaleshwer-mart
# Update domain in config, then:
sudo ln -s /etc/nginx/sites-available/mahabaleshwer-mart /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 9. Get SSL certificate
sudo systemctl stop nginx
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
sudo cp nginx-production-ssl.conf /etc/nginx/sites-available/mahabaleshwer-mart
# Update domain in SSL config, then:
sudo nginx -t && sudo systemctl start nginx

# 10. Verify
curl https://yourdomain.com
```

---

## ✅ Before You Start - Checklist

### Required Items
- [ ] AWS account with EC2 access
- [ ] Domain name (e.g., mahabaleshwarmart.com)
- [ ] SSH key pair for EC2
- [ ] Email credentials (for notifications)
- [ ] Backend repository location
- [ ] Frontend repository (current directory)

### Required Knowledge
- [ ] Basic Linux commands
- [ ] SSH connection
- [ ] DNS configuration
- [ ] Text editor (nano/vim)

**Don't worry!** The guides explain everything step-by-step.

---

## 🎯 Recommended Deployment Flow

### Step 1: Preparation (10 min)
1. Read `DEPLOYMENT_README.md` (this gives you the overview)
2. Choose fast or detailed path
3. Gather required items from checklist above

### Step 2: AWS Setup (10 min)
1. Launch EC2 instance (t3.xlarge, Ubuntu 22.04)
2. Configure security group (ports 22, 80, 443)
3. Note your public IP

### Step 3: DNS Setup (5 min)
1. Add A records at your domain registrar
2. Wait for propagation (5-10 min)

### Step 4: Follow Your Chosen Guide
- **Fast**: `QUICK_START_DEPLOYMENT.md`
- **Detailed**: `AWS_EC2_DEPLOYMENT_GUIDE.md`

### Step 5: Track Progress
- Use `DEPLOYMENT_CHECKLIST.md` to ensure nothing is missed

---

## 🔧 Key Configuration Changes Needed

### 1. Update `.env.production`
```env
DOMAIN=yourdomain.com                    # ← Your domain
API_URL=https://api.yourdomain.com       # ← Your API URL
MAIL_USERNAME=your-email@gmail.com       # ← Your email
MAIL_PASSWORD=your-app-password          # ← Your email password
JWT_SECRET=your-32-char-secret           # ← Generate secure secret
```

### 2. Update Nginx Configs
Replace `yourdomain.com` with your actual domain in:
- `nginx-production.conf`
- `nginx-production-ssl.conf`

### 3. Configure DNS
Add these records at your domain registrar:
```
A    @      YOUR_EC2_PUBLIC_IP
A    www    YOUR_EC2_PUBLIC_IP
A    api    YOUR_EC2_PUBLIC_IP
```

---

## 🎓 Understanding the Deployment

### What Gets Deployed?

**Frontend** (1 container)
- Angular application with Nginx

**Backend Microservices** (6 containers)
- User Service
- Product Service
- Cart Service
- Order Service
- Payment Service
- Notification Service

**Infrastructure** (3 containers)
- Config Server
- Service Discovery (Eureka)
- API Gateway

**Databases & Queue** (4 containers)
- MySQL
- Redis
- Kafka
- Zookeeper

**Total: 13 Docker containers**

### Architecture
```
Internet → Nginx (SSL) → Frontend + API Gateway → Microservices → Databases
```

---

## 💡 Important Notes

### About docker-compose-full-stack.yml
❌ **Don't use** `docker-compose-full-stack.yml` for production
✅ **Use** `docker-compose.prod.yml` instead

**Why?**
- Production-optimized settings
- Better health checks
- Automatic restart policies
- Production logging levels
- Enhanced security

### About EC2 Instance Size
**Minimum**: t3.xlarge (4 vCPU, 16 GB RAM)

**Why?**
- 13 Docker containers need resources
- MySQL, Redis, Kafka require memory
- Smooth operation under load

**Don't use smaller instances** - they will run out of memory.

---

## 🔒 Security Highlights

### Automatically Configured
✅ HTTPS/SSL encryption
✅ Security headers
✅ Rate limiting
✅ Network isolation
✅ Minimal port exposure

### You Should Configure
⚠️ Change default passwords
⚠️ Use strong JWT secret
⚠️ Enable firewall
⚠️ Regular security updates

---

## 📊 Expected Results

### After Successful Deployment

**Services Running**
```bash
docker ps
# Should show 13 containers
```

**Websites Accessible**
- `https://yourdomain.com` - Frontend
- `https://api.yourdomain.com` - API
- `http://YOUR_EC2_IP:8761` - Eureka Dashboard

**Features Working**
- User registration/login
- Product browsing
- Shopping cart
- Checkout process
- Order placement
- Email notifications

---

## 🐛 If Something Goes Wrong

### Quick Troubleshooting

**Services not starting?**
```bash
docker compose -f docker-compose.prod.yml logs [service-name]
```

**Can't access website?**
```bash
sudo systemctl status nginx
sudo nginx -t
```

**SSL issues?**
```bash
sudo certbot certificates
sudo certbot renew --force-renewal
```

**Database issues?**
```bash
docker exec -it mahabaleshwer-mysql mysql -u root -proot
```

**For detailed troubleshooting**, see:
- `QUICK_START_DEPLOYMENT.md` - Troubleshooting section
- `AWS_EC2_DEPLOYMENT_GUIDE.md` - Troubleshooting section

---

## 📞 Need Help?

### Documentation Hierarchy
1. **Quick issue?** → Check troubleshooting sections
2. **Deployment help?** → `QUICK_START_DEPLOYMENT.md`
3. **Detailed guide?** → `AWS_EC2_DEPLOYMENT_GUIDE.md`
4. **File overview?** → `AWS_DEPLOYMENT_FILES_SUMMARY.md`
5. **Track progress?** → `DEPLOYMENT_CHECKLIST.md`

---

## 🎉 Ready to Deploy?

### Your Next Step:

#### 🏃 For Fast Deployment
**Open**: `QUICK_START_DEPLOYMENT.md`
**Time**: 45 minutes

#### 📚 For Detailed Deployment
**Open**: `AWS_EC2_DEPLOYMENT_GUIDE.md`
**Time**: 70 minutes

#### 🔍 Want to Understand First
**Open**: `DEPLOYMENT_README.md`
**Time**: 10 minutes, then choose above

---

## ✨ What Makes This Deployment Package Special?

✅ **Complete Solution** - Everything you need in one place
✅ **Production-Ready** - Optimized configurations
✅ **Well-Documented** - Step-by-step guides
✅ **Tested** - Based on best practices
✅ **Secure** - HTTPS, security headers, rate limiting
✅ **Automated** - Deployment script included
✅ **Maintainable** - Easy updates and monitoring

---

## 📝 Final Checklist Before Starting

- [ ] I have read this file (START_HERE.md)
- [ ] I have chosen my deployment path (fast or detailed)
- [ ] I have all required items (AWS account, domain, etc.)
- [ ] I have the next guide ready to open
- [ ] I'm ready to start!

---

## 🚀 Let's Deploy!

**Open your chosen guide and let's get started!**

**Fast Track** → `QUICK_START_DEPLOYMENT.md`
**Detailed** → `AWS_EC2_DEPLOYMENT_GUIDE.md`

---

**Good luck with your deployment! 🎉**

---

*Deployment Package v1.0 | Created: 2025-10-08 | For: Mahabaleshwer Mart*

# ================================================================
# SANATA CONSTRUCTION - CentOS Production Setup Guide
# Complete guide for setting up on CentOS server
# ================================================================

# ================================================================
# PREREQUISITE: Install Required Packages
# ================================================================

# 1. Update system
sudo yum update -y

# 2. Install EPEL and utilities
sudo yum install -y epel-release curl wget vim

# 3. Install Nginx
sudo yum install -y nginx
sudo systemctl enable nginx

# 4. Install Certbot for Let's Encrypt SSL
sudo yum install -y certbot python3-certbot-nginx

# 5. Install Node.js 18 (LTS)
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# 6. Install PM2 globally
sudo npm install -g pm2

# 7. Install Git
sudo yum install -y git

# 8. Create required directories
sudo mkdir -p /var/www/sanata
sudo mkdir -p /var/www/letsencrypt
sudo mkdir -p /var/log/sanata
sudo mkdir -p /etc/letsencrypt/live/sanatagroup.id
sudo chown -R $USER:$USER /var/www/sanata
sudo chown -R $USER:$USER /var/www/letsencrypt

# ================================================================
# STEP 1: Deploy Application
# ================================================================

# Clone/pull repository
cd /var/www/sanata
git clone https://github.com/saifulalm/sanata.git .
# ATAU jika sudah ada:
# git pull origin master

# Install dependencies
npm install

# Setup environment
cp .env.example .env  # jika ada
# Edit .env dengan credentials yang benar

# Generate Prisma client
npm run prisma:generate --workspace backend

# Build application
npm run build:backend
npm run build:web

# ================================================================
# STEP 2: Setup PM2 with Ecosystem Config
# ================================================================

# Create logs directory
sudo mkdir -p /var/log/sanata
sudo chown -R $USER:$USER /var/log/sanata

# Start with ecosystem config
pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Setup startup script (untuk restart otomatis setelah reboot)
pm2 startup
# COPY DAN RUN command yang muncul dari output pm2 startup

# ================================================================
# STEP 3: Setup Let's Encrypt SSL
# ================================================================

# A. STOP NGINX SEBELUM REQUEST SSL
sudo systemctl stop nginx

# B. REQUEST SSL certificate untuk domain
sudo certbot certonly --standalone \
  --prehook "systemctl stop nginx" \
  --posthook "systemctl start nginx" \
  -d sanatagroup.id \
  -d www.sanatagroup.id \
  -d api.sanatagroup.id \
  --email admin@sanatagroup.id \
  --agree-tos \
  --non-interactive \
  --keep-until-expiring

# C. Verify SSL certificates created
sudo ls -la /etc/letsencrypt/live/sanatagroup.id/

# Anda akan melihat:
# - fullchain.pem
# - privkey.pem
# - chain.pem

# D. Auto-renewal setup
sudo crontab -e
# Tambahkan baris ini:
# 0 0 * * * certbot renew --post-hook "systemctl reload nginx"

# ================================================================
# STEP 4: Configure Nginx
# ================================================================

# A. Backup existing nginx config
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup

# B. Create nginx config
sudo cp /var/www/sanata/nginx-centos.conf /etc/nginx/conf.d/sanata.conf

# C. Edit config untuk verify paths (optional)
sudo vim /etc/nginx/conf.d/sanata.conf
# Pastikan semua path sudah benar:
# - /var/www/sanata (app directory)
# - /var/log/nginx (logs)
# - /etc/letsencrypt/live/sanatagroup.id (SSL)

# D. Create logs directory
sudo mkdir -p /var/log/nginx
sudo chown -R nginx:nginx /var/log/nginx

# E. Test nginx configuration
sudo nginx -t

# Output yang benar:
# nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
# nginx: configuration file /etc/nginx/nginx.conf test is successful

# F. Start nginx
sudo systemctl start nginx
sudo systemctl status nginx

# G. Enable nginx
sudo systemctl enable nginx

# ================================================================
# STEP 5: Firewall Configuration
# ================================================================

# Check firewall status
sudo systemctl status firewalld

# Open ports if firewalld is active
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload

# List active rules
sudo firewall-cmd --list-all

# ================================================================
# STEP 6: Verify Everything Works
# ================================================================

# A. Check services status
pm2 list
sudo systemctl status nginx

# B. Test API endpoint
curl -I https://api.sanatagroup.id/health
# Expected: HTTP/2 200

# C. Test main website
curl -I https://sanatagroup.id
# Expected: HTTP/2 200

# D. Test SSL certificate
curl -v https://sanatagroup.id 2>&1 | grep -E "(SSL|TLS|certificate)"

# ================================================================
# TROUBLESHOOTING
# ================================================================

# Nginx logs
sudo tail -f /var/log/nginx/sanata-api-error.log
sudo tail -f /var/log/nginx/sanata-web-error.log

# PM2 logs
pm2 logs sanata-backend --lines 50
pm2 logs sanata-web --lines 50

# Check port binding
sudo netstat -tlnp | grep -E "(5000|5001|80|443)"

# Check if services are running
curl -I http://127.0.0.1:5000/health
curl -I http://127.0.0.1:5001

# Restart everything
pm2 restart all
sudo systemctl restart nginx

# ================================================================
# QUICK COMMANDS REFERENCE
# ================================================================

# Deploy update
cd /var/www/sanata && git pull && npm run build:backend && npm run build:web && pm2 restart all

# Restart services
pm2 restart all && sudo systemctl reload nginx

# View logs
pm2 logs --lines 100

# SSL certificate info
sudo certbot certificates

# Manual SSL renewal
sudo certbot renew --dry-run

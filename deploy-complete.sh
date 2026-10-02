#!/bin/bash
# ============================================================
# SANATA CONSTRUCTION - Complete Deployment Script
# Run: ./deploy-complete.sh
# ============================================================

set -e

echo "=============================================="
echo "SANATA CONSTRUCTION - DEPLOYMENT SCRIPT"
echo "=============================================="
echo ""

# Check if running as root or with sudo
if [ "$EUID" -eq 0 ]; then
    SUDO=""
else
    SUDO="sudo"
fi

# ============================================================
# STEP 1: Generate SSL Self-Signed Certificates
# ============================================================
echo "=== STEP 1: Generate SSL Certificates ==="

$SUDO mkdir -p /etc/nginx/ssl/sanata.id
$SUDO openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/sanata.id/privkey.pem \
    -out /etc/nginx/ssl/sanata.id/fullchain.pem \
    -subj "/C=ID/ST=Jakarta/L=Jakarta/O=Sanata Construction/CN=sanata.id"

$SUDO chmod 600 /etc/nginx/ssl/sanata.id/privkey.pem
$SUDO chmod 644 /etc/nginx/ssl/sanata.id/fullchain.pem

echo "SSL certificates generated at /etc/nginx/ssl/sanata.id/"
ls -la /etc/nginx/ssl/sanata.id/

# ============================================================
# STEP 2: Setup Nginx Configuration
# ============================================================
echo ""
echo "=== STEP 2: Setup Nginx Configuration ==="

# Check if sites-enabled exists, create if not
if [ ! -d "/etc/nginx/sites-enabled" ]; then
    echo "Creating /etc/nginx/sites-enabled directory..."
    $SUDO mkdir -p /etc/nginx/sites-enabled
    # Add to nginx.conf to include sites-enabled
    if ! grep -q "sites-enabled" /etc/nginx/nginx.conf; then
        echo 'include /etc/nginx/sites-enabled/*;' | $SUDO tee -a /etc/nginx/nginx.conf
    fi
fi

# Copy nginx config
$SUDO cp /var/www/sanata/nginx-production.conf /etc/nginx/sites-available/sanata
$SUDO ln -sf /etc/nginx/sites-available/sanata /etc/nginx/sites-enabled/sanata

echo "Nginx config linked to /etc/nginx/sites-enabled/sanata"

# ============================================================
# STEP 3: Test and Reload Nginx
# ============================================================
echo ""
echo "=== STEP 3: Test and Reload Nginx ==="

# Remove default configs that might conflict
if [ -f /etc/nginx/sites-enabled/default ]; then
    echo "Removing default nginx config..."
    $SUDO rm -f /etc/nginx/sites-enabled/default
fi

# Test nginx config
$SUDO nginx -t

# Reload nginx
$SUDO systemctl reload nginx

echo "Nginx reloaded successfully!"

# ============================================================
# STEP 4: Setup Logs Directory
# ============================================================
echo ""
echo "=== STEP 4: Setup Logs Directory ==="

$SUDO mkdir -p /var/log/nginx/sanata-*
$SUDO chown -R $USER:$USER /var/log/nginx/sanata-* 2>/dev/null || true

echo "Logs directories created at /var/log/nginx/"

# ============================================================
# STEP 5: Deploy Application with PM2
# ============================================================
echo ""
echo "=== STEP 5: Deploy Application with PM2 ==="

cd /var/www/sanata

# Stop existing PM2 processes
pm2 delete all 2>/dev/null || true

# Start with ecosystem config
pm2 start ecosystem.config.js

# Save PM2 state
pm2 save

# Setup PM2 startup
pm2 startup 2>/dev/null || true

echo ""
echo "PM2 processes started:"
pm2 list

# ============================================================
# SUMMARY
# ============================================================
echo ""
echo "=============================================="
echo "DEPLOYMENT COMPLETE!"
echo "=============================================="
echo ""
echo "Services:"
echo "  - Backend API:  http://localhost:5000"
echo "  - Frontend:     http://localhost:5001"
echo "  - Nginx:        https://localhost (SSL)"
echo ""
echo "SSL Certificate Info:"
echo "  - Location:     /etc/nginx/ssl/sanata.id/"
echo "  - Valid for:    365 days"
echo "  - Note:         Self-signed (browser will show warning)"
echo ""
echo "To view logs:"
echo "  - Backend:      pm2 logs sanata-backend"
echo "  - Frontend:     pm2 logs sanata-web"
echo "  - Nginx:        tail -f /var/log/nginx/sanata-*/"
echo ""
echo "To restart services:"
echo "  - Backend:      pm2 restart sanata-backend"
echo "  - Frontend:     pm2 restart sanata-web"
echo "  - Nginx:        sudo systemctl reload nginx"
echo ""

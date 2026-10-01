#!/bin/bash
# ============================================================
# SANATA GROUP - Deploy Script (PM2 Ecosystem)
# Run on server: cd /var/www/sanata && ./deploy_sanata.sh
# ============================================================

set -e
cd /var/www/sanata

echo "=== 1. Pull latest changes ==="
git pull origin master

echo ""
echo "=== 2. Run Prisma migrate ==="
npm run prisma:migrate --workspace backend -- --name add_collection_title_unique

echo ""
echo "=== 3. Generate Prisma client ==="
npm run prisma:generate --workspace backend

echo ""
echo "=== 4. Run seed to update content ==="
npm run prisma:seed --workspace backend

echo ""
echo "=== 5. Build backend ==="
npm run build:backend

echo ""
echo "=== 6. Build frontend ==="
npm run build:web

echo ""
echo "=== 7. Setup logs directory ==="
sudo mkdir -p /var/log/sanata
sudo chown -R $USER:$USER /var/log/sanata

echo ""
echo "=== 8. Restart PM2 apps ==="
# Gunakan ecosystem config
pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.js

echo ""
echo "=== 9. Save PM2 process list ==="
pm2 save

echo ""
echo "=== 10. Setup PM2 startup script (for server reboot) ==="
pm2 startup 2>/dev/null || true

echo ""
echo "=== DONE ==="
echo "Services:"
pm2 list

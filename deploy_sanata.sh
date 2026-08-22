#!/bin/bash
# ============================================================
# SANATA GROUP - Deploy Content Update
# Run on server: cd /var/www/sanata
# ============================================================

set -e
cd /var/www/sanata

echo "=== 1. Pull latest changes ==="
git pull origin master

echo ""
echo "=== 2. Run Prisma migrate (applies schema change from backend workspace) ==="
# Schema ada di backend/prisma/schema.prisma — jalankan dari workspace backend
npm run prisma:migrate --workspace backend -- --name add_collection_title_unique

echo ""
echo "=== 3. Generate Prisma client ==="
npm run prisma:generate --workspace backend

echo ""
echo "=== 4. Run seed to update content ==="
npm run prisma:seed --workspace backend

echo ""
echo "=== 5. Build backend ==="
cd backend && npm run build && cd ..

echo ""
echo "=== 6. Build frontend ==="
cd frontend-next && npm run build && cd ..

echo ""
echo "=== 7. Restart backend ==="
pm2 restart sanata-backend 2>/dev/null || pm2 start backend/dist/index.js --name sanata-backend

echo ""
echo "=== DONE ==="
echo "Expected seed output: 'Seeded X site content items (N updated) and 80 settings.'"
echo "If 'N updated' > 0, existing content items were updated with new data."

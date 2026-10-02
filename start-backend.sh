#!/bin/bash
# =============================================================================
# SANATA CONSTRUCTION - Smart Backend Startup Script v2
# =============================================================================

APP_DIR="/var/www/sanata"
LOG_DIR="/var/log/sanata"
LOG_FILE="$LOG_DIR/startup.log"

# Simple logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "=========================================="
log "SANATA BACKEND STARTUP"
log "=========================================="

cd "$APP_DIR"

# Load env
if [[ ! -f .env ]]; then
    log "ERROR: .env not found"
    cp .env.example .env 2>/dev/null || true
    log "ERROR: Please edit .env with your credentials"
    exit 1
fi

log "Loading environment..."
set -a && source .env && set +a

if [[ -z "${DATABASE_URL:-}" ]]; then
    log "ERROR: DATABASE_URL not set"
    exit 1
fi

log "DATABASE_URL: ${DATABASE_URL:0:30}..."

# Parse DB connection
DB_NAME=$(echo "$DATABASE_URL" | sed -n 's|.*/\([^?]*\)|\1|p')
DB_HOST=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:]*\):.*|\1|p')
DB_USER=$(echo "$DATABASE_URL" | sed -n 's|.*://\([^:]*\):.*|\1|p')
DB_PASS=$(echo "$DATABASE_URL" | sed -n 's|.*:\([^@]*\)@.*|\1|p')
DB_PORT=$(echo "$DATABASE_URL" | sed -n 's|.*:\([0-9]*\)/.*|\1|p')

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-postgres}

log "DB: $DB_NAME @ $DB_HOST:$DB_PORT"

# Check PostgreSQL
log "Checking PostgreSQL..."
if ! PGPASSWORD="$DB_PASS" pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" >/dev/null 2>&1; then
    log "Starting PostgreSQL..."
    sudo systemctl start postgresql 2>/dev/null || true
    sleep 3
fi

if ! PGPASSWORD="$DB_PASS" pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" >/dev/null 2>&1; then
    log "ERROR: PostgreSQL not running"
    exit 1
fi
log "PostgreSQL OK"

# Check database
log "Checking database..."
DB_EXISTS=$(PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>/dev/null || echo "0")

if [[ "$DB_EXISTS" != "1" ]]; then
    log "Creating database..."
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || true
fi
log "Database OK"

# Prisma sync
log "Running Prisma db push..."
npx prisma db push --skip-generate 2>&1 | tee -a "$LOG_FILE"
log "Prisma db push done"

log "Generating Prisma client..."
npm run prisma:generate 2>&1 | tee -a "$LOG_FILE"
log "Prisma generate done"

# Verify build
if [[ ! -d "backend/dist" ]]; then
    log "Building backend..."
    npm run build:backend 2>&1 | tee -a "$LOG_FILE"
fi

if [[ ! -f "backend/dist/index.js" ]]; then
    log "ERROR: backend/dist/index.js not found"
    exit 1
fi

log "=========================================="
log "STARTING BACKEND on port ${PORT:-5000}"
log "=========================================="

exec node backend/dist/index.js

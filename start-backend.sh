#!/bin/bash
# SANATA BACKEND STARTUP SCRIPT

APP_DIR="/var/www/sanata"
BACKEND_DIR="$APP_DIR/backend"
LOG_DIR="/var/log/sanata"
LOG_FILE="$LOG_DIR/startup.log"

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
    exit 1
fi

log "Loading environment..."
set -a && source .env && set +a

if [[ -z "${DATABASE_URL:-}" ]]; then
    log "ERROR: DATABASE_URL not set"
    exit 1
fi

log "DB: ${DATABASE_URL:0:40}..."

# Parse DB
DB_NAME=$(echo "$DATABASE_URL" | sed -n 's|.*/\([^?]*\)|\1|p')
DB_HOST=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:]*\):.*|\1|p')
DB_USER=$(echo "$DATABASE_URL" | sed -n 's|.*://\([^:]*\):.*|\1|p')
DB_PASS=$(echo "$DATABASE_URL" | sed -n 's|.*:\([^@]*\)@.*|\1|p')
DB_PORT=$(echo "$DATABASE_URL" | sed -n 's|.*:\([0-9]*\)/.*|\1|p')

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-postgres}

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
    log "Creating database '$DB_NAME'..."
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || \
    PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || true
fi
log "Database OK"

# Prisma sync - dari backend directory
log "Running Prisma db push..."
cd "$BACKEND_DIR"
npx prisma db push --schema ./prisma/schema.prisma 2>&1 | tee -a "$LOG_FILE"

log "Generating Prisma client..."
npx prisma generate --schema ./prisma/schema.prisma 2>&1 | tee -a "$LOG_FILE"

# Back to app dir
cd "$APP_DIR"

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

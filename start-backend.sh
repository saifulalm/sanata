#!/bin/bash
# =============================================================================
# SANATA CONSTRUCTION - Smart Backend Startup Script
# Auto-detects and fixes: missing database, missing tables, missing env
# =============================================================================

set -euo pipefail

# CONFIGURATION
APP_DIR="/var/www/sanata"
LOG_DIR="/var/log/sanata"
LOG_FILE="$LOG_DIR/startup.log"
ERROR_LOG="$LOG_DIR/startup-error.log"
MAX_RETRIES=3
RETRY_DELAY=5

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# LOGGING
log() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
    [[ "$level" == "ERROR" ]] && echo "[$timestamp] [$level] $message" >> "$ERROR_LOG"
}

log_step() { log "INFO" "==> $1"; }
log_success() { log "INFO" "OK $1"; }
log_warning() { log "WARN" "WARNING: $1"; }
log_error() { log "ERROR" "FAIL: $1"; }

# LOAD ENV
load_env() {
    set -a
    source "$APP_DIR/.env"
    set +a
}

# CHECK PREREQ
check_prerequisites() {
    log_step "Checking prerequisites..."
    
    if [[ ! -f "$APP_DIR/.env" ]]; then
        log_error ".env file not found"
        cp "$APP_DIR/.env.example" "$APP_DIR/.env" 2>/dev/null || true
        log_warning "Copied .env.example to .env - please edit it"
        return 1
    fi
    
    log_success ".env exists"
    load_env
    
    if [[ -z "${DATABASE_URL:-}" ]]; then
        log_error "DATABASE_URL not set in .env"
        return 1
    fi
    
    log_success "Environment loaded"
    return 0
}

# CHECK DATABASE
check_database() {
    log_step "Checking database..."
    
    local db_name=$(echo "$DATABASE_URL" | sed -n 's|.*/\([^?]*\)|\1|p')
    local db_host=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:]*\):.*|\1|p')
    local db_user=$(echo "$DATABASE_URL" | sed -n 's|.*://\([^:]*\):.*|\1|p')
    local db_pass=$(echo "$DATABASE_URL" | sed -n 's|.*:\([^@]*\)@.*|\1|p')
    local db_port=$(echo "$DATABASE_URL" | sed -n 's|.*:\([0-9]*\)/.*|\1|p')
    
    db_host=${db_host:-localhost}
    db_port=${db_port:-5432}
    db_user=${db_user:-postgres}
    
    log "INFO" "DB: $db_name @ $db_host:$db_port"
    
    # Check PostgreSQL
    if ! PGPASSWORD="$db_pass" pg_isready -h "$db_host" -p "$db_port" -U "$db_user" >/dev/null 2>&1; then
        log_warning "PostgreSQL not responding"
        systemctl start postgresql 2>/dev/null || sudo systemctl start postgresql 2>/dev/null || true
        sleep 3
    fi
    
    if ! PGPASSWORD="$db_pass" pg_isready -h "$db_host" -p "$db_port" -U "$db_user" >/dev/null 2>&1; then
        log_error "PostgreSQL not running. Start with: sudo systemctl start postgresql"
        return 1
    fi
    log_success "PostgreSQL running"
    
    # Check DB exists
    local db_exists
    db_exists=$(PGPASSWORD="$db_pass" psql -h "$db_host" -p "$db_port" -U "$db_user" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$db_name'" 2>/dev/null || echo "0")
    
    if [[ "$db_exists" != "1" ]]; then
        log_warning "Database '$db_name' not found, creating..."
        sudo -u postgres psql -c "CREATE DATABASE $db_name;" 2>/dev/null || \
        PGPASSWORD="$db_pass" psql -h "$db_host" -p "$db_port" -U "$db_user" -d postgres -c "CREATE DATABASE $db_name;" 2>/dev/null || true
        sleep 1
        db_exists=$(PGPASSWORD="$db_pass" psql -h "$db_host" -p "$db_port" -U "$db_user" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$db_name'" 2>/dev/null || echo "0")
        [[ "$db_exists" == "1" ]] && log_success "Database created" || log_error "Failed to create database"
    else
        log_success "Database exists"
    fi
    
    # Grant privileges
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $db_name TO $db_user;" 2>/dev/null || true
    sudo -u postgres psql -d "$db_name" -c "GRANT ALL ON SCHEMA public TO $db_user;" 2>/dev/null || true
    
    return 0
}

# CHECK TABLES
check_tables() {
    log_step "Checking tables..."
    cd "$APP_DIR"
    
    log "INFO" "Running Prisma db push..."
    npx prisma db push --skip-generate 2>&1 | tee -a "$LOG_FILE" || log_warning "db push issues (may be OK)"
    
    log_step "Generating Prisma client..."
    npm run prisma:generate 2>&1 | tee -a "$LOG_FILE" || log_warning "generate issues (may be OK)"
    
    log_success "Tables checked"
    return 0
}

# VERIFY BUILD
verify_build() {
    log_step "Verifying build..."
    cd "$APP_DIR"
    
    [[ ! -d "$APP_DIR/node_modules" ]] && npm install 2>&1 | tee -a "$LOG_FILE"
    [[ ! -d "$APP_DIR/backend/dist" ]] && npm run build:backend 2>&1 | tee -a "$LOG_FILE"
    [[ ! -f "$APP_DIR/backend/dist/index.js" ]] && { log_error "Backend not built"; return 1; }
    
    log_success "Build verified"
    return 0
}

# START BACKEND
start_backend() {
    log_step "Starting backend on port ${PORT:-5000}..."
    cd "$APP_DIR"
    exec node backend/dist/index.js
}

# MAIN
main() {
    mkdir -p "$LOG_DIR"
    echo "" >> "$LOG_FILE"
    log "INFO" "========================================"
    log "INFO" "Sanata Backend Startup - $(date)"
    log "INFO" "========================================"
    
    local retry_count=0
    
    while [[ $retry_count -lt $MAX_RETRIES ]]; do
        retry_count=$((retry_count + 1))
        log "INFO" "--- Attempt $retry_count of $MAX_RETRIES ---"
        
        check_prerequisites || { log_error "Prerequisites failed"; exit 1; }
        check_database || { log_warning "Database check failed, retrying..."; sleep $RETRY_DELAY; continue; }
        check_tables || log_warning "Table check had warnings"
        verify_build || { log_warning "Build check failed, retrying..."; sleep $RETRY_DELAY; continue; }
        
        log "INFO" "Starting backend..."
        start_backend && exit 0
        
        log_error "Backend crashed, retrying..."
        sleep $RETRY_DELAY
    done
    
    log_error "========================================"
    log_error "FAILED after $MAX_RETRIES attempts"
    log_error "Logs: $LOG_FILE"
    exit 1
}

main "$@"

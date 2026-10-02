#!/bin/bash
# Startup wrapper script untuk Sanata Backend
# Load environment variables dari .env sebelum menjalankan aplikasi

set -e
APP_DIR="/var/www/sanata"
LOG_FILE="/var/log/sanata/env-debug.log"

cd "$APP_DIR"

echo "=== Backend Startup Debug ===" > "$LOG_FILE"
echo "Date: $(date)" >> "$LOG_FILE"
echo "Working dir: $(pwd)" >> "$LOG_FILE"

# Load .env file
if [ -f .env ]; then
    echo "Loading .env file..." >> "$LOG_FILE"
    set -a  # auto-export all variables
    source .env
    set +a
    echo "DATABASE_URL loaded: ${DATABASE_URL:0:20}..." >> "$LOG_FILE"
else
    echo "ERROR: .env file not found!" >> "$LOG_FILE"
    exit 1
fi

echo "Starting Node.js..." >> "$LOG_FILE"
echo "NODE_ENV=$NODE_ENV" >> "$LOG_FILE"
echo "PORT=$PORT" >> "$LOG_FILE"

# Jalankan aplikasi backend
exec node backend/dist/index.js

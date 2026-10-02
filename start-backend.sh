#!/bin/bash
# Startup wrapper script untuk Sanata Backend
# Load environment variables dari .env sebelum menjalankan aplikasi

cd /var/www/sanata

# Load .env file
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Jalankan aplikasi backend
exec node backend/dist/index.js

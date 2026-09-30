/**
 * startDatabase.js — Sanata Construction
 * 
 * Script untuk memulai PostgreSQL dan mempersiapkan database.
 * Menyesuaikan dengan konfigurasi Laragon di Windows.
 * 
 * Penggunaan:
 *   node startDatabase.js              # cek status saja
 *   node startDatabase.js start        # mulai PostgreSQL
 *   node startDatabase.js stop        # hentikan PostgreSQL
 *   node startDatabase.js restart     # restart PostgreSQL
 *   node startDatabase.js status      # cek status
 *   node startDatabase.js create      # buat database sanata
 *   node startDatabase.js migrate     # jalankan migrasi
 *   node startDatabase.js baseline    # tandai semua migration sudah diterapkan
 *   node startDatabase.js seed         # jalankan seeder
 *   node startDatabase.js setup        # setup lengkap (mulai + migrate + seed)
 *   node startDatabase.js reset        # reset database (hapus + buat + migrate + seed)
 *   node startDatabase.js verify       # verifikasi koneksi database
 *   node startDatabase.js help        # tampilkan bantuan
 * 
 * Catatan:
 *   - Script ini dirancang untuk Windows dengan Laragon
 *   - PostgreSQL harus sudah terinstall di laragon/bin/postgresql/
 *   - Pastikan backend/.env sudah dikonfigurasi dengan benar
 */

const { execSync, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// ============================================================================
// KONFIGURASI — sesuaikan dengan lingkungan Anda
// ============================================================================

const LARAGON_PG_BIN = 'D:/laragon/bin/postgresql/postgresql-16.1-1-windows-x64-binaries/bin';
const LARAGON_DATA = 'D:/laragon/data/postgresql-16';
const LARAGON_LOG = 'D:/laragon/data/postgresql-16/server.log';
const DB_DATA_DIR = 'D:/laragon/data';

// Nama database yang digunakan
const DB_NAME = 'sanata';
const DB_USER = 'postgres';

// Command untuk psql
const PSQL = path.join(LARAGON_PG_BIN, 'psql.exe');
const PG_CTL = path.join(LARAGON_PG_BIN, 'pg_ctl.exe');
const INIT_DB = path.join(LARAGON_PG_BIN, 'initdb.exe');
const PG_ISREADY = path.join(LARAGON_PG_BIN, 'pg_isready.exe');

// ============================================================================
// UTILITAS
// ============================================================================

/**
 * Jalankan command dan kembalikan output
 */
function runCommand(cmd, options = {}) {
  try {
    const result = execSync(cmd, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      ...options
    });
    return { success: true, output: result.trim() };
  } catch (error) {
    return {
      success: false,
      output: error.stdout?.trim() || error.message,
      error: error.stderr?.trim() || error.message
    };
  }
}

/**
 * Jalankan command secara asinkron
 */
function runCommandAsync(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { encoding: 'utf-8' }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

/**
 * Cek apakah file ada
 */
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

/**
 * Baca file
 */
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Format tanggal
 */
function formatDate(date) {
  return new Date(date).toLocaleString('id-ID', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * Cetak pesan dengan warna
 */
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  console.log();
  log('═'.repeat(70), 'cyan');
  log(`  ${message}`, 'bright');
  log('═'.repeat(70), 'cyan');
}

function logSuccess(message) {
  log(`  ✓ ${message}`, 'green');
}

function logError(message) {
  log(`  ✗ ${message}`, 'red');
}

function logWarning(message) {
  log(`  ⚠ ${message}`, 'yellow');
}

function logInfo(message) {
  log(`  ℹ ${message}`, 'blue');
}

// ============================================================================
// CEK LINGKUNGAN
// ============================================================================

/**
 * Cek apakah PostgreSQL sudah terinstall
 */
function checkPostgresInstall() {
  log('\n  Mengecek instalasi PostgreSQL...', 'dim');
  
  const pgCtlExists = fileExists(PG_CTL);
  const psqlExists = fileExists(PSQL);
  
  if (!pgCtlExists || !psqlExists) {
    logError('PostgreSQL tidak ditemukan di path standar Laragon');
    log(`  Pastikan PostgreSQL terinstall di: ${LARAGON_PG_BIN}`, 'dim');
    return false;
  }
  
  logSuccess(`PostgreSQL binaries ditemukan di ${LARAGON_PG_BIN}`);
  return true;
}

/**
 * Cek apakah data directory ada
 */
function checkDataDir() {
  log('\n  Mengecek data directory...', 'dim');
  
  if (!fileExists(LARAGON_DATA)) {
    logWarning(`Data directory tidak ditemukan: ${LARAGON_DATA}`);
    return false;
  }
  
  logSuccess(`Data directory ditemukan: ${LARAGON_DATA}`);
  return true;
}

/**
 * Cek apakah PostgreSQL sudah running
 */
function checkPostgresRunning() {
  const result = runCommand(`"${PG_ISREADY}" -h localhost -p 5432`);
  
  if (result.success && result.output.includes('accepting connections')) {
    return { running: true, message: 'PostgreSQL sedang berjalan' };
  }
  
  // Cek apakah ada PID file
  const pidFile = path.join(LARAGON_DATA, 'postmaster.pid');
  if (fileExists(pidFile)) {
    const pid = readFile(pidFile);
    logWarning(`PID file ada (PID: ${pid?.split('\n')[0]}) tapi PostgreSQL tidak merespons`);
    log('  Ini biasanya berarti PostgreSQL crash. Coba restart.', 'dim');
    return { running: false, crashed: true, message: 'PostgreSQL crash (PID file ada tapi tidak responsif)' };
  }
  
  return { running: false, message: 'PostgreSQL tidak berjalan' };
}

/**
 * Cek apakah database sudah ada
 */
function checkDatabase() {
  log('\n  Mengecek database...', 'dim');
  
  const result = runCommand(
    `"${PSQL}" -h localhost -U ${DB_USER} -c "SELECT datname FROM pg_database WHERE datname = '${DB_NAME}';"`
  );
  
  if (result.output && result.output.includes(DB_NAME)) {
    logSuccess(`Database '${DB_NAME}' sudah ada`);
    return { exists: true };
  }
  
  logWarning(`Database '${DB_NAME}' belum ada`);
  return { exists: false };
}

/**
 * Verifikasi koneksi database
 */
async function verifyConnection() {
  logHeader('VERIFIKASI KONEKSI DATABASE');
  
  // Cek apakah PostgreSQL berjalan
  const status = checkPostgresRunning();
  if (!status.running) {
    logError('PostgreSQL tidak berjalan. Mulai dulu dengan: node startDatabase.js start');
    return false;
  }
  
  logSuccess('PostgreSQL berjalan');
  
  // Cek apakah database ada
  const dbStatus = checkDatabase();
  if (!dbStatus.exists) {
    logError(`Database '${DB_NAME}' belum dibuat`);
    return false;
  }
  
  // Coba konek ke database
  log('\n  Menguji koneksi ke database...', 'dim');
  const result = runCommand(
    `"${PSQL}" -h localhost -U ${DB_USER} -d ${DB_NAME} -c "SELECT version();"`
  );
  
  if (result.success && result.output.includes('PostgreSQL')) {
    const version = result.output.split('\n')[0];
    logSuccess(`Koneksi berhasil`);
    log(`  ${version}`, 'dim');
    
    // Cek tabel-tabel
    log('\n  Mengecek tabel-tabel...', 'dim');
    const tablesResult = runCommand(
      `"${PSQL}" -h localhost -U ${DB_USER} -d ${DB_NAME} -c "\\dt"`,
      { maxBuffer: 1024 * 1024 }
    );
    
    if (tablesResult.success) {
      const tables = tablesResult.output.split('\n')
        .filter(line => line.includes('|') && !line.includes('('))
        .length - 2; // Kurangi header dan separator
      logSuccess(`Ditemukan ${tables} tabel`);
    }
    
    return true;
  }
  
  logError('Gagal konek ke database');
  log(result.error || result.output, 'red');
  return false;
}

// ============================================================================
// OPERASI DATABASE
// ============================================================================

/**
 * Mulai PostgreSQL
 */
function startPostgres() {
  logHeader('MEMULAI POSTGRESQL');
  
  const status = checkPostgresRunning();
  
  if (status.running) {
    logSuccess(status.message);
    return true;
  }
  
  // Cek apakah perlu inisialisasi
  if (!checkDataDir()) {
    logError('Data directory tidak ada. Jalankan init dulu.');
    log('  Catatan: Jika ini pertama kali, data directory mungkin perlu diinisialisasi', 'dim');
    log('  dengan command: initdb -D ' + LARAGON_DATA, 'dim');
    return false;
  }
  
  // Cek apakah sudah diinisialisasi
  const pgVersionFile = path.join(LARAGON_DATA, 'PG_VERSION');
  if (!fileExists(pgVersionFile)) {
    logWarning('Database belum diinisialisasi. Menginisialisasi...');
    log(`  Jalankan: initdb -D "${LARAGON_DATA}" -U postgres --encoding=UTF8 --locale=C`, 'dim');
    return false;
  }
  
  log('  Memulai PostgreSQL...', 'dim');
  
  // Pastikan log directory ada
  const logDir = path.dirname(LARAGON_LOG);
  if (!fileExists(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  const result = runCommand(
    `"${PG_CTL}" -D "${LARAGON_DATA}" -l "${LARAGON_LOG}" start`,
    { stdio: ['pipe', 'pipe', 'pipe'] }
  );
  
  if (result.success) {
    logSuccess('PostgreSQL berhasil dimulai');
    
    // Tunggu sebentar untuk startup
    log('  Menunggu PostgreSQL ready...', 'dim');
    let retries = 10;
    while (retries > 0) {
      const check = checkPostgresRunning();
      if (check.running) {
        logSuccess('PostgreSQL siap menerima koneksi');
        return true;
      }
      retries--;
      execSync('sleep 1', { encoding: 'utf-8' });
    }
    
    logWarning('PostgreSQL started tapi belum ready setelah 10 detik');
    return true;
  }
  
  logError('Gagal memulai PostgreSQL');
  log(result.error || result.output, 'red');
  
  // Tampilkan log jika ada
  if (fileExists(LARAGON_LOG)) {
    log('\n  Isi server.log:', 'dim');
    const logContent = readFile(LARAGON_LOG);
    const lastLines = logContent?.split('\n').slice(-20).join('\n') || '';
    console.log('  ' + lastLines.replace(/\n/g, '\n  '));
  }
  
  return false;
}

/**
 * Hentikan PostgreSQL
 */
function stopPostgres() {
  logHeader('MENGHENTIKAN POSTGRESQL');
  
  const status = checkPostgresRunning();
  
  if (!status.running) {
    logSuccess('PostgreSQL tidak berjalan');
    return true;
  }
  
  log('  Menghentikan PostgreSQL...', 'dim');
  
  const result = runCommand(
    `"${PG_CTL}" -D "${LARAGON_DATA}" stop`,
    { stdio: ['pipe', 'pipe', 'pipe'] }
  );
  
  if (result.success) {
    logSuccess('PostgreSQL berhasil dihentikan');
    return true;
  }
  
  logError('Gagal menghentikan PostgreSQL');
  log(result.error || result.output, 'red');
  return false;
}

/**
 * Restart PostgreSQL
 */
function restartPostgres() {
  logHeader('MERESTART POSTGRESQL');
  
  stopPostgres();
  execSync('sleep 2', { encoding: 'utf-8' });
  return startPostgres();
}

/**
 * Buat database
 */
function createDatabase() {
  logHeader('MEMBUAT DATABASE');
  
  const status = checkPostgresRunning();
  if (!status.running) {
    logError('PostgreSQL tidak berjalan. Mulai dulu.');
    return false;
  }
  
  const dbStatus = checkDatabase();
  if (dbStatus.exists) {
    logSuccess(`Database '${DB_NAME}' sudah ada`);
    return true;
  }
  
  log(`  Membuat database '${DB_NAME}'...`, 'dim');
  
  const result = runCommand(
    `"${PSQL}" -h localhost -U ${DB_USER} -c "CREATE DATABASE ${DB_NAME};"`
  );
  
  if (result.success) {
    logSuccess(`Database '${DB_NAME}' berhasil dibuat`);
    return true;
  }
  
  // Jika error karena sudah ada, anggap berhasil
  if (result.output && result.output.toLowerCase().includes('already exists')) {
    logSuccess(`Database '${DB_NAME}' sudah ada`);
    return true;
  }
  
  logError('Gagal membuat database');
  log(result.output || result.error, 'red');
  return false;
}

/**
 * Jalankan Prisma migrations
 */
function runMigrations() {
  logHeader('MENJALANKAN PRISMA MIGRATIONS');
  
  const status = checkPostgresRunning();
  if (!status.running) {
    logError('PostgreSQL tidak berjalan. Mulai dulu.');
    return false;
  }
  
  const dbStatus = checkDatabase();
  if (!dbStatus.exists) {
    logWarning(`Database '${DB_NAME}' belum ada. Membuat dulu...`);
    if (!createDatabase()) {
      return false;
    }
  }
  
  log('  Menjalankan prisma migrate...', 'dim');
  
  const result = runCommand('npm run prisma:migrate', {
    cwd: path.join(__dirname),
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  if (result.success) {
    logSuccess('Migration berhasil');
    return true;
  }
  
  logError('Migration gagal');
  log(result.output, 'red');
  return false;
}

/**
 * Baseline migrations - tandai semua migration sebagai sudah diterapkan
 * Digunakan ketika database sudah ada tabel-tabelnya tapi _prisma_migrations kosong
 */
function runBaseline() {
  logHeader('BASELINE MIGRATIONS');
  
  const status = checkPostgresRunning();
  if (!status.running) {
    logError('PostgreSQL tidak berjalan. Mulai dulu.');
    return false;
  }
  
  const dbStatus = checkDatabase();
  if (!dbStatus.exists) {
    logError(`Database '${DB_NAME}' belum ada. Buat dulu dengan 'create'.`);
    return false;
  }
  
  logWarning('Ini akan menandai SEMUA migration sebagai sudah diterapkan.');
  log('  Pastikan database sudah memiliki struktur yang sesuai!', 'yellow');
  log('  Tekan Ctrl+C untuk membatalkan...', 'yellow');
  
  execSync('sleep 3', { encoding: 'utf-8' });
  
  // Buat tabel _prisma_migrations jika belum ada
  log('\n  Membuat tabel _prisma_migrations...', 'dim');
  const createTableResult = runCommand(
    `"${PSQL}" -h localhost -U ${DB_USER} -d ${DB_NAME} -c "CREATE TABLE IF NOT EXISTS \"_prisma_migrations\" (\"id\" VARCHAR(36) PRIMARY KEY, \"checksum\" VARCHAR(64) NOT NULL, \"finished_at\" TIMESTAMPTZ NOT NULL DEFAULT now(), \"migration_name\" VARCHAR(255) NOT NULL UNIQUE, \"logs\" TEXT, \"rolled_back_at\" TIMESTAMPTZ, \"started_at\" TIMESTAMPTZ NOT NULL DEFAULT now(), \"applied_steps_count\" INTEGER NOT NULL DEFAULT 0);"`
  );
  
  if (!createTableResult.success) {
    logWarning('Tabel mungkin sudah ada atau ada masalah');
  } else {
    logSuccess('Tabel _prisma_migrations siap');
  }
  
  // Dapatkan semua migration files
  const migrationsDir = path.join(__dirname, 'backend', 'prisma', 'migrations');
  if (!fileExists(migrationsDir)) {
    logError('Direktori migrations tidak ditemukan');
    return false;
  }
  
  const fs = require('fs');
  const migrationFolders = fs.readdirSync(migrationsDir)
    .filter(name => /^\d{14}/.test(name))
    .sort();
  
  if (migrationFolders.length === 0) {
    logWarning('Tidak ada migration ditemukan');
    return false;
  }
  
  log(`\n  Menandai ${migrationFolders.length} migrations sebagai diterapkan...`, 'dim');
  
  let success = true;
  for (const folder of migrationFolders) {
    const migrationName = folder;
    
    // Cek apakah sudah ada di tabel
    const checkResult = runCommand(
      `"${PSQL}" -h localhost -U ${DB_USER} -d ${DB_NAME} -c "SELECT 1 FROM _prisma_migrations WHERE migration_name = '${migrationName}';"`
    );
    
    if (checkResult.output && checkResult.output.includes('1 row')) {
      log(`  ✓ ${migrationName} (sudah ada)`, 'dim');
      continue;
    }
    
    // Generate UUID menggunakan Node.js crypto
    const { randomUUID } = require('crypto');
    const uuid = randomUUID();
    
    // Insert record - gunakan UPDATE jika sudah ada (INSERT...ON CONFLICT)
    const sql = `INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, applied_steps_count) VALUES ('${uuid}', 'baseline', now(), '${migrationName}', 1) ON CONFLICT (migration_name) DO UPDATE SET finished_at = now(), applied_steps_count = 1;`;
    const insertResult = runCommand(
      `"${PSQL}" -h localhost -U ${DB_USER} -d ${DB_NAME} -c "${sql}"`
    );
    
    if (insertResult.success) {
      log(`  ✓ ${migrationName}`, 'green');
    } else {
      logError(`  ${migrationName}: ${insertResult.output || insertResult.error}`);
      success = false;
    }
  }
  
  if (success) {
    logSuccess('Baseline selesai');
    log('\n  Jalankan \"node startDatabase.js status\" untuk verifikasi', 'dim');
  } else {
    logError('Baseline selesai dengan kesalahan');
  }
  
  return success;
}

/**
 * Jalankan Prisma seed
 */
function runSeed() {
  logHeader('MENJALANKAN PRISMA SEED');
  
  const status = checkPostgresRunning();
  if (!status.running) {
    logError('PostgreSQL tidak berjalan. Mulai dulu.');
    return false;
  }
  
  const dbStatus = checkDatabase();
  if (!dbStatus.exists) {
    logWarning(`Database '${DB_NAME}' belum ada. Buat dan migrate dulu.`);
    return false;
  }
  
  log('  Menjalankan prisma seed...', 'dim');
  
  const result = runCommand('npm run prisma:seed', {
    cwd: path.join(__dirname),
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  if (result.success) {
    logSuccess('Seeder berhasil');
    log('\n  Default admin login:', 'dim');
    log('    admin@sanata.id / Admin123!', 'green');
    log('\n  Default editor login:', 'dim');
    log('    editor@sanata.id / Editor123!', 'green');
    return true;
  }
  
  logError('Seeder gagal');
  log(result.output, 'red');
  return false;
}

/**
 * Setup lengkap
 */
async function fullSetup() {
  logHeader('SETUP LENGKAP DATABASE');
  
  // 1. Start PostgreSQL
  log('\n[1/4] Memulai PostgreSQL...', 'cyan');
  if (!startPostgres()) {
    return false;
  }
  
  // 2. Create database
  log('\n[2/4] Membuat database...', 'cyan');
  if (!createDatabase()) {
    return false;
  }
  
  // 3. Run migrations
  log('\n[3/4] Menjalankan migrations...', 'cyan');
  if (!runMigrations()) {
    return false;
  }
  
  // 4. Run seed
  log('\n[4/4] Menjalankan seed...', 'cyan');
  if (!runSeed()) {
    return false;
  }
  
  logHeader('SETUP SELESAI');
  logSuccess('Database siap digunakan!');
  log('\n  Frontend:  http://localhost:5001', 'dim');
  log('  Backend:   http://localhost:5000', 'dim');
  log('  Admin:     http://localhost:5001/admin', 'dim');
  log('  API Docs:  http://localhost:5000/api/docs', 'dim');
  
  return true;
}

/**
 * Reset database (hapus dan buat ulang)
 */
function resetDatabase() {
  logHeader('MERESET DATABASE');
  
  const status = checkPostgresRunning();
  if (!status.running) {
    logError('PostgreSQL tidak berjalan. Mulai dulu.');
    return false;
  }
  
  logWarning('Ini akan MENGHAPUS semua data di database!');
  log('  Tekan Ctrl+C untuk membatalkan...', 'yellow');
  
  // Beri waktu untuk batal
  execSync('sleep 3', { encoding: 'utf-8' });
  
  // Drop database
  log('\n  Menghapus database...', 'dim');
  const dropResult = runCommand(
    `"${PSQL}" -h localhost -U ${DB_USER} -c "DROP DATABASE IF EXISTS ${DB_NAME};"`
  );
  
  if (dropResult.success) {
    logSuccess('Database dihapus');
  } else {
    logWarning('Gagal drop database (mungkin tidak ada)');
  }
  
  // Buat ulang
  if (!createDatabase()) {
    return false;
  }
  
  // Migrate
  if (!runMigrations()) {
    return false;
  }
  
  // Seed
  if (!runSeed()) {
    return false;
  }
  
  logHeader('RESET SELESAI');
  logSuccess('Database berhasil direset');
  
  return true;
}

// ============================================================================
// STATUS
// ============================================================================

/**
 * Tampilkan status lengkap
 */
function showStatus() {
  logHeader('STATUS DATABASE');
  
  // PostgreSQL
  log('\nPostgreSQL:', 'bright');
  const pgStatus = checkPostgresRunning();
  if (pgStatus.running) {
    logSuccess(pgStatus.message);
  } else if (pgStatus.crashed) {
    logError(pgStatus.message);
    log('  Jalankan "node startDatabase.js restart" untuk restart', 'dim');
  } else {
    logError(pgStatus.message);
    log('  Jalankan "node startDatabase.js start" untuk memulai', 'dim');
  }
  
  // Database
  if (pgStatus.running) {
    log('\nDatabase:', 'bright');
    const dbStatus = checkDatabase();
    if (dbStatus.exists) {
      logSuccess(`Database '${DB_NAME}' ada`);
      
      // Count tables
      log('\n  Mengecek tabel-tabel...', 'dim');
      const tablesResult = runCommand(
        `"${PSQL}" -h localhost -U ${DB_USER} -d ${DB_NAME} -c "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public';"`
      );
      if (tablesResult.success && tablesResult.output) {
        const lines = tablesResult.output.split('\n');
        const countLine = lines.find(l => l.trim() && /^\s*\d+\s*$/.test(l.trim()));
        if (countLine) {
          const numTables = parseInt(countLine.trim());
          logSuccess(`Ditemukan ${numTables} tabel`);
        }
      }
    } else {
      logWarning(`Database '${DB_NAME}' belum ada`);
      log('  Jalankan "node startDatabase.js setup" untuk membuat', 'dim');
    }
    
    // Prisma migrations
    log('\nPrisma Migrations:', 'bright');
    // Jalankan dari backend directory agar .env dimuat
    const migrateStatus = runCommand('npx prisma migrate status', {
      cwd: path.join(__dirname, 'backend'),
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    if (migrateStatus.success) {
      if (migrateStatus.output.includes('Database schema is up to date')) {
        logSuccess('Semua migration sudah diterapkan');
      } else if (migrateStatus.output.includes('Following migrations have not yet been applied')) {
        logWarning('Ada migration yang belum diterapkan');
        log('  Jalankan "node startDatabase.js migrate"', 'dim');
      } else {
        logInfo('Status migration tidak diketahui');
      }
    } else {
      logWarning('Tidak bisa cek status migration');
    }
  }
  
  // Configuration
  log('\nKonfigurasi:', 'bright');
  log(`  PostgreSQL bin:  ${LARAGON_PG_BIN}`, 'dim');
  log(`  Data directory:  ${LARAGON_DATA}`, 'dim');
  log(`  Log file:        ${LARAGON_LOG}`, 'dim');
  log(`  Database name:    ${DB_NAME}`, 'dim');
  
  // Env check
  log('\nFile .env:', 'bright');
  const envPath = path.join(__dirname, 'backend', '.env');
  if (fileExists(envPath)) {
    logSuccess('backend/.env ada');
    
    // Cek DATABASE_URL
    const envContent = readFile(envPath);
    if (envContent && envContent.includes('DATABASE_URL')) {
      const dbUrlMatch = envContent.match(/DATABASE_URL\s*=\s*(.+)/);
      if (dbUrlMatch) {
        const url = dbUrlMatch[1].split('#')[0].trim();
        const masked = url.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@');
        log(`  DATABASE_URL: ${masked}`, 'dim');
      }
    }
  } else {
    logWarning('backend/.env belum ada');
    log('  Salin dari .env.example: cp backend/.env.example backend/.env', 'dim');
  }
}

// ============================================================================
// BANTUAN
// ============================================================================

function showHelp() {
  logHeader('BANTUAN - startDatabase.js');
  
  console.log(`
  Script untuk mengelola PostgreSQL dan database Sanata Construction.
  
  Penggunaan:
    node startDatabase.js <command>
  
  Commands:
    start     - Mulai PostgreSQL
    stop      - Hentikan PostgreSQL
    restart   - Restart PostgreSQL
    status    - Tampilkan status database
    create    - Buat database ${DB_NAME}
    migrate   - Jalankan Prisma migrations
    baseline  - Tandai semua migrations sebagai diterapkan
    seed      - Jalankan Prisma seeder
    setup     - Setup lengkap (start + create + migrate + seed)
    reset     - Reset database (hapus + buat + migrate + seed)
    verify    - Verifikasi koneksi database
    help      - Tampilkan bantuan ini
  
  Alias tanpa command menjalankan status:
    node startDatabase.js
  
  Contoh:
    node startDatabase.js          # cek status
    node startDatabase.js start    # mulai PostgreSQL
    node startDatabase.js setup    # setup lengkap
    node startDatabase.js reset    # reset database
  
  Catatan:
    - Pastikan Laragon PostgreSQL sudah terinstall
    - Konfigurasi path ada di bagian atas script
    - File backend/.env harus sudah ada sebelum migrate/seed
  `);
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'status';
  
  // Cek environment dulu
  if (!checkPostgresInstall()) {
    process.exit(1);
  }
  
  switch (command.toLowerCase()) {
    case 'start':
      startPostgres();
      break;
      
    case 'stop':
      stopPostgres();
      break;
      
    case 'restart':
      restartPostgres();
      break;
      
    case 'status':
      showStatus();
      break;
      
    case 'create':
      createDatabase();
      break;
      
    case 'migrate':
      runMigrations();
      break;
      
    case 'seed':
      runSeed();
      break;

    case 'baseline':
      runBaseline();
      break;

    case 'setup':
      await fullSetup();
      break;
      
    case 'reset':
      resetDatabase();
      break;
      
    case 'verify':
      await verifyConnection();
      break;
      
    case 'help':
    case '--help':
    case '-h':
    case '/?':
      showHelp();
      break;
      
    default:
      logError(`Unknown command: ${command}`);
      log('Gunakan "node startDatabase.js help" untuk bantuan');
      process.exit(1);
  }
}

// Jalankan
main().catch(err => {
  logError('Terjadi kesalahan: ' + err.message);
  process.exit(1);
});

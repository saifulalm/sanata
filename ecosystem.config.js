module.exports = {
  apps: [
    {
      name: 'sanata-backend',
      script: 'backend/dist/index.js',
      cwd: '/var/www/sanata',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      // Load .env file untuk production
      env_file: '/var/www/sanata/.env',
      error_file: '/var/log/sanata/backend-error.log',
      out_file: '/var/log/sanata/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      max_memory_restart: '500M',
      restart_delay: 4000,
    },
    {
      name: 'sanata-web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 5001',
      cwd: '/var/www/sanata/frontend-next',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 5001
      },
      // Load .env file untuk production
      env_file: '/var/www/sanata/.env',
      error_file: '/var/log/sanata/web-error.log',
      out_file: '/var/log/sanata/web-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      max_memory_restart: '1G',
      restart_delay: 4000,
    }
  ]
};

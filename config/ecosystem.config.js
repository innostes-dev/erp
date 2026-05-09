module.exports = {
  apps: [{
    name: 'business-os-api',
    script: 'dist/apps/api-gateway/main.js',
    instances: 2,
    exec_mode: 'cluster',
    max_memory_restart: '400M',
    env_production: { NODE_ENV: 'production', PORT: 3001 },
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
    merge_logs: true,
    restart_delay: 3000,
    max_restarts: 10,
  }]
};

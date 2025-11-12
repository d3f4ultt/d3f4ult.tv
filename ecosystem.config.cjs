module.exports = {
  apps: [{
    name: 'crypto-dashboard',
    script: './dist/index.js',
    cwd: '/var/www/d3f4ult.tv/app',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/var/log/pm2-crypto-dashboard-error.log',
    out_file: '/var/log/pm2-crypto-dashboard-out.log',
    time: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};

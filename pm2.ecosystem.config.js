// PM2 Ecosystem Configuration
// Advanced process management for production deployment
//
// Usage:
//   pm2 start pm2.ecosystem.config.js --env production
//   pm2 reload ecosystem.config.js
//   pm2 delete ecosystem.config.js

module.exports = {
  apps: [
    {
      // Application name
      name: 'crypto-live',
      
      // Script to run
      script: 'npm',
      args: 'run dev',
      
      // Working directory
      cwd: '/var/www/crypto-live',
      
      // Environment variables
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
        RTMP_PORT: 1935,
        HLS_PORT: 8888,
      },
      
      // Instances (cluster mode)
      instances: 1,  // Use 'max' for all CPU cores, or specific number
      exec_mode: 'fork',  // Use 'cluster' for multiple instances
      
      // Auto-restart behavior
      autorestart: true,
      watch: false,  // Set to true for development auto-reload
      max_memory_restart: '1G',  // Restart if memory exceeds 1GB
      
      // Logging
      error_file: '/var/log/pm2/crypto-live-error.log',
      out_file: '/var/log/pm2/crypto-live-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Advanced options
      restart_delay: 4000,  // Delay between restarts (ms)
      max_restarts: 10,  // Max restarts within min_uptime
      min_uptime: '10s',  // Min uptime before considering stable
      
      // Exponential backoff restart delay
      exp_backoff_restart_delay: 100,
      
      // Kill timeout (SIGINT to SIGKILL)
      kill_timeout: 5000,
      
      // Wait for ready signal (if using process.send('ready'))
      wait_ready: false,
      listen_timeout: 3000,
      
      // Process ID file
      pid_file: '/var/run/crypto-live.pid',
      
      // Cron restart (optional - restart daily at 3am)
      // cron_restart: '0 3 * * *',
      
      // Source map support
      source_map_support: true,
      
      // Interpreter (node binary)
      interpreter: 'node',
      interpreter_args: '--max-old-space-size=2048',  // Increase heap size
      
      // Post deploy hooks (optional)
      // post_update: ['npm install', 'echo Deployment complete'],
    }
  ],
  
  // Deployment configuration (optional)
  deploy: {
    production: {
      user: 'deploy',  // SSH user
      host: 'your-server-ip',  // Server IP or hostname
      ref: 'origin/main',  // Git branch
      repo: 'git@github.com:your-username/crypto-live.git',  // Git repo
      path: '/var/www/crypto-live',  // Deploy path
      
      // Pre-setup commands
      'pre-setup': 'apt-get install git',
      
      // Post-setup commands
      'post-setup': 'npm install && pm2 start ecosystem.config.js --env production',
      
      // Pre-deploy (runs before fetch)
      'pre-deploy-local': 'echo Deploying...',
      
      // Post-deploy (runs after deploy)
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production && pm2 save',
      
      // SSH options
      ssh_options: ['StrictHostKeyChecking=no', 'PasswordAuthentication=no'],
    }
  }
};

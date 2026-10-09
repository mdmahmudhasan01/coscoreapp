module.exports = {
  apps: [
    {
      name: 'lookzene-redis-cache',
      cwd: '/home/frappe/projects/lookzene',
      script: '/usr/bin/redis-server',
      args: '/home/frappe/projects/lookzene/config/redis_cache.conf',
      interpreter: 'none',
      autorestart: true,
      max_restarts: 10,
      restart_delay: 2000,
      out_file: '/home/frappe/projects/lookzene/logs/redis-cache.log',
      error_file: '/home/frappe/projects/lookzene/logs/redis-cache.error.log'
    },
    {
      name: 'lookzene-redis-queue',
      cwd: '/home/frappe/projects/lookzene',
      script: '/usr/bin/redis-server',
      args: '/home/frappe/projects/lookzene/config/redis_queue.conf',
      interpreter: 'none',
      autorestart: true,
      max_restarts: 10,
      restart_delay: 2000,
      out_file: '/home/frappe/projects/lookzene/logs/redis-queue.log',
      error_file: '/home/frappe/projects/lookzene/logs/redis-queue.error.log'
    },
    {
      name: 'lookzene-web',
      cwd: '/home/frappe/projects/lookzene/sites',
      script: '/home/frappe/projects/lookzene/env/bin/gunicorn',
      args: '-b 127.0.0.1:8001 -w 5 --max-requests 5000 --max-requests-jitter 500 -t 120 --graceful-timeout 30 frappe_app:application --preload',
      interpreter: 'none',
      autorestart: true,
      max_restarts: 10,
      restart_delay: 2000,
      out_file: '/home/frappe/projects/lookzene/logs/web.log',
      error_file: '/home/frappe/projects/lookzene/logs/web.error.log'
    },
    {
      name: 'lookzene-schedule',
      cwd: '/home/frappe/projects/lookzene',
      script: '/home/frappe/.local/bin/bench',
      args: 'schedule',
      interpreter: 'none',
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      out_file: '/home/frappe/projects/lookzene/logs/schedule.log',
      error_file: '/home/frappe/projects/lookzene/logs/schedule.error.log'
    },
    {
      name: 'lookzene-worker',
      cwd: '/home/frappe/projects/lookzene',
      script: '/home/frappe/.local/bin/bench',
      args: 'worker --queue short,default,long',
      interpreter: 'none',
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      out_file: '/home/frappe/projects/lookzene/logs/worker.log',
      error_file: '/home/frappe/projects/lookzene/logs/worker.error.log'
    },
    {
      name: 'lookzene-socketio',
      cwd: '/home/frappe/projects/lookzene',
      script: 'apps/frappe/socketio.js',
      interpreter: 'node',
      autorestart: true,
      max_restarts: 10,
      restart_delay: 2000,
      out_file: '/home/frappe/projects/lookzene/logs/node-socketio.log',
      error_file: '/home/frappe/projects/lookzene/logs/node-socketio.error.log'
    }
  ]
};

module.exports = {
  apps: [
    {
      name: 'lookzene-frontend',
      port: '3002',
      exec_mode: 'cluster',
      instances: 'max',
      script: './.output/server/index.mjs',
      max_restarts: 100,
      min_uptime: '5s',
      restart_delay: 500,
      exp_backoff_restart_delay: 100,
      env: {
        PORT: 3002,
        VITE_COSCORE_API_URL: 'https://cp.lookzene.com/api/method/coscore.api'
      }
    }
  ]
}

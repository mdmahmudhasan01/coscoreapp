redis_cache: bin/redis-server config/redis_cache.conf
redis_queue: bin/redis-server config/redis_queue.conf
web: env/bin/gunicorn -b 127.0.0.1:8001 -w 5 --max-requests 5000 --max-requests-jitter 500 -t 120 --graceful-timeout 30 frappe_app:application --preload
socketio: runtime/node/bin/node apps/frappe/socketio.js
schedule: bin/bench schedule
worker: bin/bench worker --queue short,default,long

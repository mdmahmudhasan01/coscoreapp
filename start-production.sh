#!/usr/bin/env bash
set -u
cd /home/frappe/projects/lookzene/apps/coscore
if [ -f .output/server/index.mjs ]; then
  export HOST=0.0.0.0 NITRO_HOST=0.0.0.0 PORT=3005 NITRO_PORT=3005
  exec /usr/bin/node .output/server/index.mjs
elif [ -f .next/standalone/server.js ]; then
  export HOSTNAME=0.0.0.0 PORT=3005
  exec /usr/bin/node .next/standalone/server.js
elif [ -f .next/BUILD_ID ]; then
  exec /usr/bin/npm run start -- --hostname 0.0.0.0 --port 3005
else
  echo 'No production build artifact found' >&2
  exit 1
fi

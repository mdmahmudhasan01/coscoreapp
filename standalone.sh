#!/usr/bin/env bash
# Standalone Lookzene control — only this tree; no other project dirs.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
ECOSYSTEM="${ROOT}/ecosystem.config.cjs"
APPS=(
  lookzene-redis-cache
  lookzene-redis-queue
  lookzene-web
  lookzene-schedule
  lookzene-worker
  lookzene-socketio
  lookzene-frontend
)

mkdir -p "${ROOT}/logs" "${ROOT}/config/pids"
cd "${ROOT}"
export PATH="${ROOT}/runtime/node/bin:${ROOT}/bin:${ROOT}/env/bin:${PATH}"

cmd_doctor() {
  local ok=1
  echo "Lookzene standalone doctor (${ROOT})"
  echo

  require_exec() {
    local p="$1" label="$2"
    if [[ -x "$p" ]]; then
      echo "  OK  $label → $p"
    else
      echo "  MISSING  $label → $p"
      ok=0
    fi
  }

  require_exec "${ROOT}/runtime/python/bin/python3.14" "python runtime"
  require_exec "${ROOT}/env/bin/python" "venv python"
  require_exec "${ROOT}/env/bin/gunicorn" "gunicorn"
  require_exec "${ROOT}/runtime/node/bin/node" "node runtime"
  require_exec "${ROOT}/bin/bench" "local bench"
  require_exec "${ROOT}/bin/node" "local node wrapper"
  require_exec "${ROOT}/bin/redis-server" "redis wrapper"
  require_exec /usr/bin/redis-server "OS redis-server"

  echo
  echo "Out-of-tree symlinks (should be empty for runtimes):"
  local bad=0
  while IFS= read -r link; do
    target="$(readlink -f "$link" 2>/dev/null || true)"
    case "$target" in
      "${ROOT}"/*) ;;
      /usr/*|/lib/*|/lib64/*|/bin/*|/sbin/*|"") ;;
      *)
        echo "  OUT  $link → $target"
        bad=1
        ;;
    esac
  done < <(find "${ROOT}/env/bin" "${ROOT}/runtime" "${ROOT}/bin" "${ROOT}/yarn" -type l 2>/dev/null)

  if [[ "$bad" -eq 0 ]]; then
    echo "  OK  none"
  fi

  echo
  "${ROOT}/env/bin/python" -V
  "${ROOT}/runtime/node/bin/node" -v
  "${ROOT}/bin/bench" --help >/dev/null && echo "  OK  bin/bench responds"

  if [[ "$ok" -ne 1 ]]; then
    echo
    echo "Doctor failed: fix missing runtimes (see runtime/)."
    exit 1
  fi
  echo
  echo "Doctor passed — runnable from this directory alone (OS: redis-server, mariadb)."
}

cmd_start() {
  cmd_doctor
  pm2 startOrReload "${ECOSYSTEM}" --update-env
  pm2 save
  echo "Lookzene stack online (standalone)."
  cmd_status
}

cmd_stop() {
  pm2 stop "${APPS[@]}" || true
  echo "Lookzene stack stopped."
}

cmd_restart() {
  cmd_doctor
  pm2 startOrReload "${ECOSYSTEM}" --update-env
  pm2 restart "${APPS[@]}"
  pm2 save
  echo "Lookzene stack restarted."
  cmd_status
}

cmd_status() {
  pm2 list | grep -E 'name|lookzene-' || true
  echo
  echo "Ports:"
  ss -tlnp 2>/dev/null | grep -E ':(8001|3002|9001|13001|11001)\b' || true
}

cmd_nginx() {
  sudo cp "${ROOT}/lookzene.com.conf" /etc/nginx/conf.d/lookzene.com.conf
  sudo cp "${ROOT}/cp.lookzene.com.conf" /etc/nginx/conf.d/cp.lookzene.com.conf
  sudo nginx -t
  sudo systemctl reload nginx
  echo "Nginx lookzene.com + cp.lookzene.com reloaded."
}

cmd_build() {
  cd "${ROOT}/apps/coscore"
  if [[ -x "${ROOT}/runtime/node/bin/node" ]]; then
    export PATH="${ROOT}/runtime/node/bin:${PATH}"
  fi
  if command -v bun >/dev/null 2>&1; then
    bun run build
  elif [[ -f package-lock.json ]]; then
    npm run build
  else
    npm run build
  fi
  cd "${ROOT}"
  echo "Coscore production build ready."
}

usage() {
  cat <<EOF
Usage: $0 <command>

  doctor    Verify no other-project runtime deps
  start     Start/reload all Lookzene PM2 apps from this directory
  stop      Stop only lookzene-* processes
  restart   Reload ecosystem + restart lookzene-* processes
  status    Show lookzene processes and ports
  nginx     Install project nginx confs and reload nginx
  build     Build Coscore storefront (.output)
EOF
}

case "${1:-}" in
  doctor) cmd_doctor ;;
  start) cmd_start ;;
  stop) cmd_stop ;;
  restart) cmd_restart ;;
  status) cmd_status ;;
  nginx) cmd_nginx ;;
  build) cmd_build ;;
  *) usage; exit 1 ;;
esac

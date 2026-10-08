#!/usr/bin/env bash
set -euo pipefail
PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
export TMPDIR="$PROJECT_DIR/.runtime/tmp"
export UV_CACHE_DIR="$PROJECT_DIR/.cache/uv"
export npm_config_cache="$PROJECT_DIR/.cache/npm"
mkdir -p "$TMPDIR" "$UV_CACHE_DIR" "$npm_config_cache"
# Keep compatible HTTP(S) proxies while avoiding an unused SOCKS fallback.
if [[ "${ALL_PROXY:-${all_proxy:-}}" == socks* &&
      "${HTTP_PROXY:-${http_proxy:-}}" == http* &&
      "${HTTPS_PROXY:-${https_proxy:-}}" == http* ]]; then
    unset ALL_PROXY all_proxy
fi
if [[ $# -eq 0 ]]; then
    printf 'Usage: %s {setup|backend|frontend|lint|test|build|prod-smoke}\n' "$0"
    exit 0
fi
exec make -C "$PROJECT_DIR" "$@"

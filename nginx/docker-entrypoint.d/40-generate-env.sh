#!/bin/sh
set -e

# 인프라를 통해 주입된 VITE_* 환경 변수를 읽어 브라우저 런타임용 env-config.js 동적 생성
OUTPUT_FILE="/usr/share/nginx/html/env-config.js"

echo "// Generated at $(date -u '+%Y-%m-%d %H:%M:%S UTC')" > "$OUTPUT_FILE"
echo "window.__ENV__ = {" >> "$OUTPUT_FILE"

# VITE_ 로 시작하는 환경 변수를 찾아 JSON key-value 형식으로 기록
env | grep '^VITE_' | while IFS='=' read -r key value; do
  # 값 내부의 백슬래시 및 큰따옴표 이스케이프
  escaped_value=$(printf '%s' "$value" | sed 's/\\/\\\\/g; s/"/\\"/g')
  echo "  \"$key\": \"$escaped_value\"," >> "$OUTPUT_FILE"
done

echo "};" >> "$OUTPUT_FILE"

echo "[env-config] Generated runtime configuration at $OUTPUT_FILE"

# 인프라에서 주입된 APP_ENV/NODE_ENV/VITE_APP_ENV가 있는 경우 version.json의 env 필드 동기화
VERSION_FILE="/usr/share/nginx/html/version.json"
TARGET_ENV="${APP_ENV:-${NODE_ENV:-${VITE_APP_ENV:-}}}"
if [ -f "$VERSION_FILE" ] && [ -n "$TARGET_ENV" ]; then
  sed -i "s/\"env\": \"[^\"]*\"/\"env\": \"$TARGET_ENV\"/" "$VERSION_FILE" || true
  echo "[version] Synced runtime env to $TARGET_ENV in $VERSION_FILE"
fi


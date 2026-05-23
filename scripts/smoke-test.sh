#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   BACKEND_URL=https://api.example.com STUDENT_APP_URL=https://book.example.com STAFF_APP_URL=https://staff.example.com npm run smoke:test
# Optional:
#   BATCH_PATH=/batch/abc123 (defaults to /)
#   REQUEST_TIMEOUT_SECONDS=15 (defaults to 15)

BACKEND_URL="${BACKEND_URL:-}"
STUDENT_APP_URL="${STUDENT_APP_URL:-}"
STAFF_APP_URL="${STAFF_APP_URL:-}"
BATCH_PATH="${BATCH_PATH:-/}"
REQUEST_TIMEOUT_SECONDS="${REQUEST_TIMEOUT_SECONDS:-15}"

if [[ -z "$BACKEND_URL" || -z "$STUDENT_APP_URL" || -z "$STAFF_APP_URL" ]]; then
  echo "Missing required environment variables."
  echo "Required: BACKEND_URL, STUDENT_APP_URL, STAFF_APP_URL"
  exit 1
fi

trim_slash() {
  local value="$1"
  echo "${value%/}"
}

BACKEND_URL="$(trim_slash "$BACKEND_URL")"
STUDENT_APP_URL="$(trim_slash "$STUDENT_APP_URL")"
STAFF_APP_URL="$(trim_slash "$STAFF_APP_URL")"

if [[ "$BATCH_PATH" != /* ]]; then
  BATCH_PATH="/$BATCH_PATH"
fi

failures=0

check_url() {
  local label="$1"
  local url="$2"
  local expected_code="$3"

  local code
  code=$(curl -L -sS -o /tmp/afda_smoke_body.txt -w "%{http_code}" --max-time "$REQUEST_TIMEOUT_SECONDS" "$url" || true)

  if [[ "$code" == "$expected_code" ]]; then
    echo "PASS: $label ($url) -> HTTP $code"
  else
    echo "FAIL: $label ($url) -> HTTP ${code:-no_response} (expected $expected_code)"
    echo "Response preview:"
    head -c 250 /tmp/afda_smoke_body.txt || true
    echo
    failures=$((failures + 1))
  fi
}

echo "Starting smoke checks..."
check_url "Backend health" "$BACKEND_URL/api/health" "200"
check_url "Backend readiness" "$BACKEND_URL/api/ready" "200"
check_url "Student app root" "$STUDENT_APP_URL/" "200"
check_url "Student batch path" "$STUDENT_APP_URL$BATCH_PATH" "200"
check_url "Staff app root" "$STAFF_APP_URL/" "200"

if [[ "$failures" -gt 0 ]]; then
  echo
  echo "Smoke test failed with $failures failing check(s)."
  exit 1
fi

echo
echo "Smoke test passed."

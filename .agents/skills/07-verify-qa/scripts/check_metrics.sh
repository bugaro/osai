#!/bin/bash
# Usage: ./check_metrics.sh <endpoint_url>

URL=$1
if [ -z "$URL" ]; then
  URL="http://localhost:3000/metrics"
fi

echo "Checking Prometheus metrics endpoint at $URL..."

RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$URL" || echo 0)

if [ "$RESPONSE" -ne 200 ]; then
  echo "FAIL: Metrics endpoint returned HTTP status $RESPONSE"
  exit 1
fi

METRICS_CONTENT=$(curl -s "$URL")

# Check for standard prometheus-style lines (HELP or TYPE)
HELP_COUNT=$(echo "$METRICS_CONTENT" | grep -c "^# HELP" || echo 0)
TYPE_COUNT=$(echo "$METRICS_CONTENT" | grep -c "^# TYPE" || echo 0)

echo "Metrics HELP lines: $HELP_COUNT"
echo "Metrics TYPE lines: $TYPE_COUNT"

if [ "$TYPE_COUNT" -lt 2 ]; then
  echo "FAIL: Endpoint does not return valid Prometheus metrics content."
  exit 1
fi

echo "PASS: Prometheus metrics endpoint verified."
exit 0

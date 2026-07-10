#!/bin/bash
# Usage: ./audit_logs.sh <log_file>

LOG_FILE=$1
if [ -z "$LOG_FILE" ]; then
  echo "Error: please provide a log file path."
  exit 1
fi

if [ ! -f "$LOG_FILE" ]; then
  echo "Error: file $LOG_FILE not found."
  exit 1
fi

echo "Auditing logs in $LOG_FILE..."

# Check for warnings and errors in Pino logs (level 40 = WARN, level 50 = ERROR)
WARN_COUNT=$(grep -c '"level":40' "$LOG_FILE" || echo 0)
ERR_COUNT=$(grep -c '"level":50' "$LOG_FILE" || echo 0)
UNHANDLED_COUNT=$(grep -i -c "unhandledRejection\|uncaughtException" "$LOG_FILE" || echo 0)

echo "Found warnings: $WARN_COUNT"
echo "Found errors: $ERR_COUNT"
echo "Found unhandled exceptions/rejections: $UNHANDLED_COUNT"

if [ "$ERR_COUNT" -gt 0 ] || [ "$UNHANDLED_COUNT" -gt 0 ]; then
  echo "FAIL: Error logs or unhandled exceptions detected!"
  exit 1
fi

if [ "$WARN_COUNT" -gt 0 ]; then
  echo "WARNING: Logs contain warning entries. Review them before committing."
fi

echo "PASS: Logs audit completed successfully."
exit 0

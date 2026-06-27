#!/usr/bin/env bash
# Применяет CORS на S3-бакет firstvds.ru (с workaround на самоподписанный сертификат).
# Использование:
#   export S3_ENDPOINT=s3.firstvds.ru S3_BUCKET=phlart S3_REGION=default
#   export S3_ACCESS_KEY=... S3_SECRET_KEY=...
#   export CORS_JSON='{...}'
#   bash scripts/setup-s3-cors.sh

set -euo pipefail

HOSTNAME="${S3_ENDPOINT}"
CERT_FILE=$(mktemp /tmp/firstvds-ca.XXXXXX.pem)
trap 'rm -f "$CERT_FILE"' EXIT

echo "→ Получаем TLS-сертификат с ${HOSTNAME}..."
openssl s_client -connect "${HOSTNAME}:443" -showcerts </dev/null 2>/dev/null \
  | openssl x509 -outform PEM > "$CERT_FILE"

export AWS_CA_BUNDLE="$CERT_FILE"
export AWS_ACCESS_KEY_ID="${S3_ACCESS_KEY}"
export AWS_SECRET_ACCESS_KEY="${S3_SECRET_KEY}"
export AWS_DEFAULT_REGION="${S3_REGION}"
ENDPOINT_URL="https://${S3_ENDPOINT}"

echo "→ Применяем CORS на бакет ${S3_BUCKET}..."
aws s3api put-bucket-cors --endpoint-url "${ENDPOINT_URL}" --bucket "${S3_BUCKET}" --cors-configuration "${CORS_JSON}"

echo "→ Проверяем:"
aws s3api get-bucket-cors --endpoint-url "${ENDPOINT_URL}" --bucket "${S3_BUCKET}"
echo "✓ CORS настроен."

#!/usr/bin/env bash
set -euo pipefail

PB_VERSION="0.25.9"

# Detect OS and arch
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

case "$ARCH" in
  x86_64)  ARCH="amd64" ;;
  aarch64) ARCH="arm64" ;;
  arm64)   ARCH="arm64" ;;
  *)       echo "Unsupported architecture: $ARCH"; exit 1 ;;
esac

BINARY="pocketbase"
if [ -f "$BINARY" ]; then
  CURRENT=$(./"$BINARY" --version 2>/dev/null | grep -oP '[\d.]+' || echo "")
  if [ "$CURRENT" = "$PB_VERSION" ]; then
    exit 0
  fi
  echo "Updating PocketBase from $CURRENT to $PB_VERSION..."
fi

FILENAME="pocketbase_${PB_VERSION}_${OS}_${ARCH}.zip"
URL="https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/${FILENAME}"

echo "Downloading PocketBase v${PB_VERSION} for ${OS}/${ARCH}..."
curl -fsSL -o "/tmp/${FILENAME}" "$URL"
if command -v unzip &>/dev/null; then
  unzip -o "/tmp/${FILENAME}" pocketbase -d .
else
  python3 -c "import zipfile; zipfile.ZipFile('/tmp/${FILENAME}').extract('pocketbase', '.')"
fi
rm -f "/tmp/${FILENAME}"
chmod +x "$BINARY"

echo "PocketBase v${PB_VERSION} ready."

#!/bin/bash

# Script to build and install the Roo Code extension for Docker environment

set -e

echo "🔨 Building the Roo Code extension..."

# Go to the Roo-Code directory
cd /roo-code

# Create bin directory if it doesn't exist
mkdir -p bin

# Install dependencies and build the extension
npm run install-extension -- --silent --no-audit || exit 1
npm run install-webview -- --silent --no-audit || exit 1
npm run install-e2e -- --silent --no-audit || exit 1

# Package the extension
npx vsce package --out bin/roo-code-latest.vsix || exit 1

# Copy the extension to the code-server extensions directory
mkdir -p /home/coder/.local/share/code-server/extensions/
cp bin/roo-code-latest.vsix /home/coder/.local/share/code-server/extensions/

# Install the extension in code-server
code-server --install-extension bin/roo-code-latest.vsix || exit 1

echo "✅ Roo Code extension built and installed successfully"
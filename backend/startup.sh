#!/bin/bash

# Exit on error
set -e

echo "Starting backend setup..."

# 1. Install dependencies to fix "invalid ELF header" issue
# This ensures binaries are compiled for Linux, even if node_modules is mounted from Windows
echo "Ensuring dependencies are installed and compatible..."
npm install

# 2. Initialize Database Schema
echo "Initializing Database Schema..."
node init_sqlite.js

# 3. Use nodemon for development (hot reloading)
echo "Starting Server..."
npm run dev

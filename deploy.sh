#!/usr/bin/env bash

set -e

cd /opt/kidad

echo "🚀 Starting Kidad deployment..."

echo "📥 Fetching latest code..."
git fetch origin main
git reset --hard origin/main

echo "🐳 Pulling images (tag=${IMAGE_TAG:-latest})..."
docker compose pull api web

echo "🔄 Starting containers..."
docker compose up -d --remove-orphans

echo "🧹 Cleaning unused images..."
docker image prune -f

echo "✅ Deployment completed!"
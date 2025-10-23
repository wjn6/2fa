#!/bin/sh

echo "🚀 启动 2FA 认证系统（单容器版本）"

# 启动后端服务（后台运行）
cd /app/backend
echo "📦 启动后端服务..."
node src/app.js &

# 等待后端启动
sleep 3

# 启动 Nginx
echo "🌐 启动 Nginx..."
nginx -g 'daemon off;'


#!/bin/sh

# 2FA Notebook 启动脚本
# 此脚本在 Docker 容器中启动 Node.js 后端和 Nginx

echo "=========================================="
echo "  Starting 2FA Notebook Application"
echo "=========================================="

# 设置环境变量
export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-5556}

# 检查数据目录
if [ ! -d "/app/backend/data" ]; then
  echo "📁 Creating data directory..."
  mkdir -p /app/backend/data
fi

# 检查数据库文件
if [ ! -f "/app/backend/data/2fa.db" ]; then
  echo "📊 Database not found, it will be created on first run"
fi

# 启动 Node.js 后端（后台运行）
echo "🚀 Starting Node.js backend on port ${PORT}..."
cd /app/backend
node src/app.js &

# 等待后端启动
sleep 3

# 检查后端是否启动成功
if curl -f http://127.0.0.1:${PORT}/health > /dev/null 2>&1; then
  echo "✅ Backend is running on http://127.0.0.1:${PORT}"
else
  echo "⚠️  Backend health check failed, but continuing..."
fi

# 启动 Nginx（前台运行）
echo "🌐 Starting Nginx on port 5555..."
nginx -g 'daemon off;'


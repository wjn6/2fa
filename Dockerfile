# ============================================
# 单容器版本：前端 + 后端一体化
# ============================================
FROM node:18-alpine

# 安装运行时依赖 + Nginx
RUN apk add --no-cache \
    cairo \
    jpeg \
    pango \
    giflib \
    pixman \
    nginx \
    supervisor

WORKDIR /app

# 复制后端代码和依赖
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install --production && npm cache clean --force

COPY backend/ ./

# 复制前端编译好的文件
WORKDIR /app
COPY frontend/dist /usr/share/nginx/html

# 复制 Nginx 配置
COPY nginx.conf /etc/nginx/http.d/default.conf

# 创建数据目录
RUN mkdir -p /app/backend/data

# 复制启动脚本
COPY start.sh /start.sh
RUN chmod +x /start.sh

# 暴露端口（只需要一个端口）
EXPOSE 80

# 启动脚本
CMD ["/start.sh"]


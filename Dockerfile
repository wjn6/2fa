# ============================================
# 构建阶段：编译原生模块
# ============================================
FROM node:18-alpine AS builder

# 安装编译工具
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev \
    pkgconfig

WORKDIR /app/backend

# 复制 package.json 并安装依赖
COPY backend/package*.json ./

# 使用淘宝镜像源并增加超时和重试
RUN npm config set registry https://registry.npmmirror.com && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5 && \
    npm install --production && \
    npm cache clean --force

# ============================================
# 运行阶段：单容器版本
# ============================================
FROM node:18-alpine

# 安装运行时依赖 + Nginx
RUN apk add --no-cache \
    cairo \
    jpeg \
    pango \
    giflib \
    pixman \
    nginx

WORKDIR /app

# 从构建阶段复制 node_modules
COPY --from=builder /app/backend/node_modules ./backend/node_modules

# 复制后端代码
COPY backend/ ./backend/

# 复制前端编译好的文件
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


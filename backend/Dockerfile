# ============================================
# 构建阶段：安装依赖（包含原生模块编译工具）
# ============================================
FROM node:18-alpine AS builder

# 安装编译工具（仅在构建阶段需要）
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev

WORKDIR /app

COPY package*.json ./

# 安装依赖
RUN npm install --production && \
    npm cache clean --force

# ============================================
# 运行阶段：仅保留运行时依赖
# ============================================
FROM node:18-alpine

# 只安装运行时需要的库（不要开发工具）
RUN apk add --no-cache \
    cairo \
    jpeg \
    pango \
    giflib \
    pixman

WORKDIR /app

# 从构建阶段复制 node_modules
COPY --from=builder /app/node_modules ./node_modules

# 复制应用代码
COPY . .

# 创建数据目录
RUN mkdir -p /app/data

EXPOSE 3000

CMD ["npm", "start"]



# 2FA 笔记本 - 部署指南

## 快速部署（推荐）

### 使用 Docker Compose

这是最简单的部署方式，适合大多数用户。

#### 1. 准备环境

确保已安装：
- Docker (20.10+)
- Docker Compose (2.0+)

#### 2. 克隆项目

```bash
git clone <repository-url>
cd 2fa
```

#### 3. 启动服务

```bash
docker-compose up -d
```

#### 4. 访问应用

- 主应用：http://localhost:5555
- 后台管理：http://localhost:5555/admin

#### 5. 首次使用

1. 访问应用，设置主密码
2. 访问后台，使用默认账号登录：
   - 用户名：`admin`
   - 密码：`admin123`
3. **立即修改默认密码！**

## 生产环境部署

### 使用 HTTPS

#### 方案一：使用 Nginx 反向代理

1. 创建 Nginx 配置：

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:5555;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

2. 启动 Nginx：

```bash
nginx -s reload
```

#### 方案二：使用 Traefik

修改 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  traefik:
    image: traefik:v2.10
    command:
      - "--api.insecure=true"
      - "--providers.docker=true"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.myresolver.acme.tlschallenge=true"
      - "--certificatesresolvers.myresolver.acme.email=your-email@example.com"
      - "--certificatesresolvers.myresolver.acme.storage=/letsencrypt/acme.json"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock:ro"
      - "./letsencrypt:/letsencrypt"
    networks:
      - 2fa-network

  frontend:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.2fa.rule=Host(`your-domain.com`)"
      - "traefik.http.routers.2fa.entrypoints=websecure"
      - "traefik.http.routers.2fa.tls.certresolver=myresolver"
```

### 环境变量配置

创建 `.env` 文件：

```bash
# 后端配置
PORT=3000
NODE_ENV=production
DB_PATH=/app/data/2fa.db

# 安全配置（必须修改！）
JWT_SECRET=your-very-long-random-secret-key-change-this-in-production

# CORS配置
CORS_ORIGIN=https://your-domain.com

# 备份配置
AUTO_BACKUP_ENABLED=true
AUTO_BACKUP_INTERVAL_HOURS=24
```

修改 `docker-compose.yml` 使用环境变量：

```yaml
services:
  backend:
    env_file:
      - .env
```

## 高级部署

### 数据持久化

默认配置已经持久化数据到 `./data` 目录。如需自定义：

```yaml
services:
  backend:
    volumes:
      - /custom/path/to/data:/app/data
```

### 自定义端口

修改 `docker-compose.yml`：

```yaml
services:
  frontend:
    ports:
      - "8080:80"  # 改为8080端口
```

### 内存和CPU限制

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

### 多实例部署

使用 Docker Swarm 或 Kubernetes 部署多个实例。

## 备份策略

### 自动备份

系统内置自动备份功能，可在后台管理设置中启用。

### 手动备份

#### 备份数据库

```bash
# 复制数据库文件
cp ./data/2fa.db ./backup/2fa-$(date +%Y%m%d).db

# 或使用 docker cp
docker cp 2fa-backend:/app/data/2fa.db ./backup/2fa-$(date +%Y%m%d).db
```

#### 通过应用导出

1. 登录应用
2. 点击菜单 → 导出数据
3. 选择是否加密
4. 下载备份文件

### 定期备份脚本

创建 `backup.sh`：

```bash
#!/bin/bash

BACKUP_DIR="/path/to/backup"
DATE=$(date +%Y%m%d-%H%M%S)

# 备份数据库
docker cp 2fa-backend:/app/data/2fa.db "$BACKUP_DIR/2fa-$DATE.db"

# 压缩
gzip "$BACKUP_DIR/2fa-$DATE.db"

# 删除30天前的备份
find "$BACKUP_DIR" -name "2fa-*.db.gz" -mtime +30 -delete

echo "Backup completed: 2fa-$DATE.db.gz"
```

添加到 crontab：

```bash
# 每天凌晨3点备份
0 3 * * * /path/to/backup.sh
```

## 监控和日志

### 查看日志

```bash
# 查看所有日志
docker-compose logs

# 实时查看日志
docker-compose logs -f

# 查看特定服务
docker-compose logs -f backend
```

### 日志持久化

修改 `docker-compose.yml`：

```yaml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### 健康检查

添加健康检查：

```yaml
services:
  backend:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

## 更新应用

### 拉取最新代码

```bash
git pull origin main
```

### 重新构建并启动

```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### 数据库迁移

如有数据库schema变更，系统会自动迁移。建议更新前先备份。

## 故障排除

### 容器无法启动

```bash
# 查看日志
docker-compose logs backend
docker-compose logs frontend

# 检查端口占用
lsof -i :5555
lsof -i :3000

# 重新构建
docker-compose build --no-cache
```

### 数据库损坏

```bash
# 停止服务
docker-compose down

# 恢复备份
cp ./backup/2fa-20240101.db ./data/2fa.db

# 重启服务
docker-compose up -d
```

### 性能优化

1. 定期清理日志
2. 优化数据库（后台管理 → 系统维护 → 优化数据库）
3. 增加资源限制

## 安全加固

### 防火墙配置

```bash
# 只允许必要的端口
ufw allow 80/tcp
ufw allow 443/tcp
ufw deny 3000/tcp  # 不对外暴露后端端口
ufw enable
```

### 访问控制

#### 使用 Nginx Basic Auth

```nginx
location / {
    auth_basic "Restricted Access";
    auth_basic_user_file /etc/nginx/.htpasswd;
    proxy_pass http://localhost:5555;
}
```

生成密码文件：

```bash
htpasswd -c /etc/nginx/.htpasswd admin
```

#### IP 白名单

```nginx
location / {
    allow 192.168.1.0/24;
    deny all;
    proxy_pass http://localhost:5555;
}
```

### 定期更新

```bash
# 更新系统包
apt update && apt upgrade -y

# 更新 Docker
apt install docker-ce docker-ce-cli containerd.io

# 更新应用
git pull && docker-compose up -d --build
```

## 卸载

### 完全卸载

```bash
# 停止并删除容器
docker-compose down

# 删除数据（谨慎！）
rm -rf ./data

# 删除项目文件
cd ..
rm -rf 2fa
```

### 保留数据卸载

```bash
# 只停止容器
docker-compose down

# 备份数据
cp -r ./data ./data-backup

# 删除项目文件
cd ..
rm -rf 2fa
```

## 技术支持

如遇到问题：

1. 查看日志：`docker-compose logs -f`
2. 检查文档：README.md
3. 提交 Issue：GitHub Issues
4. 邮件联系：your-email@example.com

---

**安全提醒**：
- 务必修改默认密码
- 定期备份数据
- 使用HTTPS
- 限制访问IP
- 定期更新系统


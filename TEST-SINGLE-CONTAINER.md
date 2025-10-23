# 🧪 单容器架构测试指南

## 测试前准备

### 1. 确保 Docker 已启动
```bash
docker --version
docker-compose --version
```

### 2. 停止旧版本（如果正在运行）
```bash
# 停止所有旧容器
docker-compose down

# 查看是否还有残留容器
docker ps -a | grep 2fa

# 清理旧容器（如果有）
docker rm -f 2fa-frontend 2fa-backend 2fa-app
```

## 构建和启动

### 1. 构建镜像
```bash
# 在 2fa 目录下执行
docker-compose build --no-cache
```

**预期输出**：
```
[+] Building ...
 => [internal] load build definition from Dockerfile
 => => transferring dockerfile: 1.2kB
 => [internal] load .dockerignore
 ...
 => exporting to image
 => => writing image sha256:...
 => => naming to docker.io/library/2fa-app:latest
```

### 2. 启动容器
```bash
docker-compose up -d
```

**预期输出**：
```
[+] Running 1/1
 ✔ Container 2fa-app  Started
```

### 3. 查看容器状态
```bash
docker ps
```

**预期输出**：
```
CONTAINER ID   IMAGE           COMMAND        CREATED         STATUS                   PORTS                  NAMES
xxxxxxxxxxxx   2fa-app:latest  "/start.sh"    10 seconds ago  Up 9 seconds (healthy)  0.0.0.0:5656->80/tcp   2fa-app
```

**注意**：STATUS 应该显示 `Up` 和 `(healthy)`

## 日志检查

### 1. 查看启动日志
```bash
docker logs 2fa-app
```

**预期输出**：
```
🚀 启动 2FA 认证系统（单容器版本）
📦 启动后端服务...
初始化数据库...
✓ 数据库初始化完成
==================================================
默认管理员账号：
  用户名：admin
  密码：admin123
⚠️  请登录后立即修改默认密码！
==================================================
=================================
  2FA Notebook Server - v3.0.0
=================================
🚀 Server is running on 127.0.0.1:3000
📝 Environment: production
📂 Database: /app/backend/data/database.db
=================================
🌐 启动 Nginx...
```

### 2. 实时查看日志
```bash
docker logs -f 2fa-app
```

按 `Ctrl+C` 退出日志查看

## 功能测试

### 1. 健康检查
```bash
curl http://localhost:5656/health
```

**预期输出**：
```json
{
  "status": "ok",
  "timestamp": "2025-10-23T...",
  "version": "2.0.0"
}
```

### 2. 访问前端
```bash
# Windows
start http://localhost:5656

# Linux/Mac
xdg-open http://localhost:5656
```

**预期结果**：
- ✅ 页面正常加载
- ✅ 显示登录界面
- ✅ 没有控制台错误

### 3. 测试登录
- 用户名：`admin`
- 密码：`admin123`

**预期结果**：
- ✅ 登录成功
- ✅ 跳转到首页
- ✅ 显示"欢迎使用"

### 4. 测试 API
```bash
# 登录 API
curl -X POST http://localhost:5656/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**预期输出**：
```json
{
  "success": true,
  "message": "登录成功",
  "token": "eyJhbGciOiJIUzI1...",
  "user": {
    "id": 1,
    "username": "admin",
    "isAdmin": true
  }
}
```

## 容器内部检查

### 1. 进入容器
```bash
docker exec -it 2fa-app sh
```

### 2. 检查进程
```bash
ps aux
```

**预期输出**：
```
PID   USER     TIME  COMMAND
1     root      0:00 /bin/sh /start.sh
7     root      0:00 node src/app.js
15    root      0:00 nginx: master process nginx -g daemon off;
16    nginx     0:00 nginx: worker process
```

**关键检查**：
- ✅ node 进程正在运行
- ✅ nginx master 进程正在运行
- ✅ nginx worker 进程正在运行

### 3. 检查端口监听
```bash
netstat -tlnp
```

**预期输出**：
```
Active Internet connections (only servers)
Proto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name
tcp        0      0 127.0.0.1:3000          0.0.0.0:*               LISTEN      7/node
tcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN      15/nginx
```

**关键检查**：
- ✅ Node.js 监听 127.0.0.1:3000（仅本地）
- ✅ Nginx 监听 0.0.0.0:80（对外）

### 4. 检查 Nginx 配置
```bash
nginx -t
```

**预期输出**：
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 5. 检查数据库
```bash
ls -la /app/backend/data/
```

**预期输出**：
```
total 144
drwxr-xr-x    3 root     root          4096 Oct 23 14:30 .
drwxr-xr-x    1 root     root          4096 Oct 23 14:30 ..
drwxr-xr-x    2 root     root          4096 Oct 23 14:30 backups
-rw-r--r--    1 root     root        131072 Oct 23 14:30 database.db
```

### 6. 退出容器
```bash
exit
```

## 性能测试

### 1. 内存占用
```bash
docker stats 2fa-app --no-stream
```

**预期结果**：
- 内存占用：100-200MB
- CPU 使用率（空闲）：< 5%

### 2. 响应时间测试
```bash
# 安装 apache2-utils (Ubuntu) 或 httpd-tools (CentOS)
# sudo apt install apache2-utils

ab -n 100 -c 10 http://localhost:5656/health
```

**预期结果**：
- 平均响应时间：< 50ms
- 成功率：100%

## 故障排查

### 问题 1：容器启动失败
```bash
# 查看详细日志
docker logs 2fa-app --tail 100

# 检查端口占用
netstat -tulnp | grep 5656  # Linux
netstat -ano | findstr 5656  # Windows

# 重新构建
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### 问题 2：健康检查失败
```bash
# 查看健康检查日志
docker inspect 2fa-app | grep -A 20 Health

# 手动测试健康检查
docker exec 2fa-app wget -q -O- http://localhost/health
```

### 问题 3：后端无法连接
```bash
# 检查 Node.js 进程
docker exec 2fa-app ps aux | grep node

# 检查端口监听
docker exec 2fa-app netstat -tlnp | grep 3000

# 查看 Node.js 日志
docker logs 2fa-app | grep -A 10 "Server is running"
```

### 问题 4：前端 404
```bash
# 检查静态文件
docker exec 2fa-app ls -la /usr/share/nginx/html

# 检查 Nginx 配置
docker exec 2fa-app nginx -t

# 重启 Nginx
docker exec 2fa-app nginx -s reload
```

## 清理

### 停止容器
```bash
docker-compose down
```

### 完全清理（包括数据）
```bash
docker-compose down -v
rm -rf data/
```

### 清理镜像
```bash
docker rmi 2fa-app:latest
```

## 成功标准

测试通过的标准：

- ✅ 容器启动成功，状态为 `healthy`
- ✅ 前端页面正常访问（http://localhost:5656）
- ✅ 登录功能正常
- ✅ API 调用成功
- ✅ 健康检查通过
- ✅ 日志没有错误信息
- ✅ 容器内进程正常运行
- ✅ 数据库文件已创建
- ✅ 内存占用 < 200MB
- ✅ 响应时间 < 100ms

## 下一步

测试通过后：
1. 修改默认密码
2. 添加第一个 2FA 密钥
3. 测试所有功能模块
4. 准备生产环境部署

---

**测试环境**：单容器架构 v3.0  
**建议测试时间**：15-30 分钟


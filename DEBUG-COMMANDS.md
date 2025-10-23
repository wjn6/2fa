# 🔍 故障排查命令

## 查看容器日志

```bash
# 查看最近50行日志
docker logs 2fa-app --tail 50

# 实时查看日志（会持续显示新日志）
docker logs -f 2fa-app

# 查看所有日志
docker logs 2fa-app
```

## 查看容器状态

```bash
# 查看容器是否运行
docker ps

# 查看详细信息
docker inspect 2fa-app
```

## 进入容器调试

```bash
# 进入容器
docker exec -it 2fa-app sh

# 检查进程
ps aux

# 检查端口
netstat -tlnp

# 查看数据库文件
ls -la /app/backend/data/

# 测试后端 API
wget -O- http://127.0.0.1:3000/health
wget -O- http://127.0.0.1:3000/api/admin/statistics

# 退出容器
exit
```

## 测试健康检查

```bash
# 从宿主机测试
curl http://localhost:5656/health

# 从容器内测试
docker exec 2fa-app wget -qO- http://localhost/health
```

## 重启服务

```bash
# 重启容器
docker-compose restart

# 重新构建并启动
docker-compose down
docker-compose up -d --build
```

## 清理并重新部署

```bash
# 停止并删除容器
docker-compose down

# 删除旧镜像
docker rmi 2fa-app:latest

# 清理构建缓存
docker builder prune -a

# 重新构建
docker-compose up -d --build
```

## 常见错误排查

### 错误1：服务器错误，请稍后重试

**原因**：后端 API 异常

**排查步骤**：
```bash
# 1. 查看日志
docker logs 2fa-app --tail 100

# 2. 检查是否有错误信息
docker logs 2fa-app 2>&1 | grep -i error

# 3. 检查 Node.js 进程
docker exec 2fa-app ps aux | grep node
```

### 错误2：连接超时

**原因**：Nginx 到后端的代理失败

**排查步骤**：
```bash
# 1. 检查后端是否监听
docker exec 2fa-app netstat -tlnp | grep 3000

# 2. 测试后端连接
docker exec 2fa-app wget -qO- http://127.0.0.1:3000/health

# 3. 检查 Nginx 配置
docker exec 2fa-app nginx -t
```

### 错误3：数据库错误

**原因**：数据库文件损坏或权限问题

**排查步骤**：
```bash
# 1. 检查数据库文件
docker exec 2fa-app ls -la /app/backend/data/

# 2. 检查权限
docker exec 2fa-app stat /app/backend/data/database.db

# 3. 备份并重建数据库
docker exec 2fa-app cp /app/backend/data/database.db /app/backend/data/database.db.bak
docker-compose restart
```

## 导出日志

```bash
# 导出完整日志到文件
docker logs 2fa-app > 2fa-debug.log 2>&1

# 查看日志
cat 2fa-debug.log
```


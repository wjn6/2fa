# 故障排除指南

## 常见问题及解决方案

### 1. Canvas 编译失败

**错误信息：**
```
gyp ERR! find Python
Failed to execute node-gyp
```

**原因：** Alpine 镜像缺少 canvas 所需的构建依赖。

**解决方案：** 已在 Dockerfile 中添加必要依赖，重新构建即可。

```bash
# 清理旧的构建
docker-compose down
docker system prune -f

# 重新构建
docker-compose build --no-cache
docker-compose up -d
```

### 2. 端口被占用

**错误信息：**
```
Error: port is already allocated
```

**解决方案：**

方式1：修改端口
```yaml
# 编辑 docker-compose.yml
services:
  frontend:
    ports:
      - "8080:80"  # 改为其他端口
```

方式2：停止占用端口的进程
```bash
# Linux/Mac
sudo lsof -ti:5555 | xargs kill -9

# Windows
netstat -ano | findstr :5555
taskkill /PID <PID> /F
```

### 3. 数据库权限问题

**错误信息：**
```
SQLITE_CANTOPEN: unable to open database file
```

**解决方案：**
```bash
# 创建数据目录并设置权限
mkdir -p data
chmod 777 data
```

### 4. 容器无法启动

**检查日志：**
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

**常见原因：**
- 依赖安装失败
- 配置文件错误
- 端口冲突

**解决方案：**
```bash
# 完全重建
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### 5. 前端无法连接后端

**检查网络：**
```bash
# 进入前端容器测试
docker exec -it 2fa-frontend sh
ping backend

# 检查后端是否运行
docker ps | grep backend
```

**解决方案：**
- 确保 backend 容器正在运行
- 检查 nginx.conf 配置
- 检查防火墙设置

### 6. 忘记主密码

**⚠️ 警告：** 主密码无法重置！

**选项：**

1. **查看密码提示**
   - 访问应用，点击"忘记密码"查看提示

2. **从备份恢复**
   ```bash
   # 导入之前的备份文件
   # 在应用中选择"导入数据"
   ```

3. **清空数据（最后手段）**
   ```bash
   docker-compose down
   rm -rf data/2fa.db
   docker-compose up -d
   # ⚠️ 所有数据将丢失！
   ```

### 7. 忘记管理员密码

**解决方案：**

1. **进入容器重置**
   ```bash
   docker exec -it 2fa-backend sh
   
   # 进入 Node 环境
   node
   
   # 执行重置脚本
   const bcrypt = require('bcryptjs');
   const Database = require('better-sqlite3');
   const db = new Database('/app/data/2fa.db');
   const hash = bcrypt.hashSync('newpassword123', 10);
   db.prepare('UPDATE users SET password = ? WHERE username = ?').run(hash, 'admin');
   console.log('Password reset to: newpassword123');
   process.exit();
   ```

2. **重启容器**
   ```bash
   docker-compose restart backend
   ```

### 8. 性能问题

**优化建议：**

1. **增加资源限制**
   ```yaml
   # docker-compose.yml
   services:
     backend:
       deploy:
         resources:
           limits:
             memory: 512M
           reservations:
             memory: 256M
   ```

2. **清理日志**
   ```bash
   # 在后台管理 -> 系统维护 -> 清理日志
   # 或手动清理
   docker exec -it 2fa-backend sh
   rm -rf /root/.npm/_logs/*
   ```

3. **优化数据库**
   ```bash
   # 在后台管理 -> 系统维护 -> 优化数据库
   ```

### 9. SSL/HTTPS 配置

**使用 Let's Encrypt：**

```bash
# 安装 certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

**Nginx 配置：**
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:5555;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 10. 备份恢复失败

**错误：解密失败**

原因：备份密码错误

解决方案：
- 确认备份密码正确
- 尝试非加密备份
- 检查备份文件完整性

**错误：数据格式无效**

原因：备份文件损坏或格式不正确

解决方案：
```bash
# 验证 JSON 格式
cat backup.json | jq '.'

# 如果格式正确，尝试手动修复
```

### 11. 更新后数据丢失

**检查数据目录：**
```bash
ls -la data/
cat data/2fa.db
```

**恢复步骤：**
```bash
# 停止服务
docker-compose down

# 恢复备份
cp data-backup/2fa.db data/2fa.db

# 重启服务
docker-compose up -d
```

### 12. 二维码扫描失败

**常见原因：**
- 图片质量太低
- 二维码格式不支持
- 图片过大

**解决方案：**
- 使用高质量图片
- 确保是标准的 otpauth:// 格式
- 压缩图片至 5MB 以内
- 手动输入密钥

### 13. Docker 磁盘空间不足

**清理命令：**
```bash
# 清理未使用的容器、镜像、网络
docker system prune -a

# 清理构建缓存
docker builder prune -a

# 查看磁盘使用
docker system df
```

### 14. 开发环境问题

**Node 版本不匹配：**
```bash
# 使用 nvm 切换版本
nvm install 18
nvm use 18
```

**依赖安装失败：**
```bash
# 清理缓存
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### 15. 日志相关

**查看实时日志：**
```bash
# 所有服务
docker-compose logs -f

# 特定服务
docker-compose logs -f backend
docker-compose logs -f frontend

# 最近 100 行
docker-compose logs --tail=100
```

**日志位置：**
- Backend: `/root/.npm/_logs/`
- Frontend: Nginx access/error logs
- SQLite: `/app/data/`

---

## 获取帮助

如果以上方法都无法解决问题：

1. **检查日志**
   ```bash
   docker-compose logs -f
   ```

2. **查看 GitHub Issues**
   - 搜索类似问题
   - 提交新 Issue

3. **联系支持**
   - Email: your-email@example.com
   - 提供详细的错误信息和日志

## 诊断脚本

创建 `diagnose.sh` 进行快速诊断：

```bash
#!/bin/bash

echo "=== 2FA Notebook Diagnostics ==="
echo ""

echo "1. Docker 版本:"
docker --version
docker-compose --version

echo ""
echo "2. 容器状态:"
docker-compose ps

echo ""
echo "3. 网络检查:"
docker network ls | grep 2fa

echo ""
echo "4. 磁盘空间:"
df -h | grep -E 'Filesystem|/$'

echo ""
echo "5. 端口占用:"
netstat -tulpn | grep -E '5555|3000'

echo ""
echo "6. 数据目录:"
ls -lah data/

echo ""
echo "7. 最近日志:"
docker-compose logs --tail=20

echo ""
echo "=== 诊断完成 ==="
```

使用方法：
```bash
chmod +x diagnose.sh
./diagnose.sh > diagnostic-report.txt
```

---

**最后更新：** 2024-01-20


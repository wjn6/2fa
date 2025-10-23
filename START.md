# 🚀 3分钟快速启动指南

## 前提条件
- 已安装 Docker 和 Docker Compose
- 服务器开放 5656 端口

## 启动步骤

### 1️⃣ 克隆并进入目录
```bash
git clone https://github.com/wjn6/2fa.git
cd 2fa
```

### 2️⃣ 一键启动（单容器版本）
```bash
docker-compose up -d
```

**启动过程**：
- 🔨 构建镜像（首次需要几分钟）
- 🚀 启动单个容器（包含前端+后端）
- 📦 自动初始化数据库
- ✅ 创建默认管理员账号

### 3️⃣ 访问应用
```
地址: http://localhost:5656
用户名: admin
密码: admin123
```

**⚠️ 重要**：首次登录后立即修改密码！

## 查看状态

```bash
# 查看容器状态
docker ps

# 查看日志
docker logs 2fa-app

# 实时查看日志
docker logs -f 2fa-app
```

## 常见操作

### 停止服务
```bash
docker-compose down
```

### 重启服务
```bash
docker-compose restart
```

### 更新版本
```bash
git pull
docker-compose down
docker-compose up -d --build
```

### 备份数据
```bash
# 数据在 ./data 目录
tar -czf 2fa-backup-$(date +%Y%m%d).tar.gz data/
```

## 故障排查

### 容器无法启动
```bash
# 查看详细日志
docker logs 2fa-app --tail 100

# 检查端口占用
netstat -tunlp | grep 5656

# 清理重建
docker-compose down
docker-compose up -d --build
```

### 忘记密码
```bash
# 进入容器
docker exec -it 2fa-app sh

# 重置管理员密码（在容器内执行）
cd /app/backend
node -e "
const db = require('better-sqlite3')('data/database.db');
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('admin123', 10);
db.prepare('UPDATE users SET password = ? WHERE username = ?').run(hash, 'admin');
console.log('密码已重置为: admin123');
"
exit
```

## 下一步

✅ 登录系统  
✅ 修改默认密码  
✅ 添加第一个2FA密钥  
✅ 探索管理后台功能  

需要更多帮助？查看 [README.md](README.md) 完整文档。


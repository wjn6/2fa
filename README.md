# 2FA Notebook - 双因素认证管理系统 v2.9

一个功能完整、安全可靠的双因素认证（2FA）管理系统，支持多用户、完善的管理后台、邮件通知等企业级功能。

## ✨ 主要功能

### 核心功能
- 🔐 **密钥管理** - 添加、编辑、删除、搜索、分类管理2FA密钥
- ⏱️ **实时验证码** - 自动生成6位TOTP验证码，带倒计时
- 📱 **二维码扫描** - 支持扫描二维码快速添加密钥
- 🏷️ **分类标签** - 自定义分类和标签，灵活组织密钥
- 📥 **导入导出** - 支持Google Authenticator、批量导入导出

### 多用户系统
- 👥 **用户管理** - 支持多用户独立账号，数据完全隔离
- 🔑 **JWT认证** - 安全的token认证机制
- 👨‍💼 **角色权限** - 区分普通用户和管理员角色
- 📊 **用户统计** - 登录记录、操作日志、使用统计

### 管理后台
- 📊 **数据可视化** - 纯CSS实现的图表（用户活跃度、分类分布、趋势）
- 👥 **用户管理** - 批量操作、密码重置、账号锁定
- 🔐 **密钥管理** - 查看所有用户密钥、统计信息
- 📝 **注册管理** - 开关注册、邀请码系统
- 🔧 **系统管理** - 系统信息、数据备份、安全配置
- 📋 **日志审计** - 操作日志、登录日志、筛选导出
- 📧 **邮件管理** - SMTP配置、邮件模板管理

### 高级功能
- 📧 **邮件通知** - 欢迎邮件、密码重置、登录异常提醒
- 📝 **邮件模板** - 可视化编辑、变量替换、HTML支持
- 🔑 **API密钥** - 用于第三方集成的API密钥管理
- 🎨 **主题定制** - 8种预设主题 + 自定义颜色
- 📦 **模板库** - 常用服务预设模板快速添加
- 📊 **数据迁移** - 完整的导出/导入功能，支持跨服务器迁移
- 🔒 **安全增强** - 登录失败锁定、会话超时、密码策略

## 🚀 快速开始

### Docker 部署（推荐 - 单容器版本）

```bash
# 1. 克隆仓库
git clone https://github.com/wjn6/2fa.git
cd 2fa

# 2. 启动服务（只需一个容器）
docker-compose up -d

# 3. 访问应用
# 地址: http://localhost:5656
# 默认账号: admin / admin123

# 4. 查看日志
docker logs 2fa-app

# 5. 停止服务
docker-compose down
```

**优势**：
- ✅ 单容器架构，无需配置网络
- ✅ 自动启动，开箱即用
- ✅ 数据持久化到 ./data 目录

**⚠️ 首次登录后请立即修改密码！**

### 常用命令

```bash
# 查看日志
docker-compose logs -f

# 停止服务
docker-compose stop

# 重启服务
docker-compose restart

# 删除容器（保留数据）
docker-compose down
```

### 环境变量（可选）

生产环境建议修改 JWT 密钥：

```bash
# 创建 .env 文件
cat > .env << 'EOF'
JWT_SECRET=your-super-secret-random-string-here
PORT=5555
EOF

# 生成随机密钥
openssl rand -base64 32
```

## 📊 端口配置

| 服务 | 端口 | 说明 |
|------|------|------|
| 前端 | 5656 | Web 界面 |
| 后端 | 5555 | API 接口 |

修改端口：编辑 `docker-compose.yml` 中的 `ports` 配置

## 💾 数据备份

```bash
# 备份数据库
docker exec 2fa-backend sh -c "cat /app/data/2fa.db" > backup.db

# 或通过管理后台
# 管理后台 → 系统管理 → 数据迁移 → 导出完整数据
```

## 🔧 故障排查

```bash
# 查看日志
docker-compose logs -f

# 检查容器状态
docker-compose ps

# 重启服务
docker-compose restart

# 测试后端 API
curl http://localhost:5555/api/health
```

### 手动部署

#### 后端部署
```bash
cd backend
npm install
npm start
```

#### 前端部署（已编译）
```bash
# 方式1: 使用 nginx 部署 dist 目录
cd frontend/dist
# 将文件部署到你的 nginx 服务器

# 方式2: 使用 Docker
cd frontend
docker build -t 2fa-frontend .
docker run -p 5656:80 2fa-frontend
```

## 📁 项目结构

```
2fa/
├── backend/              # 后端源码
│   ├── src/
│   │   ├── controllers/  # 控制器
│   │   ├── services/     # 服务层（邮件等）
│   │   ├── middleware/   # 中间件
│   │   ├── routes/       # 路由
│   │   ├── utils/        # 工具函数
│   │   ├── app.js        # 应用入口
│   │   └── database.js   # 数据库初始化
│   ├── package.json
│   └── Dockerfile
├── frontend/             # 前端编译产物
│   ├── dist/             # 编译后的静态文件
│   ├── nginx.conf        # Nginx配置
│   └── Dockerfile
├── docker-compose.yml    # Docker编排文件
└── README.md
```

## ⚙️ 配置说明

### 环境变量

#### 后端环境变量 (.env)
```bash
PORT=5555                    # 服务端口
JWT_SECRET=your-secret-key   # JWT密钥
DATABASE_PATH=./data/2fa.db  # 数据库路径
```

#### 前端环境变量
```bash
VITE_API_URL=http://localhost:5555/api  # API地址
```

### 邮件配置

登录管理后台后，访问"邮件管理"进行配置：

1. **SMTP配置**
   - SMTP服务器地址
   - 端口（默认587）
   - SSL设置
   - 用户名/密码
   - 发件人名称

2. **常用邮箱配置**
   - Gmail: smtp.gmail.com:587
   - QQ邮箱: smtp.qq.com:587
   - 163邮箱: smtp.163.com:25
   - Outlook: smtp-mail.outlook.com:587

### 数据库

- 使用 SQLite 数据库
- 首次启动自动创建表结构
- 数据文件位置：`backend/data/2fa.db`
- 支持完整的导出/导入迁移

## 🔐 默认账号

- **管理员账号**: admin
- **默认密码**: admin123
- **首次登录后请立即修改密码！**

## 📧 邮件功能说明

### 支持的邮件类型
1. **欢迎邮件** - 用户注册后自动发送
2. **密码重置** - 管理员重置密码时发送
3. **登录异常** - 检测异常登录时提醒
4. **系统通知** - 自定义系统通知

### 邮件模板
- 支持HTML格式
- 变量替换（{{username}}, {{email}}等）
- 可视化编辑和预览
- 启用/禁用控制

## 🎨 主题定制

系统提供8种预设主题：
- 默认蓝 / 科技紫 / 商务灰
- 活力橙 / 自然绿 / 优雅粉
- 经典红 / 深邃蓝

支持自定义：
- 主色调
- 圆角大小
- 实时预览

## 📊 数据迁移

### 导出数据
```
管理后台 → 系统管理 → 数据迁移 → 导出完整数据
```
- 导出所有用户、密钥、配置
- JSON格式，可编辑
- 包含完整的数据库结构

### 导入数据
```
管理后台 → 系统管理 → 数据迁移 → 导入数据
```
- 合并模式：保留现有数据，添加新数据
- 替换模式：清空后导入（保留admin用户）

## 🔑 API密钥

支持创建API密钥用于第三方集成：
- 读取/写入权限控制
- 设置过期时间
- 使用统计
- 最后使用时间追踪

## 🛠️ 开发说明

### 技术栈
- **前端**: Vue 3 + Vite + TDesign + Pinia
- **后端**: Node.js + Express + SQLite
- **认证**: JWT
- **邮件**: Nodemailer

### 本地开发
```bash
# 后端（端口5555）
cd backend
npm install
npm run dev

# 前端（端口5555，代理到后端）
cd frontend
npm install
npm run dev
```

### 编译前端
```bash
cd frontend
npm run build
# 产物在 dist/ 目录
```

## 📝 更新日志

### v2.9 (最新)
- ✅ 邮件通知系统（SMTP配置）
- ✅ 邮件模板管理（可视化编辑）
- ✅ 完整的数据导出/导入
- ✅ API密钥管理
- ✅ 主题定制系统
- ✅ 纯CSS数据可视化

### v2.8
- ✅ 着陆页设计
- ✅ 日志审计增强
- ✅ 密钥模板库
- ✅ 用户体验优化

### v2.7
- ✅ 多用户支持
- ✅ 管理员后台
- ✅ 批量操作
- ✅ 登录日志

## 🔒 安全建议

1. **生产环境部署**
   - 修改默认管理员密码
   - 使用强JWT密钥
   - 启用HTTPS
   - 配置防火墙规则
   - 定期备份数据库

2. **邮件安全**
   - 使用应用专用密码
   - 启用SSL/TLS
   - 限制发送频率

3. **访问控制**
   - 设置登录失败锁定
   - 配置会话超时
   - 启用邀请码注册

## 📞 支持

如有问题，请查看：
- 系统设置 → 帮助文档
- 操作日志 → 错误排查
- Docker日志：`docker-compose logs -f`

## 📄 许可证

MIT License

---

**享受安全便捷的双因素认证管理体验！** 🎉

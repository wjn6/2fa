# 🤖 AI 项目交接文档

**项目名称**: 2FA Notebook v3.0  
**项目类型**: 双因素认证管理系统  
**架构**: 单容器（前端+后端一体）  
**状态**: ✅ 生产就绪，功能完整

---

## 📋 项目概述

这是一个功能完整的双因素认证（2FA/TOTP）管理系统，支持多用户、管理后台、邮件通知等企业级功能。

### 核心价值
- 管理所有2FA密钥（Google Authenticator、Microsoft Authenticator等）
- 生成实时TOTP验证码（6位数字，30秒刷新）
- 支持多用户独立账号，数据完全隔离
- 完善的管理后台（用户管理、系统设置、日志审计）
- Docker一键部署，零配置运行

---

## 🏗️ 技术架构

### 整体架构
```
单Docker容器 (2fa-app)
├── Nginx :80 (Web服务器)
│   ├── 静态文件: /usr/share/nginx/html (Vue编译后)
│   └── API代理: /api/* → http://127.0.0.1:3000
└── Node.js :3000 (后端服务，仅容器内部访问)
    └── SQLite (data/database.db)
```

### 技术栈
| 层级 | 技术 | 版本 | 说明 |
|------|------|------|------|
| **前端** | Vue 3 | 3.3+ | Composition API |
| **UI库** | TDesign | 1.6+ | 腾讯开源UI组件库 |
| **构建** | Vite | 4.5+ | 快速构建工具 |
| **后端** | Node.js | 18 | LTS版本 |
| **框架** | Express | 4.18 | Web框架 |
| **数据库** | SQLite | 3 | 文件数据库 |
| **认证** | JWT | 9.0 | Token认证 |
| **加密** | bcryptjs | 2.4 | 密码加密 |
| **2FA** | speakeasy | 2.0 | TOTP算法 |
| **容器** | Docker | 最新 | Alpine Linux基础镜像 |

### 端口配置
- **宿主机**: 5656 (对外访问)
- **容器内 Nginx**: 80
- **容器内 Node.js**: 3000 (仅127.0.0.1，不对外)

---

## 📁 项目目录结构

```
2fa/
├── README.md                    # 项目说明文档（唯一文档）
├── docker-compose.yml          # Docker编排文件
├── Dockerfile                  # 单容器构建文件
├── nginx.conf                  # Nginx配置（反向代理）
├── start.sh                    # 容器启动脚本
│
├── backend/                    # 后端源码
│   ├── package.json           # 依赖配置
│   ├── src/
│   │   ├── app.js            # 主程序入口
│   │   ├── database.js       # 数据库初始化
│   │   ├── controllers/      # 控制器（13个）
│   │   │   ├── userController.js      # 用户相关
│   │   │   ├── adminController.js     # 管理员相关
│   │   │   ├── secretController.js    # 密钥管理
│   │   │   ├── categoryController.js  # 分类管理
│   │   │   ├── tagController.js       # 标签管理
│   │   │   ├── authController.js      # 认证相关
│   │   │   ├── backupController.js    # 备份相关
│   │   │   ├── systemController.js    # 系统设置
│   │   │   ├── qrcodeController.js    # 二维码扫描
│   │   │   ├── exportController.js    # 数据导出
│   │   │   ├── templateController.js  # 模板库
│   │   │   ├── apiKeyController.js    # API密钥
│   │   │   └── emailController.js     # 邮件管理
│   │   ├── middleware/       # 中间件
│   │   │   ├── auth.js       # 认证中间件
│   │   │   └── authMiddleware.js
│   │   ├── routes/
│   │   │   └── index.js      # 路由配置（所有API接口）
│   │   ├── services/
│   │   │   └── emailService.js  # 邮件发送服务
│   │   └── utils/            # 工具函数
│   └── data/                 # 数据目录（挂载到宿主机）
│       └── database.db       # SQLite数据库文件
│
└── frontend/                 # 前端源码
    ├── package.json         # 依赖配置
    ├── vite.config.js       # Vite配置
    ├── dist/                # 编译后的文件（已包含在Git）
    │   ├── index.html
    │   └── assets/          # JS/CSS文件
    └── src/
        ├── main.js          # 入口文件
        ├── App.vue          # 根组件
        ├── router/
        │   └── index.js     # 路由配置
        ├── stores/
        │   └── app.js       # Pinia状态管理
        ├── api/
        │   └── index.js     # API封装（所有前端API调用）
        ├── views/           # 页面组件
        │   ├── Home.vue              # 首页（密钥列表）
        │   ├── Login.vue             # 登录页
        │   ├── Register.vue          # 注册页
        │   ├── Profile.vue           # 个人中心（新增）
        │   ├── Settings.vue          # 设置页
        │   ├── ApiKeys.vue           # API密钥管理
        │   ├── ThemeCustom.vue       # 主题定制
        │   ├── Admin.vue             # 管理后台框架
        │   └── admin/                # 管理后台子页面
        │       ├── Dashboard.vue     # 仪表盘
        │       ├── Users.vue         # 用户管理
        │       ├── Secrets.vue       # 密钥管理
        │       ├── Registration.vue  # 注册管理
        │       ├── System.vue        # 系统管理
        │       ├── Logs.vue          # 日志审计
        │       └── Settings.vue      # 系统设置
        └── composables/     # 组合式函数
```

---

## 💾 数据库设计

### 18张表结构

#### 核心业务表
1. **users** - 用户表
   - id, username, password(bcrypt), email, role(admin/user)
   - is_active, login_count, failed_login_count, locked_until
   - last_login, last_ip, created_at

2. **secrets** - 密钥表
   - id, user_id, name, secret_key(加密), issuer, algorithm
   - digits, period, is_favorite, is_pinned
   - created_at, updated_at

3. **categories** - 分类表
   - id, user_id, name, icon, color, sort_order

4. **tags** - 标签表
   - id, user_id, name, color

5. **secret_tags** - 密钥标签关联表

#### 系统管理表
6. **system_settings** - 系统配置
   - key-value 键值对存储
   - 包含：注册开关、邀请码、安全设置、邮件配置

7. **invite_codes** - 邀请码
8. **invite_code_usage** - 邀请码使用记录
9. **sessions** - 会话表
10. **master_password** - 主密码

#### 日志表
11. **login_logs** - 登录日志
    - user_id, username, login_type, status(success/failed)
    - ip_address, user_agent, failure_reason

12. **operation_logs** - 操作日志
    - user_id, username, operation, table_name, record_id
    - details, ip_address, user_agent

13. **usage_logs** - 使用日志
14. **system_metrics** - 系统指标

#### 高级功能表
15. **backup_records** - 备份记录
16. **backup_history** - 备份历史
17. **email_templates** - 邮件模板
18. **api_keys** - API密钥

---

## 🔑 核心功能模块

### 1. 用户系统
- **注册/登录**: JWT Token认证
- **个人中心**: 查看信息、修改邮箱、修改密码、统计数据
- **权限控制**: 普通用户/管理员
- **安全机制**: 登录失败锁定（5次/30分钟）

### 2. 密钥管理（TOTP）
- **增删改查**: 完整的CRUD操作
- **实时验证码**: 每30秒刷新的6位数字
- **二维码扫描**: 扫描QR Code添加密钥
- **分类标签**: 灵活组织密钥
- **模板库**: 常用服务快速添加
- **搜索筛选**: 按名称、分类、标签搜索
- **批量操作**: 导入/导出

### 3. 管理后台
- **仪表盘**: 数据可视化（用户、密钥、登录统计）
- **用户管理**: CRUD、批量启用/禁用、重置密码
- **密钥管理**: 查看所有用户密钥、统计信息
- **注册管理**: 开关注册、邀请码生成
- **系统管理**: 配置、备份、维护、数据导入导出
- **日志审计**: 操作日志、登录日志
- **邮件管理**: SMTP配置、邮件模板

### 4. 高级功能
- **API密钥**: 生成API密钥用于第三方集成
- **主题定制**: 8种预设主题 + 自定义颜色
- **邮件通知**: 欢迎邮件、密码重置、异常提醒
- **数据迁移**: 完整导出/导入功能

---

## 🔌 API接口概览

### 公开接口（无需登录）
```
POST /api/users/register        # 用户注册
POST /api/users/login           # 用户登录
POST /api/auth/login            # 管理员登录
GET  /api/health                # 健康检查
```

### 用户接口（需要登录）
```
GET    /api/users/me            # 获取当前用户信息
PUT    /api/users/me            # 更新用户信息
POST   /api/users/change-password  # 修改密码

GET    /api/secrets             # 获取密钥列表
POST   /api/secrets             # 添加密钥
PUT    /api/secrets/:id         # 更新密钥
DELETE /api/secrets/:id         # 删除密钥
POST   /api/secrets/scan-qrcode # 扫描二维码

GET    /api/categories          # 获取分类
POST   /api/categories          # 添加分类
PUT    /api/categories/:id      # 更新分类
DELETE /api/categories/:id      # 删除分类

GET    /api/tags                # 获取标签
POST   /api/tags                # 添加标签

GET    /api/backup              # 获取备份
POST   /api/backup              # 创建备份
POST   /api/backup/restore      # 恢复备份

GET    /api/api-keys            # 获取API密钥
POST   /api/api-keys            # 创建API密钥
```

### 管理员接口（需要admin权限）
```
# 用户管理
GET    /api/admin/users         # 获取所有用户
POST   /api/admin/users         # 创建用户
PUT    /api/admin/users/:id     # 更新用户
DELETE /api/admin/users/:id     # 删除用户
POST   /api/admin/users/batch-status      # 批量启用/禁用
POST   /api/admin/users/:id/reset-password # 重置密码

# 密钥管理
GET    /api/admin/secrets       # 查看所有用户密钥
GET    /api/admin/secrets/statistics  # 密钥统计

# 系统配置
GET    /api/admin/system/settings  # 获取系统配置
PUT    /api/admin/system/settings  # 更新系统配置
GET    /api/admin/system/info      # 系统信息

# 邀请码
GET    /api/admin/invites        # 获取邀请码
POST   /api/admin/invites        # 生成邀请码

# 日志
GET    /api/admin/logs/operation # 操作日志
GET    /api/admin/logs/login     # 登录日志

# 备份
GET    /api/admin/backups        # 获取备份列表
POST   /api/admin/backups        # 创建备份

# 数据导出
GET    /api/admin/export/all     # 导出所有数据
POST   /api/admin/import/all     # 导入数据

# 邮件
GET    /api/admin/email/config   # 邮件配置
PUT    /api/admin/email/config   # 更新邮件配置
GET    /api/admin/email/templates # 邮件模板
```

---

## 🚀 部署和运行

### 快速部署（Docker）
```bash
# 1. 克隆代码
git clone https://github.com/wjn6/2fa.git
cd 2fa

# 2. 启动服务（自动构建）
docker-compose up -d

# 3. 访问
http://localhost:5656
用户名: admin
密码: admin123
```

### 本地开发
```bash
# 后端
cd backend
npm install
npm run dev  # http://localhost:5555

# 前端（另一个终端）
cd frontend
npm install
npm run dev  # http://localhost:5656
```

### 前端构建
```bash
cd frontend
npm run build  # 输出到 dist/

# 复制到成品目录
xcopy /E /I /Y frontend\dist 2fa\frontend\dist
```

---

## 🔧 常见操作

### 修改功能
1. **前端**: 修改 `frontend/src/views/` 下的Vue文件
2. **后端API**: 修改 `backend/src/controllers/` 下的控制器
3. **路由**: 修改 `backend/src/routes/index.js`
4. **数据库**: 修改 `backend/src/database.js`

### 添加新功能
1. 后端：创建新控制器 → 添加路由 → 测试API
2. 前端：创建新页面 → 添加路由 → 调用API
3. 编译前端 → 复制到2fa目录 → 提交Git

### 数据库修改
```javascript
// backend/src/database.js
// 添加新表
db.exec(`
  CREATE TABLE IF NOT EXISTS new_table (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ...
  )
`);

// 重启后端即可生效
```

### 查看日志
```bash
# 容器日志
docker logs 2fa-app

# 实时日志
docker logs -f 2fa-app

# 最近50行
docker logs 2fa-app --tail 50
```

### 数据库操作
```bash
# 进入容器
docker exec -it 2fa-app sh

# 查看数据库
cd /app/backend/data
sqlite3 database.db

# SQL查询
SELECT * FROM users;
.exit
```

---

## 🐛 常见问题

### 1. 登录提示"服务器错误"
- 查看后端日志：`docker logs 2fa-app`
- 检查数据库表是否完整
- 重启容器：`docker-compose restart`

### 2. 修改前端不生效
- 需要重新编译：`cd frontend && npm run build`
- 复制到成品目录：`xcopy /E /I /Y frontend\dist 2fa\frontend\dist`
- 提交并推送Git

### 3. Docker构建失败
- 网络问题：使用淘宝npm镜像（Dockerfile已配置）
- 清理缓存：`docker builder prune -a`
- 重新构建：`docker-compose build --no-cache`

### 4. 端口冲突
- 修改 `docker-compose.yml` 中的端口映射
- 默认是 `5656:80`

---

## 📝 重要文件说明

### 关键配置文件
1. **docker-compose.yml** - Docker编排配置
   - 端口映射：5656:80
   - 数据卷：./data:/app/backend/data

2. **Dockerfile** - 容器构建
   - 多阶段构建（builder + runtime）
   - 使用淘宝npm镜像源

3. **nginx.conf** - Web服务器配置
   - 静态文件服务：/
   - API反向代理：/api/*

4. **start.sh** - 容器启动脚本
   - 启动Node.js后端
   - 启动Nginx

### 核心代码文件
1. **backend/src/app.js** - 后端入口
   - Express配置
   - 中间件加载
   - 路由挂载
   - 监听端口3000

2. **backend/src/database.js** - 数据库初始化
   - 创建18张表
   - 插入默认管理员
   - 初始化系统配置

3. **frontend/src/main.js** - 前端入口
   - Vue应用初始化
   - TDesign组件库
   - 路由和状态管理

4. **frontend/src/api/index.js** - API封装
   - Axios配置
   - 请求/响应拦截器
   - 所有API方法定义

---

## ⚠️ 注意事项

### 安全相关
1. **首次部署后立即修改默认密码**（admin/admin123）
2. 生产环境修改JWT_SECRET和SESSION_SECRET
3. 启用HTTPS（需要配置Nginx SSL证书）
4. 定期备份数据库文件

### 开发相关
1. 前端修改后必须重新编译才能生效
2. 后端修改后重启容器即可
3. 数据库修改需要删除旧数据库重新初始化
4. Git推送前确保编译好的dist文件夹已更新

### 部署相关
1. 数据存储在 `./data` 目录，需要定期备份
2. 容器重启数据不会丢失
3. 升级前先备份数据
4. Docker镜像大小约200MB

---

## 📊 项目统计

- **代码量**: 约16,000行
- **前端组件**: 16个页面
- **后端API**: 85+个接口
- **数据库表**: 18张
- **控制器**: 13个
- **Docker镜像**: ~200MB
- **内存占用**: ~150MB
- **启动时间**: ~10秒

---

## 🎯 快速定位代码

### 需要修改用户登录逻辑
→ `backend/src/controllers/userController.js` → `login` 函数

### 需要添加新的管理员功能
→ `backend/src/controllers/adminController.js` → 添加新函数  
→ `backend/src/routes/index.js` → 添加路由

### 需要修改首页密钥列表
→ `frontend/src/views/Home.vue`

### 需要修改管理后台
→ `frontend/src/views/admin/` 目录下的对应页面

### 需要修改数据库表结构
→ `backend/src/database.js` → 找到对应的CREATE TABLE语句

### 需要添加新的API接口
1. 后端：`backend/src/controllers/` 添加控制器方法
2. 路由：`backend/src/routes/index.js` 添加路由
3. 前端：`frontend/src/api/index.js` 添加API调用方法

---

## 🔄 Git工作流程

```bash
# 1. 修改代码
# 2. 编译前端（如果修改了前端）
cd frontend && npm run build && cd ..

# 3. 复制到成品目录
xcopy /E /I /Y frontend\dist 2fa\frontend\dist

# 4. 提交代码
cd 2fa
git add .
git commit -m "描述修改内容"
git push

# 5. 服务器更新
ssh root@server
cd ~/2fa
git pull
docker-compose restart
```

---

## 💡 开发建议

1. **前端开发**: 使用 `npm run dev` 热重载，修改立即生效
2. **后端开发**: 使用 `nodemon` 自动重启
3. **API测试**: 使用 Postman 或 curl 测试API
4. **数据库查看**: 使用 SQLite Browser 或进入容器使用sqlite3命令
5. **日志调试**: `console.log` 会输出到 `docker logs`

---

## 📞 联系和支持

- **GitHub**: https://github.com/wjn6/2fa
- **文档**: 查看 README.md

---

**🎉 祝使用愉快！有问题随时查看此文档。**

**最后更新**: 2025-10-23  
**版本**: v3.1  
**状态**: ✅ 生产就绪


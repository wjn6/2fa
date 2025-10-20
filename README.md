# 2FA 笔记本 - 企业级版本 v2.0

一个功能完善的双因素认证（2FA）管理系统，支持密钥管理、自动生成TOTP验证码、分类管理、标签系统、搜索、导入导出、主密码保护、后台管理等企业级功能。

## ✨ 功能特性

### 🔐 核心功能
- **密钥管理**：安全保存和管理 2FA 密钥
- **自动生成验证码**：实时生成 TOTP 验证码，30秒自动刷新
- **主密码保护**：设置主密码保护所有密钥，支持自动锁定
- **分类管理**：创建分类对密钥进行分组管理
- **标签系统**：支持为密钥添加多个标签，更灵活的组织方式
- **收藏和置顶**：标记常用密钥，快速访问
- **拖拽排序**：自定义密钥显示顺序
- **搜索功能**：快速搜索密钥名称、发行者或备注
- **备注功能**：为每个密钥添加自定义备注信息

### 📸 二维码功能
- **扫描二维码**：支持扫描和上传二维码图片
- **解析 otpauth URL**：自动解析密钥信息
- **生成二维码**：为密钥生成二维码，方便分享和备份

### 💾 备份与导入
- **导出数据**：JSON 格式导出所有数据
- **加密备份**：支持密码加密的安全备份
- **自动备份**：定时自动备份功能
- **多格式导入**：支持 Google Authenticator 等格式
- **合并/替换模式**：灵活的数据导入策略

### 🎨 用户体验
- **暗黑模式**：支持浅色/深色/跟随系统
- **多语言**：支持中文/英文（i18n）
- **快捷键**：Ctrl+K 搜索、Ctrl+N 新建、Ctrl+L 锁定等
- **批量操作**：批量删除、批量移动分类
- **密钥图标**：自动识别常见服务图标和颜色
- **响应式设计**：完美适配桌面和移动设备

### 📊 统计和分析
- **使用统计**：记录密钥使用频率和时间
- **密钥健康度检查**：检测重复密钥、长期未使用密钥
- **使用日志**：详细的操作日志记录
- **可视化图表**：使用趋势和分类统计图表

### 🔧 后台管理
- **用户管理**：多用户支持，角色权限控制
- **系统设置**：全局配置管理
- **仪表盘**：系统统计和数据可视化
- **数据维护**：日志清理、数据库优化

### 🚀 PWA 支持
- **离线访问**：支持离线使用
- **添加到主屏幕**：像原生应用一样使用
- **自动更新**：后台自动更新

## 🛠️ 技术栈

### 后端
- **Node.js** - 运行环境
- **Express** - Web 框架
- **SQLite** (better-sqlite3) - 数据库
- **Speakeasy** - TOTP 生成
- **Crypto-JS** - 加密库
- **JWT** - 身份认证
- **Bcrypt** - 密码哈希
- **Canvas & jsQR** - 二维码处理
- **Helmet** - 安全防护
- **Rate Limit** - 请求限流

### 前端
- **Vue 3** - 前端框架
- **TDesign Vue Next** - UI 组件库
- **Vite** - 构建工具
- **Pinia** - 状态管理
- **Vue Router** - 路由管理
- **Vue I18n** - 国际化
- **Axios** - HTTP 客户端
- **SortableJS** - 拖拽排序
- **Chart.js** - 数据可视化
- **Vite PWA** - PWA 支持

### 部署
- **Docker** - 容器化
- **Docker Compose** - 编排工具
- **Nginx** - Web 服务器

## 🚀 快速开始

### 使用 Docker Compose（推荐）

1. **克隆项目**
```bash
git clone <repository-url>
cd 2fa
```

2. **启动服务**
```bash
docker-compose up -d
```

3. **访问应用**
- 主应用：`http://localhost:5555`
- 后台管理：`http://localhost:5555/admin`

4. **默认账号**
- 管理员用户名：`admin`
- 管理员密码：`admin123`
- ⚠️ **首次使用请立即修改默认密码！**

### 本地开发

#### 后端开发

```bash
cd backend
npm install
npm run dev
```

后端服务将运行在 `http://localhost:3000`

#### 前端开发

```bash
cd frontend
npm install
npm run dev
```

前端服务将运行在 `http://localhost:5173`

## 📖 使用指南

### 首次使用

1. 访问应用后会提示设置主密码
2. 设置一个强主密码（至少6位）
3. 可选添加密码提示
4. 设置完成后自动解锁

### 添加密钥

1. 点击右上角 **"添加密钥"** 按钮
2. 填写密钥信息：
   - **名称**：必填（如 "GitHub"）
   - **密钥**：必填（Base32 格式的密钥）
   - **发行者**：可选（如 "github.com"）
   - **分类**：可选
   - **标签**：可选（可多选）
   - **备注**：可选
3. 也可以点击**"扫描二维码"**直接导入

### 管理分类和标签

- **分类**：在左侧边栏管理，适合大的分组
- **标签**：可为一个密钥添加多个标签，更灵活

### 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl/Cmd + K` | 打开搜索 |
| `Ctrl/Cmd + N` | 添加新密钥 |
| `Ctrl/Cmd + L` | 锁定应用 |
| `Ctrl/Cmd + 1-9` | 快速复制第N个验证码 |
| `Esc` | 关闭对话框 |

### 备份数据

1. 点击右上角菜单 → **"导出数据"**
2. 选择是否加密备份
3. 如果加密，设置备份密码
4. 下载 JSON 文件妥善保管

### 导入数据

1. 点击右上角菜单 → **"导入数据"**
2. 选择导入模式：
   - **合并模式**：保留现有数据，追加新数据
   - **替换模式**：清空现有数据，导入新数据
3. 选择备份文件
4. 如果是加密备份，输入密码

### 后台管理

1. 访问 `http://localhost:5555/admin`
2. 使用管理员账号登录
3. 功能包括：
   - 用户管理
   - 系统设置
   - 统计仪表盘
   - 使用日志
   - 系统维护

## 📂 项目结构

```
2fa/
├── backend/                    # 后端服务
│   ├── src/
│   │   ├── controllers/       # 控制器
│   │   │   ├── authController.js
│   │   │   ├── secretController.js
│   │   │   ├── categoryController.js
│   │   │   ├── tagController.js
│   │   │   ├── backupController.js
│   │   │   ├── qrcodeController.js
│   │   │   └── adminController.js
│   │   ├── routes/            # 路由
│   │   ├── middleware/        # 中间件
│   │   ├── utils/             # 工具函数
│   │   ├── database.js        # 数据库配置
│   │   └── app.js             # 应用入口
│   ├── data/                  # 数据库文件（运行时生成）
│   ├── package.json
│   └── Dockerfile
├── frontend/                   # 前端应用
│   ├── src/
│   │   ├── api/               # API 接口
│   │   ├── views/             # 页面组件
│   │   ├── stores/            # Pinia 状态管理
│   │   ├── composables/       # 组合式函数
│   │   ├── i18n/              # 国际化
│   │   ├── styles/            # 样式文件
│   │   ├── utils/             # 工具函数
│   │   ├── router/            # 路由配置
│   │   ├── App.vue
│   │   └── main.js
│   ├── public/                # 静态资源
│   ├── index.html
│   ├── vite.config.js
│   ├── nginx.conf
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml          # Docker Compose 配置
├── .gitignore
├── .dockerignore
└── README.md
```

## 🔌 API 文档

### 认证相关
- `POST /api/auth/login` - 管理员登录
- `GET /api/auth/check-master-password` - 检查主密码
- `POST /api/auth/set-master-password` - 设置主密码
- `POST /api/auth/unlock` - 解锁
- `POST /api/auth/lock` - 锁定
- `POST /api/auth/change-master-password` - 修改主密码

### 分类管理
- `GET /api/categories` - 获取所有分类
- `POST /api/categories` - 创建分类
- `PUT /api/categories/:id` - 更新分类
- `DELETE /api/categories/:id` - 删除分类

### 标签管理
- `GET /api/tags` - 获取所有标签
- `POST /api/tags` - 创建标签
- `PUT /api/tags/:id` - 更新标签
- `DELETE /api/tags/:id` - 删除标签

### 密钥管理
- `GET /api/secrets` - 获取所有密钥
- `GET /api/secrets/:id` - 获取密钥详情
- `POST /api/secrets` - 创建密钥
- `PUT /api/secrets/:id` - 更新密钥
- `DELETE /api/secrets/:id` - 删除密钥
- `POST /api/secrets/batch-delete` - 批量删除
- `POST /api/secrets/batch-update-category` - 批量更新分类
- `POST /api/secrets/update-sort` - 更新排序
- `POST /api/secrets/:id/toggle-favorite` - 切换收藏
- `POST /api/secrets/:id/toggle-pin` - 切换置顶

### Token 生成
- `GET /api/secrets/:id/token` - 生成单个验证码
- `GET /api/tokens` - 生成所有验证码

### 二维码
- `POST /api/qrcode/upload` - 上传并解析二维码
- `POST /api/qrcode/generate` - 生成二维码
- `POST /api/qrcode/parse-url` - 解析 otpauth URL

### 备份恢复
- `GET /api/backup/export` - 导出数据
- `POST /api/backup/export-encrypted` - 加密导出
- `POST /api/backup/import` - 导入数据
- `GET /api/backup/history` - 备份历史
- `POST /api/backup/auto` - 自动备份

### 管理员 API（需要认证）
- `GET /api/admin/users` - 用户列表
- `POST /api/admin/users` - 创建用户
- `PUT /api/admin/users/:id` - 更新用户
- `DELETE /api/admin/users/:id` - 删除用户
- `GET /api/admin/settings` - 系统设置
- `PUT /api/admin/settings` - 更新设置
- `GET /api/admin/statistics` - 统计信息
- `GET /api/admin/usage-logs` - 使用日志

## ⚙️ 环境变量

在生产环境使用前，请配置以下环境变量：

```bash
# 后端环境变量
PORT=3000
NODE_ENV=production
DB_PATH=/app/data/2fa.db
JWT_SECRET=your-very-secret-jwt-key-change-in-production
CORS_ORIGIN=*
AUTO_BACKUP_ENABLED=true
AUTO_BACKUP_INTERVAL_HOURS=24
```

## 🔒 安全建议

1. **修改默认密码**：首次登录后立即修改管理员密码
2. **设置强主密码**：使用复杂的主密码保护密钥
3. **启用HTTPS**：生产环境务必配置 HTTPS
4. **定期备份**：启用自动备份并定期导出加密备份
5. **访问控制**：仅在可信网络中使用
6. **更新JWT密钥**：修改 `JWT_SECRET` 环境变量
7. **日志审计**：定期查看使用日志

## 📊 数据库Schema

系统使用 SQLite 数据库，主要表结构：

- `users` - 用户表
- `master_password` - 主密码表
- `categories` - 分类表
- `tags` - 标签表
- `secrets` - 密钥表
- `secret_tags` - 密钥-标签关联表
- `usage_logs` - 使用日志表
- `backup_history` - 备份历史表
- `sessions` - 会话表
- `system_settings` - 系统设置表

## 🐳 Docker 部署

### 构建镜像

```bash
docker-compose build
```

### 启动服务

```bash
docker-compose up -d
```

### 查看日志

```bash
docker-compose logs -f
```

### 停止服务

```bash
docker-compose down
```

### 备份数据

数据库文件位于 `./data/2fa.db`，建议定期备份此目录。

## 🔧 故障排除

### 端口被占用

修改 `docker-compose.yml` 中的端口映射：

```yaml
ports:
  - "8080:80"  # 将5555改为8080或其他端口
```

### 数据库损坏

如果数据库损坏，可以：
1. 从备份恢复
2. 删除 `data/2fa.db` 重新初始化

### 忘记主密码

主密码无法重置！请务必：
- 记住密码
- 使用密码提示
- 定期导出备份

如果忘记，只能清空数据库重新开始。

## 📝 更新日志

### v2.0.0 (2024-01-XX)

**新功能**
- ✅ 主密码保护和自动锁定
- ✅ 标签系统
- ✅ 二维码扫描和生成
- ✅ 批量操作
- ✅ 拖拽排序
- ✅ 暗黑模式
- ✅ 多语言支持（中英文）
- ✅ 快捷键支持
- ✅ 密钥图标自动识别
- ✅ 使用统计和分析
- ✅ 后台管理系统
- ✅ PWA 支持
- ✅ 加密备份
- ✅ 自动备份
- ✅ 移动端优化

**改进**
- 🔧 全新的UI设计
- 🔧 更好的性能
- 🔧 完善的错误处理
- 🔧 详细的日志记录

### v1.0.0

- 🎉 初始版本

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🙏 致谢

- [Speakeasy](https://github.com/speakeasyjs/speakeasy) - TOTP 生成库
- [TDesign](https://tdesign.tencent.com/) - 腾讯 UI 组件库
- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Express](https://expressjs.com/) - Node.js Web 框架
- [SQLite](https://www.sqlite.org/) - 轻量级数据库

## 📞 联系方式

- 问题反馈：[GitHub Issues](your-repo/issues)
- 邮箱：your-email@example.com

---

**⚠️ 安全提示**：本系统用于个人或组织内部使用，请勿将密钥信息暴露在公网环境。请定期备份数据，妥善保管主密码和备份文件。

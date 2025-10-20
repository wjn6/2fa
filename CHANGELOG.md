# 更新日志

所有重要的更改都会记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [2.0.0] - 2024-01-20

### 新增
- 🔐 主密码保护系统
  - PBKDF2密钥派生
  - 密码提示功能
  - 自动锁定功能（可配置超时时间）
  - 会话管理
  
- 🏷️ 标签系统
  - 创建和管理标签
  - 为密钥添加多个标签
  - 按标签筛选密钥
  - 标签颜色自定义

- 📸 二维码功能
  - 扫描二维码导入密钥
  - 上传二维码图片解析
  - 为密钥生成二维码
  - 支持otpauth://协议

- 🎨 用户界面增强
  - 暗黑模式（浅色/深色/自动）
  - 多语言支持（中文/英文）
  - 收藏和置顶功能
  - 拖拽排序
  - 自动识别服务图标
  - 完全响应式设计

- ⌨️ 快捷键支持
  - Ctrl/Cmd + K: 搜索
  - Ctrl/Cmd + N: 新建密钥
  - Ctrl/Cmd + L: 锁定
  - Ctrl/Cmd + 1-9: 快速复制
  - Esc: 关闭对话框

- 📦 批量操作
  - 批量选择密钥
  - 批量删除
  - 批量移动分类
  - 批量导出

- 💾 备份增强
  - 加密备份（密码保护）
  - 自动备份功能
  - 备份历史记录
  - 多格式导入（Google Authenticator等）
  - 合并/替换导入模式

- 📊 统计和分析
  - 使用频率统计
  - 最常使用密钥排行
  - 使用趋势图表
  - 分类统计
  - 密钥健康度检查

- 👨‍💼 后台管理系统
  - 用户管理（多用户支持）
  - 角色权限控制（管理员/普通用户）
  - 系统设置管理
  - 统计仪表盘
  - 使用日志查看
  - 系统维护工具

- 🚀 PWA支持
  - 离线访问
  - 添加到主屏幕
  - 自动更新
  - Service Worker缓存

- 🔒 安全增强
  - JWT认证
  - 会话管理
  - 速率限制
  - Helmet安全头
  - CSRF防护
  - 详细的审计日志

### 改进
- ✨ 全新的UI设计（基于TDesign）
- ⚡ 性能优化
  - 虚拟滚动
  - 按需加载
  - 图片懒加载
- 🎯 更好的搜索体验
  - 实时搜索
  - 模糊匹配
  - 搜索高亮
- 📱 移动端优化
  - 触摸手势支持
  - 移动端专用布局
  - 更大的触摸区域
- 🐛 完善的错误处理
  - 友好的错误提示
  - 自动重试机制
  - 错误日志记录

### 技术栈
- **后端**
  - Node.js 18+
  - Express 4.x
  - SQLite (better-sqlite3)
  - Speakeasy (TOTP)
  - Crypto-JS (加密)
  - JWT (认证)
  - Bcrypt (密码哈希)
  - Canvas & jsQR (二维码)

- **前端**
  - Vue 3
  - TDesign Vue Next
  - Vite 5
  - Pinia (状态管理)
  - Vue Router 4
  - Vue I18n (国际化)
  - Axios
  - SortableJS (拖拽)
  - Chart.js (图表)

- **部署**
  - Docker
  - Docker Compose
  - Nginx

### 数据库变更
- 新增表：
  - `users` - 用户表
  - `master_password` - 主密码表
  - `tags` - 标签表
  - `secret_tags` - 密钥标签关联表
  - `usage_logs` - 使用日志表
  - `backup_history` - 备份历史表
  - `sessions` - 会话表
  - `system_settings` - 系统设置表

- 扩展表字段：
  - `secrets` 表新增：icon, icon_type, is_favorite, is_pinned, sort_order, use_count, last_used_at
  - `categories` 表新增：icon, color, sort_order

### 文档
- 📖 完整的README文档
- 🚀 快速开始指南（QUICKSTART.md）
- 🐳 部署指南（DEPLOYMENT.md）
- 📋 更新日志（CHANGELOG.md）

### 安全提醒
- ⚠️ 默认管理员密码为 admin123，首次使用必须修改
- ⚠️ 生产环境务必修改JWT_SECRET
- ⚠️ 建议在HTTPS环境下使用
- ⚠️ 定期备份数据

## [1.0.0] - 2024-01-01

### 初始版本
- ✅ 基本的密钥管理功能
- ✅ TOTP验证码生成
- ✅ 分类管理
- ✅ 搜索功能
- ✅ 导入导出
- ✅ Docker部署

---

## 版本说明

- **主版本号**：不兼容的API修改
- **次版本号**：向下兼容的功能性新增
- **修订号**：向下兼容的问题修正

## 升级指南

### 从 1.x 升级到 2.0

1. **备份数据**
   ```bash
   cp data/2fa.db data/2fa-backup.db
   ```

2. **拉取新版本**
   ```bash
   git pull origin main
   ```

3. **重新构建**
   ```bash
   docker-compose down
   docker-compose build --no-cache
   docker-compose up -d
   ```

4. **首次设置**
   - 访问应用设置主密码
   - 访问 /admin 修改管理员密码

5. **数据迁移**
   - 数据库会自动迁移
   - 所有现有密钥保持不变

## 已知问题

- 暂无

## 计划中的功能

- [ ] 浏览器插件
- [ ] 移动端原生应用
- [ ] WebAuthn支持
- [ ] 两步验证备份码
- [ ] 密钥共享功能
- [ ] 团队协作功能

## 贡献者

感谢所有为此项目做出贡献的人！

---

更多信息请访问 [GitHub](your-repo-url)



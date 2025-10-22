const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

// 数据库文件路径
const dbPath = process.env.DB_PATH || path.join(__dirname, '../data/2fa.db');
const db = new Database(dbPath);

// 启用外键约束
db.pragma('foreign_keys = ON');

// 初始化数据库表（完整版 - 无需迁移）
function initDatabase() {
  console.log('初始化数据库...');

  // 1. 创建用户表（完整版：包含多用户支持字段）
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      email TEXT,
      role TEXT DEFAULT 'user',
      is_active INTEGER DEFAULT 1,
      invite_code TEXT,
      last_ip TEXT,
      login_count INTEGER DEFAULT 0,
      failed_login_count INTEGER DEFAULT 0,
      locked_until DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    )
  `);

  // 2. 创建分类表（完整版：包含user_id）
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      color TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 3. 创建标签表（完整版：包含user_id）
  db.exec(`
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT NOT NULL,
      color TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 4. 创建密钥表（完整版：包含user_id）
  db.exec(`
    CREATE TABLE IF NOT EXISTS secrets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL DEFAULT 1,
      name TEXT NOT NULL,
      secret_key TEXT NOT NULL,
      issuer TEXT,
      category_id INTEGER,
      note TEXT,
      icon TEXT,
      icon_type TEXT DEFAULT 'default',
      is_favorite INTEGER DEFAULT 0,
      is_pinned INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      use_count INTEGER DEFAULT 0,
      last_used_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    )
  `);

  // 5. 创建密钥-标签关联表
  db.exec(`
    CREATE TABLE IF NOT EXISTS secret_tags (
      secret_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (secret_id, tag_id),
      FOREIGN KEY (secret_id) REFERENCES secrets(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    )
  `);

  // 6. 创建使用记录表（完整版：包含user_id）
  db.exec(`
    CREATE TABLE IF NOT EXISTS usage_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      secret_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (secret_id) REFERENCES secrets(id) ON DELETE CASCADE
    )
  `);

  // 7. 创建邀请码表
  db.exec(`
    CREATE TABLE IF NOT EXISTS invite_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      max_uses INTEGER DEFAULT 1,
      used_count INTEGER DEFAULT 0,
      expires_at DATETIME,
      created_by INTEGER,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // 8. 创建邀请码使用记录表
  db.exec(`
    CREATE TABLE IF NOT EXISTS invite_code_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invite_code_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (invite_code_id) REFERENCES invite_codes(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 9. 创建操作日志表
  db.exec(`
    CREATE TABLE IF NOT EXISTS operation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      username TEXT,
      action TEXT NOT NULL,
      resource_type TEXT,
      resource_id INTEGER,
      details TEXT,
      ip_address TEXT,
      user_agent TEXT,
      status TEXT DEFAULT 'success',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // 10. 创建登录日志表
  db.exec(`
    CREATE TABLE IF NOT EXISTS login_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      username TEXT NOT NULL,
      login_type TEXT DEFAULT 'password',
      status TEXT DEFAULT 'success',
      ip_address TEXT,
      user_agent TEXT,
      failure_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // 11. 创建系统监控表
  db.exec(`
    CREATE TABLE IF NOT EXISTS system_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      metric_name TEXT NOT NULL,
      metric_value TEXT,
      metric_type TEXT DEFAULT 'gauge',
      recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 12. 创建数据备份记录表
  db.exec(`
    CREATE TABLE IF NOT EXISTS backup_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      file_path TEXT,
      file_size INTEGER,
      backup_type TEXT DEFAULT 'manual',
      is_encrypted INTEGER DEFAULT 0,
      created_by INTEGER,
      status TEXT DEFAULT 'completed',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // 13. 创建会话表
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_token TEXT NOT NULL UNIQUE,
      user_id INTEGER,
      is_unlocked INTEGER DEFAULT 0,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 14. 创建主密码表（兼容旧版本）
  db.exec(`
    CREATE TABLE IF NOT EXISTS master_password (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      hint TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 15. 创建系统设置表
  db.exec(`
    CREATE TABLE IF NOT EXISTS system_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT,
      description TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 16. 创建备份历史表（兼容）
  db.exec(`
    CREATE TABLE IF NOT EXISTS backup_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      file_size INTEGER,
      backup_type TEXT DEFAULT 'manual',
      is_encrypted INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 创建索引以优化查询性能
  db.exec(`CREATE INDEX IF NOT EXISTS idx_operation_logs_user ON operation_logs(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_operation_logs_created ON operation_logs(created_at)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_login_logs_user ON login_logs(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_login_logs_created ON login_logs(created_at)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_secrets_user ON secrets(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_tags_user ON tags(user_id)`);

  // 18. 创建邮件模板表
  db.exec(`
    CREATE TABLE IF NOT EXISTS email_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      subject TEXT NOT NULL,
      content TEXT NOT NULL,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_email_templates_type ON email_templates(type)`);

  // 插入默认管理员用户
  const adminUser = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
  if (!adminUser) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)').run(
      'admin', hashedPassword, 'admin@example.com', 'admin'
    );
    console.log('✓ 默认管理员账号已创建（用户名：admin，密码：admin123）');
  }

  // 插入默认分类
  const defaultCategory = db.prepare('SELECT * FROM categories WHERE name = ? AND user_id IS NULL').get('未分类');
  if (!defaultCategory) {
    db.prepare('INSERT INTO categories (user_id, name, description, icon, color) VALUES (?, ?, ?, ?, ?)').run(
      null, '未分类', '默认分类', 'folder', '#1890ff'
    );
    console.log('✓ 默认分类已创建');
  }

  // 插入系统设置
  const settings = [
    // 基础设置
    { key: 'theme', value: 'light', description: '主题模式：light/dark/auto' },
    { key: 'language', value: 'zh-CN', description: '系统语言' },
    { key: 'site_name', value: '2FA Authenticator', description: '网站名称' },
    { key: 'site_description', value: '安全的双因素认证管理系统', description: '网站描述' },
    
    // 注册设置
    { key: 'registration_enabled', value: 'true', description: '是否允许用户注册' },
    { key: 'invite_required', value: 'false', description: '注册是否需要邀请码' },
    
    // 安全设置
    { key: 'max_login_attempts', value: '5', description: '最大登录尝试次数' },
    { key: 'login_lockout_duration', value: '30', description: '登录锁定时长（分钟）' },
    { key: 'session_timeout', value: '24', description: '会话超时时间（小时）' },
    { key: 'password_min_length', value: '6', description: '密码最小长度' },
    { key: 'password_require_special', value: 'false', description: '密码是否需要特殊字符' },
    
    // 备份设置
    { key: 'auto_backup_enabled', value: 'false', description: '是否启用自动备份' },
    { key: 'auto_backup_interval', value: '24', description: '自动备份间隔（小时）' },
    { key: 'max_backup_count', value: '10', description: '最大备份数量' },
    
    // 邮件设置
    { key: 'smtp_host', value: '', description: 'SMTP服务器地址' },
    { key: 'smtp_port', value: '587', description: 'SMTP端口' },
    { key: 'smtp_secure', value: '0', description: '是否使用SSL（1:是，0:否）' },
    { key: 'smtp_user', value: '', description: 'SMTP用户名/邮箱' },
    { key: 'smtp_pass', value: '', description: 'SMTP密码' },
    { key: 'smtp_from_name', value: '2FA Notebook', description: '发件人名称' },
    
    // 日志设置
    { key: 'enable_operation_log', value: 'true', description: '是否启用操作日志' },
    { key: 'log_retention_days', value: '90', description: '日志保留天数' },
    { key: 'enable_usage_stats', value: 'true', description: '是否启用使用统计' },
    
    // 系统设置
    { key: 'maintenance_mode', value: 'false', description: '维护模式' },
    { key: 'auto_lock_enabled', value: 'false', description: '是否启用自动锁定（已废弃）' },
    { key: 'auto_lock_timeout', value: '15', description: '自动锁定超时（分钟）（已废弃）' }
  ];

  for (const setting of settings) {
    const exists = db.prepare('SELECT * FROM system_settings WHERE key = ?').get(setting.key);
    if (!exists) {
      db.prepare('INSERT INTO system_settings (key, value, description) VALUES (?, ?, ?)').run(
        setting.key, setting.value, setting.description
      );
    }
  }

  console.log('✓ 数据库初始化完成');
  console.log('==================================================');
  console.log('默认管理员账号：');
  console.log('  用户名：admin');
  console.log('  密码：admin123');
  console.log('⚠️  请登录后立即修改默认密码！');
  console.log('==================================================');
}

// 执行初始化
initDatabase();

module.exports = db;

const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

// 数据库文件路径
const dbPath = process.env.DB_PATH || path.join(__dirname, '../data/2fa.db');
const db = new Database(dbPath);

// 启用外键约束
db.pragma('foreign_keys = ON');

// 初始化数据库表
function initDatabase() {
  // 创建用户表（用于后台管理）
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      email TEXT,
      role TEXT DEFAULT 'user',
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    )
  `);

  // 创建系统设置表
  db.exec(`
    CREATE TABLE IF NOT EXISTS system_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT,
      description TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 创建主密码表
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

  // 创建分类表（扩展）
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      icon TEXT,
      color TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 创建标签表
  db.exec(`
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      color TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 创建密钥表（扩展）
  db.exec(`
    CREATE TABLE IF NOT EXISTS secrets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    )
  `);

  // 创建密钥-标签关联表
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

  // 创建使用记录表
  db.exec(`
    CREATE TABLE IF NOT EXISTS usage_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      secret_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (secret_id) REFERENCES secrets(id) ON DELETE CASCADE
    )
  `);

  // 创建自动备份记录表
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

  // 创建会话表
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

  // 插入默认分类
  const defaultCategory = db.prepare('SELECT * FROM categories WHERE name = ?').get('未分类');
  if (!defaultCategory) {
    db.prepare('INSERT INTO categories (name, description, icon, color) VALUES (?, ?, ?, ?)').run(
      '未分类', '默认分类', 'folder', '#1890ff'
    );
  }

  // 插入默认管理员（用户名：admin，密码：admin123）
  const adminUser = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
  if (!adminUser) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)').run(
      'admin', hashedPassword, 'admin@example.com', 'admin'
    );
  }

  // 插入默认系统设置
  const settings = [
    { key: 'auto_backup_enabled', value: 'false', description: '是否启用自动备份' },
    { key: 'auto_backup_interval', value: '24', description: '自动备份间隔（小时）' },
    { key: 'auto_lock_enabled', value: 'true', description: '是否启用自动锁定' },
    { key: 'auto_lock_timeout', value: '15', description: '自动锁定超时（分钟）' },
    { key: 'theme', value: 'light', description: '主题模式：light/dark/auto' },
    { key: 'language', value: 'zh-CN', description: '系统语言' },
    { key: 'enable_usage_stats', value: 'true', description: '是否启用使用统计' }
  ];

  for (const setting of settings) {
    const exists = db.prepare('SELECT * FROM system_settings WHERE key = ?').get(setting.key);
    if (!exists) {
      db.prepare('INSERT INTO system_settings (key, value, description) VALUES (?, ?, ?)').run(
        setting.key, setting.value, setting.description
      );
    }
  }

  console.log('Database initialized successfully');
}

initDatabase();

module.exports = db;

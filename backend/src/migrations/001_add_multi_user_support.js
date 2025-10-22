const Database = require('better-sqlite3');
const path = require('path');

// 数据库迁移：添加多用户支持
function migrate() {
  const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/2fa.db');
  const db = new Database(dbPath);
  
  console.log('开始数据库迁移：添加多用户支持...');
  
  try {
    db.exec('BEGIN TRANSACTION');
    
    // 检查 secrets 表是否已有 user_id 字段
    const secretsInfo = db.prepare("PRAGMA table_info(secrets)").all();
    const hasUserIdInSecrets = secretsInfo.some(col => col.name === 'user_id');
    
    if (!hasUserIdInSecrets) {
      console.log('正在给 secrets 表添加 user_id 字段...');
      
      // 1. 创建新表
      db.exec(`
        CREATE TABLE secrets_new (
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
      
      // 2. 复制数据（默认所有数据归属 admin 用户，user_id=1）
      db.exec(`
        INSERT INTO secrets_new 
        SELECT id, 1 as user_id, name, secret_key, issuer, category_id, note, icon, icon_type,
               is_favorite, is_pinned, sort_order, use_count, last_used_at, created_at, updated_at
        FROM secrets
      `);
      
      // 3. 删除旧表
      db.exec('DROP TABLE secrets');
      
      // 4. 重命名新表
      db.exec('ALTER TABLE secrets_new RENAME TO secrets');
      
      console.log('✓ secrets 表迁移完成');
    }
    
    // 检查 categories 表是否已有 user_id 字段
    const categoriesInfo = db.prepare("PRAGMA table_info(categories)").all();
    const hasUserIdInCategories = categoriesInfo.some(col => col.name === 'user_id');
    
    if (!hasUserIdInCategories) {
      console.log('正在给 categories 表添加 user_id 字段...');
      
      db.exec(`
        CREATE TABLE categories_new (
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
      
      // 复制数据（默认分类设为NULL，表示全局共享）
      db.exec(`
        INSERT INTO categories_new 
        SELECT id, NULL as user_id, name, description, icon, color, sort_order, created_at
        FROM categories
      `);
      
      db.exec('DROP TABLE categories');
      db.exec('ALTER TABLE categories_new RENAME TO categories');
      
      console.log('✓ categories 表迁移完成');
    }
    
    // 检查 tags 表是否已有 user_id 字段
    const tagsInfo = db.prepare("PRAGMA table_info(tags)").all();
    const hasUserIdInTags = tagsInfo.some(col => col.name === 'user_id');
    
    if (!hasUserIdInTags) {
      console.log('正在给 tags 表添加 user_id 字段...');
      
      db.exec(`
        CREATE TABLE tags_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL DEFAULT 1,
          name TEXT NOT NULL,
          color TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
      
      db.exec(`
        INSERT INTO tags_new 
        SELECT id, 1 as user_id, name, color, created_at
        FROM tags
      `);
      
      db.exec('DROP TABLE tags');
      db.exec('ALTER TABLE tags_new RENAME TO tags');
      
      console.log('✓ tags 表迁移完成');
    }
    
    // 更新 usage_logs 表，添加 user_id
    const logsInfo = db.prepare("PRAGMA table_info(usage_logs)").all();
    const hasUserIdInLogs = logsInfo.some(col => col.name === 'user_id');
    
    if (!hasUserIdInLogs) {
      console.log('正在给 usage_logs 表添加 user_id 字段...');
      
      db.exec(`
        CREATE TABLE usage_logs_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          secret_id INTEGER NOT NULL,
          action TEXT NOT NULL,
          ip_address TEXT,
          user_agent TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
          FOREIGN KEY (secret_id) REFERENCES secrets(id) ON DELETE CASCADE
        )
      `);
      
      db.exec(`
        INSERT INTO usage_logs_new 
        SELECT id, 1 as user_id, secret_id, action, NULL as ip_address, NULL as user_agent, created_at
        FROM usage_logs
      `);
      
      db.exec('DROP TABLE usage_logs');
      db.exec('ALTER TABLE usage_logs_new RENAME TO usage_logs');
      
      console.log('✓ usage_logs 表迁移完成');
    }
    
    db.exec('COMMIT');
    console.log('✓ 数据库迁移成功完成！');
    
  } catch (error) {
    db.exec('ROLLBACK');
    console.error('✗ 数据库迁移失败:', error);
    throw error;
  } finally {
    db.close();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  migrate();
}

module.exports = migrate;


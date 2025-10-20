const db = require('../database');
const CryptoJS = require('crypto-js');

// 导出所有数据
exports.exportData = (req, res) => {
  try {
    const categories = db.prepare('SELECT * FROM categories').all();
    const secrets = db.prepare('SELECT * FROM secrets').all();
    const tags = db.prepare('SELECT * FROM tags').all();
    const secretTags = db.prepare('SELECT * FROM secret_tags').all();

    const backup = {
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      categories,
      secrets,
      tags,
      secret_tags: secretTags
    };

    res.json({ success: true, data: backup });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 导出加密备份
exports.exportEncrypted = (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: '请提供加密密码' });
    }

    const categories = db.prepare('SELECT * FROM categories').all();
    const secrets = db.prepare('SELECT * FROM secrets').all();
    const tags = db.prepare('SELECT * FROM tags').all();
    const secretTags = db.prepare('SELECT * FROM secret_tags').all();

    const backup = {
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      encrypted: true,
      categories,
      secrets,
      tags,
      secret_tags: secretTags
    };

    const encrypted = CryptoJS.AES.encrypt(JSON.stringify(backup), password).toString();

    res.json({ 
      success: true, 
      data: {
        encrypted: true,
        data: encrypted
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 导入数据
exports.importData = (req, res) => {
  try {
    let { categories, secrets, tags, secret_tags, merge, encrypted, data, password } = req.body;

    // 如果是加密数据，先解密
    if (encrypted) {
      if (!data || !password) {
        return res.status(400).json({ success: false, message: '加密数据需要密码' });
      }

      try {
        const decryptedBytes = CryptoJS.AES.decrypt(data, password);
        const decryptedData = JSON.parse(decryptedBytes.toString(CryptoJS.enc.Utf8));
        
        categories = decryptedData.categories;
        secrets = decryptedData.secrets;
        tags = decryptedData.tags || [];
        secret_tags = decryptedData.secret_tags || [];
      } catch (error) {
        return res.status(400).json({ success: false, message: '解密失败，密码可能不正确' });
      }
    }

    if (!categories || !secrets) {
      return res.status(400).json({ success: false, message: '数据格式无效' });
    }

    // 如果不是合并模式，先清空现有数据
    if (!merge) {
      db.prepare('DELETE FROM secret_tags').run();
      db.prepare('DELETE FROM secrets').run();
      db.prepare('DELETE FROM tags').run();
      db.prepare('DELETE FROM categories WHERE name != ?').run('未分类');
    }

    // 导入分类
    const categoryMap = {};
    for (const category of categories) {
      if (category.name === '未分类') {
        const existingCategory = db.prepare('SELECT id FROM categories WHERE name = ?').get('未分类');
        categoryMap[category.id] = existingCategory.id;
        continue;
      }

      try {
        const result = db.prepare(`
          INSERT INTO categories (name, description, icon, color, sort_order) 
          VALUES (?, ?, ?, ?, ?)
        `).run(
          category.name,
          category.description || '',
          category.icon || '',
          category.color || '#1890ff',
          category.sort_order || 0
        );
        categoryMap[category.id] = result.lastInsertRowid;
      } catch (error) {
        if (error.message.includes('UNIQUE constraint failed')) {
          const existing = db.prepare('SELECT id FROM categories WHERE name = ?').get(category.name);
          categoryMap[category.id] = existing.id;
        } else {
          throw error;
        }
      }
    }

    // 导入标签
    const tagMap = {};
    if (tags && Array.isArray(tags)) {
      for (const tag of tags) {
        try {
          const result = db.prepare('INSERT INTO tags (name, color) VALUES (?, ?)').run(
            tag.name,
            tag.color || '#1890ff'
          );
          tagMap[tag.id] = result.lastInsertRowid;
        } catch (error) {
          if (error.message.includes('UNIQUE constraint failed')) {
            const existing = db.prepare('SELECT id FROM tags WHERE name = ?').get(tag.name);
            tagMap[tag.id] = existing.id;
          } else {
            console.error(`Failed to import tag: ${tag.name}`, error);
          }
        }
      }
    }

    // 导入密钥
    const secretMap = {};
    let importedCount = 0;
    for (const secret of secrets) {
      try {
        const newCategoryId = categoryMap[secret.category_id] || null;
        const result = db.prepare(`
          INSERT INTO secrets (name, secret_key, issuer, category_id, note, icon, icon_type, 
                              is_favorite, is_pinned, sort_order, use_count) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          secret.name,
          secret.secret_key,
          secret.issuer || '',
          newCategoryId,
          secret.note || '',
          secret.icon || '',
          secret.icon_type || 'default',
          secret.is_favorite || 0,
          secret.is_pinned || 0,
          secret.sort_order || 0,
          secret.use_count || 0
        );
        secretMap[secret.id] = result.lastInsertRowid;
        importedCount++;
      } catch (error) {
        console.error(`Failed to import secret: ${secret.name}`, error);
      }
    }

    // 导入密钥-标签关联
    if (secret_tags && Array.isArray(secret_tags)) {
      for (const st of secret_tags) {
        const newSecretId = secretMap[st.secret_id];
        const newTagId = tagMap[st.tag_id];
        
        if (newSecretId && newTagId) {
          try {
            db.prepare('INSERT INTO secret_tags (secret_id, tag_id) VALUES (?, ?)').run(newSecretId, newTagId);
          } catch (error) {
            console.error('Failed to import secret-tag relation', error);
          }
        }
      }
    }

    // 记录备份历史
    db.prepare(`
      INSERT INTO backup_history (filename, backup_type, is_encrypted) 
      VALUES (?, ?, ?)
    `).run('import-' + Date.now() + '.json', 'import', encrypted ? 1 : 0);

    res.json({ 
      success: true, 
      message: `成功导入 ${importedCount} 个密钥`,
      data: { importedCount }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 获取备份历史
exports.getBackupHistory = (req, res) => {
  try {
    const history = db.prepare(`
      SELECT * FROM backup_history 
      ORDER BY created_at DESC 
      LIMIT 50
    `).all();

    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 自动备份
exports.autoBackup = async (req, res) => {
  try {
    const autoBackupEnabled = db.prepare('SELECT value FROM system_settings WHERE key = ?').get('auto_backup_enabled');
    
    if (!autoBackupEnabled || autoBackupEnabled.value !== 'true') {
      return res.json({ success: false, message: '自动备份未启用' });
    }

    const categories = db.prepare('SELECT * FROM categories').all();
    const secrets = db.prepare('SELECT * FROM secrets').all();
    const tags = db.prepare('SELECT * FROM tags').all();
    const secretTags = db.prepare('SELECT * FROM secret_tags').all();

    const backup = {
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      categories,
      secrets,
      tags,
      secret_tags: secretTags
    };

    const backupData = JSON.stringify(backup, null, 2);
    const fileSize = Buffer.byteLength(backupData, 'utf8');
    const filename = `auto-backup-${Date.now()}.json`;

    // 记录备份历史
    db.prepare(`
      INSERT INTO backup_history (filename, file_size, backup_type) 
      VALUES (?, ?, ?)
    `).run(filename, fileSize, 'auto');

    res.json({ 
      success: true, 
      message: '自动备份完成',
      data: backup
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 导入 Google Authenticator 格式
exports.importGoogleAuthenticator = (req, res) => {
  try {
    const { data } = req.body;

    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ success: false, message: '数据格式无效' });
    }

    // Google Authenticator 导出格式通常是 otpauth URL 数组
    let importedCount = 0;
    const defaultCategory = db.prepare('SELECT id FROM categories WHERE name = ?').get('未分类');

    for (const item of data) {
      try {
        // 假设每个 item 是一个包含 name 和 secret 的对象
        db.prepare(`
          INSERT INTO secrets (name, secret_key, issuer, category_id) 
          VALUES (?, ?, ?, ?)
        `).run(
          item.name || 'Unknown',
          item.secret,
          item.issuer || '',
          defaultCategory.id
        );
        importedCount++;
      } catch (error) {
        console.error('Failed to import item', error);
      }
    }

    res.json({ 
      success: true, 
      message: `成功导入 ${importedCount} 个密钥`,
      data: { importedCount }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

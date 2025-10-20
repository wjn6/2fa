const db = require('../database');
const speakeasy = require('speakeasy');
const { encrypt, decrypt } = require('../utils/encryption');
const { deriveKey } = require('../utils/encryption');

// 获取主密码用于加密解密
function getMasterPasswordKey(sessionToken) {
  const session = db.prepare('SELECT * FROM sessions WHERE session_token = ?').get(sessionToken);
  if (!session) return null;
  
  const masterPassword = db.prepare('SELECT * FROM master_password LIMIT 1').get();
  if (!masterPassword) return null;
  
  // 这里简化处理，实际应该在session中存储派生密钥
  return masterPassword.salt;
}

// 获取所有密钥
exports.getAllSecrets = (req, res) => {
  try {
    const { search, category_id, tag_id, favorite, pinned } = req.query;
    
    let query = `
      SELECT s.*, c.name as category_name 
      FROM secrets s 
      LEFT JOIN categories c ON s.category_id = c.id
    `;
    const params = [];
    const conditions = [];

    if (search) {
      conditions.push('(s.name LIKE ? OR s.issuer LIKE ? OR s.note LIKE ?)');
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }
    
    if (category_id) {
      conditions.push('s.category_id = ?');
      params.push(category_id);
    }
    
    if (favorite === 'true') {
      conditions.push('s.is_favorite = 1');
    }
    
    if (pinned === 'true') {
      conditions.push('s.is_pinned = 1');
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY s.is_pinned DESC, s.sort_order ASC, s.updated_at DESC';

    const secrets = db.prepare(query).all(...params);
    
    // 直接返回密钥列表
    // 注意：密钥在数据库中以明文存储（或已加密状态）
    res.json({ success: true, data: secrets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 获取单个密钥详情（包含解密后的密钥）
exports.getSecretDetail = (req, res) => {
  try {
    const { id } = req.params;
    const secret = db.prepare(`
      SELECT s.*, c.name as category_name 
      FROM secrets s 
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE s.id = ?
    `).get(id);

    if (!secret) {
      return res.status(404).json({ success: false, message: '密钥不存在' });
    }

    // 获取标签
    const tags = db.prepare(`
      SELECT t.* FROM tags t
      INNER JOIN secret_tags st ON t.id = st.tag_id
      WHERE st.secret_id = ?
    `).all(id);

    res.json({ success: true, data: { ...secret, tags } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 创建密钥
exports.createSecret = (req, res) => {
  try {
    const { name, secret_key, issuer, category_id, note, icon, icon_type, tags } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: '名称不能为空' });
    }

    if (!secret_key || secret_key.trim() === '') {
      return res.status(400).json({ success: false, message: '密钥不能为空' });
    }

    // 验证密钥格式
    try {
      speakeasy.totp({
        secret: secret_key,
        encoding: 'base32'
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: '密钥格式无效' });
    }

    const result = db.prepare(`
      INSERT INTO secrets (name, secret_key, issuer, category_id, note, icon, icon_type) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name, secret_key, issuer || '', category_id || null, note || '', icon || '', icon_type || 'default');

    // 处理标签
    if (tags && Array.isArray(tags) && tags.length > 0) {
      const insertTag = db.prepare('INSERT INTO secret_tags (secret_id, tag_id) VALUES (?, ?)');
      for (const tagId of tags) {
        insertTag.run(result.lastInsertRowid, tagId);
      }
    }

    const newSecret = db.prepare(`
      SELECT s.*, c.name as category_name 
      FROM secrets s 
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE s.id = ?
    `).get(result.lastInsertRowid);

    res.json({ success: true, data: newSecret });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 更新密钥
exports.updateSecret = (req, res) => {
  try {
    const { id } = req.params;
    const { name, secret_key, issuer, category_id, note, icon, icon_type, is_favorite, is_pinned, tags } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: '名称不能为空' });
    }

    if (!secret_key || secret_key.trim() === '') {
      return res.status(400).json({ success: false, message: '密钥不能为空' });
    }

    // 如果密钥不是加密标记，验证格式
    if (secret_key !== '***encrypted***') {
      try {
        speakeasy.totp({
          secret: secret_key,
          encoding: 'base32'
        });
      } catch (error) {
        return res.status(400).json({ success: false, message: '密钥格式无效' });
      }
    }

    const result = db.prepare(`
      UPDATE secrets 
      SET name = ?, secret_key = ?, issuer = ?, category_id = ?, note = ?, 
          icon = ?, icon_type = ?, is_favorite = ?, is_pinned = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      name, 
      secret_key === '***encrypted***' ? db.prepare('SELECT secret_key FROM secrets WHERE id = ?').get(id).secret_key : secret_key,
      issuer || '', 
      category_id || null, 
      note || '', 
      icon || '', 
      icon_type || 'default',
      is_favorite !== undefined ? is_favorite : 0,
      is_pinned !== undefined ? is_pinned : 0,
      id
    );

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: '密钥不存在' });
    }

    // 更新标签
    if (tags !== undefined && Array.isArray(tags)) {
      db.prepare('DELETE FROM secret_tags WHERE secret_id = ?').run(id);
      if (tags.length > 0) {
        const insertTag = db.prepare('INSERT INTO secret_tags (secret_id, tag_id) VALUES (?, ?)');
        for (const tagId of tags) {
          insertTag.run(id, tagId);
        }
      }
    }

    const updatedSecret = db.prepare(`
      SELECT s.*, c.name as category_name 
      FROM secrets s 
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE s.id = ?
    `).get(id);

    res.json({ success: true, data: updatedSecret });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 删除密钥
exports.deleteSecret = (req, res) => {
  try {
    const { id } = req.params;
    const result = db.prepare('DELETE FROM secrets WHERE id = ?').run(id);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: '密钥不存在' });
    }

    res.json({ success: true, message: '密钥已删除' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 批量删除密钥
exports.batchDeleteSecrets = (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: '请提供要删除的密钥ID' });
    }

    const placeholders = ids.map(() => '?').join(',');
    const result = db.prepare(`DELETE FROM secrets WHERE id IN (${placeholders})`).run(...ids);

    res.json({ success: true, message: `成功删除${result.changes}个密钥` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 批量更新分类
exports.batchUpdateCategory = (req, res) => {
  try {
    const { ids, category_id } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: '请提供密钥ID' });
    }

    const placeholders = ids.map(() => '?').join(',');
    const result = db.prepare(`
      UPDATE secrets SET category_id = ?, updated_at = datetime('now') 
      WHERE id IN (${placeholders})
    `).run(category_id || null, ...ids);

    res.json({ success: true, message: `成功更新${result.changes}个密钥` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 更新排序
exports.updateSort = (req, res) => {
  try {
    const { sortData } = req.body; // [{ id: 1, sort_order: 0 }, ...]
    
    if (!sortData || !Array.isArray(sortData)) {
      return res.status(400).json({ success: false, message: '排序数据格式错误' });
    }

    const updateStmt = db.prepare('UPDATE secrets SET sort_order = ? WHERE id = ?');
    
    for (const item of sortData) {
      updateStmt.run(item.sort_order, item.id);
    }

    res.json({ success: true, message: '排序已更新' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 切换收藏状态
exports.toggleFavorite = (req, res) => {
  try {
    const { id } = req.params;
    const secret = db.prepare('SELECT is_favorite FROM secrets WHERE id = ?').get(id);
    
    if (!secret) {
      return res.status(404).json({ success: false, message: '密钥不存在' });
    }

    const newFavorite = secret.is_favorite ? 0 : 1;
    db.prepare('UPDATE secrets SET is_favorite = ?, updated_at = datetime(\'now\') WHERE id = ?').run(newFavorite, id);

    res.json({ success: true, data: { is_favorite: newFavorite } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 切换置顶状态
exports.togglePin = (req, res) => {
  try {
    const { id } = req.params;
    const secret = db.prepare('SELECT is_pinned FROM secrets WHERE id = ?').get(id);
    
    if (!secret) {
      return res.status(404).json({ success: false, message: '密钥不存在' });
    }

    const newPinned = secret.is_pinned ? 0 : 1;
    db.prepare('UPDATE secrets SET is_pinned = ?, updated_at = datetime(\'now\') WHERE id = ?').run(newPinned, id);

    res.json({ success: true, data: { is_pinned: newPinned } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 生成 TOTP 代码
exports.generateToken = (req, res) => {
  try {
    const { id } = req.params;
    const secret = db.prepare('SELECT * FROM secrets WHERE id = ?').get(id);

    if (!secret) {
      return res.status(404).json({ success: false, message: '密钥不存在' });
    }

    const token = speakeasy.totp({
      secret: secret.secret_key,
      encoding: 'base32'
    });

    // 计算剩余时间（秒）
    const remaining = 30 - Math.floor((Date.now() / 1000) % 30);

    // 更新使用统计
    db.prepare(`
      UPDATE secrets 
      SET use_count = use_count + 1, last_used_at = datetime('now') 
      WHERE id = ?
    `).run(id);

    // 记录使用日志
    const enableStats = db.prepare('SELECT value FROM system_settings WHERE key = ?').get('enable_usage_stats');
    if (enableStats && enableStats.value === 'true') {
      db.prepare('INSERT INTO usage_logs (secret_id, action) VALUES (?, ?)').run(id, 'generate_token');
    }

    res.json({ 
      success: true, 
      data: { 
        token, 
        remaining,
        name: secret.name,
        issuer: secret.issuer
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 批量生成所有 TOTP 代码
exports.generateAllTokens = (req, res) => {
  try {
    const secrets = db.prepare('SELECT id, secret_key FROM secrets').all();
    const remaining = 30 - Math.floor((Date.now() / 1000) % 30);

    const tokens = secrets.map(secret => {
      try {
        const token = speakeasy.totp({
          secret: secret.secret_key,
          encoding: 'base32'
        });
        return {
          id: secret.id,
          token,
          remaining
        };
      } catch (error) {
        return {
          id: secret.id,
          token: '错误',
          remaining,
          error: true
        };
      }
    });

    res.json({ success: true, data: tokens });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

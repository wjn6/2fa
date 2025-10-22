/**
 * API密钥管理控制器
 * 允许用户生成API密钥用于第三方集成
 */

const db = require('../database');
const crypto = require('crypto');

/**
 * 生成随机API密钥
 */
function generateApiKey() {
  return 'sk_' + crypto.randomBytes(32).toString('hex');
}

/**
 * 获取当前用户的所有API密钥
 */
exports.getApiKeys = (req, res) => {
  try {
    const userId = req.user.id;
    
    const apiKeys = db.prepare(`
      SELECT id, name, key_prefix, permissions, last_used_at, 
             is_active, created_at, expires_at
      FROM api_keys
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(userId);
    
    res.json({
      success: true,
      data: apiKeys
    });
  } catch (error) {
    console.error('获取API密钥失败:', error);
    res.status(500).json({ success: false, message: '获取API密钥失败' });
  }
};

/**
 * 创建新的API密钥
 */
exports.createApiKey = (req, res) => {
  try {
    const userId = req.user.id;
    const { name, permissions = 'read', expiresIn } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, message: '请提供API密钥名称' });
    }
    
    // 生成完整密钥
    const apiKey = generateApiKey();
    
    // 只存储密钥的哈希值
    const crypto = require('crypto');
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    
    // 密钥前缀（用于识别）
    const keyPrefix = apiKey.substring(0, 12) + '...';
    
    // 计算过期时间
    let expiresAt = null;
    if (expiresIn) {
      const now = new Date();
      if (expiresIn === '30d') {
        now.setDate(now.getDate() + 30);
      } else if (expiresIn === '90d') {
        now.setDate(now.getDate() + 90);
      } else if (expiresIn === '1y') {
        now.setFullYear(now.getFullYear() + 1);
      }
      expiresAt = now.toISOString();
    }
    
    // 插入数据库
    const result = db.prepare(`
      INSERT INTO api_keys (user_id, name, key_hash, key_prefix, permissions, expires_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, name, keyHash, keyPrefix, permissions, expiresAt);
    
    // 记录操作日志
    db.prepare(`
      INSERT INTO operation_logs (user_id, username, action, resource_type, resource_id, details, ip_address, user_agent, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      req.user.username,
      '创建API密钥',
      'api_key',
      result.lastInsertRowid,
      JSON.stringify({ name, permissions }),
      req.ip,
      req.get('user-agent'),
      'success'
    );
    
    res.json({
      success: true,
      message: 'API密钥创建成功',
      data: {
        id: result.lastInsertRowid,
        apiKey: apiKey, // 只在创建时返回一次完整密钥
        name: name,
        keyPrefix: keyPrefix,
        permissions: permissions,
        expiresAt: expiresAt,
        warning: '请妥善保管此密钥，关闭后将无法再次查看完整密钥'
      }
    });
  } catch (error) {
    console.error('创建API密钥失败:', error);
    res.status(500).json({ success: false, message: '创建API密钥失败' });
  }
};

/**
 * 更新API密钥
 */
exports.updateApiKey = (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { name, permissions, isActive } = req.body;
    
    // 检查所有权
    const apiKey = db.prepare('SELECT * FROM api_keys WHERE id = ? AND user_id = ?').get(id, userId);
    if (!apiKey) {
      return res.status(404).json({ success: false, message: 'API密钥不存在' });
    }
    
    // 更新
    const updates = [];
    const values = [];
    
    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    
    if (permissions !== undefined) {
      updates.push('permissions = ?');
      values.push(permissions);
    }
    
    if (isActive !== undefined) {
      updates.push('is_active = ?');
      values.push(isActive ? 1 : 0);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: '没有要更新的字段' });
    }
    
    values.push(id, userId);
    
    db.prepare(`
      UPDATE api_keys 
      SET ${updates.join(', ')}, updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `).run(...values);
    
    // 记录操作日志
    db.prepare(`
      INSERT INTO operation_logs (user_id, username, action, resource_type, resource_id, details, ip_address, user_agent, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      req.user.username,
      '更新API密钥',
      'api_key',
      id,
      JSON.stringify({ name, permissions, isActive }),
      req.ip,
      req.get('user-agent'),
      'success'
    );
    
    res.json({
      success: true,
      message: 'API密钥更新成功'
    });
  } catch (error) {
    console.error('更新API密钥失败:', error);
    res.status(500).json({ success: false, message: '更新API密钥失败' });
  }
};

/**
 * 删除API密钥
 */
exports.deleteApiKey = (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    // 检查所有权
    const apiKey = db.prepare('SELECT * FROM api_keys WHERE id = ? AND user_id = ?').get(id, userId);
    if (!apiKey) {
      return res.status(404).json({ success: false, message: 'API密钥不存在' });
    }
    
    // 删除
    db.prepare('DELETE FROM api_keys WHERE id = ? AND user_id = ?').run(id, userId);
    
    // 记录操作日志
    db.prepare(`
      INSERT INTO operation_logs (user_id, username, action, resource_type, resource_id, details, ip_address, user_agent, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      req.user.username,
      '删除API密钥',
      'api_key',
      id,
      JSON.stringify({ name: apiKey.name }),
      req.ip,
      req.get('user-agent'),
      'success'
    );
    
    res.json({
      success: true,
      message: 'API密钥删除成功'
    });
  } catch (error) {
    console.error('删除API密钥失败:', error);
    res.status(500).json({ success: false, message: '删除API密钥失败' });
  }
};

/**
 * 验证API密钥（用于API调用）
 */
exports.validateApiKey = (apiKey) => {
  try {
    if (!apiKey || !apiKey.startsWith('sk_')) {
      return null;
    }
    
    // 计算哈希
    const crypto = require('crypto');
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    
    // 查找密钥
    const key = db.prepare(`
      SELECT ak.*, u.username, u.email, u.role
      FROM api_keys ak
      JOIN users u ON ak.user_id = u.id
      WHERE ak.key_hash = ? AND ak.is_active = 1
    `).get(keyHash);
    
    if (!key) {
      return null;
    }
    
    // 检查是否过期
    if (key.expires_at && new Date(key.expires_at) < new Date()) {
      return null;
    }
    
    // 更新最后使用时间
    db.prepare(`
      UPDATE api_keys 
      SET last_used_at = datetime('now'), use_count = use_count + 1
      WHERE id = ?
    `).run(key.id);
    
    return {
      id: key.user_id,
      username: key.username,
      email: key.email,
      role: key.role,
      apiKeyId: key.id,
      permissions: key.permissions
    };
  } catch (error) {
    console.error('验证API密钥失败:', error);
    return null;
  }
};

module.exports = exports;



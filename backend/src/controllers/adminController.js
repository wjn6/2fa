const db = require('../database');
const bcrypt = require('bcryptjs');

// 获取所有用户
exports.getAllUsers = (req, res) => {
  try {
    const users = db.prepare(`
      SELECT id, username, email, role, is_active, created_at, last_login 
      FROM users 
      ORDER BY created_at DESC
    `).all();

    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 创建用户
exports.createUser = (req, res) => {
  try {
    const { username, password, email, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: '密码至少6位' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const result = db.prepare(`
      INSERT INTO users (username, password, email, role) 
      VALUES (?, ?, ?, ?)
    `).run(username, hashedPassword, email || '', role || 'user');

    const newUser = db.prepare(`
      SELECT id, username, email, role, is_active, created_at 
      FROM users WHERE id = ?
    `).get(result.lastInsertRowid);

    res.json({ success: true, data: newUser });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ success: false, message: '用户名已存在' });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

// 更新用户
exports.updateUser = (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, role, is_active, password } = req.body;

    let query = 'UPDATE users SET ';
    const params = [];
    const updates = [];

    if (username !== undefined) {
      updates.push('username = ?');
      params.push(username);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      params.push(email);
    }
    if (role !== undefined) {
      updates.push('role = ?');
      params.push(role);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(is_active ? 1 : 0);
    }
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ success: false, message: '密码至少6位' });
      }
      updates.push('password = ?');
      params.push(bcrypt.hashSync(password, 10));
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: '没有要更新的字段' });
    }

    query += updates.join(', ') + ' WHERE id = ?';
    params.push(id);

    const result = db.prepare(query).run(...params);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    const updatedUser = db.prepare(`
      SELECT id, username, email, role, is_active, created_at, last_login 
      FROM users WHERE id = ?
    `).get(id);

    res.json({ success: true, data: updatedUser });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ success: false, message: '用户名已存在' });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

// 删除用户
exports.deleteUser = (req, res) => {
  try {
    const { id } = req.params;

    // 不能删除自己
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ success: false, message: '不能删除当前登录用户' });
    }

    const result = db.prepare('DELETE FROM users WHERE id = ?').run(id);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    res.json({ success: true, message: '用户已删除' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 获取系统设置
exports.getSettings = (req, res) => {
  try {
    const settings = db.prepare('SELECT * FROM system_settings').all();
    
    const settingsObj = {};
    settings.forEach(s => {
      settingsObj[s.key] = {
        value: s.value,
        description: s.description
      };
    });

    res.json({ success: true, data: settingsObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 更新系统设置
exports.updateSettings = (req, res) => {
  try {
    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ success: false, message: '设置格式错误' });
    }

    const updateStmt = db.prepare(`
      UPDATE system_settings 
      SET value = ?, updated_at = datetime("now") 
      WHERE key = ?
    `);

    for (const [key, value] of Object.entries(settings)) {
      updateStmt.run(value, key);
    }

    res.json({ success: true, message: '设置已更新' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 获取系统统计
exports.getStatistics = (req, res) => {
  try {
    const stats = {
      totalSecrets: db.prepare('SELECT COUNT(*) as count FROM secrets').get().count,
      totalCategories: db.prepare('SELECT COUNT(*) as count FROM categories').get().count,
      totalTags: db.prepare('SELECT COUNT(*) as count FROM tags').get().count,
      totalUsers: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
      favoriteSecrets: db.prepare('SELECT COUNT(*) as count FROM secrets WHERE is_favorite = 1').get().count,
      pinnedSecrets: db.prepare('SELECT COUNT(*) as count FROM secrets WHERE is_pinned = 1').get().count,
      
      // 最近7天的使用记录
      recentUsage: db.prepare(`
        SELECT DATE(created_at) as date, COUNT(*) as count 
        FROM usage_logs 
        WHERE created_at >= datetime('now', '-7 days')
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `).all(),
      
      // 最常使用的密钥
      topSecrets: db.prepare(`
        SELECT s.id, s.name, s.issuer, s.use_count, s.last_used_at
        FROM secrets s
        WHERE s.use_count > 0
        ORDER BY s.use_count DESC
        LIMIT 10
      `).all(),
      
      // 分类统计
      categoryStats: db.prepare(`
        SELECT c.name, COUNT(s.id) as count
        FROM categories c
        LEFT JOIN secrets s ON c.id = s.category_id
        GROUP BY c.id, c.name
        ORDER BY count DESC
      `).all(),
      
      // 备份统计
      backupStats: {
        total: db.prepare('SELECT COUNT(*) as count FROM backup_history').get().count,
        lastBackup: db.prepare('SELECT * FROM backup_history ORDER BY created_at DESC LIMIT 1').get()
      }
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 获取使用日志
exports.getUsageLogs = (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    
    const logs = db.prepare(`
      SELECT l.*, s.name as secret_name, s.issuer
      FROM usage_logs l
      LEFT JOIN secrets s ON l.secret_id = s.id
      ORDER BY l.created_at DESC
      LIMIT ? OFFSET ?
    `).all(parseInt(limit), parseInt(offset));

    const total = db.prepare('SELECT COUNT(*) as count FROM usage_logs').get().count;

    res.json({ success: true, data: { logs, total } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 清理过期会话
exports.cleanupSessions = (req, res) => {
  try {
    const result = db.prepare('DELETE FROM sessions WHERE expires_at < datetime("now")').run();
    
    res.json({ 
      success: true, 
      message: `已清理${result.changes}个过期会话` 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 清理使用日志
exports.cleanupLogs = (req, res) => {
  try {
    const { days = 30 } = req.body;
    
    const result = db.prepare(`
      DELETE FROM usage_logs 
      WHERE created_at < datetime('now', '-' || ? || ' days')
    `).run(days);
    
    res.json({ 
      success: true, 
      message: `已清理${result.changes}条日志记录` 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 数据库优化
exports.optimizeDatabase = (req, res) => {
  try {
    db.pragma('optimize');
    db.pragma('vacuum');
    
    res.json({ success: true, message: '数据库优化完成' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



const db = require('../database');
const bcrypt = require('bcryptjs');
const { logOperation } = require('./systemController');

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
      SET value = ?, updated_at = datetime('now') 
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
    const result = db.prepare('DELETE FROM sessions WHERE expires_at < datetime(\'now\')').run();
    
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

/**
 * 批量启用/禁用用户
 */
exports.batchUpdateUserStatus = (req, res) => {
  try {
    const { userIds, isActive } = req.body;
    
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ success: false, message: '请选择要操作的用户' });
    }
    
    const placeholders = userIds.map(() => '?').join(',');
    const result = db.prepare(`
      UPDATE users SET is_active = ? WHERE id IN (${placeholders})
    `).run(isActive ? 1 : 0, ...userIds);
    
    // 记录操作日志
    logOperation(req.user.id, req.user.username, '批量更新用户状态', 'users', null,
      `userIds: ${userIds.join(',')}, isActive: ${isActive}`, req.ip, req.get('user-agent'));
    
    res.json({ 
      success: true, 
      message: `成功${isActive ? '启用' : '禁用'}${result.changes}个用户` 
    });
  } catch (error) {
    console.error('批量更新用户状态失败:', error);
    res.status(500).json({ success: false, message: '批量更新用户状态失败' });
  }
};

/**
 * 批量删除用户
 */
exports.batchDeleteUsers = (req, res) => {
  try {
    const { userIds } = req.body;
    
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ success: false, message: '请选择要删除的用户' });
    }
    
    // 不能删除当前登录用户
    if (userIds.includes(req.user.id)) {
      return res.status(400).json({ success: false, message: '不能删除当前登录用户' });
    }
    
    const placeholders = userIds.map(() => '?').join(',');
    const result = db.prepare(`
      DELETE FROM users WHERE id IN (${placeholders})
    `).run(...userIds);
    
    // 记录操作日志
    logOperation(req.user.id, req.user.username, '批量删除用户', 'users', null,
      `userIds: ${userIds.join(',')}`, req.ip, req.get('user-agent'));
    
    res.json({ success: true, message: `成功删除${result.changes}个用户` });
  } catch (error) {
    console.error('批量删除用户失败:', error);
    res.status(500).json({ success: false, message: '批量删除用户失败' });
  }
};

/**
 * 重置用户密码
 */
exports.resetUserPassword = (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: '密码至少6位' });
    }
    
    const user = db.prepare('SELECT username FROM users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password = ?, failed_login_count = 0, locked_until = NULL WHERE id = ?')
      .run(hashedPassword, id);
    
    // 记录操作日志
    logOperation(req.user.id, req.user.username, '重置用户密码', 'users', id,
      `username: ${user.username}`, req.ip, req.get('user-agent'));
    
    res.json({ success: true, message: '密码重置成功' });
  } catch (error) {
    console.error('重置密码失败:', error);
    res.status(500).json({ success: false, message: '重置密码失败' });
  }
};

/**
 * 获取用户详细信息（包括统计数据）
 */
exports.getUserDetail = (req, res) => {
  try {
    const { id } = req.params;
    
    const user = db.prepare(`
      SELECT id, username, email, role, is_active, invite_code, last_ip, 
             login_count, failed_login_count, locked_until, created_at, last_login
      FROM users WHERE id = ?
    `).get(id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    
    // 获取用户的密钥数量
    const secretCount = db.prepare('SELECT COUNT(*) as count FROM secrets WHERE user_id = ?').get(id);
    
    // 获取用户的最近登录记录
    const recentLogins = db.prepare(`
      SELECT * FROM login_logs 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 10
    `).all(id);
    
    // 获取用户的最近操作记录
    const recentOperations = db.prepare(`
      SELECT * FROM operation_logs 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 10
    `).all(id);
    
    res.json({
      success: true,
      data: {
        ...user,
        secretCount: secretCount.count,
        recentLogins,
        recentOperations
      }
    });
  } catch (error) {
    console.error('获取用户详情失败:', error);
    res.status(500).json({ success: false, message: '获取用户详情失败' });
  }
};

/**
 * 获取所有用户的密钥（管理员功能）
 */
exports.getAllSecrets = (req, res) => {
  try {
    const { page = 1, pageSize = 50, username, name, issuer } = req.query;
    const offset = (page - 1) * pageSize;
    
    let whereConditions = [];
    let params = [];
    
    if (username) {
      whereConditions.push('u.username LIKE ?');
      params.push(`%${username}%`);
    }
    
    if (name) {
      whereConditions.push('s.name LIKE ?');
      params.push(`%${name}%`);
    }
    
    if (issuer) {
      whereConditions.push('s.issuer LIKE ?');
      params.push(`%${issuer}%`);
    }
    
    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
    
    const secrets = db.prepare(`
      SELECT 
        s.id, s.name, s.issuer, s.note, s.is_favorite, s.is_pinned,
        s.use_count, s.last_used_at, s.created_at, s.updated_at,
        u.id as user_id, u.username, u.email,
        c.name as category_name
      FROM secrets s
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN categories c ON s.category_id = c.id
      ${whereClause}
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, parseInt(pageSize), offset);
    
    const totalCount = db.prepare(`
      SELECT COUNT(*) as count 
      FROM secrets s
      LEFT JOIN users u ON s.user_id = u.id
      ${whereClause}
    `).get(...params).count;
    
    res.json({
      success: true,
      data: {
        secrets,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total: totalCount,
          totalPages: Math.ceil(totalCount / pageSize)
        }
      }
    });
  } catch (error) {
    console.error('获取密钥列表失败:', error);
    res.status(500).json({ success: false, message: '获取密钥列表失败' });
  }
};

/**
 * 获取密钥统计数据
 */
exports.getSecretStatistics = (req, res) => {
  try {
    const stats = {
      // 总密钥数
      totalSecrets: db.prepare('SELECT COUNT(*) as count FROM secrets').get().count,
      
      // 按用户统计
      byUser: db.prepare(`
        SELECT 
          u.id, u.username,
          COUNT(s.id) as secret_count,
          SUM(s.use_count) as total_usage
        FROM users u
        LEFT JOIN secrets s ON u.id = s.user_id
        GROUP BY u.id
        ORDER BY secret_count DESC
      `).all(),
      
      // 按分类统计
      byCategory: db.prepare(`
        SELECT 
          c.id, c.name,
          COUNT(s.id) as secret_count
        FROM categories c
        LEFT JOIN secrets s ON c.id = s.category_id
        GROUP BY c.id
        ORDER BY secret_count DESC
      `).all(),
      
      // 最活跃的密钥
      mostUsed: db.prepare(`
        SELECT 
          s.id, s.name, s.issuer, s.use_count, s.last_used_at,
          u.username
        FROM secrets s
        LEFT JOIN users u ON s.user_id = u.id
        WHERE s.use_count > 0
        ORDER BY s.use_count DESC
        LIMIT 20
      `).all(),
      
      // 最近创建的密钥
      recentlyCreated: db.prepare(`
        SELECT 
          s.id, s.name, s.issuer, s.created_at,
          u.username
        FROM secrets s
        LEFT JOIN users u ON s.user_id = u.id
        ORDER BY s.created_at DESC
        LIMIT 20
      `).all()
    };
    
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('获取密钥统计失败:', error);
    res.status(500).json({ success: false, message: '获取密钥统计失败' });
  }
};

/**
 * 删除密钥（管理员）
 */
exports.deleteSecret = (req, res) => {
  try {
    const { id } = req.params;
    
    const secret = db.prepare('SELECT * FROM secrets WHERE id = ?').get(id);
    if (!secret) {
      return res.status(404).json({ success: false, message: '密钥不存在' });
    }
    
    db.prepare('DELETE FROM secrets WHERE id = ?').run(id);
    
    // 记录操作日志
    logOperation(req.user.id, req.user.username, '删除密钥', 'secrets', id,
      `name: ${secret.name}, issuer: ${secret.issuer}`, req.ip, req.get('user-agent'));
    
    res.json({ success: true, message: '密钥删除成功' });
  } catch (error) {
    console.error('删除密钥失败:', error);
    res.status(500).json({ success: false, message: '删除密钥失败' });
  }
};

/**
 * 获取增强的统计数据
 */
exports.getEnhancedStatistics = (req, res) => {
  try {
    const stats = {
      // 用户统计
      users: {
        total: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
        active: db.prepare('SELECT COUNT(*) as count FROM users WHERE is_active = 1').get().count,
        inactive: db.prepare('SELECT COUNT(*) as count FROM users WHERE is_active = 0').get().count,
        admins: db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'").get().count,
        todayLogins: db.prepare(`
          SELECT COUNT(DISTINCT user_id) as count 
          FROM login_logs 
          WHERE DATE(created_at) = DATE('now') AND status = 'success'
        `).get().count
      },
      
      // 密钥统计
      secrets: {
        total: db.prepare('SELECT COUNT(*) as count FROM secrets').get().count,
        favorite: db.prepare('SELECT COUNT(*) as count FROM secrets WHERE is_favorite = 1').get().count,
        pinned: db.prepare('SELECT COUNT(*) as count FROM secrets WHERE is_pinned = 1').get().count,
        todayCreated: db.prepare(`
          SELECT COUNT(*) as count 
          FROM secrets 
          WHERE DATE(created_at) = DATE('now')
        `).get().count
      },
      
      // 分类和标签
      categories: db.prepare('SELECT COUNT(*) as count FROM categories').get().count,
      tags: db.prepare('SELECT COUNT(*) as count FROM tags').get().count,
      
      // 系统活动
      activity: {
        todayOperations: db.prepare(`
          SELECT COUNT(*) as count 
          FROM operation_logs 
          WHERE DATE(created_at) = DATE('now')
        `).get().count,
        weekLogins: db.prepare(`
          SELECT COUNT(*) as count 
          FROM login_logs 
          WHERE created_at >= datetime('now', '-7 days') AND status = 'success'
        `).get().count,
        failedLogins: db.prepare(`
          SELECT COUNT(*) as count 
          FROM login_logs 
          WHERE DATE(created_at) = DATE('now') AND status = 'failed'
        `).get().count
      },
      
      // 备份统计（容错处理）
      backups: (() => {
        try {
          return {
            total: db.prepare('SELECT COUNT(*) as count FROM backup_records WHERE status = "completed"').get().count,
            lastBackup: db.prepare('SELECT created_at FROM backup_records WHERE status = "completed" ORDER BY created_at DESC LIMIT 1').get()
          };
        } catch (e) {
          return { total: 0, lastBackup: null };
        }
      })(),
      
      // 邀请码统计（容错处理）
      invites: (() => {
        try {
          return {
            total: db.prepare('SELECT COUNT(*) as count FROM invite_codes').get().count,
            active: db.prepare('SELECT COUNT(*) as count FROM invite_codes WHERE is_active = 1').get().count,
            used: db.prepare('SELECT COUNT(*) as count FROM invite_code_usage').get().count
          };
        } catch (e) {
          return { total: 0, active: 0, used: 0 };
        }
      })(),
      
      // 最近30天的趋势（容错处理）
      trends: (() => {
        try {
          return {
            userGrowth: db.prepare(`
              SELECT DATE(created_at) as date, COUNT(*) as count
              FROM users
              WHERE created_at >= datetime('now', '-30 days')
              GROUP BY DATE(created_at)
              ORDER BY date DESC
            `).all(),
            secretGrowth: db.prepare(`
              SELECT DATE(created_at) as date, COUNT(*) as count
              FROM secrets
              WHERE created_at >= datetime('now', '-30 days')
              GROUP BY DATE(created_at)
              ORDER BY date DESC
            `).all(),
            loginActivity: db.prepare(`
              SELECT DATE(created_at) as date, COUNT(*) as count
              FROM login_logs
              WHERE created_at >= datetime('now', '-30 days') AND status = 'success'
              GROUP BY DATE(created_at)
              ORDER BY date DESC
            `).all()
          };
        } catch (e) {
          return { userGrowth: [], secretGrowth: [], loginActivity: [] };
        }
      })()
    };
    
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    res.status(500).json({ success: false, message: '获取统计数据失败' });
  }
};



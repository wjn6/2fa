/**
 * 系统配置和管理控制器
 */

const db = require('../database');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * 获取所有系统配置
 */
exports.getSettings = (req, res) => {
  try {
    const settings = db.prepare('SELECT * FROM system_settings ORDER BY key').all();
    
    // 转换为键值对格式
    const settingsMap = {};
    settings.forEach(setting => {
      settingsMap[setting.key] = {
        value: setting.value,
        description: setting.description,
        updated_at: setting.updated_at
      };
    });
    
    res.json({
      success: true,
      data: settingsMap
    });
  } catch (error) {
    console.error('获取系统配置失败:', error);
    res.status(500).json({ success: false, message: '获取系统配置失败' });
  }
};

/**
 * 更新系统配置
 */
exports.updateSettings = (req, res) => {
  try {
    const settings = req.body;
    
    const updateStmt = db.prepare(`
      UPDATE system_settings 
      SET value = ?, updated_at = datetime('now')
      WHERE key = ?
    `);
    
    const transaction = db.transaction((settingsToUpdate) => {
      for (const [key, value] of Object.entries(settingsToUpdate)) {
        updateStmt.run(value, key);
      }
    });
    
    transaction(settings);
    
    // 记录操作日志
    logOperation(req.user.id, req.user.username, '更新系统配置', 'system_settings', null, 
      JSON.stringify(settings), req.ip, req.get('user-agent'));
    
    res.json({ success: true, message: '系统配置更新成功' });
  } catch (error) {
    console.error('更新系统配置失败:', error);
    res.status(500).json({ success: false, message: '更新系统配置失败' });
  }
};

/**
 * 获取系统信息
 */
exports.getSystemInfo = (req, res) => {
  try {
    const os = require('os');
    const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/2fa.db');
    
    let dbSize = 0;
    try {
      const stats = fs.statSync(dbPath);
      dbSize = stats.size;
    } catch (err) {
      console.warn('无法获取数据库文件大小:', err.message);
    }
    
    const systemInfo = {
      // 系统信息
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      uptime: process.uptime(),
      
      // 内存信息
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      usedMemory: process.memoryUsage(),
      
      // 数据库信息
      databaseSize: dbSize,
      databasePath: dbPath,
      
      // CPU信息
      cpus: os.cpus().length,
      loadAverage: os.loadavg(),
      
      // 网络信息
      hostname: os.hostname(),
      networkInterfaces: Object.keys(os.networkInterfaces())
    };
    
    res.json({ success: true, data: systemInfo });
  } catch (error) {
    console.error('获取系统信息失败:', error);
    res.status(500).json({ success: false, message: '获取系统信息失败' });
  }
};

/**
 * 生成邀请码
 */
exports.generateInviteCode = (req, res) => {
  try {
    const { maxUses = 1, expiresIn = null } = req.body;
    
    // 生成唯一邀请码
    const code = crypto.randomBytes(8).toString('hex').toUpperCase();
    
    let expiresAt = null;
    if (expiresIn) {
      expiresAt = new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000).toISOString();
    }
    
    const result = db.prepare(`
      INSERT INTO invite_codes (code, max_uses, expires_at, created_by)
      VALUES (?, ?, ?, ?)
    `).run(code, maxUses, expiresAt, req.user.id);
    
    // 记录操作日志
    logOperation(req.user.id, req.user.username, '生成邀请码', 'invite_codes', result.lastInsertRowid,
      `code: ${code}, maxUses: ${maxUses}`, req.ip, req.get('user-agent'));
    
    res.json({
      success: true,
      data: {
        id: result.lastInsertRowid,
        code,
        maxUses,
        expiresAt
      }
    });
  } catch (error) {
    console.error('生成邀请码失败:', error);
    res.status(500).json({ success: false, message: '生成邀请码失败' });
  }
};

/**
 * 获取所有邀请码
 */
exports.getInviteCodes = (req, res) => {
  try {
    const inviteCodes = db.prepare(`
      SELECT 
        ic.*,
        u.username as creator_name,
        (SELECT COUNT(*) FROM invite_code_usage WHERE invite_code_id = ic.id) as used_count_actual
      FROM invite_codes ic
      LEFT JOIN users u ON ic.created_by = u.id
      ORDER BY ic.created_at DESC
    `).all();
    
    res.json({ success: true, data: inviteCodes });
  } catch (error) {
    console.error('获取邀请码列表失败:', error);
    res.status(500).json({ success: false, message: '获取邀请码列表失败' });
  }
};

/**
 * 删除邀请码
 */
exports.deleteInviteCode = (req, res) => {
  try {
    const { id } = req.params;
    
    const inviteCode = db.prepare('SELECT * FROM invite_codes WHERE id = ?').get(id);
    if (!inviteCode) {
      return res.status(404).json({ success: false, message: '邀请码不存在' });
    }
    
    db.prepare('DELETE FROM invite_codes WHERE id = ?').run(id);
    
    // 记录操作日志
    logOperation(req.user.id, req.user.username, '删除邀请码', 'invite_codes', id,
      `code: ${inviteCode.code}`, req.ip, req.get('user-agent'));
    
    res.json({ success: true, message: '邀请码删除成功' });
  } catch (error) {
    console.error('删除邀请码失败:', error);
    res.status(500).json({ success: false, message: '删除邀请码失败' });
  }
};

/**
 * 验证邀请码
 */
exports.validateInviteCode = (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ success: false, message: '请提供邀请码' });
    }
    
    const inviteCode = db.prepare(`
      SELECT * FROM invite_codes 
      WHERE code = ? AND is_active = 1
    `).get(code.toUpperCase());
    
    if (!inviteCode) {
      return res.json({ success: false, valid: false, message: '邀请码无效' });
    }
    
    // 检查是否过期
    if (inviteCode.expires_at && new Date(inviteCode.expires_at) < new Date()) {
      return res.json({ success: false, valid: false, message: '邀请码已过期' });
    }
    
    // 检查使用次数
    if (inviteCode.used_count >= inviteCode.max_uses) {
      return res.json({ success: false, valid: false, message: '邀请码已达到使用上限' });
    }
    
    res.json({ success: true, valid: true, message: '邀请码有效' });
  } catch (error) {
    console.error('验证邀请码失败:', error);
    res.status(500).json({ success: false, message: '验证邀请码失败' });
  }
};

/**
 * 获取操作日志
 */
exports.getOperationLogs = (req, res) => {
  try {
    const { page = 1, pageSize = 50, username, action, startDate, endDate } = req.query;
    const offset = (page - 1) * pageSize;
    
    let whereConditions = [];
    let params = [];
    
    if (username) {
      whereConditions.push('username LIKE ?');
      params.push(`%${username}%`);
    }
    
    if (action) {
      whereConditions.push('action LIKE ?');
      params.push(`%${action}%`);
    }
    
    if (startDate) {
      whereConditions.push('created_at >= ?');
      params.push(startDate);
    }
    
    if (endDate) {
      whereConditions.push('created_at <= ?');
      params.push(endDate);
    }
    
    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
    
    const logs = db.prepare(`
      SELECT * FROM operation_logs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, parseInt(pageSize), offset);
    
    const totalCount = db.prepare(`
      SELECT COUNT(*) as count FROM operation_logs ${whereClause}
    `).get(...params).count;
    
    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total: totalCount,
          totalPages: Math.ceil(totalCount / pageSize)
        }
      }
    });
  } catch (error) {
    console.error('获取操作日志失败:', error);
    res.status(500).json({ success: false, message: '获取操作日志失败' });
  }
};

/**
 * 获取登录日志
 */
exports.getLoginLogs = (req, res) => {
  try {
    const { page = 1, pageSize = 50, username, status, startDate, endDate } = req.query;
    const offset = (page - 1) * pageSize;
    
    let whereConditions = [];
    let params = [];
    
    if (username) {
      whereConditions.push('username LIKE ?');
      params.push(`%${username}%`);
    }
    
    if (status) {
      whereConditions.push('status = ?');
      params.push(status);
    }
    
    if (startDate) {
      whereConditions.push('created_at >= ?');
      params.push(startDate);
    }
    
    if (endDate) {
      whereConditions.push('created_at <= ?');
      params.push(endDate);
    }
    
    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
    
    const logs = db.prepare(`
      SELECT * FROM login_logs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, parseInt(pageSize), offset);
    
    const totalCount = db.prepare(`
      SELECT COUNT(*) as count FROM login_logs ${whereClause}
    `).get(...params).count;
    
    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total: totalCount,
          totalPages: Math.ceil(totalCount / pageSize)
        }
      }
    });
  } catch (error) {
    console.error('获取登录日志失败:', error);
    res.status(500).json({ success: false, message: '获取登录日志失败' });
  }
};

/**
 * 清理日志
 */
exports.cleanupLogs = (req, res) => {
  try {
    const { type, days = 90 } = req.body;
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    
    let deletedCount = 0;
    
    if (type === 'operation' || type === 'all') {
      const result = db.prepare('DELETE FROM operation_logs WHERE created_at < ?').run(cutoffDate);
      deletedCount += result.changes;
    }
    
    if (type === 'login' || type === 'all') {
      const result = db.prepare('DELETE FROM login_logs WHERE created_at < ?').run(cutoffDate);
      deletedCount += result.changes;
    }
    
    // 记录操作日志
    logOperation(req.user.id, req.user.username, '清理日志', 'logs', null,
      `type: ${type}, days: ${days}, deleted: ${deletedCount}`, req.ip, req.get('user-agent'));
    
    res.json({ success: true, message: `成功清理 ${deletedCount} 条日志` });
  } catch (error) {
    console.error('清理日志失败:', error);
    res.status(500).json({ success: false, message: '清理日志失败' });
  }
};

/**
 * 创建数据库备份
 */
exports.createBackup = (req, res) => {
  try {
    const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/2fa.db');
    const backupDir = path.join(__dirname, '../../data/backups');
    
    // 确保备份目录存在
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.db`;
    const backupPath = path.join(backupDir, filename);
    
    // 复制数据库文件
    fs.copyFileSync(dbPath, backupPath);
    
    const stats = fs.statSync(backupPath);
    
    // 记录备份
    const result = db.prepare(`
      INSERT INTO backup_records (filename, file_path, file_size, backup_type, created_by, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(filename, backupPath, stats.size, 'manual', req.user.id, 'completed');
    
    // 记录操作日志
    logOperation(req.user.id, req.user.username, '创建数据库备份', 'backup', result.lastInsertRowid,
      `filename: ${filename}`, req.ip, req.get('user-agent'));
    
    res.json({
      success: true,
      message: '备份创建成功',
      data: {
        id: result.lastInsertRowid,
        filename,
        fileSize: stats.size
      }
    });
  } catch (error) {
    console.error('创建备份失败:', error);
    res.status(500).json({ success: false, message: '创建备份失败' });
  }
};

/**
 * 获取备份列表
 */
exports.getBackups = (req, res) => {
  try {
    const backups = db.prepare(`
      SELECT 
        br.*,
        u.username as creator_name
      FROM backup_records br
      LEFT JOIN users u ON br.created_by = u.id
      ORDER BY br.created_at DESC
    `).all();
    
    res.json({ success: true, data: backups });
  } catch (error) {
    console.error('获取备份列表失败:', error);
    res.status(500).json({ success: false, message: '获取备份列表失败' });
  }
};

/**
 * 下载备份文件
 */
exports.downloadBackup = (req, res) => {
  try {
    const { id } = req.params;
    
    const backup = db.prepare('SELECT * FROM backup_records WHERE id = ?').get(id);
    if (!backup) {
      return res.status(404).json({ success: false, message: '备份不存在' });
    }
    
    if (!fs.existsSync(backup.file_path)) {
      return res.status(404).json({ success: false, message: '备份文件不存在' });
    }
    
    // 记录操作日志
    logOperation(req.user.id, req.user.username, '下载备份文件', 'backup', id,
      `filename: ${backup.filename}`, req.ip, req.get('user-agent'));
    
    res.download(backup.file_path, backup.filename);
  } catch (error) {
    console.error('下载备份失败:', error);
    res.status(500).json({ success: false, message: '下载备份失败' });
  }
};

/**
 * 删除备份
 */
exports.deleteBackup = (req, res) => {
  try {
    const { id } = req.params;
    
    const backup = db.prepare('SELECT * FROM backup_records WHERE id = ?').get(id);
    if (!backup) {
      return res.status(404).json({ success: false, message: '备份不存在' });
    }
    
    // 删除文件
    if (fs.existsSync(backup.file_path)) {
      fs.unlinkSync(backup.file_path);
    }
    
    // 删除记录
    db.prepare('DELETE FROM backup_records WHERE id = ?').run(id);
    
    // 记录操作日志
    logOperation(req.user.id, req.user.username, '删除备份', 'backup', id,
      `filename: ${backup.filename}`, req.ip, req.get('user-agent'));
    
    res.json({ success: true, message: '备份删除成功' });
  } catch (error) {
    console.error('删除备份失败:', error);
    res.status(500).json({ success: false, message: '删除备份失败' });
  }
};

/**
 * 辅助函数：记录操作日志
 */
function logOperation(userId, username, action, resourceType, resourceId, details, ip, userAgent) {
  try {
    // 检查是否启用操作日志
    const setting = db.prepare("SELECT value FROM system_settings WHERE key = 'enable_operation_log'").get();
    if (setting && setting.value === 'false') {
      return;
    }
    
    db.prepare(`
      INSERT INTO operation_logs (user_id, username, action, resource_type, resource_id, details, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, username, action, resourceType, resourceId, details, ip, userAgent);
  } catch (error) {
    console.error('记录操作日志失败:', error);
  }
}

// 导出日志记录函数供其他模块使用
exports.logOperation = logOperation;



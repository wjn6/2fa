/**
 * 数据导出控制器
 * 支持完整数据迁移（所有表数据 + 系统配置）
 */

const db = require('../database');
const path = require('path');
const fs = require('fs');

/**
 * 导出所有数据（完整迁移包）
 */
exports.exportAllData = (req, res) => {
  try {
    console.log('开始导出完整数据...');
    
    const exportData = {
      version: '2.6',
      exportTime: new Date().toISOString(),
      exportBy: req.user.username,
      
      // 1. 用户数据（不包含密码）
      users: db.prepare(`
        SELECT id, username, email, role, is_active, invite_code, last_ip, 
               login_count, failed_login_count, created_at, last_login
        FROM users
      `).all(),
      
      // 2. 分类数据
      categories: db.prepare('SELECT * FROM categories').all(),
      
      // 3. 标签数据
      tags: db.prepare('SELECT * FROM tags').all(),
      
      // 4. 密钥数据
      secrets: db.prepare('SELECT * FROM secrets').all(),
      
      // 5. 密钥-标签关联
      secretTags: db.prepare('SELECT * FROM secret_tags').all(),
      
      // 6. 邀请码数据
      inviteCodes: db.prepare('SELECT * FROM invite_codes').all(),
      
      // 7. 邀请码使用记录
      inviteCodeUsage: db.prepare('SELECT * FROM invite_code_usage').all(),
      
      // 8. 系统配置
      systemSettings: db.prepare('SELECT * FROM system_settings').all(),
      
      // 9. 备份记录
      backupRecords: db.prepare('SELECT * FROM backup_records').all(),
      
      // 10. 使用日志（最近1000条）
      usageLogs: db.prepare(`
        SELECT * FROM usage_logs 
        ORDER BY created_at DESC 
        LIMIT 1000
      `).all(),
      
      // 11. 操作日志（最近1000条）
      operationLogs: db.prepare(`
        SELECT * FROM operation_logs 
        ORDER BY created_at DESC 
        LIMIT 1000
      `).all(),
      
      // 12. 登录日志（最近1000条）
      loginLogs: db.prepare(`
        SELECT * FROM login_logs 
        ORDER BY created_at DESC 
        LIMIT 1000
      `).all(),
      
      // 统计信息
      statistics: {
        totalUsers: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
        totalSecrets: db.prepare('SELECT COUNT(*) as count FROM secrets').get().count,
        totalCategories: db.prepare('SELECT COUNT(*) as count FROM categories').get().count,
        totalTags: db.prepare('SELECT COUNT(*) as count FROM tags').get().count,
        totalInviteCodes: db.prepare('SELECT COUNT(*) as count FROM invite_codes').get().count
      }
    };
    
    // 记录操作日志
    db.prepare(`
      INSERT INTO operation_logs (user_id, username, action, resource_type, details, ip_address, user_agent, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id,
      req.user.username,
      '导出完整数据',
      'export',
      JSON.stringify({ tables: Object.keys(exportData).length }),
      req.ip,
      req.get('user-agent'),
      'success'
    );
    
    console.log('数据导出完成');
    
    // 设置响应头
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=2fa-export-${Date.now()}.json`);
    res.json(exportData);
    
  } catch (error) {
    console.error('导出数据失败:', error);
    
    // 记录失败日志
    try {
      db.prepare(`
        INSERT INTO operation_logs (user_id, username, action, resource_type, details, ip_address, user_agent, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        req.user.id,
        req.user.username,
        '导出完整数据',
        'export',
        JSON.stringify({ error: error.message }),
        req.ip,
        req.get('user-agent'),
        'failed'
      );
    } catch (logError) {
      console.error('记录日志失败:', logError);
    }
    
    res.status(500).json({ success: false, message: '导出数据失败：' + error.message });
  }
};

/**
 * 导出指定表的数据
 */
exports.exportTable = (req, res) => {
  try {
    const { table } = req.params;
    
    // 白名单检查
    const allowedTables = [
      'users', 'categories', 'tags', 'secrets', 'secret_tags',
      'invite_codes', 'invite_code_usage', 'system_settings',
      'usage_logs', 'operation_logs', 'login_logs', 'backup_records'
    ];
    
    if (!allowedTables.includes(table)) {
      return res.status(400).json({ success: false, message: '不支持的表名' });
    }
    
    // 特殊处理：用户表不导出密码
    let query = `SELECT * FROM ${table}`;
    if (table === 'users') {
      query = `SELECT id, username, email, role, is_active, invite_code, last_ip, 
                      login_count, failed_login_count, created_at, last_login FROM users`;
    }
    
    const data = db.prepare(query).all();
    
    const exportData = {
      version: '2.6',
      exportTime: new Date().toISOString(),
      exportBy: req.user.username,
      table: table,
      count: data.length,
      data: data
    };
    
    // 记录操作日志
    db.prepare(`
      INSERT INTO operation_logs (user_id, username, action, resource_type, details, ip_address, user_agent, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id,
      req.user.username,
      '导出表数据',
      'export',
      JSON.stringify({ table, count: data.length }),
      req.ip,
      req.get('user-agent'),
      'success'
    );
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=${table}-export-${Date.now()}.json`);
    res.json(exportData);
    
  } catch (error) {
    console.error('导出表数据失败:', error);
    res.status(500).json({ success: false, message: '导出表数据失败：' + error.message });
  }
};

/**
 * 导入完整数据（完整迁移恢复）
 */
exports.importAllData = (req, res) => {
  try {
    const { data, mode = 'merge' } = req.body; // mode: merge（合并）或 replace（替换）
    
    if (!data || !data.version) {
      return res.status(400).json({ success: false, message: '无效的导入数据' });
    }
    
    console.log(`开始导入数据（模式：${mode}）...`);
    
    // 开始事务
    const importTransaction = db.transaction(() => {
      let importedCounts = {};
      
      // 如果是替换模式，先清空相关表（保留admin用户）
      if (mode === 'replace') {
        console.log('替换模式：清空现有数据...');
        db.exec('DELETE FROM secret_tags');
        db.exec('DELETE FROM secrets WHERE user_id != 1');
        db.exec('DELETE FROM categories WHERE user_id != 1');
        db.exec('DELETE FROM tags WHERE user_id != 1');
        db.exec('DELETE FROM invite_code_usage');
        db.exec('DELETE FROM invite_codes');
        db.exec('DELETE FROM users WHERE id != 1');
      }
      
      // 导入用户（跳过ID=1的admin）
      if (data.users && Array.isArray(data.users)) {
        let userCount = 0;
        for (const user of data.users) {
          if (user.id === 1) continue; // 跳过admin
          
          try {
            if (mode === 'merge') {
              // 检查用户是否存在
              const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(user.username);
              if (existing) continue;
            }
            
            db.prepare(`
              INSERT INTO users (username, email, role, is_active, invite_code, last_ip, 
                                 login_count, failed_login_count, created_at, last_login)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
              user.username, user.email, user.role, user.is_active, user.invite_code,
              user.last_ip, user.login_count, user.failed_login_count,
              user.created_at, user.last_login
            );
            userCount++;
          } catch (err) {
            console.warn('导入用户失败:', user.username, err.message);
          }
        }
        importedCounts.users = userCount;
      }
      
      // 导入分类
      if (data.categories && Array.isArray(data.categories)) {
        let count = 0;
        for (const cat of data.categories) {
          try {
            if (mode === 'merge') {
              const existing = db.prepare('SELECT id FROM categories WHERE name = ? AND (user_id = ? OR user_id IS NULL)').get(cat.name, cat.user_id);
              if (existing) continue;
            }
            
            db.prepare(`
              INSERT INTO categories (user_id, name, description, icon, color, sort_order, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run(cat.user_id, cat.name, cat.description, cat.icon, cat.color, cat.sort_order, cat.created_at);
            count++;
          } catch (err) {
            console.warn('导入分类失败:', cat.name, err.message);
          }
        }
        importedCounts.categories = count;
      }
      
      // 导入标签
      if (data.tags && Array.isArray(data.tags)) {
        let count = 0;
        for (const tag of data.tags) {
          try {
            if (mode === 'merge') {
              const existing = db.prepare('SELECT id FROM tags WHERE name = ? AND (user_id = ? OR user_id IS NULL)').get(tag.name, tag.user_id);
              if (existing) continue;
            }
            
            db.prepare(`
              INSERT INTO tags (user_id, name, color, created_at)
              VALUES (?, ?, ?, ?)
            `).run(tag.user_id, tag.name, tag.color, tag.created_at);
            count++;
          } catch (err) {
            console.warn('导入标签失败:', tag.name, err.message);
          }
        }
        importedCounts.tags = count;
      }
      
      // 导入密钥
      if (data.secrets && Array.isArray(data.secrets)) {
        let count = 0;
        for (const secret of data.secrets) {
          try {
            db.prepare(`
              INSERT INTO secrets (user_id, name, secret_key, issuer, category_id, note, icon, icon_type,
                                   is_favorite, is_pinned, sort_order, use_count, last_used_at, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
              secret.user_id, secret.name, secret.secret_key, secret.issuer, secret.category_id,
              secret.note, secret.icon, secret.icon_type, secret.is_favorite, secret.is_pinned,
              secret.sort_order, secret.use_count, secret.last_used_at, secret.created_at, secret.updated_at
            );
            count++;
          } catch (err) {
            console.warn('导入密钥失败:', secret.name, err.message);
          }
        }
        importedCounts.secrets = count;
      }
      
      // 导入系统配置（合并模式）
      if (data.systemSettings && Array.isArray(data.systemSettings)) {
        let count = 0;
        for (const setting of data.systemSettings) {
          try {
            const existing = db.prepare('SELECT id FROM system_settings WHERE key = ?').get(setting.key);
            if (existing) {
              // 更新
              db.prepare('UPDATE system_settings SET value = ?, description = ? WHERE key = ?')
                .run(setting.value, setting.description, setting.key);
            } else {
              // 插入
              db.prepare('INSERT INTO system_settings (key, value, description) VALUES (?, ?, ?)')
                .run(setting.key, setting.value, setting.description);
            }
            count++;
          } catch (err) {
            console.warn('导入配置失败:', setting.key, err.message);
          }
        }
        importedCounts.systemSettings = count;
      }
      
      // 导入邀请码
      if (data.inviteCodes && Array.isArray(data.inviteCodes)) {
        let count = 0;
        for (const invite of data.inviteCodes) {
          try {
            if (mode === 'merge') {
              const existing = db.prepare('SELECT id FROM invite_codes WHERE code = ?').get(invite.code);
              if (existing) continue;
            }
            
            db.prepare(`
              INSERT INTO invite_codes (code, max_uses, used_count, expires_at, created_by, is_active, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run(invite.code, invite.max_uses, invite.used_count, invite.expires_at, invite.created_by, invite.is_active, invite.created_at);
            count++;
          } catch (err) {
            console.warn('导入邀请码失败:', invite.code, err.message);
          }
        }
        importedCounts.inviteCodes = count;
      }
      
      return importedCounts;
    });
    
    const result = importTransaction();
    
    // 记录操作日志
    db.prepare(`
      INSERT INTO operation_logs (user_id, username, action, resource_type, details, ip_address, user_agent, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id,
      req.user.username,
      '导入完整数据',
      'import',
      JSON.stringify({ mode, counts: result }),
      req.ip,
      req.get('user-agent'),
      'success'
    );
    
    console.log('数据导入完成:', result);
    res.json({ 
      success: true, 
      message: '数据导入成功',
      data: result
    });
    
  } catch (error) {
    console.error('导入数据失败:', error);
    res.status(500).json({ success: false, message: '导入数据失败：' + error.message });
  }
};

module.exports = exports;



const db = require('../database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 用户注册
exports.register = async (req, res) => {
  try {
    const { username, password, email } = req.body;

    // 验证输入
    if (!username || !password) {
      return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
    }

    if (username.length < 3) {
      return res.status(400).json({ success: false, message: '用户名至少3个字符' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: '密码至少6个字符' });
    }

    // 检查用户名是否已存在
    const existingUser = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (existingUser) {
      return res.status(400).json({ success: false, message: '用户名已被使用' });
    }

    // 检查邮箱是否已存在
    if (email) {
      const existingEmail = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
      if (existingEmail) {
        return res.status(400).json({ success: false, message: '邮箱已被使用' });
      }
    }

    // 加密密码
    const hashedPassword = bcrypt.hashSync(password, 10);

    // 创建用户
    const result = db.prepare(`
      INSERT INTO users (username, password, email, role, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).run(username, hashedPassword, email || null, 'user', 1);

    // 为新用户创建默认分类
    db.prepare(`
      INSERT INTO categories (user_id, name, description, icon, color)
      VALUES (?, ?, ?, ?, ?)
    `).run(result.lastInsertRowid, '未分类', '默认分类', 'folder', '#1890ff');

    res.json({
      success: true,
      message: '注册成功',
      data: {
        id: result.lastInsertRowid,
        username,
        email
      }
    });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({ success: false, message: '注册失败：' + error.message });
  }
};

// 用户登录
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    if (!username || !password) {
      return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
    }

    // 查找用户
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user) {
      // 记录失败的登录尝试
      recordLoginLog(null, username, 'password', 'failed', ip, userAgent, '用户不存在');
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }

    // 检查账户锁定状态
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      recordLoginLog(user.id, username, 'password', 'failed', ip, userAgent, '账户已锁定');
      return res.status(403).json({ 
        success: false, 
        message: '账户已被锁定，请稍后再试' 
      });
    }

    // 检查用户是否被禁用
    if (!user.is_active) {
      recordLoginLog(user.id, username, 'password', 'failed', ip, userAgent, '账户已禁用');
      return res.status(403).json({ success: false, message: '账号已被禁用，请联系管理员' });
    }

    // 验证密码
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      // 增加失败次数
      const failedCount = (user.failed_login_count || 0) + 1;
      const maxAttempts = 5; // 可配置
      
      if (failedCount >= maxAttempts) {
        // 锁定账户30分钟
        const lockUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString();
        db.prepare('UPDATE users SET failed_login_count = ?, locked_until = ? WHERE id = ?')
          .run(failedCount, lockUntil, user.id);
        recordLoginLog(user.id, username, 'password', 'failed', ip, userAgent, '密码错误，账户已锁定');
        return res.status(401).json({ 
          success: false, 
          message: '密码错误次数过多，账户已被锁定30分钟' 
        });
      } else {
        db.prepare('UPDATE users SET failed_login_count = ? WHERE id = ?').run(failedCount, user.id);
        recordLoginLog(user.id, username, 'password', 'failed', ip, userAgent, '密码错误');
        return res.status(401).json({ 
          success: false, 
          message: `用户名或密码错误，剩余尝试次数：${maxAttempts - failedCount}` 
        });
      }
    }

    // 登录成功，重置失败次数
    db.prepare(`
      UPDATE users 
      SET last_login = datetime('now'), 
          login_count = login_count + 1,
          failed_login_count = 0, 
          locked_until = NULL,
          last_ip = ?
      WHERE id = ?
    `).run(ip, user.id);

    // 生成 JWT Token
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    // 记录成功的登录
    recordLoginLog(user.id, username, 'password', 'success', ip, userAgent);

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ success: false, message: '登录失败：' + error.message });
  }
};

// 获取当前用户信息
exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = db.prepare(`
      SELECT id, username, email, role, is_active, created_at, last_login
      FROM users WHERE id = ?
    `).get(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    // 获取用户统计信息
    const secretCount = db.prepare('SELECT COUNT(*) as count FROM secrets WHERE user_id = ?').get(userId).count;
    const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories WHERE user_id = ?').get(userId).count;
    const tagCount = db.prepare('SELECT COUNT(*) as count FROM tags WHERE user_id = ?').get(userId).count;

    res.json({
      success: true,
      data: {
        ...user,
        stats: {
          secretCount,
          categoryCount,
          tagCount
        }
      }
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({ success: false, message: '获取用户信息失败' });
  }
};

// 修改密码
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: '旧密码和新密码不能为空' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: '新密码至少6个字符' });
    }

    // 获取用户当前密码
    const user = db.prepare('SELECT password FROM users WHERE id = ?').get(userId);
    
    // 验证旧密码
    const isPasswordValid = bcrypt.compareSync(oldPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: '旧密码错误' });
    }

    // 加密新密码
    const hashedPassword = bcrypt.hashSync(newPassword, 10);

    // 更新密码
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, userId);

    res.json({ success: true, message: '密码修改成功' });
  } catch (error) {
    console.error('修改密码失败:', error);
    res.status(500).json({ success: false, message: '修改密码失败' });
  }
};

// 更新用户信息
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { email } = req.body;

    // 如果有邮箱，检查是否已被其他用户使用
    if (email) {
      const existingEmail = db.prepare('SELECT * FROM users WHERE email = ? AND id != ?').get(email, userId);
      if (existingEmail) {
        return res.status(400).json({ success: false, message: '邮箱已被使用' });
      }
    }

    db.prepare('UPDATE users SET email = ? WHERE id = ?').run(email || null, userId);

    res.json({ success: true, message: '信息更新成功' });
  } catch (error) {
    console.error('更新信息失败:', error);
    res.status(500).json({ success: false, message: '更新信息失败' });
  }
};

/**
 * 辅助函数：记录登录日志
 */
function recordLoginLog(userId, username, loginType, status, ipAddress, userAgent, failureReason = null) {
  try {
    db.prepare(`
      INSERT INTO login_logs (user_id, username, login_type, status, ip_address, user_agent, failure_reason)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(userId, username, loginType, status, ipAddress, userAgent, failureReason);
  } catch (error) {
    console.error('记录登录日志失败:', error);
  }
}



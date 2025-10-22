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

    if (!username || !password) {
      return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
    }

    // 查找用户
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }

    // 检查用户是否被禁用
    if (!user.is_active) {
      return res.status(403).json({ success: false, message: '账号已被禁用，请联系管理员' });
    }

    // 验证密码
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }

    // 更新最后登录时间
    db.prepare('UPDATE users SET last_login = datetime(\'now\') WHERE id = ?').run(user.id);

    // 生成 JWT Token
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

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


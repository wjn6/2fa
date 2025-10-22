const jwt = require('jsonwebtoken');
const db = require('../database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 验证 JWT Token
exports.authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ success: false, message: '未提供认证令牌' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ success: false, message: '令牌无效或已过期' });
      }

      // 检查用户是否仍然存在且激活
      const dbUser = db.prepare('SELECT id, username, role, is_active FROM users WHERE id = ?').get(user.id);
      
      if (!dbUser) {
        return res.status(404).json({ success: false, message: '用户不存在' });
      }

      if (!dbUser.is_active) {
        return res.status(403).json({ success: false, message: '账号已被禁用' });
      }

      req.user = dbUser;
      next();
    });
  } catch (error) {
    console.error('认证错误:', error);
    res.status(500).json({ success: false, message: '认证失败' });
  }
};

// 验证管理员权限
exports.requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: '需要管理员权限' });
  }
  next();
};

// 验证用户权限（只能访问自己的资源）
exports.checkResourceOwnership = (resourceType) => {
  return (req, res, next) => {
    try {
      const userId = req.user.id;
      const resourceId = req.params.id;

      // 管理员可以访问所有资源
      if (req.user.role === 'admin') {
        return next();
      }

      // 检查资源是否属于当前用户
      let query;
      switch (resourceType) {
        case 'secret':
          query = 'SELECT user_id FROM secrets WHERE id = ?';
          break;
        case 'category':
          query = 'SELECT user_id FROM categories WHERE id = ?';
          break;
        case 'tag':
          query = 'SELECT user_id FROM tags WHERE id = ?';
          break;
        default:
          return res.status(400).json({ success: false, message: '无效的资源类型' });
      }

      const resource = db.prepare(query).get(resourceId);

      if (!resource) {
        return res.status(404).json({ success: false, message: '资源不存在' });
      }

      if (resource.user_id !== userId) {
        return res.status(403).json({ success: false, message: '无权访问此资源' });
      }

      next();
    } catch (error) {
      console.error('权限检查错误:', error);
      res.status(500).json({ success: false, message: '权限检查失败' });
    }
  };
};



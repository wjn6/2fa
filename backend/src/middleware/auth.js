const jwt = require('jsonwebtoken');
const db = require('../database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * 验证用户登录（后台管理）
 */
function authenticateUser(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, message: '未登录' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, username, email, role FROM users WHERE id = ? AND is_active = 1').get(decoded.userId);

    if (!user) {
      return res.status(401).json({ success: false, message: '用户不存在或已被禁用' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: '认证失败' });
  }
}

/**
 * 验证管理员权限
 */
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: '需要管理员权限' });
  }
  next();
}

/**
 * 验证主密码已解锁
 */
function requireUnlocked(req, res, next) {
  const sessionToken = req.headers['x-session-token'];
  
  if (!sessionToken) {
    return res.status(423).json({ success: false, message: '需要解锁', locked: true });
  }

  const session = db.prepare('SELECT * FROM sessions WHERE session_token = ? AND expires_at > datetime(\'now\')').get(sessionToken);
  
  if (!session || !session.is_unlocked) {
    return res.status(423).json({ success: false, message: '需要解锁', locked: true });
  }

  req.session = session;
  next();
}

/**
 * 生成JWT token
 */
function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

module.exports = {
  authenticateUser,
  requireAdmin,
  requireUnlocked,
  generateToken,
  JWT_SECRET
};



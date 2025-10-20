const db = require('../database');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { generateToken } = require('../middleware/auth');
const { deriveKey, generateSalt } = require('../utils/encryption');

// 用户登录（后台管理）
exports.login = (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }

    const isValid = bcrypt.compareSync(password, user.password);

    if (!isValid) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }

    // 更新最后登录时间
    db.prepare('UPDATE users SET last_login = datetime(\'now\') WHERE id = ?').run(user.id);

    const token = generateToken(user.id);

    res.json({
      success: true,
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
    res.status(500).json({ success: false, message: error.message });
  }
};

// 检查是否已设置主密码
exports.checkMasterPassword = (req, res) => {
  try {
    const masterPassword = db.prepare('SELECT * FROM master_password LIMIT 1').get();
    res.json({
      success: true,
      data: {
        hasPassword: !!masterPassword
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 设置主密码
exports.setMasterPassword = (req, res) => {
  try {
    const { password, hint } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: '密码至少6位' });
    }

    // 检查是否已存在主密码
    const existing = db.prepare('SELECT * FROM master_password LIMIT 1').get();
    if (existing) {
      return res.status(400).json({ success: false, message: '主密码已存在' });
    }

    const salt = generateSalt();
    const derivedKey = deriveKey(password, salt);
    const passwordHash = bcrypt.hashSync(derivedKey, 10);

    db.prepare('INSERT INTO master_password (password_hash, salt, hint) VALUES (?, ?, ?)').run(
      passwordHash, salt, hint || ''
    );

    res.json({ success: true, message: '主密码设置成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 验证主密码并创建会话
exports.unlockWithMasterPassword = (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: '请输入密码' });
    }

    const masterPassword = db.prepare('SELECT * FROM master_password LIMIT 1').get();

    if (!masterPassword) {
      return res.status(400).json({ success: false, message: '未设置主密码' });
    }

    const derivedKey = deriveKey(password, masterPassword.salt);
    const isValid = bcrypt.compareSync(derivedKey, masterPassword.password_hash);

    if (!isValid) {
      return res.status(401).json({ success: false, message: '密码错误' });
    }

    // 创建会话
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24小时

    db.prepare(`
      INSERT INTO sessions (session_token, is_unlocked, expires_at) 
      VALUES (?, 1, ?)
    `).run(sessionToken, expiresAt.toISOString());

    res.json({
      success: true,
      data: {
        sessionToken,
        expiresAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 修改主密码
exports.changeMasterPassword = (req, res) => {
  try {
    const { oldPassword, newPassword, hint } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: '旧密码和新密码不能为空' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: '新密码至少6位' });
    }

    const masterPassword = db.prepare('SELECT * FROM master_password LIMIT 1').get();

    if (!masterPassword) {
      return res.status(400).json({ success: false, message: '未设置主密码' });
    }

    // 验证旧密码
    const oldDerivedKey = deriveKey(oldPassword, masterPassword.salt);
    const isValid = bcrypt.compareSync(oldDerivedKey, masterPassword.password_hash);

    if (!isValid) {
      return res.status(401).json({ success: false, message: '旧密码错误' });
    }

    // 设置新密码
    const newSalt = generateSalt();
    const newDerivedKey = deriveKey(newPassword, newSalt);
    const newPasswordHash = bcrypt.hashSync(newDerivedKey, 10);

    db.prepare(`
      UPDATE master_password 
      SET password_hash = ?, salt = ?, hint = ?, updated_at = datetime('now') 
      WHERE id = ?
    `).run(newPasswordHash, newSalt, hint || '', masterPassword.id);

    // 清除所有会话
    db.prepare('DELETE FROM sessions').run();

    res.json({ success: true, message: '主密码修改成功，请重新解锁' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 锁定（清除会话）
exports.lock = (req, res) => {
  try {
    const sessionToken = req.headers['x-session-token'];
    
    if (sessionToken) {
      db.prepare('DELETE FROM sessions WHERE session_token = ?').run(sessionToken);
    }

    res.json({ success: true, message: '已锁定' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 获取密码提示
exports.getPasswordHint = (req, res) => {
  try {
    const masterPassword = db.prepare('SELECT hint FROM master_password LIMIT 1').get();
    
    res.json({
      success: true,
      data: {
        hint: masterPassword?.hint || ''
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



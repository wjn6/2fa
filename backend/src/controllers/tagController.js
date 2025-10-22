const db = require('../database');

// 获取所有标签
exports.getAllTags = (req, res) => {
  try {
    const userId = req.user?.id || null;
    
    // 只获取用户自己的标签
    let query = `
      SELECT t.*, 
        (SELECT COUNT(*) FROM secret_tags st 
         INNER JOIN secrets s ON st.secret_id = s.id 
         WHERE st.tag_id = t.id AND s.user_id = ?) as secret_count
      FROM tags t
      WHERE t.user_id = ?
      ORDER BY t.created_at DESC
    `;
    const params = [userId || 1, userId || 1];

    const tags = db.prepare(query).all(...params);

    res.json({ success: true, data: tags });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 创建标签
exports.createTag = (req, res) => {
  try {
    const { name, color } = req.body;
    const userId = req.user?.id || 1;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: '标签名称不能为空' });
    }

    const result = db.prepare('INSERT INTO tags (user_id, name, color) VALUES (?, ?, ?)').run(
      userId,
      name, 
      color || '#1890ff'
    );

    const newTag = db.prepare('SELECT * FROM tags WHERE id = ?').get(result.lastInsertRowid);

    res.json({ success: true, data: newTag });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ success: false, message: '标签名称已存在' });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

// 更新标签
exports.updateTag = (req, res) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;
    const userId = req.user?.id || null;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: '标签名称不能为空' });
    }

    // 权限检查：非管理员只能修改自己的标签
    if (userId && req.user?.role !== 'admin') {
      const tag = db.prepare('SELECT user_id FROM tags WHERE id = ?').get(id);
      if (!tag) {
        return res.status(404).json({ success: false, message: '标签不存在' });
      }
      if (tag.user_id !== userId) {
        return res.status(403).json({ success: false, message: '无权修改此标签' });
      }
    }

    const result = db.prepare('UPDATE tags SET name = ?, color = ? WHERE id = ?').run(
      name, 
      color || '#1890ff', 
      id
    );

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: '标签不存在' });
    }

    const updatedTag = db.prepare('SELECT * FROM tags WHERE id = ?').get(id);

    res.json({ success: true, data: updatedTag });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ success: false, message: '标签名称已存在' });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

// 删除标签
exports.deleteTag = (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || null;

    // 权限检查：非管理员只能删除自己的标签
    if (userId && req.user?.role !== 'admin') {
      const tag = db.prepare('SELECT user_id FROM tags WHERE id = ?').get(id);
      if (!tag) {
        return res.status(404).json({ success: false, message: '标签不存在' });
      }
      if (tag.user_id !== userId) {
        return res.status(403).json({ success: false, message: '无权删除此标签' });
      }
    }

    // 删除标签会自动删除关联（CASCADE）
    const result = db.prepare('DELETE FROM tags WHERE id = ?').run(id);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: '标签不存在' });
    }

    res.json({ success: true, message: '标签已删除' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 获取标签下的密钥
exports.getSecretsByTag = (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || null;

    let query = `
      SELECT s.*, c.name as category_name
      FROM secrets s
      INNER JOIN secret_tags st ON s.id = st.secret_id
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE st.tag_id = ?
    `;
    const params = [id];

    // 权限过滤：非管理员只能看到自己的密钥
    if (userId && req.user?.role !== 'admin') {
      query += ' AND s.user_id = ?';
      params.push(userId);
    }

    query += ' ORDER BY s.updated_at DESC';

    const secrets = db.prepare(query).all(...params);

    res.json({ success: true, data: secrets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

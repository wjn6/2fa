const db = require('../database');

// 获取所有标签
exports.getAllTags = (req, res) => {
  try {
    const tags = db.prepare(`
      SELECT t.*, 
        (SELECT COUNT(*) FROM secret_tags WHERE tag_id = t.id) as secret_count
      FROM tags t
      ORDER BY t.created_at DESC
    `).all();

    res.json({ success: true, data: tags });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 创建标签
exports.createTag = (req, res) => {
  try {
    const { name, color } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: '标签名称不能为空' });
    }

    const result = db.prepare('INSERT INTO tags (name, color) VALUES (?, ?)').run(
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

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: '标签名称不能为空' });
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

    const secrets = db.prepare(`
      SELECT s.*, c.name as category_name
      FROM secrets s
      INNER JOIN secret_tags st ON s.id = st.secret_id
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE st.tag_id = ?
      ORDER BY s.updated_at DESC
    `).all(id);

    res.json({ success: true, data: secrets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



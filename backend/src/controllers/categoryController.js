const db = require('../database');

// 获取所有分类
exports.getAllCategories = (req, res) => {
  try {
    const userId = req.user?.id || null;
    
    // 获取全局分类（user_id = NULL）和用户自己的分类
    let query = 'SELECT * FROM categories WHERE user_id IS NULL';
    const params = [];
    
    if (userId) {
      query += ' OR user_id = ?';
      params.push(userId);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const categories = db.prepare(query).all(...params);
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 创建分类
exports.createCategory = (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.user?.id || null;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: '分类名称不能为空' });
    }

    // 普通用户创建私有分类，管理员可以创建全局分类（user_id = NULL）
    const result = db.prepare('INSERT INTO categories (user_id, name, description) VALUES (?, ?, ?)').run(userId, name, description || '');
    
    const newCategory = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
    res.json({ success: true, data: newCategory });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ success: false, message: '分类名称已存在' });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

// 更新分类
exports.updateCategory = (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const userId = req.user?.id || null;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: '分类名称不能为空' });
    }

    // 权限检查：非管理员只能修改自己的分类
    if (userId && req.user?.role !== 'admin') {
      const category = db.prepare('SELECT user_id FROM categories WHERE id = ?').get(id);
      if (!category) {
        return res.status(404).json({ success: false, message: '分类不存在' });
      }
      if (category.user_id !== userId) {
        return res.status(403).json({ success: false, message: '无权修改此分类' });
      }
    }

    const result = db.prepare('UPDATE categories SET name = ?, description = ? WHERE id = ?').run(name, description || '', id);
    
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: '分类不存在' });
    }

    const updatedCategory = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    res.json({ success: true, data: updatedCategory });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ success: false, message: '分类名称已存在' });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

// 删除分类
exports.deleteCategory = (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || null;

    // 检查是否是默认分类
    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    if (!category) {
      return res.status(404).json({ success: false, message: '分类不存在' });
    }
    
    if (category.name === '未分类') {
      return res.status(400).json({ success: false, message: '不能删除默认分类' });
    }

    // 权限检查：非管理员只能删除自己的分类
    if (userId && req.user?.role !== 'admin' && category.user_id !== userId) {
      return res.status(403).json({ success: false, message: '无权删除此分类' });
    }

    // 将该分类下的密钥移到用户的默认分类
    let defaultCategory;
    if (userId) {
      defaultCategory = db.prepare('SELECT id FROM categories WHERE name = ? AND user_id = ?').get('未分类', userId);
      if (!defaultCategory) {
        // 如果用户没有默认分类，创建一个
        const result = db.prepare('INSERT INTO categories (user_id, name, description) VALUES (?, ?, ?)').run(userId, '未分类', '默认分类');
        defaultCategory = { id: result.lastInsertRowid };
      }
    } else {
      defaultCategory = db.prepare('SELECT id FROM categories WHERE name = ? AND user_id IS NULL').get('未分类');
    }
    
    db.prepare('UPDATE secrets SET category_id = ? WHERE category_id = ?').run(defaultCategory.id, id);

    const result = db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: '分类不存在' });
    }

    res.json({ success: true, message: '分类已删除' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



const db = require('../database');

// 获取所有分类
exports.getAllCategories = (req, res) => {
  try {
    const categories = db.prepare('SELECT * FROM categories ORDER BY created_at DESC').all();
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 创建分类
exports.createCategory = (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: '分类名称不能为空' });
    }

    const result = db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)').run(name, description || '');
    
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

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: '分类名称不能为空' });
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

    // 检查是否是默认分类
    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    if (category && category.name === '未分类') {
      return res.status(400).json({ success: false, message: '不能删除默认分类' });
    }

    // 将该分类下的密钥移到未分类
    const defaultCategory = db.prepare('SELECT id FROM categories WHERE name = ?').get('未分类');
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


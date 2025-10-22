/**
 * 邮件控制器
 */

const db = require('../database');
const emailService = require('../services/emailService');

/**
 * 获取邮件配置
 */
exports.getEmailConfig = (req, res) => {
  try {
    const settings = db.prepare('SELECT key, value, description FROM system_settings WHERE key LIKE "smtp_%"').all();
    
    const config = {};
    settings.forEach(s => {
      config[s.key] = s.value || '';
    });

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('获取邮件配置失败:', error);
    res.status(500).json({ success: false, message: '获取邮件配置失败' });
  }
};

/**
 * 更新邮件配置
 */
exports.updateEmailConfig = (req, res) => {
  try {
    const { smtp_host, smtp_port, smtp_secure, smtp_user, smtp_pass, smtp_from_name } = req.body;

    emailService.updateEmailConfig({
      smtp_host,
      smtp_port,
      smtp_secure,
      smtp_user,
      smtp_pass,
      smtp_from_name
    });

    // 记录操作日志
    db.prepare(`
      INSERT INTO operation_logs (user_id, username, action, resource_type, details, ip_address, user_agent, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id,
      req.user.username,
      '更新邮件配置',
      'email_config',
      null,
      req.ip,
      req.get('user-agent'),
      'success'
    );

    res.json({
      success: true,
      message: '邮件配置已更新'
    });
  } catch (error) {
    console.error('更新邮件配置失败:', error);
    res.status(500).json({ success: false, message: '更新邮件配置失败' });
  }
};

/**
 * 测试邮件连接
 */
exports.testEmail = async (req, res) => {
  try {
    const result = await emailService.testConnection();
    res.json(result);
  } catch (error) {
    console.error('测试邮件连接失败:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 发送测试邮件
 */
exports.sendTestEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: '请提供收件人邮箱' });
    }

    await emailService.sendEmail(
      email,
      '测试邮件 - 2FA Notebook',
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #0052D9;">测试邮件</h2>
          <p>这是一封来自 2FA Notebook 的测试邮件。</p>
          <p>如果您收到此邮件，说明邮件服务配置正确！</p>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            发送时间：${new Date().toLocaleString('zh-CN')}
          </p>
        </div>
      `
    );

    res.json({
      success: true,
      message: '测试邮件已发送'
    });
  } catch (error) {
    console.error('发送测试邮件失败:', error);
    res.status(500).json({ success: false, message: '发送测试邮件失败：' + error.message });
  }
};

/**
 * 获取所有邮件模板
 */
exports.getEmailTemplates = (req, res) => {
  try {
    const templates = db.prepare('SELECT * FROM email_templates ORDER BY created_at DESC').all();
    
    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('获取邮件模板失败:', error);
    res.status(500).json({ success: false, message: '获取邮件模板失败' });
  }
};

/**
 * 获取单个邮件模板
 */
exports.getEmailTemplate = (req, res) => {
  try {
    const { id } = req.params;
    const template = db.prepare('SELECT * FROM email_templates WHERE id = ?').get(id);

    if (!template) {
      return res.status(404).json({ success: false, message: '模板不存在' });
    }

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('获取邮件模板失败:', error);
    res.status(500).json({ success: false, message: '获取邮件模板失败' });
  }
};

/**
 * 创建邮件模板
 */
exports.createEmailTemplate = (req, res) => {
  try {
    const { type, name, subject, content, description } = req.body;

    if (!type || !name || !subject || !content) {
      return res.status(400).json({ success: false, message: '请填写完整信息' });
    }

    const result = db.prepare(`
      INSERT INTO email_templates (type, name, subject, content, description, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(type, name, subject, content, description, req.user.id);

    // 记录操作日志
    db.prepare(`
      INSERT INTO operation_logs (user_id, username, action, resource_type, resource_id, details, ip_address, user_agent, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id,
      req.user.username,
      '创建邮件模板',
      'email_template',
      result.lastInsertRowid,
      JSON.stringify({ name, type }),
      req.ip,
      req.get('user-agent'),
      'success'
    );

    res.json({
      success: true,
      message: '邮件模板创建成功',
      data: { id: result.lastInsertRowid }
    });
  } catch (error) {
    console.error('创建邮件模板失败:', error);
    res.status(500).json({ success: false, message: '创建邮件模板失败' });
  }
};

/**
 * 更新邮件模板
 */
exports.updateEmailTemplate = (req, res) => {
  try {
    const { id } = req.params;
    const { name, subject, content, description, is_active } = req.body;

    const template = db.prepare('SELECT * FROM email_templates WHERE id = ?').get(id);
    if (!template) {
      return res.status(404).json({ success: false, message: '模板不存在' });
    }

    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (subject !== undefined) {
      updates.push('subject = ?');
      values.push(subject);
    }
    if (content !== undefined) {
      updates.push('content = ?');
      values.push(content);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: '没有要更新的字段' });
    }

    updates.push('updated_at = datetime("now")');
    values.push(id);

    db.prepare(`
      UPDATE email_templates 
      SET ${updates.join(', ')}
      WHERE id = ?
    `).run(...values);

    // 记录操作日志
    db.prepare(`
      INSERT INTO operation_logs (user_id, username, action, resource_type, resource_id, details, ip_address, user_agent, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id,
      req.user.username,
      '更新邮件模板',
      'email_template',
      id,
      JSON.stringify({ name }),
      req.ip,
      req.get('user-agent'),
      'success'
    );

    res.json({
      success: true,
      message: '邮件模板更新成功'
    });
  } catch (error) {
    console.error('更新邮件模板失败:', error);
    res.status(500).json({ success: false, message: '更新邮件模板失败' });
  }
};

/**
 * 删除邮件模板
 */
exports.deleteEmailTemplate = (req, res) => {
  try {
    const { id } = req.params;

    const template = db.prepare('SELECT * FROM email_templates WHERE id = ?').get(id);
    if (!template) {
      return res.status(404).json({ success: false, message: '模板不存在' });
    }

    db.prepare('DELETE FROM email_templates WHERE id = ?').run(id);

    // 记录操作日志
    db.prepare(`
      INSERT INTO operation_logs (user_id, username, action, resource_type, resource_id, details, ip_address, user_agent, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id,
      req.user.username,
      '删除邮件模板',
      'email_template',
      id,
      JSON.stringify({ name: template.name }),
      req.ip,
      req.get('user-agent'),
      'success'
    );

    res.json({
      success: true,
      message: '邮件模板删除成功'
    });
  } catch (error) {
    console.error('删除邮件模板失败:', error);
    res.status(500).json({ success: false, message: '删除邮件模板失败' });
  }
};

module.exports = exports;



/**
 * 邮件服务
 * 负责发送各类系统邮件
 */

const nodemailer = require('nodemailer');
const db = require('../database');

// 邮件发送器实例
let transporter = null;

/**
 * 初始化邮件发送器
 */
function initTransporter() {
  try {
    // 从数据库获取SMTP配置
    const config = getEmailConfig();
    
    if (!config.smtp_host || !config.smtp_user) {
      console.warn('邮件配置未设置，邮件功能不可用');
      return null;
    }

    transporter = nodemailer.createTransport({
      host: config.smtp_host,
      port: parseInt(config.smtp_port) || 587,
      secure: config.smtp_secure === '1', // true for 465, false for other ports
      auth: {
        user: config.smtp_user,
        pass: config.smtp_pass
      }
    });

    console.log('✓ 邮件服务已初始化');
    return transporter;
  } catch (error) {
    console.error('初始化邮件服务失败:', error);
    return null;
  }
}

/**
 * 获取邮件配置
 */
function getEmailConfig() {
  const settings = db.prepare('SELECT key, value FROM system_settings WHERE key LIKE "smtp_%"').all();
  const config = {};
  settings.forEach(s => {
    config[s.key] = s.value;
  });
  return config;
}

/**
 * 测试邮件连接
 */
async function testConnection() {
  try {
    const transport = transporter || initTransporter();
    if (!transport) {
      return { success: false, message: '邮件配置未设置' };
    }

    await transport.verify();
    return { success: true, message: '邮件服务连接成功' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * 发送邮件
 */
async function sendEmail(to, subject, html, text = '') {
  try {
    const transport = transporter || initTransporter();
    if (!transport) {
      throw new Error('邮件服务未配置');
    }

    const config = getEmailConfig();
    
    const info = await transport.sendMail({
      from: `"${config.smtp_from_name || '2FA Notebook'}" <${config.smtp_user}>`,
      to: to,
      subject: subject,
      text: text || subject,
      html: html
    });

    console.log('邮件发送成功:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('邮件发送失败:', error);
    throw error;
  }
}

/**
 * 发送欢迎邮件
 */
async function sendWelcomeEmail(user) {
  const template = getEmailTemplate('welcome');
  const html = renderTemplate(template.content, {
    username: user.username,
    email: user.email,
    loginUrl: process.env.APP_URL || 'http://localhost:5555'
  });

  return await sendEmail(user.email, template.subject, html);
}

/**
 * 发送密码重置邮件
 */
async function sendPasswordResetEmail(user, newPassword) {
  const template = getEmailTemplate('password_reset');
  const html = renderTemplate(template.content, {
    username: user.username,
    newPassword: newPassword,
    loginUrl: process.env.APP_URL || 'http://localhost:5555'
  });

  return await sendEmail(user.email, template.subject, html);
}

/**
 * 发送登录异常提醒
 */
async function sendLoginAlertEmail(user, ipAddress, userAgent) {
  const template = getEmailTemplate('login_alert');
  const html = renderTemplate(template.content, {
    username: user.username,
    ipAddress: ipAddress,
    userAgent: userAgent,
    time: new Date().toLocaleString('zh-CN')
  });

  return await sendEmail(user.email, template.subject, html);
}

/**
 * 发送系统通知邮件
 */
async function sendSystemNotification(user, message) {
  const template = getEmailTemplate('system_notification');
  const html = renderTemplate(template.content, {
    username: user.username,
    message: message,
    time: new Date().toLocaleString('zh-CN')
  });

  return await sendEmail(user.email, template.subject, html);
}

/**
 * 获取邮件模板
 */
function getEmailTemplate(type) {
  let template = db.prepare('SELECT * FROM email_templates WHERE type = ? AND is_active = 1').get(type);
  
  // 如果没有自定义模板，使用默认模板
  if (!template) {
    template = getDefaultTemplate(type);
  }
  
  return template;
}

/**
 * 默认邮件模板
 */
function getDefaultTemplate(type) {
  const templates = {
    welcome: {
      subject: '欢迎使用 2FA Notebook',
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #0052D9;">欢迎加入 2FA Notebook！</h2>
          <p>您好，{{username}}！</p>
          <p>感谢您注册 2FA Notebook。您现在可以开始管理您的两步验证密钥了。</p>
          <p>
            <a href="{{loginUrl}}" style="display: inline-block; padding: 12px 24px; background: #0052D9; color: white; text-decoration: none; border-radius: 4px;">
              立即登录
            </a>
          </p>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            如果您没有注册此账号，请忽略此邮件。
          </p>
        </div>
      `
    },
    password_reset: {
      subject: '您的密码已重置',
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #0052D9;">密码重置通知</h2>
          <p>您好，{{username}}！</p>
          <p>管理员已为您重置密码。您的新密码是：</p>
          <p style="background: #f5f5f5; padding: 15px; border-radius: 4px; font-family: monospace; font-size: 16px; font-weight: bold;">
            {{newPassword}}
          </p>
          <p style="color: #E34D59;">请在登录后立即修改密码！</p>
          <p>
            <a href="{{loginUrl}}" style="display: inline-block; padding: 12px 24px; background: #0052D9; color: white; text-decoration: none; border-radius: 4px;">
              立即登录
            </a>
          </p>
        </div>
      `
    },
    login_alert: {
      subject: '登录异常提醒',
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #E34D59;">⚠️ 检测到账号异常登录</h2>
          <p>您好，{{username}}！</p>
          <p>我们检测到您的账号在以下时间和地点登录：</p>
          <ul style="background: #f5f5f5; padding: 20px; border-radius: 4px;">
            <li>时间：{{time}}</li>
            <li>IP地址：{{ipAddress}}</li>
            <li>设备：{{userAgent}}</li>
          </ul>
          <p>如果这不是您本人的操作，请立即修改密码并联系管理员。</p>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            这是一封自动发送的安全提醒邮件。
          </p>
        </div>
      `
    },
    system_notification: {
      subject: '系统通知',
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #0052D9;">系统通知</h2>
          <p>您好，{{username}}！</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 4px; margin: 20px 0;">
            {{message}}
          </div>
          <p style="color: #666; font-size: 12px;">
            发送时间：{{time}}
          </p>
        </div>
      `
    }
  };

  return templates[type] || templates.system_notification;
}

/**
 * 渲染邮件模板
 */
function renderTemplate(template, data) {
  let rendered = template;
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    rendered = rendered.replace(regex, value);
  }
  return rendered;
}

/**
 * 更新邮件配置
 */
function updateEmailConfig(config) {
  const transaction = db.transaction(() => {
    for (const [key, value] of Object.entries(config)) {
      if (key.startsWith('smtp_')) {
        const existing = db.prepare('SELECT id FROM system_settings WHERE key = ?').get(key);
        if (existing) {
          db.prepare('UPDATE system_settings SET value = ? WHERE key = ?').run(value, key);
        } else {
          db.prepare('INSERT INTO system_settings (key, value) VALUES (?, ?)').run(key, value);
        }
      }
    }
  });

  transaction();
  
  // 重新初始化发送器
  transporter = initTransporter();
}

module.exports = {
  initTransporter,
  testConnection,
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendLoginAlertEmail,
  sendSystemNotification,
  getEmailTemplate,
  updateEmailConfig
};



const express = require('express');
const router = express.Router();
const multer = require('multer');

// 控制器
const categoryController = require('../controllers/categoryController');
const secretController = require('../controllers/secretController');
const backupController = require('../controllers/backupController');
const authController = require('../controllers/authController');
const adminController = require('../controllers/adminController');
const tagController = require('../controllers/tagController');
const qrcodeController = require('../controllers/qrcodeController');
const userController = require('../controllers/userController');
const systemController = require('../controllers/systemController');
const exportController = require('../controllers/exportController');
const templateController = require('../controllers/templateController');
const apiKeyController = require('../controllers/apiKeyController');
const emailController = require('../controllers/emailController');

// 中间件
const { authenticateUser, requireAdmin, requireUnlocked } = require('../middleware/auth');
const { authenticateToken, requireAdmin: requireAdminRole, checkResourceOwnership } = require('../middleware/authMiddleware');

// 配置文件上传
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// ==================== 公开路由 ====================

// 用户认证相关（新增多用户支持）
router.post('/users/register', userController.register);
router.post('/users/login', userController.login);

// 主密码认证相关（保留向后兼容）
router.post('/auth/login', authController.login); // 管理员登录
router.get('/auth/check-master-password', authController.checkMasterPassword);
router.post('/auth/set-master-password', authController.setMasterPassword);
router.post('/auth/unlock', authController.unlockWithMasterPassword);
router.post('/auth/lock', authController.lock);
router.get('/auth/password-hint', authController.getPasswordHint);
router.post('/auth/change-master-password', authController.changeMasterPassword);

// ==================== 需要认证的路由（多用户）====================

// 用户个人信息（需要登录）
router.get('/users/me', authenticateToken, userController.getCurrentUser);
router.put('/users/me', authenticateToken, userController.updateProfile);
router.post('/users/change-password', authenticateToken, userController.changePassword);

// ==================== 需要解锁的路由 ====================

// 分类路由（需登录）
router.get('/categories', authenticateToken, categoryController.getAllCategories);
router.post('/categories', authenticateToken, categoryController.createCategory);
router.put('/categories/:id', authenticateToken, categoryController.updateCategory);
router.delete('/categories/:id', authenticateToken, categoryController.deleteCategory);

// 标签路由（需登录）
router.get('/tags', authenticateToken, tagController.getAllTags);
router.post('/tags', authenticateToken, tagController.createTag);
router.put('/tags/:id', authenticateToken, tagController.updateTag);
router.delete('/tags/:id', authenticateToken, tagController.deleteTag);
router.get('/tags/:id/secrets', authenticateToken, tagController.getSecretsByTag);

// 密钥路由（需登录，token 生成额外允许锁状态）
router.get('/secrets', authenticateToken, secretController.getAllSecrets);
router.get('/secrets/:id', authenticateToken, secretController.getSecretDetail);
router.post('/secrets', authenticateToken, secretController.createSecret);
router.put('/secrets/:id', authenticateToken, secretController.updateSecret);
router.delete('/secrets/:id', authenticateToken, secretController.deleteSecret);
router.post('/secrets/batch-delete', authenticateToken, secretController.batchDeleteSecrets);
router.post('/secrets/batch-update-category', authenticateToken, secretController.batchUpdateCategory);
router.post('/secrets/update-sort', authenticateToken, secretController.updateSort);
router.post('/secrets/:id/toggle-favorite', authenticateToken, secretController.toggleFavorite);
router.post('/secrets/:id/toggle-pin', authenticateToken, secretController.togglePin);

// Token 生成（需登录）
router.get('/secrets/:id/token', authenticateToken, secretController.generateToken);
router.get('/tokens', authenticateToken, secretController.generateAllTokens);

// 二维码相关（需登录）
router.post('/qrcode/upload', authenticateToken, qrcodeController.uploadAndParse);
router.post('/qrcode/generate', authenticateToken, qrcodeController.generateQRCode);
router.post('/qrcode/parse-url', authenticateToken, qrcodeController.parseOtpauthUrl);

// 备份和恢复路由（需登录）
router.get('/backup/export', authenticateToken, backupController.exportData);
router.post('/backup/export-encrypted', authenticateToken, backupController.exportEncrypted);
router.post('/backup/import', authenticateToken, backupController.importData);
router.get('/backup/history', authenticateToken, backupController.getBackupHistory);
router.post('/backup/auto', authenticateToken, backupController.autoBackup);
router.post('/backup/import-google', authenticateToken, backupController.importGoogleAuthenticator);

// ==================== 管理员路由 ====================

// 用户管理（需要登录和管理员权限）
router.get('/admin/users', authenticateUser, requireAdmin, adminController.getAllUsers);
router.get('/admin/users/:id', authenticateUser, requireAdmin, adminController.getUserDetail);
router.post('/admin/users', authenticateUser, requireAdmin, adminController.createUser);
router.put('/admin/users/:id', authenticateUser, requireAdmin, adminController.updateUser);
router.delete('/admin/users/:id', authenticateUser, requireAdmin, adminController.deleteUser);
router.post('/admin/users/batch-status', authenticateUser, requireAdmin, adminController.batchUpdateUserStatus);
router.post('/admin/users/batch-delete', authenticateUser, requireAdmin, adminController.batchDeleteUsers);
router.post('/admin/users/:id/reset-password', authenticateUser, requireAdmin, adminController.resetUserPassword);

// 密钥管理（管理员）
router.get('/admin/secrets', authenticateUser, requireAdmin, adminController.getAllSecrets);
router.get('/admin/secrets/statistics', authenticateUser, requireAdmin, adminController.getSecretStatistics);
router.delete('/admin/secrets/:id', authenticateUser, requireAdmin, adminController.deleteSecret);

// 系统配置管理
router.get('/admin/system/settings', authenticateUser, requireAdmin, systemController.getSettings);
router.put('/admin/system/settings', authenticateUser, requireAdmin, systemController.updateSettings);
router.get('/admin/system/info', authenticateUser, requireAdmin, systemController.getSystemInfo);

// 邀请码管理
router.get('/admin/invites', authenticateUser, requireAdmin, systemController.getInviteCodes);
router.post('/admin/invites', authenticateUser, requireAdmin, systemController.generateInviteCode);
router.delete('/admin/invites/:id', authenticateUser, requireAdmin, systemController.deleteInviteCode);
router.post('/admin/invites/validate', systemController.validateInviteCode); // 公开接口，用于注册时验证

// 日志管理
router.get('/admin/logs/operation', authenticateUser, requireAdmin, systemController.getOperationLogs);
router.get('/admin/logs/login', authenticateUser, requireAdmin, systemController.getLoginLogs);
router.post('/admin/logs/cleanup', authenticateUser, requireAdmin, systemController.cleanupLogs);

// 数据备份管理
router.get('/admin/backups', authenticateUser, requireAdmin, systemController.getBackups);
router.post('/admin/backups', authenticateUser, requireAdmin, systemController.createBackup);
router.get('/admin/backups/:id/download', authenticateUser, requireAdmin, systemController.downloadBackup);
router.delete('/admin/backups/:id', authenticateUser, requireAdmin, systemController.deleteBackup);

// 统计信息
router.get('/admin/statistics', authenticateUser, requireAdmin, adminController.getStatistics);
router.get('/admin/statistics/enhanced', authenticateUser, requireAdmin, adminController.getEnhancedStatistics);
router.get('/admin/usage-logs', authenticateUser, requireAdmin, adminController.getUsageLogs);

// 系统设置（旧版API，保留向后兼容）
router.get('/admin/settings', authenticateUser, requireAdmin, adminController.getSettings);
router.put('/admin/settings', authenticateUser, requireAdmin, adminController.updateSettings);

// 系统维护
router.post('/admin/cleanup-sessions', authenticateUser, requireAdmin, adminController.cleanupSessions);
router.post('/admin/cleanup-logs', authenticateUser, requireAdmin, adminController.cleanupLogs);
router.post('/admin/optimize-database', authenticateUser, requireAdmin, adminController.optimizeDatabase);

// 数据导入导出
router.get('/admin/export/all', authenticateUser, requireAdmin, exportController.exportAllData);
router.get('/admin/export/table/:table', authenticateUser, requireAdmin, exportController.exportTable);
router.post('/admin/import/all', authenticateUser, requireAdmin, exportController.importAllData);

// 密钥模板（需登录）
router.get('/templates', authenticateToken, templateController.getAllTemplates);
router.get('/templates/search', authenticateToken, templateController.searchTemplates);
router.get('/templates/categories', authenticateToken, templateController.getCategories);
router.get('/templates/:id', authenticateToken, templateController.getTemplateById);

// API密钥管理（需要登录，管理员可管理所有，普通用户管理自己的）
router.get('/api-keys', authenticateToken, apiKeyController.getApiKeys);
router.post('/api-keys', authenticateToken, apiKeyController.createApiKey);
router.put('/api-keys/:id', authenticateToken, apiKeyController.updateApiKey);
router.delete('/api-keys/:id', authenticateToken, apiKeyController.deleteApiKey);

// API密钥管理（管理员 - 全量管理接口）
router.get('/admin/api-keys', authenticateUser, requireAdmin, apiKeyController.adminListApiKeys);
router.put('/admin/api-keys/:id', authenticateUser, requireAdmin, apiKeyController.adminUpdateApiKey);
router.delete('/admin/api-keys/:id', authenticateUser, requireAdmin, apiKeyController.adminDeleteApiKey);

// 邮件管理（需要管理员权限）
router.get('/admin/email/config', authenticateUser, requireAdmin, emailController.getEmailConfig);
router.put('/admin/email/config', authenticateUser, requireAdmin, emailController.updateEmailConfig);
router.post('/admin/email/test-connection', authenticateUser, requireAdmin, emailController.testEmail);
router.post('/admin/email/send-test', authenticateUser, requireAdmin, emailController.sendTestEmail);

// 邮件模板管理
router.get('/admin/email/templates', authenticateUser, requireAdmin, emailController.getEmailTemplates);
router.get('/admin/email/templates/:id', authenticateUser, requireAdmin, emailController.getEmailTemplate);
router.post('/admin/email/templates', authenticateUser, requireAdmin, emailController.createEmailTemplate);
router.put('/admin/email/templates/:id', authenticateUser, requireAdmin, emailController.updateEmailTemplate);
router.delete('/admin/email/templates/:id', authenticateUser, requireAdmin, emailController.deleteEmailTemplate);

module.exports = router;

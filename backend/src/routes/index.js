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

// 分类路由
router.get('/categories', categoryController.getAllCategories);
router.post('/categories', categoryController.createCategory);
router.put('/categories/:id', categoryController.updateCategory);
router.delete('/categories/:id', categoryController.deleteCategory);

// 标签路由
router.get('/tags', tagController.getAllTags);
router.post('/tags', tagController.createTag);
router.put('/tags/:id', tagController.updateTag);
router.delete('/tags/:id', tagController.deleteTag);
router.get('/tags/:id/secrets', tagController.getSecretsByTag);

// 密钥路由
router.get('/secrets', secretController.getAllSecrets);
router.get('/secrets/:id', secretController.getSecretDetail);
router.post('/secrets', secretController.createSecret);
router.put('/secrets/:id', secretController.updateSecret);
router.delete('/secrets/:id', secretController.deleteSecret);
router.post('/secrets/batch-delete', secretController.batchDeleteSecrets);
router.post('/secrets/batch-update-category', secretController.batchUpdateCategory);
router.post('/secrets/update-sort', secretController.updateSort);
router.post('/secrets/:id/toggle-favorite', secretController.toggleFavorite);
router.post('/secrets/:id/toggle-pin', secretController.togglePin);

// Token 生成
router.get('/secrets/:id/token', secretController.generateToken);
router.get('/tokens', secretController.generateAllTokens);

// 二维码相关
router.post('/qrcode/upload', qrcodeController.uploadAndParse);
router.post('/qrcode/generate', qrcodeController.generateQRCode);
router.post('/qrcode/parse-url', qrcodeController.parseOtpauthUrl);

// 备份和恢复路由
router.get('/backup/export', backupController.exportData);
router.post('/backup/export-encrypted', backupController.exportEncrypted);
router.post('/backup/import', backupController.importData);
router.get('/backup/history', backupController.getBackupHistory);
router.post('/backup/auto', backupController.autoBackup);
router.post('/backup/import-google', backupController.importGoogleAuthenticator);

// ==================== 管理员路由 ====================

// 用户管理（需要登录和管理员权限）
router.get('/admin/users', authenticateUser, requireAdmin, adminController.getAllUsers);
router.post('/admin/users', authenticateUser, requireAdmin, adminController.createUser);
router.put('/admin/users/:id', authenticateUser, requireAdmin, adminController.updateUser);
router.delete('/admin/users/:id', authenticateUser, requireAdmin, adminController.deleteUser);

// 系统设置
router.get('/admin/settings', authenticateUser, requireAdmin, adminController.getSettings);
router.put('/admin/settings', authenticateUser, requireAdmin, adminController.updateSettings);

// 统计信息
router.get('/admin/statistics', authenticateUser, requireAdmin, adminController.getStatistics);
router.get('/admin/usage-logs', authenticateUser, requireAdmin, adminController.getUsageLogs);

// 系统维护
router.post('/admin/cleanup-sessions', authenticateUser, requireAdmin, adminController.cleanupSessions);
router.post('/admin/cleanup-logs', authenticateUser, requireAdmin, adminController.cleanupLogs);
router.post('/admin/optimize-database', authenticateUser, requireAdmin, adminController.optimizeDatabase);

module.exports = router;

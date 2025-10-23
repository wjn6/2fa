#!/usr/bin/env node
/**
 * 后端健康检查和自检脚本
 * 用于检查系统配置、数据库连接、依赖项等
 * 使用方法: node healthcheck.js
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkItem(name, condition, details = '') {
  const status = condition ? '✓' : '✗';
  const statusColor = condition ? colors.green : colors.red;
  log(`${statusColor}[${status}]${colors.reset} ${name}`, colors.reset);
  if (details) {
    log(`    ${details}`, colors.cyan);
  }
  return condition;
}

async function runHealthCheck() {
  log('\n===========================================', colors.blue);
  log('  2FA Notebook - 后端健康检查', colors.blue);
  log('===========================================\n', colors.blue);

  let allPassed = true;

  // 1. 检查 Node.js 版本
  log('1. 环境检查', colors.yellow);
  const nodeVersion = process.version;
  const nodeMajor = parseInt(nodeVersion.slice(1).split('.')[0]);
  allPassed &= checkItem(
    'Node.js 版本',
    nodeMajor >= 18,
    `当前版本: ${nodeVersion} (需要 >= 18.x)`
  );

  // 2. 检查必要的依赖包
  log('\n2. 依赖检查', colors.yellow);
  const requiredPackages = [
    'express',
    'better-sqlite3',
    'bcryptjs',
    'jsonwebtoken',
    'speakeasy',
    'qrcode',
    'cors',
    'multer'
  ];

  for (const pkg of requiredPackages) {
    try {
      require.resolve(pkg);
      checkItem(`依赖包: ${pkg}`, true);
    } catch (e) {
      allPassed &= checkItem(`依赖包: ${pkg}`, false, '未安装');
    }
  }

  // 3. 检查目录结构
  log('\n3. 目录结构检查', colors.yellow);
  const requiredDirs = [
    'src/controllers',
    'src/middleware',
    'src/routes',
    'src/services',
    'src/utils',
    'src/migrations'
  ];

  for (const dir of requiredDirs) {
    const fullPath = path.join(__dirname, dir);
    const exists = fs.existsSync(fullPath);
    allPassed &= checkItem(`目录: ${dir}`, exists);
  }

  // 4. 检查关键文件
  log('\n4. 关键文件检查', colors.yellow);
  const requiredFiles = [
    'src/app.js',
    'src/database.js',
    'src/routes/index.js',
    'package.json'
  ];

  for (const file of requiredFiles) {
    const fullPath = path.join(__dirname, file);
    const exists = fs.existsSync(fullPath);
    allPassed &= checkItem(`文件: ${file}`, exists);
  }

  // 5. 检查数据目录
  log('\n5. 数据目录检查', colors.yellow);
  const dataDir = process.env.DATA_DIR || path.join(__dirname, 'data');
  const dataDirExists = fs.existsSync(dataDir);
  checkItem('数据目录', dataDirExists, `路径: ${dataDir}`);

  if (!dataDirExists) {
    try {
      fs.mkdirSync(dataDir, { recursive: true });
      checkItem('创建数据目录', true);
    } catch (e) {
      allPassed &= checkItem('创建数据目录', false, e.message);
    }
  }

  // 6. 检查数据库文件
  log('\n6. 数据库检查', colors.yellow);
  const dbPath = path.join(dataDir, 'database.db');
  const dbExists = fs.existsSync(dbPath);
  checkItem('数据库文件', dbExists, dbExists ? `路径: ${dbPath}` : '数据库将在首次启动时创建');

  if (dbExists) {
    try {
      const dbStats = fs.statSync(dbPath);
      const dbSize = (dbStats.size / 1024).toFixed(2);
      checkItem('数据库大小', true, `${dbSize} KB`);
    } catch (e) {
      log(`    无法读取数据库信息: ${e.message}`, colors.yellow);
    }
  }

  // 7. 检查环境变量
  log('\n7. 环境变量检查', colors.yellow);
  const envVars = {
    'NODE_ENV': process.env.NODE_ENV || '未设置(默认 development)',
    'PORT': process.env.PORT || '未设置(默认 5556)',
    'HOST': process.env.HOST || '未设置(默认 127.0.0.1)',
    'JWT_SECRET': process.env.JWT_SECRET ? '已设置(不显示)' : '未设置(将使用默认值)'
  };

  for (const [key, value] of Object.entries(envVars)) {
    log(`    ${key}: ${value}`, colors.cyan);
  }

  // 8. 检查端口配置
  log('\n8. 端口配置检查', colors.yellow);
  const port = process.env.PORT || 5556;
  const host = process.env.HOST || '127.0.0.1';
  log(`    监听地址: ${host}:${port}`, colors.cyan);
  log(`    仅容器内部访问(通过 Nginx 代理对外)`, colors.cyan);

  // 9. 检查控制器文件
  log('\n9. 控制器文件检查', colors.yellow);
  const controllers = [
    'adminController.js',
    'apiKeyController.js',
    'authController.js',
    'backupController.js',
    'categoryController.js',
    'emailController.js',
    'exportController.js',
    'qrcodeController.js',
    'secretController.js',
    'systemController.js',
    'tagController.js',
    'templateController.js',
    'userController.js'
  ];

  let controllerCount = 0;
  for (const controller of controllers) {
    const fullPath = path.join(__dirname, 'src/controllers', controller);
    if (fs.existsSync(fullPath)) {
      controllerCount++;
    }
  }
  checkItem(
    '控制器文件',
    controllerCount === controllers.length,
    `${controllerCount}/${controllers.length} 个控制器`
  );

  // 10. 安全配置检查
  log('\n10. 安全配置检查', colors.yellow);
  if (process.env.NODE_ENV === 'production') {
    checkItem(
      'JWT_SECRET',
      !!process.env.JWT_SECRET,
      process.env.JWT_SECRET ? '已自定义' : '建议在生产环境设置自定义值'
    );
  } else {
    log('    开发环境，跳过安全检查', colors.cyan);
  }

  // 总结
  log('\n===========================================', colors.blue);
  if (allPassed) {
    log('  ✓ 所有检查通过！系统就绪', colors.green);
  } else {
    log('  ✗ 部分检查未通过，请查看详情', colors.red);
  }
  log('===========================================\n', colors.blue);

  return allPassed;
}

// 运行健康检查
runHealthCheck()
  .then((passed) => {
    process.exit(passed ? 0 : 1);
  })
  .catch((err) => {
    log(`\n健康检查失败: ${err.message}`, colors.red);
    console.error(err);
    process.exit(1);
  });



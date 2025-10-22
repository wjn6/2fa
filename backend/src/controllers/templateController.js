/**
 * 密钥模板控制器
 * 提供常用服务的预置模板
 */

// 预置模板库
const BUILTIN_TEMPLATES = [
  {
    id: 'github',
    name: 'GitHub',
    issuer: 'GitHub',
    icon: 'logo-github',
    icon_type: 'built-in',
    category: '开发工具',
    description: 'GitHub 账号两步验证',
    algorithm: 'SHA1',
    digits: 6,
    period: 30
  },
  {
    id: 'google',
    name: 'Google',
    issuer: 'Google',
    icon: 'logo-google',
    icon_type: 'built-in',
    category: '常用服务',
    description: 'Google 账号两步验证',
    algorithm: 'SHA1',
    digits: 6,
    period: 30
  },
  {
    id: 'microsoft',
    name: 'Microsoft',
    issuer: 'Microsoft',
    icon: 'logo-microsoft',
    icon_type: 'built-in',
    category: '常用服务',
    description: 'Microsoft 账号两步验证',
    algorithm: 'SHA1',
    digits: 6,
    period: 30
  },
  {
    id: 'aws',
    name: 'Amazon AWS',
    issuer: 'AWS',
    icon: 'logo-aws',
    icon_type: 'built-in',
    category: '云服务',
    description: 'AWS 账号两步验证',
    algorithm: 'SHA1',
    digits: 6,
    period: 30
  },
  {
    id: 'azure',
    name: 'Microsoft Azure',
    issuer: 'Azure',
    icon: 'logo-azure',
    icon_type: 'built-in',
    category: '云服务',
    description: 'Azure 账号两步验证',
    algorithm: 'SHA1',
    digits: 6,
    period: 30
  },
  {
    id: 'digitalocean',
    name: 'DigitalOcean',
    issuer: 'DigitalOcean',
    icon: 'logo-digitalocean',
    icon_type: 'built-in',
    category: '云服务',
    description: 'DigitalOcean 账号两步验证',
    algorithm: 'SHA1',
    digits: 6,
    period: 30
  },
  {
    id: 'gitlab',
    name: 'GitLab',
    issuer: 'GitLab',
    icon: 'logo-gitlab',
    icon_type: 'built-in',
    category: '开发工具',
    description: 'GitLab 账号两步验证',
    algorithm: 'SHA1',
    digits: 6,
    period: 30
  },
  {
    id: 'bitbucket',
    name: 'Bitbucket',
    issuer: 'Bitbucket',
    icon: 'logo-bitbucket',
    icon_type: 'built-in',
    category: '开发工具',
    description: 'Bitbucket 账号两步验证',
    algorithm: 'SHA1',
    digits: 6,
    period: 30
  },
  {
    id: 'npm',
    name: 'npm',
    issuer: 'npm',
    icon: 'logo-npm',
    icon_type: 'built-in',
    category: '开发工具',
    description: 'npm 账号两步验证',
    algorithm: 'SHA1',
    digits: 6,
    period: 30
  },
  {
    id: 'docker',
    name: 'Docker Hub',
    issuer: 'Docker',
    icon: 'logo-docker',
    icon_type: 'built-in',
    category: '开发工具',
    description: 'Docker Hub 账号两步验证',
    algorithm: 'SHA1',
    digits: 6,
    period: 30
  },
  {
    id: 'slack',
    name: 'Slack',
    issuer: 'Slack',
    icon: 'logo-slack',
    icon_type: 'built-in',
    category: '团队协作',
    description: 'Slack 工作区两步验证',
    algorithm: 'SHA1',
    digits: 6,
    period: 30
  },
  {
    id: 'discord',
    name: 'Discord',
    issuer: 'Discord',
    icon: 'logo-discord',
    icon_type: 'built-in',
    category: '社交',
    description: 'Discord 账号两步验证',
    algorithm: 'SHA1',
    digits: 6,
    period: 30
  },
  {
    id: 'twitter',
    name: 'Twitter (X)',
    issuer: 'Twitter',
    icon: 'logo-twitter',
    icon_type: 'built-in',
    category: '社交',
    description: 'Twitter/X 账号两步验证',
    algorithm: 'SHA1',
    digits: 6,
    period: 30
  },
  {
    id: 'facebook',
    name: 'Facebook',
    issuer: 'Facebook',
    icon: 'logo-facebook',
    icon_type: 'built-in',
    category: '社交',
    description: 'Facebook 账号两步验证',
    algorithm: 'SHA1',
    digits: 6,
    period: 30
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    issuer: 'LinkedIn',
    icon: 'logo-linkedin',
    icon_type: 'built-in',
    category: '社交',
    description: 'LinkedIn 账号两步验证',
    algorithm: 'SHA1',
    digits: 6,
    period: 30
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    issuer: 'Dropbox',
    icon: 'logo-dropbox',
    icon_type: 'built-in',
    category: '云存储',
    description: 'Dropbox 账号两步验证',
    algorithm: 'SHA1',
    digits: 6,
    period: 30
  },
  {
    id: 'notion',
    name: 'Notion',
    issuer: 'Notion',
    icon: 'logo-notion',
    icon_type: 'built-in',
    category: '团队协作',
    description: 'Notion 工作区两步验证',
    algorithm: 'SHA1',
    digits: 6,
    period: 30
  },
  {
    id: 'vercel',
    name: 'Vercel',
    issuer: 'Vercel',
    icon: 'logo-vercel',
    icon_type: 'built-in',
    category: '云服务',
    description: 'Vercel 账号两步验证',
    algorithm: 'SHA1',
    digits: 6,
    period: 30
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    issuer: 'Cloudflare',
    icon: 'logo-cloudflare',
    icon_type: 'built-in',
    category: '云服务',
    description: 'Cloudflare 账号两步验证',
    algorithm: 'SHA1',
    digits: 6,
    period: 30
  },
  {
    id: 'aliyun',
    name: '阿里云',
    issuer: 'Aliyun',
    icon: 'logo-aliyun',
    icon_type: 'built-in',
    category: '云服务',
    description: '阿里云账号两步验证',
    algorithm: 'SHA1',
    digits: 6,
    period: 30
  },
  {
    id: 'tencent',
    name: '腾讯云',
    issuer: 'Tencent Cloud',
    icon: 'logo-tencent',
    icon_type: 'built-in',
    category: '云服务',
    description: '腾讯云账号两步验证',
    algorithm: 'SHA1',
    digits: 6,
    period: 30
  },
  {
    id: 'huawei',
    name: '华为云',
    issuer: 'Huawei Cloud',
    icon: 'logo-huawei',
    icon_type: 'built-in',
    category: '云服务',
    description: '华为云账号两步验证',
    algorithm: 'SHA1',
    digits: 6,
    period: 30
  }
];

/**
 * 获取所有模板
 */
exports.getAllTemplates = (req, res) => {
  try {
    // 按分类组织模板
    const categories = {};
    
    BUILTIN_TEMPLATES.forEach(template => {
      const category = template.category;
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(template);
    });
    
    res.json({
      success: true,
      data: {
        templates: BUILTIN_TEMPLATES,
        categories: categories,
        total: BUILTIN_TEMPLATES.length
      }
    });
  } catch (error) {
    console.error('获取模板失败:', error);
    res.status(500).json({ success: false, message: '获取模板失败' });
  }
};

/**
 * 根据ID获取模板
 */
exports.getTemplateById = (req, res) => {
  try {
    const { id } = req.params;
    const template = BUILTIN_TEMPLATES.find(t => t.id === id);
    
    if (!template) {
      return res.status(404).json({ success: false, message: '模板不存在' });
    }
    
    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('获取模板失败:', error);
    res.status(500).json({ success: false, message: '获取模板失败' });
  }
};

/**
 * 搜索模板
 */
exports.searchTemplates = (req, res) => {
  try {
    const { keyword, category } = req.query;
    
    let results = [...BUILTIN_TEMPLATES];
    
    // 按分类筛选
    if (category) {
      results = results.filter(t => t.category === category);
    }
    
    // 按关键词搜索
    if (keyword) {
      const lowerKeyword = keyword.toLowerCase();
      results = results.filter(t => 
        t.name.toLowerCase().includes(lowerKeyword) ||
        t.issuer.toLowerCase().includes(lowerKeyword) ||
        t.description.toLowerCase().includes(lowerKeyword)
      );
    }
    
    res.json({
      success: true,
      data: {
        templates: results,
        total: results.length
      }
    });
  } catch (error) {
    console.error('搜索模板失败:', error);
    res.status(500).json({ success: false, message: '搜索模板失败' });
  }
};

/**
 * 获取所有分类
 */
exports.getCategories = (req, res) => {
  try {
    const categories = [...new Set(BUILTIN_TEMPLATES.map(t => t.category))];
    
    const categoriesWithCount = categories.map(category => ({
      name: category,
      count: BUILTIN_TEMPLATES.filter(t => t.category === category).length
    }));
    
    res.json({
      success: true,
      data: categoriesWithCount
    });
  } catch (error) {
    console.error('获取分类失败:', error);
    res.status(500).json({ success: false, message: '获取分类失败' });
  }
};

module.exports = exports;



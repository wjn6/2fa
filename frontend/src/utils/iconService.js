// 常见服务的图标映射
export const serviceIcons = {
  'github': 'logo-github',
  'google': 'logo-google',
  'microsoft': 'logo-windows',
  'apple': 'logo-apple',
  'facebook': 'logo-facebook',
  'twitter': 'logo-twitter',
  'instagram': 'logo-instagram',
  'linkedin': 'logo-linkedin',
  'amazon': 'logo-amazon',
  'dropbox': 'cloud',
  'gitlab': 'logo-gitlab',
  'bitbucket': 'code',
  'slack': 'chat',
  'discord': 'chat',
  'telegram': 'chat',
  'wechat': 'logo-wechat',
  'qq': 'logo-qq',
  'alipay': 'wallet',
  'paypal': 'wallet',
  'steam': 'game',
  'twitch': 'video',
  'youtube': 'logo-youtube',
  'netflix': 'video',
  'spotify': 'music',
  'reddit': 'logo-reddit',
  'snapchat': 'camera',
  'tiktok': 'video',
  'zoom': 'video',
  'aws': 'cloud',
  'azure': 'cloud',
  'digitalocean': 'cloud',
  'heroku': 'cloud',
  'cloudflare': 'cloud',
  'npm': 'file-code',
  'docker': 'cloud',
  'kubernetes': 'cloud'
}

// 通过名称或发行者获取图标
export function getServiceIcon(name, issuer) {
  const searchText = (name + ' ' + (issuer || '')).toLowerCase()
  
  for (const [service, icon] of Object.entries(serviceIcons)) {
    if (searchText.includes(service)) {
      return {
        type: 'tdesign',
        value: icon
      }
    }
  }
  
  // 默认图标
  return {
    type: 'tdesign',
    value: 'lock-on'
  }
}

// 颜色映射
export const serviceColors = {
  'github': '#181717',
  'google': '#4285F4',
  'microsoft': '#00A4EF',
  'apple': '#000000',
  'facebook': '#1877F2',
  'twitter': '#1DA1F2',
  'instagram': '#E4405F',
  'linkedin': '#0A66C2',
  'amazon': '#FF9900',
  'dropbox': '#0061FF',
  'gitlab': '#FC6D26',
  'slack': '#4A154B',
  'discord': '#5865F2',
  'telegram': '#26A5E4',
  'wechat': '#07C160',
  'qq': '#EB1923',
  'steam': '#171A21',
  'twitch': '#9146FF',
  'youtube': '#FF0000',
  'netflix': '#E50914',
  'spotify': '#1DB954',
  'reddit': '#FF4500'
}

// 通过名称获取颜色
export function getServiceColor(name, issuer) {
  const searchText = (name + ' ' + (issuer || '')).toLowerCase()
  
  for (const [service, color] of Object.entries(serviceColors)) {
    if (searchText.includes(service)) {
      return color
    }
  }
  
  return '#1890ff'
}


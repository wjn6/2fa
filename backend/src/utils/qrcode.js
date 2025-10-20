const jsQR = require('jsqr');
const { createCanvas, loadImage } = require('canvas');

/**
 * 从图片Buffer中识别二维码
 * @param {Buffer} imageBuffer - 图片Buffer
 * @returns {Promise<string>} - 二维码内容
 */
async function parseQRCode(imageBuffer) {
  try {
    const img = await loadImage(imageBuffer);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (!code) {
      throw new Error('未找到二维码');
    }

    return code.data;
  } catch (error) {
    throw new Error('二维码识别失败: ' + error.message);
  }
}

/**
 * 解析 otpauth:// URL
 * @param {string} otpauthUrl - otpauth:// URL
 * @returns {object} - 解析后的信息
 */
function parseOtpauthUrl(otpauthUrl) {
  try {
    const url = new URL(otpauthUrl);
    
    if (url.protocol !== 'otpauth:') {
      throw new Error('不是有效的 otpauth URL');
    }

    const type = url.host; // totp 或 hotp
    const label = decodeURIComponent(url.pathname.substring(1));
    
    // 解析标签（可能包含发行者）
    let issuer = '';
    let accountName = label;
    
    if (label.includes(':')) {
      const parts = label.split(':');
      issuer = parts[0].trim();
      accountName = parts[1].trim();
    }

    const params = url.searchParams;
    const secret = params.get('secret');
    const issuerParam = params.get('issuer');
    const algorithm = params.get('algorithm') || 'SHA1';
    const digits = params.get('digits') || '6';
    const period = params.get('period') || '30';

    if (!secret) {
      throw new Error('缺少密钥信息');
    }

    return {
      type,
      name: accountName,
      secret,
      issuer: issuerParam || issuer,
      algorithm,
      digits: parseInt(digits),
      period: parseInt(period)
    };
  } catch (error) {
    throw new Error('解析 otpauth URL 失败: ' + error.message);
  }
}

module.exports = {
  parseQRCode,
  parseOtpauthUrl
};


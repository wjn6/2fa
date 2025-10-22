const jsQR = require('jsqr');
const { createCanvas, loadImage } = require('canvas');

/**
 * 从图片Buffer中识别二维码（增强版）
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
    
    // 尝试多次识别，使用不同的参数
    let code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert", // 不反转
    });

    if (!code) {
      // 尝试反转颜色识别
      code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "onlyInvert", // 只反转
      });
    }

    if (!code) {
      // 尝试两种都识别
      code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "attemptBoth", // 两种都尝试
      });
    }

    if (!code) {
      // 尝试缩放图片
      const scale = 2;
      const scaledCanvas = createCanvas(img.width * scale, img.height * scale);
      const scaledCtx = scaledCanvas.getContext('2d');
      scaledCtx.drawImage(img, 0, 0, img.width * scale, img.height * scale);
      
      const scaledImageData = scaledCtx.getImageData(0, 0, scaledCanvas.width, scaledCanvas.height);
      code = jsQR(scaledImageData.data, scaledImageData.width, scaledImageData.height, {
        inversionAttempts: "attemptBoth",
      });
    }

    if (!code) {
      throw new Error('未能识别到二维码，请确保图片清晰且包含完整的二维码');
    }

    console.log('识别到二维码内容:', code.data);
    return code.data;
  } catch (error) {
    console.error('二维码识别错误:', error);
    throw new Error('二维码识别失败: ' + error.message);
  }
}

/**
 * 解析 otpauth:// URL（增强版）
 * @param {string} otpauthUrl - otpauth:// URL
 * @returns {object} - 解析后的信息
 */
function parseOtpauthUrl(otpauthUrl) {
  try {
    console.log('正在解析 URL:', otpauthUrl);
    
    // 清理 URL（去除空格和换行）
    otpauthUrl = otpauthUrl.trim();
    
    const url = new URL(otpauthUrl);
    
    if (url.protocol !== 'otpauth:') {
      throw new Error('不是有效的 otpauth URL，协议应为 otpauth://');
    }

    const type = url.host; // totp 或 hotp
    const label = decodeURIComponent(url.pathname.substring(1));
    
    console.log('类型:', type, '标签:', label);
    
    // 解析标签（可能包含发行者）
    let issuer = '';
    let accountName = label;
    
    if (label.includes(':')) {
      const parts = label.split(':', 2); // 只分割成2部分
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
      throw new Error('二维码中缺少密钥信息（secret）');
    }

    // 验证密钥格式（Base32）
    if (!/^[A-Z2-7]+=*$/i.test(secret)) {
      console.warn('密钥格式可能不正确:', secret);
    }

    const result = {
      type,
      name: accountName || '未命名',
      secret: secret.toUpperCase(), // 转换为大写
      issuer: issuerParam || issuer || '',
      algorithm: algorithm.toUpperCase(),
      digits: parseInt(digits),
      period: parseInt(period)
    };

    console.log('解析成功:', result);
    return result;
  } catch (error) {
    console.error('解析 URL 失败:', error);
    if (error instanceof TypeError) {
      throw new Error('URL 格式错误，请确保二维码来自认证应用（如 Google Authenticator）');
    }
    throw new Error('解析失败: ' + error.message);
  }
}

module.exports = {
  parseQRCode,
  parseOtpauthUrl
};



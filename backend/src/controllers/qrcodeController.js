const { parseQRCode, parseOtpauthUrl } = require('../utils/qrcode');
const QRCode = require('qrcode');
const speakeasy = require('speakeasy');

// 上传二维码图片并解析
exports.uploadAndParse = async (req, res) => {
  try {
    if (!req.body.image) {
      return res.status(400).json({ success: false, message: '请上传图片' });
    }

    // 处理 base64 图片
    const base64Data = req.body.image.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // 解析二维码
    const qrData = await parseQRCode(imageBuffer);

    // 解析 otpauth URL
    const secretInfo = parseOtpauthUrl(qrData);

    res.json({ success: true, data: secretInfo });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// 生成密钥的二维码
exports.generateQRCode = async (req, res) => {
  try {
    const { name, secret, issuer } = req.body;

    if (!name || !secret) {
      return res.status(400).json({ success: false, message: '名称和密钥不能为空' });
    }

    // 验证密钥格式
    try {
      speakeasy.totp({
        secret: secret,
        encoding: 'base32'
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: '密钥格式无效' });
    }

    // 生成 otpauth URL
    const label = issuer ? `${issuer}:${name}` : name;
    const otpauthUrl = `otpauth://totp/${encodeURIComponent(label)}?secret=${secret}${issuer ? '&issuer=' + encodeURIComponent(issuer) : ''}`;

    // 生成二维码
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    res.json({ 
      success: true, 
      data: { 
        qrCode: qrCodeDataUrl,
        otpauthUrl
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 解析 otpauth URL
exports.parseOtpauthUrl = (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ success: false, message: '请提供 otpauth URL' });
    }

    const secretInfo = parseOtpauthUrl(url);

    res.json({ success: true, data: secretInfo });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};



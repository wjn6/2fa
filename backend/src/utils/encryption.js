const CryptoJS = require('crypto-js');

/**
 * 加密密钥
 * @param {string} text - 要加密的文本
 * @param {string} masterPassword - 主密码
 * @returns {string} - 加密后的文本
 */
function encrypt(text, masterPassword) {
  if (!text || !masterPassword) {
    throw new Error('Text and master password are required');
  }
  return CryptoJS.AES.encrypt(text, masterPassword).toString();
}

/**
 * 解密密钥
 * @param {string} encryptedText - 加密的文本
 * @param {string} masterPassword - 主密码
 * @returns {string} - 解密后的文本
 */
function decrypt(encryptedText, masterPassword) {
  if (!encryptedText || !masterPassword) {
    throw new Error('Encrypted text and master password are required');
  }
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedText, masterPassword);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted) {
      throw new Error('Decryption failed');
    }
    return decrypted;
  } catch (error) {
    throw new Error('Invalid master password or corrupted data');
  }
}

/**
 * 生成盐值
 * @returns {string}
 */
function generateSalt() {
  return CryptoJS.lib.WordArray.random(128 / 8).toString();
}

/**
 * 使用PBKDF2派生密钥
 * @param {string} password - 密码
 * @param {string} salt - 盐值
 * @returns {string}
 */
function deriveKey(password, salt) {
  return CryptoJS.PBKDF2(password, salt, {
    keySize: 256 / 32,
    iterations: 10000
  }).toString();
}

module.exports = {
  encrypt,
  decrypt,
  generateSalt,
  deriveKey
};



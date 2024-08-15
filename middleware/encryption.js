// utils/encryption.js
const crypto = require('crypto-js');

const secretKey = process.env.CART_SECRET_KEY || 'your-secret-key';

// Encrypt the text
function encryptText(text) {
  return crypto.AES.encrypt(text, secretKey).toString();
}

// Decrypt the text
function decryptText(cipherText) {
  const bytes = crypto.AES.decrypt(cipherText, secretKey);
  return bytes.toString(crypto.enc.Utf8);
}

module.exports = { encryptText, decryptText };


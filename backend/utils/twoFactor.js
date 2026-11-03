const crypto = require('crypto');
const speakeasy = require('speakeasy');

const deriveKey = (secret) =>
  crypto.createHash('sha256').update(String(secret)).digest();

const encrypt = (value, secret) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', deriveKey(secret), iv);
  const encrypted = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map((part) => part.toString('base64url')).join('.');
};

const decrypt = (value, secret) => {
  const [ivValue, tagValue, encryptedValue] = String(value).split('.');
  if (!ivValue || !tagValue || !encryptedValue) throw new Error('Secreto 2FA inválido');
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    deriveKey(secret),
    Buffer.from(ivValue, 'base64url')
  );
  decipher.setAuthTag(Buffer.from(tagValue, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
};

const createSecret = (email) => speakeasy.generateSecret({
  length: 32,
  name: `Verdulería Jerusalén (${email})`,
  issuer: 'Verdulería Jerusalén',
});

const verifyCode = (secret, code) => speakeasy.totp.verify({
  secret,
  encoding: 'base32',
  token: String(code || '').replace(/\s/g, ''),
  window: 1,
});

const createRecoveryCodes = () => Array.from({ length: 8 }, () =>
  `${crypto.randomBytes(3).toString('hex')}-${crypto.randomBytes(3).toString('hex')}`.toUpperCase()
);

const hashRecoveryCode = (code) => crypto
  .createHash('sha256')
  .update(String(code).trim().toUpperCase())
  .digest('hex');

module.exports = {
  encrypt,
  decrypt,
  createSecret,
  verifyCode,
  createRecoveryCodes,
  hashRecoveryCode,
};

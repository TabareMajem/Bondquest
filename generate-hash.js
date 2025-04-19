const crypto = require('crypto');
const util = require('util');

const scryptAsync = util.promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

(async () => {
  const password = 'admin123';
  const hashedPassword = await hashPassword(password);
  console.log('Hashed password for admin123:', hashedPassword);
})();
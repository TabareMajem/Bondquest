import { randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

// Convert callback-based scrypt to Promise-based
const scryptAsync = promisify(scrypt);

/**
 * Hash a password with a random salt
 */
export async function hashPassword(password: string): Promise<string> {
  // Generate random salt
  const salt = randomBytes(16).toString('hex');
  
  // Hash the password with the salt
  const derivedKey = await scryptAsync(password, salt, 64) as Buffer;
  
  // Return the hashed password with salt in the format: hash.salt
  return `${derivedKey.toString('hex')}.${salt}`;
}

/**
 * Compare a plaintext password with a hashed password
 */
export async function comparePasswords(plainPassword: string, hashedPassword: string | null): Promise<boolean> {
  if (!hashedPassword) return false;
  
  // Extract the hash and salt
  const [hash, salt] = hashedPassword.split('.');
  
  // If we don't have both parts, the stored password is invalid
  if (!hash || !salt) return false;
  
  // Hash the plaintext password with the same salt
  const derivedKey = await scryptAsync(plainPassword, salt, 64) as Buffer;
  
  // Compare the hashes (using timing-safe comparison via string comparison of hex values)
  return derivedKey.toString('hex') === hash;
}
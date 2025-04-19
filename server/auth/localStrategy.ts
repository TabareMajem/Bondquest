import { Strategy as LocalStrategy } from 'passport-local';
import { PassportStatic } from 'passport';
import { IStorage } from '../storage';
import { comparePasswords } from './passwordUtils';
import { db } from '../db'; 
import { eq } from 'drizzle-orm';
import { users } from '@shared/schema';

export function configureLocalStrategy(passport: PassportStatic, storage: IStorage) {
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        // Find user by username - using direct DB query
        const [user] = await db.select()
          .from(users)
          .where(eq(users.username, username));
        
        // If user not found
        if (!user) {
          console.log(`Login failed: User '${username}' not found`);
          return done(null, false, { message: 'Invalid credentials' });
        }
        
        // Verify password
        // Check if user has a password (it shouldn't be null, but let's be safe)
        if (!user.password) {
          console.log(`Login failed: User '${username}' has no password`);
          return done(null, false, { message: 'Invalid credentials' });
        }
        
        // Use the comparePasswords function from passwordUtils
        const isMatch = await comparePasswords(password, user.password);
        if (!isMatch) {
          console.log(`Login failed: Password mismatch for user '${username}'`);
          return done(null, false, { message: 'Invalid credentials' });
        }
        
        console.log(`Login successful for user: ${username}`);
        
        // Success - create a new user object without the password for security
        const userWithoutPassword = { ...user };
        delete userWithoutPassword.password;
        
        return done(null, userWithoutPassword);
      } catch (error) {
        console.error('Login error:', error);
        return done(error);
      }
    })
  );
}
import { Strategy as LocalStrategy } from 'passport-local';
import { PassportStatic } from 'passport';
import { IStorage } from '../storage';
import { comparePasswords } from './passwordUtils';

export function configureLocalStrategy(passport: PassportStatic, storage: IStorage) {
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        // Find user by username
        const user = await storage.getUserByUsername(username);
        
        // If user not found or password doesn't match
        if (!user) {
          return done(null, false, { message: 'Invalid credentials' });
        }
        
        // Verify password
        // Check if user has a password (it shouldn't be null, but let's be safe)
        if (!user.password) {
          return done(null, false, { message: 'Invalid credentials' });
        }
        
        const isMatch = await comparePasswords(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: 'Invalid credentials' });
        }
        
        // Success - create a new user object without the password for security
        const { password, ...userWithoutPassword } = user;
        
        return done(null, userWithoutPassword as any);
      } catch (error) {
        return done(error);
      }
    })
  );
}
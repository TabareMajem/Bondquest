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
        const isMatch = await comparePasswords(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: 'Invalid credentials' });
        }
        
        // Success - remove password from returned user object for security
        const userWithoutPassword = { ...user };
        delete userWithoutPassword.password;
        
        return done(null, userWithoutPassword);
      } catch (error) {
        return done(error);
      }
    })
  );
}
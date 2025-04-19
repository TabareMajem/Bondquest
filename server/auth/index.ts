import passport from 'passport';
import { Router } from 'express';
import { configureLocalStrategy } from './localStrategy';
import { configureGoogleStrategy } from './googleStrategy';
import { configureInstagramStrategy } from './instagramStrategy';
import { IStorage } from '../storage';
import { hashPassword } from './passwordUtils';

// Configure passport with our strategies
export const configureAuth = (storage: IStorage) => {
  // User serialization/deserialization for session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Set up authentication strategies
  configureLocalStrategy(passport, storage);
  configureGoogleStrategy(passport, storage);
  configureInstagramStrategy(passport, storage);

  return passport;
};

// Create authentication routes
export const createAuthRouter = () => {
  const router = Router();

  // Google OAuth routes
  router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
  
  router.get('/google/callback', 
    passport.authenticate('google', { 
      failureRedirect: '/login',
      successRedirect: '/onboarding-chat'
    })
  );

  // Instagram OAuth routes
  router.get('/instagram', passport.authenticate('instagram'));
  
  router.get('/instagram/callback', 
    passport.authenticate('instagram', { 
      failureRedirect: '/login',
      successRedirect: '/onboarding-chat'
    })
  );

  // Logout route
  router.get('/logout', (req, res) => {
    req.logout(() => {
      res.redirect('/');
    });
  });

  return router;
};

// Register a new user
export async function registerUser(userData: any, storage: IStorage) {
  // Check if user already exists
  const existingUser = await storage.getUserByUsername(userData.username);
  if (existingUser) {
    throw new Error('Username already taken');
  }
  
  // Hash the password
  const hashedPassword = await hashPassword(userData.password);
  
  // Create the user with hashed password
  const newUser = await storage.createUser({
    ...userData,
    password: hashedPassword
  });
  
  return newUser;
}
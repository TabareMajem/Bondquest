import passport from 'passport';
import { Router } from 'express';
import { configureGoogleStrategy } from './googleStrategy';
import { configureInstagramStrategy } from './instagramStrategy';
import { IStorage } from '../storage';

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
      successRedirect: '/onboarding'
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
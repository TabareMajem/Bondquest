import passport from 'passport';
import { Router } from 'express';
import { configureLocalStrategy } from './localStrategy';
import { configureGoogleStrategy } from './googleStrategy';
import { configureInstagramStrategy } from './instagramStrategy';
import { IStorage } from '../storage';
import { hashPassword } from './passwordUtils';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { users } from '@shared/schema';

// Configure passport with our strategies
export const configureAuth = (storage: IStorage) => {
  // User serialization/deserialization for session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      // Use direct database query instead of storage
      const [user] = await db.select()
        .from(users)
        .where(eq(users.id, id));
      
      if (!user) {
        return done(new Error(`User with ID ${id} not found`), null);
      }
      
      // Create a new user object without password for security
      const userWithoutPassword = { ...user };
      delete userWithoutPassword.password;
      
      done(null, userWithoutPassword);
    } catch (error) {
      console.error('User deserialization error:', error);
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
  try {
    // Check if user already exists - using direct DB query
    const [existingUser] = await db.select()
      .from(users)
      .where(eq(users.username, userData.username));
    
    if (existingUser) {
      throw new Error('Username already taken');
    }
    
    // Also check by email if provided
    if (userData.email) {
      const [existingUserByEmail] = await db.select()
        .from(users)
        .where(eq(users.email, userData.email));
      
      if (existingUserByEmail) {
        throw new Error('Email already in use');
      }
    }
    
    // Hash the password
    const hashedPassword = await hashPassword(userData.password);
    
    // Create the user with hashed password - using direct DB query
    const [newUser] = await db.insert(users)
      .values({
        ...userData,
        password: hashedPassword
      })
      .returning();
    
    console.log(`User registered successfully: ${userData.username}`);
    
    return newUser;
  } catch (error) {
    console.error('User registration error:', error);
    throw error;
  }
}
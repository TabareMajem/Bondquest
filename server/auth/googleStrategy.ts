import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { PassportStatic } from 'passport';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { users } from '../../shared/schema';
import { IStorage } from '../storage';

export const configureGoogleStrategy = (passport: PassportStatic, storage: IStorage) => {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const CALLBACK_URL = process.env.NODE_ENV === 'production' 
    ? `${process.env.BASE_URL || 'https://bondquest.replit.app'}/auth/google/callback` 
    : 'http://localhost:5000/auth/google/callback';

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.warn('Google OAuth credentials missing. Google authentication disabled.');
    return;
  }

  passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: CALLBACK_URL,
    scope: ['profile', 'email']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists with this Google ID
      const existingUsers = await db
        .select()
        .from(users)
        .where(eq(users.googleId, profile.id));
      
      const existingUser = existingUsers[0];

      if (existingUser) {
        // Update user profile data if needed
        await db
          .update(users)
          .set({
            lastLogin: new Date(),
            profilePictureUrl: profile.photos?.[0]?.value || existingUser.profilePictureUrl
          })
          .where(eq(users.id, existingUser.id));
        
        return done(null, existingUser);
      }

      // Check if email is already registered
      if (profile.emails && profile.emails[0]?.value) {
        const emailUser = await storage.getUserByEmail(profile.emails[0].value);
        
        if (emailUser) {
          // Associate Google ID with existing account
          await db
            .update(users)
            .set({
              googleId: profile.id,
              lastLogin: new Date(),
              profilePictureUrl: profile.photos?.[0]?.value || emailUser.profilePictureUrl
            })
            .where(eq(users.id, emailUser.id));
          
          return done(null, emailUser);
        }
      }

      // Create new user
      const generatedUsername = `user_${nanoid(8)}`;
      
      const newUser = await storage.createUser({
        username: generatedUsername,
        email: profile.emails?.[0]?.value || `${generatedUsername}@bondquest.temp`,
        passwordHash: null, // No password for OAuth users
        googleId: profile.id,
        fullName: profile.displayName || '',
        profilePictureUrl: profile.photos?.[0]?.value || null,
        partnerCode: nanoid(10),
        preferences: { theme: 'dark', language: 'en' },
        createdAt: new Date(),
        lastLogin: new Date()
      });

      return done(null, newUser);
    } catch (error) {
      console.error('Error in Google authentication:', error);
      return done(error as Error, undefined);
    }
  }));
};
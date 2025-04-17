import { Strategy as InstagramStrategy } from 'passport-instagram';
import { PassportStatic } from 'passport';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { users } from '../../shared/schema';
import { IStorage } from '../storage';

export const configureInstagramStrategy = (passport: PassportStatic, storage: IStorage) => {
  const INSTAGRAM_CLIENT_ID = process.env.INSTAGRAM_CLIENT_ID;
  const INSTAGRAM_CLIENT_SECRET = process.env.INSTAGRAM_CLIENT_SECRET;
  const CALLBACK_URL = process.env.NODE_ENV === 'production' 
    ? `${process.env.BASE_URL || 'https://bondquest.replit.app'}/auth/instagram/callback` 
    : 'http://localhost:5000/auth/instagram/callback';

  if (!INSTAGRAM_CLIENT_ID || !INSTAGRAM_CLIENT_SECRET) {
    console.warn('Instagram OAuth credentials missing. Instagram authentication disabled.');
    return;
  }

  passport.use(new InstagramStrategy({
    clientID: INSTAGRAM_CLIENT_ID,
    clientSecret: INSTAGRAM_CLIENT_SECRET,
    callbackURL: CALLBACK_URL
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists with this Instagram ID
      const existingUsers = await db
        .select()
        .from(users)
        .where(eq(users.instagramId, profile.id));
      
      const existingUser = existingUsers[0];

      if (existingUser) {
        // Update user profile data if needed
        await db
          .update(users)
          .set({
            lastLogin: new Date(),
            avatar: profile._json?.data?.profile_picture || existingUser.avatar
          })
          .where(eq(users.id, existingUser.id));
        
        return done(null, existingUser);
      }

      // Create new user from Instagram profile
      const generatedUsername = `user_${nanoid(8)}`;
      
      const newUser = await storage.createUser({
        username: generatedUsername,
        email: `${generatedUsername}@bondquest.temp`, // Instagram doesn't provide email
        password: null, // No password for OAuth users
        instagramId: profile.id,
        displayName: profile.displayName || generatedUsername,
        avatar: profile._json?.data?.profile_picture || null,
        partnerCode: nanoid(10)
      });

      return done(null, newUser);
    } catch (error) {
      console.error('Error in Instagram authentication:', error);
      return done(error as Error, undefined);
    }
  }));
};
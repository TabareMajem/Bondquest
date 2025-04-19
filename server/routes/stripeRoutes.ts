import { Router } from 'express';
import { z } from 'zod';
import Stripe from 'stripe';
import { 
  createPaymentIntent,
  getSubscriptionTiers,
  getUserSubscription,
  createCustomer, 
  createSubscription,
  cancelSubscription,
  reactivateSubscription,
  updateUserSubscriptionStatus,
  handleWebhookEvent,
  stripe
} from '../stripe';
import { db } from '../db';
import { userSubscriptions, subscriptionTiers } from '@shared/schema';
import { and, eq } from 'drizzle-orm';

const router = Router();

// Get subscription tiers
router.get('/subscription-tiers', async (req, res) => {
  try {
    const tiers = await getSubscriptionTiers();
    res.json(tiers);
  } catch (error: any) {
    console.error('Error fetching subscription tiers:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user subscription
router.get('/user-subscription', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const subscription = await getUserSubscription(req.user.id);
    res.json(subscription || null);
  } catch (error: any) {
    console.error('Error fetching user subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create payment intent
router.post('/create-payment-intent', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const schema = z.object({
    amount: z.number().min(1),
    currency: z.string().default('usd'),
    metadata: z.record(z.string()).optional().default({}),
  });

  try {
    const { amount, currency, metadata } = schema.parse(req.body);
    
    // Add user ID to metadata
    metadata.userId = req.user.id.toString();
    
    const paymentIntent = await createPaymentIntent(amount, currency, metadata);
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create subscription
router.post('/create-subscription', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const schema = z.object({
    tierId: z.number(),
    priceId: z.string(),
  });

  try {
    const { tierId, priceId } = schema.parse(req.body);

    // Check if user already has a subscription
    const existingSubscription = await getUserSubscription(req.user.id);
    
    // Get the subscription tier
    const [tier] = await db
      .select()
      .from(subscriptionTiers)
      .where(eq(subscriptionTiers.id, tierId));
    
    if (!tier) {
      return res.status(404).json({ error: 'Subscription tier not found' });
    }
    
    let stripeCustomerId: string;
    
    if (existingSubscription?.stripeCustomerId) {
      stripeCustomerId = existingSubscription.stripeCustomerId;
    } else {
      // Create a Stripe customer
      const customer = await createCustomer(req.user.email, req.user.username);
      stripeCustomerId = customer.id;
    }
    
    // Create the subscription in Stripe
    const subscription = await createSubscription(stripeCustomerId, priceId);
    
    // Save subscription details to database
    if (existingSubscription) {
      // Update existing subscription using raw SQL to avoid schema mismatches
      await db.execute(
        `UPDATE user_subscriptions 
         SET 
          tier_id = $1, 
          stripe_customer_id = $2,
          stripe_subscription_id = $3,
          status = $4,
          current_period_start = $5,
          current_period_end = $6,
          cancel_at_period_end = $7,
          updated_at = NOW()
         WHERE user_id = $8`,
        [
          tierId,
          stripeCustomerId,
          subscription.id,
          subscription.status,
          new Date(Number(subscription.current_period_start) * 1000),
          new Date(Number(subscription.current_period_end) * 1000),
          subscription.cancel_at_period_end,
          req.user.id
        ]
      );
    } else {
      // Create new subscription record using raw SQL to avoid schema mismatches
      await db.execute(
        `INSERT INTO user_subscriptions
         (user_id, tier_id, stripe_customer_id, stripe_subscription_id, status, current_period_start, current_period_end, cancel_at_period_end, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
        [
          req.user.id,
          tierId,
          stripeCustomerId,
          subscription.id,
          subscription.status,
          new Date(Number(subscription.current_period_start) * 1000),
          new Date(Number(subscription.current_period_end) * 1000),
          subscription.cancel_at_period_end
        ]
      );
    }
    
    // Extract client secret from the subscription
    const invoice = subscription.latest_invoice as Stripe.Invoice;
    const clientSecret = invoice.payment_intent 
      ? (invoice.payment_intent as Stripe.PaymentIntent).client_secret
      : null;
    
    res.json({
      subscriptionId: subscription.id,
      clientSecret,
    });
  } catch (error: any) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

// Cancel subscription
router.post('/cancel-subscription', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const schema = z.object({
    subscriptionId: z.string(),
  });

  try {
    const { subscriptionId } = schema.parse(req.body);
    
    // Get the user's subscription
    const userSubscription = await getUserSubscription(req.user.id);
    
    if (!userSubscription || userSubscription.stripeSubscriptionId !== subscriptionId) {
      return res.status(404).json({ error: 'Subscription not found' });
    }
    
    // Cancel the subscription in Stripe
    const subscription = await cancelSubscription(subscriptionId);
    
    // Update subscription status in the database
    await updateUserSubscriptionStatus(req.user.id, subscription);
    
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reactivate subscription
router.post('/reactivate-subscription', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const schema = z.object({
    subscriptionId: z.string(),
  });

  try {
    const { subscriptionId } = schema.parse(req.body);
    
    // Get the user's subscription
    const userSubscription = await getUserSubscription(req.user.id);
    
    if (!userSubscription || userSubscription.stripeSubscriptionId !== subscriptionId) {
      return res.status(404).json({ error: 'Subscription not found' });
    }
    
    // Reactivate the subscription in Stripe
    const subscription = await reactivateSubscription(subscriptionId);
    
    // Update subscription status in the database
    await updateUserSubscriptionStatus(req.user.id, subscription);
    
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error reactivating subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stripe webhook endpoint
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    console.warn('Warning: STRIPE_WEBHOOK_SECRET is not set. Webhook signatures will not be verified.');
    // Process the event without verification in development
    try {
      await handleWebhookEvent(req.body);
      res.json({ received: true });
    } catch (error: any) {
      console.error('Error handling webhook:', error);
      res.status(400).send(`Webhook Error: ${error.message}`);
    }
    return;
  }
  
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (error: any) {
    console.error('Error verifying webhook signature:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
    return;
  }
  
  try {
    await handleWebhookEvent(event);
    res.json({ received: true });
  } catch (error: any) {
    console.error('Error handling webhook:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

export default router;
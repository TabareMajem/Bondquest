import { Request, Response, Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { users, userSubscriptions, subscriptionTiers } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { stripeService } from '../stripe';
import Stripe from 'stripe';

const router = Router();

// Get publishable key
router.get('/config', (req, res) => {
  res.json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  });
});

// Create a subscription session
router.post('/create-subscription', async (req, res) => {
  try {
    const schema = z.object({
      userId: z.number(),
      tierId: z.number(),
    });

    const { userId, tierId } = schema.parse(req.body);

    // Fetch the user
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Fetch the subscription tier
    const [tier] = await db.select().from(subscriptionTiers).where(eq(subscriptionTiers.id, tierId));
    if (!tier) {
      return res.status(404).json({ error: 'Subscription tier not found' });
    }

    // Check if the tier has a Stripe product and price ID
    if (!tier.stripeProductId || !tier.stripePriceId) {
      // Create them if they don't exist
      const product = await stripeService.createProduct(
        tier.name,
        tier.description
      );

      const price = await stripeService.createPrice(
        product.id,
        Math.round((tier.price as any) * 100), // Convert to cents
        'usd',
        { interval: tier.billingPeriod === 'monthly' ? 'month' : 'year' }
      );

      // Update the tier with the new IDs
      await db
        .update(subscriptionTiers)
        .set({
          stripeProductId: product.id,
          stripePriceId: price.id,
          updatedAt: new Date(),
        })
        .where(eq(subscriptionTiers.id, tier.id));

      // Update our local tier object
      tier.stripeProductId = product.id;
      tier.stripePriceId = price.id;
    }

    // Check if the user already has a Stripe customer ID
    let [subscription] = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId));

    let stripeCustomerId = subscription?.stripeCustomerId;

    // Create a Stripe customer if none exists
    if (!stripeCustomerId) {
      const customer = await stripeService.createCustomer(
        userId,
        user.email,
        user.displayName
      );
      stripeCustomerId = customer.id;
    }

    // Create a subscription
    const stripeSubscription = await stripeService.createSubscription(
      stripeCustomerId,
      tier.stripePriceId
    );

    // Store/update the subscription in our database
    if (subscription) {
      await db
        .update(userSubscriptions)
        .set({
          tierId,
          stripeSubscriptionId: stripeSubscription.id,
          status: stripeSubscription.status,
          currentPeriodStart: new Date((stripeSubscription as any).current_period_start * 1000),
          currentPeriodEnd: new Date((stripeSubscription as any).current_period_end * 1000),
          updatedAt: new Date(),
        })
        .where(eq(userSubscriptions.id, subscription.id));
    } else {
      await db.insert(userSubscriptions).values({
        userId,
        tierId,
        stripeCustomerId,
        stripeSubscriptionId: stripeSubscription.id,
        status: stripeSubscription.status,
        currentPeriodStart: new Date((stripeSubscription as any).current_period_start * 1000),
        currentPeriodEnd: new Date((stripeSubscription as any).current_period_end * 1000),
      });
    }

    // Get the client secret for checkout
    const clientSecret = 
      (stripeSubscription as any).latest_invoice?.payment_intent?.client_secret;

    res.json({
      subscriptionId: stripeSubscription.id,
      clientSecret,
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: 'Error creating subscription' });
  }
});

// Cancel a subscription
router.post('/cancel-subscription', async (req, res) => {
  try {
    const schema = z.object({
      userId: z.number(),
    });

    const { userId } = schema.parse(req.body);

    // Find the user's subscription
    const [subscription] = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId));

    if (!subscription || !subscription.stripeSubscriptionId) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // Cancel the subscription in Stripe
    await stripeService.cancelSubscription(subscription.stripeSubscriptionId);

    // Update our database
    await db
      .update(userSubscriptions)
      .set({
        status: 'canceled',
        cancelAtPeriodEnd: true,
        updatedAt: new Date(),
      })
      .where(eq(userSubscriptions.id, subscription.id));

    res.json({ success: true });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ error: 'Error canceling subscription' });
  }
});

// Update a subscription to a different tier
router.post('/update-subscription', async (req, res) => {
  try {
    const schema = z.object({
      userId: z.number(),
      newTierId: z.number(),
    });

    const { userId, newTierId } = schema.parse(req.body);

    // Find the user's subscription
    const [subscription] = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId));

    if (!subscription || !subscription.stripeSubscriptionId) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // Get the new tier
    const [newTier] = await db
      .select()
      .from(subscriptionTiers)
      .where(eq(subscriptionTiers.id, newTierId));

    if (!newTier || !newTier.stripePriceId) {
      return res.status(404).json({ error: 'New tier not found or not configured with Stripe' });
    }

    // Update the subscription in Stripe
    const updatedSubscription = await stripeService.updateSubscription(
      subscription.stripeSubscriptionId,
      newTier.stripePriceId
    );

    // Update our database
    await db
      .update(userSubscriptions)
      .set({
        tierId: newTierId,
        status: updatedSubscription.status,
        currentPeriodStart: new Date((updatedSubscription as any).current_period_start * 1000),
        currentPeriodEnd: new Date((updatedSubscription as any).current_period_end * 1000),
        updatedAt: new Date(),
      })
      .where(eq(userSubscriptions.id, subscription.id));

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({ error: 'Error updating subscription' });
  }
});

// Create a payment intent for one-time purchases (e.g., rewards)
router.post('/create-payment-intent', async (req, res) => {
  try {
    const schema = z.object({
      amount: z.number().min(50), // Minimum amount in cents
      currency: z.string().default('usd'),
      userId: z.number().optional(),
      metadata: z.record(z.string()).optional(),
    });

    const { amount, currency, userId, metadata } = schema.parse(req.body);

    let stripeCustomerId: string | undefined;

    // If userId is provided, get or create customer ID
    if (userId) {
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if user already has a customer ID
      const [subscription] = await db
        .select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.userId, userId));

      if (subscription?.stripeCustomerId) {
        stripeCustomerId = subscription.stripeCustomerId;
      } else {
        // Create a new customer
        const customer = await stripeService.createCustomer(
          userId,
          user.email,
          user.displayName
        );
        stripeCustomerId = customer.id;
      }
    }

    // Create a payment intent
    const paymentIntent = await stripeService.createPaymentIntent(
      amount,
      currency,
      stripeCustomerId
    );

    if (metadata) {
      await (paymentIntent as any).update({
        metadata
      });
    }

    res.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Error creating payment intent' });
  }
});

// Stripe webhook handler
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (!endpointSecret) {
      // For development - read the event directly
      event = req.body;
    } else {
      // For production - verify the signature
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        endpointSecret
      );
    }

    // Handle the event
    await stripeService.handleWebhookEvent(event);

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(400).send(`Webhook Error: ${(error as Error).message}`);
  }
});

export default router;
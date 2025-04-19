import Stripe from 'stripe';
import { db } from './db';
import { subscriptionTiers, userSubscriptions } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

// Note: We're using a specific API version to ensure compatibility
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15' as any,
});

export async function createPaymentIntent(amount: number, currency: string, metadata: Record<string, string>) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata,
    });
    
    return paymentIntent;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
}

export async function getSubscriptionTiers() {
  try {
    // First, check what columns actually exist in the table
    // Filter active subscription tiers - select only essential columns that we know exist
    const tiers = await db
      .select({
        id: subscriptionTiers.id,
        name: subscriptionTiers.name,
        description: subscriptionTiers.description,
        price: subscriptionTiers.price,
        billingPeriod: subscriptionTiers.billingPeriod,
        features: subscriptionTiers.features,
        active: subscriptionTiers.active
      })
      .from(subscriptionTiers)
      .where(eq(subscriptionTiers.active, true));
      
    // Map the database data to the structure expected by the client
    return tiers.map(tier => {
      // Calculate yearly price (20% discount on monthly price × 12)
      const yearlyPrice = tier.billingPeriod === 'yearly' 
        ? Number(tier.price)
        : Math.round(Number(tier.price) * 12 * 0.8 * 100) / 100;
        
      return {
        id: tier.id,
        name: tier.name,
        description: tier.description,
        price: Number(tier.price),
        yearlyPrice: tier.billingPeriod === 'yearly' ? Number(tier.price) : yearlyPrice,
        features: Array.isArray(tier.features) ? tier.features : [],
        isPopular: tier.name.toLowerCase().includes('premium'),
        isActive: tier.active
      };
    });
  } catch (error) {
    console.error('Error fetching subscription tiers:', error);
    throw error;
  }
}

export async function getUserSubscription(userId: number) {
  try {
    const [subscription] = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId));
    
    return subscription;
  } catch (error) {
    console.error('Error fetching user subscription:', error);
    throw error;
  }
}

export async function createCustomer(email: string, name: string) {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
    });
    
    return customer;
  } catch (error) {
    console.error('Error creating customer:', error);
    throw error;
  }
}

export async function createSubscription(customerId: string, priceId: string) {
  try {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [
        {
          price: priceId,
        },
      ],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });
    
    return subscription;
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
}

export async function cancelSubscription(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
    
    return subscription;
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }
}

export async function reactivateSubscription(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });
    
    return subscription;
  } catch (error) {
    console.error('Error reactivating subscription:', error);
    throw error;
  }
}

export async function updateUserSubscriptionStatus(userId: number, subscription: Stripe.Subscription) {
  try {
    const [updated] = await db
      .update(userSubscriptions)
      .set({
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      })
      .where(eq(userSubscriptions.userId, userId))
      .returning();
    
    return updated;
  } catch (error) {
    console.error('Error updating user subscription status:', error);
    throw error;
  }
}

export async function handleWebhookEvent(event: Stripe.Event) {
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment succeeded:', paymentIntent.id);
        // Handle successful payment
        break;
        
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object as Stripe.Subscription;
        // Update the subscription status in the database
        // This requires mapping the subscription to a user ID through metadata or other means
        console.log('Subscription updated:', subscription.id);
        break;
        
      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription;
        console.log('Subscription deleted:', deletedSubscription.id);
        // Handle subscription deletion
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error('Error handling webhook event:', error);
    throw error;
  }
}
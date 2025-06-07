import Stripe from 'stripe';
import { db } from './db';
import { subscriptionTiers, userSubscriptions } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Initialize Stripe (optional for development)
let stripe: Stripe | null = null;

if (process.env.STRIPE_SECRET_KEY) {
  // Note: We're using a specific API version to ensure compatibility
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2022-11-15' as any,
  });
  console.log('✅ Stripe initialized for payments');
} else {
  console.log('🔧 Development mode: Stripe not configured (payments disabled)');
}

export { stripe };

export async function createPaymentIntent(amount: number, currency: string, metadata: Record<string, string>) {
  if (!stripe) {
    throw new Error('Stripe not configured. Set STRIPE_SECRET_KEY environment variable.');
  }
  
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
    // Use raw SQL query to avoid Drizzle schema mismatch issues
    const result = await db.execute(
      `SELECT id, name, description, price, billing_period, features, active 
       FROM subscription_tiers 
       WHERE active = true`
    );
    
    const tiers = result.rows as {
      id: number;
      name: string;
      description: string;
      price: string; // Decimal stored as string
      billing_period: string;
      features: string[] | null;
      active: boolean;
    }[];
      
    // Map the database data to the structure expected by the client
    return tiers.map(tier => {
      // Calculate yearly price (20% discount on monthly price × 12)
      const yearlyPrice = tier.billing_period === 'yearly' 
        ? Number(tier.price)
        : Math.round(Number(tier.price) * 12 * 0.8 * 100) / 100;
        
      return {
        id: tier.id,
        name: tier.name,
        description: tier.description,
        price: Number(tier.price),
        yearlyPrice: tier.billing_period === 'yearly' ? Number(tier.price) : yearlyPrice,
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
    // Use raw SQL query to avoid Drizzle schema mismatch issues
    const result = await db.execute(
      `SELECT 
        id, 
        user_id as "userId", 
        tier_id as "tierId", 
        stripe_customer_id as "stripeCustomerId", 
        stripe_subscription_id as "stripeSubscriptionId", 
        status, 
        current_period_start as "currentPeriodStart", 
        current_period_end as "currentPeriodEnd", 
        cancel_at_period_end as "cancelAtPeriodEnd", 
        created_at as "createdAt", 
        updated_at as "updatedAt"
       FROM user_subscriptions 
       WHERE user_id = $1`,
      [userId]
    );
    
    // Return the first result or null if none found
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error('Error fetching user subscription:', error);
    throw error;
  }
}

export async function createCustomer(email: string, name: string) {
  if (!stripe) {
    throw new Error('Stripe not configured. Set STRIPE_SECRET_KEY environment variable.');
  }
  
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
  if (!stripe) {
    throw new Error('Stripe not configured. Set STRIPE_SECRET_KEY environment variable.');
  }
  
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
  if (!stripe) {
    throw new Error('Stripe not configured. Set STRIPE_SECRET_KEY environment variable.');
  }
  
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
  if (!stripe) {
    throw new Error('Stripe not configured. Set STRIPE_SECRET_KEY environment variable.');
  }
  
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
    // Check if a record exists for this user
    const existingResult = await db.execute(
      `SELECT * FROM user_subscriptions WHERE user_id = $1`,
      [userId]
    );

    const currentPeriodStart = new Date((subscription as any).current_period_start * 1000);
    const currentPeriodEnd = new Date((subscription as any).current_period_end * 1000);
    const cancelAtPeriodEnd = subscription.cancel_at_period_end || false;

    if (existingResult.rows.length > 0) {
      // Update existing subscription
      const result = await db.execute(
        `UPDATE user_subscriptions 
         SET 
          status = $1, 
          current_period_start = $2, 
          current_period_end = $3, 
          cancel_at_period_end = $4,
          updated_at = NOW()
         WHERE user_id = $5
         RETURNING *`,
        [
          subscription.status,
          currentPeriodStart, 
          currentPeriodEnd,
          cancelAtPeriodEnd,
          userId
        ]
      );
      
      // Return the updated subscription
      return result.rows.length > 0 ? result.rows[0] : null;
    } else {
      // Create a new subscription record if none exists
      // This handles cases where webhook events arrive before the DB is updated
      const result = await db.execute(
        `INSERT INTO user_subscriptions (
          user_id,
          stripe_customer_id,
          stripe_subscription_id,
          status,
          current_period_start,
          current_period_end,
          cancel_at_period_end,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING *`,
        [
          userId,
          subscription.customer,
          subscription.id,
          subscription.status,
          currentPeriodStart,
          currentPeriodEnd,
          cancelAtPeriodEnd
        ]
      );
      
      return result.rows.length > 0 ? result.rows[0] : null;
    }
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
        
        // Process successful payment
        if (paymentIntent.metadata && paymentIntent.metadata.userId) {
          const userId = Number(paymentIntent.metadata.userId);
          console.log(`Processing successful payment for user ID: ${userId}`);
          
          if (paymentIntent.metadata.type === 'subscription') {
            // This was for a subscription - but subscriptions are typically handled by 
            // the subscription events below, not by payment_intent.succeeded
            console.log('Subscription payment completed');
          }
        }
        break;
        
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription event:', subscription.id);
        
        // Find the user by customer ID
        try {
          // Use raw SQL for reliability
          const result = await db.execute(
            `SELECT * FROM user_subscriptions WHERE stripe_customer_id = $1 LIMIT 1`,
            [subscription.customer]
          );
          
          if (result.rows.length > 0) {
            const userSubscription = result.rows[0];
            const userId = userSubscription.user_id;
            
            // Update the subscription status in the database
            await updateUserSubscriptionStatus(userId, subscription);
            console.log(`Updated subscription status for user ${userId}`);
          } else {
            console.warn(`Could not find user for customer ID: ${subscription.customer}`);
          }
        } catch (err) {
          console.error('Error processing subscription webhook:', err);
        }
        break;
        
      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription;
        console.log('Subscription deleted:', deletedSubscription.id);
        
        // Find the user by customer ID and update status
        try {
          // Use raw SQL for reliability
          const result = await db.execute(
            `SELECT * FROM user_subscriptions WHERE stripe_customer_id = $1 LIMIT 1`,
            [deletedSubscription.customer]
          );
          
          if (result.rows.length > 0) {
            const userSubscription = result.rows[0];
            const userId = userSubscription.user_id;
            
            // Mark subscription as canceled in the database
            await db.execute(
              `UPDATE user_subscriptions 
               SET status = 'canceled', 
                   updated_at = NOW()
               WHERE user_id = $1`,
              [userId]
            );
            console.log(`Marked subscription as canceled for user ${userId}`);
          }
        } catch (err) {
          console.error('Error processing subscription deletion webhook:', err);
        }
        break;
        
      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Invoice payment succeeded:', invoice.id);
        if ((invoice as any).subscription) {
          console.log(`Associated subscription: ${(invoice as any).subscription}`);
          // Could update subscription status or add payment history here
        }
        break;
        
      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as Stripe.Invoice;
        console.log('Invoice payment failed:', failedInvoice.id);
        if ((failedInvoice as any).subscription) {
          console.log(`Failed payment for subscription: ${(failedInvoice as any).subscription}`);
          // Could notify user or update subscription status here
        }
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error('Error handling webhook event:', error);
    throw error;
  }
}
import Stripe from 'stripe';
import { db } from './db';
import { subscriptionTiers, users, userSubscriptions } from '../shared/schema';
import { eq } from 'drizzle-orm';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY environment variable");
}

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export class StripeService {
  /**
   * Create a new Stripe customer
   */
  async createCustomer(userId: number, email: string, name: string) {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          userId: userId.toString(),
        },
      });
      
      return customer;
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      throw error;
    }
  }

  /**
   * Create a subscription for a customer
   */
  async createSubscription(stripeCustomerId: string, priceId: string) {
    try {
      const subscription = await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });
      
      return subscription;
    } catch (error) {
      console.error('Error creating Stripe subscription:', error);
      throw error;
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string) {
    try {
      return await stripe.subscriptions.cancel(subscriptionId);
    } catch (error) {
      console.error('Error canceling Stripe subscription:', error);
      throw error;
    }
  }

  /**
   * Update a subscription
   */
  async updateSubscription(subscriptionId: string, priceId: string) {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      
      // Get the subscription item ID
      const itemId = subscription.items.data[0].id;
      
      // Update the subscription with the new price
      return await stripe.subscriptions.update(subscriptionId, {
        items: [{ id: itemId, price: priceId }],
      });
    } catch (error) {
      console.error('Error updating Stripe subscription:', error);
      throw error;
    }
  }

  /**
   * Create a payment intent for a one-time purchase
   */
  async createPaymentIntent(amount: number, currency: string = 'usd', customerId?: string) {
    try {
      const paymentIntentOptions: Stripe.PaymentIntentCreateParams = {
        amount,
        currency,
        automatic_payment_methods: { enabled: true },
      };
      
      if (customerId) {
        paymentIntentOptions.customer = customerId;
      }
      
      return await stripe.paymentIntents.create(paymentIntentOptions);
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }

  /**
   * Create a product in Stripe
   */
  async createProduct(name: string, description: string) {
    try {
      return await stripe.products.create({
        name,
        description,
      });
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  /**
   * Create a price for a product
   */
  async createPrice(productId: string, amount: number, currency: string = 'usd', recurring?: { interval: 'month' | 'year' }) {
    try {
      const priceOptions: Stripe.PriceCreateParams = {
        product: productId,
        unit_amount: amount,
        currency,
      };
      
      if (recurring) {
        priceOptions.recurring = recurring;
      }
      
      return await stripe.prices.create(priceOptions);
    } catch (error) {
      console.error('Error creating price:', error);
      throw error;
    }
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhookEvent(event: Stripe.Event) {
    try {
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          await this.updateSubscriptionStatus(subscription);
          break;
        }
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          await this.handleCanceledSubscription(subscription);
          break;
        }
        case 'invoice.payment_succeeded': {
          const invoice = event.data.object as Stripe.Invoice;
          if (invoice.subscription) {
            const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
            await this.updateSubscriptionStatus(subscription);
          }
          break;
        }
        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice;
          if (invoice.subscription) {
            const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
            await this.updateSubscriptionStatus(subscription);
          }
          break;
        }
      }
    } catch (error) {
      console.error('Error handling webhook event:', error);
      throw error;
    }
  }

  /**
   * Update subscription status in database
   */
  private async updateSubscriptionStatus(subscription: Stripe.Subscription) {
    try {
      // Get the customer
      const customer = await stripe.customers.retrieve(subscription.customer as string);
      if (!customer || customer.deleted) return;
      
      // Get the userId from customer metadata
      const userId = customer.metadata.userId;
      if (!userId) return;
      
      // Find the subscription in our database
      const [existingSubscription] = await db
        .select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.stripeSubscriptionId, subscription.id));
      
      if (existingSubscription) {
        // Update existing subscription
        await db
          .update(userSubscriptions)
          .set({
            status: subscription.status,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            updatedAt: new Date(),
          })
          .where(eq(userSubscriptions.id, existingSubscription.id));
      } else {
        // Find the subscription tier for this subscription
        const price = subscription.items.data[0].price;
        const [tier] = await db
          .select()
          .from(subscriptionTiers)
          .where(eq(subscriptionTiers.stripePriceId, price.id));
          
        if (!tier) return;
        
        // Create new subscription record
        await db.insert(userSubscriptions).values({
          userId: parseInt(userId),
          tierId: tier.id,
          stripeCustomerId: subscription.customer as string,
          stripeSubscriptionId: subscription.id,
          status: subscription.status,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        });
      }
    } catch (error) {
      console.error('Error updating subscription status:', error);
      throw error;
    }
  }

  /**
   * Handle canceled subscription
   */
  private async handleCanceledSubscription(subscription: Stripe.Subscription) {
    try {
      // Find the subscription in our database
      const [existingSubscription] = await db
        .select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.stripeSubscriptionId, subscription.id));
      
      if (existingSubscription) {
        // Update subscription status to canceled
        await db
          .update(userSubscriptions)
          .set({
            status: 'canceled',
            updatedAt: new Date(),
          })
          .where(eq(userSubscriptions.id, existingSubscription.id));
      }
    } catch (error) {
      console.error('Error handling canceled subscription:', error);
      throw error;
    }
  }
}

// Create a singleton instance
export const stripeService = new StripeService();
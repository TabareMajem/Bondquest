import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/contexts/AuthContext';
import CheckoutForm from '@/components/CheckoutForm';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle, ArrowLeftIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export default function CheckoutPage() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itemDetails, setItemDetails] = useState<{
    type: string;
    itemId: number;
    amount: number;
    returnUrl: string;
  } | null>(null);

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      navigate('/auth');
      return;
    }

    // Get URL parameters
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    const itemId = params.get('itemId');
    const amount = params.get('amount');
    const returnUrl = params.get('returnUrl') || '/subscription';

    // Validate parameters
    if (!type || !itemId || !amount) {
      setError('Missing required checkout parameters');
      setLoading(false);
      return;
    }

    setItemDetails({
      type: type,
      itemId: parseInt(itemId),
      amount: parseFloat(amount),
      returnUrl: returnUrl,
    });

    // Create payment intent
    const createPaymentIntent = async () => {
      try {
        const response = await apiRequest('POST', '/api/stripe/create-payment-intent', {
          amount: parseFloat(amount) * 100, // Convert to cents
          currency: 'usd',
          metadata: {
            type: type,
            itemId: itemId,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create payment intent');
        }

        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (err: any) {
        console.error('Error creating payment intent:', err);
        setError(err.message || 'Error creating payment intent');
        toast({
          title: 'Error',
          description: err.message || 'Error creating payment intent',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    createPaymentIntent();
  }, [user, navigate, toast]);

  const handleBackClick = () => {
    if (itemDetails?.returnUrl) {
      navigate(itemDetails.returnUrl);
    } else {
      navigate('/subscription');
    }
  };

  return (
    <PageLayout pageTitle="Checkout" className="max-w-2xl mx-auto">
      <div className="space-y-6">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mb-4" 
          onClick={handleBackClick}
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Card className="border border-border shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl">Checkout</CardTitle>
            <CardDescription>
              Complete your payment securely
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Preparing checkout...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-destructive">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  onClick={handleBackClick}
                >
                  Go Back
                </Button>
              </div>
            ) : clientSecret && itemDetails ? (
              <div>
                <div className="mb-6 p-4 bg-muted rounded-md">
                  <h3 className="font-medium mb-2">Order Summary</h3>
                  <div className="flex justify-between mb-1">
                    <span>Type:</span>
                    <span className="font-medium">{itemDetails.type === 'subscription' ? 'Subscription' : 'One-time Purchase'}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span>Amount:</span>
                    <span className="font-medium">${itemDetails.amount.toFixed(2)}</span>
                  </div>
                </div>

                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <CheckoutForm 
                    returnUrl={itemDetails.returnUrl} 
                    amount={itemDetails.amount}
                  />
                </Elements>
              </div>
            ) : (
              <div className="text-center py-8 text-destructive">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>Something went wrong. Please try again.</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  onClick={handleBackClick}
                >
                  Go Back
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
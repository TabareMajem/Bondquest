import { useState, FormEvent, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useStripe, useElements, PaymentElement, AddressElement } from '@stripe/react-stripe-js';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, CheckCheck } from 'lucide-react';

interface CheckoutFormProps {
  returnUrl: string;
  amount: number;
}

export function CheckoutForm({ returnUrl, amount }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!stripe) {
      return;
    }

    // Retrieve the payment intent to check the status
    const clientSecret = new URLSearchParams(window.location.search).get(
      'payment_intent_client_secret'
    );

    if (!clientSecret) {
      return;
    }

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      if (!paymentIntent) {
        return;
      }

      switch (paymentIntent.status) {
        case 'succeeded':
          setMessage('Payment succeeded!');
          setIsSuccess(true);
          break;
        case 'processing':
          setMessage('Your payment is processing.');
          break;
        case 'requires_payment_method':
          setMessage('Your payment was not successful, please try again.');
          break;
        default:
          setMessage('Something went wrong.');
          break;
      }
    });
  }, [stripe]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Return to the specified URL on successful payment
        return_url: `${window.location.origin}${returnUrl}`,
      },
    });

    // This point will only be reached if there is an immediate error when
    // confirming the payment. Otherwise, your customer will be redirected to
    // your `return_url`. For some payment methods like iDEAL, your customer will
    // be redirected to an intermediate site first to authorize the payment, then
    // redirected to the `return_url`.
    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        setMessage(error.message || "An unexpected error occurred.");
      } else {
        setMessage("An unexpected error occurred.");
      }
      toast({
        title: "Payment failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-6">
      {isSuccess ? (
        <div className="text-center space-y-4 my-8">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
          <h3 className="text-xl font-semibold">Payment Successful!</h3>
          <p className="text-muted-foreground">Thank you for your payment.</p>
          <Button 
            onClick={() => navigate(returnUrl)}
            className="mt-4"
          >
            Continue
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            <PaymentElement id="payment-element" options={{
              layout: 'tabs'
            }} />
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium">Billing Address</h3>
            <AddressElement options={{
              mode: 'shipping',
              allowedCountries: ['US', 'CA', 'GB', 'AU'],
            }} />
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              disabled={isLoading || !stripe || !elements}
              className="w-full"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </span>
              ) : (
                <span className="flex items-center">
                  <CheckCheck className="mr-2 h-4 w-4" />
                  Pay ${amount.toFixed(2)}
                </span>
              )}
            </Button>
          </div>

          {message && (
            <div className={`text-sm text-center mt-4 ${
              message.includes('succeeded') 
                ? 'text-green-600' 
                : 'text-destructive'
            }`}>
              {message}
            </div>
          )}
        </>
      )}
    </form>
  );
}
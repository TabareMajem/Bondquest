import React, { useState, useEffect } from "react";
import {
  PaymentElement,
  useStripe,
  useElements
} from "@stripe/react-stripe-js";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function CheckoutForm({ returnUrl = "/", amount = 0 }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  const [message, setMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    if (!stripe) {
      return;
    }

    // Check if payment was successful on return from redirect
    const clientSecret = new URLSearchParams(window.location.search).get(
      "payment_intent_client_secret"
    );

    if (!clientSecret) {
      return;
    }

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      switch (paymentIntent?.status) {
        case "succeeded":
          setMessage("Payment succeeded!");
          setPaymentSuccess(true);
          break;
        case "processing":
          setMessage("Your payment is processing.");
          break;
        case "requires_payment_method":
          setMessage("Your payment was not successful, please try again.");
          break;
        default:
          setMessage("Something went wrong.");
          break;
      }
    });
  }, [stripe]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          // Success URL including the client secret to verify the payment
          return_url: `${window.location.origin}${returnUrl}`,
        },
        redirect: "if_required",
      });

      if (error) {
        if (error.type === "card_error" || error.type === "validation_error") {
          setMessage(error.message || "An unexpected error occurred");
        } else {
          setMessage("An unexpected error occurred");
        }
        toast({
          title: "Payment failed",
          description: error.message || "Something went wrong with your payment",
          variant: "destructive",
        });
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        setMessage("Payment successful!");
        setPaymentSuccess(true);
        toast({
          title: "Payment successful",
          description: "Thank you for your payment",
        });
        
        // Wait a bit before redirecting to give user time to see success message
        setTimeout(() => {
          navigate(returnUrl);
        }, 2000);
      } else {
        setMessage("Payment processing");
      }
    } catch (err) {
      console.error(err);
      setMessage("An error occurred during payment processing");
      toast({
        title: "Payment error",
        description: "Something went wrong processing your payment",
        variant: "destructive",
      });
    }

    setIsProcessing(false);
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit} className="space-y-6">
      {/* Amount Display */}
      <div className="text-center mb-6">
        <p className="text-sm text-gray-500">Total amount</p>
        <p className="text-3xl font-semibold">${amount.toFixed(2)}</p>
      </div>

      {/* Payment Element */}
      <PaymentElement id="payment-element" />

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full h-12"
        disabled={isProcessing || !stripe || !elements || paymentSuccess}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : paymentSuccess ? (
          <>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Paid Successfully
          </>
        ) : (
          `Pay $${amount.toFixed(2)}`
        )}
      </Button>

      {/* Payment Message */}
      {message && (
        <div className={`mt-4 p-3 rounded-md flex items-start ${
          paymentSuccess 
            ? "bg-green-50 text-green-700" 
            : "bg-amber-50 text-amber-700"
        }`}>
          {paymentSuccess ? (
            <CheckCircle2 className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          )}
          <span>{message}</span>
        </div>
      )}

      {/* Secure Payment Notice */}
      <div className="text-center text-sm text-gray-500 mt-4 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Secure payment powered by Stripe
      </div>
    </form>
  );
}
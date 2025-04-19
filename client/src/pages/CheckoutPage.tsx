import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import CheckoutForm from "@/components/CheckoutForm";
import { apiRequest } from "@/lib/queryClient";
import PageLayout from "@/components/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

// Make sure to call loadStripe outside of a component's render to avoid
// recreating the Stripe object on every render
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export default function CheckoutPage() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get query parameters
  const searchParams = new URLSearchParams(location.split("?")[1]);
  const type = searchParams.get("type");
  const itemId = searchParams.get("itemId");
  const amount = Number(searchParams.get("amount") || "0");
  const returnUrl = searchParams.get("returnUrl") || "/account";

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  // Create a payment intent when the page loads
  useEffect(() => {
    if (!user || !amount || amount <= 0) {
      setIsLoading(false);
      return;
    }

    const createPaymentIntent = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const metadata: Record<string, string> = {
          userId: user.id.toString(),
          type: type || "one-time",
        };

        if (itemId) {
          metadata.itemId = itemId;
        }

        const response = await apiRequest("POST", "/api/stripe/create-payment-intent", {
          amount: amount * 100, // Convert to cents
          currency: "usd",
          userId: user.id,
          metadata,
        });

        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (err) {
        console.error("Error creating payment intent:", err);
        setError("Failed to initialize payment. Please try again later.");
        toast({
          title: "Payment Error",
          description: "There was a problem initializing your payment. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    createPaymentIntent();
  }, [user, amount, itemId, type, toast]);

  if (!user) {
    return null; // Or a loading state
  }

  return (
    <PageLayout activeTab="none" pageTitle="Checkout" className="max-w-md mx-auto">
      <Card className="border border-border shadow-md">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Complete Your Payment</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">Initializing payment...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              <p>{error}</p>
            </div>
          ) : clientSecret ? (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: "stripe",
                  variables: {
                    colorPrimary: "#9333ea",
                    colorBackground: "#ffffff",
                    colorText: "#1f2937",
                    fontFamily: "Inter, sans-serif",
                  },
                },
              }}
            >
              <CheckoutForm returnUrl={returnUrl} amount={amount} />
            </Elements>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No payment information available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </PageLayout>
  );
}
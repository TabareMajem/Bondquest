import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import PageLayout from "@/components/layout/PageLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, AlertCircle } from "lucide-react";

interface SubscriptionTier {
  id: number;
  name: string;
  price: number;
  yearlyPrice: number | null;
  description: string;
  features: string[];
  isPopular: boolean;
  isActive: boolean;
}

interface UserSubscription {
  id: number;
  tierId: number;
  status: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean | null;
}

export default function SubscriptionPage() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [yearlyBilling, setYearlyBilling] = useState(false);
  const [activeErrorSection, setActiveErrorSection] = useState<string | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  // Query subscription tiers
  const { 
    data: tiers, 
    isLoading: tiersLoading, 
    error: tiersError 
  } = useQuery({
    queryKey: ["/api/stripe/subscription-tiers"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/stripe/subscription-tiers");
      const data = await response.json();
      return data as SubscriptionTier[];
    },
    enabled: !!user,
  });

  // Query user subscription status
  const { 
    data: userSubscription, 
    isLoading: subscriptionLoading, 
    error: subscriptionError 
  } = useQuery({
    queryKey: ["/api/stripe/user-subscription"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/stripe/user-subscription");
      const data = await response.json();
      return data as UserSubscription;
    },
    enabled: !!user,
  });

  const isLoading = tiersLoading || subscriptionLoading;
  const hasError = tiersError || subscriptionError;

  const handleSelectPlan = (tier: SubscriptionTier) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to subscribe to a plan.",
        variant: "destructive",
      });
      return;
    }

    if (userSubscription && userSubscription.status === "active" && userSubscription.tierId === tier.id) {
      toast({
        title: "Already subscribed",
        description: "You are already subscribed to this plan.",
      });
      return;
    }

    const price = yearlyBilling ? tier.yearlyPrice : tier.price;
    if (!price) {
      toast({
        title: "Price not available",
        description: "This subscription option is not available right now.",
        variant: "destructive",
      });
      return;
    }

    // Navigate to checkout with appropriate parameters
    navigate(`/checkout?type=subscription&itemId=${tier.id}&amount=${price}&returnUrl=/subscription`);
  };

  const handleCancelSubscription = async () => {
    if (!userSubscription || !userSubscription.stripeSubscriptionId) return;

    try {
      const response = await apiRequest("POST", "/api/stripe/cancel-subscription", {
        subscriptionId: userSubscription.stripeSubscriptionId,
      });

      if (response.ok) {
        toast({
          title: "Subscription cancelled",
          description: "Your subscription will remain active until the end of the current billing period.",
        });
        // Refetch subscription status
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast({
          title: "Error",
          description: "Failed to cancel subscription. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again later.",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return null; // Or a loading state
  }

  return (
    <PageLayout activeTab="account" pageTitle="Subscription" className="max-w-4xl mx-auto">
      <div className="space-y-8">
        {/* Current Subscription Status */}
        <Card className="border border-border shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl">Your Subscription</CardTitle>
            <CardDescription>
              Manage your BondQuest subscription and billing
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : hasError ? (
              <div className="text-center py-8 text-destructive">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>Failed to load subscription information</p>
              </div>
            ) : userSubscription ? (
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-medium text-lg">
                      {tiers?.find(t => t.id === userSubscription.tierId)?.name || "Unknown Plan"}
                      <Badge variant={userSubscription.status === "active" ? "success" : "secondary"} className="ml-2">
                        {userSubscription.status === "active" ? "Active" : userSubscription.status}
                      </Badge>
                    </h3>
                    {userSubscription.currentPeriodEnd && (
                      <p className="text-sm text-muted-foreground">
                        {userSubscription.cancelAtPeriodEnd 
                          ? `Access until ${new Date(userSubscription.currentPeriodEnd).toLocaleDateString()}`
                          : `Renews on ${new Date(userSubscription.currentPeriodEnd).toLocaleDateString()}`
                        }
                      </p>
                    )}
                  </div>
                  
                  {userSubscription.status === "active" && !userSubscription.cancelAtPeriodEnd && (
                    <Button 
                      variant="outline" 
                      onClick={handleCancelSubscription}
                    >
                      Cancel Subscription
                    </Button>
                  )}
                  
                  {userSubscription.status === "active" && userSubscription.cancelAtPeriodEnd && (
                    <Button 
                      variant="outline" 
                      onClick={async () => {
                        try {
                          const response = await apiRequest("POST", "/api/stripe/reactivate-subscription", {
                            subscriptionId: userSubscription.stripeSubscriptionId,
                          });
                          
                          if (response.ok) {
                            toast({
                              title: "Subscription reactivated",
                              description: "Your subscription will continue past the current billing period.",
                            });
                            setTimeout(() => window.location.reload(), 1000);
                          } else {
                            toast({
                              title: "Error",
                              description: "Failed to reactivate subscription.",
                              variant: "destructive",
                            });
                          }
                        } catch (err) {
                          console.error(err);
                          toast({
                            title: "Error",
                            description: "Something went wrong. Please try again later.",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      Resume Subscription
                    </Button>
                  )}
                </div>
                
                {userSubscription.status !== "active" && (
                  <div className="mt-4 p-4 bg-muted rounded-md">
                    <p className="text-sm">
                      Your subscription is not active. Select a plan below to subscribe.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="mb-4">You don't have an active subscription.</p>
                <p className="text-sm text-muted-foreground">
                  Subscribe to a plan below to unlock premium features.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subscription Plans */}
        <div className="space-y-6">
          <div className="flex flex-col space-y-4">
            <h2 className="text-2xl font-bold text-center">Subscription Plans</h2>
            <p className="text-center text-muted-foreground">
              Choose the plan that works best for your relationship journey
            </p>
            
            {/* Billing toggle */}
            <div className="flex items-center justify-center gap-2 mt-4">
              <span className={`text-sm ${!yearlyBilling ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>
                Monthly
              </span>
              
              <button
                type="button"
                role="switch"
                aria-checked={yearlyBilling}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline focus-visible:ring-2 focus-visible:ring-offset-2 ${
                  yearlyBilling ? 'bg-primary' : 'bg-input'
                }`}
                onClick={() => setYearlyBilling(!yearlyBilling)}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${
                    yearlyBilling ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              
              <span className={`text-sm ${yearlyBilling ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>
                Yearly
                <Badge variant="outline" className="ml-1.5 text-xs font-normal">
                  Save 20%
                </Badge>
              </span>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : hasError ? (
            <div className="text-center py-12 text-destructive">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>Failed to load subscription plans</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {tiers?.filter(tier => tier.isActive).map((tier) => {
                const isCurrentPlan = userSubscription?.tierId === tier.id && userSubscription.status === "active";
                const price = yearlyBilling && tier.yearlyPrice ? tier.yearlyPrice : tier.price;
                const interval = yearlyBilling ? "/year" : "/month";
                
                return (
                  <Card 
                    key={tier.id} 
                    className={`border border-border shadow-md transition-all ${
                      tier.isPopular ? 'ring-2 ring-primary relative transform hover:scale-105' : 'hover:shadow-lg hover:border-primary'
                    }`}
                  >
                    {tier.isPopular && (
                      <div className="absolute -top-3 left-0 right-0 mx-auto w-fit bg-primary text-white px-3 py-1 rounded text-xs font-semibold">
                        MOST POPULAR
                      </div>
                    )}
                    
                    <CardHeader>
                      <CardTitle>{tier.name}</CardTitle>
                      <CardDescription>
                        {tier.description}
                      </CardDescription>
                      <div className="mt-4">
                        <span className="text-3xl font-bold">${price}</span>
                        <span className="text-muted-foreground text-sm">{interval}</span>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <ul className="space-y-2">
                        {tier.features.map((feature, i) => (
                          <li key={i} className="flex items-start">
                            <Check className="h-5 w-5 text-primary shrink-0 mr-2" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    
                    <CardFooter>
                      <Button 
                        className={`w-full ${tier.isPopular ? 'bg-primary hover:bg-primary/90' : ''}`}
                        variant={tier.isPopular ? "default" : "outline"}
                        disabled={isCurrentPlan}
                        onClick={() => handleSelectPlan(tier)}
                      >
                        {isCurrentPlan ? "Current Plan" : "Subscribe"}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* FAQ Section */}
        <Card className="border border-border shadow-md mt-8">
          <CardHeader>
            <CardTitle className="text-xl">Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">How will I be billed?</h3>
              <p className="text-sm text-muted-foreground">
                You'll be charged immediately for your first subscription period. Billing will automatically continue according to your chosen plan (monthly or yearly) until you cancel.
              </p>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <h3 className="font-medium">Can I change my plan?</h3>
              <p className="text-sm text-muted-foreground">
                Yes, you can upgrade or downgrade your plan at any time. Changes to your subscription will take effect immediately.
              </p>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <h3 className="font-medium">How do I cancel?</h3>
              <p className="text-sm text-muted-foreground">
                You can cancel your subscription at any time from this page. After cancellation, you'll still have access to your paid features until the end of your current billing period.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
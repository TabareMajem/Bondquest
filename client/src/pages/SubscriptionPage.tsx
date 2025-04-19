import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { SubscriptionTier, UserSubscription } from "@shared/schema";
import { loadStripe } from "@stripe/stripe-js";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { AlertCircle, CreditCard, ShieldCheck, CheckCircle, Clock, Gift, Award, Zap, X } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";

// Load Stripe outside of component render to avoid recreating Stripe object on every render
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export default function SubscriptionPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTierId, setSelectedTierId] = useState<number | null>(null);
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  // Fetch available subscription tiers
  const { 
    data: subscriptionTiers, 
    isLoading: isLoadingTiers 
  } = useQuery<SubscriptionTier[]>({
    queryKey: ["/api/stripe/subscription-tiers"],
    enabled: !!user,
  });

  // Fetch user's current subscription
  const {
    data: userSubscription,
    isLoading: isLoadingSubscription
  } = useQuery<UserSubscription>({
    queryKey: ["/api/stripe/user-subscription", user?.id],
    enabled: !!user?.id,
  });

  // Subscribe mutation
  const subscribeMutation = useMutation({
    mutationFn: async (tierId: number) => {
      const response = await apiRequest("POST", "/api/stripe/create-subscription", {
        userId: user.id,
        tierId,
      });
      return await response.json();
    },
    onSuccess: async (data) => {
      if (!data.clientSecret) {
        toast({
          title: "Subscription created",
          description: "Your subscription has been activated.",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/stripe/user-subscription", user?.id] });
        return;
      }

      const stripe = await stripePromise;
      if (!stripe) {
        toast({
          title: "Error",
          description: "Could not load payment processor",
          variant: "destructive",
        });
        return;
      }

      // Confirm the payment with Stripe
      const { error } = await stripe.confirmCardPayment(data.clientSecret);
      if (error) {
        toast({
          title: "Payment failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Subscription active",
          description: "Your subscription has been activated successfully.",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/stripe/user-subscription", user?.id] });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create subscription. Please try again.",
        variant: "destructive",
      });
      console.error("Error creating subscription:", error);
    },
  });

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/stripe/cancel-subscription", {
        userId: user.id,
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Subscription cancelled",
        description: "Your subscription has been cancelled and will end at the current billing period.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/stripe/user-subscription", user?.id] });
      setIsConfirmingCancel(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
      console.error("Error cancelling subscription:", error);
      setIsConfirmingCancel(false);
    },
  });

  // Update subscription mutation
  const updateSubscriptionMutation = useMutation({
    mutationFn: async (newTierId: number) => {
      const response = await apiRequest("POST", "/api/stripe/update-subscription", {
        userId: user.id,
        newTierId,
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Subscription updated",
        description: "Your subscription has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/stripe/user-subscription", user?.id] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update subscription. Please try again.",
        variant: "destructive",
      });
      console.error("Error updating subscription:", error);
    },
  });

  const handleSubscribe = (tierId: number) => {
    setSelectedTierId(tierId);
    subscribeMutation.mutate(tierId);
  };

  const handleChangeSubscription = (tierId: number) => {
    setSelectedTierId(tierId);
    updateSubscriptionMutation.mutate(tierId);
  };

  const handleCancelSubscription = () => {
    cancelSubscriptionMutation.mutate();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle className="h-3.5 w-3.5 mr-1" /> Active</Badge>;
      case "canceled":
        return <Badge variant="outline" className="text-red-500 border-red-500"><X className="h-3.5 w-3.5 mr-1" /> Cancelled</Badge>;
      case "past_due":
        return <Badge variant="destructive"><AlertCircle className="h-3.5 w-3.5 mr-1" /> Past Due</Badge>;
      case "incomplete":
        return <Badge variant="outline" className="text-amber-500 border-amber-500"><Clock className="h-3.5 w-3.5 mr-1" /> Incomplete</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!user) {
    return null; // Or loading state
  }

  const isLoading = isLoadingTiers || isLoadingSubscription;
  const hasActiveSubscription = userSubscription && userSubscription.status === "active";
  const isPendingAction = subscribeMutation.isPending || cancelSubscriptionMutation.isPending || updateSubscriptionMutation.isPending;

  return (
    <PageLayout activeTab="account" pageTitle="Subscription" className="pb-28">
      <div className="flex flex-col space-y-8">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-purple-700 to-pink-600 p-6 md:p-8 rounded-lg text-white shadow-lg">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Subscription Management</h1>
          <p className="text-white/80 max-w-2xl">
            Upgrade your relationship journey with premium features and exclusive content.
            Choose the plan that best fits your needs.
          </p>
        </div>

        {/* Current Subscription Card (if exists) */}
        {!isLoading && userSubscription && (
          <Card className="border-2 border-purple-200 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <Award className="h-6 w-6 mr-2 text-purple-500" />
                Your Subscription
              </CardTitle>
              <div className="flex items-center mt-1">
                {getStatusBadge(userSubscription.status)}
                {userSubscription.cancelAtPeriodEnd && (
                  <Badge variant="outline" className="ml-2 text-amber-500 border-amber-500">
                    <Clock className="h-3.5 w-3.5 mr-1" /> Ending Soon
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Plan</h3>
                  <p className="text-lg font-semibold">{userSubscription.tierName || `Plan #${userSubscription.tierId}`}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Billing Period</h3>
                  <p className="text-lg font-semibold">
                    {userSubscription.currentPeriodStart && userSubscription.currentPeriodEnd ? (
                      <>
                        {format(new Date(userSubscription.currentPeriodStart), 'MMM d, yyyy')} - 
                        {format(new Date(userSubscription.currentPeriodEnd), 'MMM d, yyyy')}
                      </>
                    ) : 'Not available'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <p className="text-lg font-semibold capitalize">{userSubscription.status}</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 pt-2">
              {userSubscription.status === "active" && !userSubscription.cancelAtPeriodEnd && (
                <Dialog open={isConfirmingCancel} onOpenChange={setIsConfirmingCancel}>
                  <DialogTrigger asChild>
                    <Button variant="outline" disabled={isPendingAction}>
                      Cancel Subscription
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cancel Your Subscription?</DialogTitle>
                      <DialogDescription>
                        Your subscription will remain active until the end of the current billing period, and then it will be cancelled.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <p className="text-amber-500 flex items-center">
                        <AlertCircle className="h-5 w-5 mr-2" />
                        You'll lose access to premium features after your current period ends.
                      </p>
                    </div>
                    <DialogFooter>
                      <Button variant="ghost" onClick={() => setIsConfirmingCancel(false)}>
                        Keep My Subscription
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={handleCancelSubscription}
                        disabled={cancelSubscriptionMutation.isPending}
                      >
                        {cancelSubscriptionMutation.isPending ? "Cancelling..." : "Confirm Cancellation"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </CardFooter>
          </Card>
        )}

        {/* Subscription Tiers */}
        <Card>
          <CardHeader>
            <CardTitle>Available Plans</CardTitle>
            <CardDescription>
              Choose the plan that's right for you and your partner
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-40 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading" />
              </div>
            ) : subscriptionTiers && subscriptionTiers.length > 0 ? (
              <Tabs defaultValue="monthly" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2 mx-auto mb-8">
                  <TabsTrigger value="monthly">Monthly Billing</TabsTrigger>
                  <TabsTrigger value="yearly">Yearly Billing</TabsTrigger>
                </TabsList>
                
                <TabsContent value="monthly" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {subscriptionTiers
                      .filter(tier => tier.billingPeriod === 'monthly')
                      .map(tier => (
                        <PlanCard
                          key={tier.id}
                          tier={tier}
                          isCurrentPlan={userSubscription?.tierId === tier.id}
                          onSelect={hasActiveSubscription ? handleChangeSubscription : handleSubscribe}
                          isPendingAction={isPendingAction && selectedTierId === tier.id}
                        />
                      ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="yearly" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {subscriptionTiers
                      .filter(tier => tier.billingPeriod === 'yearly')
                      .map(tier => (
                        <PlanCard
                          key={tier.id}
                          tier={tier}
                          isCurrentPlan={userSubscription?.tierId === tier.id}
                          onSelect={hasActiveSubscription ? handleChangeSubscription : handleSubscribe}
                          isPendingAction={isPendingAction && selectedTierId === tier.id}
                        />
                      ))}
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Plans Available</h3>
                <p className="text-gray-500 mb-4 max-w-md mx-auto">
                  Our subscription plans are currently being updated. Please check back soon.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold">How does billing work?</h3>
              <p className="text-gray-600 text-sm mt-1">
                You'll be charged immediately when you subscribe, and then at the start of each billing period.
                You can cancel anytime and your subscription will remain active until the end of the current period.
              </p>
            </div>
            <div>
              <h3 className="font-semibold">Can I change my plan?</h3>
              <p className="text-gray-600 text-sm mt-1">
                Yes, you can upgrade or downgrade your plan at any time. When upgrading, you'll be charged the prorated difference immediately.
                When downgrading, your new rate will apply at the next billing cycle.
              </p>
            </div>
            <div>
              <h3 className="font-semibold">How do I cancel my subscription?</h3>
              <p className="text-gray-600 text-sm mt-1">
                You can cancel your subscription from this page. Your subscription will remain active until the end of your current billing period.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}

// Subscription plan card component
interface PlanCardProps {
  tier: SubscriptionTier;
  isCurrentPlan: boolean;
  onSelect: (tierId: number) => void;
  isPendingAction: boolean;
}

function PlanCard({ tier, isCurrentPlan, onSelect, isPendingAction }: PlanCardProps) {
  const features = tier.features as string[] || [];
  const isRecommended = tier.name.toLowerCase().includes('premium');
  
  return (
    <Card className={`relative overflow-hidden ${isRecommended ? 'border-2 border-purple-400 shadow-lg' : ''}`}>
      {isRecommended && (
        <div className="absolute top-0 right-0 bg-gradient-to-l from-purple-600 to-pink-600 text-white px-3 py-1 text-xs font-bold">
          RECOMMENDED
        </div>
      )}
      <CardHeader className={isRecommended ? 'pt-8' : ''}>
        <CardTitle>{tier.name}</CardTitle>
        <CardDescription>{tier.description}</CardDescription>
        <div className="mt-2">
          <span className="text-3xl font-bold">${(tier.price as any).toFixed(2)}</span>
          <span className="text-gray-500 ml-1">/{tier.billingPeriod === 'monthly' ? 'month' : 'year'}</span>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 mb-6">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <CheckCircle className="h-5 w-5 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button 
          className={isRecommended ? 'w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700' : 'w-full'}
          variant={isRecommended ? 'default' : 'outline'}
          disabled={isCurrentPlan || isPendingAction}
          onClick={() => onSelect(tier.id)}
        >
          {isPendingAction ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
              Processing
            </>
          ) : isCurrentPlan ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" /> Current Plan
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4 mr-2" /> Select Plan
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
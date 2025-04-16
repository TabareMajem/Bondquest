import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, MoreHorizontal, Edit, Trash, CreditCard, Users, Check, X } from "lucide-react";
import { format } from "date-fns";
import { queryClient } from "@/lib/queryClient";
import { SubscriptionTier, UserSubscription } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";
import BottomNavigation from "@/components/layout/BottomNavigation";
import { apiRequest } from "@/lib/apiClient";

export default function AdminSubscriptions() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Check if user has admin access - in a real app, you would check user.role or similar
  const isAdmin = user?.email === "admin@bondquest.com";
  
  // Redirect non-admin users
  React.useEffect(() => {
    if (!isAdmin) {
      navigate("/home");
    }
  }, [isAdmin, navigate]);

  // Fetch subscription tiers
  const { 
    data: subscriptionTiers, 
    isLoading: isLoadingTiers, 
    isError: isErrorTiers 
  } = useQuery<SubscriptionTier[]>({
    queryKey: ["/api/admin/subscription-tiers"],
    enabled: isAdmin,
  });

  // Fetch user subscriptions 
  const {
    data: userSubscriptions,
    isLoading: isLoadingSubscriptions,
    isError: isErrorSubscriptions
  } = useQuery<UserSubscription[]>({
    queryKey: ["/api/admin/user-subscriptions"],
    enabled: isAdmin,
  });

  // Delete subscription tier mutation
  const deleteSubscriptionTierMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest(`/api/admin/subscription-tiers/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-tiers"] });
      toast({
        title: "Subscription Tier Deleted",
        description: "The subscription tier has been successfully deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete the subscription tier. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to delete subscription tier:", error);
    },
  });

  const handleDeleteTier = (id: number) => {
    if (window.confirm("Are you sure you want to delete this subscription tier?")) {
      deleteSubscriptionTierMutation.mutate(id);
    }
  };

  if (!isAdmin) {
    return null; // Not rendering if not admin
  }

  return (
    <div className="container mx-auto p-6 pb-24">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin")}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-purple-800">Subscription Management</h1>
        </div>
        <Button onClick={() => navigate("/admin/subscriptions/tiers/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Tier
        </Button>
      </div>

      <Tabs defaultValue="tiers" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="tiers">Subscription Tiers</TabsTrigger>
          <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tiers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Subscription Tiers</CardTitle>
              <CardDescription>
                Manage subscription tiers, pricing, and features
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTiers ? (
                <div className="flex justify-center items-center h-64">
                  <p className="text-gray-500">Loading subscription tiers...</p>
                </div>
              ) : isErrorTiers ? (
                <div className="flex justify-center items-center h-64">
                  <p className="text-red-500">Error loading subscription tiers. Please try again.</p>
                </div>
              ) : subscriptionTiers && subscriptionTiers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Billing Period</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Features</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptionTiers.map((tier) => (
                      <TableRow key={tier.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <CreditCard className="h-4 w-4 mr-2 text-purple-500" />
                            {tier.name}
                          </div>
                        </TableCell>
                        <TableCell>${tier.price}</TableCell>
                        <TableCell className="capitalize">{tier.billingPeriod}</TableCell>
                        <TableCell>
                          {tier.active ? (
                            <Badge className="bg-green-500">Active</Badge>
                          ) : (
                            <Badge variant="outline">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {Array.isArray(tier.features) && tier.features.length > 0 ? (
                            <span className="text-sm text-gray-500">
                              {tier.features.length} feature{tier.features.length > 1 ? 's' : ''}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">No features</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => navigate(`/admin/subscriptions/tiers/${tier.id}/edit`)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteTier(tier.id)}
                                className="text-red-600"
                              >
                                <Trash className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <CreditCard className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Subscription Tiers Found</h3>
                  <p className="text-gray-500 mb-4">
                    You haven't created any subscription tiers yet. Get started by adding your first tier.
                  </p>
                  <Button onClick={() => navigate("/admin/subscriptions/tiers/new")}>
                    Add Your First Tier
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="subscribers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Subscribers</CardTitle>
              <CardDescription>
                View and manage user subscriptions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSubscriptions ? (
                <div className="flex justify-center items-center h-64">
                  <p className="text-gray-500">Loading subscribers...</p>
                </div>
              ) : isErrorSubscriptions ? (
                <div className="flex justify-center items-center h-64">
                  <p className="text-red-500">Error loading subscribers. Please try again.</p>
                </div>
              ) : userSubscriptions && userSubscriptions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Billing Cycle</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Auto Renew</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userSubscriptions.map((subscription) => (
                      <TableRow key={subscription.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2 text-purple-500" />
                            User #{subscription.userId}
                          </div>
                        </TableCell>
                        <TableCell>{subscription.tierName || `Tier #${subscription.tierId}`}</TableCell>
                        <TableCell>
                          {subscription.status === "active" ? (
                            <Badge className="bg-green-500">Active</Badge>
                          ) : subscription.status === "canceled" ? (
                            <Badge variant="outline" className="border-red-500 text-red-500">Canceled</Badge>
                          ) : subscription.status === "expired" ? (
                            <Badge variant="outline">Expired</Badge>
                          ) : (
                            <Badge>{subscription.status}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="capitalize">{subscription.billingPeriod}</TableCell>
                        <TableCell>
                          {format(new Date(subscription.startDate), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          {subscription.endDate && format(new Date(subscription.endDate), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          {subscription.autoRenew ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <X className="h-4 w-4 text-red-500" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <Users className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Subscribers Found</h3>
                  <p className="text-gray-500 mb-4">
                    There are no active subscribers at the moment.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <BottomNavigation activeTab="admin" />
    </div>
  );
}
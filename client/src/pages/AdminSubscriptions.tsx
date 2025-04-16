import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  Pencil,
  Trash2,
  ArrowLeft,
  CreditCard,
  Search,
  Eye,
  RefreshCw,
  UserCheck,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { queryClient } from "@/lib/queryClient";
import { SubscriptionTier, UserSubscription } from "@shared/schema";
import { apiRequest } from "@/lib/apiClient";

const AdminSubscriptions = () => {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("tiers");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch subscription tiers
  const { data: tiers, isLoading: isLoadingTiers } = useQuery<SubscriptionTier[]>({
    queryKey: ["/api/admin/subscription-tiers"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch user subscriptions
  const { data: subscriptions, isLoading: isLoadingSubscriptions } = useQuery<UserSubscription[]>({
    queryKey: ["/api/admin/user-subscriptions"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const handleDeleteTier = async () => {
    if (!selectedTier) return;

    try {
      await apiRequest(`/api/admin/subscription-tiers/${selectedTier.id}`, {
        method: "DELETE",
      });

      // Invalidate cache
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-tiers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      
      setShowDeleteDialog(false);
      setSelectedTier(null);
    } catch (error) {
      console.error("Failed to delete subscription tier:", error);
    }
  };

  const filteredTiers = tiers?.filter((tier) =>
    tier.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSubscriptions = subscriptions?.filter((sub) =>
    sub.stripeCustomerId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number | string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
  };

  const formatDate = (date: string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "trialing":
        return "bg-blue-100 text-blue-800";
      case "past_due":
        return "bg-yellow-100 text-yellow-800";
      case "canceled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const isLoading = isLoadingTiers || isLoadingSubscriptions;

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-purple-700 mb-2">Loading Subscription Data</h2>
            <p className="text-gray-500">Please wait while we fetch the subscription information...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center mb-6">
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="tiers">Subscription Tiers</TabsTrigger>
          <TabsTrigger value="subscriptions">User Subscriptions</TabsTrigger>
        </TabsList>

        <TabsContent value="tiers">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Subscription Tiers</CardTitle>
              <CardDescription>
                Manage subscription tiers available to users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-6">
                <div className="relative w-72">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tiers..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button asChild>
                  <Link href="/admin/subscriptions/tiers/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add New Tier
                  </Link>
                </Button>
              </div>

              <div className="rounded-md border">
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
                    {filteredTiers && filteredTiers.length > 0 ? (
                      filteredTiers.map((tier) => (
                        <TableRow key={tier.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <div className="h-9 w-9 rounded-full bg-purple-100 p-2 mr-3 flex items-center justify-center">
                                <CreditCard className="h-4 w-4 text-purple-700" />
                              </div>
                              {tier.name}
                            </div>
                          </TableCell>
                          <TableCell>{formatCurrency(tier.price)}</TableCell>
                          <TableCell className="capitalize">{tier.billingPeriod}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                tier.active
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }
                            >
                              {tier.active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {tier.features ? (
                              <span className="text-sm text-muted-foreground">
                                {(tier.features as string[]).length} features
                              </span>
                            ) : (
                              "No features"
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                asChild
                              >
                                <Link href={`/admin/subscriptions/tiers/${tier.id}`}>
                                  <Eye className="h-4 w-4" />
                                  <span className="sr-only">View</span>
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                asChild
                              >
                                <Link href={`/admin/subscriptions/tiers/${tier.id}/edit`}>
                                  <Pencil className="h-4 w-4" />
                                  <span className="sr-only">Edit</span>
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedTier(tier);
                                  setShowDeleteDialog(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center h-24">
                          {searchTerm ? (
                            <div>No tiers matching "{searchTerm}"</div>
                          ) : (
                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                              <CreditCard className="h-10 w-10 mb-2" />
                              <p>No subscription tiers found</p>
                              <p className="text-sm">Create your first tier to get started</p>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>User Subscriptions</CardTitle>
              <CardDescription>
                View and manage user subscription status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-6">
                <div className="relative w-72">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search subscriptions..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Sync with Stripe
                  </Button>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Current Period</TableHead>
                      <TableHead>Auto Renew</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubscriptions && filteredSubscriptions.length > 0 ? (
                      filteredSubscriptions.map((subscription) => (
                        <TableRow key={subscription.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <div className="h-9 w-9 rounded-full bg-purple-100 p-2 mr-3 flex items-center justify-center">
                                <UserCheck className="h-4 w-4 text-purple-700" />
                              </div>
                              User #{subscription.userId}
                            </div>
                          </TableCell>
                          <TableCell>
                            {tiers?.find(t => t.id === subscription.tierId)?.name || `Tier #${subscription.tierId}`}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(subscription.status)}>
                              {subscription.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {subscription.currentPeriodStart && subscription.currentPeriodEnd ? (
                              <span className="text-sm">
                                {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
                              </span>
                            ) : (
                              "Not available"
                            )}
                          </TableCell>
                          <TableCell>
                            {subscription.cancelAtPeriodEnd ? (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                Cancels at period end
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Auto-renews
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                asChild
                              >
                                <Link href={`/admin/subscriptions/users/${subscription.id}`}>
                                  <Eye className="h-4 w-4" />
                                  <span className="sr-only">View</span>
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                asChild
                              >
                                <Link href={`/admin/users/${subscription.userId}`}>
                                  <UserCheck className="h-4 w-4" />
                                  <span className="sr-only">View User</span>
                                </Link>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center h-24">
                          {searchTerm ? (
                            <div>No subscriptions matching "{searchTerm}"</div>
                          ) : (
                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                              <CreditCard className="h-10 w-10 mb-2" />
                              <p>No user subscriptions found</p>
                              <p className="text-sm">Users haven't subscribed to any plans yet</p>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure you want to delete this subscription tier?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the subscription tier.
              Any users currently subscribed to this tier will not be affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTier}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSubscriptions;
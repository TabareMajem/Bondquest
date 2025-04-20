import React, { useState } from "react";
import { useLocation, useParams } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import {
  ArrowLeft,
  Gift,
  Users,
  Calendar,
  Mail,
  Truck,
  Package,
  Clock,
  ClipboardCheck,
  AlertTriangle,
  X,
  Send,
  Check,
  MapPin,
  Eye,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { useRewards } from "@/hooks/use-rewards";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import BottomNavigation from "@/components/layout/BottomNavigation";

export default function AdminCoupleRewardDetails() {
  const [, navigate] = useLocation();
  const params = useParams();
  const rewardId = params.id ? parseInt(params.id) : 0;
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("details");
  const [showNotifyDialog, setShowNotifyDialog] = useState(false);
  const [showShippingDialog, setShowShippingDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  
  // Data for shipping dialog
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shippingNotes, setShippingNotes] = useState("");
  
  // Data for cancel dialog
  const [cancelReason, setCancelReason] = useState("");
  
  // Get reward hooks
  const { 
    useCoupleRewardByIdQuery,
    useSendRewardNotificationMutation,
    useMarkRewardAsShippedMutation,
    useMarkRewardAsDeliveredMutation,
    useCancelRewardMutation
  } = useRewards();
  
  // Check if user has admin access
  const isAdmin = user?.username === "admin";
  
  // Redirect non-admin users
  React.useEffect(() => {
    if (!isAdmin) {
      navigate("/home");
    }
  }, [isAdmin, navigate]);
  
  // Fetch couple reward details
  const { 
    data: coupleReward, 
    isLoading, 
    isError, 
    refetch 
  } = useCoupleRewardByIdQuery(rewardId);
  
  // Mutations
  const notifyMutation = useSendRewardNotificationMutation();
  const shipMutation = useMarkRewardAsShippedMutation();
  const deliverMutation = useMarkRewardAsDeliveredMutation();
  const cancelMutation = useCancelRewardMutation();
  
  // Handle notification
  const handleSendNotification = () => {
    notifyMutation.mutate(rewardId, {
      onSuccess: () => {
        setShowNotifyDialog(false);
        refetch();
      }
    });
  };
  
  // Handle shipping
  const handleShip = () => {
    if (!trackingNumber) {
      toast({
        title: "Tracking Number Required",
        description: "Please enter a tracking number.",
        variant: "destructive"
      });
      return;
    }
    
    shipMutation.mutate({
      coupleRewardId: rewardId,
      trackingNumber,
      adminNotes: shippingNotes
    }, {
      onSuccess: () => {
        setShowShippingDialog(false);
        setTrackingNumber("");
        setShippingNotes("");
        refetch();
      }
    });
  };
  
  // Handle delivery
  const handleMarkDelivered = () => {
    deliverMutation.mutate(rewardId, {
      onSuccess: () => {
        refetch();
      }
    });
  };
  
  // Handle cancellation
  const handleCancel = () => {
    if (!cancelReason) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for cancellation.",
        variant: "destructive"
      });
      return;
    }
    
    cancelMutation.mutate({
      coupleRewardId: rewardId,
      reason: cancelReason
    }, {
      onSuccess: () => {
        setShowCancelDialog(false);
        setCancelReason("");
        refetch();
      }
    });
  };
  
  // Helper function to get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'awarded':
        return <Badge className="bg-blue-500">Awarded</Badge>;
      case 'notified':
        return <Badge className="bg-indigo-500">Notified</Badge>;
      case 'viewed':
        return <Badge className="bg-purple-500">Viewed</Badge>;
      case 'claimed':
        return <Badge className="bg-violet-500">Claimed</Badge>;
      case 'shipped':
        return <Badge className="bg-amber-500">Shipped</Badge>;
      case 'delivered':
        return <Badge className="bg-green-500">Delivered</Badge>;
      case 'redeemed':
        return <Badge className="bg-emerald-500">Redeemed</Badge>;
      case 'expired':
        return <Badge variant="outline" className="border-red-500 text-red-500">Expired</Badge>;
      case 'canceled':
        return <Badge variant="outline" className="border-gray-500 text-gray-500">Canceled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  // Helper function for reward type badge
  const getRewardTypeLabel = (type: string) => {
    switch (type) {
      case "physical":
        return <Badge className="bg-blue-500">Physical</Badge>;
      case "digital":
        return <Badge className="bg-green-500">Digital</Badge>;
      case "experience":
        return <Badge className="bg-purple-500">Experience</Badge>;
      default:
        return <Badge>Other</Badge>;
    }
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex justify-center items-center h-screen">
        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (isError || !coupleReward) {
    return (
      <div className="container mx-auto p-6 flex flex-col justify-center items-center h-screen">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-red-500 mb-2">Error Loading Reward</h2>
        <p className="text-gray-600 mb-4">Unable to load the reward details. Please try again.</p>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
          <Button onClick={() => navigate("/admin/rewards")}>
            Back to Rewards
          </Button>
        </div>
      </div>
    );
  }
  
  // Extract data for easier access
  const { status, reward, couple } = coupleReward;
  
  return (
    <div className="container mx-auto p-6 pb-24">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/admin/rewards")}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Rewards
        </Button>
        <h1 className="text-3xl font-bold text-purple-800">Reward Details</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main content area */}
        <div className="md:col-span-2">
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-2xl font-bold">{reward?.name}</CardTitle>
                <CardDescription>
                  Status: {getStatusBadge(status)}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {/* Action buttons based on status */}
                {status === 'awarded' && (
                  <Button 
                    variant="outline" 
                    onClick={() => setShowNotifyDialog(true)}
                    disabled={notifyMutation.isPending}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Notification
                  </Button>
                )}
                
                {status === 'claimed' && reward?.type === 'physical' && (
                  <Button 
                    variant="outline" 
                    onClick={() => setShowShippingDialog(true)}
                    disabled={shipMutation.isPending}
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    Mark as Shipped
                  </Button>
                )}
                
                {status === 'shipped' && (
                  <Button 
                    variant="outline" 
                    onClick={handleMarkDelivered}
                    disabled={deliverMutation.isPending}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Mark as Delivered
                  </Button>
                )}
                
                {['awarded', 'notified', 'viewed', 'claimed'].includes(status) && (
                  <Button 
                    variant="destructive" 
                    onClick={() => setShowCancelDialog(true)}
                    disabled={cancelMutation.isPending}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel Reward
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="details">
                    <Gift className="h-4 w-4 mr-2" />
                    Details
                  </TabsTrigger>
                  <TabsTrigger value="timeline">
                    <Clock className="h-4 w-4 mr-2" />
                    Timeline
                  </TabsTrigger>
                  <TabsTrigger value="shipping">
                    <Truck className="h-4 w-4 mr-2" />
                    Shipping & Notes
                  </TabsTrigger>
                </TabsList>
                
                {/* Details Tab */}
                <TabsContent value="details">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <Gift className="h-5 w-5 mr-2 text-purple-500" />
                        Reward Information
                      </h3>
                      <dl className="grid grid-cols-3 gap-1 text-sm">
                        <dt className="font-medium text-gray-500">Type</dt>
                        <dd className="col-span-2">{getRewardTypeLabel(reward?.type || 'unknown')}</dd>
                        
                        <dt className="font-medium text-gray-500">Description</dt>
                        <dd className="col-span-2">{reward?.description || 'No description'}</dd>
                        
                        <dt className="font-medium text-gray-500">Value</dt>
                        <dd className="col-span-2">{reward?.value || 'N/A'}</dd>
                        
                        <dt className="font-medium text-gray-500">Code</dt>
                        <dd className="col-span-2 font-mono">{reward?.code || 'N/A'}</dd>
                        
                        {reward?.locationRestricted && (
                          <>
                            <dt className="font-medium text-gray-500">Locations</dt>
                            <dd className="col-span-2">
                              {reward.eligibleLocations?.join(", ") || "Restricted Locations"}
                            </dd>
                          </>
                        )}
                      </dl>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <Users className="h-5 w-5 mr-2 text-blue-500" />
                        Couple Information
                      </h3>
                      <dl className="grid grid-cols-3 gap-1 text-sm">
                        <dt className="font-medium text-gray-500">Users</dt>
                        <dd className="col-span-2">
                          {couple ? (
                            <>
                              <div>{couple.user1?.username || 'Unknown'}</div>
                              <div>{couple.user2?.username || 'Unknown'}</div>
                            </>
                          ) : (
                            'Unknown Couple'
                          )}
                        </dd>
                        
                        <dt className="font-medium text-gray-500">Email</dt>
                        <dd className="col-span-2">
                          {couple?.user1?.email || 'No email available'}
                        </dd>
                        
                        <dt className="font-medium text-gray-500">ID</dt>
                        <dd className="col-span-2 font-mono">
                          {couple?.id || 'Unknown'}
                        </dd>
                      </dl>
                    </div>
                    
                    <div className="md:col-span-2">
                      <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <Calendar className="h-5 w-5 mr-2 text-amber-500" />
                        Reward Timeline
                      </h3>
                      <dl className="grid grid-cols-6 gap-1 text-sm">
                        <dt className="font-medium text-gray-500">Status</dt>
                        <dd className="col-span-5">{getStatusBadge(status)}</dd>
                        
                        <dt className="font-medium text-gray-500">Awarded</dt>
                        <dd className="col-span-5">
                          {coupleReward.awardedAt 
                            ? format(new Date(coupleReward.awardedAt), "MMMM d, yyyy 'at' h:mm a")
                            : 'Not recorded'}
                        </dd>
                        
                        <dt className="font-medium text-gray-500">Expires</dt>
                        <dd className="col-span-5">
                          {coupleReward.expiresAt 
                            ? format(new Date(coupleReward.expiresAt), "MMMM d, yyyy 'at' h:mm a")
                            : 'No expiration'}
                        </dd>
                        
                        {coupleReward.redemptionCode && (
                          <>
                            <dt className="font-medium text-gray-500">Code</dt>
                            <dd className="col-span-5 font-mono">
                              {coupleReward.redemptionCode}
                            </dd>
                          </>
                        )}
                        
                        {coupleReward.redemptionUrl && (
                          <>
                            <dt className="font-medium text-gray-500">URL</dt>
                            <dd className="col-span-5 break-all">
                              <a href={coupleReward.redemptionUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                {coupleReward.redemptionUrl}
                              </a>
                            </dd>
                          </>
                        )}
                      </dl>
                    </div>
                  </div>
                </TabsContent>
                
                {/* Timeline Tab */}
                <TabsContent value="timeline">
                  <div className="relative border-l-2 border-gray-200 pl-4 ml-4 space-y-6">
                    {/* Created Event */}
                    <div className="relative">
                      <div className="absolute -left-[26px] ring-4 ring-white rounded-full bg-purple-500 p-1">
                        <Gift className="h-4 w-4 text-white" />
                      </div>
                      <div className="mb-1 flex items-baseline">
                        <h4 className="font-semibold text-purple-800">Awarded</h4>
                        <time className="ml-3 text-xs text-gray-500">
                          {coupleReward.awardedAt 
                            ? format(new Date(coupleReward.awardedAt), "MMM d, yyyy 'at' h:mm a")
                            : 'Date unknown'}
                        </time>
                      </div>
                      <p className="text-sm text-gray-600">
                        Reward '{reward?.name}' was awarded to couple.
                      </p>
                    </div>
                    
                    {/* Notified Event */}
                    {coupleReward.notifiedAt && (
                      <div className="relative">
                        <div className="absolute -left-[26px] ring-4 ring-white rounded-full bg-indigo-500 p-1">
                          <Mail className="h-4 w-4 text-white" />
                        </div>
                        <div className="mb-1 flex items-baseline">
                          <h4 className="font-semibold text-indigo-800">Notification Sent</h4>
                          <time className="ml-3 text-xs text-gray-500">
                            {format(new Date(coupleReward.notifiedAt), "MMM d, yyyy 'at' h:mm a")}
                          </time>
                        </div>
                        <p className="text-sm text-gray-600">
                          Couple was notified via email.
                        </p>
                      </div>
                    )}
                    
                    {/* Viewed Event */}
                    {coupleReward.viewedAt && (
                      <div className="relative">
                        <div className="absolute -left-[26px] ring-4 ring-white rounded-full bg-purple-500 p-1">
                          <Eye className="h-4 w-4 text-white" />
                        </div>
                        <div className="mb-1 flex items-baseline">
                          <h4 className="font-semibold text-purple-800">Viewed by Recipient</h4>
                          <time className="ml-3 text-xs text-gray-500">
                            {format(new Date(coupleReward.viewedAt), "MMM d, yyyy 'at' h:mm a")}
                          </time>
                        </div>
                        <p className="text-sm text-gray-600">
                          Couple viewed the reward notification.
                        </p>
                      </div>
                    )}
                    
                    {/* Claimed Event */}
                    {coupleReward.claimedAt && (
                      <div className="relative">
                        <div className="absolute -left-[26px] ring-4 ring-white rounded-full bg-violet-500 p-1">
                          <ClipboardCheck className="h-4 w-4 text-white" />
                        </div>
                        <div className="mb-1 flex items-baseline">
                          <h4 className="font-semibold text-violet-800">Claimed</h4>
                          <time className="ml-3 text-xs text-gray-500">
                            {format(new Date(coupleReward.claimedAt), "MMM d, yyyy 'at' h:mm a")}
                          </time>
                        </div>
                        <p className="text-sm text-gray-600">
                          Couple claimed the reward.
                          {coupleReward.shippingAddress && " Shipping information provided."}
                        </p>
                      </div>
                    )}
                    
                    {/* Shipped Event */}
                    {coupleReward.shippedAt && (
                      <div className="relative">
                        <div className="absolute -left-[26px] ring-4 ring-white rounded-full bg-amber-500 p-1">
                          <Truck className="h-4 w-4 text-white" />
                        </div>
                        <div className="mb-1 flex items-baseline">
                          <h4 className="font-semibold text-amber-800">Shipped</h4>
                          <time className="ml-3 text-xs text-gray-500">
                            {format(new Date(coupleReward.shippedAt), "MMM d, yyyy 'at' h:mm a")}
                          </time>
                        </div>
                        <p className="text-sm text-gray-600">
                          Reward was shipped to the recipient.
                          {coupleReward.trackingNumber && (
                            <span className="block mt-1">
                              Tracking #: <span className="font-mono">{coupleReward.trackingNumber}</span>
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                    
                    {/* Delivered Event */}
                    {coupleReward.deliveredAt && (
                      <div className="relative">
                        <div className="absolute -left-[26px] ring-4 ring-white rounded-full bg-green-500 p-1">
                          <Package className="h-4 w-4 text-white" />
                        </div>
                        <div className="mb-1 flex items-baseline">
                          <h4 className="font-semibold text-green-800">Delivered</h4>
                          <time className="ml-3 text-xs text-gray-500">
                            {format(new Date(coupleReward.deliveredAt), "MMM d, yyyy 'at' h:mm a")}
                          </time>
                        </div>
                        <p className="text-sm text-gray-600">
                          Reward was delivered to the recipient.
                        </p>
                      </div>
                    )}
                    
                    {/* Redeemed Event */}
                    {coupleReward.redeemedAt && (
                      <div className="relative">
                        <div className="absolute -left-[26px] ring-4 ring-white rounded-full bg-emerald-500 p-1">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                        <div className="mb-1 flex items-baseline">
                          <h4 className="font-semibold text-emerald-800">Redeemed</h4>
                          <time className="ml-3 text-xs text-gray-500">
                            {format(new Date(coupleReward.redeemedAt), "MMM d, yyyy 'at' h:mm a")}
                          </time>
                        </div>
                        <p className="text-sm text-gray-600">
                          Couple redeemed the reward.
                          {coupleReward.locationRedeemed && (
                            <span className="block mt-1">
                              <MapPin className="h-3 w-3 inline-block mr-1" />
                              {coupleReward.locationRedeemed.city || coupleReward.locationRedeemed.country || "Unknown location"}
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                    
                    {/* Canceled Event */}
                    {coupleReward.canceledAt && (
                      <div className="relative">
                        <div className="absolute -left-[26px] ring-4 ring-white rounded-full bg-red-500 p-1">
                          <X className="h-4 w-4 text-white" />
                        </div>
                        <div className="mb-1 flex items-baseline">
                          <h4 className="font-semibold text-red-800">Canceled</h4>
                          <time className="ml-3 text-xs text-gray-500">
                            {format(new Date(coupleReward.canceledAt), "MMM d, yyyy 'at' h:mm a")}
                          </time>
                        </div>
                        <p className="text-sm text-gray-600">
                          Reward was canceled by an administrator.
                        </p>
                      </div>
                    )}
                    
                    {/* Expired Event */}
                    {status === 'expired' && coupleReward.expiresAt && (
                      <div className="relative">
                        <div className="absolute -left-[26px] ring-4 ring-white rounded-full bg-gray-500 p-1">
                          <Clock className="h-4 w-4 text-white" />
                        </div>
                        <div className="mb-1 flex items-baseline">
                          <h4 className="font-semibold text-gray-800">Expired</h4>
                          <time className="ml-3 text-xs text-gray-500">
                            {format(new Date(coupleReward.expiresAt), "MMM d, yyyy 'at' h:mm a")}
                          </time>
                        </div>
                        <p className="text-sm text-gray-600">
                          Reward expired because it was not claimed within the time limit.
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                {/* Shipping & Notes Tab */}
                <TabsContent value="shipping">
                  <div className="space-y-6">
                    {/* Shipping Address */}
                    {coupleReward.shippingAddress && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3 flex items-center">
                          <Truck className="h-5 w-5 mr-2 text-blue-500" />
                          Shipping Information
                        </h3>
                        <div className="bg-gray-50 p-4 rounded-md border">
                          <pre className="whitespace-pre-wrap text-sm font-normal">
                            {JSON.stringify(coupleReward.shippingAddress, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                    
                    {/* Tracking Information */}
                    {coupleReward.trackingNumber && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3 flex items-center">
                          <Package className="h-5 w-5 mr-2 text-amber-500" />
                          Tracking Information
                        </h3>
                        <div className="bg-gray-50 p-4 rounded-md border">
                          <p className="text-sm mb-2">Tracking Number:</p>
                          <p className="font-mono text-lg">{coupleReward.trackingNumber}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Admin Notes */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <ClipboardCheck className="h-5 w-5 mr-2 text-purple-500" />
                        Admin Notes
                      </h3>
                      <div className="bg-gray-50 p-4 rounded-md border">
                        {coupleReward.adminNotes ? (
                          <div className="whitespace-pre-wrap text-sm">
                            {coupleReward.adminNotes}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">No admin notes for this reward.</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Recipient Notes */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <Users className="h-5 w-5 mr-2 text-green-500" />
                        Recipient Notes
                      </h3>
                      <div className="bg-gray-50 p-4 rounded-md border">
                        {coupleReward.winnerNotes ? (
                          <div className="whitespace-pre-wrap text-sm">
                            {coupleReward.winnerNotes}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">No notes from the recipient.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        {/* Sidebar */}
        <div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Reward Status</CardTitle>
              <CardDescription>
                Current state and actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Current Status:</span>
                  {getStatusBadge(status)}
                </div>
                
                <div className="pt-2 border-t">
                  <h4 className="font-medium mb-2">Available Actions</h4>
                  <div className="space-y-2">
                    {status === 'awarded' && (
                      <Button 
                        className="w-full"
                        onClick={() => setShowNotifyDialog(true)}
                        disabled={notifyMutation.isPending}
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Send Notification
                      </Button>
                    )}
                    
                    {status === 'claimed' && reward?.type === 'physical' && (
                      <Button 
                        className="w-full"
                        onClick={() => setShowShippingDialog(true)}
                        disabled={shipMutation.isPending}
                      >
                        <Truck className="h-4 w-4 mr-2" />
                        Mark as Shipped
                      </Button>
                    )}
                    
                    {status === 'shipped' && (
                      <Button 
                        className="w-full"
                        onClick={handleMarkDelivered}
                        disabled={deliverMutation.isPending}
                      >
                        <Package className="h-4 w-4 mr-2" />
                        Mark as Delivered
                      </Button>
                    )}
                    
                    {['awarded', 'notified', 'viewed', 'claimed'].includes(status) && (
                      <Button 
                        variant="destructive" 
                        className="w-full"
                        onClick={() => setShowCancelDialog(true)}
                        disabled={cancelMutation.isPending}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel Reward
                      </Button>
                    )}
                    
                    {(status === 'expired' || status === 'canceled' || status === 'redeemed' || status === 'delivered') && (
                      <p className="text-gray-500 text-sm text-center">
                        No actions available for this status
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Couple Information</CardTitle>
            </CardHeader>
            <CardContent>
              {couple ? (
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 mr-2 text-blue-500" />
                    <h3 className="font-medium">
                      {couple.user1?.username || 'User 1'} &amp; {couple.user2?.username || 'User 2'}
                    </h3>
                  </div>
                  
                  {couple.user1?.email && (
                    <div className="text-sm">
                      <div className="text-gray-500 mb-1">Primary Email:</div>
                      <div className="font-medium">{couple.user1.email}</div>
                    </div>
                  )}
                  
                  {couple.user2?.email && (
                    <div className="text-sm">
                      <div className="text-gray-500 mb-1">Secondary Email:</div>
                      <div className="font-medium">{couple.user2.email}</div>
                    </div>
                  )}
                  
                  <div className="pt-2 border-t">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => navigate(`/admin/couples/${couple.id}`)}
                    >
                      View Couple Profile
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">
                  Couple information not available
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Send Notification Dialog */}
      <Dialog open={showNotifyDialog} onOpenChange={setShowNotifyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Notification</DialogTitle>
            <DialogDescription>
              This will send an email notification to the couple about their reward.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <Mail className="h-5 w-5 text-amber-500" />
              <p className="text-sm">
                Recipient: {couple?.user1?.email || 'Unknown email'}
              </p>
            </div>
            <div className="border rounded-md p-3 bg-gray-50">
              <p className="text-sm font-medium">Email Preview:</p>
              <p className="text-sm mt-2">
                Subject: You've Been Awarded a Reward: {reward?.name}
              </p>
              <div className="text-sm mt-2 text-gray-600">
                <p>Congratulations! You've been awarded the "{reward?.name}" reward.</p>
                <p className="mt-1">Click the link in the email to view and claim your reward.</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNotifyDialog(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleSendNotification}
              disabled={notifyMutation.isPending}
            >
              {notifyMutation.isPending ? "Sending..." : "Send Notification"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Shipping Dialog */}
      <Dialog open={showShippingDialog} onOpenChange={setShowShippingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Shipped</DialogTitle>
            <DialogDescription>
              Enter shipping information for this reward.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="trackingNumber">Tracking Number</Label>
              <Input
                id="trackingNumber"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Enter tracking number"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="shippingNotes">Admin Notes (Optional)</Label>
              <Textarea
                id="shippingNotes"
                value={shippingNotes}
                onChange={(e) => setShippingNotes(e.target.value)}
                placeholder="Add any notes about this shipment"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowShippingDialog(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleShip}
              disabled={shipMutation.isPending || !trackingNumber}
            >
              {shipMutation.isPending ? "Processing..." : "Mark as Shipped"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Reward</DialogTitle>
            <DialogDescription>
              This will cancel the reward and make it available again in the inventory.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="cancelReason">Reason for Cancellation</Label>
              <Textarea
                id="cancelReason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Enter reason for cancellation"
                className="mt-1"
              />
            </div>
            <div className="bg-amber-50 p-3 rounded border border-amber-200 text-amber-800 text-sm">
              <AlertTriangle className="h-4 w-4 inline-block mr-1" />
              This action cannot be undone. The reward will be returned to inventory.
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
            >
              Go Back
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelMutation.isPending || !cancelReason}
            >
              {cancelMutation.isPending ? "Canceling..." : "Cancel Reward"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <BottomNavigation activeTab="admin" />
    </div>
  );
}
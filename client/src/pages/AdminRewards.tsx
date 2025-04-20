import React, { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  CardFooter,
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash, 
  Gift, 
  RefreshCw, 
  User, 
  Package, 
  Check, 
  X,
  Send,
  Truck,
  Clock,
  MapPin,
  ShieldAlert
} from "lucide-react";
import { format } from "date-fns";
import { Reward } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";
import BottomNavigation from "@/components/layout/BottomNavigation";
import { useRewards } from "@/hooks/use-rewards";

export default function AdminRewards() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("rewards");
  const [statusFilter, setStatusFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  
  // Check if user has admin access - in a real app, you would check user.role or similar
  const isAdmin = user?.username === "admin";
  
  // Redirect non-admin users
  React.useEffect(() => {
    if (!isAdmin) {
      navigate("/home");
    }
  }, [isAdmin, navigate]);

  // Get hooks from useRewards
  const {
    useRewardsQuery,
    useCoupleRewardsQuery,
    useRunRewardMaintenanceMutation
  } = useRewards();

  // Use our custom hooks with proper typing
  const { 
    data: rewards = [], 
    isLoading: isRewardsLoading, 
    isError: isRewardsError 
  } = useRewardsQuery();

  // Use the custom hook with filters and proper typing
  const { 
    data: coupleRewards = [], 
    isLoading: isCoupleRewardsLoading, 
    isError: isCoupleRewardsError 
  } = useCoupleRewardsQuery(
    statusFilter || locationFilter 
      ? { 
          status: statusFilter || undefined, 
          location: locationFilter || undefined 
        } 
      : undefined
  );

  // Use the maintenance mutation hook
  const maintenanceMutation = useRunRewardMaintenanceMutation();
  
  const handleRunMaintenance = () => {
    if (window.confirm("Are you sure you want to run reward maintenance tasks? This will process expired rewards and send reminders.")) {
      maintenanceMutation.mutate();
    }
  };
  
  // Handle reward deletion
  const handleDeleteReward = (id: number) => {
    if (window.confirm("Are you sure you want to delete this reward? This action cannot be undone.")) {
      toast({
        title: "Not implemented",
        description: "Delete functionality is not yet implemented.",
        variant: "destructive"
      });
      // In a real implementation, you would call a delete mutation here
    }
  };

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
          <h1 className="text-3xl font-bold text-purple-800">Rewards Management</h1>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRunMaintenance}
            disabled={maintenanceMutation.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${maintenanceMutation.isPending ? 'animate-spin' : ''}`} />
            Run Maintenance
          </Button>
          <Button onClick={() => navigate("/admin/rewards/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Reward
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="rewards">
            <Gift className="h-4 w-4 mr-2" />
            Reward Templates
          </TabsTrigger>
          <TabsTrigger value="couple-rewards">
            <User className="h-4 w-4 mr-2" />
            Awarded Rewards
          </TabsTrigger>
        </TabsList>
        
        {/* Reward Templates Tab */}
        <TabsContent value="rewards">
          <Card>
            <CardHeader>
              <CardTitle>All Reward Templates</CardTitle>
              <CardDescription>
                Create and manage reward templates that can be awarded to couples
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isRewardsLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : isRewardsError ? (
                <div className="flex justify-center items-center h-64">
                  <p className="text-red-500">Error loading rewards. Please try again.</p>
                </div>
              ) : rewards && rewards.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rewards.map((reward: {
                      id: number;
                      name: string;
                      type: string;
                      quantity: number;
                      active: boolean | null;
                      locationRestricted: boolean | null;
                      eligibleLocations?: string[];
                    }) => (
                      <TableRow key={reward.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <Gift className="h-4 w-4 mr-2 text-purple-500" />
                            {reward.name}
                          </div>
                        </TableCell>
                        <TableCell>{getRewardTypeLabel(reward.type)}</TableCell>
                        <TableCell>{reward.quantity}</TableCell>
                        <TableCell>
                          {reward.active ? (
                            <Badge className="bg-green-500">Active</Badge>
                          ) : (
                            <Badge variant="outline">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {/* Temporarily show Worldwide for all rewards until location columns are available */}
                          <span className="text-gray-500">Worldwide</span>
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
                                onClick={() => navigate(`/admin/rewards/${reward.id}/edit`)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => navigate(`/admin/rewards/award?rewardId=${reward.id}`)}
                              >
                                <Gift className="h-4 w-4 mr-2" />
                                Award to Couple
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteReward(reward.id)}
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
                  <Gift className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Rewards Found</h3>
                  <p className="text-gray-500 mb-4">
                    You haven't created any rewards yet. Get started by adding your first reward.
                  </p>
                  <Button onClick={() => navigate("/admin/rewards/new")}>
                    Add Your First Reward
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Couple Rewards Tab */}
        <TabsContent value="couple-rewards">
          <Card>
            <CardHeader>
              <CardTitle>Awarded Rewards</CardTitle>
              <CardDescription>
                Track and manage rewards that have been awarded to couples
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <div className="w-1/3">
                  <label className="text-sm text-gray-500 mb-1 block">Status Filter</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Statuses</SelectItem>
                      <SelectItem value="awarded">Awarded</SelectItem>
                      <SelectItem value="notified">Notified</SelectItem>
                      <SelectItem value="viewed">Viewed</SelectItem>
                      <SelectItem value="claimed">Claimed</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="redeemed">Redeemed</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="canceled">Canceled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-1/3">
                  <label className="text-sm text-gray-500 mb-1 block">Location Filter</label>
                  <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Locations</SelectItem>
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="CA">Canada</SelectItem>
                      <SelectItem value="UK">United Kingdom</SelectItem>
                      <SelectItem value="AU">Australia</SelectItem>
                      <SelectItem value="IN">India</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-1/3 flex items-end">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      setStatusFilter("");
                      setLocationFilter("");
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
              
              {isCoupleRewardsLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : isCoupleRewardsError ? (
                <div className="flex justify-center items-center h-64">
                  <p className="text-red-500">Error loading awarded rewards. Please try again.</p>
                </div>
              ) : coupleRewards && coupleRewards.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reward</TableHead>
                      <TableHead>Couple</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Award Date</TableHead>
                      <TableHead>Expiration</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coupleRewards.map((cr: {
                      id: number;
                      status: string;
                      awardedAt?: string;
                      expiresAt?: string;
                      reward?: {
                        id: number;
                        name: string;
                        type: string;
                      };
                      couple?: {
                        id: number;
                        userId1: number;
                        userId2: number;
                        user1?: {
                          id: number;
                          username: string;
                          email?: string;
                          displayName?: string;
                        };
                        user2?: {
                          id: number;
                          username: string;
                          email?: string;
                          displayName?: string;
                        };
                      };
                    }) => (
                      <TableRow key={cr.id}>
                        <TableCell className="font-medium">
                          {cr.reward ? (
                            <div>
                              <div className="flex items-center">
                                <Gift className="h-4 w-4 mr-2 text-purple-500" />
                                {cr.reward.name}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {getRewardTypeLabel(cr.reward.type)}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-500">Unknown Reward</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {cr.couple ? (
                            <div>
                              <div className="flex items-center">
                                <User className="h-4 w-4 mr-2 text-blue-500" />
                                <span>{cr.couple.user1?.username} & {cr.couple.user2?.username}</span>
                              </div>
                              {cr.couple.user1?.email && (
                                <div className="text-xs text-gray-500 mt-1 truncate max-w-[150px]">
                                  {cr.couple.user1.email}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-500">Unknown Couple</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(cr.status)}</TableCell>
                        <TableCell>
                          {cr.awardedAt ? format(new Date(cr.awardedAt), "MMM d, yyyy") : "-"}
                        </TableCell>
                        <TableCell>
                          {cr.expiresAt ? (
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1 text-amber-500" />
                              {format(new Date(cr.expiresAt), "MMM d, yyyy")}
                            </div>
                          ) : (
                            <span className="text-gray-500">No expiration</span>
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
                                onClick={() => navigate(`/admin/rewards/couple/${cr.id}`)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              
                              {cr.status === 'awarded' && (
                                <DropdownMenuItem
                                  onClick={() => navigate(`/admin/rewards/couple/${cr.id}/notify`)}
                                >
                                  <Send className="h-4 w-4 mr-2" />
                                  Send Notification
                                </DropdownMenuItem>
                              )}
                              
                              {(cr.status === 'claimed' && cr.reward?.type === 'physical') && (
                                <DropdownMenuItem
                                  onClick={() => navigate(`/admin/rewards/couple/${cr.id}/ship`)}
                                >
                                  <Truck className="h-4 w-4 mr-2" />
                                  Mark as Shipped
                                </DropdownMenuItem>
                              )}
                              
                              {cr.status === 'shipped' && (
                                <DropdownMenuItem
                                  onClick={() => navigate(`/admin/rewards/couple/${cr.id}/deliver`)}
                                >
                                  <Package className="h-4 w-4 mr-2" />
                                  Mark as Delivered
                                </DropdownMenuItem>
                              )}
                              
                              {['awarded', 'notified', 'viewed', 'claimed'].includes(cr.status) && (
                                <DropdownMenuItem
                                  onClick={() => navigate(`/admin/rewards/couple/${cr.id}/cancel`)}
                                  className="text-red-600"
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Cancel Reward
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <Package className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Awarded Rewards Found</h3>
                  <p className="text-gray-500 mb-4">
                    {statusFilter || locationFilter ? 
                      "No rewards match your current filters. Try changing or clearing them." :
                      "You haven't awarded any rewards to couples yet."}
                  </p>
                  <Button 
                    onClick={() => navigate("/admin/rewards/award")}
                    variant={statusFilter || locationFilter ? "outline" : "default"}
                  >
                    {statusFilter || locationFilter ? 
                      "Clear Filters" : 
                      "Award a Reward"}
                  </Button>
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
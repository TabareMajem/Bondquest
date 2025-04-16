import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PlusCircle, Award, Trophy, Users, Gift, CreditCard } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/apiClient";

interface DashboardStats {
  usersCount: number;
  couplesCount: number;
  subscribersCount: number;
  activeCompetitionsCount: number;
  recentRewards: any[];
  claimedRewardsCount: number;
}

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");

  const { data: dashboardStats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/dashboard"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-purple-700 mb-2">Loading Admin Dashboard</h2>
            <p className="text-gray-500">Please wait while we fetch the latest data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-purple-800">Admin Dashboard</h1>
        <div className="space-x-2">
          <Button asChild variant="outline">
            <Link href="/admin/rewards/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Reward
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/competitions/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Competition
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="competitions">Competitions</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardStats?.usersCount || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Total registered users on the platform
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Couples</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardStats?.couplesCount || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Paired couples on the platform
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardStats?.subscribersCount || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Active paid subscribers
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Competitions</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardStats?.activeCompetitionsCount || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Currently running competitions
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Recent Rewards Claimed</CardTitle>
                <CardDescription>
                  The most recently claimed rewards by couples
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dashboardStats?.recentRewards && dashboardStats.recentRewards.length > 0 ? (
                  <div className="space-y-4">
                    {dashboardStats.recentRewards.map((reward) => (
                      <div key={reward.id} className="flex items-center">
                        <div className="mr-2 h-9 w-9 rounded-full bg-purple-100 p-2 flex items-center justify-center">
                          <Gift className="h-4 w-4 text-purple-700" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{reward.name}</p>
                          <p className="text-xs text-muted-foreground">Couple ID: {reward.coupleId}</p>
                        </div>
                        <div className="ml-auto text-xs text-muted-foreground">
                          Status: {reward.status}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No recent rewards claimed.</p>
                )}
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/admin/rewards">
                    View All Rewards
                  </Link>
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Reward Stats</CardTitle>
                <CardDescription>
                  Overview of the reward system performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Total Rewards Claimed</p>
                    <p className="text-sm font-bold">{dashboardStats?.claimedRewardsCount || 0}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <p className="text-muted-foreground">Claimed</p>
                      <p>63%</p>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-100">
                      <div className="h-full rounded-full bg-purple-500" style={{ width: "63%" }}></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <p className="text-muted-foreground">Shipped</p>
                      <p>42%</p>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-100">
                      <div className="h-full rounded-full bg-purple-500" style={{ width: "42%" }}></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <p className="text-muted-foreground">Delivered</p>
                      <p>25%</p>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-100">
                      <div className="h-full rounded-full bg-purple-500" style={{ width: "25%" }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/admin/analytics">
                    View Detailed Analytics
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="rewards" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rewards Management</CardTitle>
              <CardDescription>
                Manage all rewards in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center py-20">
                Rewards management content will be shown here. 
                This will include a list of all rewards, their status, and actions to edit or delete them.
              </p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button asChild variant="outline">
                <Link href="/admin/rewards">
                  View All Rewards
                </Link>
              </Button>
              <Button asChild>
                <Link href="/admin/rewards/new">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add New Reward
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="competitions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Competitions Management</CardTitle>
              <CardDescription>
                Manage all competitions in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center py-20">
                Competitions management content will be shown here.
                This will include a list of all competitions, their status, and actions to edit or delete them.
              </p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button asChild variant="outline">
                <Link href="/admin/competitions">
                  View All Competitions
                </Link>
              </Button>
              <Button asChild>
                <Link href="/admin/competitions/new">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create New Competition
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="subscriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Tiers Management</CardTitle>
              <CardDescription>
                Manage subscription tiers and user subscriptions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center py-20">
                Subscription tiers management content will be shown here.
                This will include a list of all subscription tiers, their features, and actions to edit or delete them.
              </p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button asChild variant="outline">
                <Link href="/admin/subscriptions">
                  View All Subscriptions
                </Link>
              </Button>
              <Button asChild>
                <Link href="/admin/subscriptions/new">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create New Tier
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
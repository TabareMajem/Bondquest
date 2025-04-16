import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { BarChart3, Award, Trophy, Users, CreditCard, Gift, Calendar, ArrowRight, Sparkles } from "lucide-react";
import BottomNavigation from "@/components/layout/BottomNavigation";

const AdminDashboard = () => {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  
  // Check if user has admin access - in a real app, you would check user.role or similar
  const isAdmin = user?.email === "admin@bondquest.com";
  
  // Redirect non-admin users
  React.useEffect(() => {
    if (!isAdmin) {
      navigate("/home");
    }
  }, [isAdmin, navigate]);

  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/admin/dashboard"],
    enabled: isAdmin,
  });

  // Mock data for initial UI
  const stats = dashboardData || {
    activeUsers: 126,
    activeCouples: 63,
    activeCompetitions: 2,
    activeRewards: 8,
    totalSubscriptions: 42,
    revenue: 1260,
    topPerformingCouples: [],
    recentActivity: []
  };

  if (!isAdmin) {
    return null; // Not rendering if not admin
  }

  return (
    <div className="container mx-auto p-6 pb-24">
      <h1 className="text-3xl font-bold mb-6 text-purple-800">Admin Dashboard</h1>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {/* Quick stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Users className="w-5 h-5 text-purple-600 mr-2" />
                  <div className="text-2xl font-bold">{stats.activeUsers}</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Couples</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Trophy className="w-5 h-5 text-purple-600 mr-2" />
                  <div className="text-2xl font-bold">{stats.activeCouples}</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Active Competitions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Award className="w-5 h-5 text-purple-600 mr-2" />
                  <div className="text-2xl font-bold">{stats.activeCompetitions}</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Active Rewards</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Gift className="w-5 h-5 text-purple-600 mr-2" />
                  <div className="text-2xl font-bold">{stats.activeRewards}</div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Action cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Manage Rewards</CardTitle>
                <CardDescription>
                  Create and update rewards that couples can earn through competitions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full" 
                  onClick={() => navigate("/admin/rewards")}
                >
                  Go to Rewards
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Manage Competitions</CardTitle>
                <CardDescription>
                  Create and organize competitions for couples to participate in
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full" 
                  onClick={() => navigate("/admin/competitions")}
                >
                  Go to Competitions
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Manage Subscriptions</CardTitle>
                <CardDescription>
                  Set up and manage subscription tiers and pricing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full" 
                  onClick={() => navigate("/admin/subscriptions")}
                >
                  Go to Subscriptions
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow bg-gradient-to-br from-purple-50 to-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  AI Content Wizard
                </CardTitle>
                <CardDescription>
                  Generate quizzes and competitions using AI
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700" 
                  onClick={() => navigate("/admin/ai-wizard")}
                >
                  Launch AI Wizard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Statistics</CardTitle>
              <CardDescription>
                Overview of user registration and activity trends
              </CardDescription>
            </CardHeader>
            <CardContent className="h-96 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 text-purple-300" />
                <p>User statistics charts will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
              <CardDescription>
                Revenue from subscriptions and premium features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Total Subscriptions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <CreditCard className="w-5 h-5 text-purple-600 mr-2" />
                      <div className="text-2xl font-bold">{stats.totalSubscriptions}</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Monthly Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 text-purple-600 mr-2" />
                      <div className="text-2xl font-bold">${stats.revenue}</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2 text-purple-300" />
                  <p>Revenue trends chart will be displayed here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <BottomNavigation activeTab="admin" />
    </div>
  );
};

export default AdminDashboard;
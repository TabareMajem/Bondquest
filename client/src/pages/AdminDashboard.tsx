import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { 
  BarChart3, 
  Award, 
  Trophy, 
  Users, 
  CreditCard, 
  Gift, 
  Calendar, 
  ArrowRight, 
  Sparkles, 
  Gamepad2,
  User,
  Heart,
  Bell,
  Settings
} from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";

const AdminDashboard = () => {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  
  // Use the isAdmin state from AuthContext instead of checking email
  const { isAdmin } = useAuth();
  
  // Redirect non-admin users
  React.useEffect(() => {
    if (!isAdmin) {
      console.log("Non-admin user detected, redirecting from admin dashboard");
      navigate("/home");
    } else {
      console.log("Admin user verified, displaying admin dashboard");
    }
  }, [isAdmin, navigate]);

  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/admin/dashboard"],
    enabled: isAdmin,
  });

  // Dashboard data
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
    <PageLayout activeTab="admin" pageTitle="Admin Dashboard" maxWidth="full" className="px-0 md:px-0 lg:px-0">
      <div className="w-full p-4 md:p-6 lg:p-8 max-w-full">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Admin Dashboard</h1>
          <div className="flex flex-wrap gap-3 ml-auto">
            <Button 
              size="sm" 
              variant="outline" 
              className="border-white/20 text-white hover:bg-white/10"
              onClick={() => navigate('/admin/users')}
            >
              <Users className="h-4 w-4 mr-2" /> Users
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="border-white/20 text-white hover:bg-white/10"
              onClick={() => navigate('/admin/quizzes')}
            >
              <Gamepad2 className="h-4 w-4 mr-2" /> Quizzes
            </Button>
            <Button 
              size="sm" 
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0"
              onClick={() => navigate('/admin/subscriptions')}
            >
              <CreditCard className="h-4 w-4 mr-2" /> Manage Subscriptions
            </Button>
          </div>
        </div>
      
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full md:w-auto md:inline-flex grid-cols-3 mb-8 bg-white/10 p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white/20 text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-white/20 text-white">
              Users
            </TabsTrigger>
            <TabsTrigger value="revenue" className="data-[state=active]:bg-white/20 text-white">
              Revenue
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            {/* Quick stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Users className="w-5 h-5 text-purple-600 mr-2" />
                    <div className="text-2xl font-bold">{stats.activeUsers}</div>
                  </div>
                  <div className="mt-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-purple-600 p-0 h-auto text-xs hover:text-purple-700 hover:bg-transparent"
                      onClick={() => navigate("/admin/users")}
                    >
                      View details
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Couples</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Trophy className="w-5 h-5 text-purple-600 mr-2" />
                    <div className="text-2xl font-bold">{stats.activeCouples}</div>
                  </div>
                  <div className="mt-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-purple-600 p-0 h-auto text-xs hover:text-purple-700 hover:bg-transparent"
                      onClick={() => navigate("/admin/couples")}
                    >
                      View details
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Active Competitions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Award className="w-5 h-5 text-purple-600 mr-2" />
                    <div className="text-2xl font-bold">{stats.activeCompetitions}</div>
                  </div>
                  <div className="mt-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-purple-600 p-0 h-auto text-xs hover:text-purple-700 hover:bg-transparent"
                      onClick={() => navigate("/admin/competitions")}
                    >
                      View details
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Active Rewards</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Gift className="w-5 h-5 text-purple-600 mr-2" />
                    <div className="text-2xl font-bold">{stats.activeRewards}</div>
                  </div>
                  <div className="mt-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-purple-600 p-0 h-auto text-xs hover:text-purple-700 hover:bg-transparent"
                      onClick={() => navigate("/admin/rewards")}
                    >
                      View details
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Management Cards - Primary Features */}
            <h2 className="text-xl font-bold text-white mb-4">Primary Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-purple-500" />
                    User Management
                  </CardTitle>
                  <CardDescription>
                    Manage users, accounts, and profiles
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-500">
                    View all users, edit profiles, manage permissions, and handle account status.
                  </p>
                  <Button 
                    className="w-full" 
                    onClick={() => navigate("/admin/users")}
                  >
                    Manage Users
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gamepad2 className="h-5 w-5 text-purple-500" />
                    Quiz Management
                  </CardTitle>
                  <CardDescription>
                    Create and organize quizzes and questions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-500">
                    Design quizzes, create question banks, manage categories, and track engagement.
                  </p>
                  <Button 
                    className="w-full" 
                    onClick={() => navigate("/admin/quizzes")}
                  >
                    Manage Quizzes
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-purple-500" />
                    Competition Management
                  </CardTitle>
                  <CardDescription>
                    Create and organize competitions for couples
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-500">
                    Set up competitions, manage entries, award prizes, and track leaderboards.
                  </p>
                  <Button 
                    className="w-full" 
                    onClick={() => navigate("/admin/competitions")}
                  >
                    Manage Competitions
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>
            
            {/* Management Cards - Secondary Features */}
            <h2 className="text-xl font-bold text-white mb-4 mt-8">Additional Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>Manage Rewards</CardTitle>
                  <CardDescription>
                    Create and update rewards for achievements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full" 
                    onClick={() => navigate("/admin/rewards")}
                  >
                    Rewards
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>Subscriptions</CardTitle>
                  <CardDescription>
                    Manage subscription tiers and pricing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full" 
                    onClick={() => navigate("/admin/subscriptions")}
                  >
                    Subscriptions
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>Bond Dimensions</CardTitle>
                  <CardDescription>
                    Manage relationship assessment criteria
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full" 
                    onClick={() => navigate("/admin/bond-dimensions")}
                  >
                    Bond Dimensions
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
                    Generate content using AI
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
            
            {/* Settings & System Management */}
            <h2 className="text-xl font-bold text-white mb-4 mt-8">System Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-gray-500" />
                    System Settings
                  </CardTitle>
                  <CardDescription>
                    Configure global application settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => navigate("/admin/settings")}
                  >
                    System Settings
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-gray-500" />
                    Notifications
                  </CardTitle>
                  <CardDescription>
                    Manage system notifications and alerts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => navigate("/admin/notifications")}
                  >
                    Notification Settings
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-gray-500" />
                    Relationship Analytics
                  </CardTitle>
                  <CardDescription>
                    Review relationship insights and data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => navigate("/admin/analytics")}
                  >
                    View Analytics
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>User Statistics</CardTitle>
                  <CardDescription>
                    Overview of user registration and activity trends
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => navigate("/admin/users")}
                  variant="outline"
                >
                  View All Users
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
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
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Revenue Overview</CardTitle>
                  <CardDescription>
                    Revenue from subscriptions and premium features
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => navigate("/admin/subscriptions")}
                  variant="outline"
                >
                  Manage Subscriptions
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
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
      </div>
    </PageLayout>
  );
};

export default AdminDashboard;
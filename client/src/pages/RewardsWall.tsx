import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import PageLayout from "@/components/layout/PageLayout";
import { format } from "date-fns";
import { Trophy, Gift, Calendar, Info, Clock, Users, ArrowRight } from "lucide-react";
import { Reward, Competition } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";

export default function RewardsWall() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("rewards");

  // Fetch active rewards
  const { 
    data: rewards, 
    isLoading: isLoadingRewards 
  } = useQuery<Reward[]>({
    queryKey: ["/api/rewards"],
  });

  // Fetch active and upcoming competitions
  const { 
    data: competitions, 
    isLoading: isLoadingCompetitions 
  } = useQuery<Competition[]>({
    queryKey: ["/api/competitions"],
  });

  const formatDate = (dateStr: string | Date) => {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    return format(date, "MMM d, yyyy");
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "upcoming":
        return <Badge className="bg-blue-500">Upcoming</Badge>;
      case "active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "completed":
        return <Badge variant="outline" className="border-purple-500 text-purple-500">Completed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const renderRewardCard = (reward: Reward) => (
    <Card key={reward.id} className="overflow-hidden transition-all hover:shadow-lg">
      <div className="h-36 bg-gradient-to-r from-purple-600 to-violet-500 flex items-center justify-center relative">
        {reward.imageUrl ? (
          <img 
            src={reward.imageUrl} 
            alt={reward.name} 
            className="object-cover h-full w-full" 
          />
        ) : (
          <Gift className="w-16 h-16 text-white/80" />
        )}
        <div className="absolute top-3 right-3">
          {getRewardTypeLabel(reward.type)}
        </div>
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold">{reward.name}</CardTitle>
        <CardDescription className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>Available until {formatDate(reward.availableTo)}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-sm text-gray-600 line-clamp-2">{reward.description}</p>
        <div className="flex items-center mt-3 gap-2">
          <Trophy className="h-4 w-4 text-yellow-500" />
          <span className="text-sm font-medium text-gray-800">{reward.value} points required</span>
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Button variant="outline" className="w-full" onClick={() => navigate(`/competitions`)}>
          Win This Reward
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );

  const renderCompetitionCard = (competition: Competition) => (
    <Card key={competition.id} className="overflow-hidden transition-all hover:shadow-lg">
      <div className="h-36 bg-gradient-to-r from-indigo-600 to-blue-500 flex items-center justify-center relative">
        {competition.imageUrl ? (
          <img 
            src={competition.imageUrl} 
            alt={competition.title} 
            className="object-cover h-full w-full" 
          />
        ) : (
          <Trophy className="w-16 h-16 text-white/80" />
        )}
        <div className="absolute top-3 right-3">
          {getStatusBadge(competition.status)}
        </div>
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold">{competition.title}</CardTitle>
        <CardDescription className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>{formatDate(competition.startDate)} - {formatDate(competition.endDate)}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-sm text-gray-600 line-clamp-2">{competition.description}</p>
        <div className="flex flex-wrap gap-4 mt-3">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 text-gray-500" />
            <span className="text-xs">{competition.participantCount || 0} couples</span>
          </div>
          <div className="flex items-center gap-1">
            <Info className="h-4 w-4 text-gray-500" />
            <span className="text-xs">{competition.entryFee} points entry</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Button variant="default" className="w-full" onClick={() => navigate(`/competitions/${competition.id}`)}>
          {competition.status === "active" ? "Join Now" : competition.status === "upcoming" ? "Get Reminded" : "View Results"}
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <PageLayout
      activeTab="rewards"
      pageTitle="Rewards Wall"
    >
      <div className="container mx-auto p-4">
        <p className="text-center text-white/80 max-w-2xl mx-auto mb-6">
          Discover exciting rewards and competitions you can participate in with your partner.
          Win prizes, experiences, and create lasting memories together!
        </p>

        <Tabs
        defaultValue="rewards"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="rewards" className="flex items-center gap-2">
            <Gift className="h-4 w-4" />
            <span>Available Rewards</span>
          </TabsTrigger>
          <TabsTrigger value="competitions" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            <span>Current Competitions</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rewards" className="mt-0">
          {isLoadingRewards ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading rewards...</p>
              </div>
            </div>
          ) : !rewards || rewards.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <Gift className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">No Active Rewards</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                There are currently no active rewards. Check back soon as new rewards are added regularly!
              </p>
              <Button variant="outline" onClick={() => setActiveTab("competitions")}>
                View Competitions
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rewards.map(renderRewardCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="competitions" className="mt-0">
          {isLoadingCompetitions ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading competitions...</p>
              </div>
            </div>
          ) : !competitions || competitions.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">No Active Competitions</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                There are currently no active or upcoming competitions. Check back soon for new opportunities!
              </p>
              <Button variant="outline" onClick={() => setActiveTab("rewards")}>
                View Rewards
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {competitions.map(renderCompetitionCard)}
            </div>
          )}
        </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}
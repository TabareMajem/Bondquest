import React, { useState } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import BottomNavigation from "../components/layout/BottomNavigation";
import { Settings, User, Heart, Trophy, Award, CalendarDays, Bell, Shield, MessageSquare, CreditCard, HelpCircle, LogOut, UserPlus, Copy, Users, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import LanguageSelector from "@/components/ui/LanguageSelector";

export default function Profile() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"profile" | "achievements" | "settings">("profile");
  const [partnerLinkModalOpen, setPartnerLinkModalOpen] = useState(false);
  const [partnerEmail, setPartnerEmail] = useState("");
  const [partnerCode, setPartnerCode] = useState("");
  
  const { toast } = useToast();
  const { user, couple, updateCouple } = useAuth();
  const { t } = useTranslation();

  const handleLogout = () => {
    navigate("/");
  };
  
  // Partner linking mutation
  const linkPartnerMutation = useMutation({
    mutationFn: async (code: string) => {
      if (!user) {
        throw new Error("User not logged in");
      }
      const response = await apiRequest("POST", "/api/partner/link", {
        userId: user.id,
        partnerCode: code,
      });
      return response.json();
    },
    onSuccess: (data) => {
      updateCouple(data);
      setPartnerLinkModalOpen(false);
      toast({
        title: "Partner linked successfully!",
        description: "You are now connected with your partner. Your relationship journey begins!",
      });
    },
    onError: (error) => {
      toast({
        title: "Linking failed",
        description: error.message || "Could not link with your partner. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const handleSendInvite = () => {
    // In a real app, this would send an email to the partner
    toast({
      title: "Invitation sent!",
      description: `An invitation email has been sent to ${partnerEmail}`,
    });
  };
  
  const handleLinkPartner = () => {
    if (!partnerCode) {
      toast({
        title: "Missing code",
        description: "Please enter your partner's invitation code.",
        variant: "destructive",
      });
      return;
    }
    
    linkPartnerMutation.mutate(partnerCode);
  };
  
  const copyPartnerCode = () => {
    if (user?.partnerCode) {
      navigator.clipboard.writeText(user.partnerCode);
      toast({
        title: "Code copied!",
        description: "Your partner code has been copied to clipboard.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-fuchsia-900 pb-20">
      {/* Profile Header */}
      <div className="pt-8 px-6 text-white">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{t('common.profile')}</h1>
          {activeTab === "profile" && (
            <button 
              onClick={() => setActiveTab("settings")}
              className="flex items-center gap-1 text-white rounded-full bg-purple-700/40 backdrop-blur-sm px-3 py-1.5 shadow-lg border border-purple-500/20"
            >
              <Settings className="w-4 h-4" />
              <span className="text-sm">{t('profile.accountSettings')}</span>
            </button>
          )}
        </div>

        {/* Profile Tabs */}
        <div className="flex border-b border-purple-700/50 mb-6">
          <button 
            className={`pb-2 px-4 text-sm font-medium ${activeTab === "profile" ? "text-white border-b-2 border-white" : "text-purple-300"}`}
            onClick={() => setActiveTab("profile")}
          >
            {t('common.profile')}
          </button>
          <button 
            className={`pb-2 px-4 text-sm font-medium ${activeTab === "achievements" ? "text-white border-b-2 border-white" : "text-purple-300"}`}
            onClick={() => setActiveTab("achievements")}
          >
            {t('home.recentAchievements')}
          </button>
          <button 
            className={`pb-2 px-4 text-sm font-medium ${activeTab === "settings" ? "text-white border-b-2 border-white" : "text-purple-300"}`}
            onClick={() => setActiveTab("settings")}
          >
            {t('profile.accountSettings')}
          </button>
        </div>
      </div>

      {/* Profile Content */}
      {activeTab === "profile" && (
        <div className="px-6">
          {/* User Profile Card */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 mb-6 shadow-xl border border-pink-500/20">
            <div className="flex items-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white mr-4 shadow-lg border-2 border-white/20">
                <User className="w-10 h-10" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white mb-1">BondQuest User</h2>
                <p className="text-pink-200 text-sm">user@example.com</p>
                
                <div className="flex items-center mt-2 text-pink-300">
                  <Heart className="w-4 h-4 text-pink-400 mr-1" />
                  <span className="text-sm">
                    {couple ? "In a relationship" : "Single, ready to connect"}
                  </span>
                </div>
                
                <div className="flex gap-2 mt-3">
                  <button className="flex items-center gap-1 bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-1.5 rounded-full text-sm text-white shadow-md">
                    <span>Edit Profile</span>
                  </button>
                  
                  {!couple && (
                    <button 
                      onClick={() => setPartnerLinkModalOpen(true)}
                      className="flex items-center gap-1 bg-gradient-to-r from-purple-500 to-pink-600 px-4 py-1.5 rounded-full text-sm text-white shadow-md"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Link Partner</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Relationship Stats */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 mb-6 shadow-xl border border-purple-500/20">
            <h3 className="text-white font-medium mb-4">Bond Statistics</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-purple-900/80 to-purple-700/80 p-4 rounded-xl shadow-lg border border-purple-500/30">
                <div className="flex items-center mb-2">
                  <Heart className="w-5 h-5 text-pink-400 mr-2" />
                  <span className="text-white text-sm font-medium">Bond Strength</span>
                </div>
                <p className="text-2xl font-bold text-white">0%</p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-900/80 to-purple-700/80 p-4 rounded-xl shadow-lg border border-purple-500/30">
                <div className="flex items-center mb-2">
                  <Trophy className="w-5 h-5 text-yellow-400 mr-2" />
                  <span className="text-white text-sm font-medium">XP Points</span>
                </div>
                <p className="text-2xl font-bold text-white">0</p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-900/80 to-purple-700/80 p-4 rounded-xl shadow-lg border border-purple-500/30">
                <div className="flex items-center mb-2">
                  <Award className="w-5 h-5 text-yellow-400 mr-2" />
                  <span className="text-white text-sm font-medium">Level</span>
                </div>
                <p className="text-2xl font-bold text-white">0</p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-900/80 to-purple-700/80 p-4 rounded-xl shadow-lg border border-purple-500/30">
                <div className="flex items-center mb-2">
                  <CalendarDays className="w-5 h-5 text-blue-400 mr-2" />
                  <span className="text-white text-sm font-medium">Days Active</span>
                </div>
                <p className="text-2xl font-bold text-white">0</p>
              </div>
            </div>
          </div>
          
          {/* Preferences */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 mb-6 shadow-xl border border-pink-500/20">
            <h3 className="text-white font-medium mb-3">Love Language</h3>
            <p className="text-pink-200 mb-1">Not set yet</p>
            <button className="text-sm text-pink-400 flex items-center">
              <span>Set your love language</span>
            </button>
          </div>
        </div>
      )}

      {/* Achievements Tab */}
      {activeTab === "achievements" && (
        <div className="px-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 mb-6 shadow-xl border border-purple-500/20">
            <h3 className="text-white font-medium mb-4">Your Achievements</h3>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Locked Achievement */}
              <div className="bg-gradient-to-br from-purple-900/80 to-purple-700/80 p-4 rounded-xl text-center shadow-md border border-purple-500/30">
                <div className="w-14 h-14 mx-auto bg-gradient-to-br from-purple-700 to-purple-500 rounded-full flex items-center justify-center mb-2 opacity-50 shadow-lg">
                  <Trophy className="w-7 h-7 text-purple-200" />
                </div>
                <h4 className="text-white font-medium text-sm">First Quiz</h4>
                <p className="text-purple-300 text-xs mt-1">Complete your first quiz</p>
              </div>
              
              {/* Locked Achievement */}
              <div className="bg-gradient-to-br from-purple-900/80 to-purple-700/80 p-4 rounded-xl text-center shadow-md border border-purple-500/30">
                <div className="w-14 h-14 mx-auto bg-gradient-to-br from-purple-700 to-purple-500 rounded-full flex items-center justify-center mb-2 opacity-50 shadow-lg">
                  <Heart className="w-7 h-7 text-purple-200" />
                </div>
                <h4 className="text-white font-medium text-sm">Perfect Match</h4>
                <p className="text-purple-300 text-xs mt-1">Score 100% on a couple quiz</p>
              </div>
              
              {/* More locked achievements */}
              <div className="bg-gradient-to-br from-purple-900/80 to-purple-700/80 p-4 rounded-xl text-center shadow-md border border-purple-500/30">
                <div className="w-14 h-14 mx-auto bg-gradient-to-br from-purple-700 to-purple-500 rounded-full flex items-center justify-center mb-2 opacity-50 shadow-lg">
                  <CalendarDays className="w-7 h-7 text-purple-200" />
                </div>
                <h4 className="text-white font-medium text-sm">Week Streak</h4>
                <p className="text-purple-300 text-xs mt-1">Log in 7 days in a row</p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-900/80 to-purple-700/80 p-4 rounded-xl text-center shadow-md border border-purple-500/30">
                <div className="w-14 h-14 mx-auto bg-gradient-to-br from-purple-700 to-purple-500 rounded-full flex items-center justify-center mb-2 opacity-50 shadow-lg">
                  <Award className="w-7 h-7 text-purple-200" />
                </div>
                <h4 className="text-white font-medium text-sm">Bond Builder</h4>
                <p className="text-purple-300 text-xs mt-1">Reach 50% bond strength</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <div className="px-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden mb-6 shadow-xl border border-purple-500/20">
            <ul className="divide-y divide-purple-700/30">
              <li>
                <button className="flex items-center justify-between w-full text-left p-4 hover:bg-purple-700/20">
                  <div className="flex items-center">
                    <Bell className="w-5 h-5 text-pink-400 mr-3" />
                    <span className="text-white">{t('profile.notifications')}</span>
                  </div>
                  <span className="text-purple-300">→</span>
                </button>
              </li>
              <li>
                <button className="flex items-center justify-between w-full text-left p-4 hover:bg-purple-700/20">
                  <div className="flex items-center">
                    <Shield className="w-5 h-5 text-pink-400 mr-3" />
                    <span className="text-white">{t('profile.privacy')}</span>
                  </div>
                  <span className="text-purple-300">→</span>
                </button>
              </li>
              <li>
                <button className="flex items-center justify-between w-full text-left p-4 hover:bg-purple-700/20">
                  <div className="flex items-center">
                    <MessageSquare className="w-5 h-5 text-pink-400 mr-3" />
                    <span className="text-white">AI {t('common.ai')} {t('profile.preferences')}</span>
                  </div>
                  <span className="text-purple-300">→</span>
                </button>
              </li>
              <li>
                <button className="flex items-center justify-between w-full text-left p-4 hover:bg-purple-700/20">
                  <div className="flex items-center">
                    <CreditCard className="w-5 h-5 text-pink-400 mr-3" />
                    <span className="text-white">{t('profile.subscriptions')}</span>
                  </div>
                  <span className="text-purple-300">→</span>
                </button>
              </li>
              <li className="p-4 hover:bg-purple-700/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Globe className="w-5 h-5 text-pink-400 mr-3" />
                    <span className="text-white">{t('profile.language')}</span>
                  </div>
                  <LanguageSelector />
                </div>
              </li>
              <li>
                <button className="flex items-center justify-between w-full text-left p-4 hover:bg-purple-700/20">
                  <div className="flex items-center">
                    <HelpCircle className="w-5 h-5 text-pink-400 mr-3" />
                    <span className="text-white">Help & Support</span>
                  </div>
                  <span className="text-purple-300">→</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={handleLogout}
                  className="flex items-center w-full text-left p-4 hover:bg-red-700/20 text-red-400"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  <span>Logout</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      )}

      <BottomNavigation activeTab="profile" />
      
      {/* Partner Linking Modal */}
      <Dialog open={partnerLinkModalOpen} onOpenChange={setPartnerLinkModalOpen}>
        <DialogContent className="max-w-md bg-gradient-to-br from-purple-900 to-purple-800 text-white border-purple-500/30">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white text-center">Link with Partner</DialogTitle>
            <DialogDescription className="text-purple-200 text-center">
              Connect with your partner to start your journey together
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="share-code" className="mt-4">
            <TabsList className="grid grid-cols-2 mb-4 bg-purple-800/50">
              <TabsTrigger value="share-code" className="data-[state=active]:bg-purple-700 text-white">
                Share Your Code
              </TabsTrigger>
              <TabsTrigger value="enter-code" className="data-[state=active]:bg-purple-700 text-white">
                Enter Partner Code
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="share-code" className="space-y-5">
              <div className="text-center">
                <p className="text-purple-200 mb-3">Share your invitation code with your partner:</p>
                <div className="bg-purple-800/70 p-4 rounded-lg flex items-center justify-between border border-purple-500/30">
                  <span className="text-xl font-mono text-white tracking-wider">
                    {user?.partnerCode || "BOND-12345"}
                  </span>
                  <button 
                    className="text-white opacity-80 hover:opacity-100 p-2"
                    onClick={copyPartnerCode}
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-3">
                <p className="text-purple-200">Or send an email invitation:</p>
                <div className="flex">
                  <Input
                    type="email"
                    placeholder="partner@example.com"
                    value={partnerEmail}
                    onChange={(e) => setPartnerEmail(e.target.value)}
                    className="flex-grow px-4 py-3 rounded-l-lg bg-purple-800/50 border border-purple-500/30 text-white placeholder:text-purple-300"
                  />
                  <Button
                    onClick={handleSendInvite}
                    className="px-4 py-3 rounded-r-lg bg-pink-500 text-white font-medium"
                  >
                    Send
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="enter-code" className="space-y-5">
              <div className="text-center">
                <p className="text-purple-200 mb-3">Enter your partner's invitation code:</p>
                <div className="space-y-3">
                  <Input
                    type="text"
                    placeholder="e.g. BOND-12345"
                    value={partnerCode}
                    onChange={(e) => setPartnerCode(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-purple-800/50 border border-purple-500/30 text-white placeholder:text-purple-300"
                  />
                  <Button
                    onClick={handleLinkPartner}
                    disabled={linkPartnerMutation.isPending}
                    className="w-full py-3 rounded-lg bg-pink-500 text-white font-medium hover:bg-pink-600"
                  >
                    {linkPartnerMutation.isPending ? "Linking..." : "Link with Partner"}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="mt-4 flex justify-center">
            <Button 
              variant="outline" 
              onClick={() => setPartnerLinkModalOpen(false)}
              className="text-purple-200 border-purple-500/30 hover:bg-purple-700/50"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
    </div>
  );
}
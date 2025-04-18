import React, { useState } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Settings, User, Heart, Trophy, Award, CalendarDays, Bell, Shield, MessageSquare, CreditCard, HelpCircle, LogOut, UserPlus, Copy, Users, Globe, Edit, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import LanguageSelector from "@/components/ui/LanguageSelector";
import { usePartnerLink } from "@/hooks/usePartnerLink";
import PageLayout from "../components/layout/PageLayout";

export default function Profile() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"profile" | "achievements" | "settings">("profile");
  const [partnerLinkModalOpen, setPartnerLinkModalOpen] = useState(false);
  const [partnerEmail, setPartnerEmail] = useState("");
  const [partnerCode, setPartnerCode] = useState("");
  
  // Modal states for different settings sections
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [aiPreferencesModalOpen, setAiPreferencesModalOpen] = useState(false);
  const [subscriptionsModalOpen, setSubscriptionsModalOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  
  const { toast } = useToast();
  const { user, couple, updateCouple, createMockCouple } = useAuth();
  const { t } = useTranslation();
  const { sendInvitation, isLoading: isInviteLoading } = usePartnerLink();

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
  
  const handleSendInvite = async () => {
    if (!partnerEmail || !partnerEmail.includes('@')) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const success = await sendInvitation(partnerEmail);
      
      if (success) {
        toast({
          title: "Invitation sent!",
          description: `An invitation email has been sent to ${partnerEmail}`
        });
        setPartnerEmail(''); // Clear the input after successful submission
      } else {
        toast({
          title: "Failed to send invitation",
          description: "Please try again later",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    }
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
    <PageLayout
      activeTab="profile"
      pageTitle={t('common.profile')}
    >
      {/* Profile Header - Desktop shows additional options */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6">
        <div className="hidden lg:block text-white">
          <p className="text-purple-200">
            Manage your account settings, view achievements, and connect with your partner.
          </p>
        </div>
        
        {activeTab === "profile" && (
          <button 
            onClick={() => setActiveTab("settings")}
            className="flex items-center gap-1 text-white rounded-full bg-purple-700/40 backdrop-blur-sm px-3 py-1.5 shadow-lg border border-purple-500/20 mt-2 lg:mt-0"
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm">{t('profile.accountSettings')}</span>
          </button>
        )}
      </div>

      {/* Profile Tabs */}
      <div className="flex border-b border-purple-700/30 mb-6 overflow-x-auto lg:w-1/2">
        <button 
          className={`pb-2 px-4 text-sm font-medium whitespace-nowrap ${activeTab === "profile" ? "text-white border-b-2 border-white" : "text-purple-300"}`}
          onClick={() => setActiveTab("profile")}
        >
          <span className="flex items-center">
            <User className="w-4 h-4 mr-2 lg:inline hidden" />
            {t('common.profile')}
          </span>
        </button>
        <button 
          className={`pb-2 px-4 text-sm font-medium whitespace-nowrap ${activeTab === "achievements" ? "text-white border-b-2 border-white" : "text-purple-300"}`}
          onClick={() => setActiveTab("achievements")}
        >
          <span className="flex items-center">
            <Trophy className="w-4 h-4 mr-2 lg:inline hidden" />
            {t('home.recentAchievements')}
          </span>
        </button>
        <button 
          className={`pb-2 px-4 text-sm font-medium whitespace-nowrap ${activeTab === "settings" ? "text-white border-b-2 border-white" : "text-purple-300"}`}
          onClick={() => setActiveTab("settings")}
        >
          <span className="flex items-center">
            <Settings className="w-4 h-4 mr-2 lg:inline hidden" />
            {t('profile.accountSettings')}
          </span>
        </button>
      </div>

      {/* Profile Content */}
      {activeTab === "profile" && (
        <div className="px-6 lg:grid lg:grid-cols-2 lg:gap-6">
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
                  <button 
                    onClick={() => setEditProfileModalOpen(true)}
                    className="flex items-center gap-1 bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-1.5 rounded-full text-sm text-white shadow-md"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    <span>{t('profile.editProfile')}</span>
                  </button>
                  
                  {!couple && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setPartnerLinkModalOpen(true)}
                        className="flex items-center gap-1 bg-gradient-to-r from-purple-500 to-pink-600 px-4 py-1.5 rounded-full text-sm text-white shadow-md"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Link Partner</span>
                      </button>
                      
                      <button 
                        onClick={() => {
                          createMockCouple();
                          toast({
                            title: "Test Mode Activated",
                            description: "A mock couple has been created for testing the app's features.",
                          });
                        }}
                        className="flex items-center gap-1 bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-1.5 rounded-full text-sm text-white shadow-md"
                      >
                        <Users className="w-4 h-4" />
                        <span>Test Mode</span>
                      </button>
                    </div>
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
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 mb-6 shadow-xl border border-pink-500/20 lg:col-span-2">
            <h3 className="text-white font-medium mb-3">Love Language</h3>
            <p className="text-pink-200 mb-1">Not set yet</p>
            <button className="text-sm text-pink-400 flex items-center">
              <span>Set your love language</span>
            </button>
          </div>
          
          {/* Desktop Only - Additional Card */}
          <div className="hidden lg:block lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 mb-6 shadow-xl border border-pink-500/20">
              <h3 className="text-white font-medium mb-3">Relationship Timeline</h3>
              <div className="relative pt-3">
                <div className="absolute top-0 left-4 h-full w-0.5 bg-purple-600/30"></div>
                <div className="relative pl-8 pb-5">
                  <div className="absolute top-0 left-2 w-4 h-4 rounded-full bg-purple-600 border-2 border-purple-300"></div>
                  <h4 className="text-white text-sm font-medium">Account Created</h4>
                  <p className="text-purple-300 text-xs mt-1">Today</p>
                </div>
                <div className="relative pl-8 pb-5">
                  <div className="absolute top-0 left-2 w-4 h-4 rounded-full bg-purple-900/50 border-2 border-purple-700/50"></div>
                  <h4 className="text-white/50 text-sm font-medium">Partner Connected</h4>
                  <p className="text-purple-300/50 text-xs mt-1">Coming soon</p>
                </div>
                <div className="relative pl-8 pb-5">
                  <div className="absolute top-0 left-2 w-4 h-4 rounded-full bg-purple-900/50 border-2 border-purple-700/50"></div>
                  <h4 className="text-white/50 text-sm font-medium">First Assessment Completed</h4>
                  <p className="text-purple-300/50 text-xs mt-1">Coming soon</p>
                </div>
                <div className="relative pl-8">
                  <div className="absolute top-0 left-2 w-4 h-4 rounded-full bg-purple-900/50 border-2 border-purple-700/50"></div>
                  <h4 className="text-white/50 text-sm font-medium">First Milestone Achieved</h4>
                  <p className="text-purple-300/50 text-xs mt-1">Coming soon</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Achievements Tab */}
      {activeTab === "achievements" && (
        <div className="px-6 lg:grid lg:grid-cols-3 lg:gap-6">
          <div className="col-span-3 mb-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 mb-6 shadow-xl border border-purple-500/20">
              <h3 className="text-white font-medium mb-4">Your Achievements</h3>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
          
          {/* Desktop Only - Additional Achievements Content */}
          <div className="hidden lg:block lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 mb-6 shadow-xl border border-purple-500/20">
              <h3 className="text-white font-medium mb-4">Achievement Progress</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-white text-sm">Relationship Builder</span>
                    <span className="text-purple-300 text-sm">15%</span>
                  </div>
                  <div className="w-full h-2 bg-purple-900/50 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-600 to-pink-500 h-full rounded-full" style={{width: '15%'}}></div>
                  </div>
                  <p className="text-purple-300 text-xs mt-1">Complete 10 quizzes together</p>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-white text-sm">Communication Expert</span>
                    <span className="text-purple-300 text-sm">0%</span>
                  </div>
                  <div className="w-full h-2 bg-purple-900/50 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-600 to-pink-500 h-full rounded-full" style={{width: '0%'}}></div>
                  </div>
                  <p className="text-purple-300 text-xs mt-1">Achieve 90% in Communication dimension</p>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-white text-sm">Quality Time Champion</span>
                    <span className="text-purple-300 text-sm">0%</span>
                  </div>
                  <div className="w-full h-2 bg-purple-900/50 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-600 to-pink-500 h-full rounded-full" style={{width: '0%'}}></div>
                  </div>
                  <p className="text-purple-300 text-xs mt-1">Complete 30 daily check-ins</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 mb-6 shadow-xl border border-purple-500/20">
              <h3 className="text-white font-medium mb-4">Achievement Levels</h3>
              <div className="space-y-3">
                <div className="flex items-center p-2 rounded-lg bg-purple-800/30">
                  <div className="w-10 h-10 rounded-full bg-purple-900/80 flex items-center justify-center mr-3">
                    <span className="text-purple-300 font-bold">1</span>
                  </div>
                  <div>
                    <h4 className="text-white text-sm font-medium">Beginner</h4>
                    <p className="text-purple-300 text-xs">0-5 achievements</p>
                  </div>
                </div>
                
                <div className="flex items-center p-2 rounded-lg bg-purple-800/30">
                  <div className="w-10 h-10 rounded-full bg-purple-900/80 flex items-center justify-center mr-3">
                    <span className="text-purple-300 font-bold">2</span>
                  </div>
                  <div>
                    <h4 className="text-white text-sm font-medium">Explorer</h4>
                    <p className="text-purple-300 text-xs">6-15 achievements</p>
                  </div>
                </div>
                
                <div className="flex items-center p-2 rounded-lg bg-purple-800/30">
                  <div className="w-10 h-10 rounded-full bg-purple-900/80 flex items-center justify-center mr-3">
                    <span className="text-purple-300 font-bold">3</span>
                  </div>
                  <div>
                    <h4 className="text-white text-sm font-medium">Expert</h4>
                    <p className="text-purple-300 text-xs">16-30 achievements</p>
                  </div>
                </div>
                
                <div className="flex items-center p-2 rounded-lg bg-purple-800/30">
                  <div className="w-10 h-10 rounded-full bg-purple-900/80 flex items-center justify-center mr-3">
                    <span className="text-purple-300 font-bold">4</span>
                  </div>
                  <div>
                    <h4 className="text-white text-sm font-medium">Master</h4>
                    <p className="text-purple-300 text-xs">31+ achievements</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <div className="px-6 lg:grid lg:grid-cols-2 lg:gap-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden mb-6 shadow-xl border border-purple-500/20">
            <ul className="divide-y divide-purple-700/30">
              <li>
                <button 
                  onClick={() => setNotificationsModalOpen(true)}
                  className="flex items-center justify-between w-full text-left p-4 hover:bg-purple-700/20"
                >
                  <div className="flex items-center">
                    <Bell className="w-5 h-5 text-pink-400 mr-3" />
                    <span className="text-white">{t('profile.notifications')}</span>
                  </div>
                  <span className="text-purple-300">→</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setPrivacyModalOpen(true)}
                  className="flex items-center justify-between w-full text-left p-4 hover:bg-purple-700/20"
                >
                  <div className="flex items-center">
                    <Shield className="w-5 h-5 text-pink-400 mr-3" />
                    <span className="text-white">{t('profile.privacy')}</span>
                  </div>
                  <span className="text-purple-300">→</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setAiPreferencesModalOpen(true)}
                  className="flex items-center justify-between w-full text-left p-4 hover:bg-purple-700/20"
                >
                  <div className="flex items-center">
                    <MessageSquare className="w-5 h-5 text-pink-400 mr-3" />
                    <span className="text-white">AI {t('common.ai')} {t('profile.preferences')}</span>
                  </div>
                  <span className="text-purple-300">→</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setSubscriptionsModalOpen(true)}
                  className="flex items-center justify-between w-full text-left p-4 hover:bg-purple-700/20"
                >
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
                <button 
                  onClick={() => setHelpModalOpen(true)}
                  className="flex items-center justify-between w-full text-left p-4 hover:bg-purple-700/20"
                >
                  <div className="flex items-center">
                    <HelpCircle className="w-5 h-5 text-pink-400 mr-3" />
                    <span className="text-white">{t('profile.help')}</span>
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
                  <span>{t('common.logout')}</span>
                </button>
              </li>
            </ul>
          </div>
          
          {/* Desktop Only - Account Information Card */}
          <div className="hidden lg:block">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 mb-6 shadow-xl border border-pink-500/20">
              <h3 className="text-white font-medium mb-4">Account Information</h3>
              
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-purple-900/80 to-purple-700/80 p-4 rounded-xl shadow-lg border border-purple-500/30">
                  <div className="flex items-center mb-2">
                    <BookOpen className="w-5 h-5 text-purple-300 mr-2" />
                    <span className="text-white text-sm font-medium">Account ID</span>
                  </div>
                  <p className="text-lg text-purple-200">{user?.id || 'N/A'}</p>
                </div>
                
                <div className="bg-gradient-to-br from-purple-900/80 to-purple-700/80 p-4 rounded-xl shadow-lg border border-purple-500/30">
                  <div className="flex items-center mb-2">
                    <User className="w-5 h-5 text-purple-300 mr-2" />
                    <span className="text-white text-sm font-medium">Username</span>
                  </div>
                  <p className="text-lg text-purple-200">{user?.username || 'N/A'}</p>
                </div>
                
                <div className="bg-gradient-to-br from-purple-900/80 to-purple-700/80 p-4 rounded-xl shadow-lg border border-purple-500/30">
                  <div className="flex items-center mb-2">
                    <Heart className="w-5 h-5 text-purple-300 mr-2" />
                    <span className="text-white text-sm font-medium">Partner Status</span>
                  </div>
                  <p className="text-lg text-purple-200">{couple ? 'Linked' : 'Unlinked'}</p>
                </div>
                
                <div className="bg-gradient-to-br from-purple-900/80 to-purple-700/80 p-4 rounded-xl shadow-lg border border-purple-500/30">
                  <div className="flex items-center mb-2">
                    <UserPlus className="w-5 h-5 text-purple-300 mr-2" />
                    <span className="text-white text-sm font-medium">Partner Code</span>
                  </div>
                  <div className="flex items-center">
                    <p className="text-lg text-purple-200 mr-2">{user?.partnerCode || 'N/A'}</p>
                    {user?.partnerCode && (
                      <button
                        onClick={copyPartnerCode}
                        className="text-purple-300 hover:text-white transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Profile Modal */}
      <Dialog open={editProfileModalOpen} onOpenChange={setEditProfileModalOpen}>
        <DialogContent className="max-w-md bg-gradient-to-br from-purple-900 to-purple-800 text-white border-purple-500/30">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white text-center">{t('profile.editProfile')}</DialogTitle>
            <DialogDescription className="text-purple-200 text-center">
              Update your profile information
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="flex flex-col space-y-2">
              <label className="text-sm text-purple-200">{t('common.username')}</label>
              <Input 
                className="bg-purple-800/50 border-purple-500/30 text-white" 
                placeholder="Your username"
                defaultValue="BondQuest User"
              />
            </div>
            
            <div className="flex flex-col space-y-2">
              <label className="text-sm text-purple-200">Email</label>
              <Input 
                type="email"
                className="bg-purple-800/50 border-purple-500/30 text-white" 
                placeholder="Your email"
                defaultValue="user@example.com"
              />
            </div>
            
            <div className="flex flex-col space-y-2">
              <label className="text-sm text-purple-200">Avatar</label>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white mr-4 shadow-lg border-2 border-white/20">
                  <User className="w-8 h-8" />
                </div>
                <Button variant="outline" className="border-purple-500/30 text-white hover:bg-purple-700/50">
                  {t('profile.changePhoto')}
                </Button>
              </div>
            </div>
            
            <div className="flex flex-col space-y-2">
              <label className="text-sm text-purple-200">Love Language</label>
              <Input 
                className="bg-purple-800/50 border-purple-500/30 text-white" 
                placeholder="Your love language"
              />
            </div>
          </div>
          
          <DialogFooter className="mt-6 flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1 border-purple-500/30 text-white hover:bg-purple-700/50"
              onClick={() => setEditProfileModalOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button 
              className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white"
              onClick={() => {
                toast({
                  title: "Profile updated",
                  description: "Your profile has been updated successfully",
                });
                setEditProfileModalOpen(false);
              }}
            >
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Notifications Modal */}
      <Dialog open={notificationsModalOpen} onOpenChange={setNotificationsModalOpen}>
        <DialogContent className="max-w-md bg-gradient-to-br from-purple-900 to-purple-800 text-white border-purple-500/30">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white text-center">{t('profile.notifications')}</DialogTitle>
            <DialogDescription className="text-purple-200 text-center">
              Manage your notification preferences
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="flex items-center justify-between p-3 bg-purple-800/40 rounded-lg border border-purple-500/30">
              <div className="flex items-center">
                <Bell className="w-5 h-5 text-pink-400 mr-3" />
                <div>
                  <h4 className="text-white text-sm font-medium">Daily Reminders</h4>
                  <p className="text-purple-200 text-xs">Receive daily check-in reminders</p>
                </div>
              </div>
              <div className="flex items-center justify-end">
                <input 
                  type="checkbox" 
                  defaultChecked={true}
                  className="w-4 h-4 accent-pink-500"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-purple-800/40 rounded-lg border border-purple-500/30">
              <div className="flex items-center">
                <Bell className="w-5 h-5 text-pink-400 mr-3" />
                <div>
                  <h4 className="text-white text-sm font-medium">Partner Activity</h4>
                  <p className="text-purple-200 text-xs">Get notified of your partner's activities</p>
                </div>
              </div>
              <div className="flex items-center justify-end">
                <input 
                  type="checkbox" 
                  defaultChecked={true}
                  className="w-4 h-4 accent-pink-500"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-purple-800/40 rounded-lg border border-purple-500/30">
              <div className="flex items-center">
                <Bell className="w-5 h-5 text-pink-400 mr-3" />
                <div>
                  <h4 className="text-white text-sm font-medium">Competition Updates</h4>
                  <p className="text-purple-200 text-xs">Receive updates about ongoing competitions</p>
                </div>
              </div>
              <div className="flex items-center justify-end">
                <input 
                  type="checkbox" 
                  defaultChecked={true}
                  className="w-4 h-4 accent-pink-500"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-purple-800/40 rounded-lg border border-purple-500/30">
              <div className="flex items-center">
                <Bell className="w-5 h-5 text-pink-400 mr-3" />
                <div>
                  <h4 className="text-white text-sm font-medium">App Updates</h4>
                  <p className="text-purple-200 text-xs">Get notified about new features and updates</p>
                </div>
              </div>
              <div className="flex items-center justify-end">
                <input 
                  type="checkbox" 
                  defaultChecked={true}
                  className="w-4 h-4 accent-pink-500"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter className="mt-6 flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1 border-purple-500/30 text-white hover:bg-purple-700/50"
              onClick={() => setNotificationsModalOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button 
              className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white"
              onClick={() => {
                toast({
                  title: "Notifications updated",
                  description: "Your notification preferences have been saved",
                });
                setNotificationsModalOpen(false);
              }}
            >
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Partner Link Modal */}
      <Dialog open={partnerLinkModalOpen} onOpenChange={setPartnerLinkModalOpen}>
        <DialogContent className="max-w-md bg-gradient-to-br from-purple-900 to-purple-800 text-white border-purple-500/30">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white text-center">Connect with Partner</DialogTitle>
            <DialogDescription className="text-purple-200 text-center">
              Link with your partner to start your relationship journey
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="invite" className="mt-4">
            <TabsList className="w-full grid grid-cols-2 bg-purple-800/50 border border-purple-500/30">
              <TabsTrigger value="invite" className="text-sm data-[state=active]:bg-purple-700">Send Invitation</TabsTrigger>
              <TabsTrigger value="enter-code" className="text-sm data-[state=active]:bg-purple-700">Enter Code</TabsTrigger>
            </TabsList>
            
            <TabsContent value="invite" className="space-y-5 mt-5">
              <div className="text-center">
                <p className="text-purple-200 mb-3">Invite your partner via email:</p>
                <div className="space-y-3">
                  <Input
                    type="email"
                    placeholder="partner@example.com"
                    value={partnerEmail}
                    onChange={(e) => setPartnerEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-purple-800/50 border border-purple-500/30 text-white placeholder:text-purple-300"
                    disabled={isInviteLoading}
                  />
                  <Button
                    onClick={handleSendInvite}
                    disabled={isInviteLoading}
                    className="w-full py-3 rounded-lg bg-pink-500 text-white font-medium hover:bg-pink-600"
                  >
                    {isInviteLoading ? (
                      <>
                        <span className="animate-pulse">Sending...</span>
                      </>
                    ) : (
                      "Send"
                    )}
                  </Button>
                </div>
                
                <div className="flex items-center justify-center mt-5 space-x-2">
                  <div className="h-px flex-grow bg-purple-700/50"></div>
                  <span className="text-purple-300 text-sm px-2">or share your code</span>
                  <div className="h-px flex-grow bg-purple-700/50"></div>
                </div>
                
                <div className="mt-5">
                  <p className="text-purple-200 mb-3">Your partner code:</p>
                  <div className="flex items-center justify-center mb-3">
                    <div className="bg-purple-800/50 border border-purple-500/30 rounded-lg px-4 py-2 text-center">
                      <p className="text-white text-xl font-mono">{user?.partnerCode || 'XXXX-XXXX'}</p>
                    </div>
                    <button
                      onClick={copyPartnerCode}
                      className="ml-2 p-2 rounded-lg bg-purple-700/30 hover:bg-purple-700/60 transition-colors"
                    >
                      <Copy className="w-5 h-5 text-purple-300" />
                    </button>
                  </div>
                  <p className="text-purple-200 text-xs">Share this code with your partner so they can link with you</p>
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
                    disabled={linkPartnerMutation.isPending}
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
    </PageLayout>
  );
}
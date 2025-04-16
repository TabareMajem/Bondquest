import React, { useState } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import BottomNavigation from "../components/layout/BottomNavigation";
import { Settings, User, Heart, Trophy, Award, CalendarDays, Bell, Shield, MessageSquare, CreditCard, HelpCircle, LogOut, UserPlus, Copy, Users, Globe, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
        </div>
      )}

      <BottomNavigation activeTab="profile" />
      
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
      
      {/* Privacy Settings Modal */}
      <Dialog open={privacyModalOpen} onOpenChange={setPrivacyModalOpen}>
        <DialogContent className="max-w-md bg-gradient-to-br from-purple-900 to-purple-800 text-white border-purple-500/30">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white text-center">{t('profile.privacy')}</DialogTitle>
            <DialogDescription className="text-purple-200 text-center">
              Manage your privacy settings
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="flex items-center justify-between p-3 bg-purple-800/40 rounded-lg border border-purple-500/30">
              <div className="flex items-center">
                <Shield className="w-5 h-5 text-pink-400 mr-3" />
                <div>
                  <h4 className="text-white text-sm font-medium">Public Profile</h4>
                  <p className="text-purple-200 text-xs">Allow others to find you by email</p>
                </div>
              </div>
              <div className="flex items-center justify-end">
                <input 
                  type="checkbox" 
                  defaultChecked={false}
                  className="w-4 h-4 accent-pink-500"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-purple-800/40 rounded-lg border border-purple-500/30">
              <div className="flex items-center">
                <Shield className="w-5 h-5 text-pink-400 mr-3" />
                <div>
                  <h4 className="text-white text-sm font-medium">Activity Visibility</h4>
                  <p className="text-purple-200 text-xs">Show your activities in leaderboards</p>
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
                <Shield className="w-5 h-5 text-pink-400 mr-3" />
                <div>
                  <h4 className="text-white text-sm font-medium">Data Collection</h4>
                  <p className="text-purple-200 text-xs">Allow anonymous data collection to improve the app</p>
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
                <Shield className="w-5 h-5 text-pink-400 mr-3" />
                <div>
                  <h4 className="text-white text-sm font-medium">Marketing Emails</h4>
                  <p className="text-purple-200 text-xs">Receive promotional emails and updates</p>
                </div>
              </div>
              <div className="flex items-center justify-end">
                <input 
                  type="checkbox" 
                  defaultChecked={false}
                  className="w-4 h-4 accent-pink-500"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter className="mt-6 flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1 border-purple-500/30 text-white hover:bg-purple-700/50"
              onClick={() => setPrivacyModalOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button 
              className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white"
              onClick={() => {
                toast({
                  title: "Privacy settings updated",
                  description: "Your privacy preferences have been saved",
                });
                setPrivacyModalOpen(false);
              }}
            >
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* AI Preferences Modal */}
      <Dialog open={aiPreferencesModalOpen} onOpenChange={setAiPreferencesModalOpen}>
        <DialogContent className="max-w-md bg-gradient-to-br from-purple-900 to-purple-800 text-white border-purple-500/30">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white text-center">AI {t('common.ai')} {t('profile.preferences')}</DialogTitle>
            <DialogDescription className="text-purple-200 text-center">
              Customize your AI assistant preferences
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="flex flex-col space-y-2">
              <label className="text-sm text-purple-200">Preferred AI Assistant</label>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-purple-800/50 p-3 rounded-lg border border-pink-500/50 flex flex-col items-center cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-lg font-bold text-white mb-2">
                    👨‍🎤
                  </div>
                  <span className="text-white text-xs font-medium">Casanova</span>
                  <span className="text-purple-200 text-xs">{t('assistants.casanovaDesc')}</span>
                </div>
                
                <div className="bg-purple-800/50 p-3 rounded-lg border border-purple-500/30 flex flex-col items-center cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-lg font-bold text-white mb-2">
                    👩‍🚀
                  </div>
                  <span className="text-white text-xs font-medium">Venus</span>
                  <span className="text-purple-200 text-xs">{t('assistants.venusDesc')}</span>
                </div>
                
                <div className="bg-purple-800/50 p-3 rounded-lg border border-purple-500/30 flex flex-col items-center cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-lg font-bold text-white mb-2">
                    🤖
                  </div>
                  <span className="text-white text-xs font-medium">Aurora</span>
                  <span className="text-purple-200 text-xs">{t('assistants.auroraDesc')}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-purple-800/40 rounded-lg border border-purple-500/30">
              <div className="flex items-center">
                <MessageSquare className="w-5 h-5 text-pink-400 mr-3" />
                <div>
                  <h4 className="text-white text-sm font-medium">Proactive AI Suggestions</h4>
                  <p className="text-purple-200 text-xs">Receive AI suggestions based on your activities</p>
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
                <MessageSquare className="w-5 h-5 text-pink-400 mr-3" />
                <div>
                  <h4 className="text-white text-sm font-medium">Personalized Insights</h4>
                  <p className="text-purple-200 text-xs">Allow AI to analyze your relationship patterns</p>
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
                <MessageSquare className="w-5 h-5 text-pink-400 mr-3" />
                <div>
                  <h4 className="text-white text-sm font-medium">Content Customization</h4>
                  <p className="text-purple-200 text-xs">Let AI customize content based on your interests</p>
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
              onClick={() => setAiPreferencesModalOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button 
              className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white"
              onClick={() => {
                toast({
                  title: "AI preferences updated",
                  description: "Your AI preferences have been saved",
                });
                setAiPreferencesModalOpen(false);
              }}
            >
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Help & Support Modal */}
      <Dialog open={helpModalOpen} onOpenChange={setHelpModalOpen}>
        <DialogContent className="max-w-md bg-gradient-to-br from-purple-900 to-purple-800 text-white border-purple-500/30">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white text-center">{t('profile.help')}</DialogTitle>
            <DialogDescription className="text-purple-200 text-center">
              Get help and support
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="bg-purple-800/40 p-4 rounded-lg border border-purple-500/30">
              <h3 className="text-white font-medium mb-2 flex items-center">
                <HelpCircle className="w-5 h-5 text-pink-400 mr-2" />
                Frequently Asked Questions
              </h3>
              <div className="space-y-3">
                <div className="bg-purple-900/60 p-3 rounded-lg">
                  <h4 className="text-white text-sm font-medium mb-1">How do I connect with my partner?</h4>
                  <p className="text-purple-200 text-xs">Share your partner code or send them an email invitation from your profile.</p>
                </div>
                <div className="bg-purple-900/60 p-3 rounded-lg">
                  <h4 className="text-white text-sm font-medium mb-1">How do I earn points and increase bond strength?</h4>
                  <p className="text-purple-200 text-xs">Complete daily challenges, quizzes, and participate in competitions together.</p>
                </div>
                <div className="bg-purple-900/60 p-3 rounded-lg">
                  <h4 className="text-white text-sm font-medium mb-1">Can I change my AI assistant?</h4>
                  <p className="text-purple-200 text-xs">Yes, you can select your preferred AI assistant in AI Preferences.</p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-800/40 p-4 rounded-lg border border-purple-500/30">
              <h3 className="text-white font-medium mb-2 flex items-center">
                <MessageSquare className="w-5 h-5 text-pink-400 mr-2" />
                Contact Support
              </h3>
              <div className="space-y-3">
                <textarea 
                  className="w-full bg-purple-800/50 border border-purple-500/30 rounded-lg p-3 text-white placeholder:text-purple-300 resize-none"
                  placeholder="Describe your issue or question..."
                  rows={4}
                ></textarea>
                <Button 
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                  onClick={() => {
                    toast({
                      title: "Message sent",
                      description: "We'll get back to you as soon as possible",
                    });
                  }}
                >
                  Send Message
                </Button>
              </div>
            </div>
          </div>
          
          <DialogFooter className="mt-6">
            <Button 
              variant="outline" 
              className="w-full border-purple-500/30 text-white hover:bg-purple-700/50"
              onClick={() => setHelpModalOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Subscription Modal */}
      <Dialog open={subscriptionsModalOpen} onOpenChange={setSubscriptionsModalOpen}>
        <DialogContent className="max-w-md bg-gradient-to-br from-purple-900 to-purple-800 text-white border-purple-500/30">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white text-center">{t('profile.subscriptions')}</DialogTitle>
            <DialogDescription className="text-purple-200 text-center">
              Manage your subscription plan
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="bg-gradient-to-br from-purple-900/80 to-purple-700/80 p-4 rounded-xl border border-purple-500/30">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-medium">Current Plan</h3>
                <span className="bg-purple-600 py-1 px-2 rounded-full text-xs text-white">Free</span>
              </div>
              
              <div className="text-purple-200 text-sm space-y-2">
                <p>• 5 quizzes per month</p>
                <p>• Basic AI suggestions</p>
                <p>• Standard relationship insights</p>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-900/80 to-purple-700/80 p-4 rounded-xl border border-purple-500/30">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-medium">Premium Plan</h3>
                <span className="bg-pink-500 py-1 px-2 rounded-full text-xs text-white">$9.99/month</span>
              </div>
              
              <div className="text-purple-200 text-sm space-y-2">
                <p>• Unlimited quizzes</p>
                <p>• Advanced AI relationship coaching</p>
                <p>• Detailed relationship insights</p>
                <p>• Priority support</p>
                <p>• Ad-free experience</p>
              </div>
              
              <Button
                className="w-full mt-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                onClick={() => toast({
                  title: "Coming soon!",
                  description: "Premium subscriptions will be available soon.",
                })}
              >
                Upgrade to Premium
              </Button>
            </div>
          </div>
          
          <DialogFooter className="mt-6">
            <Button 
              variant="outline" 
              className="w-full border-purple-500/30 text-white hover:bg-purple-700/50"
              onClick={() => setSubscriptionsModalOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
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
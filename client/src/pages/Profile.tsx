import React from "react";
import { useLocation } from "wouter";
import BottomNavigation from "../components/layout/BottomNavigation";
import { Settings, User, Heart, Trophy, Award, CalendarDays, Bell, Shield, MessageSquare, CreditCard, HelpCircle, LogOut } from "lucide-react";

export default function Profile() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = React.useState<"profile" | "achievements" | "settings">("profile");

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-fuchsia-900 pb-20">
      {/* Profile Header */}
      <div className="pt-8 px-6 text-white">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Profile</h1>
          {activeTab === "profile" && (
            <button 
              onClick={() => setActiveTab("settings")}
              className="flex items-center gap-1 text-white rounded-full bg-purple-700/40 backdrop-blur-sm px-3 py-1.5 shadow-lg border border-purple-500/20"
            >
              <Settings className="w-4 h-4" />
              <span className="text-sm">Settings</span>
            </button>
          )}
        </div>

        {/* Profile Tabs */}
        <div className="flex border-b border-purple-700/50 mb-6">
          <button 
            className={`pb-2 px-4 text-sm font-medium ${activeTab === "profile" ? "text-white border-b-2 border-white" : "text-purple-300"}`}
            onClick={() => setActiveTab("profile")}
          >
            Profile
          </button>
          <button 
            className={`pb-2 px-4 text-sm font-medium ${activeTab === "achievements" ? "text-white border-b-2 border-white" : "text-purple-300"}`}
            onClick={() => setActiveTab("achievements")}
          >
            Achievements
          </button>
          <button 
            className={`pb-2 px-4 text-sm font-medium ${activeTab === "settings" ? "text-white border-b-2 border-white" : "text-purple-300"}`}
            onClick={() => setActiveTab("settings")}
          >
            Settings
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
                  <span className="text-sm">Single, ready to connect</span>
                </div>
                
                <button className="mt-3 flex items-center gap-1 bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-1.5 rounded-full text-sm text-white shadow-md">
                  <span>Edit Profile</span>
                </button>
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
                    <span className="text-white">Notifications</span>
                  </div>
                  <span className="text-purple-300">→</span>
                </button>
              </li>
              <li>
                <button className="flex items-center justify-between w-full text-left p-4 hover:bg-purple-700/20">
                  <div className="flex items-center">
                    <Shield className="w-5 h-5 text-pink-400 mr-3" />
                    <span className="text-white">Privacy</span>
                  </div>
                  <span className="text-purple-300">→</span>
                </button>
              </li>
              <li>
                <button className="flex items-center justify-between w-full text-left p-4 hover:bg-purple-700/20">
                  <div className="flex items-center">
                    <MessageSquare className="w-5 h-5 text-pink-400 mr-3" />
                    <span className="text-white">AI Assistant Preferences</span>
                  </div>
                  <span className="text-purple-300">→</span>
                </button>
              </li>
              <li>
                <button className="flex items-center justify-between w-full text-left p-4 hover:bg-purple-700/20">
                  <div className="flex items-center">
                    <CreditCard className="w-5 h-5 text-pink-400 mr-3" />
                    <span className="text-white">Subscriptions</span>
                  </div>
                  <span className="text-purple-300">→</span>
                </button>
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
    </div>
  );
}
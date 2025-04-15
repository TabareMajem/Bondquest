import React from "react";
import { useLocation } from "wouter";
import BottomNavigation from "../components/layout/BottomNavigation";
import { Settings, User } from "lucide-react";

export default function Profile() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-800 to-purple-900 pb-20">
      {/* Profile Header */}
      <div className="pt-8 px-6 text-white">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Profile</h1>
          <button 
            className="flex items-center gap-1 text-purple-200 rounded-full bg-purple-700 bg-opacity-50 px-3 py-1.5"
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm">Settings</span>
          </button>
        </div>
      </div>

      {/* Simple Profile Content */}
      <div className="px-6">
        <div className="bg-white bg-opacity-10 rounded-xl p-5 mb-6 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-3xl font-bold text-white mx-auto mb-4">
            <User className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-white mb-1">User Name</h2>
          <p className="text-purple-200">user@example.com</p>
        </div>
        
        <div className="bg-white bg-opacity-10 rounded-xl p-5 mb-6">
          <h3 className="text-white font-medium mb-4">Account Information</h3>
          <p className="text-purple-200">The profile page is under development. More features coming soon!</p>
        </div>
      </div>

      <BottomNavigation activeTab="profile" />
    </div>
  );
}
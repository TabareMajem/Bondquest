import React, { useState } from "react";
import { useLocation } from "wouter";
import BottomNavigation from "../components/layout/BottomNavigation";
import { Trophy, Clock, Flame, Medal, ChevronRight } from "lucide-react";

export default function Compete() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"couple" | "partner" | "memory">("couple");

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-fuchsia-900 pb-20">
      {/* Header */}
      <div className="pt-8 px-6 text-white">
        <h1 className="text-2xl font-bold mb-6">Compete</h1>
        
        {/* Tab Navigation */}
        <div className="bg-white/10 backdrop-blur-sm rounded-full p-1 flex items-center mb-6 shadow-lg border border-white/10">
          <button
            className={`flex-1 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              activeTab === "couple" 
                ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md" 
                : "text-white/80 hover:text-white"
            }`}
            onClick={() => setActiveTab("couple")}
          >
            Couple vs. Couple
          </button>
          <button
            className={`flex-1 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              activeTab === "partner" 
                ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md" 
                : "text-white/80 hover:text-white"
            }`}
            onClick={() => setActiveTab("partner")}
          >
            Partner vs. Partner
          </button>
          <button
            className={`flex-1 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              activeTab === "memory" 
                ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md" 
                : "text-white/80 hover:text-white"
            }`}
            onClick={() => setActiveTab("memory")}
          >
            Memory Lane
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6">
        {activeTab === "couple" && (
          <div className="space-y-5">
            {/* Trivia Showdown Card */}
            <div 
              className="bg-gradient-to-br from-pink-500/90 to-purple-600/90 backdrop-blur-md rounded-2xl shadow-xl border border-pink-500/20 p-5 flex items-center cursor-pointer"
              onClick={() => navigate("/quizzes")}
            >
              <div className="w-16 h-16 mr-4">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white w-full h-full">
                  <path d="M17.5,9 C19.9853,9 22,11.0147 22,13.5 C22,15.9853 19.9853,18 17.5,18 L17.5,18 L17.5,9 Z" fill="rgba(255,255,255,0.4)"></path>
                  <path d="M6.5,9 L6.5,18 C4.01472,18 2,15.9853 2,13.5 C2,11.0147 4.01472,9 6.5,9 L6.5,9 Z" fill="rgba(255,255,255,0.4)"></path>
                  <path d="M17.5,9 L6.5,9 L6.5,18 L17.5,18 L17.5,9 Z" fill="rgba(255,255,255,0.4)"></path>
                  <path d="M11.4343,5.56568 C12.4646,4.53553 14.1162,4.53553 15.1464,5.56568 C16.1765,6.59582 16.1765,8.24738 15.1464,9.27753 L15.1464,9.27753 L12.2,12.224 L8.82843,8.85253 L11.4343,6.24675 C11.1879,6.50039 11.185,6.87095 11.4315,7.11567 C11.6834,7.36573 12.0813,7.3631 12.3291,7.10898 C12.5792,6.85473 12.5677,6.4547 12.3035,6.19474 C12.0472,5.94142 11.6535,5.94669 11.4047,6.19548 L11.4343,5.56568 Z" fill="white"></path>
                  <path d="M6.37722,14.5272 C5.5271,14.1072 5,13.2626 5,12.2983 C5,10.9479 6.09391,9.85401 7.44425,9.85401 C8.40844,9.85401 9.25306,10.3811 9.67309,11.1713 L9.67309,11.1713 L9.44926,13.4991 L6.37722,14.5272 Z" fill="white"></path>
                  <path d="M14.3277,14.5272 L17.3991,13.4991 L17.623,11.1713 C17.203,10.3811 16.3583,9.85401 15.3941,9.85401 C14.0438,9.85401 12.9499,10.9479 12.9499,12.2983 C12.9499,13.2625 13.4769,14.1072 14.3277,14.5272 Z" fill="white"></path>
                  <path d="M9.45,16.0196 C9.45,14.8305 10.4109,13.8696 11.6,13.8696 C12.7891,13.8696 13.75,14.8305 13.75,16.0196 C13.75,17.2087 12.7891,18.1696 11.6,18.1696 C10.4109,18.1696 9.45,17.2087 9.45,16.0196 Z" fill="white"></path>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-white text-lg font-bold">Trivia Showdown</h3>
                <p className="text-white/80 text-sm mb-2">Face off against another couple</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 text-white/80 mr-1" />
                    <span className="text-white/80 text-xs">5 min</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-yellow-300 font-medium text-sm mr-1">+20 pts</span>
                  </div>
                </div>
              </div>
            </div>

            {/* How Well Do You Know Each Other Card */}
            <div 
              className="bg-gradient-to-br from-orange-400/90 to-pink-500/90 backdrop-blur-md rounded-2xl shadow-xl border border-orange-400/20 p-5 flex items-center cursor-pointer"
              onClick={() => navigate("/quizzes")}
            >
              <div className="w-16 h-16 mr-4 flex items-center justify-center">
                <div className="relative w-full h-full">
                  <div className="absolute left-2 top-2 w-6 h-6 rounded-full bg-white/30 flex items-center justify-center">
                    <span className="text-white font-bold">?</span>
                  </div>
                  <div className="absolute right-2 top-2 w-6 h-6 rounded-full bg-white/30 flex items-center justify-center">
                    <span className="text-white font-bold">?</span>
                  </div>
                  <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <Heart className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-white text-lg font-bold">How Well Do You Know Each Other?</h3>
                <p className="text-white/80 text-sm mb-2">Answer questions about your partner</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 text-white/80 mr-1" />
                    <span className="text-white/80 text-xs">10 min</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-yellow-300 font-medium text-sm mr-1">+30 pts</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Relationship Remix Card */}
            <div 
              className="bg-gradient-to-br from-blue-500/90 to-indigo-600/90 backdrop-blur-md rounded-2xl shadow-xl border border-blue-500/20 p-5 flex items-center cursor-pointer"
              onClick={() => navigate("/quizzes")}
            >
              <div className="w-16 h-16 mr-4 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-white text-lg font-bold">Relationship Remix</h3>
                <p className="text-white/80 text-sm mb-2">Rediscover moments from your past</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 text-white/80 mr-1" />
                    <span className="text-white/80 text-xs">5 min</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-yellow-300 font-medium text-sm mr-1">+25 pts</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Morning Routines Card */}
            <div 
              className="bg-gradient-to-br from-amber-400/90 to-orange-500/90 backdrop-blur-md rounded-2xl shadow-xl border border-amber-400/20 p-5 flex items-center cursor-pointer"
              onClick={() => navigate("/quizzes")}
            >
              <div className="w-16 h-16 mr-4 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-amber-300/70 flex items-center justify-center">
                    <svg className="w-5 h-5 text-amber-800" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2,21 L22,21 L22,19 L2,19 L2,21 Z M20,8 L18,8 L18,5 L20,5 L20,8 Z M20,14 L18,14 L18,10 L20,10 L20,14 Z M20,18 L18,18 L18,16 L20,16 L20,18 Z M6,18 L16,18 L16,16 L6,16 L6,18 Z M6,14 L16,14 L16,10 L6,10 L6,14 Z M6,8 L16,8 L16,5 L6,5 L6,8 Z M4,18 L4,5 C4,3.9 4.9,3 6,3 L18,3 C19.1,3 20,3.9 20,5 L20,18 L4,18 Z"></path>
                    </svg>
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-white text-lg font-bold">Morning Routines</h3>
                <p className="text-white/80 text-sm mb-2">Discuss your daily habits and rituals</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 text-white/80 mr-1" />
                    <span className="text-white/80 text-xs">5 min</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-yellow-300 font-medium text-sm mr-1">+20 pts</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === "partner" && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/10 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-700 to-purple-900 rounded-full flex items-center justify-center mb-4 shadow-lg">
              <Trophy className="w-8 h-8 text-yellow-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Partner Challenges</h3>
            <p className="text-white/70 mb-4">Compete directly with your partner in quick challenges to earn points and rewards.</p>
            <p className="text-white/60 text-sm mb-6">New partner challenges coming soon!</p>
            <button className="bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium py-2 px-6 rounded-full shadow-lg">
              Get Notified
            </button>
          </div>
        )}
        
        {activeTab === "memory" && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/10 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-700 to-indigo-900 rounded-full flex items-center justify-center mb-4 shadow-lg">
              <div className="w-10 h-10 bg-indigo-900/60 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Memory Lane Challenges</h3>
            <p className="text-white/70 mb-4">Test how well you remember important moments in your relationship journey.</p>
            <p className="text-white/60 text-sm mb-6">Coming soon! Upload photos and create memories to unlock this feature.</p>
            <button className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium py-2 px-6 rounded-full shadow-lg">
              Coming Soon
            </button>
          </div>
        )}
        
        {/* Leaderboard Section */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white">Leaderboard</h3>
            <button className="text-pink-300 text-sm flex items-center">
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden shadow-xl border border-white/10">
            {/* Top 3 */}
            <div className="p-4 bg-gradient-to-r from-purple-900/60 to-fuchsia-900/60">
              <div className="flex items-center justify-around py-4">
                {/* 2nd Place */}
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 border-2 border-white flex items-center justify-center shadow-lg mb-2">
                    <span className="text-xs">👫</span>
                  </div>
                  <span className="text-white text-sm font-medium">John & Lisa</span>
                  <div className="flex items-center mt-1">
                    <Medal className="w-4 h-4 text-gray-300 mr-1" />
                    <span className="text-gray-300 text-xs">85 pts</span>
                  </div>
                </div>
                
                {/* 1st Place */}
                <div className="flex flex-col items-center -mt-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 border-2 border-white flex items-center justify-center shadow-lg mb-2">
                    <span className="text-lg">👑</span>
                  </div>
                  <span className="text-white text-sm font-medium">Emma & James</span>
                  <div className="flex items-center mt-1">
                    <Medal className="w-4 h-4 text-yellow-300 mr-1" />
                    <span className="text-yellow-300 text-xs">120 pts</span>
                  </div>
                </div>
                
                {/* 3rd Place */}
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 border-2 border-white flex items-center justify-center shadow-lg mb-2">
                    <span className="text-xs">👫</span>
                  </div>
                  <span className="text-white text-sm font-medium">Alex & Sam</span>
                  <div className="flex items-center mt-1">
                    <Medal className="w-4 h-4 text-amber-600 mr-1" />
                    <span className="text-amber-600 text-xs">72 pts</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Other Rankings */}
            <div className="divide-y divide-white/10">
              <div className="p-4 flex items-center">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mr-3">
                  <span className="text-white font-medium text-sm">4</span>
                </div>
                <div className="flex-1">
                  <span className="text-white font-medium">Robert & Amy</span>
                </div>
                <div className="flex items-center">
                  <Flame className="w-4 h-4 text-red-400 mr-1" />
                  <span className="text-white">65 pts</span>
                </div>
              </div>
              
              <div className="p-4 flex items-center bg-gradient-to-r from-purple-500/30 to-pink-500/30">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mr-3 shadow-md">
                  <span className="text-white font-medium text-sm">12</span>
                </div>
                <div className="flex-1">
                  <span className="text-white font-medium">You & Partner</span>
                </div>
                <div className="flex items-center">
                  <Flame className="w-4 h-4 text-red-400 mr-1" />
                  <span className="text-white">50 pts</span>
                </div>
              </div>
              
              <div className="p-4 flex items-center">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mr-3">
                  <span className="text-white font-medium text-sm">13</span>
                </div>
                <div className="flex-1">
                  <span className="text-white font-medium">Eric & Tina</span>
                </div>
                <div className="flex items-center">
                  <span className="text-white">48 pts</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <BottomNavigation activeTab="compete" />
    </div>
  );
}

interface HeartProps {
  className?: string;
}

function Heart({ className }: HeartProps) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}
import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Trophy, Calendar, Star, Users, Play, BarChart3, Settings, Link } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';

// Circular progress component for bond strength
const CircularProgress = ({ value, size = 120 }: { value: number; size?: number }) => {
  const radius = (size - 8) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="8"
          fill="transparent"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#bondGradient)"
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
        {/* Gradient definition */}
        <defs>
          <linearGradient id="bondGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#EF4444" />
          </linearGradient>
        </defs>
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white">{value}%</span>
        <span className="text-xs text-white/70">Bond Strength</span>
      </div>
    </div>
  );
};

// Activity card component
const ActivityCard = ({ 
  icon: Icon, 
  title, 
  subtitle, 
  points, 
  onClick,
  variant = 'default'
}: {
  icon: any;
  title: string;
  subtitle: string;
  points?: number;
  onClick?: () => void;
  variant?: 'default' | 'featured';
}) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`
      relative overflow-hidden rounded-2xl p-4 cursor-pointer
      ${variant === 'featured' 
        ? 'bg-gradient-to-r from-pink-100 to-purple-100 border-2 border-pink-200' 
        : 'bg-white/90 backdrop-blur-sm border border-white/20'
      }
    `}
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`
          w-12 h-12 rounded-full flex items-center justify-center
          ${variant === 'featured' 
            ? 'bg-gradient-to-r from-pink-500 to-purple-600' 
            : 'bg-gradient-to-r from-blue-500 to-purple-600'
          }
        `}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <p className="text-sm text-gray-600">{subtitle}</p>
        </div>
      </div>
      {points && (
        <div className="text-right">
          <span className="text-lg font-bold text-gray-800">{points}</span>
          <p className="text-xs text-gray-500">points</p>
        </div>
      )}
      {variant === 'featured' && (
        <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-6">
          START
        </Button>
      )}
    </div>
  </motion.div>
);

// Floating action buttons
const FloatingActions = () => (
  <div className="fixed bottom-6 right-6 flex flex-col gap-3">
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="w-14 h-14 bg-purple-600 rounded-full flex items-center justify-center shadow-lg"
    >
      <Users className="h-6 w-6 text-white" />
    </motion.button>
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center shadow-lg"
    >
      <Link className="h-6 w-6 text-white" />
    </motion.button>
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="w-14 h-14 bg-pink-600 rounded-full flex items-center justify-center shadow-lg"
    >
      <Heart className="h-6 w-6 text-white" />
    </motion.button>
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center shadow-lg"
    >
      <Settings className="h-6 w-6 text-white" />
    </motion.button>
  </div>
);

export default function Dashboard() {
  const { user, couple } = useAuth();
  const [, setLocation] = useLocation();

  const bondStrength = 68; // This would come from your bond assessment data

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800">
      {/* Header with user profiles */}
      <div className="relative pt-12 pb-8 px-6">
        <div className="flex items-center justify-center gap-8 mb-8">
          {/* User 1 Avatar */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="relative"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 p-1">
              <div className="w-full h-full rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face" 
                  alt="Alex"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </motion.div>

          {/* Names and Bond Strength */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center"
          >
            <h1 className="text-2xl font-bold text-white mb-4">Alex & James</h1>
            <CircularProgress value={bondStrength} />
          </motion.div>

          {/* User 2 Avatar */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.6 }}
            className="relative"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400 p-1">
              <div className="w-full h-full rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face" 
                  alt="James"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Daily Quiz Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mx-4"
        >
          <ActivityCard
            icon={Heart}
            title="Daily Quiz"
            subtitle="How Well Do You Know Me?"
            variant="featured"
            onClick={() => setLocation('/quiz/1')}
          />
        </motion.div>
      </div>

      {/* Recent Activity Section */}
      <div className="px-6 pb-24">
        <motion.h2
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.0 }}
          className="text-xl font-bold text-white mb-4"
        >
          Recent Activity
        </motion.h2>

        <div className="space-y-3">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.1 }}
          >
            <ActivityCard
              icon={Calendar}
              title="Relationship Milestones Quiz"
              subtitle="You unlocked an achievement!"
              onClick={() => setLocation('/quiz/2')}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2 }}
          >
            <ActivityCard
              icon={Star}
              title="Favorite Things Quiz"
              subtitle="28 points"
              points={28}
              onClick={() => setLocation('/quiz/3')}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.3 }}
          >
            <ActivityCard
              icon={Heart}
              title="Today's Quiz"
              subtitle="48 points"
              points={48}
              onClick={() => setLocation('/quiz/4')}
            />
          </motion.div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4 }}
        className="fixed bottom-0 left-0 right-0 bg-purple-900/90 backdrop-blur-lg border-t border-white/10"
      >
        <div className="flex items-center justify-around py-3 px-6">
          <button className="flex flex-col items-center gap-1 text-white">
            <div className="w-6 h-6 flex items-center justify-center">
              <Heart className="h-5 w-5" />
            </div>
            <span className="text-xs">Home</span>
          </button>
          
          <button 
            className="flex flex-col items-center gap-1 text-white/60"
            onClick={() => setLocation('/quizzes')}
          >
            <div className="w-6 h-6 flex items-center justify-center">
              <Play className="h-5 w-5" />
            </div>
            <span className="text-xs">Play</span>
          </button>
          
          <button 
            className="flex flex-col items-center gap-1 text-white/60"
            onClick={() => setLocation('/competitions')}
          >
            <div className="w-6 h-6 flex items-center justify-center">
              <Trophy className="h-5 w-5" />
            </div>
            <span className="text-xs">Compete</span>
          </button>
          
          <button 
            className="flex flex-col items-center gap-1 text-white/60"
            onClick={() => setLocation('/insights')}
          >
            <div className="w-6 h-6 flex items-center justify-center">
              <BarChart3 className="h-5 w-5" />
            </div>
            <span className="text-xs">Insights</span>
          </button>
          
          <button 
            className="flex flex-col items-center gap-1 text-white/60"
            onClick={() => setLocation('/settings')}
          >
            <div className="w-6 h-6 flex items-center justify-center">
              <Settings className="h-5 w-5" />
            </div>
            <span className="text-xs">Settings</span>
          </button>
        </div>
      </motion.div>

      {/* Floating Action Buttons */}
      <FloatingActions />
    </div>
  );
} 
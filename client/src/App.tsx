import React from 'react';
import { Switch, Route, Link, useLocation } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Toaster } from "@/components/ui/toaster";

// Main BondQuest Pages
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import VoiceOnboarding from './pages/VoiceOnboarding';
import QuizGame from './pages/QuizGame';
import QuizSelector from './pages/QuizSelector';
import BondAssessment from './pages/BondAssessment';
import Profile from './pages/Profile';
import Insights from './pages/Insights';
import Compete from './pages/Compete';
import RewardsWall from './pages/RewardsWall';
import AIAssistant from './pages/AIAssistant';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Onboarding from './pages/Onboarding';
import OnboardingChat from './pages/OnboardingChat';
import PartnerLinking from './pages/PartnerLinking';
import ProfileSetup from './pages/ProfileSetup';
import CheckoutPage from './pages/CheckoutPage';
import SubscriptionPage from './pages/SubscriptionPage';

// Admin Pages
import AffiliateManagement from './pages/admin/AffiliateManagement';
import AdminDashboard from './pages/AdminDashboard';
import AdminQuizzes from './pages/AdminQuizzes';
import AdminUsers from './pages/AdminUsers';
import AdminRewards from './pages/AdminRewards';
import AdminCompetitions from './pages/AdminCompetitions';
import AdminSubscriptions from './pages/AdminSubscriptions';

// Affiliate Pages
import PartnerPortal from './pages/affiliate/PartnerPortal';
import LoginPage from './pages/affiliate/LoginPage';

// Contexts
import { AuthProvider } from './contexts/AuthContext';
import { AffiliateAuthProvider } from './hooks/use-affiliate-auth';

function Navigation() {
  const [location] = useLocation();

  return (
    <nav className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/">
          <a className="text-2xl font-bold bg-gradient-to-r from-pink-300 to-purple-300 bg-clip-text text-transparent">
            💕 BondQuest
          </a>
        </Link>
        <div className="flex space-x-6">
          <Link href="/">
            <a className={`hover:text-pink-200 transition-colors ${location === '/' ? 'text-pink-200 font-semibold' : ''}`}>
              Home
            </a>
          </Link>
          <Link href="/dashboard">
            <a className={`hover:text-pink-200 transition-colors ${location === '/dashboard' ? 'text-pink-200 font-semibold' : ''}`}>
              Dashboard
            </a>
          </Link>
          <Link href="/voice-onboarding">
            <a className={`hover:text-pink-200 transition-colors ${location === '/voice-onboarding' ? 'text-pink-200 font-semibold' : ''}`}>
              🎤 Voice Setup
            </a>
          </Link>
          <Link href="/quiz">
            <a className={`hover:text-pink-200 transition-colors ${location.startsWith('/quiz') ? 'text-pink-200 font-semibold' : ''}`}>
              🎮 Quizzes
            </a>
          </Link>
          <Link href="/compete">
            <a className={`hover:text-pink-200 transition-colors ${location === '/compete' ? 'text-pink-200 font-semibold' : ''}`}>
              🏆 Compete
            </a>
          </Link>
          <Link href="/insights">
            <a className={`hover:text-pink-200 transition-colors ${location === '/insights' ? 'text-pink-200 font-semibold' : ''}`}>
              📊 Insights
            </a>
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AffiliateAuthProvider>
          <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-blue-900">
            <Navigation />
            <main>
              <Switch>
                {/* Main BondQuest Routes */}
                <Route path="/" component={Home} />
                <Route path="/dashboard" component={Dashboard} />
                <Route path="/voice-onboarding" component={VoiceOnboarding} />
                <Route path="/quiz" component={QuizSelector} />
                <Route path="/quiz/:id" component={QuizGame} />
                <Route path="/bond-assessment" component={BondAssessment} />
                <Route path="/profile" component={Profile} />
                <Route path="/insights" component={Insights} />
                <Route path="/compete" component={Compete} />
                <Route path="/rewards" component={RewardsWall} />
                <Route path="/ai-assistant" component={AIAssistant} />
                <Route path="/login" component={Login} />
                <Route path="/signup" component={SignUp} />
                <Route path="/onboarding" component={Onboarding} />
                <Route path="/onboarding-chat" component={OnboardingChat} />
                <Route path="/partner-linking" component={PartnerLinking} />
                <Route path="/profile-setup" component={ProfileSetup} />
                <Route path="/checkout" component={CheckoutPage} />
                <Route path="/subscription" component={SubscriptionPage} />

                {/* Admin Routes */}
                <Route path="/admin" component={AdminDashboard} />
                <Route path="/admin/affiliate" component={AffiliateManagement} />
                <Route path="/admin/quizzes" component={AdminQuizzes} />
                <Route path="/admin/users" component={AdminUsers} />
                <Route path="/admin/rewards" component={AdminRewards} />
                <Route path="/admin/competitions" component={AdminCompetitions} />
                <Route path="/admin/subscriptions" component={AdminSubscriptions} />

                {/* Affiliate Routes */}
                <Route path="/affiliate/portal" component={PartnerPortal} />
                <Route path="/affiliate/login" component={LoginPage} />

                {/* 404 Route */}
                <Route>
                  <div className="container mx-auto p-8 text-center text-white">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-md mx-auto">
                      <h1 className="text-4xl font-bold mb-4">404</h1>
                      <p className="text-lg mb-6">Page not found</p>
                      <Link href="/">
                        <a className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-full font-semibold hover:from-pink-600 hover:to-purple-700 transition-all duration-300 inline-block">
                          🏠 Go Home
                        </a>
                      </Link>
                    </div>
                  </div>
                </Route>
              </Switch>
            </main>
            <Toaster />
          </div>
        </AffiliateAuthProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";

// Force cache reload after deployment with a version timestamp
const APP_VERSION = Date.now();
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "./contexts/AuthContext";
import { QuizProvider } from "./contexts/QuizContext";
import InstallPrompt from "@/components/pwa/InstallPrompt";
import Home from "./pages/Home";
import Onboarding from "./pages/Onboarding";
import AuthPage from "./pages/auth-page";
import OnboardingChat from "./pages/OnboardingChat";
import PartnerLinking from "./pages/PartnerLinking";
import ProfileSetup from "./pages/ProfileSetup";
import QuizSelector from "./pages/QuizSelector";
import QuizGame from "./pages/QuizGame";
import AIAssistant from "./pages/AIAssistant";
import Insights from "./pages/Insights";
import Profile from "./pages/Profile";
import Compete from "./pages/Compete";
import RewardsWall from "./pages/RewardsWall";
import BondAssessment from "./pages/BondAssessment";

// Admin Pages
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminQuizzes from "./pages/AdminQuizzes";
import AdminRewards from "./pages/AdminRewards";
import AdminRewardForm from "./pages/AdminRewardForm";
import AdminCompetitions from "./pages/AdminCompetitions";
import AdminCompetitionForm from "./pages/AdminCompetitionForm";
import AdminSubscriptions from "./pages/AdminSubscriptions";
import AdminSubscriptionTierForm from "./pages/AdminSubscriptionTierForm";
import AdminAIWizard from "./pages/AdminAIWizard";

// Custom route component that checks for auth and skip settings
function SoloModeEnabledRoute({ path, component: Component }: {path: string, component: React.ComponentType<any>}) {
  // Check localStorage directly to avoid import issues with useAuth
  const storedUser = localStorage.getItem("bondquest_user");
  
  // Immediately enable solo mode for any authenticated user
  if (storedUser) {
    localStorage.setItem("profile_setup_completed", "true");
  }

  // Use children pattern instead of component prop to fix type issues
  return (
    <Route path={path}>
      <Component />
    </Route>
  );
}

function Router() {
  const [location] = useLocation();
  
  return (
    <Switch>
      {/* User Routes */}
      <Route path="/" component={Onboarding} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/signup">
        {() => {
          window.location.href = "/auth";
          return null;
        }}
      </Route>
      <Route path="/login">
        {() => {
          window.location.href = "/auth";
          return null;
        }}
      </Route>
      <Route path="/onboarding-chat" component={OnboardingChat} />
      <Route path="/partner-linking" component={PartnerLinking} />
      <Route path="/profile-setup" component={ProfileSetup} />
      
      {/* Use special route handler for home to ensure solo mode is enabled */}
      <SoloModeEnabledRoute path="/home" component={Home} />
      
      {/* Regular routes */}
      <Route path="/quizzes" component={QuizSelector} />
      <Route path="/quizzes/:id" component={QuizGame} />
      <Route path="/ai-assistant" component={AIAssistant} />
      <Route path="/insights" component={Insights} />
      <Route path="/profile" component={Profile} />
      <Route path="/compete" component={Compete} />
      <Route path="/rewards" component={RewardsWall} />
      <Route path="/bond-assessment" component={BondAssessment} />
      
      {/* Admin Routes */}
      <Route path="/admin" component={AdminDashboard} />
      
      {/* Admin User Management */}
      <Route path="/admin/users" component={AdminUsers} />
      
      {/* Admin Quiz Management */}
      <Route path="/admin/quizzes" component={AdminQuizzes} />
      
      {/* Admin Rewards Management */}
      <Route path="/admin/rewards" component={AdminRewards} />
      <Route path="/admin/rewards/new" component={AdminRewardForm} />
      <Route path="/admin/rewards/:id/edit" component={AdminRewardForm} />
      
      {/* Admin Competition Management */}
      <Route path="/admin/competitions" component={AdminCompetitions} />
      <Route path="/admin/competitions/new" component={AdminCompetitionForm} />
      <Route path="/admin/competitions/:id/edit" component={AdminCompetitionForm} />
      
      {/* Admin Subscription Management */}
      <Route path="/admin/subscriptions" component={AdminSubscriptions} />
      <Route path="/admin/subscriptions/tiers/new" component={AdminSubscriptionTierForm} />
      <Route path="/admin/subscriptions/tiers/:id/edit" component={AdminSubscriptionTierForm} />
      
      {/* Admin AI Tools */}
      <Route path="/admin/ai-wizard" component={AdminAIWizard} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Force cache reload after deployment
  useEffect(() => {
    console.log(`App version: ${APP_VERSION}`);
    
    // Add meta tag to force cache refresh
    const meta = document.createElement('meta');
    meta.name = 'app-version';
    meta.content = APP_VERSION.toString();
    document.head.appendChild(meta);
    
    // If the version in localStorage doesn't match current, clear cache and reload
    const storedVersion = localStorage.getItem('app_version');
    if (storedVersion && storedVersion !== APP_VERSION.toString()) {
      localStorage.setItem('app_version', APP_VERSION.toString());
      
      // Clear any cached data that might be affecting layout
      localStorage.removeItem('media_query_cache');
      
      // Hard reload after a slight delay
      setTimeout(() => {
        window.location.reload();
      }, 300);
    } else {
      localStorage.setItem('app_version', APP_VERSION.toString());
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <QuizProvider>
          <Router />
          <Toaster />
          <InstallPrompt />
        </QuizProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

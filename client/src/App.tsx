import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "./contexts/AuthContext";
import { QuizProvider } from "./contexts/QuizContext";
import Home from "./pages/Home";
import Onboarding from "./pages/Onboarding";
import SignUp from "./pages/SignUp";
import PartnerLinking from "./pages/PartnerLinking";
import ProfileSetup from "./pages/ProfileSetup";
import QuizSelector from "./pages/QuizSelector";
import QuizGame from "./pages/QuizGame";
import AIAssistant from "./pages/AIAssistant";
import Insights from "./pages/Insights";
import Profile from "./pages/Profile";
import Compete from "./pages/Compete";

// Admin Pages
import AdminDashboard from "./pages/AdminDashboard";
import AdminRewards from "./pages/AdminRewards";
import AdminRewardForm from "./pages/AdminRewardForm";
import AdminCompetitions from "./pages/AdminCompetitions";
import AdminCompetitionForm from "./pages/AdminCompetitionForm";
import AdminSubscriptions from "./pages/AdminSubscriptions";
import AdminSubscriptionTierForm from "./pages/AdminSubscriptionTierForm";

function Router() {
  const [location] = useLocation();
  
  return (
    <Switch>
      {/* User Routes */}
      <Route path="/" component={Onboarding} />
      <Route path="/signup" component={SignUp} />
      <Route path="/partner-linking" component={PartnerLinking} />
      <Route path="/profile-setup" component={ProfileSetup} />
      <Route path="/home" component={Home} />
      <Route path="/quizzes" component={QuizSelector} />
      <Route path="/quizzes/:id" component={QuizGame} />
      <Route path="/ai-assistant" component={AIAssistant} />
      <Route path="/insights" component={Insights} />
      <Route path="/profile" component={Profile} />
      <Route path="/compete" component={Compete} />
      
      {/* Admin Routes */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/rewards" component={AdminRewards} />
      <Route path="/admin/rewards/new" component={AdminRewardForm} />
      <Route path="/admin/rewards/:id/edit" component={AdminRewardForm} />
      <Route path="/admin/competitions" component={AdminCompetitions} />
      <Route path="/admin/competitions/new" component={AdminCompetitionForm} />
      <Route path="/admin/competitions/:id/edit" component={AdminCompetitionForm} />
      <Route path="/admin/subscriptions" component={AdminSubscriptions} />
      <Route path="/admin/subscriptions/tiers/new" component={AdminSubscriptionTierForm} />
      <Route path="/admin/subscriptions/tiers/:id/edit" component={AdminSubscriptionTierForm} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <QuizProvider>
          <Router />
          <Toaster />
        </QuizProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

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

function Router() {
  const [location] = useLocation();
  
  return (
    <Switch>
      <Route path="/" component={Onboarding} />
      <Route path="/signup" component={SignUp} />
      <Route path="/partner-linking" component={PartnerLinking} />
      <Route path="/profile-setup" component={ProfileSetup} />
      <Route path="/home" component={Home} />
      <Route path="/quizzes" component={QuizSelector} />
      <Route path="/quizzes/:id" component={QuizGame} />
      <Route path="/ai-assistant" component={AIAssistant} />
      <Route path="/insights" component={Insights} />
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

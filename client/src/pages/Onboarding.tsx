import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "../contexts/AuthContext";

export default function Onboarding() {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  // If user is already logged in, redirect to home
  useEffect(() => {
    if (user) {
      navigate("/home");
    }
  }, [user, navigate]);

  return (
    <div 
      className="min-h-screen w-full p-6 flex flex-col items-center justify-center text-white space-y-8"
      style={{ background: "var(--gradient-primary)" }}
    >
      <div className="w-full max-w-md flex flex-col items-center animate-in fade-in duration-500">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold font-poppins mb-2">BondQuest</h1>
          <p className="text-lg opacity-90">Level up your love.</p>
        </div>
        
        {/* Logo Animation Placeholder */}
        <div className="w-40 h-40 rounded-full bg-white bg-opacity-20 flex items-center justify-center mb-8">
          <svg className="w-24 h-24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="white" strokeWidth="2"/>
            <path d="M12 22C15.866 22 19 17.5228 19 12C19 6.47715 15.866 2 12 2C8.13401 2 5 6.47715 5 12C5 17.5228 8.13401 22 12 22Z" fill="white" fillOpacity="0.3"/>
            <path d="M9 12H7C7 10.3431 8.34315 9 10 9H12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <path d="M15 12H17C17 13.6569 15.6569 15 14 15H12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <path d="M8 10L9.5 12L8 14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 10L14.5 12L16 14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        
        <Button 
          className="bg-white text-primary-600 font-semibold py-3 px-10 rounded-full shadow-lg hover:shadow-xl transition-all mb-6"
          onClick={() => navigate("/auth")}
        >
          Start Your Quest
        </Button>
        
        <p className="text-sm opacity-70 mb-2">Already have an account?</p>
        <button 
          onClick={() => {
            // Clear any previous user data first
            localStorage.removeItem("bondquest_user");
            localStorage.removeItem("bondquest_couple");
            // Navigate to auth page with login tab active
            navigate("/auth");
          }} 
          className="text-white underline font-medium"
        >
          Log In
        </button>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "../contexts/AuthContext";

export default function PartnerLinking() {
  const [, navigate] = useLocation();
  const { user, updateCouple } = useAuth();
  const { toast } = useToast();
  const [partnerEmail, setPartnerEmail] = useState("");
  const [partnerCode, setPartnerCode] = useState("");
  
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
      navigate("/profile-setup");
      toast({
        title: "Partner linked successfully!",
        description: "You are now connected with your partner. Let's set up your profile.",
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
  
  // Handle "Skip for now" button
  const handleSkip = () => {
    navigate("/profile-setup");
  };

  return (
    <div 
      className="min-h-screen w-full p-6 flex flex-col items-center justify-center text-white"
      style={{ background: "var(--gradient-primary)" }}
    >
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold font-poppins mb-3 text-center">Connect with Your Partner</h1>
        <p className="text-center opacity-80 mb-8">Link your account with your partner to start your journey together</p>
        
        <div className="bg-white bg-opacity-20 backdrop-filter backdrop-blur-sm rounded-2xl p-6 mb-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Invite by Email</label>
              <div className="flex">
                <Input
                  type="email"
                  placeholder="partner@example.com"
                  value={partnerEmail}
                  onChange={(e) => setPartnerEmail(e.target.value)}
                  className="flex-grow px-4 py-3 rounded-l-lg bg-white bg-opacity-25 border border-white border-opacity-30 text-white placeholder:text-white placeholder:opacity-60 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                />
                <Button
                  onClick={handleSendInvite}
                  className="px-4 py-3 rounded-r-lg bg-yellow-400 text-gray-800 font-medium"
                >
                  Send
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white border-opacity-30"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-primary-700 opacity-90">or</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Share Your Invite Code</label>
              <div className="bg-white bg-opacity-10 p-4 rounded-lg flex items-center justify-between">
                <span className="text-lg font-mono text-white tracking-wider">
                  {user?.partnerCode || "BOND-124859"}
                </span>
                <button 
                  className="text-white opacity-80 hover:opacity-100"
                  onClick={() => {
                    navigator.clipboard.writeText(user?.partnerCode || "BOND-124859");
                    toast({
                      title: "Code copied!",
                      description: "The invitation code has been copied to clipboard.",
                    });
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path>
                  </svg>
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Have a Partner Code?</label>
              <div className="flex">
                <Input
                  type="text"
                  placeholder="Enter partner code"
                  value={partnerCode}
                  onChange={(e) => setPartnerCode(e.target.value)}
                  className="flex-grow px-4 py-3 rounded-l-lg bg-white bg-opacity-25 border border-white border-opacity-30 text-white placeholder:text-white placeholder:opacity-60 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                />
                <Button
                  onClick={handleLinkPartner}
                  disabled={linkPartnerMutation.isPending}
                  className="px-4 py-3 rounded-r-lg bg-yellow-400 text-gray-800 font-medium"
                >
                  {linkPartnerMutation.isPending ? "Linking..." : "Link"}
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <Button
          onClick={handleSkip}
          className="w-full bg-white bg-opacity-30 text-white font-medium py-3 rounded-lg hover:bg-opacity-40 transition-all"
        >
          Skip for Now
        </Button>
      </div>
    </div>
  );
}

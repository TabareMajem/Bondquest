import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Mail, Copy, Check, Users } from "lucide-react";

const PartnerLinking = () => {
  const [, navigate] = useLocation();
  const { user, couple } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [partnerCode, setPartnerCode] = useState("");
  const [partnerEmail, setPartnerEmail] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("code");

  // Redirect if user is not logged in
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
    // Redirect if user already has a couple
    if (couple) {
      navigate("/home");
    }
  }, [user, couple, navigate]);

  // Link with partner code
  const handleLinkPartner = async () => {
    if (!partnerCode) {
      toast({
        title: "Error",
        description: "Please enter a partner code",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest("POST", "/api/partner/link", {
        userId: user?.id,
        partnerCode,
      });

      const coupleData = await response.json();
      
      toast({
        title: "Success!",
        description: "Successfully linked with your partner!",
      });
      
      // Force reload to update state
      window.location.href = "/home";
    } catch (error) {
      console.error("Partner linking error:", error);
      toast({
        title: "Linking Failed",
        description: error instanceof Error ? error.message : "Failed to link with partner. Please check the code and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Invite partner by email
  const handleInvitePartner = async () => {
    if (!partnerEmail) {
      toast({
        title: "Error",
        description: "Please enter your partner's email",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await apiRequest("POST", "/api/partner/invite", {
        userId: user?.id,
        partnerEmail,
      });
      
      toast({
        title: "Invitation Sent",
        description: `We've sent an invitation to ${partnerEmail}`,
      });
      
      setPartnerEmail("");
    } catch (error) {
      console.error("Partner invitation error:", error);
      toast({
        title: "Invitation Failed",
        description: error instanceof Error ? error.message : "Failed to send invitation. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Copy user's partner code to clipboard
  const copyToClipboard = () => {
    if (user?.partnerCode) {
      navigator.clipboard.writeText(user.partnerCode);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
      
      toast({
        title: "Copied!",
        description: "Partner code copied to clipboard",
      });
    }
  };

  // Skip partner linking for now (create mock couple or solo mode)
  const handleSkip = async () => {
    navigate("/onboarding-chat");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-purple-900 via-purple-800 to-fuchsia-900 p-4">
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-sm border-white/20 text-white">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Connect with Your Partner</CardTitle>
          <CardDescription className="text-purple-200">
            Link your account with your partner to start your journey together
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="code" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="code">Enter Partner Code</TabsTrigger>
              <TabsTrigger value="invite">Invite Partner</TabsTrigger>
            </TabsList>
            
            <TabsContent value="code" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="partnerCode">Enter your partner's code</Label>
                <Input
                  id="partnerCode"
                  value={partnerCode}
                  onChange={(e) => setPartnerCode(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  placeholder="Enter partner code (e.g., abc123xyz)"
                />
              </div>
              
              <Button 
                className="w-full" 
                onClick={handleLinkPartner}
                disabled={loading || !partnerCode}
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Users className="mr-2 h-4 w-4" />}
                Link with Partner
              </Button>
              
              <div className="pt-4 pb-2">
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-full border-t border-white/20"></div>
                  <span className="relative px-2 bg-purple-800/50 text-xs text-white/60">
                    OR SHARE YOUR CODE
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Your partner code</Label>
                <div className="flex space-x-2">
                  <Input
                    readOnly
                    value={user?.partnerCode || "Loading..."}
                    className="bg-white/10 border-white/20 text-white font-mono"
                  />
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={copyToClipboard}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    {copySuccess ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-purple-200">
                  Share this code with your partner so they can link with you
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="invite" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="partnerEmail">Your partner's email</Label>
                <Input
                  id="partnerEmail"
                  type="email"
                  value={partnerEmail}
                  onChange={(e) => setPartnerEmail(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  placeholder="partner@example.com"
                />
              </div>
              
              <Button 
                className="w-full" 
                onClick={handleInvitePartner}
                disabled={loading || !partnerEmail}
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                Send Invitation
              </Button>
              
              <p className="text-sm text-purple-200 text-center mt-2">
                We'll send an email invitation with your partner code
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-2">
          <Button 
            variant="ghost" 
            className="w-full text-purple-200 hover:text-white hover:bg-white/10"
            onClick={handleSkip}
          >
            Continue without partner for now
          </Button>
          <p className="text-xs text-purple-200 text-center">
            You can always link with your partner later
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PartnerLinking;
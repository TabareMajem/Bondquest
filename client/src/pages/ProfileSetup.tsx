import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../contexts/AuthContext";

export default function ProfileSetup() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [relationshipStatus, setRelationshipStatus] = useState("Dating");
  const [anniversary, setAnniversary] = useState("");
  const [selectedLoveLanguage, setSelectedLoveLanguage] = useState<string | null>(null);
  
  const loveLanguages = [
    "Words of Affirmation",
    "Quality Time",
    "Receiving Gifts",
    "Acts of Service",
    "Physical Touch"
  ];
  
  const handleComplete = () => {
    // In a real app, this would save the profile data
    navigate("/home");
    toast({
      title: "Profile completed!",
      description: "Your profile has been set up successfully.",
    });
  };

  return (
    <div 
      className="min-h-screen w-full p-6 flex flex-col items-center justify-center text-white"
      style={{ background: "var(--gradient-primary)" }}
    >
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold font-poppins mb-3 text-center">Create Your Profile</h1>
        <p className="text-center opacity-80 mb-8">Tell us a bit about yourself and your relationship</p>
        
        <div className="bg-white bg-opacity-20 backdrop-filter backdrop-blur-sm rounded-2xl p-6 mb-6">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-white bg-opacity-30 flex items-center justify-center overflow-hidden">
                <svg className="w-12 h-12 text-white opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </div>
              <button className="absolute bottom-0 right-0 bg-yellow-400 p-2 rounded-full shadow-lg">
                <svg className="w-4 h-4 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Display Name</label>
              <Input 
                type="text" 
                value={user?.displayName || ""}
                readOnly
                className="w-full px-4 py-3 rounded-lg bg-white bg-opacity-25 border border-white border-opacity-30 text-white placeholder:text-white placeholder:opacity-60 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                placeholder="How you want to be seen"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Relationship Status</label>
              <Select value={relationshipStatus} onValueChange={setRelationshipStatus}>
                <SelectTrigger className="w-full px-4 py-3 rounded-lg bg-white bg-opacity-25 border border-white border-opacity-30 text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dating">Dating</SelectItem>
                  <SelectItem value="Engaged">Engaged</SelectItem>
                  <SelectItem value="Married">Married</SelectItem>
                  <SelectItem value="Long Distance">Long Distance</SelectItem>
                  <SelectItem value="It's Complicated">It's Complicated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Relationship Anniversary</label>
              <Input 
                type="date" 
                value={anniversary}
                onChange={(e) => setAnniversary(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white bg-opacity-25 border border-white border-opacity-30 text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Your Love Language</label>
              <div className="grid grid-cols-2 gap-2">
                {loveLanguages.map((language) => (
                  <button
                    key={language}
                    className={`${
                      selectedLoveLanguage === language
                        ? "bg-secondary-500"
                        : "bg-white bg-opacity-25 hover:bg-opacity-30"
                    } border border-white border-opacity-10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50`}
                    onClick={() => setSelectedLoveLanguage(language)}
                  >
                    {language}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <Button
          onClick={handleComplete}
          className="w-full bg-white text-primary-700 font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all"
        >
          Complete Profile
        </Button>
      </div>
    </div>
  );
}

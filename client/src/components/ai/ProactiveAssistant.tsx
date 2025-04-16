import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles, MessageCircle, ThumbsUp, ThumbsDown } from "lucide-react";

type AssistantPersona = "casanova" | "venus" | "aurora";

interface Suggestion {
  id: string;
  text: string;
  category: string;
  persona: AssistantPersona;
  timestamp: Date;
  helpful?: boolean;
}

export function ProactiveAssistant() {
  const { t } = useTranslation();
  const { user, couple } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState<Suggestion | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  // This would come from the backend in a real implementation
  const getPersonaDetails = (persona: AssistantPersona) => {
    switch(persona) {
      case "casanova":
        return {
          name: "Casanova",
          emoji: "👨‍🎤",
          description: t('assistants.casanovaDesc'),
          avatarUrl: "/avatars/casanova.jpg" 
        };
      case "venus":
        return {
          name: "Venus",
          emoji: "👩‍🚀",
          description: t('assistants.venusDesc'),
          avatarUrl: "/avatars/venus.jpg"
        };
      case "aurora":
        return {
          name: "Aurora",
          emoji: "🤖",
          description: t('assistants.auroraDesc'),
          avatarUrl: "/avatars/aurora.jpg"
        };
      default:
        return {
          name: "Casanova",
          emoji: "👨‍🎤",
          description: t('assistants.casanovaDesc'),
          avatarUrl: "/avatars/casanova.jpg"
        };
    }
  };

  // Simulate loading AI suggestions
  useEffect(() => {
    const mockSuggestions: Suggestion[] = [
      {
        id: "1",
        text: t('proactiveAI.suggestion1'),
        category: "communication",
        persona: "venus",
        timestamp: new Date()
      },
      {
        id: "2",
        text: t('proactiveAI.suggestion2'),
        category: "activity",
        persona: "casanova",
        timestamp: new Date()
      },
      {
        id: "3", 
        text: t('proactiveAI.suggestion3'),
        category: "insight",
        persona: "aurora",
        timestamp: new Date()
      }
    ];
    
    setSuggestions(mockSuggestions);
    setActiveSuggestion(mockSuggestions[0]);
  }, [t]);

  const handleFeedback = (suggestionId: string, helpful: boolean) => {
    setSuggestions(prevSuggestions => 
      prevSuggestions.map(suggestion => 
        suggestion.id === suggestionId 
          ? { ...suggestion, helpful } 
          : suggestion
      )
    );
    
    toast({
      title: helpful ? t('proactiveAI.thanksFeedback') : t('proactiveAI.improveSuggestions'),
      description: helpful ? t('proactiveAI.moreLikeThis') : t('proactiveAI.learnPreferences'),
    });
  };

  const getNextSuggestion = () => {
    const currentIndex = suggestions.findIndex(s => s.id === activeSuggestion?.id);
    const nextIndex = (currentIndex + 1) % suggestions.length;
    setActiveSuggestion(suggestions[nextIndex]);
  };

  const startChat = (persona: AssistantPersona) => {
    toast({
      title: t('proactiveAI.startingChat'),
      description: t('proactiveAI.redirectingToChat', { 
        assistant: getPersonaDetails(persona).name 
      }),
    });
    // In a real implementation, this would navigate to the chat with the specific assistant
  };

  if (!activeSuggestion) return null;

  const personaDetails = getPersonaDetails(activeSuggestion.persona);

  return (
    <Card className="relative overflow-hidden border-t-4 border-t-indigo-500">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100 rounded-full -translate-y-1/2 translate-x-1/2 opacity-20"></div>
      
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-500" />
          {t('proactiveAI.title')}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-start gap-3 mt-2">
          <Avatar className="h-9 w-9 border-2 border-primary">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {personaDetails.emoji}
            </AvatarFallback>
            <AvatarImage src={personaDetails.avatarUrl} />
          </Avatar>
          
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-sm">{personaDetails.name}</h4>
              <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                {t(`categories.${activeSuggestion.category}`)}
              </span>
            </div>
            
            <p className="text-sm mt-1">{activeSuggestion.text}</p>
            
            <div className="flex items-center gap-2 mt-3">
              <Button 
                size="sm" 
                variant="outline" 
                className="h-8"
                onClick={() => handleFeedback(activeSuggestion.id, true)}
              >
                <ThumbsUp className="h-4 w-4 mr-1" />
                {t('proactiveAI.helpful')}
              </Button>
              
              <Button 
                size="sm" 
                variant="outline" 
                className="h-8"
                onClick={() => handleFeedback(activeSuggestion.id, false)}
              >
                <ThumbsDown className="h-4 w-4 mr-1" />
                {t('proactiveAI.notHelpful')}
              </Button>
              
              <Button 
                size="sm"
                className="h-8 ml-auto"
                onClick={() => startChat(activeSuggestion.persona)}
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                {t('proactiveAI.discuss')}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-0 flex justify-between items-center">
        <span className="text-xs text-muted-foreground">
          {suggestions.length} {t('proactiveAI.suggestionsAvailable')}
        </span>
        
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={getNextSuggestion}
        >
          {t('proactiveAI.nextSuggestion')}
        </Button>
      </CardFooter>
    </Card>
  );
}
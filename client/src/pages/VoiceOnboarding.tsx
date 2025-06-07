import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Users, Sparkles, CheckCircle } from 'lucide-react';
import VoiceAgent from '@/components/voice/VoiceAgent';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';

interface OnboardingStep {
  id: string;
  title: string;
  prompt: string;
  expectedResponse: 'name' | 'relationship_status' | 'anniversary' | 'love_language' | 'goals' | 'partner_code';
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to BondQuest',
    prompt: "Welcome to BondQuest! I'm your personal relationship companion. Let's start by getting to know you better. What's your name?",
    expectedResponse: 'name'
  },
  {
    id: 'relationship_status',
    title: 'Relationship Status',
    prompt: "Nice to meet you! Tell me about your relationship status. Are you dating, engaged, married, or in another type of committed relationship?",
    expectedResponse: 'relationship_status'
  },
  {
    id: 'anniversary',
    title: 'Special Date',
    prompt: "That's wonderful! When did you two first get together? This could be your first date or wedding day - whatever feels most meaningful.",
    expectedResponse: 'anniversary'
  },
  {
    id: 'love_language',
    title: 'Love Language',
    prompt: "Perfect! How do you prefer to give and receive love? Words of affirmation, quality time, physical touch, acts of service, or receiving gifts?",
    expectedResponse: 'love_language'
  },
  {
    id: 'goals',
    title: 'Relationship Goals',
    prompt: "Great! What are you hoping to achieve with BondQuest? Better communication, more fun together, deeper intimacy, or working through challenges?",
    expectedResponse: 'goals'
  }
];

export default function VoiceOnboarding() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [partnerCode] = useState(`BOND-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);

  const currentStep = onboardingSteps[currentStepIndex];
  const progress = ((currentStepIndex + 1) / onboardingSteps.length) * 100;

  const handleVoiceResponse = async (response: string) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    
    const newResponses = {
      ...responses,
      [currentStep.expectedResponse]: response
    };
    setResponses(newResponses);

    setTimeout(() => {
      if (currentStepIndex < onboardingSteps.length - 1) {
        setCurrentStepIndex(prev => prev + 1);
      } else {
        setShowSummary(true);
      }
      setIsProcessing(false);
    }, 2000);
  };

  const completeOnboarding = () => {
    setLocation('/dashboard');
  };

  const skipToTraditional = () => {
    setLocation('/register');
  };

  if (showSummary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-pink-50 to-purple-50 p-4">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome to BondQuest!</h1>
            <p className="text-gray-600">Your voice onboarding is complete.</p>
          </motion.div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Your Profile Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(responses).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium capitalize">{key.replace('_', ' ')}:</span>
                  <span className="text-gray-700">{value}</span>
                </div>
              ))}
              
              <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
                <h3 className="font-semibold text-primary-800 mb-2">Your Partner Code</h3>
                <div className="text-2xl font-mono font-bold text-primary-600 mb-2">{partnerCode}</div>
                <p className="text-sm text-primary-700">
                  Share this code with your partner to connect your journeys!
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={completeOnboarding} className="flex-1">
              <Heart className="h-4 w-4 mr-2" />
              Start Your Journey
            </Button>
            <Button variant="outline" onClick={skipToTraditional}>
              Complete Setup Later
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-pink-50 to-purple-50 p-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="h-8 w-8 text-primary-600" />
            <h1 className="text-3xl font-bold text-gray-800">BondQuest</h1>
            <Sparkles className="h-8 w-8 text-pink-500" />
          </div>
          <p className="text-gray-600">Voice-guided relationship onboarding</p>
        </motion.div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">
              Step {currentStepIndex + 1} of {onboardingSteps.length}
            </span>
            <span className="text-sm text-gray-500">{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="mb-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-center">{currentStep.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <VoiceAgent
                  prompt={currentStep.prompt}
                  onResponse={handleVoiceResponse}
                  isActive={!isProcessing}
                  agentPersonality="friendly"
                  className="mb-4"
                />
                
                {isProcessing && (
                  <div className="text-center py-4">
                    <div className="inline-flex items-center gap-2 text-primary-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                      Processing your response...
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {Object.keys(responses).length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-sm">Your Responses So Far</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(responses).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="font-medium capitalize">{key.replace('_', ' ')}:</span>
                    <span className="text-gray-600">{value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-center">
          <p className="text-sm text-gray-500 mb-4">
            Prefer a traditional form? No problem!
          </p>
          <Button variant="outline" onClick={skipToTraditional}>
            Use Traditional Sign-up
          </Button>
        </div>
      </div>
    </div>
  );
} 
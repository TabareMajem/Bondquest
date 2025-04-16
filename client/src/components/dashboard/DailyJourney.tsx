import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar, Heart, Award, Clock, Check, ArrowRight, Zap } from "lucide-react";

interface JourneyStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  duration: string;
  completed: boolean;
  locked: boolean;
  type: "daily" | "weekly" | "milestone";
  bonusPoints: number;
}

export function DailyJourney() {
  const { t } = useTranslation();
  const { couple } = useAuth();
  const [journeyProgress, setJourneyProgress] = useState(30);
  
  // In a real implementation, this would come from the backend
  const [journeySteps, setJourneySteps] = useState<JourneyStep[]>([
    {
      id: "morning-check-in",
      title: t('journey.morningCheckIn'),
      description: t('journey.morningCheckInDesc'),
      icon: <Clock className="h-6 w-6 text-blue-500" />,
      duration: "2 min",
      completed: true,
      locked: false,
      type: "daily",
      bonusPoints: 5
    },
    {
      id: "daily-quiz",
      title: t('journey.dailyQuiz'),
      description: t('journey.dailyQuizDesc'),
      icon: <Zap className="h-6 w-6 text-yellow-500" />,
      duration: "5 min",
      completed: false,
      locked: false,
      type: "daily",
      bonusPoints: 10
    },
    {
      id: "appreciation-moment",
      title: t('journey.appreciationMoment'),
      description: t('journey.appreciationMomentDesc'),
      icon: <Heart className="h-6 w-6 text-pink-500" />,
      duration: "2 min",
      completed: false,
      locked: false,
      type: "daily",
      bonusPoints: 5
    },
    {
      id: "weekly-date-plan",
      title: t('journey.weeklyDatePlan'),
      description: t('journey.weeklyDatePlanDesc'),
      icon: <Calendar className="h-6 w-6 text-indigo-500" />,
      duration: "10 min",
      completed: false,
      locked: true,
      type: "weekly",
      bonusPoints: 20
    },
    {
      id: "relationship-milestone",
      title: t('journey.relationshipMilestone'),
      description: t('journey.relationshipMilestoneDesc'),
      icon: <Award className="h-6 w-6 text-purple-500" />,
      duration: "15 min",
      completed: false,
      locked: true,
      type: "milestone",
      bonusPoints: 50
    }
  ]);

  const handleCompleteStep = (id: string) => {
    setJourneySteps(steps => steps.map(step => 
      step.id === id ? { ...step, completed: true } : step
    ));
    
    // Increase progress
    setJourneyProgress(prev => Math.min(prev + 15, 100));
  };

  return (
    <div className="flex flex-col space-y-4">
      <Card className="border-t-4 border-t-primary">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-bold flex items-center justify-between">
            <span>{t('journey.dailyTitle')}</span>
            <span className="text-sm font-normal text-muted-foreground">{journeyProgress}% {t('journey.complete')}</span>
          </CardTitle>
          <Progress value={journeyProgress} className="h-2" />
        </CardHeader>
        <CardContent className="pb-2">
          <p className="text-sm text-muted-foreground mb-4">
            {t('journey.dailyMessage')}
          </p>
          
          <div className="space-y-3">
            {journeySteps.map(step => (
              <div key={step.id} 
                className={`border rounded-lg p-3 transition-all ${
                  step.locked ? 'opacity-50' : 'hover:border-primary' 
                } ${step.completed ? 'bg-primary/5 border-primary/30' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${step.completed ? 'bg-primary/20' : 'bg-muted'}`}>
                    {step.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <h4 className="font-medium">{step.title}</h4>
                        {step.type === "weekly" && (
                          <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                            {t('journey.weekly')}
                          </span>
                        )}
                        {step.type === "milestone" && (
                          <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                            {t('journey.milestone')}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{step.duration}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 truncate">{step.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-xs text-muted-foreground flex items-center">
                        <Zap className="h-3 w-3 mr-1 text-yellow-500" />
                        +{step.bonusPoints} {t('journey.points')}
                      </div>
                      
                      {step.completed ? (
                        <span className="inline-flex items-center text-xs font-medium text-green-600">
                          <Check className="h-3 w-3 mr-1" />
                          {t('journey.completed')}
                        </span>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-xs h-7 px-2"
                          disabled={step.locked}
                          onClick={() => handleCompleteStep(step.id)}
                        >
                          {step.locked ? t('journey.locked') : t('journey.startActivity')}
                          {!step.locked && <ArrowRight className="h-3 w-3 ml-1" />}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          <div className="w-full flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              {t('journey.streakMessage', { days: 7 })}
            </span>
            <Button size="sm" variant="outline">
              {t('journey.viewAll')}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
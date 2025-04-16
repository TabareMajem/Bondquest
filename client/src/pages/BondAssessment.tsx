import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { bondDimensions } from '@shared/bondDimensions';
import BondDimensionsChart from '@/components/bond/BondDimensionsChart';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight, BrainCircuit } from 'lucide-react';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { InsertBondAssessment } from '@shared/schema';
import BottomNavigation from '@/components/layout/BottomNavigation';

const BondAssessment: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [currentDimension, setCurrentDimension] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [step, setStep] = useState<'intro' | 'assessment' | 'results'>('intro');
  
  // Get couple info
  const { data: coupleData, isLoading: isLoadingCouple } = useQuery<{coupleId: number}>({
    queryKey: ['/api/couple/current'],
    retry: false,
  });

  // Get previous assessments
  const { data: assessments, isLoading: isLoadingAssessments } = useQuery<any[]>({
    queryKey: ['/api/bond/assessments'],
    enabled: !!coupleData?.coupleId,
  });

  // Get bond questions for current dimension
  const { data: questions, isLoading: isLoadingQuestions } = useQuery<any[]>({
    queryKey: ['/api/bond/questions', currentDimension],
    enabled: !!currentDimension,
  });

  // Get latest insights
  const { data: insights, isLoading: isLoadingInsights } = useQuery<any[]>({
    queryKey: ['/api/bond/insights'],
    enabled: step === 'results',
  });

  // Submit assessment score mutation
  const submitScoreMutation = useMutation({
    mutationFn: async (assessment: InsertBondAssessment) => {
      return apiRequest('/api/bond/assessments', 'POST', assessment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bond/assessments'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to save your assessment. Please try again.',
        variant: 'destructive',
      });
      console.error(error);
    },
  });

  // Load previous scores if available
  React.useEffect(() => {
    if (assessments && assessments.length > 0) {
      // Group by dimensionId and get the latest for each
      const latestScores = assessments.reduce((acc: Record<string, number>, assessment: any) => {
        if (!acc[assessment.dimensionId] || new Date(assessment.answeredAt) > new Date(acc[assessment.answeredAt])) {
          acc[assessment.dimensionId] = assessment.score;
        }
        return acc;
      }, {});
      
      setScores(latestScores);
    }
  }, [assessments]);

  // Handle dimension selection
  const handleDimensionClick = (dimensionId: string) => {
    setCurrentDimension(dimensionId);
    if (step === 'intro') {
      setStep('assessment');
    }
  };

  // Handle score submission
  const handleScoreSubmit = (score: number) => {
    if (!currentDimension || !coupleData?.coupleId) return;
    
    const newScores = { ...scores, [currentDimension]: score };
    setScores(newScores);
    
    // Submit to API
    submitScoreMutation.mutate({
      coupleId: coupleData.coupleId,
      dimensionId: currentDimension,
      score,
      user1Score: score, // This assumes current user is user1, would need proper user determination
      user2Score: null, // Partner hasn't scored yet
    });
    
    // Find next dimension or go to results
    const dimensionIds = bondDimensions.map(d => d.id);
    const currentIndex = dimensionIds.indexOf(currentDimension);
    
    if (currentIndex < dimensionIds.length - 1) {
      setCurrentDimension(dimensionIds[currentIndex + 1]);
    } else {
      setStep('results');
      setCurrentDimension(null);
    }
  };

  // Start over from beginning
  const handleStartOver = () => {
    setStep('intro');
    setCurrentDimension(null);
  };

  if (isLoadingCouple) {
    return (
      <div className="h-screen flex flex-col items-center justify-center pb-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-gray-500">{t('Loading your couple data...')}</p>
        
        <div className="fixed bottom-0 left-0 right-0">
          <BottomNavigation activeTab="bond" />
        </div>
      </div>
    );
  }

  if (!coupleData?.coupleId) {
    return (
      <div className="max-w-3xl mx-auto my-8 pb-20">
        <Card>
          <CardHeader>
            <CardTitle>{t('Bond Assessment')}</CardTitle>
            <CardDescription>
              {t('You need to be in a couple to assess your relationship bond.')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>{t('Please link with a partner before using this feature.')}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => window.location.href = '/profile'}>
              {t('Go to Profile')}
            </Button>
          </CardFooter>
        </Card>
        
        <BottomNavigation activeTab="bond" />
      </div>
    );
  }

  // Intro view
  if (step === 'intro') {
    return (
      <div className="container mx-auto py-8 max-w-5xl pb-20">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">{t('Relationship Bond Assessment')}</CardTitle>
            <CardDescription>
              {t('Discover the strengths and growth areas in your relationship through our comprehensive bond assessment.')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              {t('This assessment measures the ten core dimensions of a healthy relationship bond. By evaluating each dimension, you\'ll gain insights into your relationship\'s unique strengths and opportunities.')}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                <h3 className="font-medium text-purple-800 mb-2">{t('How it works:')}</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>{t('Assess each dimension on a scale of 1-10')}</li>
                  <li>{t('See your results displayed on a radar chart')}</li>
                  <li>{t('Get personalized insights to strengthen your bond')}</li>
                  <li>{t('Track your progress over time')}</li>
                </ul>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <h3 className="font-medium text-blue-800 mb-2">{t('Benefits:')}</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>{t('Identify relationship strengths to celebrate')}</li>
                  <li>{t('Discover growth opportunities')}</li> 
                  <li>{t('Improve communication and understanding')}</li>
                  <li>{t('Build a stronger, more resilient bond')}</li>
                </ul>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              onClick={() => handleDimensionClick(bondDimensions[0].id)}
              className="gap-2"
            >
              {t('Start Assessment')}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>

        {!isLoadingAssessments && Object.keys(scores).length > 0 && (
          <BondDimensionsChart 
            scores={scores} 
            title={t('Your Previous Assessment')}
            description={t('Click on any dimension to reassess it')}
            onDimensionClick={handleDimensionClick}
          />
        )}
        
        <BottomNavigation activeTab="bond" />
      </div>
    );
  }

  // Assessment view
  if (step === 'assessment') {
    const dimension = bondDimensions.find(d => d.id === currentDimension);
    
    if (!dimension) {
      return (
        <div className="container mx-auto py-8 max-w-3xl pb-20">
          <Card className="border-red-500 border mb-4">
            <CardHeader className="bg-red-50 text-red-800">
              <CardTitle>{t('Error')}</CardTitle>
              <CardDescription className="text-red-700">
                {t('Dimension not found. Please return to the main page.')}
              </CardDescription>
            </CardHeader>
          </Card>
          <div className="mt-4">
            <Button onClick={handleStartOver}>
              {t('Back to Overview')}
            </Button>
          </div>
          
          <BottomNavigation activeTab="bond" />
        </div>
      );
    }

    return (
      <div className="container mx-auto py-8 max-w-3xl pb-20">
        <Card>
          <CardHeader style={{ backgroundColor: `${dimension.color}15` }}>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: dimension.color }}>
                {dimension.icon && (
                  <span className="text-white">{React.createElement(
                    require('lucide-react')[dimension.icon] || BrainCircuit,
                    { size: 20 }
                  )}</span>
                )}
              </div>
              <div>
                <CardTitle>{dimension.name}</CardTitle>
                <CardDescription className="mt-1">{dimension.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="mb-6">{t('Rate this dimension of your relationship on a scale of 1-10:')}</p>
            
            <div className="flex flex-wrap gap-2 justify-center my-8">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                <Button
                  key={score}
                  variant={scores[currentDimension] === score ? "default" : "outline"}
                  className="h-12 w-12 rounded-full"
                  onClick={() => handleScoreSubmit(score)}
                >
                  {score}
                </Button>
              ))}
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg mt-4">
              <h3 className="font-medium mb-2">{t('Example questions to consider:')}</h3>
              <ul className="list-disc pl-5 space-y-2">
                {dimension.exampleQuestions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleStartOver}>
              {t('Back to Overview')}
            </Button>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              {t('Dimension')} {bondDimensions.findIndex(d => d.id === currentDimension) + 1} / {bondDimensions.length}
            </div>
          </CardFooter>
        </Card>
        
        <BottomNavigation activeTab="bond" />
      </div>
    );
  }

  // Results view
  return (
    <div className="container mx-auto py-8 max-w-5xl pb-20">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{t('Your Bond Assessment Results')}</CardTitle>
          <CardDescription>
            {t('Here\'s a snapshot of your relationship bond across key dimensions')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BondDimensionsChart
            scores={scores}
            onDimensionClick={handleDimensionClick}
          />
        </CardContent>
        <CardFooter>
          <Button onClick={handleStartOver}>
            {t('Start New Assessment')}
          </Button>
        </CardFooter>
      </Card>

      {/* Insights Section */}
      {!isLoadingInsights && insights && insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('AI-Generated Insights')}</CardTitle>
            <CardDescription>
              {t('Based on your assessment, we\'ve generated personalized insights to strengthen your bond')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.map((insight: any) => {
                const dimension = bondDimensions.find(d => d.id === insight.dimensionId);
                return (
                  <Card key={insight.id} className="border-l-4" style={{ borderLeftColor: dimension?.color || '#8a2be2' }}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{insight.title}</CardTitle>
                      <CardDescription>{dimension?.name || ''}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4">{insight.content}</p>
                      {insight.actionItems && insight.actionItems.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">{t('Action Items:')}</h4>
                          <ul className="list-disc pl-5 space-y-1">
                            {insight.actionItems.map((item: string, i: number) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
      
      <BottomNavigation activeTab="bond" />
    </div>
  );
};

export default BondAssessment;
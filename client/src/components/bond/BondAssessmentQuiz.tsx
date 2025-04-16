import React, { useState } from 'react';
import { bondDimensions, BondDimension } from '@shared/bondDimensions';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ChevronLeft, ChevronRight, Brain, Crown } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';

export interface QuizQuestion {
  id: string;
  dimensionId: string;
  text: string;
  options: {
    value: number;
    label: string;
  }[];
}

export interface BondAssessmentQuizProps {
  className?: string;
  questions: QuizQuestion[];
  onComplete: (scores: Record<string, number>) => void;
  onCancel?: () => void;
  showAIPrompt?: boolean;
}

// Default sample questions if none are provided
const generateSampleQuestions = (): QuizQuestion[] => {
  const sampleQuestions: QuizQuestion[] = [];
  
  bondDimensions.forEach(dimension => {
    // Create 2 questions per dimension
    dimension.exampleQuestions.forEach((questionText, idx) => {
      if (idx > 1) return; // Limit to 2 questions per dimension
      
      sampleQuestions.push({
        id: `${dimension.id}-q${idx}`,
        dimensionId: dimension.id,
        text: questionText,
        options: [
          { value: 1, label: "Strongly Disagree" },
          { value: 3, label: "Somewhat Disagree" },
          { value: 5, label: "Neutral" },
          { value: 7, label: "Somewhat Agree" },
          { value: 10, label: "Strongly Agree" }
        ]
      });
    });
  });
  
  return sampleQuestions;
};

const BondAssessmentQuiz: React.FC<BondAssessmentQuizProps> = ({
  className = '',
  questions = generateSampleQuestions(),
  onComplete,
  onCancel,
  showAIPrompt = true
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [generating, setGenerating] = useState(false);
  
  const currentQuestion = questions[currentQuestionIndex];
  const questionCount = questions.length;
  const progress = ((currentQuestionIndex + 1) / questionCount) * 100;
  
  // Get the current dimension
  const currentDimension = bondDimensions.find(
    d => d.id === currentQuestion?.dimensionId
  );
  
  const handleNextQuestion = () => {
    if (!answers[currentQuestion.id]) {
      toast({
        title: "Please select an answer",
        description: "You need to select an option before continuing.",
        variant: "destructive"
      });
      return;
    }
    
    if (currentQuestionIndex < questionCount - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Calculate dimension scores
      const dimensionScores: Record<string, number[]> = {};
      
      // Group answers by dimension
      questions.forEach(question => {
        const answer = answers[question.id];
        if (answer) {
          if (!dimensionScores[question.dimensionId]) {
            dimensionScores[question.dimensionId] = [];
          }
          dimensionScores[question.dimensionId].push(answer);
        }
      });
      
      // Calculate average score for each dimension
      const finalScores: Record<string, number> = {};
      Object.entries(dimensionScores).forEach(([dimensionId, scores]) => {
        const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        finalScores[dimensionId] = Math.round(average);
      });
      
      onComplete(finalScores);
    }
  };
  
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };
  
  const handleAnswerChange = (value: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: parseInt(value)
    }));
  };
  
  const handleGenerateWithAI = () => {
    setGenerating(true);
    // In a real implementation, this would make an API call to generate more personalized questions
    setTimeout(() => {
      toast({
        title: "AI-optimized questions generated",
        description: "We've tailored these questions based on your relationship context.",
      });
      setGenerating(false);
    }, 1500);
  };
  
  if (!currentQuestion) {
    return null;
  }
  
  return (
    <Card className={className}>
      <CardHeader className="space-y-1">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">{t('Bond Assessment')}</CardTitle>
          <div className="text-sm text-gray-500">
            {currentQuestionIndex + 1} / {questionCount}
          </div>
        </div>
        <Progress value={progress} className="h-2" />
        <CardDescription>
          {currentDimension && (
            <div className="flex items-center gap-2 mt-1 text-sm">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: currentDimension.color }}></span>
              {currentDimension.name}
            </div>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          <div className="text-lg font-medium">
            {currentQuestion.text}
          </div>
          
          <RadioGroup 
            value={answers[currentQuestion.id]?.toString() || ""} 
            onValueChange={handleAnswerChange}
            className="space-y-3"
          >
            {currentQuestion.options.map((option) => (
              <div 
                key={option.value} 
                className="flex items-center space-x-2 rounded-md border p-3 hover:bg-slate-50"
              >
                <RadioGroupItem value={option.value.toString()} id={`option-${option.value}`} />
                <Label htmlFor={`option-${option.value}`} className="flex-grow">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
        
        {showAIPrompt && currentQuestionIndex === 0 && (
          <div className="mt-6 p-4 border border-purple-200 bg-purple-50 rounded-md">
            <div className="flex items-start gap-3">
              <Brain className="h-6 w-6 text-purple-600 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-purple-800 mb-1">
                  {t('Want more personalized questions?')}
                </h4>
                <p className="text-sm text-purple-700 mb-2">
                  {t('Our AI can generate questions tailored to your specific relationship context.')}
                </p>
                <Button 
                  variant="outline" 
                  className="border-purple-300" 
                  size="sm" 
                  onClick={handleGenerateWithAI}
                  disabled={generating}
                >
                  <Crown className="mr-2 h-4 w-4" />
                  {generating ? t('Optimizing...') : t('Optimize with AI')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between border-t p-4">
        <Button
          variant="outline"
          onClick={currentQuestionIndex === 0 ? onCancel : handlePreviousQuestion}
        >
          {currentQuestionIndex === 0 ? t('Cancel') : (
            <>
              <ChevronLeft className="mr-1 h-4 w-4" /> 
              {t('Previous')}
            </>
          )}
        </Button>
        
        <Button onClick={handleNextQuestion}>
          {currentQuestionIndex === questionCount - 1 ? t('Complete') : (
            <>
              {t('Next')} 
              <ChevronRight className="ml-1 h-4 w-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BondAssessmentQuiz;
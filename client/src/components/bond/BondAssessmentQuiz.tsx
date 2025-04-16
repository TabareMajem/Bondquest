import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { BOND_DIMENSIONS } from '@shared/bondDimensions';
import { BondQuestion } from '@shared/schema';
import { get, post } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  ArrowLeft, 
  ArrowRight, 
  Send, 
  CheckCircle2, 
  Sparkles, 
  Loader2, 
  Brain
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Component to display a bond assessment quiz
export function BondAssessmentQuiz() {
  const { t } = useTranslation();
  const { couple, user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [currentDimensionIndex, setCurrentDimensionIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const coupleId = couple?.id || 0;

  // Fetch questions for each bond dimension
  const { data: questions, isLoading } = useQuery<BondQuestion[]>({
    queryKey: [`/api/bond-questions`],
    queryFn: () => get(`/api/bond-questions`),
  });

  // Group questions by dimension
  const questionsByDimension = questions
    ? BOND_DIMENSIONS.map(dimension => {
        return {
          dimension,
          questions: questions.filter(q => q.dimensionId === dimension.id)
        };
      })
    : [];

  // Current dimension and its questions
  const currentDimension = questionsByDimension[currentDimensionIndex]?.dimension;
  const currentQuestions = questionsByDimension[currentDimensionIndex]?.questions || [];

  // Create form schema based on current questions
  const createFormSchema = () => {
    if (!currentQuestions.length) return z.object({});

    const schemaFields: Record<string, any> = {};
    
    currentQuestions.forEach(question => {
      if (question.type === 'likert') {
        schemaFields[`question_${question.id}`] = z.number().min(1).max(10);
      } else if (question.type === 'multiple_choice') {
        schemaFields[`question_${question.id}`] = z.string().min(1);
      } else if (question.type === 'text') {
        schemaFields[`question_${question.id}`] = z.string().optional();
      }
    });

    return z.object(schemaFields);
  };

  const formSchema = createFormSchema();
  
  // Initialize form with default values
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });

  // Reset form when dimension changes
  useEffect(() => {
    if (currentQuestions.length) {
      const defaultValues: Record<string, any> = {};
      
      currentQuestions.forEach(question => {
        if (question.type === 'likert') {
          defaultValues[`question_${question.id}`] = 5; // Middle value as default
        } else if (question.type === 'multiple_choice') {
          defaultValues[`question_${question.id}`] = '';
        } else if (question.type === 'text') {
          defaultValues[`question_${question.id}`] = '';
        }
      });
      
      form.reset(defaultValues);
    }
  }, [currentDimensionIndex, currentQuestions]);

  // Mutation to submit assessment scores
  const mutation = useMutation({
    mutationFn: (data: any) => {
      return post(`/api/couples/${coupleId}/bond-assessments`, {
        dimensionId: currentDimension?.id || '',
        score: calculateOverallScore(data),
        userScore: user?.id === couple?.userId1 ? calculateOverallScore(data) : undefined,
        partnerScore: user?.id === couple?.userId2 ? calculateOverallScore(data) : undefined,
      });
    },
    onSuccess: () => {
      // Invalidate and refetch bond assessments
      queryClient.invalidateQueries({ queryKey: [`/api/couples/${coupleId}/bond-assessments`] });
      
      // Move to next dimension or complete quiz
      if (currentDimensionIndex < questionsByDimension.length - 1) {
        setCurrentDimensionIndex(prev => prev + 1);
      } else {
        setIsCompleted(true);
      }
    },
  });

  // Calculate overall score from answers
  const calculateOverallScore = (data: any): number => {
    if (!currentQuestions.length) return 0;
    
    let totalScore = 0;
    let totalWeight = 0;
    
    currentQuestions.forEach(question => {
      const value = data[`question_${question.id}`];
      if (question.type === 'likert' && typeof value === 'number') {
        totalScore += value * (question.weight || 1);
        totalWeight += (question.weight || 1);
      } else if (question.type === 'multiple_choice' && question.options) {
        // Calculate score based on selected option index
        const optionIndex = question.options.indexOf(value);
        if (optionIndex >= 0) {
          const normalizedScore = ((optionIndex + 1) / question.options.length) * 10;
          totalScore += normalizedScore * (question.weight || 1);
          totalWeight += (question.weight || 1);
        }
      }
    });
    
    return Math.round(totalWeight > 0 ? totalScore / totalWeight : 0);
  };

  // Form submission handler
  const onSubmit = (data: z.infer<typeof formSchema>) => {
    mutation.mutate(data);
  };

  // Navigate to previous dimension
  const handlePrevious = () => {
    if (currentDimensionIndex > 0) {
      setCurrentDimensionIndex(prev => prev - 1);
    }
  };

  // If no couple exists, show a message to connect with partner
  if (coupleId === 0) {
    return (
      <Card className="p-6 text-center">
        <h3 className="text-lg font-medium mb-2">{t('bond.assessmentNotAvailable')}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {t('bond.connectToAssess')}
        </p>
        <Button variant="outline" size="sm">
          {t('bond.findPartner')}
        </Button>
      </Card>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <Card className="p-6 text-center">
        <h3 className="text-lg font-medium mb-2">{t('bond.loadingAssessment')}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {t('bond.preparingQuestions')}
        </p>
        <Progress value={33} className="w-full mt-4" />
      </Card>
    );
  }

  // No questions available
  if (!questions || questions.length === 0) {
    return (
      <Card className="p-6 text-center">
        <h3 className="text-lg font-medium mb-2">{t('bond.noQuestionsAvailable')}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {t('bond.tryAgainLater')}
        </p>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          {t('common.retry')}
        </Button>
      </Card>
    );
  }

  // Quiz completed successfully
  if (isCompleted) {
    return (
      <Card className="p-6 text-center">
        <div className="flex flex-col items-center justify-center mb-4">
          <CheckCircle2 className="h-12 w-12 text-primary mb-2" />
          <h3 className="text-lg font-medium">{t('bond.assessmentCompleted')}</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          {t('bond.thankYouMessage')}
        </p>
        <div className="flex justify-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => {
              setIsCompleted(false);
              setCurrentDimensionIndex(0);
            }}
          >
            {t('bond.takeAgain')}
          </Button>
          <Button onClick={() => window.location.href = '/insights'}>
            {t('bond.viewInsights')}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="p-4 md:p-6">
        {/* Header */}
        <div className="mb-6">
          <div 
            className="rounded-full w-12 h-12 flex items-center justify-center mb-3"
            style={{ backgroundColor: currentDimension?.color || '#6366F1' }}
          >
            <span className="text-white font-medium">
              {currentDimensionIndex + 1}/{questionsByDimension.length}
            </span>
          </div>
          <h2 className="text-xl font-bold mb-1">{currentDimension?.name}</h2>
          <p className="text-muted-foreground">
            {currentDimension?.description}
          </p>
        </div>
        
        {/* Progress bar */}
        <Progress 
          value={(currentDimensionIndex / questionsByDimension.length) * 100} 
          className="mb-6" 
        />
        
        {/* Question form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {currentQuestions.map((question, index) => (
              <div key={index} className="p-4 bg-muted/20 rounded-lg">
                {question.type === 'likert' && (
                  <FormField
                    control={form.control}
                    name={`question_${question.id}`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">{question.text}</FormLabel>
                        <FormControl>
                          <div className="mt-2">
                            <Slider
                              defaultValue={[field.value]}
                              min={1}
                              max={10}
                              step={1}
                              onValueChange={(value) => field.onChange(value[0])}
                            />
                            <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                              <span>{t('bond.disagree')}</span>
                              <span>{t('bond.neutral')}</span>
                              <span>{t('bond.agree')}</span>
                            </div>
                            <div className="text-center mt-2">
                              <span className="text-sm font-medium">{field.value}/10</span>
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                {question.type === 'multiple_choice' && question.options && (
                  <FormField
                    control={form.control}
                    name={`question_${question.id}`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">{question.text}</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="mt-2 space-y-1"
                          >
                            {question.options.map((option, optIndex) => (
                              <div key={optIndex} className="flex items-center space-x-2">
                                <RadioGroupItem value={option} id={`option-${question.id}-${optIndex}`} />
                                <FormLabel htmlFor={`option-${question.id}-${optIndex}`} className="font-normal cursor-pointer">
                                  {option}
                                </FormLabel>
                              </div>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                {question.type === 'text' && (
                  <FormField
                    control={form.control}
                    name={`question_${question.id}`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">{question.text}</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            className="mt-2"
                            placeholder={t('bond.shareYourThoughts')}
                          />
                        </FormControl>
                        <FormDescription>
                          {t('bond.optionalResponse')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            ))}
            
            {/* Navigation buttons */}
            <div className="flex justify-between pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={currentDimensionIndex === 0 || mutation.isPending}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('bond.previous')}
              </Button>
              
              <Button 
                type="submit" 
                disabled={mutation.isPending}
              >
                {currentDimensionIndex < questionsByDimension.length - 1 ? (
                  <>
                    {t('bond.next')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  <>
                    {t('bond.complete')}
                    <Send className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </Card>
  );
}
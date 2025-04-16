import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Wand2, 
  Loader2, 
  SaveAll, 
  ListChecks, 
  Trophy, 
  AlertCircle 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/apiClient";

// Define the form schema for quiz generation
const quizGenerationSchema = z.object({
  topic: z.string().min(3, {
    message: "Topic must be at least 3 characters.",
  }),
  category: z.string().min(1, {
    message: "Please select a category.",
  }),
  difficulty: z.string().min(1, {
    message: "Please select a difficulty level.",
  }),
  questionCount: z.coerce.number().min(3).max(15),
  additionalInstructions: z.string().optional(),
});

// Define the form schema for competition generation
const competitionGenerationSchema = z.object({
  name: z.string().min(3, {
    message: "Competition name must be at least 3 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  startDate: z.string().min(1, {
    message: "Please select a start date.",
  }),
  endDate: z.string().min(1, {
    message: "Please select an end date.",
  }),
  difficulty: z.string().min(1, {
    message: "Please select a difficulty level.",
  }),
  type: z.string().min(1, {
    message: "Please select a competition type.",
  }),
  additionalInstructions: z.string().optional(),
});

// Main component
export default function AdminAIWizard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("quizzes");
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [isGeneratingCompetition, setIsGeneratingCompetition] = useState(false);
  const [generatedQuiz, setGeneratedQuiz] = useState<any>(null);
  const [generatedCompetition, setGeneratedCompetition] = useState<any>(null);
  const [isSavingQuiz, setIsSavingQuiz] = useState(false);
  const [isSavingCompetition, setIsSavingCompetition] = useState(false);

  // Quiz generation form
  const quizForm = useForm<z.infer<typeof quizGenerationSchema>>({
    resolver: zodResolver(quizGenerationSchema),
    defaultValues: {
      topic: "",
      category: "",
      difficulty: "medium",
      questionCount: 5,
      additionalInstructions: "",
    },
  });

  // Competition generation form
  const competitionForm = useForm<z.infer<typeof competitionGenerationSchema>>({
    resolver: zodResolver(competitionGenerationSchema),
    defaultValues: {
      name: "",
      description: "",
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      difficulty: "medium",
      type: "quiz",
      additionalInstructions: "",
    },
  });

  // Handle quiz generation
  const onQuizGenerateSubmit = async (values: z.infer<typeof quizGenerationSchema>) => {
    setIsGeneratingQuiz(true);
    setGeneratedQuiz(null);
    
    try {
      const response = await apiRequest(
        "POST", 
        "/api/admin/ai/generate-quiz", 
        values
      );
      
      setGeneratedQuiz(response);
      toast({
        title: "Quiz Generated",
        description: "AI has successfully generated a new quiz.",
      });
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate quiz. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  // Handle competition generation
  const onCompetitionGenerateSubmit = async (values: z.infer<typeof competitionGenerationSchema>) => {
    setIsGeneratingCompetition(true);
    setGeneratedCompetition(null);
    
    try {
      const response = await apiRequest(
        "POST", 
        "/api/admin/ai/generate-competition", 
        values
      );
      
      setGeneratedCompetition(response);
      toast({
        title: "Competition Generated",
        description: "AI has successfully generated a new competition.",
      });
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate competition. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingCompetition(false);
    }
  };

  // Save the generated quiz to the database
  const saveQuizToDatabase = async () => {
    if (!generatedQuiz) return;
    
    setIsSavingQuiz(true);
    try {
      await apiRequest("POST", "/api/admin/quizzes", generatedQuiz);
      
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quizzes"] });
      
      toast({
        title: "Quiz Saved",
        description: "The generated quiz has been saved to the database.",
      });
      
      // Reset the form and generated quiz
      quizForm.reset();
      setGeneratedQuiz(null);
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save quiz. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingQuiz(false);
    }
  };

  // Save the generated competition to the database
  const saveCompetitionToDatabase = async () => {
    if (!generatedCompetition) return;
    
    setIsSavingCompetition(true);
    try {
      await apiRequest("POST", "/api/admin/competitions", generatedCompetition);
      
      queryClient.invalidateQueries({ queryKey: ["/api/competitions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/competitions"] });
      
      toast({
        title: "Competition Saved",
        description: "The generated competition has been saved to the database.",
      });
      
      // Reset the form and generated competition
      competitionForm.reset();
      setGeneratedCompetition(null);
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save competition. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingCompetition(false);
    }
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col">
        <h1 className="text-3xl font-bold tracking-tight">AI Content Wizard</h1>
        <p className="text-muted-foreground">
          Use AI to generate quizzes and competitions for your users.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="quizzes" className="flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            <span>Generate Quizzes</span>
          </TabsTrigger>
          <TabsTrigger value="competitions" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            <span>Generate Competitions</span>
          </TabsTrigger>
        </TabsList>

        {/* Quiz Generation Tab */}
        <TabsContent value="quizzes" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Quiz Generation Form */}
            <Card className="bg-white bg-opacity-10 backdrop-blur-sm border-purple-800/30">
              <CardHeader>
                <CardTitle>Generate Quiz</CardTitle>
                <CardDescription>
                  Fill in the details for your quiz, and the AI will generate it for you.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...quizForm}>
                  <form
                    onSubmit={quizForm.handleSubmit(onQuizGenerateSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={quizForm.control}
                      name="topic"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Topic</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Communication Habits" {...field} />
                          </FormControl>
                          <FormDescription>
                            The main topic or focus of the quiz
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={quizForm.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="communication">Communication</SelectItem>
                              <SelectItem value="intimacy">Intimacy</SelectItem>
                              <SelectItem value="compatibility">Compatibility</SelectItem>
                              <SelectItem value="history">Relationship History</SelectItem>
                              <SelectItem value="preferences">Personal Preferences</SelectItem>
                              <SelectItem value="future">Future Plans</SelectItem>
                              <SelectItem value="values">Core Values</SelectItem>
                              <SelectItem value="humor">Humor & Fun</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            The category the quiz belongs to
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={quizForm.control}
                        name="difficulty"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Difficulty</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select difficulty" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="easy">Easy</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="hard">Hard</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={quizForm.control}
                        name="questionCount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Question Count</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={3}
                                max={15}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={quizForm.control}
                      name="additionalInstructions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Instructions (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Any specific requirements or themes..."
                              className="min-h-24"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Special instructions for the AI to consider
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isGeneratingQuiz}
                    >
                      {isGeneratingQuiz ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Wand2 className="mr-2 h-4 w-4" />
                          Generate Quiz
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Quiz Preview */}
            <Card className="bg-white bg-opacity-10 backdrop-blur-sm border-purple-800/30">
              <CardHeader>
                <CardTitle>Quiz Preview</CardTitle>
                <CardDescription>
                  Preview the AI-generated quiz before saving it.
                </CardDescription>
              </CardHeader>
              <CardContent className="min-h-[400px]">
                {isGeneratingQuiz ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin mb-4" />
                    <p>Generating your quiz with AI...</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      This may take a few moments.
                    </p>
                  </div>
                ) : generatedQuiz ? (
                  <div className="space-y-4">
                    <div className="border-b pb-4">
                      <h3 className="text-xl font-semibold">{generatedQuiz.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {generatedQuiz.description}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded">
                          {generatedQuiz.category}
                        </span>
                        <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded">
                          {generatedQuiz.difficulty}
                        </span>
                        <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded">
                          {generatedQuiz.questions?.length} Questions
                        </span>
                      </div>
                    </div>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                      {generatedQuiz.questions?.map((question: any, index: number) => (
                        <div key={index} className="border border-border rounded-lg p-4">
                          <h4 className="font-medium mb-2">
                            {index + 1}. {question.text}
                          </h4>
                          <ul className="space-y-1 text-sm">
                            {question.options?.map((option: string, optIdx: number) => (
                              <li key={optIdx} className="pl-2 border-l-2 border-primary/50">
                                {option}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Wand2 className="h-12 w-12 mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium">No Quiz Generated Yet</h3>
                    <p className="text-sm text-muted-foreground mt-2 max-w-xs">
                      Fill out the form and click "Generate Quiz" to create a new quiz with AI.
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  onClick={saveQuizToDatabase}
                  className="w-full"
                  disabled={!generatedQuiz || isSavingQuiz}
                  variant="default"
                >
                  {isSavingQuiz ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <SaveAll className="mr-2 h-4 w-4" />
                      Save Quiz to Database
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Note</AlertTitle>
            <AlertDescription>
              The AI will generate quiz content based on your inputs. You can review and edit before saving to the database.
            </AlertDescription>
          </Alert>
        </TabsContent>

        {/* Competition Generation Tab */}
        <TabsContent value="competitions" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Competition Generation Form */}
            <Card className="bg-white bg-opacity-10 backdrop-blur-sm border-purple-800/30">
              <CardHeader>
                <CardTitle>Generate Competition</CardTitle>
                <CardDescription>
                  Fill in the details for your competition, and the AI will generate it for you.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...competitionForm}>
                  <form
                    onSubmit={competitionForm.handleSubmit(onCompetitionGenerateSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={competitionForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Competition Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Summer Romance Challenge" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={competitionForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe what the competition is about..."
                              className="min-h-20"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={competitionForm.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={competitionForm.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>End Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={competitionForm.control}
                        name="difficulty"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Difficulty</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select difficulty" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="easy">Easy</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="hard">Hard</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={competitionForm.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Competition Type</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="quiz">Quiz Competition</SelectItem>
                                <SelectItem value="challenge">Daily Challenge</SelectItem>
                                <SelectItem value="milestone">Relationship Milestone</SelectItem>
                                <SelectItem value="activity">Activity Completion</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={competitionForm.control}
                      name="additionalInstructions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Instructions (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Any specific themes or requirements..."
                              className="min-h-24"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Special instructions for the AI to consider
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isGeneratingCompetition}
                    >
                      {isGeneratingCompetition ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Wand2 className="mr-2 h-4 w-4" />
                          Generate Competition
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Competition Preview */}
            <Card className="bg-white bg-opacity-10 backdrop-blur-sm border-purple-800/30">
              <CardHeader>
                <CardTitle>Competition Preview</CardTitle>
                <CardDescription>
                  Preview the AI-generated competition before saving it.
                </CardDescription>
              </CardHeader>
              <CardContent className="min-h-[400px]">
                {isGeneratingCompetition ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin mb-4" />
                    <p>Generating your competition with AI...</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      This may take a few moments.
                    </p>
                  </div>
                ) : generatedCompetition ? (
                  <div className="space-y-4">
                    <div className="border-b pb-4">
                      <h3 className="text-xl font-semibold">{generatedCompetition.name}</h3>
                      <p className="text-sm mt-1">
                        {generatedCompetition.description}
                      </p>
                      <div className="flex gap-2 mt-3">
                        <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded">
                          {generatedCompetition.type}
                        </span>
                        <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded">
                          {generatedCompetition.difficulty}
                        </span>
                      </div>
                      <div className="flex gap-2 mt-2 text-sm">
                        <span className="text-muted-foreground">
                          {new Date(generatedCompetition.startDate).toLocaleDateString()} - {new Date(generatedCompetition.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium mb-2">Participation Rules</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {generatedCompetition.rules?.map((rule: string, idx: number) => (
                            <li key={idx}>{rule}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium mb-2">Rewards & Scoring</h4>
                        <p className="text-sm">{generatedCompetition.rewardsDescription}</p>
                        <div className="mt-2">
                          <h5 className="text-sm font-medium">Point Structure:</h5>
                          <ul className="list-disc list-inside space-y-1 text-sm mt-1">
                            {generatedCompetition.scoringMethods?.map((method: string, idx: number) => (
                              <li key={idx}>{method}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      
                      {generatedCompetition.challenges && (
                        <div className="border rounded-lg p-4">
                          <h4 className="font-medium mb-2">Challenges</h4>
                          <div className="grid gap-2">
                            {generatedCompetition.challenges.map((challenge: any, idx: number) => (
                              <div key={idx} className="border p-2 rounded">
                                <h5 className="text-sm font-medium">{challenge.title}</h5>
                                <p className="text-xs">{challenge.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Trophy className="h-12 w-12 mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium">No Competition Generated Yet</h3>
                    <p className="text-sm text-muted-foreground mt-2 max-w-xs">
                      Fill out the form and click "Generate Competition" to create a new competition with AI.
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  onClick={saveCompetitionToDatabase}
                  className="w-full"
                  disabled={!generatedCompetition || isSavingCompetition}
                  variant="default"
                >
                  {isSavingCompetition ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <SaveAll className="mr-2 h-4 w-4" />
                      Save Competition to Database
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Note</AlertTitle>
            <AlertDescription>
              The AI will generate competition details, rules, scoring methods, and challenges based on your inputs. 
              You can review and edit before saving to the database.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
}
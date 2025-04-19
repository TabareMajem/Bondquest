import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import BottomNavigation from "@/components/layout/BottomNavigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Award, Calendar, BookText, Trophy, ArrowRight, Heart } from "lucide-react";

// Import bond dimension types and data
import type { BondDimension } from "@shared/bondDimensions";
import { bondDimensions as fallbackBondDimensions } from "@shared/bondDimensions";

export default function AdminAIWizard() {
  const [, navigate] = useLocation();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  
  // Quiz Generator State
  const [quizTab, setQuizTab] = useState<"generator" | "results">("generator");
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizTopic, setQuizTopic] = useState("");
  const [quizCategory, setQuizCategory] = useState("");
  const [quizDifficulty, setQuizDifficulty] = useState("medium");
  const [quizQuestionCount, setQuizQuestionCount] = useState(5);
  const [quizAdditionalInstructions, setQuizAdditionalInstructions] = useState("");
  const [selectedCoupleId, setSelectedCoupleId] = useState<number | null>(null);
  const [couples, setCouples] = useState<any[]>([]);
  const [loadingCouples, setLoadingCouples] = useState(false);
  const [generatedQuiz, setGeneratedQuiz] = useState<any>(null);
  
  // Bond Dimension Quiz Generator State
  const [bondQuizTab, setBondQuizTab] = useState<"generator" | "results">("generator");
  const [bondQuizLoading, setBondQuizLoading] = useState(false);
  const [bondQuizTitle, setBondQuizTitle] = useState("");
  const [bondDimension, setBondDimension] = useState("");
  const [bondQuizDifficulty, setBondQuizDifficulty] = useState("medium");
  const [bondQuizQuestionCount, setBondQuizQuestionCount] = useState(5);
  const [bondQuizAdditionalInstructions, setBondQuizAdditionalInstructions] = useState("");
  const [bondQuizTargetCouple, setBondQuizTargetCouple] = useState<number | null>(null);
  const [generatedBondQuiz, setGeneratedBondQuiz] = useState<any>(null);
  const [bondDimensions, setBondDimensions] = useState<BondDimension[]>([]);
  const [loadingBondDimensions, setLoadingBondDimensions] = useState(false);
  
  // Competition Generator State
  const [competitionTab, setCompetitionTab] = useState<"generator" | "results">("generator");
  const [competitionLoading, setCompetitionLoading] = useState(false);
  const [competitionName, setCompetitionName] = useState("");
  const [competitionDescription, setCompetitionDescription] = useState("");
  const [competitionStartDate, setCompetitionStartDate] = useState("");
  const [competitionEndDate, setCompetitionEndDate] = useState("");
  const [competitionDifficulty, setCompetitionDifficulty] = useState("medium");
  const [competitionType, setCompetitionType] = useState("weekly");
  const [competitionAdditionalInstructions, setCompetitionAdditionalInstructions] = useState("");
  const [generatedCompetition, setGeneratedCompetition] = useState<any>(null);
  
  useEffect(() => {
    // Redirect if not admin
    if (!isAdmin) {
      console.log("Non-admin user attempting to access AI wizard, redirecting to login...");
      navigate("/login");
      return;
    } else {
      console.log("Admin user verified, loading AI wizard...");
    }
    
    // Set default dates for competition (today and +7 days)
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    setCompetitionStartDate(today.toISOString().split('T')[0]);
    setCompetitionEndDate(nextWeek.toISOString().split('T')[0]);
    
    // Fetch all couples for personalized quiz generation
    const fetchCouples = async () => {
      setLoadingCouples(true);
      try {
        const response = await fetch("/api/admin/couples");
        if (response.ok) {
          const data = await response.json();
          console.log("Couples loaded successfully:", data.length);
          setCouples(data);
        } else {
          console.error("Failed to fetch couples:", response.status);
          // Use placeholder data
          setCouples([
            { id: 1, displayName: "Test Couple 1" },
            { id: 2, displayName: "Test Couple 2" }
          ]);
          toast({
            title: "Failed to load couples",
            description: "Using placeholder data instead",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching couples:", error);
        // Use placeholder data
        setCouples([
          { id: 1, displayName: "Test Couple 1" },
          { id: 2, displayName: "Test Couple 2" }
        ]);
      } finally {
        setLoadingCouples(false);
      }
    };
    
    // Fetch bond dimensions for the bond quiz generator
    const fetchBondDimensions = async () => {
      setLoadingBondDimensions(true);
      try {
        console.log("Fetching bond dimensions...");
        const response = await fetch("/api/bond/dimensions");
        
        if (response.ok) {
          const data = await response.json();
          console.log("Bond dimensions loaded successfully:", data.length);
          setBondDimensions(data);
          
          // Set default dimension if available
          if (data.length > 0) {
            setBondDimension(data[0].id);
          }
        } else {
          console.error("Failed to fetch bond dimensions:", response.status);
          
          // Use the imported constant from shared/bondDimensions.ts
          console.log("Using fallback bond dimensions:", fallbackBondDimensions.length);
          setBondDimensions(fallbackBondDimensions);
          
          if (fallbackBondDimensions.length > 0) {
            setBondDimension(fallbackBondDimensions[0].id);
          }
          
          toast({
            title: "Failed to load bond dimensions from API",
            description: "Using fallback data instead",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching bond dimensions:", error);
        
        // Use the imported constant from shared/bondDimensions.ts
        console.log("Using fallback bond dimensions after error:", fallbackBondDimensions.length);
        setBondDimensions(fallbackBondDimensions);
        
        if (fallbackBondDimensions.length > 0) {
          setBondDimension(fallbackBondDimensions[0].id);
        }
      } finally {
        setLoadingBondDimensions(false);
      }
    };
    
    fetchCouples();
    fetchBondDimensions();
  }, [isAdmin, navigate, toast]);
  
  const handleGenerateQuiz = async () => {
    if (!quizTopic || !quizCategory) {
      toast({
        title: "Missing Fields",
        description: "Please fill out all required fields",
        variant: "destructive",
      });
      return;
    }
    
    setQuizLoading(true);
    
    try {
      // Prepare request payload, include coupleId if selected
      const payload = {
        topic: quizTopic,
        category: quizCategory,
        difficulty: quizDifficulty,
        questionCount: quizQuestionCount,
        additionalInstructions: quizAdditionalInstructions || undefined,
      };
      
      // Add coupleId for personalization if a couple is selected
      if (selectedCoupleId) {
        Object.assign(payload, { coupleId: selectedCoupleId });
      }
      
      const response = await fetch("/api/admin/ai/generate-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to generate quiz");
      }
      
      const data = await response.json();
      setGeneratedQuiz(data);
      setQuizTab("results");
      
      toast({
        title: "Quiz Generated",
        description: selectedCoupleId 
          ? "Your personalized quiz has been successfully created" 
          : "Your quiz has been successfully created",
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate quiz",
        variant: "destructive",
      });
    } finally {
      setQuizLoading(false);
    }
  };
  
  const handleSaveQuiz = async () => {
    try {
      // Save the quiz to the database
      const quizResponse = await fetch("/api/quizzes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: generatedQuiz.title,
          description: generatedQuiz.description,
          category: generatedQuiz.category,
          type: generatedQuiz.type,
          difficulty: generatedQuiz.difficulty,
          duration: generatedQuiz.duration,
          points: generatedQuiz.points,
          image: null,
        }),
      });
      
      if (!quizResponse.ok) {
        const errorData = await quizResponse.json();
        throw new Error(errorData.message || "Failed to save quiz");
      }
      
      const savedQuiz = await quizResponse.json();
      
      // Save each question
      for (const question of generatedQuiz.questions) {
        await fetch("/api/questions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quizId: savedQuiz.id,
            text: question.text,
            options: question.options,
          }),
        });
      }
      
      toast({
        title: "Quiz Saved",
        description: "Your quiz has been successfully saved to the database",
      });
      
      // Reset form and results
      setQuizTopic("");
      setQuizCategory("");
      setQuizDifficulty("medium");
      setQuizQuestionCount(5);
      setQuizAdditionalInstructions("");
      setGeneratedQuiz(null);
      setQuizTab("generator");
      
    } catch (error) {
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save quiz",
        variant: "destructive",
      });
    }
  };
  
  const handleGenerateCompetition = async () => {
    if (!competitionName || !competitionDescription || !competitionStartDate || !competitionEndDate) {
      toast({
        title: "Missing Fields",
        description: "Please fill out all required fields",
        variant: "destructive",
      });
      return;
    }
    
    setCompetitionLoading(true);
    
    try {
      const response = await fetch("/api/admin/ai/generate-competition", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: competitionName,
          description: competitionDescription,
          startDate: competitionStartDate,
          endDate: competitionEndDate,
          difficulty: competitionDifficulty,
          type: competitionType,
          additionalInstructions: competitionAdditionalInstructions || undefined,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to generate competition");
      }
      
      const data = await response.json();
      setGeneratedCompetition(data);
      setCompetitionTab("results");
      
      toast({
        title: "Competition Generated",
        description: "Your competition has been successfully created",
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate competition",
        variant: "destructive",
      });
    } finally {
      setCompetitionLoading(false);
    }
  };
  
  // Bond Dimension Quiz Generation
  const handleGenerateBondQuiz = async () => {
    if (!bondQuizTitle || !bondDimension) {
      toast({
        title: "Missing Fields",
        description: "Please fill out all required fields",
        variant: "destructive",
      });
      return;
    }
    
    setBondQuizLoading(true);
    
    try {
      // Find the selected bond dimension details
      const selectedDimension = bondDimensions.find(d => d.id === bondDimension);
      
      if (!selectedDimension) {
        throw new Error("Selected dimension not found");
      }
      
      // Prepare the request payload
      const payload = {
        topic: bondQuizTitle,
        category: selectedDimension.name,
        difficulty: bondQuizDifficulty,
        questionCount: bondQuizQuestionCount,
        dimensionId: bondDimension,
        additionalInstructions: 
          `This quiz is focused on the "${selectedDimension.name}" bond dimension: ${selectedDimension.description}. 
           Create questions that specifically address this aspect of relationships using the provided format.
           ${bondQuizAdditionalInstructions || ""}`,
      };
      
      // Add coupleId for personalization if a couple is selected
      if (bondQuizTargetCouple) {
        Object.assign(payload, { coupleId: bondQuizTargetCouple });
      }
      
      const response = await fetch("/api/quizzes/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to generate bond dimension quiz");
      }
      
      const data = await response.json();
      setGeneratedBondQuiz(data.quiz ? { ...data.quiz, questions: data.questions } : data);
      setBondQuizTab("results");
      
      toast({
        title: "Bond Quiz Generated",
        description: `Your ${selectedDimension.name} dimension quiz has been created successfully`,
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate bond quiz",
        variant: "destructive",
      });
    } finally {
      setBondQuizLoading(false);
    }
  };
  
  // Save Bond Quiz to the database
  const handleSaveBondQuiz = async () => {
    try {
      if (!generatedBondQuiz) {
        throw new Error("No quiz data available to save");
      }
      
      // Quiz is already saved in the database if it has an ID
      if (generatedBondQuiz.id) {
        toast({
          title: "Quiz Already Saved",
          description: "This quiz is already saved in the database",
        });
        return;
      }
      
      // If the quiz needs to be saved, use the existing save logic
      const quizResponse = await fetch("/api/quizzes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: generatedBondQuiz.title,
          description: generatedBondQuiz.description,
          category: generatedBondQuiz.category,
          type: generatedBondQuiz.type || "multiplayer",
          difficulty: generatedBondQuiz.difficulty,
          duration: generatedBondQuiz.duration || 10,
          points: generatedBondQuiz.points || 100,
          image: null,
        }),
      });
      
      if (!quizResponse.ok) {
        const errorData = await quizResponse.json();
        throw new Error(errorData.message || "Failed to save quiz");
      }
      
      const savedQuiz = await quizResponse.json();
      
      // Save each question
      for (const question of generatedBondQuiz.questions) {
        await fetch("/api/questions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quizId: savedQuiz.id,
            text: question.text,
            options: question.options,
          }),
        });
      }
      
      toast({
        title: "Bond Quiz Saved",
        description: "Your bond dimension quiz has been successfully saved to the database",
      });
      
      // Reset form and results
      setBondQuizTitle("");
      setBondQuizDifficulty("medium");
      setBondQuizQuestionCount(5);
      setBondQuizAdditionalInstructions("");
      setGeneratedBondQuiz(null);
      setBondQuizTab("generator");
      
    } catch (error) {
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save bond quiz",
        variant: "destructive",
      });
    }
  };

  const handleSaveCompetition = async () => {
    try {
      // Save the competition to the database
      const competitionResponse = await fetch("/api/admin/competitions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: generatedCompetition.name,
          description: generatedCompetition.description,
          startDate: generatedCompetition.startDate,
          endDate: generatedCompetition.endDate,
          status: generatedCompetition.status,
          difficulty: generatedCompetition.difficulty,
          type: generatedCompetition.type,
          imageUrl: null,
          maxParticipants: generatedCompetition.maxParticipants,
          rules: JSON.stringify(generatedCompetition.rules),
          rewardsDescription: generatedCompetition.rewardsDescription,
          scoringMethods: JSON.stringify(generatedCompetition.scoringMethods),
          challenges: JSON.stringify(generatedCompetition.challenges),
        }),
      });
      
      if (!competitionResponse.ok) {
        const errorData = await competitionResponse.json();
        throw new Error(errorData.message || "Failed to save competition");
      }
      
      toast({
        title: "Competition Saved",
        description: "Your competition has been successfully saved to the database",
      });
      
      // Reset form and results
      setCompetitionName("");
      setCompetitionDescription("");
      setCompetitionDifficulty("medium");
      setCompetitionType("weekly");
      setCompetitionAdditionalInstructions("");
      setGeneratedCompetition(null);
      setCompetitionTab("generator");
      
    } catch (error) {
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save competition",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-purple-950 text-white pb-32">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">AI Wizard</h1>
            <p className="text-purple-300">Generate AI-powered content for BondQuest</p>
          </div>
          <Button 
            variant="ghost" 
            onClick={() => navigate("/admin")}
            className="text-purple-300 hover:text-white hover:bg-purple-800"
          >
            Back to Dashboard
          </Button>
        </div>
        
        <Tabs defaultValue="quizzes" className="mb-32">
          <TabsList className="grid w-full grid-cols-3 bg-purple-800 rounded-xl">
            <TabsTrigger value="quizzes" className="data-[state=active]:bg-purple-700 data-[state=active]:text-white rounded-xl">
              <BookText className="mr-2 h-4 w-4" />
              Quiz Generator
            </TabsTrigger>
            <TabsTrigger value="bond-quizzes" className="data-[state=active]:bg-purple-700 data-[state=active]:text-white rounded-xl">
              <Heart className="mr-2 h-4 w-4" />
              Bond Dimension Quiz
            </TabsTrigger>
            <TabsTrigger value="competitions" className="data-[state=active]:bg-purple-700 data-[state=active]:text-white rounded-xl">
              <Award className="mr-2 h-4 w-4" />
              Competition Generator
            </TabsTrigger>
          </TabsList>
          
          {/* Quiz Generator Tab */}
          <TabsContent value="quizzes" className="mt-6">
            <Card className="bg-purple-800/40 border-purple-700">
              <CardHeader>
                <CardTitle className="flex items-center text-2xl">
                  <Sparkles className="mr-2 h-5 w-5 text-purple-300" />
                  AI Quiz Generator
                </CardTitle>
                <CardDescription className="text-purple-300">
                  Create engaging relationship quizzes with AI
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={quizTab} onValueChange={(value) => setQuizTab(value as "generator" | "results")}>
                  <TabsList className="grid w-full grid-cols-2 bg-purple-900/40 rounded-xl mb-6">
                    <TabsTrigger value="generator" className="data-[state=active]:bg-purple-700 data-[state=active]:text-white rounded-xl">
                      Generate
                    </TabsTrigger>
                    <TabsTrigger value="results" className="data-[state=active]:bg-purple-700 data-[state=active]:text-white rounded-xl" disabled={!generatedQuiz}>
                      Results
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="generator">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="quizTopic">Quiz Topic (Required)</Label>
                          <Input 
                            id="quizTopic" 
                            placeholder="Love languages, date night ideas, etc."
                            value={quizTopic}
                            onChange={(e) => setQuizTopic(e.target.value)}
                            className="bg-purple-900/40 border-purple-600"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="quizCategory">Category (Required)</Label>
                          <Input 
                            id="quizCategory" 
                            placeholder="Communication, Intimacy, Fun, etc."
                            value={quizCategory}
                            onChange={(e) => setQuizCategory(e.target.value)}
                            className="bg-purple-900/40 border-purple-600"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="quizDifficulty">Difficulty</Label>
                          <Select 
                            value={quizDifficulty} 
                            onValueChange={setQuizDifficulty}
                          >
                            <SelectTrigger className="bg-purple-900/40 border-purple-600">
                              <SelectValue placeholder="Select difficulty" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="easy">Easy</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="hard">Hard</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="quizQuestionCount">Number of Questions</Label>
                          <Input 
                            id="quizQuestionCount" 
                            type="number"
                            min={3}
                            max={15}
                            value={quizQuestionCount}
                            onChange={(e) => setQuizQuestionCount(parseInt(e.target.value))}
                            className="bg-purple-900/40 border-purple-600"
                          />
                        </div>
                      </div>
                      
                      {/* Couple selector for personalized content generation */}
                      <div className="space-y-2 mt-4">
                        <Label htmlFor="selectedCouple">Target Couple (Optional)</Label>
                        <div className="flex gap-2 items-center">
                          <Select 
                            value={selectedCoupleId?.toString() || ""} 
                            onValueChange={(value) => setSelectedCoupleId(value ? parseInt(value) : null)}
                          >
                            <SelectTrigger className="bg-purple-900/40 border-purple-600 flex-1">
                              <SelectValue placeholder="Select a couple for personalized content" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">No specific couple (generic content)</SelectItem>
                              {loadingCouples ? (
                                <div className="flex items-center justify-center py-2">
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  <span>Loading couples...</span>
                                </div>
                              ) : (
                                couples.map((couple) => (
                                  <SelectItem key={couple.id} value={couple.id.toString()}>
                                    {couple.displayName}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        {selectedCoupleId && (
                          <p className="text-xs text-purple-300 mt-1">
                            The AI will personalize content using this couple's profile information and relationship history.
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="quizAdditionalInstructions">Additional Instructions (Optional)</Label>
                        <Textarea 
                          id="quizAdditionalInstructions" 
                          placeholder="Any specific requirements or themes"
                          value={quizAdditionalInstructions}
                          onChange={(e) => setQuizAdditionalInstructions(e.target.value)}
                          className="bg-purple-900/40 border-purple-600 min-h-24"
                        />
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="results">
                    {generatedQuiz && (
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <h3 className="text-xl font-semibold">{generatedQuiz.title}</h3>
                          <p className="text-purple-300">{generatedQuiz.description}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="px-2 py-1 text-xs bg-purple-700 rounded-lg">
                              {generatedQuiz.category}
                            </span>
                            <span className="px-2 py-1 text-xs bg-purple-700 rounded-lg">
                              {generatedQuiz.difficulty}
                            </span>
                            <span className="px-2 py-1 text-xs bg-purple-700 rounded-lg">
                              {generatedQuiz.questions?.length || 0} questions
                            </span>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <h4 className="text-lg font-semibold">Questions</h4>
                          {generatedQuiz.questions?.map((question: any, index: number) => (
                            <div key={index} className="p-4 bg-purple-900/40 rounded-lg space-y-3">
                              <p className="font-medium">
                                {index + 1}. {question.text}
                              </p>
                              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                {question.options?.map((option: string, optIndex: number) => (
                                  <div key={optIndex} className="flex items-center space-x-2">
                                    <div className="w-6 h-6 rounded-full bg-purple-700 flex items-center justify-center text-xs font-bold">
                                      {String.fromCharCode(65 + optIndex)}
                                    </div>
                                    <span>{option}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter className="flex justify-between border-t border-purple-700 pt-4">
                {quizTab === "generator" ? (
                  <Button 
                    onClick={handleGenerateQuiz} 
                    className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700"
                    disabled={quizLoading}
                  >
                    {quizLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Quiz...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Quiz
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="flex w-full gap-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setQuizTab("generator")}
                      className="flex-1 border-purple-600 text-white hover:bg-purple-700 hover:text-white"
                    >
                      Back to Editor
                    </Button>
                    <Button 
                      onClick={handleSaveQuiz} 
                      className="flex-1 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700"
                    >
                      Save Quiz to Database
                    </Button>
                  </div>
                )}
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Bond Dimension Quiz Generator Tab */}
          <TabsContent value="bond-quizzes" className="mt-6">
            <Card className="bg-purple-800/40 border-purple-700">
              <CardHeader>
                <CardTitle className="flex items-center text-2xl">
                  <Heart className="mr-2 h-5 w-5 text-purple-300" />
                  Bond Dimension Quiz Generator
                </CardTitle>
                <CardDescription className="text-purple-300">
                  Create quizzes based on the 10 core bond dimensions framework
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={bondQuizTab} onValueChange={(value) => setBondQuizTab(value as "generator" | "results")}>
                  <TabsList className="grid w-full grid-cols-2 bg-purple-900/40 rounded-xl mb-6">
                    <TabsTrigger value="generator" className="data-[state=active]:bg-purple-700 data-[state=active]:text-white rounded-xl">
                      Generate
                    </TabsTrigger>
                    <TabsTrigger value="results" className="data-[state=active]:bg-purple-700 data-[state=active]:text-white rounded-xl" disabled={!generatedBondQuiz}>
                      Results
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="generator">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="bondQuizTitle">Quiz Title (Required)</Label>
                          <Input 
                            id="bondQuizTitle" 
                            placeholder="Understanding Each Other's Communication Style"
                            value={bondQuizTitle}
                            onChange={(e) => setBondQuizTitle(e.target.value)}
                            className="bg-purple-900/40 border-purple-600"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="bondDimension">Bond Dimension (Required)</Label>
                          <Select 
                            value={bondDimension} 
                            onValueChange={setBondDimension}
                          >
                            <SelectTrigger className="bg-purple-900/40 border-purple-600">
                              <SelectValue placeholder="Select bond dimension" />
                            </SelectTrigger>
                            <SelectContent>
                              {loadingBondDimensions ? (
                                <div className="flex items-center justify-center py-2">
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  <span>Loading dimensions...</span>
                                </div>
                              ) : (
                                bondDimensions.map((dimension) => (
                                  <SelectItem key={dimension.id} value={dimension.id}>
                                    {dimension.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="bondQuizDifficulty">Difficulty</Label>
                          <Select 
                            value={bondQuizDifficulty} 
                            onValueChange={setBondQuizDifficulty}
                          >
                            <SelectTrigger className="bg-purple-900/40 border-purple-600">
                              <SelectValue placeholder="Select difficulty" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="easy">Easy</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="hard">Hard</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="bondQuizQuestionCount">Number of Questions</Label>
                          <Input 
                            id="bondQuizQuestionCount" 
                            type="number"
                            min={3}
                            max={15}
                            value={bondQuizQuestionCount}
                            onChange={(e) => setBondQuizQuestionCount(parseInt(e.target.value))}
                            className="bg-purple-900/40 border-purple-600"
                          />
                        </div>
                      </div>
                      
                      {/* Dimension Description */}
                      {bondDimension && (
                        <div className="mt-4 p-4 rounded-lg bg-purple-700/20 border border-purple-600/40">
                          <h3 className="text-lg font-medium mb-2">
                            {bondDimensions.find(d => d.id === bondDimension)?.name} Dimension
                          </h3>
                          <p className="text-purple-200 text-sm">
                            {bondDimensions.find(d => d.id === bondDimension)?.description}
                          </p>
                          
                          {/* Example questions from dimension */}
                          <div className="mt-3">
                            <h4 className="text-sm font-medium mb-1 text-purple-200">Example Assessment Questions:</h4>
                            <ul className="list-disc pl-5 text-xs text-purple-300 space-y-1">
                              {bondDimensions.find(d => d.id === bondDimension)?.questions.map((q: { text: string, type: string }, idx: number) => (
                                <li key={idx}>{q.text}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                      
                      {/* Couple selector for personalized content generation */}
                      <div className="space-y-2 mt-4">
                        <Label htmlFor="bondQuizTargetCouple">Target Couple (Optional)</Label>
                        <div className="flex gap-2 items-center">
                          <Select 
                            value={bondQuizTargetCouple?.toString() || ""} 
                            onValueChange={(value) => setBondQuizTargetCouple(value ? parseInt(value) : null)}
                          >
                            <SelectTrigger className="bg-purple-900/40 border-purple-600 flex-1">
                              <SelectValue placeholder="Select a couple for personalized content" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">No specific couple (generic content)</SelectItem>
                              {loadingCouples ? (
                                <div className="flex items-center justify-center py-2">
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  <span>Loading couples...</span>
                                </div>
                              ) : (
                                couples.map((couple) => (
                                  <SelectItem key={couple.id} value={couple.id.toString()}>
                                    {couple.displayName}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        {bondQuizTargetCouple && (
                          <p className="text-xs text-purple-300 mt-1">
                            The AI will personalize content using this couple's profile information and relationship history.
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="bondQuizAdditionalInstructions">Additional Instructions (Optional)</Label>
                        <Textarea 
                          id="bondQuizAdditionalInstructions" 
                          placeholder="Any specific requirements or themes for this bond dimension quiz"
                          value={bondQuizAdditionalInstructions}
                          onChange={(e) => setBondQuizAdditionalInstructions(e.target.value)}
                          className="bg-purple-900/40 border-purple-600 min-h-24"
                        />
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="results">
                    {generatedBondQuiz && (
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <h3 className="text-xl font-semibold">{generatedBondQuiz.title}</h3>
                          <p className="text-purple-300">{generatedBondQuiz.description}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="px-2 py-1 text-xs bg-purple-700 rounded-lg">
                              {generatedBondQuiz.category}
                            </span>
                            <span className="px-2 py-1 text-xs bg-purple-700 rounded-lg">
                              {generatedBondQuiz.difficulty}
                            </span>
                            <span className="px-2 py-1 text-xs bg-purple-700 rounded-lg">
                              {generatedBondQuiz.questions?.length || 0} questions
                            </span>
                            <span className="px-2 py-1 text-xs bg-gradient-to-r from-purple-700 to-pink-700 rounded-lg">
                              Bond Dimension: {bondDimensions.find(d => d.id === bondDimension)?.name}
                            </span>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <h4 className="text-lg font-semibold">Questions</h4>
                          {generatedBondQuiz.questions?.map((question: any, index: number) => (
                            <div key={index} className="p-4 bg-purple-900/40 rounded-lg space-y-3">
                              <p className="font-medium">
                                {index + 1}. {question.text}
                              </p>
                              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                {question.options?.map((option: string, optIndex: number) => (
                                  <div key={optIndex} className="flex items-center space-x-2">
                                    <div className="w-6 h-6 rounded-full bg-purple-700 flex items-center justify-center text-xs font-bold">
                                      {String.fromCharCode(65 + optIndex)}
                                    </div>
                                    <span>{option}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter className="flex justify-between border-t border-purple-700 pt-4">
                {bondQuizTab === "generator" ? (
                  <Button 
                    onClick={handleGenerateBondQuiz} 
                    className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700"
                    disabled={bondQuizLoading}
                  >
                    {bondQuizLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Bond Quiz...
                      </>
                    ) : (
                      <>
                        <Heart className="mr-2 h-4 w-4" />
                        Generate Bond Quiz
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="flex w-full gap-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setBondQuizTab("generator")}
                      className="flex-1 border-purple-600 text-white hover:bg-purple-700 hover:text-white"
                    >
                      Back to Editor
                    </Button>
                    <Button 
                      onClick={handleSaveBondQuiz} 
                      className="flex-1 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700"
                    >
                      Save Quiz to Database
                    </Button>
                  </div>
                )}
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Competition Generator Tab */}
          <TabsContent value="competitions" className="mt-6">
            <Card className="bg-purple-800/40 border-purple-700">
              <CardHeader>
                <CardTitle className="flex items-center text-2xl">
                  <Trophy className="mr-2 h-5 w-5 text-purple-300" />
                  AI Competition Generator
                </CardTitle>
                <CardDescription className="text-purple-300">
                  Create engaging relationship competitions with AI
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={competitionTab} onValueChange={(value) => setCompetitionTab(value as "generator" | "results")}>
                  <TabsList className="grid w-full grid-cols-2 bg-purple-900/40 rounded-xl mb-6">
                    <TabsTrigger value="generator" className="data-[state=active]:bg-purple-700 data-[state=active]:text-white rounded-xl">
                      Generate
                    </TabsTrigger>
                    <TabsTrigger value="results" className="data-[state=active]:bg-purple-700 data-[state=active]:text-white rounded-xl" disabled={!generatedCompetition}>
                      Results
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="generator">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="competitionName">Competition Name (Required)</Label>
                          <Input 
                            id="competitionName" 
                            placeholder="Love Challenge, Date Night Marathon, etc."
                            value={competitionName}
                            onChange={(e) => setCompetitionName(e.target.value)}
                            className="bg-purple-900/40 border-purple-600"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="competitionType">Competition Type</Label>
                          <Select 
                            value={competitionType} 
                            onValueChange={setCompetitionType}
                          >
                            <SelectTrigger className="bg-purple-900/40 border-purple-600">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="special">Special</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="competitionStartDate">Start Date (Required)</Label>
                          <Input 
                            id="competitionStartDate" 
                            type="date"
                            value={competitionStartDate}
                            onChange={(e) => setCompetitionStartDate(e.target.value)}
                            className="bg-purple-900/40 border-purple-600"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="competitionEndDate">End Date (Required)</Label>
                          <Input 
                            id="competitionEndDate" 
                            type="date"
                            value={competitionEndDate}
                            onChange={(e) => setCompetitionEndDate(e.target.value)}
                            className="bg-purple-900/40 border-purple-600"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="competitionDifficulty">Difficulty</Label>
                          <Select 
                            value={competitionDifficulty} 
                            onValueChange={setCompetitionDifficulty}
                          >
                            <SelectTrigger className="bg-purple-900/40 border-purple-600">
                              <SelectValue placeholder="Select difficulty" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="easy">Easy</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="hard">Hard</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="competitionDescription">Description (Required)</Label>
                        <Textarea 
                          id="competitionDescription" 
                          placeholder="Describe the competition"
                          value={competitionDescription}
                          onChange={(e) => setCompetitionDescription(e.target.value)}
                          className="bg-purple-900/40 border-purple-600 min-h-24"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="competitionAdditionalInstructions">Additional Instructions (Optional)</Label>
                        <Textarea 
                          id="competitionAdditionalInstructions" 
                          placeholder="Any specific requirements or themes"
                          value={competitionAdditionalInstructions}
                          onChange={(e) => setCompetitionAdditionalInstructions(e.target.value)}
                          className="bg-purple-900/40 border-purple-600 min-h-24"
                        />
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="results">
                    {generatedCompetition && (
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <h3 className="text-xl font-semibold">{generatedCompetition.name}</h3>
                          <p className="text-purple-300">{generatedCompetition.description}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="px-2 py-1 text-xs bg-purple-700 rounded-lg flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(generatedCompetition.startDate).toLocaleDateString()} - {new Date(generatedCompetition.endDate).toLocaleDateString()}
                            </span>
                            <span className="px-2 py-1 text-xs bg-purple-700 rounded-lg">
                              {generatedCompetition.type}
                            </span>
                            <span className="px-2 py-1 text-xs bg-purple-700 rounded-lg">
                              {generatedCompetition.difficulty}
                            </span>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <h4 className="text-lg font-semibold">Rules</h4>
                          <ul className="list-disc pl-5 space-y-1">
                            {generatedCompetition.rules?.map((rule: string, index: number) => (
                              <li key={index} className="text-purple-200">{rule}</li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="space-y-4">
                          <h4 className="text-lg font-semibold">Scoring Methods</h4>
                          <ul className="list-disc pl-5 space-y-1">
                            {generatedCompetition.scoringMethods?.map((method: string, index: number) => (
                              <li key={index} className="text-purple-200">{method}</li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="space-y-4">
                          <h4 className="text-lg font-semibold">Challenges</h4>
                          {generatedCompetition.challenges?.map((challenge: any, index: number) => (
                            <div key={index} className="p-4 bg-purple-900/40 rounded-lg space-y-2">
                              <p className="font-medium">{challenge.title}</p>
                              <p className="text-purple-300">{challenge.description}</p>
                              <p className="text-sm font-medium text-purple-200">
                                Points: {challenge.pointValue}
                              </p>
                            </div>
                          ))}
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="text-lg font-semibold">Rewards</h4>
                          <p className="text-purple-300">{generatedCompetition.rewardsDescription}</p>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter className="flex justify-between border-t border-purple-700 pt-4">
                {competitionTab === "generator" ? (
                  <Button 
                    onClick={handleGenerateCompetition} 
                    className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700"
                    disabled={competitionLoading}
                  >
                    {competitionLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Competition...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Competition
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="flex w-full gap-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setCompetitionTab("generator")}
                      className="flex-1 border-purple-600 text-white hover:bg-purple-700 hover:text-white"
                    >
                      Back to Editor
                    </Button>
                    <Button 
                      onClick={handleSaveCompetition} 
                      className="flex-1 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700"
                    >
                      Save Competition to Database
                    </Button>
                  </div>
                )}
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      <BottomNavigation activeTab="admin" />
    </div>
  );
}
import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash, 
  Copy, 
  Eye,
  HelpCircle,
  Filter,
  Plus,
  Gamepad2, 
  ClipboardList
} from "lucide-react";
import { format } from "date-fns";
import { queryClient } from "@/lib/queryClient";
import { Quiz } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/apiClient";
import PageLayout from "@/components/layout/PageLayout";

export default function AdminQuizzes() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  
  // Check if user has admin access - in a real app, you would check user.role or similar
  const isAdmin = user?.email === "admin@bondquest.com";
  
  // Redirect non-admin users
  React.useEffect(() => {
    if (!isAdmin) {
      navigate("/home");
    }
  }, [isAdmin, navigate]);

  // Fetch quizzes
  const { data: quizzes, isLoading, isError } = useQuery<Quiz[]>({
    queryKey: ["/api/admin/quizzes"],
    enabled: isAdmin,
  });

  // Delete quiz mutation
  const deleteQuizMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest(`/api/admin/quizzes/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quizzes"] });
      toast({
        title: "Quiz Deleted",
        description: "The quiz has been successfully deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete the quiz. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to delete quiz:", error);
    },
  });

  // Duplicate quiz mutation
  const duplicateQuizMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest(`/api/admin/quizzes/${id}/duplicate`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quizzes"] });
      toast({
        title: "Quiz Duplicated",
        description: "The quiz has been successfully duplicated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to duplicate the quiz. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to duplicate quiz:", error);
    },
  });

  const handleDeleteQuiz = (id: number) => {
    if (window.confirm("Are you sure you want to delete this quiz? This action cannot be undone.")) {
      deleteQuizMutation.mutate(id);
    }
  };

  const handleDuplicateQuiz = (id: number) => {
    duplicateQuizMutation.mutate(id);
  };

  // Get all categories from quizzes
  const categories = quizzes 
    ? [...new Set(quizzes.map(quiz => quiz.category))]
    : [];

  // Filter and search the quizzes
  const filteredQuizzes = quizzes?.filter((quiz) => {
    const matchesSearch = 
      searchTerm === "" || 
      quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (quiz.description && quiz.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (categoryFilter === "all") return matchesSearch;
    return matchesSearch && quiz.category === categoryFilter;
  });

  // Helper function to get a category badge with the right color
  const getCategoryBadge = (category: string) => {
    const categoryColors: Record<string, string> = {
      'relationship': 'bg-pink-100 text-pink-800 hover:bg-pink-200',
      'couple_vs_couple': 'bg-purple-100 text-purple-800 hover:bg-purple-200',
      'compatibility': 'bg-blue-100 text-blue-800 hover:bg-blue-200',
      'communication': 'bg-green-100 text-green-800 hover:bg-green-200',
      'trust': 'bg-red-100 text-red-800 hover:bg-red-200',
      'intimacy': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
    };
    
    const defaultStyle = 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    return (
      <Badge variant="outline" className={categoryColors[category] || defaultStyle}>
        {category.replace('_', ' ')}
      </Badge>
    );
  };

  if (!isAdmin) {
    return null; // Not rendering if not admin
  }

  return (
    <PageLayout activeTab="admin" pageTitle="Quiz Management" maxWidth="full" className="px-2 md:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin")}
            className="mr-4 text-white hover:bg-purple-800/20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Quiz Management</h1>
        </div>
        <Button
          onClick={() => navigate("/admin/quizzes/new")}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Quiz
        </Button>
      </div>
      
      {/* Search and filter bar */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search quizzes by title or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <div className="w-full md:w-[200px]">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <div className="flex items-center">
                    <Filter className="h-4 w-4 mr-2" />
                    <span>Category: {categoryFilter === "all" ? "All" : categoryFilter.replace('_', ' ')}</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Quizzes table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl">Quizzes</CardTitle>
            <Badge variant="outline" className="text-xs">
              {filteredQuizzes?.length || 0} quizzes
            </Badge>
          </div>
          <CardDescription>
            Manage all quizzes and questionnaires in the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : isError ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-center text-red-500">
                <p>Failed to load quizzes</p>
                <Button
                  variant="outline"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/quizzes"] })}
                  className="mt-4"
                >
                  Retry
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Questions</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuizzes && filteredQuizzes.length > 0 ? (
                    filteredQuizzes.map((quiz) => (
                      <TableRow key={quiz.id}>
                        <TableCell className="font-medium">{quiz.id}</TableCell>
                        <TableCell className="font-medium">{quiz.title}</TableCell>
                        <TableCell>{getCategoryBadge(quiz.category)}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <HelpCircle className="h-4 w-4 mr-1 text-gray-500" />
                            <span>{quiz.questionCount || "?"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {quiz.createdAt 
                            ? format(new Date(quiz.createdAt), "MMM d, yyyy")
                            : "N/A"
                          }
                        </TableCell>
                        <TableCell>
                          {quiz.active ? (
                            <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-200">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-200">
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => navigate(`/admin/quizzes/${quiz.id}`)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/admin/quizzes/${quiz.id}/edit`)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Quiz
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/admin/quizzes/${quiz.id}/questions`)}>
                                <ClipboardList className="h-4 w-4 mr-2" />
                                Manage Questions
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDuplicateQuiz(quiz.id)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate Quiz
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteQuiz(quiz.id)}
                                className="text-red-600 focus:text-red-700"
                              >
                                <Trash className="h-4 w-4 mr-2" />
                                Delete Quiz
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-gray-500">
                        {searchTerm || categoryFilter !== "all" 
                          ? "No quizzes found matching your search or filter criteria"
                          : "No quizzes available"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </PageLayout>
  );
}
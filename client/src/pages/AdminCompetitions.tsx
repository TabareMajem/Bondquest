import React from "react";
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
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, MoreHorizontal, Edit, Trash, Trophy, Users, Calendar } from "lucide-react";
import { format } from "date-fns";
import { queryClient } from "@/lib/queryClient";
import { Competition } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";
import BottomNavigation from "@/components/layout/BottomNavigation";
import { apiRequest } from "@/lib/apiClient";

export default function AdminCompetitions() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Check if user has admin access - in a real app, you would check user.role or similar
  const isAdmin = user?.email === "admin@bondquest.com";
  
  // Redirect non-admin users
  React.useEffect(() => {
    if (!isAdmin) {
      navigate("/home");
    }
  }, [isAdmin, navigate]);

  // Fetch competitions
  const { data: competitions, isLoading, isError } = useQuery<Competition[]>({
    queryKey: ["/api/admin/competitions"],
    enabled: isAdmin,
  });

  // Delete competition mutation
  const deleteCompetitionMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest(`/api/admin/competitions/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/competitions"] });
      toast({
        title: "Competition Deleted",
        description: "The competition has been successfully deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete the competition. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to delete competition:", error);
    },
  });

  const handleDeleteCompetition = (id: number) => {
    if (window.confirm("Are you sure you want to delete this competition?")) {
      deleteCompetitionMutation.mutate(id);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "upcoming":
        return <Badge className="bg-blue-500">Upcoming</Badge>;
      case "active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "completed":
        return <Badge variant="outline" className="border-purple-500 text-purple-500">Completed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (!isAdmin) {
    return null; // Not rendering if not admin
  }

  return (
    <div className="container mx-auto p-6 pb-24">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin")}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-purple-800">Competitions Management</h1>
        </div>
        <Button onClick={() => navigate("/admin/competitions/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Competition
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Competitions</CardTitle>
          <CardDescription>
            Manage competitions for couples to participate in and earn rewards
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-gray-500">Loading competitions...</p>
            </div>
          ) : isError ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-red-500">Error loading competitions. Please try again.</p>
            </div>
          ) : competitions && competitions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Participants</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {competitions.map((competition) => (
                  <TableRow key={competition.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <Trophy className="h-4 w-4 mr-2 text-purple-500" />
                        {competition.title}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(competition.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-gray-400" />
                        {competition.participantCount || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        {format(new Date(competition.startDate), "MMM d, yyyy")}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(competition.endDate), "MMM d, yyyy")}
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
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => navigate(`/admin/competitions/${competition.id}/edit`)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteCompetition(competition.id)}
                            className="text-red-600"
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Trophy className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Competitions Found</h3>
              <p className="text-gray-500 mb-4">
                You haven't created any competitions yet. Get started by adding your first competition.
              </p>
              <Button onClick={() => navigate("/admin/competitions/new")}>
                Add Your First Competition
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <BottomNavigation activeTab="admin" />
    </div>
  );
}
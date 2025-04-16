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
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, MoreHorizontal, Edit, Trash, Gift } from "lucide-react";
import { format } from "date-fns";
import { queryClient } from "@/lib/queryClient";
import { Reward } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";
import BottomNavigation from "@/components/layout/BottomNavigation";
import { apiRequest } from "@/lib/apiClient";

export default function AdminRewards() {
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

  // Fetch rewards
  const { data: rewards, isLoading, isError } = useQuery<Reward[]>({
    queryKey: ["/api/admin/rewards"],
    enabled: isAdmin,
  });

  // Delete reward mutation
  const deleteRewardMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest(`/api/admin/rewards/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/rewards"] });
      toast({
        title: "Reward Deleted",
        description: "The reward has been successfully deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete the reward. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to delete reward:", error);
    },
  });

  const handleDeleteReward = (id: number) => {
    if (window.confirm("Are you sure you want to delete this reward?")) {
      deleteRewardMutation.mutate(id);
    }
  };

  const getRewardTypeLabel = (type: string) => {
    switch (type) {
      case "physical":
        return <Badge className="bg-blue-500">Physical</Badge>;
      case "digital":
        return <Badge className="bg-green-500">Digital</Badge>;
      case "experience":
        return <Badge className="bg-purple-500">Experience</Badge>;
      default:
        return <Badge>Other</Badge>;
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
          <h1 className="text-3xl font-bold text-purple-800">Rewards Management</h1>
        </div>
        <Button onClick={() => navigate("/admin/rewards/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Reward
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Rewards</CardTitle>
          <CardDescription>
            Manage rewards that couples can earn through competitions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-gray-500">Loading rewards...</p>
            </div>
          ) : isError ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-red-500">Error loading rewards. Please try again.</p>
            </div>
          ) : rewards && rewards.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rewards.map((reward) => (
                  <TableRow key={reward.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <Gift className="h-4 w-4 mr-2 text-purple-500" />
                        {reward.name}
                      </div>
                    </TableCell>
                    <TableCell>{getRewardTypeLabel(reward.type)}</TableCell>
                    <TableCell>{reward.pointsRequired}</TableCell>
                    <TableCell>
                      {reward.active ? (
                        <Badge className="bg-green-500">Active</Badge>
                      ) : (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {reward.createdAt
                        ? format(new Date(reward.createdAt), "MMM d, yyyy")
                        : "Unknown"}
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
                            onClick={() => navigate(`/admin/rewards/${reward.id}/edit`)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteReward(reward.id)}
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
              <Gift className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Rewards Found</h3>
              <p className="text-gray-500 mb-4">
                You haven't created any rewards yet. Get started by adding your first reward.
              </p>
              <Button onClick={() => navigate("/admin/rewards/new")}>
                Add Your First Reward
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <BottomNavigation activeTab="admin" />
    </div>
  );
}
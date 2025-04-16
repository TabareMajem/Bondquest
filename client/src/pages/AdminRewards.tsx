import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  Pencil,
  Trash2,
  ArrowLeft,
  Gift,
  Search,
  Eye,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { queryClient } from "@/lib/queryClient";
import { Reward } from "@shared/schema";
import { apiRequest } from "@/lib/apiClient";

const AdminRewards = () => {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: rewards, isLoading } = useQuery<Reward[]>({
    queryKey: ["/api/admin/rewards"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const handleDeleteReward = async () => {
    if (!selectedReward) return;

    try {
      await apiRequest(`/api/admin/rewards/${selectedReward.id}`, {
        method: "DELETE",
      });

      // Invalidate cache
      queryClient.invalidateQueries({ queryKey: ["/api/admin/rewards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      
      setShowDeleteDialog(false);
      setSelectedReward(null);
    } catch (error) {
      console.error("Failed to delete reward:", error);
    }
  };

  const filteredRewards = rewards?.filter((reward) =>
    reward.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (date: string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "digital":
        return "bg-blue-100 text-blue-800";
      case "physical":
        return "bg-green-100 text-green-800";
      case "discount":
        return "bg-yellow-100 text-yellow-800";
      case "points":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-purple-700 mb-2">Loading Rewards</h2>
            <p className="text-gray-500">Please wait while we fetch the rewards...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center mb-6">
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

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>All Rewards</CardTitle>
          <CardDescription>
            Manage all rewards available in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <div className="relative w-72">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search rewards..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button asChild>
              <Link href="/admin/rewards/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Reward
              </Link>
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Available From</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRewards && filteredRewards.length > 0 ? (
                  filteredRewards.map((reward) => (
                    <TableRow key={reward.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <div className="h-9 w-9 rounded-full bg-purple-100 p-2 mr-3 flex items-center justify-center">
                            <Gift className="h-4 w-4 text-purple-700" />
                          </div>
                          {reward.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(reward.type)}>
                          {reward.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{reward.value}</TableCell>
                      <TableCell>{formatDate(reward.availableFrom)}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            reward.active
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }
                        >
                          {reward.active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>{reward.quantity}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                          >
                            <Link href={`/admin/rewards/${reward.id}`}>
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                          >
                            <Link href={`/admin/rewards/${reward.id}/edit`}>
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedReward(reward);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-24">
                      {searchTerm ? (
                        <div>No rewards matching "{searchTerm}"</div>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <Gift className="h-10 w-10 mb-2" />
                          <p>No rewards found</p>
                          <p className="text-sm">Create your first reward to get started</p>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure you want to delete this reward?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the reward
              and remove it from the system.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteReward}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminRewards;
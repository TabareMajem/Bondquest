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
  Trophy,
  Search,
  Eye,
  Users,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { queryClient } from "@/lib/queryClient";
import { Competition } from "@shared/schema";
import { apiRequest } from "@/lib/apiClient";

const AdminCompetitions = () => {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: competitions, isLoading } = useQuery<Competition[]>({
    queryKey: ["/api/admin/competitions"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const handleDeleteCompetition = async () => {
    if (!selectedCompetition) return;

    try {
      await apiRequest(`/api/admin/competitions/${selectedCompetition.id}`, {
        method: "DELETE",
      });

      // Invalidate cache
      queryClient.invalidateQueries({ queryKey: ["/api/admin/competitions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      
      setShowDeleteDialog(false);
      setSelectedCompetition(null);
    } catch (error) {
      console.error("Failed to delete competition:", error);
    }
  };

  const filteredCompetitions = competitions?.filter((competition) =>
    competition.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (date: string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "upcoming":
        return "bg-blue-100 text-blue-800";
      case "active":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getParticipationPercentage = (competition: Competition) => {
    if (!competition.maxParticipants || competition.maxParticipants <= 0) return 100;
    const percentage = (competition.participantCount || 0) / competition.maxParticipants * 100;
    return Math.min(100, percentage);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-purple-700 mb-2">Loading Competitions</h2>
            <p className="text-gray-500">Please wait while we fetch the competitions...</p>
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
        <h1 className="text-3xl font-bold text-purple-800">Competitions Management</h1>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>All Competitions</CardTitle>
          <CardDescription>
            Manage all competitions in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <div className="relative w-72">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search competitions..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button asChild>
              <Link href="/admin/competitions/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create New Competition
              </Link>
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Entry Fee</TableHead>
                  <TableHead>Participation</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompetitions && filteredCompetitions.length > 0 ? (
                  filteredCompetitions.map((competition) => (
                    <TableRow key={competition.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <div className="h-9 w-9 rounded-full bg-purple-100 p-2 mr-3 flex items-center justify-center">
                            <Trophy className="h-4 w-4 text-purple-700" />
                          </div>
                          {competition.title}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(competition.status)}>
                          {competition.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(competition.startDate)}</TableCell>
                      <TableCell>{formatDate(competition.endDate)}</TableCell>
                      <TableCell>{competition.entryFee}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <div className="w-full max-w-32">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span>{competition.participantCount || 0}</span>
                              <span>
                                {competition.maxParticipants
                                  ? `${competition.participantCount || 0}/${competition.maxParticipants}`
                                  : "Unlimited"}
                              </span>
                            </div>
                            <Progress
                              value={getParticipationPercentage(competition)}
                              className="h-2"
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                          >
                            <Link href={`/admin/competitions/${competition.id}`}>
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                          >
                            <Link href={`/admin/competitions/${competition.id}/edit`}>
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedCompetition(competition);
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
                        <div>No competitions matching "{searchTerm}"</div>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <Trophy className="h-10 w-10 mb-2" />
                          <p>No competitions found</p>
                          <p className="text-sm">Create your first competition to get started</p>
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
            <DialogTitle>Are you sure you want to delete this competition?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the competition,
              including all entries and related data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteCompetition}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCompetitions;
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
  UserX, 
  UserCheck, 
  Mail, 
  Eye,
  Users,
  Filter
} from "lucide-react";
import { format } from "date-fns";
import { queryClient } from "@/lib/queryClient";
import { User, Couple } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/apiClient";
import PageLayout from "@/components/layout/PageLayout";

export default function AdminUsers() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all"); // "all", "single", "coupled"
  
  // Check if user has admin access - in a real app, you would check user.role or similar
  const isAdmin = user?.email === "admin@bondquest.com";
  
  // Redirect non-admin users
  React.useEffect(() => {
    if (!isAdmin) {
      navigate("/home");
    }
  }, [isAdmin, navigate]);

  // Fetch users
  const { data: users, isLoading, isError } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: isAdmin,
  });

  // Fetch couples to match with users
  const { data: couples } = useQuery<Couple[]>({
    queryKey: ["/api/admin/couples"],
    enabled: isAdmin,
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest(`/api/admin/users/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User Deleted",
        description: "The user has been successfully deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete the user. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to delete user:", error);
    },
  });

  // Ban/Unban user mutation
  const updateUserStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'active' | 'banned' }) => {
      return apiRequest(`/api/admin/users/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User Status Updated",
        description: "The user status has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update user status. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to update user status:", error);
    },
  });

  const handleDeleteUser = (id: number) => {
    if (window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      deleteUserMutation.mutate(id);
    }
  };

  const handleBanUser = (id: number) => {
    updateUserStatusMutation.mutate({ id, status: 'banned' });
  };

  const handleUnbanUser = (id: number) => {
    updateUserStatusMutation.mutate({ id, status: 'active' });
  };

  // Filter and search the users
  const filteredUsers = users?.filter((user) => {
    const matchesSearch = 
      searchTerm === "" || 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.displayName && user.displayName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (filter === "all") return matchesSearch;
    
    const hasCouple = couples?.some(couple => 
      couple.user1Id === user.id || couple.user2Id === user.id
    );
    
    if (filter === "coupled") return matchesSearch && hasCouple;
    if (filter === "single") return matchesSearch && !hasCouple;
    
    return matchesSearch;
  });

  if (!isAdmin) {
    return null; // Not rendering if not admin
  }

  return (
    <PageLayout activeTab="admin" pageTitle="User Management" maxWidth="full" className="px-2 md:px-6 lg:px-8">
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
          <h1 className="text-2xl md:text-3xl font-bold text-white">User Management</h1>
        </div>
      </div>
      
      {/* Search and filter bar */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by username, email, or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <div className="w-full md:w-[200px]">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger>
                  <div className="flex items-center">
                    <Filter className="h-4 w-4 mr-2" />
                    <span>Filter: {filter === "all" ? "All Users" : filter === "coupled" ? "Coupled" : "Single"}</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="coupled">Coupled Users</SelectItem>
                  <SelectItem value="single">Single Users</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* User table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl">Users</CardTitle>
            <Badge variant="outline" className="text-xs">
              {filteredUsers?.length || 0} users
            </Badge>
          </div>
          <CardDescription>
            Manage all registered users in the platform
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
                <p>Failed to load users</p>
                <Button
                  variant="outline"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] })}
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
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Partner</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers && filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => {
                      // Find couple info if exists
                      const coupleInfo = couples?.find(
                        couple => couple.user1Id === user.id || couple.user2Id === user.id
                      );
                      
                      // Determine partner ID if user has a partner
                      const partnerId = coupleInfo 
                        ? (coupleInfo.user1Id === user.id ? coupleInfo.user2Id : coupleInfo.user1Id)
                        : null;
                        
                      // Find partner user object
                      const partner = partnerId ? users?.find(u => u.id === partnerId) : null;
                      
                      return (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.id}</TableCell>
                          <TableCell>{user.username}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            {user.createdAt 
                              ? format(new Date(user.createdAt), "MMM d, yyyy")
                              : "N/A"
                            }
                          </TableCell>
                          <TableCell>
                            {user.status === "banned" ? (
                              <Badge variant="destructive">Banned</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-200">
                                Active
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {partner ? (
                              <span className="text-sm text-blue-600 hover:underline cursor-pointer">
                                {partner.username}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-500">No partner</span>
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
                                <DropdownMenuItem onClick={() => navigate(`/admin/users/${user.id}`)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate(`/admin/users/${user.id}/edit`)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => window.open(`mailto:${user.email}`)}>
                                  <Mail className="h-4 w-4 mr-2" />
                                  Send Email
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {user.status === "banned" ? (
                                  <DropdownMenuItem onClick={() => handleUnbanUser(user.id)}>
                                    <UserCheck className="h-4 w-4 mr-2" />
                                    Unban User
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onClick={() => handleBanUser(user.id)}>
                                    <UserX className="h-4 w-4 mr-2" />
                                    Ban User
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="text-red-600 focus:text-red-700"
                                >
                                  <Trash className="h-4 w-4 mr-2" />
                                  Delete User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-gray-500">
                        {searchTerm || filter !== "all" 
                          ? "No users found matching your search or filter criteria"
                          : "No users available"}
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
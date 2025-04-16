import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/apiClient";
import { insertCompetitionSchema, Competition, Reward } from "@shared/schema";

// Extend the schema for validation
const competitionFormSchema = insertCompetitionSchema.extend({
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  rewards: z.array(
    z.object({
      rewardId: z.number().min(1, "Please select a reward"),
      rankRequired: z.number().min(1, "Rank is required"),
    })
  ).optional(),
});

type CompetitionFormValues = z.infer<typeof competitionFormSchema>;

const AdminCompetitionForm = () => {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const isEditMode = !!id;
  const [selectedRewards, setSelectedRewards] = useState<
    { rewardId: number; rankRequired: number }[]
  >([]);

  // Fetch competition data if editing
  const { data: competition, isLoading: isLoadingCompetition } = useQuery<Competition>({
    queryKey: [`/api/admin/competitions/${id}`],
    enabled: isEditMode,
  });

  // Fetch competition rewards if editing
  const { data: competitionRewards, isLoading: isLoadingCompetitionRewards } = useQuery({
    queryKey: [`/api/admin/competitions/${id}/rewards`],
    enabled: isEditMode,
  });

  // Fetch subscription tiers for the required tier field
  const { data: subscriptionTiers, isLoading: isLoadingTiers } = useQuery({
    queryKey: ["/api/admin/subscription-tiers"],
  });

  // Fetch available rewards
  const { data: rewards, isLoading: isLoadingRewards } = useQuery<Reward[]>({
    queryKey: ["/api/admin/rewards", { activeOnly: true }],
  });

  const form = useForm<CompetitionFormValues>({
    resolver: zodResolver(competitionFormSchema),
    defaultValues: {
      title: "",
      description: "",
      imageUrl: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      entryFee: 0,
      maxParticipants: undefined,
      requiredTier: undefined,
      status: "upcoming",
      rewards: [],
    },
  });

  // Update form when competition data is loaded
  useEffect(() => {
    if (competition && isEditMode) {
      form.reset({
        title: competition.title,
        description: competition.description,
        imageUrl: competition.imageUrl || "",
        startDate: competition.startDate ? new Date(competition.startDate).toISOString().split("T")[0] : "",
        endDate: competition.endDate ? new Date(competition.endDate).toISOString().split("T")[0] : "",
        entryFee: competition.entryFee,
        maxParticipants: competition.maxParticipants || undefined,
        requiredTier: competition.requiredTier || undefined,
        status: competition.status,
        rewards: [],
      });
    }
  }, [competition, isEditMode, form]);

  // Update selected rewards when competition rewards data is loaded
  useEffect(() => {
    if (competitionRewards && isEditMode) {
      setSelectedRewards(
        competitionRewards.map((cr) => ({
          rewardId: cr.rewardId,
          rankRequired: cr.rankRequired,
        }))
      );
    }
  }, [competitionRewards, isEditMode]);

  const createCompetitionMutation = useMutation({
    mutationFn: async (values: CompetitionFormValues) => {
      // First create the competition
      const competition = await apiRequest("/api/admin/competitions", {
        method: "POST",
        body: JSON.stringify({
          title: values.title,
          description: values.description,
          imageUrl: values.imageUrl,
          startDate: values.startDate,
          endDate: values.endDate,
          entryFee: values.entryFee,
          maxParticipants: values.maxParticipants,
          requiredTier: values.requiredTier,
          status: values.status,
        }),
      });

      // Then add rewards if any are selected
      if (selectedRewards.length > 0 && competition.id) {
        for (const reward of selectedRewards) {
          await apiRequest("/api/admin/competition-rewards", {
            method: "POST",
            body: JSON.stringify({
              competitionId: competition.id,
              rewardId: reward.rewardId,
              rankRequired: reward.rankRequired,
            }),
          });
        }
      }

      return competition;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/competitions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      toast({
        title: "Competition Created",
        description: "The competition has been created successfully.",
      });
      navigate("/admin/competitions");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create the competition. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to create competition:", error);
    },
  });

  const updateCompetitionMutation = useMutation({
    mutationFn: async (values: CompetitionFormValues) => {
      // First update the competition
      const updatedCompetition = await apiRequest(`/api/admin/competitions/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: values.title,
          description: values.description,
          imageUrl: values.imageUrl,
          startDate: values.startDate,
          endDate: values.endDate,
          entryFee: values.entryFee,
          maxParticipants: values.maxParticipants,
          requiredTier: values.requiredTier,
          status: values.status,
        }),
      });

      // Handle rewards update (this is simplified - ideally you'd compare existing rewards and update only what changed)
      if (competitionRewards && competitionRewards.length > 0) {
        // Delete existing rewards
        for (const cr of competitionRewards) {
          await apiRequest(`/api/admin/competition-rewards/${cr.id}`, {
            method: "DELETE",
          });
        }
      }

      // Add the current rewards
      if (selectedRewards.length > 0) {
        for (const reward of selectedRewards) {
          await apiRequest("/api/admin/competition-rewards", {
            method: "POST",
            body: JSON.stringify({
              competitionId: parseInt(id),
              rewardId: reward.rewardId,
              rankRequired: reward.rankRequired,
            }),
          });
        }
      }

      return updatedCompetition;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/competitions/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/competitions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      toast({
        title: "Competition Updated",
        description: "The competition has been updated successfully.",
      });
      navigate("/admin/competitions");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update the competition. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to update competition:", error);
    },
  });

  const onSubmit = (values: CompetitionFormValues) => {
    // Add rewards to values for validation
    values.rewards = selectedRewards;

    isEditMode
      ? updateCompetitionMutation.mutate(values)
      : createCompetitionMutation.mutate(values);
  };

  const addReward = () => {
    setSelectedRewards([
      ...selectedRewards,
      { rewardId: 0, rankRequired: selectedRewards.length + 1 },
    ]);
  };

  const removeReward = (index: number) => {
    setSelectedRewards(selectedRewards.filter((_, i) => i !== index));
  };

  const updateReward = (index: number, field: "rewardId" | "rankRequired", value: number) => {
    const updatedRewards = [...selectedRewards];
    updatedRewards[index][field] = value;
    setSelectedRewards(updatedRewards);
  };

  if (
    (isEditMode && (isLoadingCompetition || isLoadingCompetitionRewards)) ||
    isLoadingTiers ||
    isLoadingRewards
  ) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        <span className="ml-2 text-xl">Loading...</span>
      </div>
    );
  }

  const availableRewards = rewards || [];

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/admin/competitions")}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Competitions
        </Button>
        <h1 className="text-3xl font-bold text-purple-800">
          {isEditMode ? "Edit Competition" : "Create New Competition"}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isEditMode ? "Edit Competition Details" : "New Competition Details"}</CardTitle>
          <CardDescription>
            {isEditMode
              ? "Update the details of the existing competition"
              : "Fill in the details to create a new competition"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Competition Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter competition title" {...field} />
                      </FormControl>
                      <FormDescription>
                        The name of the competition as it will appear to users
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="upcoming">Upcoming</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The current status of the competition
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormDescription>
                        When the competition starts
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormDescription>
                        When the competition ends
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="entryFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Entry Fee (Points)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter entry fee in points"
                          min={0}
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value, 10))
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        How many points couples need to pay to enter the competition
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxParticipants"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Participants</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Leave empty for unlimited"
                          min={0}
                          {...field}
                          value={field.value === undefined ? "" : field.value}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? undefined
                                : parseInt(e.target.value, 10)
                            )
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum number of couples that can participate (leave empty for unlimited)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter image URL" {...field} />
                      </FormControl>
                      <FormDescription>
                        URL to an image for the competition (optional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requiredTier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Required Subscription Tier</FormLabel>
                      <Select
                        onValueChange={(value) =>
                          field.onChange(value ? parseInt(value, 10) : undefined)
                        }
                        defaultValue={
                          field.value !== undefined
                            ? field.value.toString()
                            : undefined
                        }
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select required tier (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">No tier required</SelectItem>
                          {subscriptionTiers?.map((tier) => (
                            <SelectItem key={tier.id} value={tier.id.toString()}>
                              {tier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Subscription tier required to enter this competition (optional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter detailed description of the competition"
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Detailed description of the competition, rules, and judging criteria
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="rewards">
                  <AccordionTrigger>Competition Rewards</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-medium">
                          Add rewards for the competition winners
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addReward}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Reward
                        </Button>
                      </div>

                      {selectedRewards.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">
                          No rewards added yet. Click "Add Reward" to assign rewards to winners.
                        </div>
                      ) : (
                        selectedRewards.map((reward, index) => (
                          <div
                            key={index}
                            className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end border rounded-md p-3"
                          >
                            <div>
                              <FormLabel>Rank</FormLabel>
                              <Select
                                value={reward.rankRequired.toString()}
                                onValueChange={(value) =>
                                  updateReward(index, "rankRequired", parseInt(value, 10))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select rank" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1">1st Place</SelectItem>
                                  <SelectItem value="2">2nd Place</SelectItem>
                                  <SelectItem value="3">3rd Place</SelectItem>
                                  <SelectItem value="4">4th Place</SelectItem>
                                  <SelectItem value="5">5th Place</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <FormLabel>Reward</FormLabel>
                              <Select
                                value={reward.rewardId ? reward.rewardId.toString() : ""}
                                onValueChange={(value) =>
                                  updateReward(index, "rewardId", parseInt(value, 10))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select reward" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableRewards.length > 0 ? (
                                    availableRewards.map((r) => (
                                      <SelectItem key={r.id} value={r.id.toString()}>
                                        {r.name}
                                      </SelectItem>
                                    ))
                                  ) : (
                                    <SelectItem value="" disabled>
                                      No available rewards
                                    </SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                            </div>

                            <Button
                              type="button"
                              variant="ghost"
                              className="flex items-center text-destructive hover:text-destructive"
                              onClick={() => removeReward(index)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/admin/competitions")}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createCompetitionMutation.isPending || updateCompetitionMutation.isPending
                  }
                >
                  {(createCompetitionMutation.isPending || updateCompetitionMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isEditMode ? "Update Competition" : "Create Competition"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCompetitionForm;
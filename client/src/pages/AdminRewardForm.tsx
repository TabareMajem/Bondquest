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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/apiClient";
import { insertRewardSchema, Reward } from "@shared/schema";

// Extend the schema for validation
const rewardFormSchema = insertRewardSchema.extend({
  availableFrom: z.string().min(1, "Start date is required"),
  availableTo: z.string().min(1, "End date is required"),
});

type RewardFormValues = z.infer<typeof rewardFormSchema>;

const AdminRewardForm = () => {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const isEditMode = !!id;

  // Fetch reward data if editing
  const { data: reward, isLoading: isLoadingReward } = useQuery<Reward>({
    queryKey: [`/api/admin/rewards/${id}`],
    enabled: isEditMode,
  });

  // Fetch subscription tiers for the required tier field
  const { data: subscriptionTiers, isLoading: isLoadingTiers } = useQuery({
    queryKey: ["/api/admin/subscription-tiers"],
  });

  const form = useForm<RewardFormValues>({
    resolver: zodResolver(rewardFormSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "digital",
      value: 0,
      imageUrl: "",
      code: "",
      availableFrom: new Date().toISOString().split("T")[0],
      availableTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      quantity: 1,
      requiredTier: undefined,
      active: true,
    },
  });

  // Update form when reward data is loaded
  useEffect(() => {
    if (reward && isEditMode) {
      form.reset({
        name: reward.name,
        description: reward.description,
        type: reward.type,
        value: reward.value,
        imageUrl: reward.imageUrl || "",
        code: reward.code || "",
        availableFrom: reward.availableFrom ? new Date(reward.availableFrom).toISOString().split("T")[0] : "",
        availableTo: reward.availableTo ? new Date(reward.availableTo).toISOString().split("T")[0] : "",
        quantity: reward.quantity,
        requiredTier: reward.requiredTier || undefined,
        active: reward.active,
      });
    }
  }, [reward, isEditMode, form]);

  const createRewardMutation = useMutation({
    mutationFn: async (values: RewardFormValues) => {
      return apiRequest("/api/admin/rewards", {
        method: "POST",
        body: JSON.stringify(values),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/rewards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      toast({
        title: "Reward Created",
        description: "The reward has been created successfully.",
      });
      navigate("/admin/rewards");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create the reward. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to create reward:", error);
    },
  });

  const updateRewardMutation = useMutation({
    mutationFn: async (values: RewardFormValues) => {
      return apiRequest(`/api/admin/rewards/${id}`, {
        method: "PATCH",
        body: JSON.stringify(values),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/rewards/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/rewards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      toast({
        title: "Reward Updated",
        description: "The reward has been updated successfully.",
      });
      navigate("/admin/rewards");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update the reward. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to update reward:", error);
    },
  });

  const onSubmit = (values: RewardFormValues) => {
    isEditMode
      ? updateRewardMutation.mutate(values)
      : createRewardMutation.mutate(values);
  };

  if ((isEditMode && isLoadingReward) || isLoadingTiers) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        <span className="ml-2 text-xl">Loading...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/admin/rewards")}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Rewards
        </Button>
        <h1 className="text-3xl font-bold text-purple-800">
          {isEditMode ? "Edit Reward" : "Create New Reward"}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isEditMode ? "Edit Reward Details" : "New Reward Details"}</CardTitle>
          <CardDescription>
            {isEditMode
              ? "Update the details of the existing reward"
              : "Fill in the details to create a new reward"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reward Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter reward name" {...field} />
                      </FormControl>
                      <FormDescription>
                        The name of the reward as it will appear to users
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reward Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select reward type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="digital">Digital</SelectItem>
                          <SelectItem value="physical">Physical</SelectItem>
                          <SelectItem value="discount">Discount</SelectItem>
                          <SelectItem value="points">Points</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The type of reward determines how it's delivered
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Value</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter value"
                          min={0}
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value, 10))
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        The monetary or point value of the reward
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity Available</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter quantity"
                          min={0}
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value, 10))
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        How many of this reward are available
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="availableFrom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Available From</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormDescription>
                        When this reward becomes available
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="availableTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Available Until</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormDescription>
                        When this reward expires
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
                        URL to an image of the reward (optional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reward Code</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter reward code" {...field} />
                      </FormControl>
                      <FormDescription>
                        For digital rewards like discount codes (optional)
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
                        Subscription tier required to be eligible for this reward (optional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Active Status
                        </FormLabel>
                        <FormDescription>
                          Set whether this reward is currently active
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
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
                        placeholder="Enter detailed description of the reward"
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Detailed description of the reward and any terms/conditions
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/admin/rewards")}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createRewardMutation.isPending || updateRewardMutation.isPending
                  }
                >
                  {(createRewardMutation.isPending || updateRewardMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isEditMode ? "Update Reward" : "Create Reward"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminRewardForm;
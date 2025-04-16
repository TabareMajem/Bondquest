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
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/apiClient";
import { insertSubscriptionTierSchema, SubscriptionTier } from "@shared/schema";

// Extend schema for form validation
const subscriptionTierFormSchema = insertSubscriptionTierSchema
  .extend({
    price: z.string().min(1, "Price is required"),
    features: z.array(z.string()).optional(),
  });

type SubscriptionTierFormValues = z.infer<typeof subscriptionTierFormSchema>;

const AdminSubscriptionTierForm = () => {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const isEditMode = !!id;
  const [featureInputs, setFeatureInputs] = useState<string[]>([""]);

  // Fetch tier data if editing
  const { data: tier, isLoading } = useQuery<SubscriptionTier>({
    queryKey: [`/api/admin/subscription-tiers/${id}`],
    enabled: isEditMode,
  });

  const form = useForm<SubscriptionTierFormValues>({
    resolver: zodResolver(subscriptionTierFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      billingPeriod: "monthly",
      features: [""],
      active: true,
    },
  });

  // Update form when tier data is loaded
  useEffect(() => {
    if (tier && isEditMode) {
      form.reset({
        name: tier.name,
        description: tier.description,
        price: tier.price.toString(),
        billingPeriod: tier.billingPeriod,
        features: Array.isArray(tier.features) ? tier.features : [],
        active: tier.active,
      });
      setFeatureInputs(Array.isArray(tier.features) && tier.features.length > 0 
        ? tier.features 
        : [""]
      );
    }
  }, [tier, isEditMode, form]);

  const createTierMutation = useMutation({
    mutationFn: async (values: SubscriptionTierFormValues) => {
      // Filter out empty feature strings
      const cleanedFeatures = (values.features || []).filter(feature => feature.trim() !== "");
      
      return apiRequest("/api/admin/subscription-tiers", {
        method: "POST",
        body: JSON.stringify({
          ...values,
          price: parseFloat(values.price),
          features: cleanedFeatures.length > 0 ? cleanedFeatures : null,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-tiers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      toast({
        title: "Subscription Tier Created",
        description: "The subscription tier has been created successfully.",
      });
      navigate("/admin/subscriptions");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create the subscription tier. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to create subscription tier:", error);
    },
  });

  const updateTierMutation = useMutation({
    mutationFn: async (values: SubscriptionTierFormValues) => {
      // Filter out empty feature strings
      const cleanedFeatures = (values.features || []).filter(feature => feature.trim() !== "");
      
      return apiRequest(`/api/admin/subscription-tiers/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...values,
          price: parseFloat(values.price),
          features: cleanedFeatures.length > 0 ? cleanedFeatures : null,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/subscription-tiers/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-tiers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/dashboard"] });
      toast({
        title: "Subscription Tier Updated",
        description: "The subscription tier has been updated successfully.",
      });
      navigate("/admin/subscriptions");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update the subscription tier. Please try again.",
        variant: "destructive",
      });
      console.error("Failed to update subscription tier:", error);
    },
  });

  const onSubmit = (values: SubscriptionTierFormValues) => {
    // Update features with current input values
    values.features = featureInputs.filter(feature => feature.trim() !== "");
    
    isEditMode
      ? updateTierMutation.mutate(values)
      : createTierMutation.mutate(values);
  };

  const addFeatureInput = () => {
    setFeatureInputs([...featureInputs, ""]);
  };

  const removeFeatureInput = (index: number) => {
    const newFeatureInputs = [...featureInputs];
    newFeatureInputs.splice(index, 1);
    setFeatureInputs(newFeatureInputs.length > 0 ? newFeatureInputs : [""]);
  };

  const updateFeatureInput = (index: number, value: string) => {
    const newFeatureInputs = [...featureInputs];
    newFeatureInputs[index] = value;
    setFeatureInputs(newFeatureInputs);
    
    // Also update form value
    const currentFeatures = form.getValues().features || [];
    currentFeatures[index] = value;
    form.setValue('features', currentFeatures);
  };

  if (isEditMode && isLoading) {
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
          onClick={() => navigate("/admin/subscriptions")}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Subscriptions
        </Button>
        <h1 className="text-3xl font-bold text-purple-800">
          {isEditMode ? "Edit Subscription Tier" : "Create New Subscription Tier"}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isEditMode ? "Edit Subscription Tier" : "New Subscription Tier"}</CardTitle>
          <CardDescription>
            {isEditMode
              ? "Update the details of the existing subscription tier"
              : "Fill in the details to create a new subscription tier"}
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
                      <FormLabel>Tier Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter tier name" {...field} />
                      </FormControl>
                      <FormDescription>
                        The name of the subscription tier (e.g., Basic, Premium, Pro)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter price"
                          min="0"
                          step="0.01"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        The price of the subscription tier in USD
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="billingPeriod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Billing Period</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select billing period" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        How often the subscription is billed
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
                          Set whether this tier is currently available for purchase
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
                        placeholder="Enter a detailed description of the subscription tier"
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Detailed description of what's included in this subscription tier
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <FormLabel>Features</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addFeatureInput}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Feature
                  </Button>
                </div>
                <FormDescription>
                  List the features included in this subscription tier
                </FormDescription>

                <div className="space-y-3">
                  {featureInputs.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        placeholder={`Feature ${index + 1}`}
                        value={feature}
                        onChange={(e) => updateFeatureInput(index, e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeFeatureInput(index)}
                        disabled={featureInputs.length <= 1 && index === 0}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove</span>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/admin/subscriptions")}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createTierMutation.isPending || updateTierMutation.isPending
                  }
                >
                  {(createTierMutation.isPending || updateTierMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isEditMode ? "Update Tier" : "Create Tier"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSubscriptionTierForm;
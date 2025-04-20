import React, { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Gift, Medal, Calendar, MapPin } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format, addDays } from "date-fns";
import { useRewards } from "@/hooks/use-rewards";
import { useAuth } from "@/contexts/AuthContext";
import BottomNavigation from "@/components/layout/BottomNavigation";

// Form schema for awarding a reward
const awardFormSchema = z.object({
  coupleId: z.string({
    required_error: "Please select a couple",
  }),
  rewardId: z.string({
    required_error: "Please select a reward",
  }),
  competitionId: z.string().optional(),
  expirationDays: z.number().min(1, "Expiration must be at least 1 day").default(30),
  sendNotification: z.boolean().default(true),
  adminNotes: z.string().optional(),
});

export default function AdminAwardReward() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const preselectedRewardId = params.get("rewardId");
  
  const { user } = useAuth();
  
  // Get reward hooks
  const { 
    useRewardsQuery, 
    useAwardRewardMutation
  } = useRewards();
  
  // Check if user has admin access
  const isAdmin = user?.username === "admin";
  
  // Redirect non-admin users
  React.useEffect(() => {
    if (!isAdmin) {
      navigate("/home");
    }
  }, [isAdmin, navigate]);
  
  // Data for couples (should be replaced with an actual query)
  const [couples, setCouples] = useState([
    { id: "1", name: "John & Sarah" },
    { id: "2", name: "Michael & Jessica" },
    { id: "3", name: "David & Emily" },
  ]);
  
  // Fetch rewards
  const { data: rewards, isLoading: isRewardsLoading } = useRewardsQuery();
  
  // Award reward mutation
  const awardRewardMutation = useAwardRewardMutation();
  
  // Setup form
  const form = useForm<z.infer<typeof awardFormSchema>>({
    resolver: zodResolver(awardFormSchema),
    defaultValues: {
      rewardId: preselectedRewardId || "",
      expirationDays: 30,
      sendNotification: true,
    },
  });
  
  // Handle form submission
  const onSubmit = async (values: z.infer<typeof awardFormSchema>) => {
    awardRewardMutation.mutate({
      coupleId: parseInt(values.coupleId),
      rewardId: parseInt(values.rewardId),
      competitionId: values.competitionId ? parseInt(values.competitionId) : undefined
    }, {
      onSuccess: () => {
        // If sendNotification is true, we would trigger the notification here
        // For now, we just redirect back to the rewards page
        navigate("/admin/rewards");
      }
    });
  };
  
  // Get the selected reward
  const selectedRewardId = form.watch("rewardId");
  const selectedReward = rewards?.find(r => r.id.toString() === selectedRewardId);
  
  return (
    <div className="container mx-auto p-6 pb-24">
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
        <h1 className="text-3xl font-bold text-purple-800">Award Reward to Couple</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Award Form */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Award Reward</CardTitle>
              <CardDescription>
                Select a couple and reward to award
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Couple Selection */}
                  <FormField
                    control={form.control}
                    name="coupleId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Couple</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a couple" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {couples.map((couple) => (
                              <SelectItem key={couple.id} value={couple.id}>
                                {couple.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          The couple who will receive this reward
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Reward Selection */}
                  <FormField
                    control={form.control}
                    name="rewardId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reward</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          disabled={isRewardsLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={isRewardsLoading ? "Loading rewards..." : "Select a reward"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {rewards?.filter(r => r.active && r.quantity > 0).map((reward) => (
                              <SelectItem key={reward.id} value={reward.id.toString()}>
                                {reward.name} ({reward.quantity} available)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          The reward to award to the couple
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Competition ID (Optional) */}
                  <FormField
                    control={form.control}
                    name="competitionId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Competition (Optional)</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a competition" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">No Competition</SelectItem>
                            <SelectItem value="1">Weekly Trivia Challenge</SelectItem>
                            <SelectItem value="2">Monthly Date Night</SelectItem>
                            <SelectItem value="3">Valentine's Special</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Link this reward to a competition (optional)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Expiration Days */}
                  <FormField
                    control={form.control}
                    name="expirationDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expiration (Days)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={e => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Number of days until this reward expires
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Send Notification */}
                  <FormField
                    control={form.control}
                    name="sendNotification"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Send Notification</FormLabel>
                          <FormDescription>
                            Immediately notify the couple that they have won this reward.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  {/* Admin Notes */}
                  <FormField
                    control={form.control}
                    name="adminNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admin Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter any notes about this reward award"
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Internal notes about this reward award (not visible to users)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/admin/rewards")}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={awardRewardMutation.isPending || !form.formState.isValid}
                    >
                      {awardRewardMutation.isPending ? "Awarding..." : "Award Reward"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        
        {/* Reward Preview */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Reward Preview</CardTitle>
              <CardDescription>
                Information about the selected reward
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedReward ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Gift className="h-5 w-5 text-purple-500" />
                    <h3 className="text-lg font-semibold">{selectedReward.name}</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center">
                      <Badge>{selectedReward.type}</Badge>
                    </div>
                    <div className="flex items-center justify-end">
                      <Badge variant="outline" className="border-green-500 text-green-500">
                        {selectedReward.quantity} Available
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-500 mt-2">
                    {selectedReward.description}
                  </div>
                  
                  {selectedReward.locationRestricted && (
                    <div className="flex items-center gap-1 text-sm text-blue-500">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {selectedReward.eligibleLocations 
                          ? `Available in: ${selectedReward.eligibleLocations.join(", ")}` 
                          : "Location restricted"}
                      </span>
                    </div>
                  )}
                  
                  <div className="border-t pt-4 mt-4">
                    <div className="text-sm font-medium">Expiration Preview</div>
                    <div className="flex items-center gap-1 text-sm text-amber-500 mt-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Expires on {format(addDays(new Date(), form.watch("expirationDays")), "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <Gift className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Reward Selected</h3>
                  <p className="text-gray-500 text-sm">
                    Select a reward from the dropdown to see details
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-500">
              <p>Rewards are given to couples to acknowledge their achievements or to incentivize participation.</p>
              <ul className="list-disc ml-5 mt-2 space-y-1">
                <li>Physical rewards require shipping information</li>
                <li>Digital rewards are delivered electronically</li>
                <li>All rewards have an expiration date</li>
              </ul>
            </CardContent>
            <CardFooter className="border-t pt-3 text-xs text-gray-500">
              Notifications will be sent via email if enabled
            </CardFooter>
          </Card>
        </div>
      </div>
      
      <BottomNavigation activeTab="admin" />
    </div>
  );
}
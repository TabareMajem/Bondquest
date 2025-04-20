import {
  useMutation,
  useQuery,
  QueryClient,
  UseQueryResult,
  UseMutationResult
} from '@tanstack/react-query';
import { CoupleReward, Reward } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import {
  fetchRewards,
  fetchRewardById,
  createReward,
  updateReward,
  fetchCoupleRewards,
  fetchCoupleRewardById,
  awardReward,
  sendRewardNotification,
  markRewardAsShipped,
  markRewardAsDelivered,
  cancelReward,
  runRewardMaintenance
} from '@/api/rewardsApi';

// Re-export the API functions for direct use
export {
  fetchRewards,
  fetchRewardById,
  createReward,
  updateReward,
  fetchCoupleRewards,
  fetchCoupleRewardById,
  awardReward,
  sendRewardNotification,
  markRewardAsShipped,
  markRewardAsDelivered,
  cancelReward,
  runRewardMaintenance
};

// Types for enhanced reward with additional data
interface EnhancedCoupleReward extends CoupleReward {
  reward?: Reward;
  couple?: {
    id: number;
    userId1: number;
    userId2: number;
    user1?: {
      id: number;
      username: string;
      email?: string;
      displayName?: string;
    };
    user2?: {
      id: number;
      username: string;
      email?: string;
      displayName?: string;
    };
  };
}

// Filter types
interface RewardFilters {
  status?: string;
  location?: string;
}

export function useRewards() {
  const { toast } = useToast();

  // Query to get all rewards
  const useRewardsQuery = (): UseQueryResult<Reward[], Error> => 
    useQuery({
      queryKey: ['/api/admin/rewards'],
      queryFn: fetchRewards,
    });

  // Query to get a specific reward by ID
  const useRewardByIdQuery = (id: number): UseQueryResult<Reward, Error> => 
    useQuery({
      queryKey: ['/api/admin/rewards', id],
      queryFn: () => fetchRewardById(id),
      enabled: !!id,
    });

  // Mutation to create a new reward
  const useCreateRewardMutation = (): UseMutationResult<Reward, Error, Partial<Reward>> => 
    useMutation({
      mutationFn: (rewardData: Partial<Reward>) => createReward(rewardData),
      onSuccess: () => {
        toast({
          title: 'Success',
          description: 'Reward created successfully',
        });
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: `Failed to create reward: ${error.message}`,
          variant: 'destructive',
        });
      },
    });

  // Mutation to update an existing reward
  const useUpdateRewardMutation = (): UseMutationResult<
    Reward,
    Error,
    { id: number; data: Partial<Reward> }
  > => 
    useMutation({
      mutationFn: ({ id, data }) => updateReward(id, data),
      onSuccess: () => {
        toast({
          title: 'Success',
          description: 'Reward updated successfully',
        });
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: `Failed to update reward: ${error.message}`,
          variant: 'destructive',
        });
      },
    });

  // Query to get all couple rewards with optional filters
  const useCoupleRewardsQuery = (
    filters?: RewardFilters
  ): UseQueryResult<EnhancedCoupleReward[], Error> => 
    useQuery({
      queryKey: ['/api/admin/couple-rewards', filters],
      queryFn: () => fetchCoupleRewards(filters),
    });

  // Query to get a specific couple reward by ID
  const useCoupleRewardByIdQuery = (
    id: number
  ): UseQueryResult<EnhancedCoupleReward, Error> => 
    useQuery({
      queryKey: ['/api/admin/couple-rewards', id],
      queryFn: () => fetchCoupleRewardById(id),
      enabled: !!id,
    });

  // Mutation to award a reward to a couple
  const useAwardRewardMutation = (): UseMutationResult<
    CoupleReward,
    Error,
    { coupleId: number; rewardId: number; competitionId?: number }
  > => 
    useMutation({
      mutationFn: ({ coupleId, rewardId, competitionId }) =>
        awardReward(coupleId, rewardId, competitionId),
      onSuccess: () => {
        toast({
          title: 'Success',
          description: 'Reward awarded successfully',
        });
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: `Failed to award reward: ${error.message}`,
          variant: 'destructive',
        });
      },
    });

  // Mutation to send notification email for a reward
  const useSendRewardNotificationMutation = (): UseMutationResult<
    { success: boolean },
    Error,
    number
  > => 
    useMutation({
      mutationFn: (coupleRewardId: number) => sendRewardNotification(coupleRewardId),
      onSuccess: () => {
        toast({
          title: 'Success',
          description: 'Notification email sent successfully',
        });
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: `Failed to send notification: ${error.message}`,
          variant: 'destructive',
        });
      },
    });

  // Mutation to mark a reward as shipped
  const useMarkRewardAsShippedMutation = (): UseMutationResult<
    CoupleReward,
    Error,
    { coupleRewardId: number; trackingNumber: string; adminNotes?: string }
  > => 
    useMutation({
      mutationFn: ({ coupleRewardId, trackingNumber, adminNotes }) =>
        markRewardAsShipped(coupleRewardId, trackingNumber, adminNotes),
      onSuccess: () => {
        toast({
          title: 'Success',
          description: 'Reward marked as shipped',
        });
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: `Failed to mark reward as shipped: ${error.message}`,
          variant: 'destructive',
        });
      },
    });

  // Mutation to mark a reward as delivered
  const useMarkRewardAsDeliveredMutation = (): UseMutationResult<
    CoupleReward,
    Error,
    number
  > => 
    useMutation({
      mutationFn: (coupleRewardId: number) => markRewardAsDelivered(coupleRewardId),
      onSuccess: () => {
        toast({
          title: 'Success',
          description: 'Reward marked as delivered',
        });
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: `Failed to mark reward as delivered: ${error.message}`,
          variant: 'destructive',
        });
      },
    });

  // Mutation to cancel a reward
  const useCancelRewardMutation = (): UseMutationResult<
    CoupleReward,
    Error,
    { coupleRewardId: number; reason: string }
  > => 
    useMutation({
      mutationFn: ({ coupleRewardId, reason }) => cancelReward(coupleRewardId, reason),
      onSuccess: () => {
        toast({
          title: 'Success',
          description: 'Reward canceled successfully',
        });
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: `Failed to cancel reward: ${error.message}`,
          variant: 'destructive',
        });
      },
    });

  // Mutation to run reward maintenance tasks
  const useRunRewardMaintenanceMutation = (): UseMutationResult<
    {
      success: boolean;
      expiredCount: number;
      remindersSent: number;
      message: string;
    },
    Error,
    void
  > => 
    useMutation({
      mutationFn: runRewardMaintenance,
      onSuccess: (data) => {
        toast({
          title: 'Maintenance Complete',
          description: data.message,
        });
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: `Failed to run maintenance: ${error.message}`,
          variant: 'destructive',
        });
      },
    });

  return {
    // Queries
    useRewardsQuery,
    useRewardByIdQuery,
    useCoupleRewardsQuery,
    useCoupleRewardByIdQuery,
    
    // Mutations
    useCreateRewardMutation,
    useUpdateRewardMutation,
    useAwardRewardMutation,
    useSendRewardNotificationMutation,
    useMarkRewardAsShippedMutation,
    useMarkRewardAsDeliveredMutation,
    useCancelRewardMutation,
    useRunRewardMaintenanceMutation,
  };
}
import { apiRequest, queryClient } from '@/lib/queryClient';
import { CoupleReward, Reward } from '@shared/schema';

// Interface for filter parameters
interface RewardFilters {
  status?: string;
  location?: string;
}

// Interface for reward with additional data
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

// Get all rewards
export const fetchRewards = async (): Promise<Reward[]> => {
  const response = await apiRequest('GET', '/api/admin/rewards');
  return await response.json();
};

// Get reward by ID
export const fetchRewardById = async (id: number): Promise<Reward> => {
  const response = await apiRequest('GET', `/api/admin/rewards/${id}`);
  return await response.json();
};

// Create new reward
export const createReward = async (rewardData: Partial<Reward>): Promise<Reward> => {
  const response = await apiRequest('POST', '/api/admin/rewards', rewardData);
  
  // Invalidate rewards cache to refresh data
  queryClient.invalidateQueries({ queryKey: ['/api/admin/rewards'] });
  
  return await response.json();
};

// Update reward
export const updateReward = async (id: number, rewardData: Partial<Reward>): Promise<Reward> => {
  const response = await apiRequest('PATCH', `/api/admin/rewards/${id}`, rewardData);
  
  // Invalidate specific reward and rewards list cache
  queryClient.invalidateQueries({ queryKey: ['/api/admin/rewards'] });
  queryClient.invalidateQueries({ queryKey: ['/api/admin/rewards', id] });
  
  return await response.json();
};

// Get all couple rewards with optional filters
export const fetchCoupleRewards = async (filters?: RewardFilters): Promise<EnhancedCoupleReward[]> => {
  let url = '/api/admin/couple-rewards';
  
  // Add query parameters if filters provided
  if (filters) {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.location) params.append('location', filters.location);
    if (params.toString()) url += `?${params.toString()}`;
  }
  
  const response = await apiRequest('GET', url);
  return await response.json();
};

// Get couple reward by ID
export const fetchCoupleRewardById = async (id: number): Promise<EnhancedCoupleReward> => {
  const response = await apiRequest('GET', `/api/admin/couple-rewards/${id}`);
  return await response.json();
};

// Award a reward to a couple
export const awardReward = async (
  coupleId: number, 
  rewardId: number,
  competitionId?: number
): Promise<CoupleReward> => {
  const data = {
    coupleId,
    rewardId,
    competitionId
  };
  
  const response = await apiRequest('POST', '/api/admin/couple-rewards', data);
  
  // Invalidate couple rewards cache
  queryClient.invalidateQueries({ queryKey: ['/api/admin/couple-rewards'] });
  
  return await response.json();
};

// Send notification email for a reward
export const sendRewardNotification = async (coupleRewardId: number): Promise<{success: boolean}> => {
  const response = await apiRequest('POST', `/api/admin/couple-rewards/${coupleRewardId}/notify`);
  
  // Invalidate specific couple reward cache
  queryClient.invalidateQueries({ queryKey: ['/api/admin/couple-rewards', coupleRewardId] });
  
  return await response.json();
};

// Mark a reward as shipped
export const markRewardAsShipped = async (
  coupleRewardId: number,
  trackingNumber: string,
  adminNotes?: string
): Promise<CoupleReward> => {
  const data = {
    trackingNumber,
    adminNotes
  };
  
  const response = await apiRequest('POST', `/api/admin/couple-rewards/${coupleRewardId}/ship`, data);
  
  // Invalidate caches
  queryClient.invalidateQueries({ queryKey: ['/api/admin/couple-rewards'] });
  queryClient.invalidateQueries({ queryKey: ['/api/admin/couple-rewards', coupleRewardId] });
  
  return await response.json();
};

// Mark a reward as delivered
export const markRewardAsDelivered = async (coupleRewardId: number): Promise<CoupleReward> => {
  const response = await apiRequest('POST', `/api/admin/couple-rewards/${coupleRewardId}/deliver`);
  
  // Invalidate caches
  queryClient.invalidateQueries({ queryKey: ['/api/admin/couple-rewards'] });
  queryClient.invalidateQueries({ queryKey: ['/api/admin/couple-rewards', coupleRewardId] });
  
  return await response.json();
};

// Cancel a reward
export const cancelReward = async (coupleRewardId: number, reason: string): Promise<CoupleReward> => {
  const data = { reason };
  
  const response = await apiRequest('POST', `/api/admin/couple-rewards/${coupleRewardId}/cancel`, data);
  
  // Invalidate caches
  queryClient.invalidateQueries({ queryKey: ['/api/admin/couple-rewards'] });
  queryClient.invalidateQueries({ queryKey: ['/api/admin/couple-rewards', coupleRewardId] });
  
  return await response.json();
};

// Run reward maintenance tasks
export const runRewardMaintenance = async (): Promise<{
  success: boolean;
  expiredCount: number;
  remindersSent: number;
  message: string;
}> => {
  const response = await apiRequest('POST', '/api/admin/rewards/maintenance');
  
  // Invalidate couple rewards cache since status may have changed
  queryClient.invalidateQueries({ queryKey: ['/api/admin/couple-rewards'] });
  
  return await response.json();
};
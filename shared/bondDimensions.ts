/**
 * Bond Dimensions Schema
 * 
 * This file defines the core dimensions used to assess relationship strength
 * Each dimension contributes to the overall Bond Strength score
 */

export type BondDimension = {
  id: string;
  name: string;
  description: string;
  icon: string;
  weight: number; // Weight factor for contribution to overall score (1-10)
  color: string; // Color for visualization in radar charts and UI
};

export type BondAssessment = {
  dimensionId: string;
  score: number; // 1-10 scale
  userScore?: number; // User's self-assessment score
  partnerScore?: number; // Partner's score (if available)
  answeredAt: Date;
};

export type BondInsight = {
  id: string;
  dimensionId: string;
  title: string;
  content: string;
  actionItems: string[]; // Suggested activities or exercises
  targetScoreRange: [number, number]; // Min-max range for which this insight applies
  difficulty: 'easy' | 'medium' | 'challenging';
};

// Core Bond Dimensions
export const BOND_DIMENSIONS: BondDimension[] = [
  {
    id: 'communication',
    name: 'Communication',
    description: 'The degree of openness, clarity, and effectiveness in how you share thoughts, feelings, and information.',
    icon: 'MessageSquare',
    weight: 9,
    color: '#4F46E5', // Indigo
  },
  {
    id: 'trust',
    name: 'Trust',
    description: 'The level of confidence each partner has in the other\'s honesty, reliability, and loyalty.',
    icon: 'Shield',
    weight: 10,
    color: '#0EA5E9', // Sky blue
  },
  {
    id: 'emotional_intimacy',
    name: 'Emotional Intimacy',
    description: 'The closeness and warmth in sharing emotions, vulnerabilities, and supportive behaviors.',
    icon: 'Heart',
    weight: 8,
    color: '#EC4899', // Pink
  },
  {
    id: 'conflict_resolution',
    name: 'Conflict Resolution',
    description: 'The effectiveness with which you address disagreements and resolve conflicts respectfully.',
    icon: 'Handshake',
    weight: 8,
    color: '#F97316', // Orange
  },
  {
    id: 'physical_intimacy',
    name: 'Physical Intimacy',
    description: 'Satisfaction with physical affection, closeness, and sexual connection.',
    icon: 'Sparkles',
    weight: 7,
    color: '#D946EF', // Fuchsia
  },
  {
    id: 'shared_values',
    name: 'Shared Values & Goals',
    description: 'How aligned you are in core life values, goals, and future plans.',
    icon: 'Target',
    weight: 8,
    color: '#10B981', // Emerald
  },
  {
    id: 'fun_playfulness',
    name: 'Fun & Playfulness',
    description: 'The ability to enjoy light-hearted moments, shared humor, and playfulness together.',
    icon: 'Laugh',
    weight: 6,
    color: '#FBBF24', // Amber
  },
  {
    id: 'mutual_support',
    name: 'Mutual Support & Respect',
    description: 'The extent to which you provide support, affirmation, and respect for each other\'s individuality and efforts.',
    icon: 'Hands',
    weight: 9,
    color: '#6366F1', // Indigo
  },
  {
    id: 'independence_balance',
    name: 'Independence & Togetherness',
    description: 'The balance between healthy individual autonomy and shared couple time, ensuring personal growth alongside relationship nurturing.',
    icon: 'Unlink',
    weight: 7,
    color: '#8B5CF6', // Violet
  }
];

// Calculate total weight (used for normalizing scores)
export const TOTAL_WEIGHT = BOND_DIMENSIONS.reduce((sum, dimension) => sum + dimension.weight, 0);

/**
 * Calculate overall bond strength from individual dimension scores
 * Returns a value between 0-100
 */
export function calculateBondStrength(assessments: BondAssessment[]): number {
  // Create a map of dimension scores
  const dimensionScores = new Map<string, number>();
  assessments.forEach(assessment => {
    dimensionScores.set(assessment.dimensionId, assessment.score);
  });
  
  // Calculate weighted sum
  let weightedSum = 0;
  let appliedWeight = 0;
  
  BOND_DIMENSIONS.forEach(dimension => {
    const score = dimensionScores.get(dimension.id);
    if (score !== undefined) {
      weightedSum += score * dimension.weight;
      appliedWeight += dimension.weight;
    }
  });
  
  // If no scores available, return 0
  if (appliedWeight === 0) return 0;
  
  // Normalize to 0-100 scale
  return Math.round((weightedSum / appliedWeight) * 10);
}

/**
 * Get interpretation of bond strength score
 */
export function getBondStrengthInterpretation(score: number): string {
  if (score >= 90) return "Exceptional Bond";
  if (score >= 80) return "Very Strong Bond";
  if (score >= 70) return "Strong Bond";
  if (score >= 60) return "Healthy Bond";
  if (score >= 50) return "Developing Bond";
  if (score >= 40) return "Needs Attention";
  if (score >= 30) return "Needs Significant Work";
  return "Critical Attention Required";
}

/**
 * Identify the weakest dimension(s) that need most improvement
 */
export function getWeakestDimensions(assessments: BondAssessment[], limit: number = 3): string[] {
  const dimensionScores = new Map<string, number>();
  assessments.forEach(assessment => {
    dimensionScores.set(assessment.dimensionId, assessment.score);
  });
  
  return BOND_DIMENSIONS
    .filter(dimension => dimensionScores.has(dimension.id))
    .sort((a, b) => {
      const scoreA = dimensionScores.get(a.id) || 0;
      const scoreB = dimensionScores.get(b.id) || 0;
      return scoreA - scoreB; // Ascending order - lowest first
    })
    .slice(0, limit)
    .map(dimension => dimension.id);
}

/**
 * Identify the strongest dimension(s)
 */
export function getStrongestDimensions(assessments: BondAssessment[], limit: number = 3): string[] {
  const dimensionScores = new Map<string, number>();
  assessments.forEach(assessment => {
    dimensionScores.set(assessment.dimensionId, assessment.score);
  });
  
  return BOND_DIMENSIONS
    .filter(dimension => dimensionScores.has(dimension.id))
    .sort((a, b) => {
      const scoreA = dimensionScores.get(a.id) || 0;
      const scoreB = dimensionScores.get(b.id) || 0;
      return scoreB - scoreA; // Descending order - highest first
    })
    .slice(0, limit)
    .map(dimension => dimension.id);
}
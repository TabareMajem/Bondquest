// Bond Dimensions Framework - Core relationship dimensions for assessment
export interface BondDimension {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  questions: {
    text: string;
    type: 'likert' | 'frequency' | 'qualitative';
  }[];
}

export const bondDimensions: BondDimension[] = [
  {
    id: 'communication',
    name: 'Communication',
    description: 'The degree of openness, clarity, and effectiveness in how couples share thoughts, feelings, and information.',
    icon: 'message-square',
    color: '#4F46E5', // indigo
    questions: [
      { 
        text: 'How often do you feel heard and understood by your partner?',
        type: 'frequency'
      },
      { 
        text: 'Rate how comfortable you are discussing difficult topics.',
        type: 'likert'
      }
    ]
  },
  {
    id: 'trust',
    name: 'Trust',
    description: 'The level of confidence each partner has in the other\'s honesty, reliability, and loyalty.',
    icon: 'shield',
    color: '#10B981', // emerald
    questions: [
      { 
        text: 'How secure do you feel in your partner\'s commitment?',
        type: 'likert'
      },
      { 
        text: 'How often do you feel you can confide in your partner without judgment?',
        type: 'frequency'
      }
    ]
  },
  {
    id: 'emotional_intimacy',
    name: 'Emotional Intimacy',
    description: 'The closeness and warmth in sharing emotions, vulnerabilities, and supportive behaviors.',
    icon: 'heart',
    color: '#EC4899', // pink
    questions: [
      { 
        text: 'How emotionally close do you feel to your partner?',
        type: 'likert'
      },
      { 
        text: 'How often do you share your deepest feelings with your partner?',
        type: 'frequency'
      }
    ]
  },
  {
    id: 'conflict_resolution',
    name: 'Conflict Resolution',
    description: 'The effectiveness with which couples address disagreements and resolve conflicts respectfully.',
    icon: 'puzzle',
    color: '#F59E0B', // amber
    questions: [
      { 
        text: 'When conflicts arise, how satisfied are you with the resolution process?',
        type: 'likert'
      },
      { 
        text: 'How well do you and your partner manage disagreements without lingering resentment?',
        type: 'likert'
      }
    ]
  },
  {
    id: 'physical_intimacy',
    name: 'Physical Intimacy',
    description: 'Satisfaction with physical affection, closeness, and sexual connection.',
    icon: 'heart-hands',
    color: '#EF4444', // red
    questions: [
      { 
        text: 'How satisfied are you with the level of physical intimacy in your relationship?',
        type: 'likert'
      },
      { 
        text: 'Rate your comfort with initiating physical affection.',
        type: 'likert'
      }
    ]
  },
  {
    id: 'shared_values',
    name: 'Shared Values/Goals',
    description: 'How aligned the partners are in their core life values, goals, and future plans.',
    icon: 'target',
    color: '#8B5CF6', // violet
    questions: [
      { 
        text: 'How well do your long-term goals align with your partner\'s?',
        type: 'likert'
      },
      { 
        text: 'How often do you discuss your life plans together?',
        type: 'frequency'
      }
    ]
  },
  {
    id: 'fun_playfulness',
    name: 'Fun & Playfulness',
    description: 'The ability to enjoy light-hearted moments, shared humor, and playfulness together.',
    icon: 'party-popper',
    color: '#F97316', // orange
    questions: [
      { 
        text: 'How frequently do you engage in fun activities or playful banter with each other?',
        type: 'frequency'
      },
      { 
        text: 'Rate how much you enjoy your shared leisure time.',
        type: 'likert'
      }
    ]
  },
  {
    id: 'mutual_support',
    name: 'Mutual Support & Respect',
    description: 'The extent to which partners provide support, affirmation, and respect for each other\'s individuality and efforts.',
    icon: 'helping-hand',
    color: '#06B6D4', // cyan
    questions: [
      { 
        text: 'How valued do you feel by your partner on a daily basis?',
        type: 'likert'
      },
      { 
        text: 'Rate your partner\'s support during challenging times.',
        type: 'likert'
      }
    ]
  },
  {
    id: 'independence_balance',
    name: 'Independence & Togetherness Balance',
    description: 'The balance between healthy individual autonomy and shared couple time, ensuring personal growth alongside relationship nurturing.',
    icon: 'git-merge',
    color: '#14B8A6', // teal
    questions: [
      { 
        text: 'How well do you balance personal space and together time in your relationship?',
        type: 'likert'
      },
      { 
        text: 'How satisfied are you with your independence within the couple context?',
        type: 'likert'
      }
    ]
  },
  {
    id: 'overall_satisfaction',
    name: 'Overall Relationship Satisfaction',
    description: 'A global measure reflecting the couple\'s overall contentment, combining all aspects of their interaction into one score.',
    icon: 'smile',
    color: '#6366F1', // indigo
    questions: [
      { 
        text: 'Overall, how satisfied are you with your relationship?',
        type: 'likert'
      },
      { 
        text: 'Rate your general happiness as a couple.',
        type: 'likert'
      }
    ]
  }
];

// Bond dimensions display order for onboarding flow
export const bondDimensionOrder = [
  'communication',
  'trust',
  'emotional_intimacy',
  'conflict_resolution',
  'physical_intimacy',
  'shared_values',
  'fun_playfulness',
  'mutual_support',
  'independence_balance',
  'overall_satisfaction'
];

// Get the next dimension in the sequence
export function getNextDimension(currentDimension: string | null): string {
  if (!currentDimension) return bondDimensionOrder[0]; // Start with first dimension

  const currentIndex = bondDimensionOrder.indexOf(currentDimension);
  if (currentIndex === -1 || currentIndex === bondDimensionOrder.length - 1) {
    return 'wrap_up'; // Last dimension or not found
  }
  
  return bondDimensionOrder[currentIndex + 1];
}

// Get dimension by id
export function getDimensionById(id: string): BondDimension | undefined {
  return bondDimensions.find(dim => dim.id === id);
}

// Calculate overall bond strength from dimension scores
export function calculateBondStrength(dimensionScores: Record<string, number>): number {
  // Get the dimensions with scores
  const dimensionsWithScores = Object.keys(dimensionScores).length;
  
  if (dimensionsWithScores === 0) {
    return 0; // No scores available
  }
  
  // Calculate average score across all dimensions
  const totalScore = Object.values(dimensionScores).reduce((sum, score) => sum + score, 0);
  return Math.round((totalScore / dimensionsWithScores) * 10) / 10; // Round to 1 decimal place
}

// Generate insight for a specific dimension based on score
export function generateInsightForDimension(dimensionId: string, score: number): string {
  const dimension = getDimensionById(dimensionId);
  if (!dimension) return '';
  
  // Generate appropriate insight based on score range
  if (score >= 8) {
    return `Your ${dimension.name.toLowerCase()} is a real strength in your relationship. Keep nurturing this dimension as it builds a strong foundation.`;
  } else if (score >= 6) {
    return `Your ${dimension.name.toLowerCase()} is solid, though there may be specific areas where you can grow to strengthen your bond.`;
  } else if (score >= 4) {
    return `Your ${dimension.name.toLowerCase()} has both strengths and opportunities for growth. Small consistent efforts can lead to meaningful improvements.`;
  } else {
    return `Your ${dimension.name.toLowerCase()} may benefit from dedicated attention and open discussion with your partner to strengthen this area.`;
  }
}

// Format dimension data for radar chart display
export function getDimensionsForRadarChart(scores: Record<string, number>) {
  const dimensions = bondDimensions.filter(dim => 
    dim.id !== 'welcome' && dim.id !== 'wrap_up' && dim.id !== 'overall_satisfaction'
  );
  
  const labels = dimensions.map(dim => dim.name);
  const dataValues = dimensions.map(dim => scores[dim.id] || 0);
  
  return {
    labels,
    datasets: [
      {
        label: 'Bond Strength',
        data: dataValues,
        backgroundColor: 'rgba(138, 43, 226, 0.2)',
        borderColor: 'rgba(138, 43, 226, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(138, 43, 226, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(138, 43, 226, 1)',
      }
    ]
  };
}